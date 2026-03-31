# line_app/services/member_service.py
# ============================================================
# 會員 / LINE 好友 CRUD、Profile 管理
# - upsert_member, upsert_line_friend
# - fetch_member_profile, maybe_update_member_profile
# - is_gpt_enabled_for_user
# - get_all_follower_ids, backfill_line_friends_on_startup
# - render_template_text (顯示名稱模板)
# ============================================================

import datetime
import logging
import time
from typing import Optional

from sqlalchemy import text

from config import LINE_CHANNEL_ACCESS_TOKEN, AUTO_BACKFILL_FRIENDS
from db import (
    engine,
    fetchone,
    fetchall,
    execute,
    table_has_column as _table_has,
    column_is_required as _col_required,
)
from services.line_sdk import fetch_line_profile

import requests


def utcnow():
    return datetime.datetime.utcnow()


# -------------------------------------------------
# 會員 upsert
# -------------------------------------------------
def upsert_member(line_uid: str,
                  display_name: Optional[str] = None,
                  picture_url: Optional[str] = None,
                  gender: Optional[str] = None,
                  birthday_date: Optional[str] = None,
                  email: Optional[str] = None,
                  phone: Optional[str] = None,
                  join_source: Optional[str] = None,
                  name: Optional[str] = None,
                  id_number: Optional[str] = None,
                  passport_number: Optional[str] = None,
                  residence: Optional[str] = None,
                  address_detail: Optional[str] = None,
                  receive_notification: Optional[int] = None,
                  line_channel_id: Optional[str] = None) -> int:

    fields, ph, p = ["line_uid"], [":uid"], {"uid": line_uid}

    def add(col, key, val):
        # 空字串自動轉換成 NULL
        if val == "":
            val = None

        if _table_has("members", col) and val is not None:
            fields.append(col)
            ph.append(f":{key}")
            p[key] = val

    # display name
    if display_name is not None:
        add("line_display_name", "dn", display_name)

    # avatar
    if picture_url is not None:
        add("line_avatar", "pu", picture_url)

    # form fields
    add("gender", "g", gender)
    add("birthday", "bd", birthday_date or None)
    add("email", "em", email)
    add("phone", "phn", phone)
    add("name", "nm", name)
    add("id_number", "idn", id_number)
    add("passport_number", "psn", passport_number)
    add("residence", "res", residence)
    add("address_detail", "addr", address_detail)
    add("receive_notification", "rn", receive_notification)

    # line channel id (來自哪個 LINE 官方帳號)
    add("line_channel_id", "lcid", line_channel_id)

    # join source
    js_val = join_source or "LINE"
    if _table_has("members", "join_source"):
        add("join_source", "js", js_val)
    elif _table_has("members", "source"):
        add("source", "js", js_val)

    # timestamps
    if _col_required("members", "created_at"):
        fields.append("created_at")
        ph.append(":cat")
        p["cat"] = utcnow()

    if _table_has("members", "updated_at"):
        fields.append("updated_at")
        ph.append(":uat")
        p["uat"] = utcnow()

    # 統一使用 UTC 時間存儲 last_interaction_at
    if _table_has("members", "last_interaction_at"):
        fields.append("last_interaction_at")
        ph.append(":liat")
        p["liat"] = utcnow()

    # UPDATE part
    set_parts = []
    for k in (
        "line_display_name",
        "line_avatar",
        "line_channel_id",
        "gender", "birthday", "email", "phone",
        "join_source", "source",
        "name", "id_number", "passport_number",
        "residence", "address_detail",
        "receive_notification"
    ):
        if _table_has("members", k):
            set_parts.append(f"{k}=VALUES({k})")

    if _table_has("members", "updated_at"):
        set_parts.append("updated_at=VALUES(updated_at)")

    # 使用 VALUES(last_interaction_at) 保持 UTC 一致性
    if _table_has("members", "last_interaction_at"):
        set_parts.append("last_interaction_at=VALUES(last_interaction_at)")

    sql = (
        f"INSERT INTO members ({', '.join(fields)}) "
        f"VALUES ({', '.join(ph)}) "
        f"ON DUPLICATE KEY UPDATE {', '.join(set_parts)}"
    )

    with engine.begin() as conn:
        conn.execute(text(sql), p)
        mid = conn.execute(
            text("SELECT id FROM members WHERE line_uid=:u"),
            {"u": line_uid}
        ).scalar()

    return int(mid)


