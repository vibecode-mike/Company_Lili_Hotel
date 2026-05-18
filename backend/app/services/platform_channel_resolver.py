"""
標籤系統的 (platform, channel_id) 推導器

集中決定一個 Member 對應的平台與頻道 ID，避免散落各處的判斷邏輯。

規則：
- 只綁 LINE → ('LINE', member.line_channel_id)
- 只綁 Facebook → ('Facebook', None)  — members 表沒有 fb_channel_id 欄位，待補
- 只綁 Webchat → ('Webchat', member.line_channel_id)
    Webchat 訪客 register 時就把 site_id 映射回 LINE OA channel_id 寫進 line_channel_id，
    這裡用 line_channel_id 而非 webchat_site_id，讓 tag_trigger_logs / member_tags 等
    channel_id 欄位跨平台統一用 LINE OA channel_id 為 key，多 OA 隔離與 analytics 才對得齊
- 多平台或無法決定 → (None, None)，由呼叫端決定

之後若需要區分「最近互動的平台」（例如 LINE 也綁 FB，新行為從 LINE 來），
請在呼叫端用更明確的訊號（webhook channel）覆寫。
"""
from typing import Tuple, Optional

from app.models.member import Member


def resolve_for_member(member: Optional[Member]) -> Tuple[Optional[str], Optional[str]]:
    """
    依 member 的平台綁定狀態推導 (platform, channel_id)。
    若無法決定（多平台 / 完全沒綁），回傳 (None, None)。
    """
    if member is None:
        return None, None

    has_line = bool(member.line_uid)
    has_fb = bool(getattr(member, "fb_customer_id", None))
    has_webchat = bool(getattr(member, "webchat_uid", None))

    bound_count = sum([has_line, has_fb, has_webchat])
    if bound_count != 1:
        # 多平台或沒綁 — 交給呼叫端決定
        return None, None

    if has_line:
        return "LINE", member.line_channel_id
    if has_fb:
        return "Facebook", None
    if has_webchat:
        return "Webchat", getattr(member, "line_channel_id", None)

    return None, None
