"""rename members line fields

Revision ID: 6e2d4a0d7d1b
Revises: 21202841fcfd
Create Date: 2025-12-17

Rename:
- members.line_name -> members.line_display_name
- members.line_picture_url -> members.line_avatar

Also refresh member<->line_friend sync procedures/triggers because they may reference the old column names.
"""

from __future__ import annotations

from typing import Sequence, Union
from textwrap import dedent

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "6e2d4a0d7d1b"
down_revision: Union[str, None] = "21202841fcfd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_columns(conn, table_name: str) -> set[str]:
    if conn.dialect.name != "mysql":
        inspector = sa.inspect(conn)
        return {col["name"] for col in inspector.get_columns(table_name)}

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


def _escape_sql_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "''")


def _get_mysql_column_meta(conn, table_name: str, column_name: str) -> dict | None:
    row = conn.execute(
        sa.text(
            """
            SELECT
                COLUMN_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                EXTRA,
                COLUMN_COMMENT
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table
              AND COLUMN_NAME = :col
            """
        ),
        {"table": table_name, "col": column_name},
    ).mappings().first()
    return dict(row) if row else None


def _rename_mysql_column_preserve(conn, table_name: str, old: str, new: str) -> None:
    meta = _get_mysql_column_meta(conn, table_name, old)
    if not meta:
        return

    col_type = meta["COLUMN_TYPE"]
    nullable = meta["IS_NULLABLE"] == "YES"
    default = meta["COLUMN_DEFAULT"]
    extra = (meta.get("EXTRA") or "").strip()
    comment = meta.get("COLUMN_COMMENT") or ""

    parts = [
        f"ALTER TABLE `{table_name}` CHANGE `{old}` `{new}` {col_type}",
        "NULL" if nullable else "NOT NULL",
    ]

    # Default handling: common for these columns is NULL, so skip unless explicitly set.
    if default is not None:
        if isinstance(default, str):
            parts.append(f"DEFAULT '{_escape_sql_string(default)}'")
        else:
            parts.append(f"DEFAULT {default}")

    if extra:
        parts.append(extra)

    if comment:
        parts.append(f"COMMENT '{_escape_sql_string(comment)}'")

    conn.execute(sa.text(" ".join(parts)))


def _drop_member_line_friend_sync() -> None:
    for stmt in (
        "DROP TRIGGER IF EXISTS trg_line_friends_ad_sync_member",
        "DROP TRIGGER IF EXISTS trg_line_friends_au_sync_member",
        "DROP TRIGGER IF EXISTS trg_line_friends_ai_sync_member",
        "DROP TRIGGER IF EXISTS trg_members_ad_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_members_au_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_members_ai_sync_line_friend",
        "DROP PROCEDURE IF EXISTS sp_sync_line_friend_to_member",
        "DROP PROCEDURE IF EXISTS sp_sync_member_to_line_friend",
    ):
        op.execute(sa.text(stmt))


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
    member_display_expr = _build_expr(member_cols, ["line_display_name", "line_name"])
    member_picture_expr = _build_expr(member_cols, ["line_avatar", "line_picture_url"])

    friend_display_col = next(
        (col for col in ("line_display_name", "line_name") if col in friend_cols), None
    )
    friend_picture_col = next(
        (col for col in ("line_picture_url", "line_avatar") if col in friend_cols), None
    )

    insert_cols = ["line_uid", "member_id"]
    insert_vals = ["v_line_uid", "p_member_id"]

    update_parts = ["line_uid = v_line_uid", "member_id = p_member_id"]

    if friend_display_col:
        insert_cols.append(friend_display_col)
        insert_vals.append("v_display")
        update_parts.append(f"{friend_display_col} = COALESCE(v_display, {friend_display_col})")

    if friend_picture_col:
        insert_cols.append(friend_picture_col)
        insert_vals.append("v_picture")
        update_parts.append(f"{friend_picture_col} = COALESCE(v_picture, {friend_picture_col})")

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
        update_parts.append("last_interaction_at = COALESCE(last_interaction_at, NOW())")

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
    update_sql = "UPDATE line_friends " f"SET {', '.join(update_parts)} " "WHERE id = v_friend_id;"

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
    friend_display_expr = _build_expr(friend_cols, ["line_display_name", "line_name"])
    friend_picture_expr = _build_expr(friend_cols, ["line_picture_url", "line_avatar"])
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
    if "line_avatar" in member_cols:
        member_update_parts.append("line_avatar = COALESCE(v_picture, line_avatar)")
    if "line_picture_url" in member_cols:
        member_update_parts.append(
            "line_picture_url = COALESCE(v_picture, line_picture_url)"
        )
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


