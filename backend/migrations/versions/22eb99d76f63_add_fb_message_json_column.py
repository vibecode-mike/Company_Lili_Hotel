"""add_fb_message_json_column

Revision ID: 22eb99d76f63
Revises: fec53deadf8b
Create Date: 2025-12-12 16:19:58.712803

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '22eb99d76f63'
down_revision: Union[str, None] = 'fec53deadf8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增 fb_message_json 欄位
    op.add_column('messages', sa.Column('fb_message_json', mysql.MEDIUMTEXT(), nullable=True, comment='Facebook Messenger JSON 內容'))


def downgrade() -> None:
    # 移除 fb_message_json 欄位
    op.drop_column('messages', 'fb_message_json')
