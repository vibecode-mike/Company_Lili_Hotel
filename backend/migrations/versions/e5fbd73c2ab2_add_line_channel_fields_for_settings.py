"""add_line_channel_fields_for_settings

Revision ID: e5fbd73c2ab2
Revises: 30825f4e1ae3
Create Date: 2025-11-19 18:41:07.023222

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5fbd73c2ab2'
down_revision: Union[str, None] = '12d8467bf31a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 由於欄位已存在,需要檢查並調整
    from sqlalchemy import inspect
    from alembic import context

    # 取得連線
    conn = context.get_bind()
    inspector = inspect(conn)
    columns = {col['name']: col for col in inspector.get_columns('line_channels')}

    # 檢查並修改 channel_id 欄位 (如果已存在但類型不同)
    if 'channel_id' in columns:
        # 修改欄位屬性 (如果需要)
        op.alter_column('line_channels', 'channel_id',
                       existing_type=sa.String(length=50),
                       type_=sa.String(length=100),
                       nullable=True)
    else:
        op.add_column('line_channels', sa.Column('channel_id', sa.String(length=100), nullable=True))

    # 檢查並修改 login_channel_id 欄位
    if 'login_channel_id' in columns:
        op.alter_column('line_channels', 'login_channel_id',
                       existing_type=sa.Integer(),
                       type_=sa.String(length=100),
                       nullable=True)
    else:
        op.add_column('line_channels', sa.Column('login_channel_id', sa.String(length=100), nullable=True))

    # 檢查並修改 login_channel_secret 欄位
    if 'login_channel_secret' in columns:
        op.alter_column('line_channels', 'login_channel_secret',
                       existing_type=sa.String(length=100),
                       nullable=True)
    else:
        op.add_column('line_channels', sa.Column('login_channel_secret', sa.String(length=100), nullable=True))

    # 建立唯一約束 (如果尚未建立)
    try:
        op.create_unique_constraint('uq_line_channels_channel_id', 'line_channels', ['channel_id'])
    except:
        # 如果約束已存在則忽略
        pass


def downgrade() -> None:
    # Drop unique constraint
    op.drop_constraint('uq_line_channels_channel_id', 'line_channels', type_='unique')

    # Drop columns
    op.drop_column('line_channels', 'login_channel_secret')
    op.drop_column('line_channels', 'login_channel_id')
    op.drop_column('line_channels', 'channel_id')
