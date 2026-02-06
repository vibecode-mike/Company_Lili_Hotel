import asyncio
from sqlalchemy import select, update

from app.database import AsyncSessionLocal
from app.models.member import Member

async def main():
    async with AsyncSessionLocal() as session:
        try:
            # 查詢需要更新的會員
            result = await session.execute(
                select(Member).where(Member.join_source == 'line_official')
            )
            members_to_update = result.scalars().all()

            print(f"發現 {len(members_to_update)} 筆需要更新的會員：")
            for member in members_to_update:
                print(f"  ID {member.id}: {member.name or member.line_display_name}")

            if len(members_to_update) == 0:
                print("\n✅ 沒有需要更新的數據")
                return

            # 執行更新
            await session.execute(
                update(Member)
                .where(Member.join_source == 'line_official')
                .values(join_source='LINE')
            )

            await session.commit()

            print(f"\n✅ 成功更新 {len(members_to_update)} 筆會員的 join_source 從 'line_official' 改為 'LINE'")

            # 驗證更新結果
            result = await session.execute(
                select(Member.join_source, Member.id, Member.name, Member.line_display_name)
                .order_by(Member.id)
            )
            all_members = result.all()

            print("\n=== 更新後的會員列表 ===")
            for join_source, member_id, name, line_display_name in all_members:
                print(f"ID {member_id}: {name or line_display_name} - join_source: {join_source}")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ 更新失敗: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(main())
