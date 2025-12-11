"""add_fb_webchat_fields_to_member

Revision ID: 0be79d86e643
Revises: c5d8e2f1a4b3
Create Date: 2025-12-10 15:28:50.685543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0be79d86e643'
down_revision: Union[str, None] = 'c5d8e2f1a4b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 新增 Facebook 相關欄位
    op.add_column('members', sa.Column('fb_uid', sa.String(length=100), nullable=True, comment='Facebook User ID，透過 Facebook OAuth 登入時取得'))
    op.add_column('members', sa.Column('fb_avatar', sa.String(length=500), nullable=True, comment='Facebook 會員頭像 URL'))
    op.add_column('members', sa.Column('fb_name', sa.String(length=100), nullable=True, comment='Facebook 顯示名稱'))

    # 新增 Webchat 相關欄位
    op.add_column('members', sa.Column('webchat_uid', sa.String(length=100), nullable=True, comment='Webchat 訪客 ID，系統自動生成或透過 OAuth 關聯取得'))
    op.add_column('members', sa.Column('webchat_avatar', sa.String(length=500), nullable=True, comment='Webchat 會員頭像 URL'))
    op.add_column('members', sa.Column('webchat_name', sa.String(length=100), nullable=True, comment='Webchat 顯示名稱'))

    # 建立唯一索引
    op.create_index(op.f('ix_members_fb_uid'), 'members', ['fb_uid'], unique=True)
    op.create_index(op.f('ix_members_webchat_uid'), 'members', ['webchat_uid'], unique=True)


def downgrade() -> None:
    # 移除索引
    op.drop_index(op.f('ix_members_webchat_uid'), table_name='members')
    op.drop_index(op.f('ix_members_fb_uid'), table_name='members')

    # 移除欄位
    op.drop_column('members', 'webchat_name')
    op.drop_column('members', 'webchat_avatar')
    op.drop_column('members', 'webchat_uid')
    op.drop_column('members', 'fb_name')
    op.drop_column('members', 'fb_avatar')
    op.drop_column('members', 'fb_uid')
