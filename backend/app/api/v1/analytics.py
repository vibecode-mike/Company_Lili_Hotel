"""
數據洞察 API — 數據洞察頁（InsightsPanel）使用

目前提供：
- GET /analytics/ai-coverage — AI 覆蓋率（可回答訊息 / AI 總訊息數）
- GET /analytics/completed-orders — 完成訂單數（依 bookings.paid_at 計算）
- GET /analytics/pending-conversations — 需人工介入的對話清單（待回覆 + AI 答不出）
- GET /analytics/new-members — 新增會員數（預設 source=line，未來可擴充 fb/webchat/all）
- GET /analytics/time-slot-insights — 時段洞察 heatmap（每日 × 4hr 時段的不重複觸發標籤會員數）

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


# ---------------------------------------------------------------------------
# 時段洞察 heatmap
# ---------------------------------------------------------------------------


class TimeSlotInsightsResponseSchema(BaseModel):
    start_date: str  # 滾動 7 天的起日（含）
    end_date: str  # 滾動 7 天的迄日（含）
    channel: str  # line / facebook / webchat
    total_unique_members: int  # 7 天內至少觸發過一次標籤的不重複會員人數
    dates: List[str]  # 7 天日期（YYYY-MM-DD）
    weekdays: List[str]  # 對應週幾（一~日）
    # 6 列（時段 0:00/4:00/8:00/12:00/16:00/20:00）× 7 欄（日期）
    # 每 cell = 該時段該天有觸發標籤的不重複會員人數
    matrix: List[List[int]]


_CHANNEL_WHERE = {
    "line": "m.line_uid IS NOT NULL AND m.line_uid <> ''",
    "facebook": "m.fb_customer_id IS NOT NULL AND m.fb_customer_id <> ''",
    "webchat": "m.webchat_uid IS NOT NULL AND m.webchat_uid <> ''",
}

_WEEKDAY_ZH = ["一", "二", "三", "四", "五", "六", "日"]


@router.get("/time-slot-insights", response_model=TimeSlotInsightsResponseSchema)
async def get_time_slot_insights(
    channel: str = Query("line", description="渠道：line / facebook / webchat"),
    end_date: Optional[str] = Query(None, description="滾動 7 天的結束日期（含），預設為昨天"),
    db: AsyncSession = Depends(get_db),
) -> TimeSlotInsightsResponseSchema:
    """
    時段洞察 heatmap：6 時段 × 7 天，每格為該時段該天至少觸發過一次標籤的不重複會員人數。
    資料來源 tag_trigger_logs（AI 自動打標 / 點擊 / 手動）。
    """
    where_clause = _CHANNEL_WHERE.get(channel) or _CHANNEL_WHERE["line"]
    if channel not in _CHANNEL_WHERE:
        channel = "line"

    today = date.today()
    # 預設 end_date = 今天，7 天區間含今天（today-6 ~ today）
    end = _parse_date(end_date, today)
    start = end - timedelta(days=6)

    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end + timedelta(days=1), datetime.min.time())

    # 每個（日期、4hr 時段）算 COUNT(DISTINCT member_id）
    sql = text(f"""
        SELECT DATE(t.triggered_at) AS d,
               FLOOR(HOUR(t.triggered_at) / 4) AS block,
               COUNT(DISTINCT t.member_id) AS n
        FROM tag_trigger_logs t
        JOIN members m ON m.id = t.member_id
        WHERE t.triggered_at >= :start_dt AND t.triggered_at < :end_dt
          AND ({where_clause})
        GROUP BY DATE(t.triggered_at), FLOOR(HOUR(t.triggered_at) / 4)
    """)
    rows = (await db.execute(sql, {"start_dt": start_dt, "end_dt": end_dt})).all()

    # 初始化 6x7 全 0 矩陣
    matrix: List[List[int]] = [[0] * 7 for _ in range(6)]
    dates: List[str] = [(start + timedelta(days=i)).isoformat() for i in range(7)]
    weekdays: List[str] = [_WEEKDAY_ZH[(start + timedelta(days=i)).weekday()] for i in range(7)]
    date_index = {d: i for i, d in enumerate(dates)}

    for row in rows:
        d_str = row.d.isoformat() if isinstance(row.d, date) else str(row.d)
        col = date_index.get(d_str)
        block = int(row.block or 0)
        if col is not None and 0 <= block < 6:
            matrix[block][col] = int(row.n or 0)

    # 7 天總不重複會員數（不論時段）
    total_sql = text(f"""
        SELECT COUNT(DISTINCT t.member_id) AS n
        FROM tag_trigger_logs t
        JOIN members m ON m.id = t.member_id
        WHERE t.triggered_at >= :start_dt AND t.triggered_at < :end_dt
          AND ({where_clause})
    """)
    total_row = (await db.execute(total_sql, {"start_dt": start_dt, "end_dt": end_dt})).first()
    total_unique = int(total_row.n) if total_row and total_row.n else 0

    return TimeSlotInsightsResponseSchema(
        start_date=start.isoformat(),
        end_date=end.isoformat(),
        channel=channel,
        total_unique_members=total_unique,
        dates=dates,
        weekdays=weekdays,
        matrix=matrix,
    )


# ---------------------------------------------------------------------------
# 時段洞察 — 互動旅程明細
# ---------------------------------------------------------------------------


class JourneyTagSchema(BaseModel):
    tag: str  # 標籤名
    conversation: int  # 對話 distinct member 數（trigger_source=INTERACTION）
    interaction: int  # 互動 distinct member 數（trigger_source=CLICK）
    conversion: int  # 轉單 distinct member 數（trigger_source=CONVERSION）
    total: int  # conversation + interaction + conversion
    last_triggered_at: str  # 該標籤在範圍內最近一次被觸發的時間（ISO）


class TimeSlotDetailResponseSchema(BaseModel):
    start_date: str
    end_date: str
    channel: str
    scope: str  # "range" = 整個 7 天 / "cell" = 單一格
    cell_date: Optional[str] = None  # scope=cell 時為該格日期
    cell_block: Optional[int] = None  # scope=cell 時為時段 index 0..5
    total_unique_members: int  # 該範圍 distinct member 數（不分 source）
    tags: List[JourneyTagSchema]


# trigger_source → tab key
_SOURCE_TO_TAB = {
    "INTERACTION": "conversation",
    "CLICK": "interaction",
    "CONVERSION": "conversion",
}


@router.get("/time-slot-detail", response_model=TimeSlotDetailResponseSchema)
async def get_time_slot_detail(
    channel: str = Query("line", description="渠道：line / facebook / webchat"),
    end_date: Optional[str] = Query(None, description="滾動 7 天的結束日期（含），預設為今天"),
    cell_date: Optional[str] = Query(None, description="若提供，僅統計該日期"),
    cell_block: Optional[int] = Query(None, ge=0, le=5, description="若提供，僅統計該時段（0=00:00,1=04:00,...,5=20:00）"),
    db: AsyncSession = Depends(get_db),
) -> TimeSlotDetailResponseSchema:
    """
    互動旅程明細：
    - 不傳 cell_date/cell_block → 整個 7 天範圍
    - 傳完整的 cell_date + cell_block → 單一格 4 小時範圍
    每個 tag 計算 distinct member 數（依 trigger_source 拆三組：對話/互動/轉單）
    排序：total desc，同 total 比 last_triggered_at desc
    只取「對話/互動/轉單」三種 trigger_source，MANUAL 不計
    """
    where_clause = _CHANNEL_WHERE.get(channel) or _CHANNEL_WHERE["line"]
    if channel not in _CHANNEL_WHERE:
        channel = "line"

    today = date.today()
    end = _parse_date(end_date, today)
    start = end - timedelta(days=6)

    # 決定 scope（單格或全 7 天）
    if cell_date and cell_block is not None:
        d = _parse_date(cell_date, end)
        block_start = datetime.combine(d, datetime.min.time()) + timedelta(hours=cell_block * 4)
        block_end = block_start + timedelta(hours=4)
        scope_start = block_start
        scope_end = block_end
        scope = "cell"
        scope_cell_date: Optional[str] = d.isoformat()
        scope_cell_block: Optional[int] = cell_block
    else:
        scope_start = datetime.combine(start, datetime.min.time())
        scope_end = datetime.combine(end + timedelta(days=1), datetime.min.time())
        scope = "range"
        scope_cell_date = None
        scope_cell_block = None

    # 一次撈出三類 source 的 (tag_name, trigger_source, distinct_member_count, last_triggered_at)
    sql = text(f"""
        SELECT t.tag_name AS tag,
               t.trigger_source AS src,
               COUNT(DISTINCT t.member_id) AS n,
               MAX(t.triggered_at) AS last_at
        FROM tag_trigger_logs t
        JOIN members m ON m.id = t.member_id
        WHERE t.triggered_at >= :start_dt AND t.triggered_at < :end_dt
          AND t.trigger_source IN ('INTERACTION', 'CLICK', 'CONVERSION')
          AND t.tag_name <> ''
          AND ({where_clause})
        GROUP BY t.tag_name, t.trigger_source
    """)
    rows = (await db.execute(sql, {"start_dt": scope_start, "end_dt": scope_end})).all()

    # 聚合到 tag 為 key
    bucket: dict = {}
    for row in rows:
        tag = (row.tag or "").strip()
        if not tag:
            continue
        src = (row.src or "").upper()
        tab_key = _SOURCE_TO_TAB.get(src)
        if not tab_key:
            continue
        entry = bucket.setdefault(
            tag,
            {"conversation": 0, "interaction": 0, "conversion": 0, "last_at": None},
        )
        entry[tab_key] = int(row.n or 0)
        last_at = row.last_at
        if last_at and (entry["last_at"] is None or last_at > entry["last_at"]):
            entry["last_at"] = last_at

    # 整理 + 排序：total desc, last_at desc, tag asc
    raw_tags = []
    for tag, e in bucket.items():
        total = e["conversation"] + e["interaction"] + e["conversion"]
        last_at = e["last_at"] or scope_start
        raw_tags.append((tag, e, total, last_at))
    # ISO 字串字典序 == 時間先後序，取負 timestamp 簡化排序
    raw_tags.sort(key=lambda x: (-x[2], -x[3].timestamp(), x[0]))

    tags: List[JourneyTagSchema] = [
        JourneyTagSchema(
            tag=tag,
            conversation=e["conversation"],
            interaction=e["interaction"],
            conversion=e["conversion"],
            total=total,
            last_triggered_at=last_at.isoformat(),
        )
        for tag, e, total, last_at in raw_tags
    ]

    # range 內 distinct member 數（不分 source，跟 heatmap 的 total_unique_members 同義）
    total_sql = text(f"""
        SELECT COUNT(DISTINCT t.member_id) AS n
        FROM tag_trigger_logs t
        JOIN members m ON m.id = t.member_id
        WHERE t.triggered_at >= :start_dt AND t.triggered_at < :end_dt
          AND t.trigger_source IN ('INTERACTION', 'CLICK', 'CONVERSION')
          AND ({where_clause})
    """)
    total_row = (await db.execute(total_sql, {"start_dt": scope_start, "end_dt": scope_end})).first()
    total_unique = int(total_row.n) if total_row and total_row.n else 0

    return TimeSlotDetailResponseSchema(
        start_date=start.isoformat(),
        end_date=end.isoformat(),
        channel=channel,
        scope=scope,
        cell_date=scope_cell_date,
        cell_block=scope_cell_block,
        total_unique_members=total_unique,
        tags=tags,
    )
