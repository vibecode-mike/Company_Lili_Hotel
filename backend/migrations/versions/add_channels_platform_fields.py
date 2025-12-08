"""add_channels_and_platform_fields

Revision ID: c5d8e2f1a4b3
Revises: b796d5937f3f
Create Date: 2025-12-05 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = 'c5d8e2f1a4b3'
down_revision: Union[str, None] = 'b796d5937f3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    新增渠道和平台相關欄位：
    1. auto_responses 表新增 channels 欄位（JSON，nullable）
    2. messages 表新增 platform 欄位（String(20)，default='LINE'）
    """

    # 1. 新增 channels 欄位到 auto_responses 表
    # 支持的渠道列表（['LINE', 'Facebook']），null 表示全部渠道
    op.add_column(
        'auto_responses',
        sa.Column(
            'channels',
            mysql.JSON(),
            nullable=True,
            comment="支持的渠道列表（['LINE', 'Facebook']），null 表示全部渠道"
        )
    )

    # 2. 新增 platform 欄位到 messages 表
    # 發送平台：LINE/Facebook/Instagram，預設 LINE
    op.add_column(
        'messages',
        sa.Column(
            'platform',
            sa.String(20),
            nullable=True,
            server_default='LINE',
            comment='發送平台：LINE/Facebook/Instagram'
        )
    )


def downgrade() -> None:
    """
    回滾操作：移除新增的欄位
    """
    # 移除 messages 表的 platform 欄位
    op.drop_column('messages', 'platform')

    # 移除 auto_responses 表的 channels 欄位
    op.drop_column('auto_responses', 'channels')
