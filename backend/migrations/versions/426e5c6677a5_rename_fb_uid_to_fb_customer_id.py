"""rename_fb_uid_to_fb_customer_id

Revision ID: 426e5c6677a5
Revises: 6e2d4a0d7d1b
Create Date: 2025-12-31 17:26:51.194118

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '426e5c6677a5'
down_revision: Union[str, None] = '6e2d4a0d7d1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 重命名欄位 (MySQL 需要指定 existing_type)
    op.alter_column('members', 'fb_uid', new_column_name='fb_customer_id',
                    existing_type=sa.String(100), existing_nullable=True)
    op.alter_column('members', 'fb_name', new_column_name='fb_customer_name',
                    existing_type=sa.String(100), existing_nullable=True)

    # 重命名索引 (MySQL 需要先刪除再建立)
    op.drop_index('ix_members_fb_uid', table_name='members')
    op.create_index('ix_members_fb_customer_id', 'members', ['fb_customer_id'], unique=True)


def downgrade() -> None:
    # 還原索引
    op.drop_index('ix_members_fb_customer_id', table_name='members')
    op.create_index('ix_members_fb_uid', 'members', ['fb_uid'], unique=True)

    # 還原欄位名稱
    op.alter_column('members', 'fb_customer_id', new_column_name='fb_uid',
                    existing_type=sa.String(100), existing_nullable=True)
    op.alter_column('members', 'fb_customer_name', new_column_name='fb_name',
                    existing_type=sa.String(100), existing_nullable=True)
