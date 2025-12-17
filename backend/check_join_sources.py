import asyncio
from sqlalchemy import select, func

from app.database import AsyncSessionLocal
from app.models.member import Member

async def main():
    async with AsyncSessionLocal() as session:
        # 查詢所有不同的 join_source 值及其計數
        result = await session.execute(
            select(
                Member.join_source,
                func.count(Member.id).label('count')
            )
            .group_by(Member.join_source)
        )

        sources = result.all()

        print("=== join_source 值統計 ===\n")
        for source, count in sources:
            print(f"{source}: {count} 筆")

        print("\n=== 詳細會員列表 ===\n")
        result = await session.execute(
            select(Member.id, Member.name, Member.line_display_name, Member.join_source)
            .order_by(Member.id)
        )
        members = result.all()

        for member_id, name, line_display_name, join_source in members:
            print(f"ID {member_id}: {name or line_display_name} - join_source: {join_source}")

if __name__ == "__main__":
    asyncio.run(main())
