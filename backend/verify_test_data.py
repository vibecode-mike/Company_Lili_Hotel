import asyncio
from sqlalchemy import select, func

from app.database import AsyncSessionLocal
from app.models.member import Member
from app.models.tag import MemberTag, InteractionTag
from app.models.member_interaction_record import MemberInteractionRecord

async def main():
    async with AsyncSessionLocal() as session:
        # 檢查會員數量
        result = await session.execute(select(func.count(Member.id)))
        member_count = result.scalar()
        print(f"會員總數: {member_count}")

        # 列出所有會員
        result = await session.execute(select(Member))
        members = result.scalars().all()

        print("\n=== 會員列表 ===")
        for member in members:
            print(f"\nID: {member.id}")
            print(f"LINE UID: {member.line_uid}")
            print(f"LINE Name: {member.line_name}")
            print(f"Name: {member.name}")
            print(f"Email: {member.email}")
            print(f"Phone: {member.phone}")
            print(f"Created: {member.created_at}")

            # 會員標籤
            result = await session.execute(
                select(MemberTag).where(MemberTag.member_id == member.id)
            )
            member_tags = result.scalars().all()
            if member_tags:
                print(f"會員標籤: {', '.join([t.tag_name for t in member_tags])}")

            # 互動記錄
            result = await session.execute(
                select(MemberInteractionRecord, InteractionTag)
                .join(InteractionTag, MemberInteractionRecord.tag_id == InteractionTag.id)
                .where(MemberInteractionRecord.member_id == member.id)
            )
            interactions = result.all()
            if interactions:
                interaction_tags = [t.tag_name for _, t in interactions]
                print(f"互動標籤: {', '.join(interaction_tags)}")

if __name__ == "__main__":
    asyncio.run(main())
