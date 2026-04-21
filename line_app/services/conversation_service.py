# line_app/services/conversation_service.py
# ============================================================
# 對話 thread + message 管理
# - ensure_thread_for_user: 建立/取得對話 thread
# - insert_conversation_message: 寫入對話訊息
# - get_chat_history: 查詢某 thread 的對話紀錄
# - get_member_conversations: 列出某會員的所有對話 thread
# ============================================================

import logging
import uuid
from typing import Optional

from db import (
    fetchone,
    fetchall,
    execute,
    table_has_column as _table_has,
)


# -------------------------------------------------
# Thread 管理
# -------------------------------------------------
def ensure_thread_for_user(line_uid: str) -> str:
    """
    以 LINE userId 直接當作 conversation_threads.id 來使用。
    若不存在就建立一筆；存在則跳過。
    """
    # 去除空白字元
    line_uid = line_uid.strip() if line_uid else ""

    if not line_uid:
        logging.warning("line_uid is empty in ensure_thread_for_user")
        return "anonymous"

    try:
        execute("""
            INSERT IGNORE INTO conversation_threads (id, conversation_name, created_at, updated_at)
            VALUES (:tid, :name, NOW(), NOW())
        """, {"tid": line_uid, "name": f"LINE:{line_uid}"})
    except Exception as e:
        logging.warning(f"Failed to ensure thread: {e}")

    return line_uid


# -------------------------------------------------
# Message 寫入
# -------------------------------------------------
def insert_conversation_message(*, thread_id: str, role: str, direction: str,
                                message_type: str = "chat",
                                question: str | None = None,
                                response: str | None = None,
                                event_id: str | None = None,
                                status: str = "received",
                                message_source: str | None = None,
                                message_id: str | None = None,
                                platform: str | None = "LINE",
                                unanswered: bool = False):
    """
    儲存對話訊息到 conversation_messages 表

    Args:
        thread_id: 對話 thread ID (通常為 LINE userId)
        role: 角色 (user / assistant / system)
        direction: 方向 (inbound / outbound)
        message_type: 訊息類型 (chat / auto_response / broadcast)
        question: 使用者問題文字 (寫入 content 欄位)
        response: 回應文字 (寫入 content 欄位)
        event_id: LINE event ID
        status: 訊息狀態
        message_source: 訊息來源 (manual|gpt|keyword|welcome|always)
        message_id: 指定 message ID（未傳則產生 UUID）
        platform: 平台 (LINE / facebook / webchat)
        unanswered: AI 是否答不出（由 chatbot_service 的 mark_unanswerable tool 旗標決定，
                    用於數據洞察頁計算 AI 覆蓋率）
    """
    # 確保 thread_id 去除前後空白字元
    thread_id = thread_id.strip() if thread_id else ""

    if not thread_id:
        logging.warning("thread_id is empty, cannot insert message")
        return None

    # 呼叫端可傳入 message_id；未傳則產生 UUID
    msg_id = message_id.strip() if isinstance(message_id, str) and message_id.strip() else uuid.uuid4().hex

    # question / response 統一寫入 content 欄位
    content = question or response or ""

    try:
        columns = [
            "id",
            "thread_id",
            "role",
            "direction",
            "message_type",
            "content",
            "event_id",
            "status",
            "message_source",
        ]
        values = [
            ":id",
            ":tid",
            ":role",
            ":dir",
            ":mt",
            ":content",
            ":eid",
            ":st",
            ":src",
        ]
        params = {
            "id": msg_id,
            "tid": thread_id,
            "role": role,
            "dir": direction,
            "mt": message_type,
            "content": content,
            "eid": event_id,
            "st": status,
            "src": message_source
        }

        if platform and _table_has("conversation_messages", "platform"):
            columns.append("platform")
            values.append(":platform")
            params["platform"] = platform

        # unanswered 欄位（若該 DB 已套用 migration）
        if _table_has("conversation_messages", "unanswered"):
            columns.append("unanswered")
            values.append(":unanswered")
            params["unanswered"] = 1 if unanswered else 0

        columns.extend(["created_at", "updated_at"])
        values.extend(["NOW()", "NOW()"])

        execute(
            f"""
            INSERT IGNORE INTO conversation_messages
                ({", ".join(columns)})
            VALUES
                ({", ".join(values)})
            """,
            params,
        )
        logging.info(f"Inserted message: {msg_id}, thread: {thread_id}, source: {message_source}")
        return msg_id

    except Exception as e:
        logging.exception(f"Failed to insert conversation message: {e}")
        raise


# -------------------------------------------------
# 聊天紀錄查詢
# -------------------------------------------------
def get_chat_history(thread_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
    """
    查詢某 thread 的對話紀錄

    Args:
        thread_id: 對話 thread ID
        limit: 最多回傳幾筆
        offset: 跳過前幾筆

    Returns:
        對話訊息列表，按時間正序排列
    """
    thread_id = (thread_id or "").strip()
    if not thread_id:
        return []

    sql = """
        SELECT id, thread_id, role, direction, message_type,
               content, event_id, status, message_source,
               created_at, updated_at
        FROM conversation_messages
        WHERE thread_id = :tid
        ORDER BY created_at ASC
        LIMIT :lim OFFSET :off
    """
    return fetchall(sql, {"tid": thread_id, "lim": limit, "off": offset})


def get_member_conversations(line_uid: str, limit: int = 20) -> list[dict]:
    """
    列出某會員的所有對話 thread（含最後訊息時間和未讀數）

    Args:
        line_uid: LINE 使用者 UID
        limit: 最多回傳幾筆

    Returns:
        對話 thread 列表
    """
    line_uid = (line_uid or "").strip()
    if not line_uid:
        return []

    sql = """
        SELECT
            t.id,
            t.conversation_name,
            t.created_at,
            t.updated_at,
            (SELECT COUNT(*) FROM conversation_messages m
             WHERE m.thread_id = t.id) AS message_count,
            (SELECT m2.created_at FROM conversation_messages m2
             WHERE m2.thread_id = t.id
             ORDER BY m2.created_at DESC LIMIT 1) AS last_message_at
        FROM conversation_threads t
        WHERE t.id = :uid
        ORDER BY t.updated_at DESC
        LIMIT :lim
    """
    return fetchall(sql, {"uid": line_uid, "lim": limit})
