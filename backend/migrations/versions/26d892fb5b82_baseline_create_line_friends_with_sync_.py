"""baseline create line_friends with sync triggers and procedures

Revision ID: 26d892fb5b82
Revises: b8e2f5c1d3a7
Create Date: 2026-05-06 15:39:42.331036

收編 dev DB 自 alembic 之前就存在的 line_friends 表 + 雙向同步機制：
- line_friends 表（IF NOT EXISTS：dev 已有、staging/prod 首次建立）
- sp_sync_line_friend_to_member（保留以對齊 dev；目前無 trigger 引用）
- sp_sync_member_to_line_friend（被 members triggers CALL）
- 6 個 trigger（line_friends/members × INSERT/UPDATE/DELETE）

執行策略：
- 表：IF NOT EXISTS（dev 跳過、staging/prod 建立）
- SP/Trigger：DROP + CREATE（dev 上會替換為內容一致版本，僅 DEFINER 改變）

DEFINER 不再寫死 root@%，由執行 alembic 的 user 接手（CURRENT_USER），
避免 staging/prod 上沒有 root user 撞權限。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '26d892fb5b82'
down_revision: Union[str, None] = 'b8e2f5c1d3a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ===== STEP 1: 建 line_friends 表（IF NOT EXISTS） =====
    op.execute("""
        CREATE TABLE IF NOT EXISTS line_friends (
            id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'LINE 好友 ID',
            line_uid VARCHAR(100) NOT NULL COMMENT 'LINE UID',
            member_id BIGINT DEFAULT NULL COMMENT '關聯的 CRM 會員 ID（可為空）',
            line_display_name VARCHAR(100) DEFAULT NULL COMMENT 'LINE 顯示名稱',
            line_picture_url VARCHAR(500) DEFAULT NULL COMMENT 'LINE 頭像 URL',
            email VARCHAR(255) DEFAULT NULL COMMENT '電子信箱',
            is_following TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否為當前好友（1=是，0=否）',
            followed_at DATETIME DEFAULT NULL COMMENT '首次關注時間',
            unfollowed_at DATETIME DEFAULT NULL COMMENT '最後取消關注時間',
            last_interaction_at DATETIME DEFAULT NULL COMMENT '最後互動時間',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
            updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
            PRIMARY KEY (id),
            UNIQUE KEY line_uid (line_uid),
            KEY idx_member_id (member_id),
            CONSTRAINT fk_line_friends_member FOREIGN KEY (member_id)
                REFERENCES members (id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
          COMMENT='LINE 好友表'
    """)

    # ===== STEP 2: stored procedures（DROP + CREATE） =====
    # SP 必須先建，因為 members 的 trigger 會 CALL sp_sync_member_to_line_friend
    op.execute("DROP PROCEDURE IF EXISTS sp_sync_line_friend_to_member")
    op.execute("""
CREATE PROCEDURE sp_sync_line_friend_to_member(IN p_line_friend_id BIGINT)
proc:BEGIN
    DECLARE v_member_id BIGINT;
    DECLARE v_line_uid VARCHAR(128);
    DECLARE v_display VARCHAR(255);
    DECLARE v_picture VARCHAR(512);
    DECLARE v_last_interaction DATETIME;
    DECLARE v_guard TINYINT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        IF v_guard = 1 THEN
            SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
        END IF;
        RESIGNAL;
    END;

    SELECT member_id, line_uid, line_display_name, line_picture_url, last_interaction_at
    INTO v_member_id, v_line_uid, v_display, v_picture, v_last_interaction
    FROM line_friends WHERE id = p_line_friend_id LIMIT 1;

    IF v_member_id IS NULL THEN
        LEAVE proc;
    END IF;

    SET @skip_member_trigger = IFNULL(@skip_member_trigger, 0) + 1;
    SET v_guard = 1;

    UPDATE members
    SET line_uid = COALESCE(v_line_uid, line_uid),
        line_display_name = COALESCE(v_display, line_display_name),
        line_avatar = COALESCE(v_picture, line_avatar),
        last_interaction_at = COALESCE(v_last_interaction, last_interaction_at),
        updated_at = NOW()
    WHERE id = v_member_id;

    SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
END
    """)

    op.execute("DROP PROCEDURE IF EXISTS sp_sync_member_to_line_friend")
    op.execute("""
CREATE PROCEDURE sp_sync_member_to_line_friend(IN p_member_id BIGINT)
proc:BEGIN
    DECLARE v_line_uid VARCHAR(128);
    DECLARE v_display VARCHAR(255);
    DECLARE v_picture VARCHAR(512);
    DECLARE v_friend_id BIGINT;
    DECLARE v_guard TINYINT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        IF v_guard = 1 THEN
            SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 1) - 1;
        END IF;
        RESIGNAL;
    END;

    SELECT line_uid, line_display_name, line_avatar
    INTO v_line_uid, v_display, v_picture
    FROM members WHERE id = p_member_id LIMIT 1;

    IF v_line_uid IS NULL OR v_line_uid = '' THEN
        LEAVE proc;
    END IF;

    SELECT id INTO v_friend_id
    FROM line_friends WHERE line_uid = v_line_uid LIMIT 1;

    SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 0) + 1;
    SET v_guard = 1;

    IF v_friend_id IS NULL THEN
        INSERT INTO line_friends
            (line_uid, member_id, line_display_name, line_picture_url,
             is_following, followed_at, last_interaction_at, created_at, updated_at)
        VALUES (v_line_uid, p_member_id, v_display, v_picture,
                1, NOW(), NOW(), NOW(), NOW());
    ELSE
        UPDATE line_friends
        SET line_uid = v_line_uid,
            member_id = p_member_id,
            line_display_name = COALESCE(v_display, line_display_name),
            line_picture_url = COALESCE(v_picture, line_picture_url),
            followed_at = COALESCE(followed_at, NOW()),
            last_interaction_at = COALESCE(last_interaction_at, NOW()),
            updated_at = NOW()
        WHERE id = v_friend_id;
    END IF;

    SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 1) - 1;
