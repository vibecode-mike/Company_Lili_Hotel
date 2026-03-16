"""
Behave environment hooks for chatbot E2E tests.
Target: /data2/lili_hotel/backend/app/ (FastAPI + async SQLAlchemy + MySQL)
API: http://localhost:8700  (backend must be running)
Note: Chatbot sessions are in-memory on the server, no DB setup needed.
"""
from __future__ import annotations

import uuid
from types import SimpleNamespace

import requests


API_BASE = "http://localhost:8700/api/v1"


def before_all(context):
    """全域初始化：確認後端可連線。"""
    context.api_base = API_BASE
    # 嘗試連線確認後端存在
    try:
        requests.get(f"{API_BASE}/chatbot/rooms", params={
            "browser_key": "healthcheck",
            "checkin_date": "2099-01-01",
            "checkout_date": "2099-01-02",
            "adults": 1,
        }, timeout=5)
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            f"無法連線後端 {API_BASE}，請先啟動 backend (uvicorn app.main:app --port 8700)"
        )


def before_scenario(context, scenario):
    """每個 scenario 前重置狀態。"""
    context.last_response = None
    context.last_error = None
    context.query_result = None
    context.ids = {}
    context.memo = {
        "browser_key": str(uuid.uuid4()),  # 預設產生唯一 browser_key
    }
    context.repos = SimpleNamespace()
    context.services = SimpleNamespace()


def after_scenario(context, scenario):
    """每個 scenario 後清理：reset chatbot session。"""
    browser_key = context.memo.get("browser_key")
    if browser_key:
        try:
            requests.post(
                f"{context.api_base}/chatbot/session/reset",
                json={"browser_key": browser_key},
                timeout=5,
            )
        except Exception:
            pass
