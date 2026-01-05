"""add is_following to members and sync trigger

Revision ID: fa40436b732e
Revises: 426e5c6677a5
Create Date: 2026-01-05

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision: str = "fa40436b732e"
down_revision: Union[str, None] = "426e5c6677a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. 檢查 members 表是否已有 is_following 欄位
    result = conn.execute(sa.text("""
        SELECT COUNT(*) as cnt
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'members'
          AND COLUMN_NAME = 'is_following'
    """)).fetchone()

    if result[0] == 0:
        # 添加 is_following 欄位到 members 表
        op.add_column('members', sa.Column(
            'is_following',
            sa.Boolean(),
            nullable=True,
            server_default='1',
            comment='是否正在關注 LINE OA（從 line_friends 同步）'
        ))

    # 2. 先刪除會造成衝突的 triggers
    conn.execute(sa.text("DROP TRIGGER IF EXISTS trg_line_friends_au_sync_member"))
    conn.execute(sa.text("DROP TRIGGER IF EXISTS trg_line_friends_ai_sync_member"))
    conn.execute(sa.text("DROP TRIGGER IF EXISTS trg_members_au_sync_line_friend"))
    conn.execute(sa.text("DROP TRIGGER IF EXISTS trg_members_ai_sync_line_friend"))

    # 3. 同步現有數據：從 line_friends 更新 members.is_following
    conn.execute(sa.text("""
        UPDATE members m
        LEFT JOIN line_friends lf ON m.line_uid = lf.line_uid
        SET m.is_following = COALESCE(lf.is_following, 0)
        WHERE m.line_uid IS NOT NULL AND m.line_uid != ''
    """))

    # 4. 重新創建 triggers（包含 is_following 同步）
    # line_friends -> members (UPDATE)
    conn.execute(sa.text(dedent("""
        CREATE TRIGGER trg_line_friends_au_sync_member
        AFTER UPDATE ON line_friends
        FOR EACH ROW
        BEGIN
            IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND NEW.member_id IS NOT NULL THEN
                SET @skip_member_trigger = IFNULL(@skip_member_trigger, 0) + 1;

                UPDATE members
                SET
                    line_uid = COALESCE(NEW.line_uid, line_uid),
                    line_display_name = COALESCE(NEW.line_display_name, line_display_name),
                    line_avatar = COALESCE(NEW.line_picture_url, line_avatar),
                    is_following = NEW.is_following,
                    updated_at = NOW()
                WHERE id = NEW.member_id;

                SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
            END IF;
        END;
    """)))

    # line_friends -> members (INSERT)
    conn.execute(sa.text(dedent("""
        CREATE TRIGGER trg_line_friends_ai_sync_member
        AFTER INSERT ON line_friends
        FOR EACH ROW
        BEGIN
            IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND NEW.member_id IS NOT NULL THEN
                SET @skip_member_trigger = IFNULL(@skip_member_trigger, 0) + 1;

                UPDATE members
                SET
                    line_uid = COALESCE(NEW.line_uid, line_uid),
                    line_display_name = COALESCE(NEW.line_display_name, line_display_name),
                    line_avatar = COALESCE(NEW.line_picture_url, line_avatar),
                    is_following = NEW.is_following,
                    updated_at = NOW()
                WHERE id = NEW.member_id;

                SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
            END IF;
        END;
    """)))

    # members -> line_friends (UPDATE)
    conn.execute(sa.text(dedent("""
        CREATE TRIGGER trg_members_au_sync_line_friend
        AFTER UPDATE ON members
        FOR EACH ROW
        BEGIN
            IF IFNULL(@skip_member_trigger, 0) = 0 THEN
                CALL sp_sync_member_to_line_friend(NEW.id);
            END IF;
        END;
    """)))

    # members -> line_friends (INSERT)
    conn.execute(sa.text(dedent("""
        CREATE TRIGGER trg_members_ai_sync_line_friend
        AFTER INSERT ON members
        FOR EACH ROW
        BEGIN
            IF IFNULL(@skip_member_trigger, 0) = 0 THEN
                CALL sp_sync_member_to_line_friend(NEW.id);
            END IF;
        END;
    """)))


def downgrade() -> None:
    conn = op.get_bind()

    # 1. 恢復原本的 triggers（不含 is_following）
    conn.execute(sa.text("DROP TRIGGER IF EXISTS trg_line_friends_au_sync_member"))
    conn.execute(sa.text("DROP TRIGGER IF EXISTS trg_line_friends_ai_sync_member"))

    conn.execute(sa.text(dedent("""
        CREATE TRIGGER trg_line_friends_au_sync_member
        AFTER UPDATE ON line_friends
        FOR EACH ROW
        BEGIN
            IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND NEW.member_id IS NOT NULL THEN
                CALL sp_sync_line_friend_to_member(NEW.id);
            END IF;
        END;
    """)))

    conn.execute(sa.text(dedent("""
        CREATE TRIGGER trg_line_friends_ai_sync_member
        AFTER INSERT ON line_friends
        FOR EACH ROW
        BEGIN
            IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND NEW.member_id IS NOT NULL THEN
                CALL sp_sync_line_friend_to_member(NEW.id);
            END IF;
        END;
    """)))

    # 2. 移除 is_following 欄位
    op.drop_column('members', 'is_following')
