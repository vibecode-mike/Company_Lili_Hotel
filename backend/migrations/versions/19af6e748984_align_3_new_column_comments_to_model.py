"""align_3_new_column_comments_to_model

對齊近期 Phase D 多 OA migration 帶來的 3 個 column comment drift。

承接 439a290f014e 的精神：dev 改 model 比改 DB 註解勤，DB 仍是化石。
本 migration 純改 DB 端 column comment，不動資料、不動型別、不動 nullable。

3 個對齊目標：
- ai_token_usages.channel_id：DB 空字串 → model 「所屬 LINE OA channel_id（多 OA 隔離）」
- faq_rules.channel_id：DB 空字串 → model 「所屬 LINE OA channel_id（多 OA 隔離）」
- webchat_site_channels.site_name：DB「顯示名稱（例：思偉達飯店｜雷恩館）」
  → model「顯示名稱（例：思偉達飯店｜雷恩館），方便後台識別」

Downgrade: no-op（原 DB comment 是 phase D migration 設的、非破壞性 drift）。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '19af6e748984'
down_revision: Union[str, None] = 'cec3c2a5f967'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'ai_token_usages', 'channel_id',
        existing_type=sa.String(length=100),
        existing_nullable=False,
        comment='所屬 LINE OA channel_id（多 OA 隔離）',
    )
    op.alter_column(
        'faq_rules', 'channel_id',
        existing_type=sa.String(length=100),
        existing_nullable=False,
        comment='所屬 LINE OA channel_id（多 OA 隔離）',
    )
    op.alter_column(
        'webchat_site_channels', 'site_name',
        existing_type=sa.String(length=100),
        existing_nullable=True,
        comment='顯示名稱（例：思偉達飯店｜雷恩館），方便後台識別',
    )


def downgrade() -> None:
    """No-op — 原 DB comment 是各時期化石，難以準確還原。"""
    pass
