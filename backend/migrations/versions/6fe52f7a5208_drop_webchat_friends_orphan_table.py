"""drop_webchat_friends_orphan_table

Revision ID: 6fe52f7a5208
Revises: 3461f5e4f5dd
Create Date: 2026-05-15 17:32:40.890542

DROP 孤兒表 webchat_friends。

歷史脈絡：
- webchat_friends schema 幾乎是 line_friends 的複製版（line_* → webchat_*）
- 早期設計可能想做「Webchat 好友追蹤表」與 line_friends 平行
- 後來架構演進 → Webchat 用戶統一進 members 表（members.webchat_uid 欄）
  這張表就用不到了，model 也早被砍掉
- 全 codebase 0 處引用：grep "webchat_friends" 在 backend / line_app / frontend
  都搜不到；DB 上 0 筆資料

Idempotent 設計：用 information_schema 預檢，表不存在就跳過（避免如 staging
是不是已被手動 DROP 之類的 edge case）。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6fe52f7a5208'
down_revision: Union[str, None] = '3461f5e4f5dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table: str) -> bool:
    """檢查 table 是否存在於當前 DB。"""
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tbl
    """), {"tbl": table}).scalar()
    return result > 0


def upgrade() -> None:
    if _table_exists('webchat_friends'):
        op.drop_table('webchat_friends')


def downgrade() -> None:
    """
    重建 webchat_friends（schema 還原為被刪除前的狀態）。
    注意：rollback 後資料無法復原（drop 時若有資料會永久消失，
    雖然本次刪除時是 0 筆，但未來若回頭跑 downgrade 是空表）。
    """
    if not _table_exists('webchat_friends'):
        op.create_table(
            'webchat_friends',
            sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='LINE 好友 ID'),
            sa.Column('webchat_uid', sa.String(length=100), nullable=False, comment='Webchat UID'),
            sa.Column('member_id', sa.BigInteger(), nullable=True, comment='關聯的 CRM 會員 ID（可為空）'),
            sa.Column('webchat_display_name', sa.String(length=100), nullable=True, comment='Webchat 顯示名稱'),
            sa.Column('webchat_picture_url', sa.String(length=500), nullable=True, comment='Webchat 頭像 URL'),
            sa.Column('email', sa.String(length=255), nullable=True),
            sa.Column('is_following', sa.Boolean(), nullable=False, server_default=sa.text('1'),
                      comment='是否為當前好友（1=是，0=否）'),
            sa.Column('followed_at', sa.DateTime(), nullable=True, comment='首次關注時間'),
            sa.Column('unfollowed_at', sa.DateTime(), nullable=True, comment='最後取消關注時間'),
            sa.Column('last_interaction_at', sa.DateTime(), nullable=True, comment='最後互動時間'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'),
                      nullable=True, comment='建立時間'),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
        )
