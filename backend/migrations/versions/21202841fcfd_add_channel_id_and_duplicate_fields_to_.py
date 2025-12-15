"""add_channel_id_and_duplicate_fields_to_auto_response

Revision ID: 21202841fcfd
Revises: 22eb99d76f63
Create Date: 2025-12-13 02:42:37.986406

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '21202841fcfd'
down_revision: Union[str, None] = '22eb99d76f63'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new fields to auto_responses table
    op.add_column('auto_responses', sa.Column(
        'channel_id',
        sa.String(length=100),
        nullable=True,
        comment='渠道ID（LINE channel ID 或 FB page ID），用於帳號級別的歡迎訊息/一律回應管理'
    ))
    op.add_column('auto_responses', sa.Column(
        'version',
        sa.Integer(),
        nullable=True,
        server_default='1',
        comment='版本號，用於追蹤編輯歷史'
    ))
    op.add_column('auto_responses', sa.Column(
        'is_duplicate',
        sa.Boolean(),
        nullable=True,
        server_default='0',
        comment='是否為重複的關鍵字（被更新版本覆蓋）'
    ))
    op.create_index(op.f('ix_auto_responses_channel_id'), 'auto_responses', ['channel_id'], unique=False)

    # Add is_duplicate field to auto_response_keywords table
    op.add_column('auto_response_keywords', sa.Column(
        'is_duplicate',
        sa.Boolean(),
        nullable=True,
        server_default='0',
        comment='是否為重複關鍵字（與其他自動回應衝突，以最新版本觸發）'
    ))


def downgrade() -> None:
    # Remove fields from auto_response_keywords
    op.drop_column('auto_response_keywords', 'is_duplicate')

    # Remove fields from auto_responses
    op.drop_index(op.f('ix_auto_responses_channel_id'), table_name='auto_responses')
    op.drop_column('auto_responses', 'is_duplicate')
    op.drop_column('auto_responses', 'version')
    op.drop_column('auto_responses', 'channel_id')