# -------------------------------------------------
# LINE 好友 upsert
# -------------------------------------------------
def upsert_line_friend(line_uid: str,
                       display_name: Optional[str] = None,
                       picture_url: Optional[str] = None,
                       member_id: Optional[int] = None,
                       is_following: bool = True) -> int:
    """
    建立或更新 LINE 好友記錄

    Args:
        line_uid: LINE 用戶 UID
        display_name: LINE 顯示名稱
        picture_url: LINE 頭像 URL
        member_id: 關聯的 CRM 會員 ID（可選）
        is_following: 是否為當前好友（預設 True）

    Returns:
        LINE 好友 ID
    """
    # 檢查是否已存在
    existing = fetchone(
        "SELECT id, is_following FROM line_friends WHERE line_uid = :uid",
        {"uid": line_uid}
    )

    now = utcnow()

    if existing:
        # 更新現有記錄
        update_parts = []
        params = {"uid": line_uid, "now": now}

        if display_name is not None:
            update_parts.append("line_display_name = :dn")
            params["dn"] = display_name
        if picture_url is not None:
            update_parts.append("line_picture_url = :pu")
            params["pu"] = picture_url
        if member_id is not None:
            update_parts.append("member_id = :mid")
            params["mid"] = member_id

        # 處理 is_following 狀態變化
        was_following = existing.get("is_following")
        if is_following != was_following:
            update_parts.append("is_following = :following")
            params["following"] = 1 if is_following else 0

            if is_following and not was_following:
                # 重新關注
                update_parts.append("followed_at = :now")
                update_parts.append("unfollowed_at = NULL")
            elif not is_following and was_following:
                # 取消關注
                update_parts.append("unfollowed_at = :now")

        update_parts.append("last_interaction_at = :now")
        update_parts.append("updated_at = :now")

        if update_parts:
            sql = f"UPDATE line_friends SET {', '.join(update_parts)} WHERE line_uid = :uid"
            execute(sql, params)

        return existing["id"]
    else:
        # 建立新記錄
        sql = """
        INSERT INTO line_friends (
            line_uid, line_display_name, line_picture_url, member_id,
            is_following, followed_at, last_interaction_at, created_at, updated_at
        ) VALUES (
            :uid, :dn, :pu, :mid, :following, :now, :now, :now, :now
        )
        """
        params = {
            "uid": line_uid,
            "dn": display_name,
            "pu": picture_url,
            "mid": member_id,
            "following": 1 if is_following else 0,
            "now": now
        }
        execute(sql, params)

        # 取得新插入的 ID
        friend_id = fetchone(
            "SELECT id FROM line_friends WHERE line_uid = :uid",
            {"uid": line_uid}
        )
        return friend_id["id"] if friend_id else None


# -------------------------------------------------
# Profile 查詢 / 更新
# -------------------------------------------------
def fetch_member_profile(line_uid: str) -> dict:
    """
    從 members 表抓 LINE 顯示名稱/頭像（已統一欄位：line_display_name / line_avatar）。

    回傳 keys：
      - line_display_name
      - line_avatar
    """
    line_uid = (line_uid or "").strip()
    if not line_uid:
        return {}

    sql = """
        SELECT line_display_name, line_avatar
        FROM members
        WHERE line_uid=:u
        LIMIT 1
    """
    return fetchone(sql, {"u": line_uid}) or {}


