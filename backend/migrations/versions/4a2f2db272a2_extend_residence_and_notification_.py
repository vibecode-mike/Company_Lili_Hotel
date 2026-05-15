"""extend_residence_and_notification_message_length

Revision ID: 4a2f2db272a2
Revises: 6fe52f7a5208
Create Date: 2026-05-15 18:03:00.269157

擴 DB 兩個欄位長度對齊 model 期望，避免 model String(N) 比 DB VARCHAR(M) 寬時，
長字串到 DB 才被拒絕：

- members.residence VARCHAR(10) → 100（model 早已是 String(100)）
- message_templates.notification_message VARCHAR(100) → 500
  （model 早已是 String(500)）

純擴展，既有資料不會 truncate。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a2f2db272a2'
down_revision: Union[str, None] = '6fe52f7a5208'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'members', 'residence',
        existing_type=sa.String(length=10),
        type_=sa.String(length=100),
        existing_nullable=True,
        existing_comment='居住地',
    )
    op.alter_column(
        'message_templates', 'notification_message',
        existing_type=sa.String(length=100),
        type_=sa.String(length=500),
        existing_nullable=True,
        existing_comment='通知推播訊息（顯示在手機通知欄）',
    )


def downgrade() -> None:
    """警告：若期間有 row 寫入超過原 length 的字串，downgrade 會 truncate / fail。"""
    op.alter_column(
        'members', 'residence',
        existing_type=sa.String(length=100),
        type_=sa.String(length=10),
        existing_nullable=True,
        existing_comment='居住地',
    )
    op.alter_column(
        'message_templates', 'notification_message',
        existing_type=sa.String(length=500),
        type_=sa.String(length=100),
        existing_nullable=True,
        existing_comment='通知推播訊息（顯示在手機通知欄）',
    )
