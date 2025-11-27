# db.py
# 共用資料庫模組 - 統一管理資料庫連線與操作
# ============================================================
"""
提供統一的資料庫連線池和 helper 函數。

使用方式:
    from db import engine, fetchone, fetchall, execute
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from config import DATABASE_URL, MYSQL_DB

# -------------------------------------------------
# 資料庫引擎 (單例)
# -------------------------------------------------
engine: Engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    future=True,
)


# -------------------------------------------------
# 資料庫 Helper 函數
# -------------------------------------------------
def fetchone(sql: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    執行 SQL 查詢並回傳第一筆結果。

    Args:
        sql: SQL 查詢字串 (使用 :param 語法綁定參數)
        params: 參數字典

    Returns:
        查詢結果 (dict) 或 None
    """
    with engine.begin() as conn:
        result = conn.execute(text(sql), params or {}).mappings().first()
        return dict(result) if result else None


def fetchall(sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    執行 SQL 查詢並回傳所有結果。

    Args:
        sql: SQL 查詢字串 (使用 :param 語法綁定參數)
        params: 參數字典

    Returns:
        查詢結果列表 (list of dict)
    """
    with engine.begin() as conn:
        return [dict(r) for r in conn.execute(text(sql), params or {}).mappings().all()]


def execute(sql: str, params: Optional[Dict[str, Any]] = None) -> None:
    """
    執行 SQL 語句 (INSERT, UPDATE, DELETE 等)。

    Args:
        sql: SQL 語句字串 (使用 :param 語法綁定參數)
        params: 參數字典
    """
    with engine.begin() as conn:
        conn.execute(text(sql), params or {})


def execute_returning_lastid(sql: str, params: Optional[Dict[str, Any]] = None) -> int:
    """
    執行 INSERT 語句並回傳 LAST_INSERT_ID。

    Args:
        sql: INSERT SQL 語句
        params: 參數字典

    Returns:
        新插入資料的 ID
    """
    with engine.begin() as conn:
        conn.execute(text(sql), params or {})
        result = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        return int(result) if result else 0


# -------------------------------------------------
# Schema 查詢 Helper
# -------------------------------------------------
def table_has_column(table: str, column: str) -> bool:
    """
    檢查資料表是否有指定欄位。

    Args:
        table: 資料表名稱
        column: 欄位名稱

    Returns:
        True 如果欄位存在
    """
    with engine.begin() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :t AND COLUMN_NAME = :c
        """), {"db": MYSQL_DB, "t": table, "c": column}).scalar()
    return bool(result)


def column_is_required(table: str, column: str) -> bool:
    """
    檢查欄位是否為必填 (NOT NULL 且無預設值)。

    Args:
        table: 資料表名稱
        column: 欄位名稱

    Returns:
        True 如果欄位為必填
    """
    with engine.begin() as conn:
        result = conn.execute(text("""
            SELECT IS_NULLABLE, COLUMN_DEFAULT
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :t AND COLUMN_NAME = :c
        """), {"db": MYSQL_DB, "t": table, "c": column}).mappings().first()
    if not result:
        return False
    return result["IS_NULLABLE"] == "NO" and result["COLUMN_DEFAULT"] is None
