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
from sqlalchemy import select, delete


async def ensure_user(username: str, email: str, password: str):
    """若不存在則建立指定用戶；已存在則略過"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == username))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"⚠️  帳號已存在，跳過: {username} ({existing.email})")
            return

        user = User(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            full_name="系統管理員",
            role="admin",
            is_active=True,
        )
        session.add(user)
        await session.commit()
        print(f"✅ 建立帳號成功: {username} / {password} / {email}")


async def migrate_admin():
    """將現有 admin 帳號更新為新帳密，並刪除 tycg-admin"""
    async with AsyncSessionLocal() as session:
        # 刪除 tycg-admin
        result = await session.execute(select(User).where(User.username == "tycg-admin"))
        tycg = result.scalar_one_or_none()
        if tycg:
            await session.delete(tycg)
            print("🗑️  已刪除 tycg-admin 帳號")

        # 更新現有 admin 帳號
        result = await session.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()
        if admin:
            admin.username = "admin@lilihotel.com"
            admin.email = "admin@lilihotel.com"
            admin.password_hash = get_password_hash("StarBit!23")
            await session.commit()
            print("✅ 已更新 admin → admin@lilihotel.com / StarBit!23")
        else:
            # 若不存在則建立
            await session.commit()  # commit tycg deletion first
            await ensure_user("admin@lilihotel.com", "admin@lilihotel.com", "StarBit!23")


async def main():
    print("開始更新管理員帳號...")
    await migrate_admin()
    print("完成。")


if __name__ == "__main__":
    asyncio.run(main())
