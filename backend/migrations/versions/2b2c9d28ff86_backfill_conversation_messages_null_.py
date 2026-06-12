"""backfill conversation_messages null status

status=NULL 的訊息會被已讀標記 UPDATE 的 `status != 'read'` 條件漏掉（SQL 三值邏輯），
導致這些訊息永遠不會標已讀。來源：backend line_notify.py 與 chatroom_service.append_message
建訊息時沒設 status（已修，與本 migration 一起進版）。
backfill：outgoing → 'sent'、incoming → 'received'，之後由使用者互動的啟發式標 'read'。
資料量小（dev 實查 142 筆 NULL），直接 UPDATE；WHERE status IS NULL 天然 idempotent。

Revision ID: 2b2c9d28ff86
Revises: 8232192e915c
Create Date: 2026-06-12 08:42:14.732011

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b2c9d28ff86'
down_revision: Union[str, None] = '8232192e915c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE conversation_messages SET status = 'sent' "
        "WHERE status IS NULL AND direction = 'outgoing'"
    )
    op.execute(
        "UPDATE conversation_messages SET status = 'received' "
        "WHERE status IS NULL AND direction = 'incoming'"
    )


def downgrade() -> None:
    # one-way：無法區分哪些 status 是本次 backfill 補上的，還原不破壞功能，僅留空
    pass
