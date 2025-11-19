#!/usr/bin/env python3
"""
建立測試用戶帳號（用於登入系統）
"""

import asyncio
from datetime import datetime
from sqlalchemy import select
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.database import AsyncSessionLocal

async def add_test_user():
    async with AsyncSessionLocal() as db:
        try:
            # 檢查是否已存在
            result = await db.execute(
                select(User).where(User.email == 'admin@test.com')
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f'ℹ️  帳號已存在: {existing.email}')
                print(f'   ID: {existing.id}')
                print(f'   Username: {existing.username}')
                print(f'   Full Name: {existing.full_name}')
                print(f'   Role: {existing.role}')
                print(f'   Active: {existing.is_active}')
            else:
                # 建立測試帳號
                user = User(
                    username='admin@test.com',  # 使用 email 作為 username
                    email='admin@test.com',
                    password_hash=get_password_hash('Admin@123'),
                    full_name='測試管理員',
                    role=UserRole.ADMIN,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)

                print('✅ 測試帳號建立成功!')
                print(f'   Username: {user.username}')
                print(f'   Email: {user.email}')
                print(f'   密碼: Admin@123')
                print(f'   Full Name: {user.full_name}')
                print(f'   Role: {user.role}')
                print(f'   ID: {user.id}')

            # 列出所有用戶
            print('\n📋 資料庫中所有用戶帳號:')
            result = await db.execute(select(User))
            all_users = result.scalars().all()
            for u in all_users:
                status = '✅' if u.is_active else '❌'
                print(f'   {status} [{u.id}] {u.email} ({u.full_name}) - {u.role}')

        except Exception as e:
            await db.rollback()
            print(f'❌ 錯誤: {e}')
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(add_test_user())
