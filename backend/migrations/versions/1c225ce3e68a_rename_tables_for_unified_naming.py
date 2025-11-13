"""rename_tables_for_unified_naming

Revision ID: 1c225ce3e68a
Revises: 25ed166f31de
Create Date: 2025-11-13 13:16:03.535318

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c225ce3e68a'
down_revision: Union[str, None] = '25ed166f31de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    重命名資料表以符合統一命名規範（複數形式 + 蛇形命名法）

    變更清單：
    1. ryan_line_channels → line_channels
    2. ryan_threads → conversation_threads
    3. ryan_messages → conversation_messages
    4. ryan_click_demo → click_tracking_demo

    注意：users → admins 的重命名已由先前的 migration 處理
    """

    # 使用條件邏輯檢查表是否存在再進行重命名
    from sqlalchemy import inspect
    from alembic import context

    conn = context.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. 重命名 ryan_line_channels → line_channels
    if 'ryan_line_channels' in existing_tables:
        op.rename_table('ryan_line_channels', 'line_channels')

    # 2. 重命名 ryan_threads → conversation_threads
    if 'ryan_threads' in existing_tables:
        op.rename_table('ryan_threads', 'conversation_threads')

    # 3. 重命名 ryan_messages → conversation_messages
    if 'ryan_messages' in existing_tables:
        op.rename_table('ryan_messages', 'conversation_messages')

    # 4. 重命名 ryan_click_demo → click_tracking_demo
    if 'ryan_click_demo' in existing_tables:
        op.rename_table('ryan_click_demo', 'click_tracking_demo')


def downgrade() -> None:
    """
    回滾表名變更
    """
    from sqlalchemy import inspect
    from alembic import context

    conn = context.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    # 按相反順序回滾
    if 'click_tracking_demo' in existing_tables:
        op.rename_table('click_tracking_demo', 'ryan_click_demo')

    if 'conversation_messages' in existing_tables:
        op.rename_table('conversation_messages', 'ryan_messages')

    if 'conversation_threads' in existing_tables:
        op.rename_table('conversation_threads', 'ryan_threads')

    if 'line_channels' in existing_tables:
        op.rename_table('line_channels', 'ryan_line_channels')
