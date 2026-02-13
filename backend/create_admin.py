"""
創建初始管理員賬號
"""
import asyncio
import os
import sys
from pathlib import Path

# 添加項目根目錄到 Python 路徑
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select


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


async def main():
    admin_pw = os.getenv("INIT_ADMIN_PASSWORD")
    if not admin_pw:
        raise RuntimeError("Set INIT_ADMIN_PASSWORD env var before running init script")
    print("開始創建預設管理員...")
    await ensure_user("admin", "admin@lilihotel.com", admin_pw)
    print("完成。")


if __name__ == "__main__":
    asyncio.run(main())
