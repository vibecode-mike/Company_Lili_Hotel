"""add_member_interaction_tags_table

Revision ID: eb962a42ab7a
Revises: 97c1b3771116
Create Date: 2025-11-22 23:25:59.997317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'eb962a42ab7a'
down_revision: Union[str, None] = '97c1b3771116'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 建立 member_interaction_tags 表
    op.create_table('member_interaction_tags',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('member_id', sa.BigInteger(), nullable=False, comment='所屬會員ID'),
    sa.Column('tag_name', sa.String(length=20), nullable=False, comment='標籤名稱，不得超過 20 個字元（中英文皆計算，每個字元計 1）。格式限制：僅允許中文（\\u4e00-\\u9fa5）、英文（a-zA-Z）、數字（0-9）、空格，禁止特殊字元與 Emoji。驗證：前端使用正則表達式 /^[\\u4e00-\\u9fa5a-zA-Z0-9\\s]+$/ 即時驗證'),
    sa.Column('tag_source', sa.String(length=20), server_default='CRM', nullable=True, comment='標籤來源：固定為 CRM（手動新增）'),
    sa.Column('trigger_count', sa.Integer(), server_default='0', nullable=True, comment='觸發次數'),
    sa.Column('trigger_member_count', sa.Integer(), server_default='0', nullable=True, comment='觸發會員數'),
    sa.Column('last_triggered_at', sa.DateTime(), nullable=True, comment='最近觸發時間'),
    sa.Column('message_id', sa.BigInteger(), nullable=True, comment='觸發來源訊息ID（用於去重）'),
    sa.Column('tagged_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True, comment='標記時間'),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True, comment='建立時間'),
    sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
    sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('member_id', 'tag_name', 'message_id', name='uq_member_interaction_tag_message')
    )
    op.create_index(op.f('ix_member_interaction_tags_member_id'), 'member_interaction_tags', ['member_id'], unique=False)
    op.create_index(op.f('ix_member_interaction_tags_message_id'), 'member_interaction_tags', ['message_id'], unique=False)


def downgrade() -> None:
    # 刪除 member_interaction_tags 表
    op.drop_index(op.f('ix_member_interaction_tags_message_id'), table_name='member_interaction_tags')
    op.drop_index(op.f('ix_member_interaction_tags_member_id'), table_name='member_interaction_tags')
    op.drop_table('member_interaction_tags')
