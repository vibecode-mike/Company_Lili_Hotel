"""add member<->line_friend sync triggers

Revision ID: 1f9c8e7c2c2a
Revises: 0fa2372e1ea1
Create Date: 2025-11-18 10:41:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision: str = "1f9c8e7c2c2a"
down_revision: Union[str, None] = "1c0f68649016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_columns(conn, table_name: str) -> set[str]:
    rows = conn.execute(
        sa.text(
            """
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table
            """
        ),
        {"table": table_name},
    ).fetchall()
    return {row[0] for row in rows}


def _require_columns(table: str, columns: set[str], required: list[str]) -> None:
    missing = [col for col in required if col not in columns]
    if missing:
        raise RuntimeError(
            f"Cannot create member/line_friend triggers: table `{table}` is missing columns {missing}"
        )


def _build_expr(columns: set[str], candidates: list[str]) -> str:
    available = [col for col in candidates if col in columns]
    if not available:
        return "NULL"
    if len(available) == 1:
        return available[0]
    return f"COALESCE({', '.join(available)})"


def _build_member_to_friend_proc(member_cols: set[str], friend_cols: set[str]) -> str:
    member_display_expr = _build_expr(
        member_cols, ["line_display_name", "line_name"]
    )
    member_picture_expr = _build_expr(
        member_cols, ["line_picture_url", "line_avatar"]
    )

    friend_display_col = next(
        (col for col in ("line_display_name", "line_name") if col in friend_cols), None
    )
    friend_picture_col = next(
        (col for col in ("line_picture_url", "line_avatar") if col in friend_cols), None
    )

    insert_cols = ["line_uid"]
    insert_vals = ["v_line_uid"]

    update_parts = ["line_uid = v_line_uid"]

    member_id_col = "member_id"
    insert_cols.append(member_id_col)
    insert_vals.append("p_member_id")
    update_parts.append(f"{member_id_col} = p_member_id")

    if friend_display_col:
        insert_cols.append(friend_display_col)
        insert_vals.append("v_display")
        update_parts.append(
            f"{friend_display_col} = COALESCE(v_display, {friend_display_col})"
        )

    if friend_picture_col:
        insert_cols.append(friend_picture_col)
        insert_vals.append("v_picture")
        update_parts.append(
            f"{friend_picture_col} = COALESCE(v_picture, {friend_picture_col})"
        )

    if "is_following" in friend_cols:
        insert_cols.append("is_following")
        insert_vals.append("1")

    if "followed_at" in friend_cols:
        insert_cols.append("followed_at")
        insert_vals.append("NOW()")
        update_parts.append("followed_at = COALESCE(followed_at, NOW())")

    if "last_interaction_at" in friend_cols:
        insert_cols.append("last_interaction_at")
        insert_vals.append("NOW()")
        update_parts.append(
            "last_interaction_at = COALESCE(last_interaction_at, NOW())"
        )

    if "profile_updated_at" in friend_cols:
        insert_cols.append("profile_updated_at")
        insert_vals.append("NOW()")

    if "created_at" in friend_cols:
        insert_cols.append("created_at")
        insert_vals.append("NOW()")

    if "updated_at" in friend_cols:
        insert_cols.append("updated_at")
        insert_vals.append("NOW()")
        update_parts.append("updated_at = NOW()")

    insert_sql = (
        f"INSERT INTO line_friends ({', '.join(insert_cols)}) "
        f"VALUES ({', '.join(insert_vals)});"
    )

    update_sql = (
        "UPDATE line_friends "
        f"SET {', '.join(update_parts)} "
        "WHERE id = v_friend_id;"
    )

    return dedent(
        f"""
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

            SELECT line_uid,
                   {member_display_expr} AS display_name,
                   {member_picture_expr} AS picture_url
            INTO v_line_uid, v_display, v_picture
            FROM members
            WHERE id = p_member_id
            LIMIT 1;

            IF v_line_uid IS NULL OR v_line_uid = '' THEN
                LEAVE proc;
            END IF;

            SELECT id INTO v_friend_id
            FROM line_friends
            WHERE line_uid = v_line_uid
            LIMIT 1;

            SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 0) + 1;
            SET v_guard = 1;

            IF v_friend_id IS NULL THEN
                {insert_sql}
            ELSE
                {update_sql}
            END IF;

            SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 1) - 1;
        END;
        """
    )


def _build_friend_to_member_proc(member_cols: set[str], friend_cols: set[str]) -> str:
    friend_display_expr = _build_expr(
        friend_cols, ["line_display_name", "line_name"]
    )
    friend_picture_expr = _build_expr(
        friend_cols, ["line_picture_url", "line_avatar"]
    )
    friend_last_interaction_expr = (
        "last_interaction_at" if "last_interaction_at" in friend_cols else "NULL"
    )

    member_update_parts: list[str] = ["line_uid = COALESCE(v_line_uid, line_uid)"]

    if "line_display_name" in member_cols:
        member_update_parts.append(
            "line_display_name = COALESCE(v_display, line_display_name)"
        )
    if "line_name" in member_cols:
        member_update_parts.append("line_name = COALESCE(v_display, line_name)")
    if "line_picture_url" in member_cols:
        member_update_parts.append(
            "line_picture_url = COALESCE(v_picture, line_picture_url)"
        )
    if "line_avatar" in member_cols:
        member_update_parts.append("line_avatar = COALESCE(v_picture, line_avatar)")
    if "last_interaction_at" in member_cols and friend_last_interaction_expr != "NULL":
        member_update_parts.append(
            "last_interaction_at = COALESCE(v_last_interaction, last_interaction_at)"
        )
    if "updated_at" in member_cols:
        member_update_parts.append("updated_at = NOW()")

    update_sql = ",\n                ".join(member_update_parts)

    return dedent(
        f"""
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

            SELECT member_id,
                   line_uid,
                   {friend_display_expr} AS display_name,
                   {friend_picture_expr} AS picture_url,
                   {friend_last_interaction_expr} AS last_interaction_value
            INTO v_member_id, v_line_uid, v_display, v_picture, v_last_interaction
            FROM line_friends
            WHERE id = p_line_friend_id
            LIMIT 1;

            IF v_member_id IS NULL THEN
                LEAVE proc;
            END IF;

            SET @skip_member_trigger = IFNULL(@skip_member_trigger, 0) + 1;
            SET v_guard = 1;

            UPDATE members
            SET
                {update_sql}
            WHERE id = v_member_id;

            SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
        END;
        """
    )


def _build_trigger(name: str, timing: str, event: str, table: str, body: str) -> str:
    return dedent(
        f"""
        CREATE TRIGGER {name}
        {timing} {event} ON {table}
        FOR EACH ROW
        {body}
        """
    )


def upgrade() -> None:
    conn = op.get_bind()

    member_cols = _get_columns(conn, "members")
    friend_cols = _get_columns(conn, "line_friends")

    _require_columns("members", member_cols, ["id", "line_uid"])
    _require_columns("line_friends", friend_cols, ["id", "line_uid", "member_id"])

    objects_to_drop = [
        "DROP TRIGGER IF EXISTS trg_members_ai_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_members_au_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_members_ad_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_line_friends_ai_sync_member",
        "DROP TRIGGER IF EXISTS trg_line_friends_au_sync_member",
        "DROP TRIGGER IF EXISTS trg_line_friends_ad_sync_member",
        "DROP PROCEDURE IF EXISTS sp_sync_member_to_line_friend",
        "DROP PROCEDURE IF EXISTS sp_sync_line_friend_to_member",
    ]
    for stmt in objects_to_drop:
        conn.execute(sa.text(stmt))

    conn.execute(sa.text(_build_member_to_friend_proc(member_cols, friend_cols)))
    conn.execute(sa.text(_build_friend_to_member_proc(member_cols, friend_cols)))

    member_delete_update = f"""
        UPDATE line_friends
        SET member_id = NULL{', updated_at = NOW()' if 'updated_at' in friend_cols else ''}
        WHERE member_id = OLD.id;
    """

    line_friend_delete_update = (
        "UPDATE members "
        f"SET line_uid = NULL{', updated_at = NOW()' if 'updated_at' in member_cols else ''} "
        "WHERE id = OLD.member_id AND line_uid = OLD.line_uid;"
    )

    triggers = [
        _build_trigger(
            "trg_members_ai_sync_line_friend",
            "AFTER",
            "INSERT",
            "members",
            "BEGIN\n            IF IFNULL(@skip_member_trigger, 0) = 0 THEN\n                CALL sp_sync_member_to_line_friend(NEW.id);\n            END IF;\n        END;",
        ),
        _build_trigger(
            "trg_members_au_sync_line_friend",
            "AFTER",
            "UPDATE",
            "members",
            "BEGIN\n            IF IFNULL(@skip_member_trigger, 0) = 0 THEN\n                CALL sp_sync_member_to_line_friend(NEW.id);\n            END IF;\n        END;",
        ),
        _build_trigger(
            "trg_members_ad_sync_line_friend",
            "AFTER",
            "DELETE",
            "members",
            dedent(
                f"""
                BEGIN
                    IF IFNULL(@skip_member_trigger, 0) = 0 THEN
                        SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 0) + 1;
                        {member_delete_update.strip()}
                        SET @skip_line_friend_trigger = IFNULL(@skip_line_friend_trigger, 1) - 1;
                    END IF;
                END;
                """
            ),
        ),
        _build_trigger(
            "trg_line_friends_ai_sync_member",
            "AFTER",
            "INSERT",
            "line_friends",
            "BEGIN\n            IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND NEW.member_id IS NOT NULL THEN\n                CALL sp_sync_line_friend_to_member(NEW.id);\n            END IF;\n        END;",
        ),
        _build_trigger(
            "trg_line_friends_au_sync_member",
            "AFTER",
            "UPDATE",
            "line_friends",
            "BEGIN\n            IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND NEW.member_id IS NOT NULL THEN\n                CALL sp_sync_line_friend_to_member(NEW.id);\n            END IF;\n        END;",
        ),
        _build_trigger(
            "trg_line_friends_ad_sync_member",
            "AFTER",
            "DELETE",
            "line_friends",
            dedent(
                f"""
                BEGIN
                    IF IFNULL(@skip_line_friend_trigger, 0) = 0 AND OLD.member_id IS NOT NULL THEN
                        SET @skip_member_trigger = IFNULL(@skip_member_trigger, 0) + 1;
                        {line_friend_delete_update}
                        SET @skip_member_trigger = IFNULL(@skip_member_trigger, 1) - 1;
                    END IF;
                END;
                """
            ),
        ),
    ]

    for trigger_sql in triggers:
        conn.execute(sa.text(trigger_sql))


def downgrade() -> None:
    conn = op.get_bind()
    statements = [
        "DROP TRIGGER IF EXISTS trg_line_friends_ad_sync_member",
        "DROP TRIGGER IF EXISTS trg_line_friends_au_sync_member",
        "DROP TRIGGER IF EXISTS trg_line_friends_ai_sync_member",
        "DROP TRIGGER IF EXISTS trg_members_ad_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_members_au_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_members_ai_sync_line_friend",
        "DROP PROCEDURE IF EXISTS sp_sync_line_friend_to_member",
        "DROP PROCEDURE IF EXISTS sp_sync_member_to_line_friend",
    ]
    for stmt in statements:
        conn.execute(sa.text(stmt))
