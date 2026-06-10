"""normalize line_friends collation to match members

Revision ID: 8232192e915c
Revises: b86e108de957
Create Date: 2026-06-10 17:28:26.015021

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8232192e915c'
down_revision: Union[str, None] = 'b86e108de957'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """把 line_friends 的 collation 對齊 members，消除 member<->line_friend 同步 SP
    (sp_sync_member_to_line_friend / sp_sync_line_friend_to_member) 內
    `WHERE line_uid = v_line_uid` 跨 collation 比較撞 1267 的根因。

    根因：baseline migration 26d892fb5b82 把 line_friends 寫死成
    utf8mb4_0900_ai_ci。在「其餘表是 utf8mb4_unicode_ci」的環境(staging / 部分
    GCP VM / 可能 prod)，line_friends 與 members 不一致 → 同步 trigger 比較爆
    1267 → INSERT INTO members 回滾 → 會員建不出來。

    這裡刻意「對齊 members」而非寫死成 unicode_ci：
      - members=unicode_ci 的環境 → line_friends 轉 unicode_ci
      - members=0900_ai_ci 的環境(如地端整桶 0900) → 已一致 → 不動
    任何環境都能讓兩張表 collation 收斂，且冪等(已一致就略過 ALTER)。
    CONVERT TO 是 DDL，不觸發 row trigger；line_friends 未被其他表 FK 參照，安全。
    """
    bind = op.get_bind()
    fr_collation = bind.execute(sa.text(
        "SELECT TABLE_COLLATION FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'line_friends'"
    )).scalar()
    me_collation = bind.execute(sa.text(
        "SELECT TABLE_COLLATION FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members'"
    )).scalar()

    if fr_collation and me_collation and fr_collation != me_collation:
        charset = me_collation.split('_', 1)[0]  # e.g. utf8mb4
        op.execute(
            f"ALTER TABLE line_friends "
            f"CONVERT TO CHARACTER SET {charset} COLLATE {me_collation}"
        )


def downgrade() -> None:
    # 單向：還原成不一致會重新引發 1267，故不還原。
    pass
