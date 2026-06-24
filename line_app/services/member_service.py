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

from config import AUTO_BACKFILL_FRIENDS
from db import (
    engine,
    fetchone,
    fetchall,
    execute,
    table_has_column as _table_has,
    column_is_required as _col_required,
)
from services.line_sdk import (
    fetch_line_profile,
    get_channel_access_token_by_channel_id,
    LINE_CHANNEL_ID_COL,
)

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

    # UPDATE part — 只更新有傳值的欄位，避免把未傳入的欄位蓋回 NULL
    set_parts = []
    inserted_cols = set(fields)
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
        if _table_has("members", k) and k in inserted_cols:
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
            # DB human_override_until 是 naive UTC；統一成 naive UTC 與 utcnow() 同基底比較
            if override_until.tzinfo is not None:
                override_until = override_until.astimezone(datetime.timezone.utc).replace(tzinfo=None)
            human_override = override_until > utcnow()

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
DISPLAY_NAME_TOKEN_SIMPLE = "{好友的顯示名稱}"


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
def get_all_follower_ids(line_channel_id: Optional[str] = None, limit: int = 500) -> list[str]:
    """
    用 LINE 官方 followers API 把『指定 OA』目前所有好友的 userId 撈出來。

    :param line_channel_id: LINE 官方帳號 channel id；None 時 fallback .env 預設 token（與群發同一套）
    :param limit: 每次 API 要幾筆（官方上限 1000，這裡保守用 500）
    :return: 所有好友的 userId list
    """
    # 多 OA：依 channel 取對應 token；沒帶 channel -> get_channel_access_token_by_channel_id
    # 內部自動 fallback .env（保證回 str，否則丟 RuntimeError）
    token = get_channel_access_token_by_channel_id(line_channel_id)

    headers = {
        "Authorization": f"Bearer {token}"
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


def _backfill_one_oa(line_channel_id: Optional[str]) -> None:
    """
    補單一 OA 的好友（line_channel_id=None 代表 .env 預設帳號，相容單帳號舊環境）。

    重點：好友以「對應的 line_channel_id」寫進 members —— 這是群發受眾人數、
    會員列表多 OA 過濾（members.line_channel_id）唯一的資料來源。寫法與 on_follow
    一致：upsert_line_friend + upsert_member(帶 channel) + 連結 member_id。
    """
    label = line_channel_id or "(.env 預設)"
    logging.info("[BACKFILL] === OA=%s 開始撈取好友 userId ===", label)

    follower_ids = get_all_follower_ids(line_channel_id=line_channel_id)
    if not follower_ids:
        logging.warning("[BACKFILL] OA=%s 未取得任何好友（token 有問題或目前沒有好友）", label)
        return

    # 已正確歸屬本 OA 的好友：以 members.line_channel_id 判斷（受眾/列表都讀這張表）。
    # 沒帶 channel（單帳號舊環境）時退回用 line_friends 既有名單判斷。
    if line_channel_id:
        rows = fetchall(
            "SELECT line_uid FROM members "
            "WHERE line_channel_id = :cid AND is_following = 1 "
            "AND line_uid IS NOT NULL AND line_uid != ''",
            {"cid": line_channel_id},
        )
    else:
        rows = fetchall("SELECT line_uid FROM line_friends WHERE is_following = 1", {})
    db_existing = {row["line_uid"] for row in rows}

    # 找出「LINE 有、但 DB 還沒正確歸屬本 OA」的 userId（含舊資料缺 channel 的修復）
    missing_ids = [uid for uid in follower_ids if uid not in db_existing]
    if not missing_ids:
        logging.info("[BACKFILL] OA=%s 資料已齊全，不需要補", label)
        return

    logging.info("[BACKFILL] OA=%s 需要補 %d 位好友", label, len(missing_ids))

    success = 0
    fail = 0
    total = len(missing_ids)
    for idx, uid in enumerate(missing_ids, start=1):
        try:
            # 1) 用該 OA 的 token 取 profile（名稱 & 大頭貼）
            display_name, picture_url = fetch_line_profile(uid, line_channel_id=line_channel_id)

            # 2) 寫 line_friends（與 on_follow 同序：先 friend，member_id 之後再連）
            friend_id = upsert_line_friend(
                line_uid=uid,
                display_name=display_name,
                picture_url=picture_url,
                is_following=True,
            )

            # 3) 寫 members（帶 channel）—— 受眾人數 / 會員列表多 OA 過濾的來源
            mid = upsert_member(
                uid,
                display_name,
                picture_url,
                line_channel_id=line_channel_id,
            )

            # 4) 連結 friend ↔ member（此 UPDATE 觸發 trigger 把 is_following 同步回 members）
            if friend_id and mid:
                execute(
                    "UPDATE line_friends SET member_id = :mid WHERE id = :fid",
                    {"mid": mid, "fid": friend_id},
                )

            success += 1
            logging.info(
                "[BACKFILL] OA=%s (%d/%d) 已補 %s name=%r avatar=%s",
                label, idx, total, uid, display_name, "Y" if picture_url else "N"
            )

        except Exception as e:
            fail += 1
            logging.exception(
                "[BACKFILL] OA=%s (%d/%d) 補 %s 失敗：%s", label, idx, total, uid, e
            )

        # 防止太密集打 profile API，被 LINE throttle
        time.sleep(0.2)

    logging.info("[BACKFILL] OA=%s 補齊完成，成功 %d 筆，失敗 %d 筆", label, success, fail)


def backfill_line_friends_on_startup():
    """
    啟動時執行資料補齊（只補「LINE 有、但 DB 還沒正確歸屬」的好友）。

    多 OA：遍歷 line_channels 中 is_active=1 的每個官方帳號，各用自己的 token 撈
    followers，並把好友以「對應 line_channel_id」寫入 members / line_friends。
    無任何 active OA 時退回 .env 單帳號（相容舊行為）。AUTO_BACKFILL_FRIENDS 為總開關。
    """
    try:
        if not AUTO_BACKFILL_FRIENDS:
            logging.info("[BACKFILL] AUTO_BACKFILL_FRIENDS=0，略過 backfill")
            return

        # 取得所有啟用中的 OA channel id（欄名因環境而異，沿用 LINE_CHANNEL_ID_COL）
        try:
            oa_rows = fetchall(
                f"SELECT {LINE_CHANNEL_ID_COL} AS cid FROM line_channels WHERE is_active = 1 ORDER BY id",
                {},
            )
        except Exception:
            logging.exception("[BACKFILL] 查詢 line_channels 失敗，改用 .env 單帳號")
            oa_rows = []

        channel_ids = [r["cid"] for r in (oa_rows or []) if r.get("cid")]
        if not channel_ids:
            logging.info("[BACKFILL] 無啟用中的 OA，使用 .env 預設帳號 backfill")
            channel_ids = [None]  # None -> get_all_follower_ids fallback .env

        logging.info("[BACKFILL] 共 %d 個 OA 需要 backfill", len(channel_ids))
        for channel_id in channel_ids:
            try:
                _backfill_one_oa(channel_id)
            except Exception:
                # 單一 OA 失敗不影響其他 OA
                logging.exception("[BACKFILL] OA=%s backfill 失敗", channel_id or "(.env 預設)")

    except Exception as e:
        logging.exception("[BACKFILL] backfill_line_friends_on_startup 整體失敗：%s", e)
