"""
一次性遷移腳本：從 /data2/zhida 遷移資料到主專案
1. KB 房型/設施資料 → 新增為 FAQ 規則（status=active）
2. booking_reservations.json → 匯入到 booking_records 資料表
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime

from sqlalchemy import select, text

from app.database import AsyncSessionLocal
from app.models.faq import FaqCategory, FaqRule, FaqRuleTag
from app.services.kb_sync import sync_kb

ZHIDA_KB = Path("/data2/zhida/kb")
ZHIDA_BOOKING = Path("/data2/zhida/data/booking")

ROOMTYPE_NAMES = {
    "V7": "琴香古韻", "V6": "天地流動", "V5": "白色戀人",
    "V3": "竹影清境", "V2": "酥金迷霧", "V1": "特色家庭房玻光幻影",
    "WS": "森森系雙人房", "GS": "望空間尊親房", "V8": "銀河星語",
}


async def migrate_kb_to_faq(db):
    """把 zhida kb JSON 轉為 FAQ 規則（已存在則跳過）"""

    # 取得分類 id
    result = await db.execute(select(FaqCategory).where(FaqCategory.name.in_(["訂房", "設施"])))
    cats = {c.name: c for c in result.scalars().all()}

    booking_cat = cats.get("訂房")
    facility_cat = cats.get("設施")

    inserted = 0

    # ── 房型（booking_billing.json）──
    if booking_cat:
        data = json.loads((ZHIDA_KB / "booking_billing.json").read_text(encoding="utf-8"))
        rooms = data.get("rooms", [])
        for room in rooms:
            content_json = {
                "房型名稱": room.get("Room_Name", ""),
                "房型特色": room.get("Room_Intro", ""),
                "房價": str(room.get("Price", "")),
                "人數": str(room.get("Guest_Count", "")),
                "間數": str(room.get("Room_Quantity", "")),
                "url": room.get("url", ""),
                "image_url": room.get("Image_URL", ""),
            }
            name = content_json["房型名稱"]
            # 避免重複
            exist = await db.execute(
                select(FaqRule).where(
                    FaqRule.category_id == booking_cat.id,
                    FaqRule.status == "active",
                )
            )
            existing_names = [
                (json.loads(r.content_json) if isinstance(r.content_json, str) else r.content_json or {}).get("房型名稱")
                for r in exist.scalars().all()
            ]
            if name and name in existing_names:
                print(f"  skip (already exists): {name}")
                continue

            rule = FaqRule(
                category_id=booking_cat.id,
                content_json=json.dumps(content_json, ensure_ascii=False),
                status="active",
                created_by=4,
                updated_by=4,
            )
            db.add(rule)
            await db.flush()

            # 沒有 tags，略過
            inserted += 1
            print(f"  ✅ 新增房型規則: {name}")

    # ── 設施（facilities.json）──
    if facility_cat:
        data = json.loads((ZHIDA_KB / "facilities.json").read_text(encoding="utf-8"))
        items = data.get("items", [])
        for item in items:
            content_json = {
                "設施名稱": item.get("Facility_Name", ""),
                "位置": item.get("Location", ""),
                "費用": item.get("Fee", ""),
                "開放時間": item.get("Opening_hours", ""),
                "說明": item.get("Description", ""),
                "url": item.get("url", ""),
            }
            name = content_json["設施名稱"]
            exist = await db.execute(
                select(FaqRule).where(
                    FaqRule.category_id == facility_cat.id,
                    FaqRule.status == "active",
                )
            )
            existing_names = [
                (json.loads(r.content_json) if isinstance(r.content_json, str) else r.content_json or {}).get("設施名稱")
                for r in exist.scalars().all()
            ]
            if name and name in existing_names:
                print(f"  skip (already exists): {name}")
                continue

            rule = FaqRule(
                category_id=facility_cat.id,
                content_json=json.dumps(content_json, ensure_ascii=False),
                status="active",
                created_by=4,
                updated_by=4,
            )
            db.add(rule)
            await db.flush()
            inserted += 1
            print(f"  ✅ 新增設施規則: {name}")

    await db.commit()
    print(f"\n KB 遷移完成，共新增 {inserted} 筆規則")
    await sync_kb(db)
    print(" KB JSON 已同步更新")


async def ensure_session(db, session_id: str, item: dict, created_at: str):
    """確保 chatbot_sessions 存在（FK 要求），不存在則建立"""
    result = await db.execute(text("SELECT id FROM chatbot_sessions WHERE id = :id"), {"id": session_id})
    if result.fetchone():
        return
    browser_key = item.get("browser_key") or session_id
    await db.execute(text("""
        INSERT INTO chatbot_sessions
          (id, browser_key, intent_state, turn_count, booking_children,
           member_name, member_phone, member_email, crm_member_id, created_at)
        VALUES
          (:id, :browser_key, 'confirmed', 0, 0,
           :member_name, :member_phone, :member_email, :crm_member_id, :created_at)
    """), {
        "id": session_id,
        "browser_key": browser_key,
        "member_name": item.get("member_name"),
        "member_phone": item.get("member_phone"),
        "member_email": item.get("member_email"),
        "crm_member_id": item.get("crm_member_id"),
        "created_at": created_at,
    })


async def migrate_bookings(db):
    """把 booking_reservations.json 匯入 booking_records"""
    data = json.loads((ZHIDA_BOOKING / "booking_reservations.json").read_text(encoding="utf-8"))
    items = data.get("items", [])

    inserted = 0
    skipped = 0

    for item in items:
        rid = item.get("reservation_id") or item.get("id")
        if not rid:
            continue

        # 檢查是否已存在
        result = await db.execute(text("SELECT id FROM booking_records WHERE id = :id"), {"id": rid})
        if result.fetchone():
            skipped += 1
            continue

        room_type_name = item.get("room_type_name") or ROOMTYPE_NAMES.get(item.get("room_type_code", ""), "")
        created_at = item.get("created_at", datetime.now().isoformat())
        if isinstance(created_at, str):
            created_at = created_at.replace("Z", "").split(".")[0]

        session_id = item.get("session_id") or rid
        await ensure_session(db, session_id, item, created_at)

        await db.execute(text("""
            INSERT INTO booking_records
              (id, session_id, crm_member_id, room_type_code, room_type_name,
               room_count, checkin_date, checkout_date, adults, children,
               member_name, member_phone, member_email,
               data_source, source, db_saved, created_at)
            VALUES
              (:id, :session_id, :crm_member_id, :room_type_code, :room_type_name,
               :room_count, :checkin_date, :checkout_date, :adults, :children,
               :member_name, :member_phone, :member_email,
               :data_source, :source, :db_saved, :created_at)
        """), {
            "id": rid,
            "session_id": session_id,
            "crm_member_id": item.get("crm_member_id"),
            "room_type_code": item.get("room_type_code", ""),
            "room_type_name": room_type_name,
            "room_count": item.get("room_count", 1),
            "checkin_date": item.get("checkin_date"),
            "checkout_date": item.get("checkout_date"),
            "adults": item.get("adults", 1),
            "children": item.get("children", 0),
            "member_name": item.get("member_name"),
            "member_phone": item.get("member_phone"),
            "member_email": item.get("member_email"),
            "data_source": "faq_static",
            "source": "web_chatbot",
            "db_saved": 1 if item.get("db_saved") else 0,
            "created_at": created_at,
        })
        inserted += 1
        print(f"  ✅ 訂單: {rid[:8]}… {item.get('member_name')} / {item.get('room_type_code')}")

    await db.commit()
    print(f"\n 訂單遷移完成：新增 {inserted} 筆，略過 {skipped} 筆（已存在）")


async def main():
    async with AsyncSessionLocal() as db:
        print("=== 1. 遷移 KB 房型/設施資料 → FAQ 規則 ===")
        await migrate_kb_to_faq(db)

        print("\n=== 2. 遷移歷史訂單 ===")
        await migrate_bookings(db)

    print("\n✅ 遷移完成")


if __name__ == "__main__":
    asyncio.run(main())
