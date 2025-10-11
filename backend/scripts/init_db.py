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


async def create_default_admin():
    """創建默認管理員賬戶"""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select

        # 檢查是否已存在管理員
        result = await session.execute(select(User).where(User.username == "admin"))
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            print("⚠️  管理員賬戶已存在，跳過創建")
            return

        # 創建管理員
        admin = User(
            username="admin",
            email="admin@lilihotel.com",
            password_hash=get_password_hash("admin123"),
            full_name="系統管理員",
            role=UserRole.ADMIN,
            is_active=True,
        )

        session.add(admin)
        await session.commit()
        print("✅ 管理員賬戶創建成功")
        print("   用戶名: admin")
        print("   密碼: admin123")
        print("   ⚠️  請立即修改默認密碼！")


async def main():
    """主函數"""
    print("🚀 開始初始化資料庫...")

    # 創建表
    await create_tables()

    # 創建默認管理員
    await create_default_admin()

    print("✨ 資料庫初始化完成！")


if __name__ == "__main__":
    asyncio.run(main())
