"""
KB Sync — 將資料庫中已啟用的 FAQ 規則同步寫入 backend/kb/*.json，
供 chatbot_service 的 kb_search 工具使用。
每次 FAQ 規則有寫入操作（新增/更新/刪除/發佈）後呼叫。
"""
import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.faq import FaqCategory, FaqRule

logger = logging.getLogger(__name__)

_KB_DIR = Path(__file__).resolve().parents[2] / "kb"
_KB_FACILITY_FILE = _KB_DIR / "facilities.json"
_KB_BOOKING_FILE = _KB_DIR / "booking_billing.json"

# 分類名稱 → KB 檔案 / 格式對應
_CATEGORY_MAP = {
    "設施": "facilities",
    "訂房": "booking_billing",
}


def _parse_content(rule: FaqRule) -> dict:
    c = rule.content_json
    if isinstance(c, str):
        try:
            c = json.loads(c)
        except Exception:
            c = {}
    return c or {}


async def sync_kb(db: AsyncSession) -> None:
    """讀取所有啟用分類下的 active 規則，寫入對應 KB JSON 檔案。"""
    try:
        _KB_DIR.mkdir(parents=True, exist_ok=True)

        # 查詢所有啟用中的分類
        stmt = select(FaqCategory).where(FaqCategory.is_active == True)  # noqa: E712
        result = await db.execute(stmt)
        categories = result.scalars().all()

        for cat in categories:
            target = _CATEGORY_MAP.get(cat.name)
            if not target:
                continue

            # 查詢該分類下 active 規則
            rule_stmt = (
                select(FaqRule)
                .where(FaqRule.category_id == cat.id, FaqRule.status == "active")
                .options(selectinload(FaqRule.tags))
                .order_by(FaqRule.created_at)
            )
            rule_result = await db.execute(rule_stmt)
            rules = rule_result.scalars().all()

            if target == "facilities":
                items = []
                for rule in rules:
                    c = _parse_content(rule)
                    items.append({
                        "設施名稱": c.get("設施名稱", ""),
                        "位置": c.get("位置", ""),
                        "費用": c.get("費用", ""),
                        "開放時間": c.get("開放時間", ""),
                        "說明": c.get("說明", ""),
                        "url": c.get("url", ""),
                        "tags": [t.tag_name for t in (rule.tags or [])],
                    })
                _KB_FACILITY_FILE.write_text(
                    json.dumps({"items": items}, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                logger.info(f"KB sync: facilities → {len(items)} rules")

            elif target == "booking_billing":
                rooms = []
                for rule in rules:
                    c = _parse_content(rule)
                    rooms.append({
                        "房型名稱": c.get("房型名稱", ""),
                        "房型特色": c.get("房型特色", ""),
                        "房價": c.get("房價", ""),
                        "人數": c.get("人數", ""),
                        "間數": c.get("間數", ""),
                        "url": c.get("url", ""),
                        "image_url": c.get("image_url", ""),
                        "tags": [t.tag_name for t in (rule.tags or [])],
                    })
                _KB_BOOKING_FILE.write_text(
                    json.dumps({"rooms": rooms}, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                logger.info(f"KB sync: booking_billing → {len(rooms)} rules")

    except Exception as e:
        logger.error(f"KB sync failed: {e}")
