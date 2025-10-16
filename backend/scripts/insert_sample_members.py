"""
插入測試會員資料
"""
import sys
from pathlib import Path

# 添加專案根目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
from datetime import datetime, date
from sqlalchemy import select
from app.models.member import Member, Gender, MemberSource
from app.models.tag import MemberTag, MemberTagRelation, TagType, TagSource
from app.database import AsyncSessionLocal


async def create_sample_members():
    """創建範例會員"""
    async with AsyncSessionLocal() as session:
        # 檢查是否已有會員
        result = await session.execute(select(Member))
        existing_members = result.scalars().all()

        if len(existing_members) >= 2:
            print(f"資料庫已有 {len(existing_members)} 筆會員資料，跳過插入")
            return

        # 創建第一位會員：王小明
        member1 = Member(
            line_uid="U1234567890abcdef",
            line_display_name="王小明",
            line_picture_url="https://i.pravatar.cc/300?img=12",
            first_name="小明",
            last_name="王",
            gender=Gender.MALE,
            birthday=date(1990, 5, 15),
            email="wang.xiaoming@example.com",
            phone="0912-345-678",
            id_number="A123456789",
            source=MemberSource.LINE,
            accept_marketing=True,
            notes="VIP 會員，常住客人",
            last_interaction_at=datetime(2025, 10, 10, 14, 30, 0),
            created_at=datetime(2024, 1, 15, 10, 0, 0),
            updated_at=datetime(2025, 10, 10, 14, 30, 0),
        )

        # 創建第二位會員：李美麗
        member2 = Member(
            line_uid="U0987654321fedcba",
            line_display_name="李美麗",
            line_picture_url="https://i.pravatar.cc/300?img=47",
            first_name="美麗",
            last_name="李",
            gender=Gender.FEMALE,
            birthday=date(1985, 8, 20),
            email="li.meili@example.com",
            phone="0923-456-789",
            id_number="B987654321",
            source=MemberSource.LINE,
            accept_marketing=True,
            notes="喜歡海景房，對早餐有特殊要求",
            last_interaction_at=datetime(2025, 10, 12, 9, 15, 0),
            created_at=datetime(2024, 3, 20, 15, 30, 0),
            updated_at=datetime(2025, 10, 12, 9, 15, 0),
        )

        session.add(member1)
        session.add(member2)

        try:
            await session.commit()
            print("✅ 成功插入 2 筆會員資料")
            print(f"  - 會員1: {member1.last_name}{member1.first_name} (ID: {member1.id})")
            print(f"  - 會員2: {member2.last_name}{member2.first_name} (ID: {member2.id})")

            # 創建一些標籤
            await create_sample_tags(session, member1.id, member2.id)

        except Exception as e:
            await session.rollback()
            print(f"❌ 插入資料失敗: {e}")
            raise


async def create_sample_tags(session, member1_id: int, member2_id: int):
    """創建範例標籤"""
    # 檢查是否已有標籤
    result = await session.execute(select(MemberTag))
    existing_tags = result.scalars().all()

    if len(existing_tags) > 0:
        print(f"資料庫已有 {len(existing_tags)} 個標籤")
        # 使用現有標籤
        tags = existing_tags[:3]
    else:
        # 創建新標籤
        tag1 = MemberTag(
            name="VIP",
            type=TagType.MEMBER,
            source=TagSource.MANUAL,
            description="VIP 會員",
            member_count=0,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        tag2 = MemberTag(
            name="常客",
            type=TagType.MEMBER,
            source=TagSource.MANUAL,
            description="經常光顧的客人",
            member_count=0,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        tag3 = MemberTag(
            name="商務客",
            type=TagType.MEMBER,
            source=TagSource.MANUAL,
            description="商務出差客人",
            member_count=0,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        session.add(tag1)
        session.add(tag2)
        session.add(tag3)
        await session.flush()

        tags = [tag1, tag2, tag3]
        print(f"✅ 成功創建 {len(tags)} 個標籤")

    # 為會員1添加標籤（VIP + 常客）
    relation1_1 = MemberTagRelation(
        member_id=member1_id,
        tag_id=tags[0].id,
        tag_type=TagType.MEMBER,
        tagged_at=datetime.now(),
    )
    relation1_2 = MemberTagRelation(
        member_id=member1_id,
        tag_id=tags[1].id,
        tag_type=TagType.MEMBER,
        tagged_at=datetime.now(),
    )

    # 為會員2添加標籤（常客 + 商務客）
    relation2_1 = MemberTagRelation(
        member_id=member2_id,
        tag_id=tags[1].id,
        tag_type=TagType.MEMBER,
        tagged_at=datetime.now(),
    )
    relation2_2 = MemberTagRelation(
        member_id=member2_id,
        tag_id=tags[2].id,
        tag_type=TagType.MEMBER,
        tagged_at=datetime.now(),
    )

    session.add_all([relation1_1, relation1_2, relation2_1, relation2_2])
    await session.commit()
    print("✅ 成功為會員添加標籤")


async def main():
    """主函數"""
    print("=" * 50)
    print("開始插入測試會員資料...")
    print("=" * 50)

    try:
        await create_sample_members()
        print("\n" + "=" * 50)
        print("資料插入完成！")
        print("=" * 50)
    except Exception as e:
        print(f"\n執行失敗: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
