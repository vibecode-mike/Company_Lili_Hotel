"""faq_pms_connections add hotelcode for multi-OA PMS routing

Revision ID: 0d71d1b59ca7
Revises: 0ef51a89c9bd
Create Date: 2026-05-15 15:19:25.197158

Phase E-1：每個 LINE OA 對應一個閎運 hotelcode（例：思偉達=ZH01、產設未來=ZHxx）。
- 帳密 / API URL 環境共用（env vars，全環境同一組）
- hotelcode per channel 存 DB（這支 migration）
- query_pms 之後改成帶當前 channel 的 hotelcode（Phase E-2 程式碼層）

設計：nullable，允許「該 OA 暫不需 PMS」狀態。當 status='disabled' 或 hotelcode IS NULL，
chatbot 就走 FAQ KB fallback，不會嘗試 PMS call。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d71d1b59ca7'
down_revision: Union[str, None] = '0ef51a89c9bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'faq_pms_connections',
        sa.Column(
            'hotelcode',
            sa.String(length=50),
            nullable=True,
            comment='閎運 PMS hotelcode（例：ZH01）。NULL = 該 OA 暫不接 PMS',
        ),
    )


def downgrade() -> None:
    op.drop_column('faq_pms_connections', 'hotelcode')