def maybe_update_member_profile(uid: str) -> None:
    """
    若 members 裡 display_name / picture_url 有缺，就向 LINE 抓一次並補寫。
    抓不到（None）時不覆蓋，以避免把舊值清空。
    """
    try:
        row = fetch_member_profile(uid)
        has_name = bool(row and row.get("line_display_name"))
        has_pic = bool(row and row.get("line_avatar"))
        if has_name and has_pic:
            return  # 都有就不打 API

        # 打 LINE Profile API
        display_name, picture_url = fetch_line_profile(uid)

        # 有抓到才更新，避免用空值覆蓋
        if display_name or picture_url:
            upsert_member(uid,
                          display_name if display_name else None,
                          picture_url if picture_url else None)
            logging.info(f"[PROFILE] backfilled member uid={uid} "
                         f"name={display_name!r} pic={'Y' if picture_url else 'N'}")
    except Exception as e:
        logging.warning(f"[PROFILE] maybe_update_member_profile failed uid={uid}: {e}")


def get_member_reply_flags(line_uid: str) -> dict:
    """一次查詢取得會員的自動回應控制旗標（gpt_enabled + human_override_until）"""
    try:
        row = fetchone(
            "SELECT gpt_enabled, human_override_until FROM members WHERE line_uid=:u",
            {"u": line_uid}
        )
        if not row:
            return {"gpt_enabled": True, "human_override": False}

        gpt_enabled = bool(row.get("gpt_enabled", True))
        override_until = row.get("human_override_until")
        human_override = False
        if override_until:
            if isinstance(override_until, str):
                override_until = datetime.datetime.fromisoformat(override_until)
            human_override = override_until > datetime.datetime.now()

        return {"gpt_enabled": gpt_enabled, "human_override": human_override}
    except Exception as e:
        logging.error(f"[Reply Flags] DB query failed for uid={line_uid}: {e}")
        return {"gpt_enabled": True, "human_override": False}


def is_gpt_enabled_for_user(line_uid: str) -> bool:
    """檢查是否啟用 GPT（向後相容，內部使用 get_member_reply_flags）"""
    return get_member_reply_flags(line_uid)["gpt_enabled"]


def is_human_override_active(line_uid: str) -> bool:
    """檢查管理者是否正在人工接管（向後相容，內部使用 get_member_reply_flags）"""
    return get_member_reply_flags(line_uid)["human_override"]


# -------------------------------------------------
# 顯示名稱模板替換
# -------------------------------------------------
DISPLAY_NAME_TOKEN = "{好友的顯示名稱}"
DISPLAY_NAME_TOKEN_SIMPLE = "{好友的显示名称}"


def _get_display_name_for_uid(line_uid: str, line_channel_id: Optional[str] = None) -> Optional[str]:
    """先用 DB 快取，沒有再向 LINE 取"""
    try:
        row = fetch_member_profile(line_uid) or {}
        dn = row.get("line_display_name")
        if dn:
            return dn
    except Exception:
        dn = None

    try:
        dn, _ = fetch_line_profile(line_uid, line_channel_id=line_channel_id)
        return dn
    except Exception:
        return None


def render_template_text(
    text: Optional[str],
    *,
    line_uid: Optional[str] = None,
    line_channel_id: Optional[str] = None,
    display_name: Optional[str] = None,
) -> Optional[str]:
    """替換文本中的 {好友的顯示名稱} 為實際名稱"""
    if not text:
        return text
    if DISPLAY_NAME_TOKEN not in text and DISPLAY_NAME_TOKEN_SIMPLE not in text:
        return text
    dn = display_name
    if not dn and line_uid:
        dn = _get_display_name_for_uid(line_uid, line_channel_id=line_channel_id)
    if not dn:
        return text
    return text.replace(DISPLAY_NAME_TOKEN, dn).replace(DISPLAY_NAME_TOKEN_SIMPLE, dn)


