"""
創建初始管理員賬號
"""
import asyncio
import sys
from pathlib import Path

# 添加項目根目錄到 Python 路徑
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select


async def create_admin_user():
    """創建初始管理員賬號"""
    print("開始創建管理員賬號...")

    async with AsyncSessionLocal() as session:
        try:
            # 檢查是否已存在管理員
            result = await session.execute(
                select(User).where(User.username == "admin")
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print("⚠️  管理員賬號已存在，跳過創建")
                print(f"   用戶名: {existing_user.username}")
                print(f"   郵箱: {existing_user.email}")
                return

            # 創建新管理員
            admin_user = User(
                username="admin",
                email="admin@lilihotel.com",
                password_hash=get_password_hash("admin123"),
                full_name="系統管理員",
                role="admin",
                is_active=True,
            )

            session.add(admin_user)
            await session.commit()

            print("✅ 管理員賬號創建成功！")
            print("\n登入資訊：")
            print("   用戶名: admin")
            print("   密碼: admin123")
            print("   郵箱: admin@lilihotel.com")
            print("\n⚠️  請在生產環境中立即修改密碼！")

        except Exception as e:
            await session.rollback()
            print(f"❌ 創建管理員賬號失敗: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(create_admin_user())
