"""
數據洞察 API — 數據洞察頁（InsightsPanel）使用

目前提供：
- GET /analytics/ai-coverage — AI 覆蓋率（可回答訊息 / AI 總訊息數）
- GET /analytics/completed-orders — 完成訂單數（依 bookings.paid_at 計算）
- GET /analytics/pending-conversations — 需人工介入的對話清單（待回覆 + AI 答不出）
- GET /analytics/new-members — 新增會員數（預設 source=line，未來可擴充 fb/webchat/all）

DB 時區：MySQL server timezone = Asia/Taipei，created_at 為台灣時間（見 CLAUDE.md）。
"""
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class DailyCoverageSchema(BaseModel):
    date: str  # YYYY-MM-DD（台灣時區）
    total: int  # 當天 AI 訊息總數
    unanswered: int  # 當天答不出的訊息數
    coverage_rate: float  # 覆蓋率（百分比，一位小數），無資料回 0.0


class UnansweredQuestionSchema(BaseModel):
    message_id: str
    thread_id: str
    question: str  # 觸發答不出的使用者問題（AI 前一筆 user 訊息）
    ai_reply: str  # AI 的答不出回覆內容
    platform: Optional[str] = None
    created_at: str  # ISO 格式


class AiCoverageResponseSchema(BaseModel):
    start_date: str
    end_date: str
    total: int
    unanswered: int
    coverage_rate: float  # 期間整體覆蓋率（百分比，一位小數）
    daily: List[DailyCoverageSchema]
    top_unanswered: List[UnansweredQuestionSchema]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_date(s: Optional[str], default: date) -> date:
    if not s:
        return default
    try:
        return date.fromisoformat(s)
    except ValueError:
        return default


def _coverage(total: int, unanswered: int) -> float:
    if total <= 0:
        return 0.0
    return round((1 - unanswered / total) * 100, 1)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get("/ai-coverage", response_model=AiCoverageResponseSchema)
