#!/usr/bin/env python3
"""
手動清理部分創建的資料表
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings

async def cleanup_tables():
    """刪除部分創建的表"""
    DATABASE_URL = settings.DATABASE_URL
    engine = create_async_engine(DATABASE_URL, echo=False)

    tables_to_drop = [
        'consumption_records',  # 依賴 pms_integrations
        'member_interaction_records',
        'message_deliveries',
        # 'message_records',  # 已透過 migration 97c1b3771116 正式移除
        'pms_integrations',
    ]

    async with engine.begin() as conn:
        for table in tables_to_drop:
            try:
                await conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
                print(f"✅ 刪除表 {table}")
            except Exception as e:
                print(f"⚠️  刪除表 {table} 失敗: {e}")

    await engine.dispose()
    print("\n✅ 清理完成")

if __name__ == "__main__":
    asyncio.run(cleanup_tables())
