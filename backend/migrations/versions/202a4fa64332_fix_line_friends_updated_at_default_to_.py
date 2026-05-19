r"""fix line_friends.updated_at default to bypass sqlalchemy reflection regex bug

Phase 2.7 — 清最後 1 項 ghost drift。

問題：alembic check 一直報 line_friends.updated_at comment 對不起來，
new=None / existing='更新時間'。但 model 跟 DB 兩邊 comment 其實都是 '更新時間'。

根因：SQLAlchemy 2.0.41 MySQL reflection 的 regex 對
  `DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '...'`
這個 pattern 解析錯誤，會把 COMMENT 整段吃進別的 group，導致 comment 回傳 None。

對照組 created_at 用 `DEFAULT CURRENT_TIMESTAMP` 不會出問題，因為走的是 regex 另一條
正常的 branch（CURRENT_TIMESTAMP 符合 [\-\w\.\(\)]+，NULL 走另一條 alt）。

解法：繞 bug，不打第三方套件 patch。
把 DEFAULT NULL 改成 DEFAULT CURRENT_TIMESTAMP，讓 regex 走能正確解析的 branch。

安全性已驗證：
  - codebase 0 處讀取 line_friends.updated_at
  - 0 處對該欄做 IS NULL 檢查
  - 現有資料 0 NULL（updated_at 一直被 trigger SP 用 NOW() 顯式寫入）
  - 唯一可觀察差異：未來 INSERT 不帶 updated_at 時從寫 NULL 改成 NOW()，ORM 路徑無影響

ALTER MODIFY 天然 idempotent。

Revision ID: 202a4fa64332
Revises: 1399bb6c7b2e
Create Date: 2026-05-19 16:17:43.191869

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '202a4fa64332'
down_revision: Union[str, None] = '1399bb6c7b2e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE line_friends MODIFY COLUMN updated_at
        DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
        COMMENT '更新時間'
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE line_friends MODIFY COLUMN updated_at
        DATETIME DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP
        COMMENT '更新時間'
    """)
