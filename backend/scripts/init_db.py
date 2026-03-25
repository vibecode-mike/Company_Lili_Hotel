"""
初始化資料庫腳本
"""
import asyncio
import sys
from pathlib import Path

# 添加項目根目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine, Base, AsyncSessionLocal
from app.models import *
from app.models.user import User, UserRole
from app.core.security import get_password_hash


async def create_tables():
    """創建所有表"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ 資料庫表創建成功")


async def ensure_user(session: AsyncSession, username: str, email: str, password: str):
    from sqlalchemy import select

    result = await session.execute(select(User).where(User.username == username))
    existing = result.scalar_one_or_none()
    if existing:
        print(f"⚠️  帳號已存在，跳過: {username} ({existing.email})")
        return

    admin = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        full_name="系統管理員",
        role=UserRole.ADMIN,
        is_active=True,
    )
    session.add(admin)
    await session.commit()
    print(f"✅ 建立帳號成功: {username} / {password}")


async def create_default_admin():
    """創建默認管理員賬戶以及外部登入帳號"""
    async with AsyncSessionLocal() as session:
        await ensure_user(session, "admin@lilihotel.com", "admin@lilihotel.com", "StarBit!23")


async def main():
    """主函數"""
    print("🚀 開始初始化資料庫...")

    # 創建表
    await create_tables()

    # 創建默認管理員
    await create_default_admin()

    print("✨ 資料庫初始化完成！")

    # 關閉引擎連線，避免 Event loop is closed 警告
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
