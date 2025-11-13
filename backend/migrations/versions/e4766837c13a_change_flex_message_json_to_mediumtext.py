"""change_flex_message_json_to_mediumtext

Revision ID: e4766837c13a
Revises: 0fa2372e1ea1
Create Date: 2025-11-13 16:50:01.560866

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4766837c13a'
down_revision: Union[str, None] = '0fa2372e1ea1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 將 flex_message_json 欄位從 TEXT 改為 MEDIUMTEXT（最大 16MB）
    op.execute('ALTER TABLE messages MODIFY COLUMN flex_message_json MEDIUMTEXT COMMENT "Flex Message JSON 內容（最大 16MB）"')


def downgrade() -> None:
    # 回滾：將 flex_message_json 欄位從 MEDIUMTEXT 改回 TEXT
    op.execute('ALTER TABLE messages MODIFY COLUMN flex_message_json TEXT COMMENT "Flex Message JSON 內容"')
