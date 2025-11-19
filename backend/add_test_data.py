import asyncio
from datetime import datetime
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.member import Member
from app.models.tag import MemberTag, InteractionTag
from app.models.member_interaction_record import MemberInteractionRecord

SAMPLE_MEMBERS = [
    {
        "line_uid": "U0000000000000000000000000000001",
        "line_name": "User Name",
        "name": "Real Name",
        "phone": "0987654321",
        "email": "chox.ox@gmail.com",
        "avatar": "https://picsum.photos/seed/member1/200/200",
        "created_at": datetime(2025, 10, 2, 10, 40, 0),
        "last_interaction_at": datetime(2025, 10, 2, 18, 40, 0),
        "member_tags": ["VIP", "消費力高", "忠實顧客"],
        "interaction_tags": ["優惠活動", "伴手禮", "KOL"],
    },
    {
        "line_uid": "U0000000000000000000000000000002",
        "line_name": "JaneDoe88",
        "name": "Jane Doe",
        "phone": "0912345678",
        "email": "janedoe88@example.com",
        "avatar": "https://picsum.photos/seed/member2/200/200",
        "created_at": datetime(2025, 10, 3, 10, 0, 0),
        "last_interaction_at": datetime(2025, 10, 3, 10, 30, 0),
        "member_tags": ["新會員", "潛力客戶"],
        "interaction_tags": ["夏季特惠", "手工皂", "BeautyBlogger", "美容保養"],
    },
    {
        "line_uid": "U0000000000000000000000000000003",
        "line_name": "ChocLover",
        "name": "John Smith",
        "phone": "0923456789",
        "email": "john.smith@example.com",
        "avatar": "https://picsum.photos/seed/member3/200/200",
        "created_at": datetime(2025, 10, 4, 14, 20, 0),
        "last_interaction_at": datetime(2025, 10, 4, 16, 45, 0),
        "member_tags": ["常客", "送禮需求", "節日購物"],
        "interaction_tags": ["聖誕促銷", "巧克力禮盒", "Foodie"],
    },
]

async def main():
    async with AsyncSessionLocal() as session:
        try:
            for data in SAMPLE_MEMBERS:
                # 檢查會員是否已存在
                result = await session.execute(
                    select(Member).where(Member.line_uid == data["line_uid"])
                )
                member = result.scalar_one_or_none()

                if not member:
                    # 創建新會員
                    member = Member(
                        line_uid=data["line_uid"],
                        line_name=data["line_name"],
                        name=data["name"],
                        phone=data["phone"],
                        email=data["email"],
                        line_avatar=data["avatar"],
                        join_source="LINE",
                        created_at=data["created_at"],
                        updated_at=data["created_at"],
                        last_interaction_at=data["last_interaction_at"],
                    )
                    session.add(member)
                    await session.flush()  # 取得 member.id
                    print(f"✅ 創建會員: {member.line_name} ({member.line_uid})")
                else:
                    print(f"ℹ️  會員已存在: {member.line_name} ({member.line_uid})")

                # 添加會員標籤
                for tag_name in data["member_tags"]:
                    result = await session.execute(
                        select(MemberTag).where(
                            (MemberTag.member_id == member.id) &
                            (MemberTag.tag_name == tag_name)
                        )
                    )
                    existing_tag = result.scalar_one_or_none()

                    if not existing_tag:
                        member_tag = MemberTag(
                            member_id=member.id,
                            tag_name=tag_name,
                            tag_source="CRM"
                        )
                        session.add(member_tag)
                        print(f"  📌 添加會員標籤: {tag_name}")

                # 添加互動標籤
                for tag_name in data["interaction_tags"]:
                    result = await session.execute(
                        select(InteractionTag).where(
                            InteractionTag.tag_name == tag_name
                        )
                    )
                    interaction_tag = result.scalar_one_or_none()

                    if not interaction_tag:
                        interaction_tag = InteractionTag(
                            tag_name=tag_name,
                            tag_source="訊息模板"
                        )
                        session.add(interaction_tag)
                        await session.flush()
                        print(f"  🏷️  創建互動標籤: {tag_name}")

                    # 建立互動紀錄
                    result = await session.execute(
                        select(MemberInteractionRecord).where(
                            (MemberInteractionRecord.member_id == member.id) &
                            (MemberInteractionRecord.tag_id == interaction_tag.id)
                        )
                    )
                    existing_record = result.scalar_one_or_none()

                    if not existing_record:
                        interaction_record = MemberInteractionRecord(
                            member_id=member.id,
                            tag_id=interaction_tag.id,
                        )
                        session.add(interaction_record)
                        print(f"  🔗 創建互動紀錄: {tag_name}")

            # 提交所有更改
            await session.commit()
            print("\n✅ 測試數據添加成功！")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ 錯誤: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(main())