def _create_member_line_friend_sync(conn) -> None:
    member_cols = _get_columns(conn, "members")
    friend_cols = _get_columns(conn, "line_friends")

    # If the tables are missing (e.g. local dev), skip recreation rather than failing the rename.
    if not member_cols or not friend_cols:
        return

    _require_columns("members", member_cols, ["id", "line_uid"])
    _require_columns("line_friends", friend_cols, ["id", "line_uid", "member_id"])

    op.execute(sa.text("DROP PROCEDURE IF EXISTS sp_sync_member_to_line_friend"))
    op.execute(sa.text("DROP PROCEDURE IF EXISTS sp_sync_line_friend_to_member"))

    op.execute(sa.text(_build_member_to_friend_proc(member_cols, friend_cols)))
    op.execute(sa.text(_build_friend_to_member_proc(member_cols, friend_cols)))

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

    for stmt in (
        "DROP TRIGGER IF EXISTS trg_members_ai_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_members_au_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_members_ad_sync_line_friend",
        "DROP TRIGGER IF EXISTS trg_line_friends_ai_sync_member",
        "DROP TRIGGER IF EXISTS trg_line_friends_au_sync_member",
        "DROP TRIGGER IF EXISTS trg_line_friends_ad_sync_member",
    ):
        op.execute(sa.text(stmt))

    for trigger_sql in triggers:
        op.execute(sa.text(trigger_sql))


def upgrade() -> None:
    conn = op.get_bind()

    if conn.dialect.name != "mysql":
        # Non-MySQL environments don't support the stored procedures/triggers below.
        cols = _get_columns(conn, "members")
        if "line_name" in cols and "line_display_name" not in cols:
            op.alter_column("members", "line_name", new_column_name="line_display_name")
        if "line_picture_url" in cols and "line_avatar" not in cols:
            op.alter_column("members", "line_picture_url", new_column_name="line_avatar")
        return

    # Procedures/triggers may reference the old column names; drop first.
    _drop_member_line_friend_sync()

    cols = _get_columns(conn, "members")

    # Rename line_name -> line_display_name
    if "line_name" in cols and "line_display_name" not in cols:
        _rename_mysql_column_preserve(conn, "members", "line_name", "line_display_name")
    elif "line_name" in cols and "line_display_name" in cols:
        op.execute(
            sa.text(
                """
                UPDATE members
                SET line_display_name = COALESCE(NULLIF(line_display_name, ''), line_name)
                WHERE line_name IS NOT NULL AND line_name <> ''
                """
            )
        )
        op.drop_column("members", "line_name")

    cols = _get_columns(conn, "members")

    # Rename line_picture_url -> line_avatar
    if "line_picture_url" in cols and "line_avatar" not in cols:
        _rename_mysql_column_preserve(conn, "members", "line_picture_url", "line_avatar")
    elif "line_picture_url" in cols and "line_avatar" in cols:
        op.execute(
            sa.text(
                """
                UPDATE members
                SET line_avatar = COALESCE(NULLIF(line_avatar, ''), line_picture_url)
                WHERE line_picture_url IS NOT NULL AND line_picture_url <> ''
                """
            )
        )
        op.drop_column("members", "line_picture_url")

    # Recreate procedures/triggers using current column names.
    _create_member_line_friend_sync(conn)


def downgrade() -> None:
    conn = op.get_bind()

    if conn.dialect.name != "mysql":
        cols = _get_columns(conn, "members")
        if "line_display_name" in cols and "line_name" not in cols:
            op.alter_column("members", "line_display_name", new_column_name="line_name")
        if "line_avatar" in cols and "line_picture_url" not in cols:
            op.alter_column("members", "line_avatar", new_column_name="line_picture_url")
        return

    _drop_member_line_friend_sync()

    cols = _get_columns(conn, "members")

    # Reverse rename line_display_name -> line_name
    if "line_display_name" in cols and "line_name" not in cols:
        _rename_mysql_column_preserve(conn, "members", "line_display_name", "line_name")
    elif "line_display_name" in cols and "line_name" in cols:
        op.execute(
            sa.text(
                """
                UPDATE members
                SET line_name = COALESCE(NULLIF(line_name, ''), line_display_name)
                WHERE line_display_name IS NOT NULL AND line_display_name <> ''
                """
            )
        )
        op.drop_column("members", "line_display_name")

    cols = _get_columns(conn, "members")

    # Reverse rename line_avatar -> line_picture_url
    if "line_avatar" in cols and "line_picture_url" not in cols:
        _rename_mysql_column_preserve(conn, "members", "line_avatar", "line_picture_url")
    elif "line_avatar" in cols and "line_picture_url" in cols:
        op.execute(
            sa.text(
                """
                UPDATE members
                SET line_picture_url = COALESCE(NULLIF(line_picture_url, ''), line_avatar)
                WHERE line_avatar IS NOT NULL AND line_avatar <> ''
                """
            )
        )
        op.drop_column("members", "line_avatar")

    _create_member_line_friend_sync(conn)
