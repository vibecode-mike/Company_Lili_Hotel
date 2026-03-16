# config.py
# 共用配置模組 - 統一管理環境變數和資料庫連線
# ============================================================
"""
統一管理 line_app 所有模組的配置參數。

使用方式:
    from config import (
        DATABASE_URL,
        LINE_CHANNEL_SECRET,
        LINE_CHANNEL_ACCESS_TOKEN,
        PUBLIC_BASE,
        LIFF_ID_OPEN,
    )
"""
from __future__ import annotations

import os
from urllib.parse import quote_plus
from pathlib import Path

from dotenv import load_dotenv

# 載入 .env 檔案
load_dotenv()

# 專案根目錄
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# -------------------------------------------------
# 公開 URL 配置
# -------------------------------------------------
PUBLIC_BASE = (os.getenv("PUBLIC_BASE") or "").rstrip("/")

# -------------------------------------------------
# LINE 相關配置
# -------------------------------------------------
LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET", "")
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
LIFF_ID = os.getenv("LIFF_ID", "").strip()
LIFF_ID_OPEN = os.getenv("LIFF_ID_OPEN", "").strip()
DEFAULT_LIFF_ID = os.getenv("DEFAULT_LIFF_ID", "").strip()
DEFAULT_MEMBER_FORM_URL = os.getenv(
    "DEFAULT_MEMBER_FORM_URL",
    f"{PUBLIC_BASE}/uploads/member_form.html"
)

# -------------------------------------------------
# 資料庫配置
# -------------------------------------------------
def _require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value

DB_USER = _require_env("DB_USER")
DB_PASS = _require_env("DB_PASS")
DB_HOST = _require_env("DB_HOST")
DB_NAME = _require_env("DB_NAME")
try:
    DB_PORT = int(_require_env("DB_PORT"))
except ValueError as exc:
    raise RuntimeError("DB_PORT must be an integer") from exc

# 向後相容：其他模組仍匯入 MYSQL_DB
MYSQL_DB = DB_NAME

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASS)}@"
    f"{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)

# -------------------------------------------------
# 檔案儲存配置
# -------------------------------------------------
ASSET_LOCAL_DIR = os.getenv(
    "ASSET_LOCAL_DIR",
    str(PROJECT_ROOT / "backend" / "public" / "uploads")
)
ASSET_ROUTE_PREFIX = "/uploads"

# -------------------------------------------------
# 功能開關
# -------------------------------------------------
AUTO_BACKFILL_FRIENDS = os.getenv("AUTO_BACKFILL_FRIENDS", "1") == "1"
