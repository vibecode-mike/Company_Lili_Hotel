#!/usr/bin/env python3
"""
测试自动回应 API
"""
import asyncio
from app.database import AsyncSessionLocal
from app.models.auto_response import AutoResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload


async def test_api():
    """测试 API"""
    async with AsyncSessionLocal() as db:
        try:
            query = select(AutoResponse).options(selectinload(AutoResponse.keyword_relations))
            query = query.order_by(AutoResponse.created_at.desc())
            result = await db.execute(query)
            auto_responses = result.scalars().all()

            print(f"找到 {len(auto_responses)} 筆自動回應")

            for ar in auto_responses:
                print(f"\nID: {ar.id}")
                print(f"名稱: {ar.name}")
                print(f"觸發類型: {ar.trigger_type}")
                print(f"內容: {ar.content[:50]}...")
                print(f"啟用狀態: {ar.is_active}")
                print(f"關鍵字數量: {len(ar.keyword_relations)}")
                for kw in ar.keyword_relations:
                    print(f"  - {kw.keyword}")

        except Exception as e:
            print(f"❌ 錯誤: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_api())
