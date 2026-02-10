"""
台北時間格式化工具

提供統一的時間格式化函式，確保全系統使用一致的中文時段顯示。
規則：naive datetime 一律視為台北本地時間（MySQL NOW() 和 line_app 皆存本地時間）。
"""
from datetime import datetime
from typing import Optional

from zoneinfo import ZoneInfo

TAIPEI_TZ = ZoneInfo("Asia/Taipei")


def ensure_taipei_aware(dt: datetime) -> datetime:
    """
    將 datetime 轉為台北時區 aware datetime。

    - naive datetime: 視為台北本地時間，直接附加時區資訊
    - aware datetime: 轉換至台北時區

    Args:
        dt: 任意 datetime

    Returns:
        台北時區的 aware datetime
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=TAIPEI_TZ)
    return dt.astimezone(TAIPEI_TZ)


def format_taipei_time(dt: Optional[datetime]) -> str:
    """
    將 datetime 格式化為中文時段字串，例如「上午 10:30」。

    時段劃分：
      凌晨 (00:00-05:59), 上午 (06:00-11:59), 中午 (12:00-13:59),
      下午 (14:00-17:59), 晚上 (18:00-23:59)

    Args:
        dt: datetime (naive 視為台北本地時間, aware 會轉換至台北時區)

    Returns:
        格式化字串，例如「上午 10:30」；dt 為 None 時回傳空字串
    """
    if dt is None:
        return ""

    local_dt = ensure_taipei_aware(dt)
    hour = local_dt.hour
    minute = local_dt.minute

    if hour < 6:
        period = "凌晨"
    elif hour < 12:
        period = "上午"
    elif hour < 14:
        period = "中午"
    elif hour < 18:
        period = "下午"
    else:
        period = "晚上"

    hour_12 = hour % 12
    if hour_12 == 0:
        hour_12 = 12

    return f"{period} {hour_12:02d}:{minute:02d}"


def to_taipei_isoformat(dt: Optional[datetime]) -> Optional[str]:
    """
    將 datetime 轉為台北時區的 ISO 8601 字串。

    Args:
        dt: datetime (naive 視為台北本地時間, aware 會轉換至台北時區)

    Returns:
        ISO 格式字串，例如「2025-06-10T15:30:00+08:00」；dt 為 None 時回傳 None
    """
    if dt is None:
        return None
    return ensure_taipei_aware(dt).isoformat()
