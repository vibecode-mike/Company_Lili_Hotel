"""
PMS client helpers for chatbot booking flow.
"""

from __future__ import annotations

import hashlib
from datetime import datetime
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

import requests

from app.config import settings


def _pms_api_url() -> str:
    return settings.PMS_API_URL

def _pms_account() -> str:
    return settings.PMS_ACCOUNT

def _pms_secret() -> str:
    return settings.PMS_SECRET

def _pms_hotelcode() -> str:
    return settings.PMS_HOTELCODE

def _pms_booking_base_url() -> str:
    return settings.PMS_BOOKING_BASE_URL

def _booking_source() -> str:
    return settings.BOOKING_SOURCE


def taipei_timestamp() -> str:
    now = datetime.now(ZoneInfo("Asia/Taipei"))
    return now.strftime("%Y-%m-%d %H:%M:%S")


def md5_hex(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest()


def _ensure_pms_settings(hotelcode: str | None = None) -> str:
    """檢查 PMS 必要設定，回傳 effective hotelcode。

    hotelcode 為 None 時 fallback 到 env PMS_HOTELCODE（向下相容 / 沒帶 channel 時用）。
    回傳值是要實際用來呼叫 PMS 的 hotelcode（**不會** mutate env）。
    """
    effective = (hotelcode or _pms_hotelcode() or "").strip()
    missing = []
    if not _pms_api_url():
        missing.append("PMS_API_URL")
    if not _pms_account():
        missing.append("PMS_ACCOUNT")
    if not _pms_secret():
        missing.append("PMS_SECRET")
    if not effective:
        missing.append("hotelcode (該 LINE OA 未設定 + env 也空)")
    if missing:
        raise ValueError(f"PMS 缺少必要設定：{', '.join(missing)}")
    return effective


def pms_enabled() -> bool:
    """Check if PMS env credentials are configured (env vars only — hotelcode 改成 per channel 後僅供 fallback)."""
    return bool(_pms_api_url() and _pms_account() and _pms_secret())


def query_pms(
    startdate: str,
    enddate: str,
    roomtype: str | None = None,
    housingcnt: int = 2,
    hotelcode: str | None = None,
) -> dict:
    """查 PMS 房況。hotelcode 為 None 時 fallback 到 env PMS_HOTELCODE。"""
    effective_hotelcode = _ensure_pms_settings(hotelcode)

    housingcnt = int(housingcnt or 2)
    ts = taipei_timestamp()
    password = md5_hex(f"{_pms_secret()}{ts}")
    payload = {
        "account": _pms_account(),
        "password": password,
        "timestamp": ts,
        "hotelcode": effective_hotelcode,
        "startdate": startdate,
        "enddate": enddate,
        "housingcnt": housingcnt,
        "roomtype": roomtype or "",
    }
    response = requests.post(_pms_api_url(), json=payload, timeout=20, verify=True)
    response.raise_for_status()
    try:
        return response.json()
    except Exception:
        return {"raw_text": response.text}


def query_pms_all_roomtypes(
    startdate: str,
    enddate: str,
    hotelcode: str | None = None,
) -> dict:
    # 閎運 PMS 行為怪：
    #   - 不送 housingcnt（依官方 post.php 範例）→ 回所有 11 個房型（含 TT/KK），但近期日期會回 "Session halted."
    #   - 送 housingcnt=N → 只回 N 人房，但任何日期都穩
    # 所以三招都打、合併去重：不送 + housingcnt=2 + housingcnt=4。任一招失敗不影響其他招。
    effective_hotelcode = _ensure_pms_settings(hotelcode)

    merged: dict[str, dict] = {}
    resp_hotelcode = None
    base_payload = {
        "account": _pms_account(),
        "hotelcode": effective_hotelcode,
        "startdate": startdate,
        "enddate": enddate,
        "roomtype": "",
    }
    variants: list[dict] = [{}, {"housingcnt": 2}, {"housingcnt": 4}]
    for extra in variants:
        ts = taipei_timestamp()
        payload = {
            **base_payload,
            "password": md5_hex(f"{_pms_secret()}{ts}"),
            "timestamp": ts,
            **extra,
        }
        try:
            response = requests.post(_pms_api_url(), json=payload, timeout=20, verify=True)
            response.raise_for_status()
            data = response.json()
        except Exception:
            continue
        if resp_hotelcode is None:
            resp_hotelcode = data.get("hotelcode")
        for room in data.get("room") or []:
            code = room.get("roomtype")
            if not code:
                continue
            existing = merged.get(code)
            # 偏好「有 data 庫存資料」的版本（housingcnt=N 撈到的會有 remain/price）
            new_has_data = bool(room.get("data"))
            existing_has_data = bool(existing and existing.get("data"))
            if existing is None or (new_has_data and not existing_has_data):
                merged[code] = room

    return {"hotelcode": resp_hotelcode, "room": list(merged.values())}


def build_booking_url(
    *,
    checkin: str,
    checkout: str,
    rooms: int,
    adults: int,
    children: int,
    room_type: str,
    guest_name: str,
    phone: str,
    email: str,
) -> str:
    base = _pms_booking_base_url()
    if not base:
        raise ValueError("PMS_BOOKING_BASE_URL 未設定")

    params = urlencode(
        {
            "checkin": checkin,
            "checkout": checkout,
            "rooms": rooms,
            "adults": adults,
            "children": children,
            "room_type": room_type,
            "guest_name": guest_name,
            "phone": phone,
            "email": email,
            "source": _booking_source(),
        },
        encoding="utf-8",
    )
    return f"{base}?{params}"
