#!/usr/bin/env python3
"""
清理舊的純 FB 自動回應記錄

用途：
刪除本地資料庫中 channels=['Facebook'] 的自動回應記錄
因為新架構下，純 FB 自動回應不再保存到本地 DB

使用方法：
    python scripts/cleanup_old_fb_auto_responses.py

安全措施：
- 執行前會顯示即將刪除的記錄
- 需要手動確認才會執行刪除
- 支援 --dry-run 模式僅查看不刪除
"""

import asyncio
import sys
from pathlib import Path

# 添加 backend 到路徑
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.auto_response import AutoResponse
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(message)s')


async def count_fb_only_auto_responses(db: AsyncSession) -> int:
    """計算純 FB 自動回應記錄數量"""
    query = select(AutoResponse).where(
        AutoResponse.channels == ['Facebook']
    )
    result = await db.execute(query)
    items = result.scalars().all()
    return len(items)


async def list_fb_only_auto_responses(db: AsyncSession):
    """列出所有純 FB 自動回應記錄"""
    query = select(AutoResponse).where(
        AutoResponse.channels == ['Facebook']
    )
    result = await db.execute(query)
    items = result.scalars().all()

    if not items:
        logger.info("✅ 沒有找到純 FB 自動回應記錄")
        return []

    logger.info(f"\n📋 找到 {len(items)} 條純 FB 自動回應記錄：\n")
    for item in items:
        logger.info(f"  ID: {item.id}")
        logger.info(f"  名稱: {item.name}")
        logger.info(f"  觸發類型: {item.trigger_type}")
        logger.info(f"  創建時間: {item.created_at}")
        logger.info(f"  是否啟用: {item.is_active}")
        logger.info(f"  關鍵字: {item.keywords}")
        logger.info("  " + "-" * 50)

    return items


async def delete_fb_only_auto_responses(db: AsyncSession) -> int:
    """刪除純 FB 自動回應記錄"""
    stmt = delete(AutoResponse).where(
        AutoResponse.channels == ['Facebook']
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount


async def main(dry_run: bool = False):
    """主函數"""
    logger.info("=" * 70)
    logger.info("清理舊的純 FB 自動回應記錄")
    logger.info("=" * 70)

    async with AsyncSessionLocal() as db:
        try:
            # 1. 列出所有純 FB 記錄
            items = await list_fb_only_auto_responses(db)

            if not items:
                logger.info("\n✅ 無需清理")
                return

            # 2. 確認刪除
            if dry_run:
                logger.info(f"\n🔍 [DRY RUN] 將會刪除 {len(items)} 條記錄（未執行）")
                return

            logger.info(f"\n⚠️  即將刪除 {len(items)} 條純 FB 自動回應記錄")
            logger.info("⚠️  這些記錄將從本地資料庫中永久刪除")
            logger.info("⚠️  FB API 上的自動回應不受影響\n")

            confirm = input("確認刪除？請輸入 'YES' 繼續: ")

            if confirm != "YES":
                logger.info("❌ 已取消刪除")
                return

            # 3. 執行刪除
            logger.info("\n🗑️  正在刪除...")
            deleted_count = await delete_fb_only_auto_responses(db)

            logger.info(f"\n✅ 成功刪除 {deleted_count} 條純 FB 自動回應記錄")
            logger.info("✅ 本地資料庫已清理完成")
            logger.info("✅ FB API 上的自動回應保持不變")

        except Exception as e:
            logger.error(f"❌ 清理失敗: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="清理舊的純 FB 自動回應記錄"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="僅查看將被刪除的記錄，不實際執行刪除"
    )

    args = parser.parse_args()

    asyncio.run(main(dry_run=args.dry_run))