END
    """)

    # ===== STEP 3: triggers（DROP + CREATE） =====

    # --- line_friends -> members (INSERT) ---
    op.execute("DROP TRIGGER IF EXISTS trg_line_friends_ai_sync_member")
    op.execute("""
CREATE TRIGGER trg_line_friends_ai_sync_member
AFTER INSERT ON line_friends FOR EACH ROW
BEGIN
    IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND NEW.member_id IS NOT NULL THEN
        SET @skip_member_trigger = IFNULL(@skip_member_trigger, 0) + 1;
        UPDATE members
        SET line_uid = COALESCE(NEW.line_uid, line_uid),
            line_display_name = COALESCE(NEW.line_display_name, line_display_name),
            line_avatar = COALESCE(NEW.line_picture_url, line_avatar),
            is_following = NEW.is_following,
            updated_at = NOW()
        WHERE id = NEW.member_id;
        SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
    END IF;
END
    """)

    # --- line_friends -> members (UPDATE) ---
    op.execute("DROP TRIGGER IF EXISTS trg_line_friends_au_sync_member")
    op.execute("""
CREATE TRIGGER trg_line_friends_au_sync_member
AFTER UPDATE ON line_friends FOR EACH ROW
BEGIN
    IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND NEW.member_id IS NOT NULL THEN
        SET @skip_member_trigger = IFNULL(@skip_member_trigger, 0) + 1;
        UPDATE members
        SET line_uid = COALESCE(NEW.line_uid, line_uid),
            line_display_name = COALESCE(NEW.line_display_name, line_display_name),
            line_avatar = COALESCE(NEW.line_picture_url, line_avatar),
            is_following = NEW.is_following,
            updated_at = NOW()
        WHERE id = NEW.member_id;
        SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
    END IF;
END
    """)

    # --- line_friends -> members (DELETE) ---
    op.execute("DROP TRIGGER IF EXISTS trg_line_friends_ad_sync_member")
    op.execute("""
CREATE TRIGGER trg_line_friends_ad_sync_member
AFTER DELETE ON line_friends FOR EACH ROW
BEGIN
    IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND OLD.member_id IS NOT NULL THEN
        SET @skip_member_trigger = IFNULL(@skip_member_trigger, 0) + 1;
        UPDATE members
        SET line_uid = NULL, updated_at = NOW()
        WHERE id = OLD.member_id AND line_uid = OLD.line_uid;
        SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
    END IF;
END
    """)

    # --- members -> line_friends (INSERT) ---
    op.execute("DROP TRIGGER IF EXISTS trg_members_ai_sync_line_friend")
    op.execute("""
CREATE TRIGGER trg_members_ai_sync_line_friend
AFTER INSERT ON members FOR EACH ROW
BEGIN
    IF IFNULL(@skip_member_trigger, 0) = 0 THEN
        CALL sp_sync_member_to_line_friend(NEW.id);
    END IF;
END
    """)

    # --- members -> line_friends (UPDATE) ---
    op.execute("DROP TRIGGER IF EXISTS trg_members_au_sync_line_friend")
    op.execute("""
CREATE TRIGGER trg_members_au_sync_line_friend
AFTER UPDATE ON members FOR EACH ROW
BEGIN
    IF IFNULL(@skip_member_trigger, 0) = 0 THEN
        CALL sp_sync_member_to_line_friend(NEW.id);
    END IF;
END
    """)

    # --- members -> line_friends (DELETE) ---
    op.execute("DROP TRIGGER IF EXISTS trg_members_ad_sync_line_friend")
    op.execute("""
CREATE TRIGGER trg_members_ad_sync_line_friend
AFTER DELETE ON members FOR EACH ROW
BEGIN
    IF IFNULL(@skip_member_trigger, 0) = 0 THEN
        SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 0) + 1;
        UPDATE line_friends
        SET member_id = NULL, updated_at = NOW()
        WHERE member_id = OLD.id;
        SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 1) - 1;
    END IF;
END
    """)


def downgrade() -> None:
    """
    回退：drop triggers + procedures（可重建，安全）。
    line_friends 表保留以避免資料遺失；要刪請手動下 DROP TABLE line_friends。
    """
    op.execute("DROP TRIGGER IF EXISTS trg_members_ad_sync_line_friend")
    op.execute("DROP TRIGGER IF EXISTS trg_members_au_sync_line_friend")
    op.execute("DROP TRIGGER IF EXISTS trg_members_ai_sync_line_friend")
    op.execute("DROP TRIGGER IF EXISTS trg_line_friends_ad_sync_member")
    op.execute("DROP TRIGGER IF EXISTS trg_line_friends_au_sync_member")
    op.execute("DROP TRIGGER IF EXISTS trg_line_friends_ai_sync_member")

    op.execute("DROP PROCEDURE IF EXISTS sp_sync_member_to_line_friend")
    op.execute("DROP PROCEDURE IF EXISTS sp_sync_line_friend_to_member")
