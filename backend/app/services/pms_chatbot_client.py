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


def _ensure_pms_settings() -> None:
    missing = []
    if not _pms_api_url():
        missing.append("PMS_API_URL")
    if not _pms_account():
        missing.append("PMS_ACCOUNT")
    if not _pms_secret():
        missing.append("PMS_SECRET")
    if not _pms_hotelcode():
        missing.append("PMS_HOTELCODE")
    if missing:
        raise ValueError(f"PMS 缺少必要設定：{', '.join(missing)}")


def pms_enabled() -> bool:
    """Check if PMS is configured."""
    return bool(_pms_api_url() and _pms_account() and _pms_secret() and _pms_hotelcode())


def query_pms(
    startdate: str,
    enddate: str,
    roomtype: str | None = None,
    housingcnt: int = 2,
) -> dict:
    _ensure_pms_settings()

    housingcnt = int(housingcnt or 2)
    ts = taipei_timestamp()
    password = md5_hex(f"{_pms_secret()}{ts}")
    payload = {
        "account": _pms_account(),
        "password": password,
        "timestamp": ts,
        "hotelcode": _pms_hotelcode(),
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


def query_pms_all_roomtypes(startdate: str, enddate: str) -> dict:
    _ensure_pms_settings()

    ts = taipei_timestamp()
    password = md5_hex(f"{_pms_secret()}{ts}")
    payload = {
        "account": _pms_account(),
        "password": password,
        "timestamp": ts,
        "hotelcode": _pms_hotelcode(),
        "startdate": startdate,
        "enddate": enddate,
        "housingcnt": "",
        "roomtype": "",
    }
    response = requests.post(_pms_api_url(), json=payload, timeout=20, verify=True)
    response.raise_for_status()
    try:
        return response.json()
    except Exception:
        return {"raw_text": response.text}


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
