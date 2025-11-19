"""
初始化數據庫腳本
直接使用 SQLAlchemy 的 create_all() 方法創建所有表
"""
import asyncio
import sys
from pathlib import Path

# 添加項目根目錄到 Python 路徑
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, Base
from app.models import (
    User,
    Member,
    MemberTag,
    InteractionTag,
    MemberTagRelation,
    Campaign,
    MessageTemplate,
    TemplateCarouselItem,
    AutoResponse,
    AutoResponseKeyword,
    Message,
    TagTriggerLog,
)


async def init_database():
    """創建所有數據庫表"""
    print("開始初始化數據庫...")

    try:
        # 創建所有表
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        print("✅ 數據庫表創建成功！")
        print("\n已創建以下表：")
        for table_name in Base.metadata.tables.keys():
            print(f"  - {table_name}")

    except Exception as e:
        print(f"❌ 數據庫初始化失敗: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_database())
