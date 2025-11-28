"""add_gpt_enabled_to_members_manual

Revision ID: b796d5937f3f
Revises: 17004499ac90
Create Date: 2025-11-29 01:25:22.351414

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b796d5937f3f'
down_revision: Union[str, None] = '17004499ac90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增 gpt_enabled 欄位到 members 表 (預設 True)
    op.add_column('members', sa.Column('gpt_enabled', sa.Boolean(), nullable=False, server_default='1', comment='是否啟用 GPT 自動回應'))


def downgrade() -> None:
    # 移除 gpt_enabled 欄位
    op.drop_column('members', 'gpt_enabled')
