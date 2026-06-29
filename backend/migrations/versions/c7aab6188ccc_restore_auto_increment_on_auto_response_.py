"""restore auto_increment on auto_response_keywords.id

Revision ID: c7aab6188ccc
Revises: 657b81b6854d
Create Date: 2026-06-29 17:07:34.881121

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7aab6188ccc'
down_revision: Union[str, None] = '657b81b6854d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE = "auto_response_keywords"


def _is_auto_increment() -> bool:
    bind = op.get_bind()
    row = bind.execute(
        sa.text(
            "SELECT EXTRA FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = 'id'"
        ),
        {"t": TABLE},
    ).scalar()
    return bool(row) and "auto_increment" in row.lower()


def upgrade() -> None:
    # 修復 schema drift：auto_response_keywords.id 遺失 AUTO_INCREMENT，
    # 導致新增關鍵字回應時 INSERT 報 1364 "Field 'id' doesn't have a default value"。
    if not _is_auto_increment():
        op.execute(f"ALTER TABLE {TABLE} MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT")


def downgrade() -> None:
    # one-way：移除 AUTO_INCREMENT 會讓表回到壞掉的狀態，不還原。
    pass
