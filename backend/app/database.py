"""
資料庫連接管理
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import exc as sqlalchemy_exc, event
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# 創建非同步引擎
# SQLite 不支持 pool_size 和 max_overflow 參數
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        echo=settings.DEBUG,
        pool_pre_ping=True,
    )

# 固定每條 DB 連線的 session 時區為 +08:00（台北），不依賴 MySQL 主機/session 預設時區。
# 確保任何環境（dev / staging / Cloud SQL 預設 UTC）NOW()、func.now() 的寫入與讀取
# 都是台北牆鐘時間，符合「DB naive datetime = 台北時間」慣例。
# async engine 的 connect 事件需掛在 sync_engine 上才會生效。
# sqlite（測試）不支援 SET time_zone，故僅對非 sqlite 註冊。
if not settings.DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine.sync_engine, "connect")
    def _set_session_timezone(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("SET time_zone = '+08:00'")
        finally:
            cursor.close()


# 創建非同步 session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# 創建基礎模型類
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    獲取資料庫 session（依賴注入）

    Yields:
        AsyncSession: 資料庫異步會話

    Raises:
        HTTPException: 資料庫操作失敗時
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except sqlalchemy_exc.IntegrityError as e:
            await session.rollback()
            logger.error(f"Database integrity error: {e}", exc_info=True)
            raise  # 讓上層處理具體的完整性錯誤
        except sqlalchemy_exc.OperationalError as e:
            await session.rollback()
            logger.error(f"Database operational error (connection/timeout): {e}", exc_info=True)
            raise  # 資料庫連接或超時錯誤
        except sqlalchemy_exc.DataError as e:
            await session.rollback()
            logger.error(f"Database data error (invalid data type): {e}", exc_info=True)
            raise
        except sqlalchemy_exc.DBAPIError as e:
            await session.rollback()
            logger.error(f"Database API error: {e}", exc_info=True)
            raise
        except Exception as e:
            await session.rollback()
            logger.exception(f"Unexpected database error: {e}")
            raise
        finally:
            await session.close()


async def init_db():
    """初始化資料庫"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """關閉資料庫連接"""
    await engine.dispose()
