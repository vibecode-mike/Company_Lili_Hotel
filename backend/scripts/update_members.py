"""
更新現有會員為完整的測試資料
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
from datetime import datetime, date
from sqlalchemy import select, update
from app.models.member import Member, Gender, MemberSource
from app.database import AsyncSessionLocal


async def update_members():
    """更新現有會員"""
    async with AsyncSessionLocal() as session:
        # 更新會員 ID=1 為王小明
        result = await session.execute(select(Member).where(Member.id == 1))
        member1 = result.scalar_one_or_none()

        if member1:
            member1.line_uid = "U1234567890abcdef"
            member1.line_display_name = "王小明"
            member1.line_picture_url = "https://i.pravatar.cc/300?img=12"
            member1.first_name = "小明"
            member1.last_name = "王"
            member1.gender = Gender.MALE
            member1.birthday = date(1990, 5, 15)
            member1.email = "wang.xiaoming@example.com"
            member1.phone = "0912-345-678"
            member1.id_number = "A123456789"
            member1.source = MemberSource.LINE
            member1.accept_marketing = True
            member1.notes = "VIP 會員，常住客人"
            member1.last_interaction_at = datetime(2025, 10, 10, 14, 30, 0)
            member1.updated_at = datetime.now()
            print(f"✅ 更新會員1: {member1.last_name}{member1.first_name}")

        # 更新會員 ID=3 為李美麗
        result = await session.execute(select(Member).where(Member.id == 3))
        member2 = result.scalar_one_or_none()

        if member2:
            member2.line_uid = "U0987654321fedcba"
            member2.line_display_name = "李美麗"
            member2.line_picture_url = "https://i.pravatar.cc/300?img=47"
            member2.first_name = "美麗"
            member2.last_name = "李"
            member2.gender = Gender.FEMALE
            member2.birthday = date(1985, 8, 20)
            member2.email = "li.meili@example.com"
            member2.phone = "0923-456-789"
            member2.id_number = "B987654321"
            member2.source = MemberSource.LINE
            member2.accept_marketing = True
            member2.notes = "喜歡海景房，對早餐有特殊要求"
            member2.last_interaction_at = datetime(2025, 10, 12, 9, 15, 0)
            member2.updated_at = datetime.now()
            print(f"✅ 更新會員2: {member2.last_name}{member2.first_name}")

        await session.commit()
        print("\n✅ 所有會員資料更新完成！")


async def main():
    print("=" * 50)
    print("開始更新會員資料...")
    print("=" * 50)

    try:
        await update_members()
        print("=" * 50)
    except Exception as e:
        print(f"❌ 更新失敗: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