async def get_ai_coverage(
    start_date: Optional[str] = Query(None, description="起始日期 YYYY-MM-DD（台灣時間，含）；未提供則預設為 end_date 前 29 天"),
    end_date: Optional[str] = Query(None, description="結束日期 YYYY-MM-DD（台灣時間，含）；未提供則預設為今天"),
    top_n: int = Query(10, ge=1, le=50, description="未解問題 top N"),
    db: AsyncSession = Depends(get_db),
) -> AiCoverageResponseSchema:
    """
    AI 覆蓋率統計

    分子：AI 能回答的訊息數 = 總訊息 - 未解訊息
    分母：AI 總共產出的訊息數（message_source='gpt' AND direction='outgoing'）

    未解訊息：unanswered=1（由 chatbot_service 的 mark_unanswerable tool 標記）
    """
    today = date.today()
    end = _parse_date(end_date, today)
    start = _parse_date(start_date, end - timedelta(days=29))

    # 保證 start <= end
    if start > end:
        start, end = end, start

    # 查詢區間：含 end 當天整天，所以用 [start 00:00, end+1 00:00)
    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end + timedelta(days=1), datetime.min.time())

    # 1. 每日統計
    daily_sql = text("""
        SELECT DATE(created_at) AS d,
               COUNT(*) AS total,
               SUM(CASE WHEN unanswered = 1 THEN 1 ELSE 0 END) AS unanswered
        FROM conversation_messages
        WHERE message_source = 'gpt'
          AND direction = 'outgoing'
          AND created_at >= :start_dt
          AND created_at < :end_dt
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)
    daily_rows = (await db.execute(daily_sql, {"start_dt": start_dt, "end_dt": end_dt})).all()

    daily: List[DailyCoverageSchema] = []
    total_sum = 0
    unans_sum = 0
    for row in daily_rows:
        d_str = row.d.isoformat() if isinstance(row.d, date) else str(row.d)
        t = int(row.total or 0)
        u = int(row.unanswered or 0)
        total_sum += t
        unans_sum += u
        daily.append(DailyCoverageSchema(
            date=d_str,
            total=t,
            unanswered=u,
            coverage_rate=_coverage(t, u),
        ))

    # 2. 未解 top N：取每筆未解訊息 + 前一筆 user 訊息（= 觸發問題）
    #    用 LEFT JOIN 找同 thread 最近一筆 created_at 更早的 user/incoming 訊息
    top_sql = text("""
        SELECT m.id AS message_id,
               m.thread_id AS thread_id,
               m.content AS ai_reply,
               m.platform AS platform,
               m.created_at AS created_at,
               (
                   SELECT u.content
                   FROM conversation_messages u
                   WHERE u.thread_id = m.thread_id
                     AND u.direction = 'incoming'
                     AND u.created_at <= m.created_at
                   ORDER BY u.created_at DESC
                   LIMIT 1
               ) AS question
        FROM conversation_messages m
        WHERE m.message_source = 'gpt'
          AND m.direction = 'outgoing'
          AND m.unanswered = 1
          AND m.created_at >= :start_dt
          AND m.created_at < :end_dt
        ORDER BY m.created_at DESC
        LIMIT :top_n
    """)
    top_rows = (await db.execute(top_sql, {
        "start_dt": start_dt,
        "end_dt": end_dt,
        "top_n": top_n,
    })).all()

    top_unanswered = [
        UnansweredQuestionSchema(
            message_id=str(r.message_id),
            thread_id=str(r.thread_id),
            question=(r.question or "")[:500],
            ai_reply=(r.ai_reply or "")[:500],
            platform=r.platform,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in top_rows
    ]

    return AiCoverageResponseSchema(
        start_date=start.isoformat(),
        end_date=end.isoformat(),
        total=total_sum,
        unanswered=unans_sum,
        coverage_rate=_coverage(total_sum, unans_sum),
        daily=daily,
        top_unanswered=top_unanswered,
    )


# ---------------------------------------------------------------------------
# 完成訂單
# ---------------------------------------------------------------------------


class DailyOrderSchema(BaseModel):
    date: str  # YYYY-MM-DD
    count: int


class CompletedOrdersResponseSchema(BaseModel):
    start_date: str
    end_date: str
    total: int
    daily: List[DailyOrderSchema]


@router.get("/completed-orders", response_model=CompletedOrdersResponseSchema)
async def get_completed_orders(
    start_date: Optional[str] = Query(None, description="起始日期 YYYY-MM-DD（台灣時間，含）"),
    end_date: Optional[str] = Query(None, description="結束日期 YYYY-MM-DD（台灣時間，含）"),
    db: AsyncSession = Depends(get_db),
) -> CompletedOrdersResponseSchema:
    """
    完成訂單數統計（依 bookings.paid_at 計算）
    資料來源：閎運 callback status=paid 時寫入 bookings 表
    """
    today = date.today()
    end = _parse_date(end_date, today)
    start = _parse_date(start_date, end - timedelta(days=29))
    if start > end:
        start, end = end, start

    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end + timedelta(days=1), datetime.min.time())

    daily_sql = text("""
        SELECT DATE(paid_at) AS d, COUNT(*) AS n
        FROM bookings
        WHERE paid_at >= :start_dt AND paid_at < :end_dt
        GROUP BY DATE(paid_at)
        ORDER BY DATE(paid_at)
    """)
    rows = (await db.execute(daily_sql, {"start_dt": start_dt, "end_dt": end_dt})).all()

    daily: List[DailyOrderSchema] = []
    total = 0
    for row in rows:
        d_str = row.d.isoformat() if isinstance(row.d, date) else str(row.d)
        n = int(row.n or 0)
        total += n
        daily.append(DailyOrderSchema(date=d_str, count=n))

    return CompletedOrdersResponseSchema(
        start_date=start.isoformat(),
        end_date=end.isoformat(),
        total=total,
        daily=daily,
    )


# ---------------------------------------------------------------------------
# 待回覆對話（行動建議第 1 項）
# ---------------------------------------------------------------------------


class PendingConversationSchema(BaseModel):
    thread_id: str
    member_id: Optional[int] = None
    display_name: str
    avatar_url: Optional[str] = None
    question: str  # 使用者最後一筆提問內容
    question_at: str  # 使用者提問時間（ISO）
    reason: str  # 'no_reply'（使用者訊息未被回） | 'ai_unanswered'（AI 答不出）


class PendingConversationsResponseSchema(BaseModel):
    total: int
    items: List[PendingConversationSchema]


@router.get("/pending-conversations", response_model=PendingConversationsResponseSchema)
async def get_pending_conversations(
    limit: int = Query(50, ge=1, le=200, description="回傳筆數上限"),
    db: AsyncSession = Depends(get_db),
) -> PendingConversationsResponseSchema:
    """
    需人工介入的對話清單。邏輯同會員管理藍點：
    - 最後一筆是 incoming（使用者訊息未被回覆） OR
    - 最後一筆是 outgoing + message_source='gpt' + unanswered=1（AI 答不出）
    依「待處理時間」倒序，最新的在前。
    """
    sql = text("""
        WITH last_msg AS (
            SELECT thread_id, MAX(created_at) AS max_ts
            FROM conversation_messages
            WHERE platform = 'LINE' OR platform IS NULL
            GROUP BY thread_id
        ),
        pending AS (
            SELECT m.thread_id, m.created_at AS pending_since, m.direction,
                   m.message_source, m.unanswered
            FROM conversation_messages m
            JOIN last_msg lm
              ON m.thread_id = lm.thread_id AND m.created_at = lm.max_ts
            WHERE m.direction = 'incoming'
               OR (m.direction = 'outgoing'
                   AND m.message_source = 'gpt'
                   AND m.unanswered = 1)
        )
        SELECT p.thread_id, p.pending_since, p.direction, p.unanswered,
               (SELECT q.content FROM conversation_messages q
                WHERE q.thread_id = p.thread_id AND q.direction = 'incoming'
                ORDER BY q.created_at DESC LIMIT 1) AS question,
               (SELECT q.created_at FROM conversation_messages q
                WHERE q.thread_id = p.thread_id AND q.direction = 'incoming'
                ORDER BY q.created_at DESC LIMIT 1) AS question_at,
               mem.id AS member_id,
               mem.line_display_name,
               mem.name AS real_name,
               mem.line_avatar
        FROM pending p
        LEFT JOIN members mem ON mem.line_uid = p.thread_id
        ORDER BY p.pending_since DESC
        LIMIT :lim
    """)
    rows = (await db.execute(sql, {"lim": limit})).all()

    items: List[PendingConversationSchema] = []
    for r in rows:
        reason = "ai_unanswered" if (r.direction == "outgoing" and r.unanswered) else "no_reply"
        # 顯示會員暱稱（LINE profile display name），fallback 才用手動填入的姓名
        display_name = r.line_display_name or r.real_name or "未命名會員"
        question = (r.question or "").strip()
        # JSON payload（postback / sticker / image 等）→ 顯示簡化描述，避免 UI 塞爛字串
        if question.startswith("{"):
            import json as _json
            try:
                payload = _json.loads(question)
                if isinstance(payload, dict):
                    if payload.get("type") in ("image", "sticker"):
                        question = "（圖片或貼圖訊息）"
                    elif "data" in payload:
                        question = "（按鈕點擊事件）"
                    else:
                        question = "（系統事件）"
            except Exception:
                question = "（系統事件）"
        items.append(PendingConversationSchema(
            thread_id=str(r.thread_id),
            member_id=r.member_id,
            display_name=display_name,
            avatar_url=r.line_avatar,
            question=question[:300],
            question_at=r.question_at.isoformat() if r.question_at else "",
            reason=reason,
        ))

    # total = 符合條件的總筆數（不受 limit 影響）
    total_sql = text("""
        WITH last_msg AS (
            SELECT thread_id, MAX(created_at) AS max_ts
            FROM conversation_messages
            WHERE platform = 'LINE' OR platform IS NULL
            GROUP BY thread_id
        )
        SELECT COUNT(*)
        FROM conversation_messages m
        JOIN last_msg lm
          ON m.thread_id = lm.thread_id AND m.created_at = lm.max_ts
        WHERE m.direction = 'incoming'
           OR (m.direction = 'outgoing'
               AND m.message_source = 'gpt'
               AND m.unanswered = 1)
    """)
    total_row = (await db.execute(total_sql)).first()
    total = int(total_row[0]) if total_row else len(items)

    return PendingConversationsResponseSchema(total=total, items=items)


# ---------------------------------------------------------------------------
# 新增會員
# ---------------------------------------------------------------------------


class DailyMemberSchema(BaseModel):
    date: str  # YYYY-MM-DD
    count: int


class NewMembersResponseSchema(BaseModel):
    start_date: str
    end_date: str
    source: str
    total: int
    daily: List[DailyMemberSchema]


# source → WHERE 子句（未來新增 fb 彈窗、webchat 會員註冊流程時直接擴充這裡）
_MEMBER_SOURCE_WHERE = {
    "line": "line_uid IS NOT NULL AND line_uid <> ''",
    "fb": "fb_customer_id IS NOT NULL AND fb_customer_id <> ''",
    "webchat": "webchat_uid IS NOT NULL AND webchat_uid <> ''",
    "all": (
        "(line_uid IS NOT NULL AND line_uid <> '')"
        " OR (fb_customer_id IS NOT NULL AND fb_customer_id <> '')"
        " OR (webchat_uid IS NOT NULL AND webchat_uid <> '')"
    ),
}


@router.get("/new-members", response_model=NewMembersResponseSchema)
async def get_new_members(
    start_date: Optional[str] = Query(None, description="起始日期 YYYY-MM-DD（台灣時間，含）"),
    end_date: Optional[str] = Query(None, description="結束日期 YYYY-MM-DD（台灣時間，含）"),
    source: str = Query("line", description="渠道：line（預設）/ fb / webchat / all"),
    db: AsyncSession = Depends(get_db),
) -> NewMembersResponseSchema:
    """
    新增會員數統計（依 members.created_at 計算）
    - source=line：LINE 好友加入（現行唯一有真實資料的來源）
    - source=fb：Facebook 會員（預留，目前沒有彈窗導入流程）
    - source=webchat：Webchat 會員（預留，目前沒有註冊流程）
    - source=all：以上任一渠道
    """
    today = date.today()
    end = _parse_date(end_date, today)
    start = _parse_date(start_date, end - timedelta(days=29))
    if start > end:
        start, end = end, start

    where = _MEMBER_SOURCE_WHERE.get(source)
    if not where:
        # 未知 source 視為 line（安全 fallback，避免 SQL 注入風險）
        where = _MEMBER_SOURCE_WHERE["line"]
        source = "line"

    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end + timedelta(days=1), datetime.min.time())

    daily_sql = text(f"""
        SELECT DATE(created_at) AS d, COUNT(*) AS n
        FROM members
        WHERE ({where})
          AND created_at >= :start_dt AND created_at < :end_dt
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)
    rows = (await db.execute(daily_sql, {"start_dt": start_dt, "end_dt": end_dt})).all()

    daily: List[DailyMemberSchema] = []
    total = 0
    for row in rows:
        d_str = row.d.isoformat() if isinstance(row.d, date) else str(row.d)
        n = int(row.n or 0)
        total += n
        daily.append(DailyMemberSchema(date=d_str, count=n))

    return NewMembersResponseSchema(
        start_date=start.isoformat(),
        end_date=end.isoformat(),
        source=source,
        total=total,
        daily=daily,
    )