# -------------------------------------------------
# Followers 批量取得 / 補齊
# -------------------------------------------------
def get_all_follower_ids(limit: int = 500) -> list[str]:
    """
    用 LINE 官方 followers API 把目前所有好友的 userId 撈出來。

    :param limit: 每次 API 要幾筆（官方上限 1000，這裡保守用 500）
    :return: 所有好友的 userId list
    """
    if not LINE_CHANNEL_ACCESS_TOKEN:
        raise RuntimeError("缺少 LINE_CHANNEL_ACCESS_TOKEN，請確認 .env 設定")

    headers = {
        "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}"
    }

    all_ids: list[str] = []
    next_cursor: str | None = None

    while True:
        params = {"limit": limit}
        if next_cursor:
            params["start"] = next_cursor

        resp = requests.get(
            "https://api.line.me/v2/bot/followers/ids",
            headers=headers,
            params=params,
            timeout=10,
        )

        if not resp.ok:
            logging.error("[BACKFILL] 取得 followers 失敗：%s %s", resp.status_code, resp.text)
            break

        data = resp.json()
        user_ids = data.get("userIds", []) or []
        all_ids.extend(user_ids)

        logging.info("[BACKFILL] 目前累積好友數：%d", len(all_ids))

        # 有下一頁就接著撈，沒有就結束
        next_cursor = data.get("next")
        if not next_cursor:
            break

        # 避免過快打 API，稍微休息一下
        time.sleep(0.3)

    return all_ids


def backfill_line_friends_on_startup():
    """
    啟動時執行資料補齊（只補「LINE 有、但 line_friends 裡沒有」的好友）。

    流程：
      1. 如果 AUTO_BACKFILL_FRIENDS=0 -> 直接略過
      2. 用 followers API 取得目前所有好友 userId
      3. 查 DB line_friends 裡已經有的 line_uid
      4. 找出「LINE 有但 DB 沒有」的那一批 missing_ids
      5. 對每個 missing_id 呼叫 fetch_line_profile + upsert_line_friend 補上資料
    """
    try:
        if not AUTO_BACKFILL_FRIENDS:
            logging.info("[BACKFILL] AUTO_BACKFILL_FRIENDS=0，略過 backfill")
            return

        logging.info("[BACKFILL] 開始從 LINE 撈取全部好友 userId ...")
        follower_ids = get_all_follower_ids()
        if not follower_ids:
            logging.warning("[BACKFILL] 未從 LINE 取得任何好友，可能 token 有問題或目前沒有好友")
            return

        # 取得 DB 已存的好友名單（只看 is_following=1 的）
        rows = fetchall("SELECT line_uid FROM line_friends WHERE is_following = 1", {})
        db_existing = {row["line_uid"] for row in rows}

        # 找出 LINE 有但 DB 沒存的 userId
        missing_ids = [uid for uid in follower_ids if uid not in db_existing]

        if not missing_ids:
            logging.info("[BACKFILL] line_friends 資料已齊全，不需要補")
            return

        logging.info("[BACKFILL] 需要補 %d 位好友資料", len(missing_ids))

        success = 0
        fail = 0

        for idx, uid in enumerate(missing_ids, start=1):
            try:
                # 1) 先用現成的 profile API 拿名稱 & 大頭貼
                display_name, picture_url = fetch_line_profile(uid)

                # 2) 寫入 / 更新 line_friends
                upsert_line_friend(
                    line_uid=uid,
                    display_name=display_name,
                    picture_url=picture_url,
                    member_id=None,
                    is_following=True,
                )

                success += 1
                logging.info(
                    "[BACKFILL] (%d/%d) 已補上 %s name=%r avatar=%s",
                    idx, len(missing_ids), uid, display_name,
                    "Y" if picture_url else "N"
                )

            except Exception as e:
                fail += 1
                logging.exception(
                    "[BACKFILL] (%d/%d) 補 %s 失敗：%s",
                    idx, len(missing_ids), uid, e
                )

            # 防止太密集打 profile API，被 LINE throttle
            time.sleep(0.2)

        logging.info("[BACKFILL] 補齊完成，成功 %d 筆，失敗 %d 筆", success, fail)

    except Exception as e:
        logging.exception("[BACKFILL] backfill_line_friends_on_startup 整體失敗：%s", e)
