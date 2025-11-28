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
# OpenAI 相關配置
# -------------------------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
MEMORY_TURNS = int(os.getenv("MEMORY_TURNS", "5"))

# -------------------------------------------------
# 資料庫配置
# -------------------------------------------------
MYSQL_USER = os.getenv("MYSQL_USER", os.getenv("DB_USER", "root"))
MYSQL_PASS = os.getenv("MYSQL_PASS", os.getenv("DB_PASS", "123456"))
MYSQL_HOST = os.getenv("MYSQL_HOST", os.getenv("DB_HOST", "192.168.50.123"))
MYSQL_PORT = int(os.getenv("MYSQL_PORT", os.getenv("DB_PORT", "3306")))
MYSQL_DB = os.getenv("MYSQL_DB", os.getenv("DB_NAME", "lili_hotel"))

DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{quote_plus(MYSQL_PASS)}@"
    f"{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
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
