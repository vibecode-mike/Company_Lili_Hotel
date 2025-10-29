"""migrate campaigns to support multiple interaction tags

Revision ID: a1b2c3d4e5f6
Revises: 7a2b7e6d19f8
Create Date: 2025-10-28 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '7a2b7e6d19f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    升级: 将 campaigns 表的 interaction_tag 从单个标签迁移为多标签数组

    步骤:
    1. 添加新的 interaction_tags JSON 字段
    2. 将现有 interaction_tag 数据转换为 JSON 数组格式
    3. 删除旧的 interaction_tag 字段
    """
    # 步骤1: 添加新字段 interaction_tags (JSON类型)
    op.add_column('campaigns', sa.Column('interaction_tags', sa.JSON(), nullable=True, comment='互动标签数组'))

    # 步骤2: 数据迁移 - 将单标签转换为数组格式
    # 使用原生 SQL 进行数据转换
    connection = op.get_bind()
    connection.execute(sa.text(
        """
        UPDATE campaigns
        SET interaction_tags = JSON_ARRAY(interaction_tag)
        WHERE interaction_tag IS NOT NULL AND interaction_tag != ''
        """
    ))

    # 步骤3: 删除旧字段 interaction_tag
    op.drop_column('campaigns', 'interaction_tag')


def downgrade() -> None:
    """
    降级: 将 interaction_tags 多标签数组还原为单标签 interaction_tag

    注意: 如果 interaction_tags 包含多个标签，只保留第一个
    """
    # 步骤1: 添加旧字段 interaction_tag
    op.add_column('campaigns', sa.Column('interaction_tag', sa.String(50), nullable=True, comment='互动标签'))

    # 步骤2: 数据还原 - 取数组第一个元素
    connection = op.get_bind()
    connection.execute(sa.text(
        """
        UPDATE campaigns
        SET interaction_tag = JSON_UNQUOTE(JSON_EXTRACT(interaction_tags, '$[0]'))
        WHERE interaction_tags IS NOT NULL
        AND JSON_LENGTH(interaction_tags) > 0
        """
    ))

    # 步骤3: 删除新字段 interaction_tags
    op.drop_column('campaigns', 'interaction_tags')
