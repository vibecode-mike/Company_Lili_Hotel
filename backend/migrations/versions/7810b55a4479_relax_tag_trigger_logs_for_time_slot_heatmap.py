"""relax tag_trigger_logs for time-slot heatmap

Revision ID: 7810b55a4479
Revises: 933134539669
Create Date: 2026-04-22 10:00:00.000000

目的：數據洞察「時段洞察」橘黃色 heatmap 要依「時段內觸發過標籤的不重複會員人數」統計。
      原表 tag_trigger_logs.tag_id FK 只接 interaction_tags，限制我們無法記錄 member_tags
      觸發事件。此 migration 放寬 schema：
      - 拿掉 tag_id 對 interaction_tags 的 FK，允許 NULL（member_tags 觸發時填 NULL）
      - 新增 tag_type（member|interaction）與 tag_name（denormalized 方便查詢）欄位
      - 加 (member_id, triggered_at) 複合索引加速時段統計
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7810b55a4479'
down_revision: Union[str, None] = '933134539669'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 拿掉 tag_id → interaction_tags 的外鍵
    op.drop_constraint('tag_trigger_logs_ibfk_4', 'tag_trigger_logs', type_='foreignkey')

    # 2. tag_id 改可為空（member_tags 觸發時無對應 interaction_tags.id）
    op.alter_column(
        'tag_trigger_logs',
        'tag_id',
        existing_type=sa.BigInteger(),
        nullable=True,
    )

    # 3. 新增 tag_type 與 tag_name 欄位
    op.add_column(
        'tag_trigger_logs',
        sa.Column(
            'tag_type',
            sa.Enum('member', 'interaction', name='tag_type_enum'),
            nullable=False,
            server_default='interaction',
            comment='標籤類型：member（會員標籤）/ interaction（互動標籤）',
        ),
    )
    op.add_column(
        'tag_trigger_logs',
        sa.Column('tag_name', sa.String(100), nullable=False, server_default='', comment='標籤名稱快照'),
    )

    # 4. 加複合索引：時段洞察統計用
    op.create_index(
        'ix_tag_trigger_logs_member_triggered',
        'tag_trigger_logs',
        ['member_id', 'triggered_at'],
    )


def downgrade() -> None:
    op.drop_index('ix_tag_trigger_logs_member_triggered', table_name='tag_trigger_logs')
    op.drop_column('tag_trigger_logs', 'tag_name')
    op.drop_column('tag_trigger_logs', 'tag_type')
    op.alter_column(
        'tag_trigger_logs',
        'tag_id',
        existing_type=sa.BigInteger(),
        nullable=False,
    )
    op.create_foreign_key(
        'tag_trigger_logs_ibfk_4',
        'tag_trigger_logs', 'interaction_tags',
        ['tag_id'], ['id'], ondelete='CASCADE',
    )
