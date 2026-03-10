"""add chatbot booking schema from spec

Revision ID: 5498ad9c6615
Revises: 1afe56b89be0
Create Date: 2026-03-05 13:48:32.628638

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "5498ad9c6615"
down_revision: Union[str, None] = "1afe56b89be0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # 新增：Facebook 頻道設定表（既有程式已使用，但 migration 尚未建立）
    if "fb_channels" not in existing_tables:
        op.create_table(
            "fb_channels",
            sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column(
                "page_id",
                sa.String(length=255),
                nullable=True,
                comment="Facebook Page ID",
            ),
            sa.Column(
                "page_access_token",
                sa.String(length=500),
                nullable=True,
                comment="FB 頻道存取權杖",
            ),
            sa.Column(
                "app_id",
                sa.String(length=255),
                nullable=True,
                comment="Facebook App ID",
            ),
            sa.Column(
                "app_secret",
                sa.String(length=255),
                nullable=True,
                comment="Facebook App Secret",
            ),
            sa.Column(
                "channel_name", sa.String(length=100), nullable=True, comment="頻道名稱"
            ),
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("1"),
                comment="是否啟用",
            ),
            sa.Column(
                "connection_status",
                sa.String(length=20),
                nullable=False,
                server_default=sa.text("'disconnected'"),
                comment="連結狀態: connected/expired/disconnected（系統自動偵測）",
            ),
            sa.Column(
                "last_verified_at",
                sa.DateTime(),
                nullable=True,
                comment="最後驗證時間（UTC）",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=True,
                server_default=sa.text("now()"),
                comment="建立時間",
            ),
            sa.Column("updated_at", sa.DateTime(), nullable=True, comment="更新時間"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("page_id"),
        )
        existing_tables.add("fb_channels")

    # 新增：官網 AI 聊天機器人 Session
    if "chatbot_sessions" not in existing_tables:
        op.create_table(
            "chatbot_sessions",
            sa.Column(
                "id", sa.String(length=36), nullable=False, comment="UUID，Session ID"
            ),
            sa.Column(
                "browser_key",
                sa.String(length=100),
                nullable=False,
                comment="瀏覽器唯一識別碼（Web Key）",
            ),
            sa.Column(
                "hotel_id",
                sa.BigInteger(),
                nullable=True,
                comment="飯店 ID（多租戶場景）",
            ),
            sa.Column(
                "intent_state",
                sa.String(length=20),
                nullable=False,
                server_default=sa.text("'detecting'"),
                comment="訂房意圖狀態：detecting | confirmed | none",
            ),
            sa.Column(
                "turn_count",
                sa.SmallInteger(),
                nullable=False,
                server_default=sa.text("0"),
                comment="本 Session 對話輪數",
            ),
            sa.Column(
                "booking_adults", sa.SmallInteger(), nullable=True, comment="入住大人數"
            ),
            sa.Column(
                "booking_children",
                sa.SmallInteger(),
                nullable=False,
                server_default=sa.text("0"),
                comment="入住小孩數",
            ),
            sa.Column("checkin_date", sa.Date(), nullable=True, comment="入住日期"),
            sa.Column("checkout_date", sa.Date(), nullable=True, comment="退房日期"),
            sa.Column(
                "selected_room_type",
                sa.String(length=100),
                nullable=True,
                comment="訪客選取的房型代碼",
            ),
            sa.Column(
                "selected_room_count",
                sa.SmallInteger(),
                nullable=True,
                comment="訪客選取的間數",
            ),
            sa.Column(
                "member_name",
                sa.String(length=100),
                nullable=True,
                comment="訪客姓名（暫存）",
            ),
            sa.Column(
                "member_phone",
                sa.String(length=20),
                nullable=True,
                comment="訪客電話（暫存）",
            ),
            sa.Column(
                "member_email",
                sa.String(length=255),
                nullable=True,
                comment="訪客 Email（暫存）",
            ),
            sa.Column(
                "crm_member_id",
                sa.BigInteger(),
                nullable=True,
                comment="寫入 CRM 後的 Member.id",
            ),
            sa.Column(
                "needs_human_followup",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("0"),
                comment="AI 無法回答時是否需要人工跟進",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
                comment="建立時間（UTC）",
            ),
            sa.Column(
                "updated_at", sa.DateTime(), nullable=True, comment="更新時間（UTC）"
            ),
            sa.ForeignKeyConstraint(
                ["crm_member_id"], ["members.id"], ondelete="SET NULL"
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            "idx_chatbot_session_browser_key",
            "chatbot_sessions",
            ["browser_key"],
            unique=False,
        )
        op.create_index(
            "idx_chatbot_session_browser_created",
            "chatbot_sessions",
            ["browser_key", "created_at"],
            unique=False,
        )
        existing_tables.add("chatbot_sessions")

    # 新增：FAQ 與 PMS 即時串接設定
    if "faq_pms_connections" not in existing_tables:
        op.create_table(
            "faq_pms_connections",
            sa.Column(
                "id",
                sa.BigInteger(),
                autoincrement=True,
                nullable=False,
                comment="唯一識別碼",
            ),
            sa.Column(
                "faq_category_id",
                sa.BigInteger(),
                nullable=False,
                comment="關聯的 FAQ 大分類",
            ),
            sa.Column(
                "api_endpoint",
                sa.String(length=500),
                nullable=False,
                comment="PMS 即時房況 API 端點 URL",
            ),
            sa.Column(
                "api_key_encrypted",
                sa.Text(),
                nullable=False,
                comment="AES-256 加密儲存的 PMS API Key",
            ),
            sa.Column(
                "auth_type",
                sa.String(length=20),
                nullable=False,
                comment="認證方式：api_key | bearer_token",
            ),
            sa.Column(
                "status",
                sa.String(length=20),
                nullable=False,
                server_default=sa.text("'disabled'"),
                comment="串接狀態：enabled | disabled | failed",
            ),
            sa.Column(
                "last_synced_at",
                sa.DateTime(),
                nullable=True,
                comment="最後連線成功時間",
            ),
            sa.Column(
                "error_message",
                sa.String(length=500),
                nullable=True,
                comment="最後一次錯誤訊息",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
                comment="建立時間（UTC）",
            ),
            sa.Column(
                "updated_at", sa.DateTime(), nullable=True, comment="更新時間（UTC）"
            ),
            sa.ForeignKeyConstraint(
                ["faq_category_id"], ["faq_categories.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("faq_category_id"),
        )
        existing_tables.add("faq_pms_connections")

    # 新增：官網 AI 聊天機器人訂房紀錄
    if "booking_records" not in existing_tables:
        op.create_table(
            "booking_records",
            sa.Column(
                "id", sa.String(length=36), nullable=False, comment="UUID，訂房紀錄 ID"
            ),
            sa.Column(
                "session_id",
                sa.String(length=36),
                nullable=False,
                comment="來源 ChatbotSession ID",
            ),
            sa.Column(
                "crm_member_id",
                sa.BigInteger(),
                nullable=True,
                comment="關聯的 CRM 會員 ID",
            ),
            sa.Column(
                "room_type_code",
                sa.String(length=100),
                nullable=False,
                comment="房型代碼",
            ),
            sa.Column(
                "room_type_name",
                sa.String(length=200),
                nullable=False,
                comment="房型名稱",
            ),
            sa.Column(
                "room_count", sa.SmallInteger(), nullable=False, comment="訂房間數"
            ),
            sa.Column("checkin_date", sa.Date(), nullable=False, comment="入住日期"),
            sa.Column("checkout_date", sa.Date(), nullable=False, comment="退房日期"),
            sa.Column("adults", sa.SmallInteger(), nullable=False, comment="大人數"),
            sa.Column(
                "children",
                sa.SmallInteger(),
                nullable=False,
                server_default=sa.text("0"),
                comment="小孩數",
            ),
            sa.Column(
                "pms_booking_url", sa.Text(), nullable=True, comment="PMS 購物車 URL"
            ),
            sa.Column(
                "pms_cart_id",
                sa.String(length=200),
                nullable=True,
                comment="PMS 端回傳的購物車 ID",
            ),
            sa.Column(
                "session_log",
                sa.JSON(),
                nullable=True,
                comment="完整 Session 對話紀錄 JSON",
            ),
            sa.Column(
                "data_source",
                sa.String(length=20),
                nullable=False,
                comment="房型資料來源：pms | faq_static",
            ),
            sa.Column(
                "source",
                sa.String(length=20),
                nullable=False,
                server_default=sa.text("'web_chatbot'"),
                comment="訂房來源標識",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
                comment="建立時間（UTC）",
            ),
            sa.ForeignKeyConstraint(
                ["crm_member_id"], ["members.id"], ondelete="SET NULL"
            ),
            sa.ForeignKeyConstraint(
                ["session_id"], ["chatbot_sessions.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            "idx_booking_record_member",
            "booking_records",
            ["crm_member_id"],
            unique=False,
        )
        op.create_index(
            "idx_booking_record_session",
            "booking_records",
            ["session_id"],
            unique=False,
        )
        op.create_index(
            "idx_booking_record_created",
            "booking_records",
            ["created_at"],
            unique=False,
        )
        existing_tables.add("booking_records")

    # 修改：補齊 pms_integrations v0.6 規格欄位（保留舊欄位，避免破壞既有流程）
    if "pms_integrations" in existing_tables:
        pms_columns = {col["name"] for col in inspector.get_columns("pms_integrations")}
        if "pms_type" not in pms_columns:
            op.add_column(
                "pms_integrations",
                sa.Column(
                    "pms_type",
                    sa.String(length=50),
                    nullable=True,
                    comment="PMS 系統類型",
                ),
            )
        if "api_endpoint" not in pms_columns:
            op.add_column(
                "pms_integrations",
                sa.Column(
                    "api_endpoint",
                    sa.String(length=500),
                    nullable=True,
                    comment="PMS API 端點",
                ),
            )
        if "api_key" not in pms_columns:
            op.add_column(
                "pms_integrations",
                sa.Column(
                    "api_key",
                    sa.Text(),
                    nullable=True,
                    comment="API 認證金鑰（加密儲存）",
                ),
            )
        if "config_json" not in pms_columns:
            op.add_column(
                "pms_integrations",
                sa.Column(
                    "config_json",
                    sa.JSON(),
                    nullable=True,
                    comment="PMS 特定配置（JSON）",
                ),
            )
        if "sync_status" not in pms_columns:
            op.add_column(
                "pms_integrations",
                sa.Column(
                    "sync_status",
                    sa.String(length=20),
                    nullable=False,
                    server_default=sa.text("'active'"),
                    comment="同步狀態",
                ),
            )
        if "last_sync_at" not in pms_columns:
            op.add_column(
                "pms_integrations",
                sa.Column(
                    "last_sync_at",
                    sa.DateTime(),
                    nullable=True,
                    comment="最後同步時間（UTC）",
                ),
            )
        if "consecutive_failed_count" not in pms_columns:
            op.add_column(
                "pms_integrations",
                sa.Column(
                    "consecutive_failed_count",
                    sa.Integer(),
                    nullable=False,
                    server_default=sa.text("0"),
                    comment="連續同步失敗次數",
                ),
            )
        if "last_failed_at" not in pms_columns:
            op.add_column(
                "pms_integrations",
                sa.Column(
                    "last_failed_at",
                    sa.DateTime(),
                    nullable=True,
                    comment="最近一次同步失敗時間（UTC）",
                ),
            )

        pms_indexes = {idx["name"] for idx in inspector.get_indexes("pms_integrations")}
        if "ix_pms_integrations_sync_status" not in pms_indexes:
            op.create_index(
                "ix_pms_integrations_sync_status",
                "pms_integrations",
                ["sync_status"],
                unique=False,
            )
        if "ix_pms_integrations_last_sync_at" not in pms_indexes:
            op.create_index(
                "ix_pms_integrations_last_sync_at",
                "pms_integrations",
                ["last_sync_at"],
                unique=False,
            )

    # 刪除：清理已棄用舊表（若歷史環境仍殘留）
    if "message_records" in existing_tables:
        op.drop_table("message_records")
    if "chat_logs" in existing_tables:
        op.drop_table("chat_logs")


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # 回滾 pms_integrations 新增欄位與索引
    if "pms_integrations" in existing_tables:
        pms_indexes = {idx["name"] for idx in inspector.get_indexes("pms_integrations")}
        if "ix_pms_integrations_last_sync_at" in pms_indexes:
            op.drop_index(
                "ix_pms_integrations_last_sync_at", table_name="pms_integrations"
            )
        if "ix_pms_integrations_sync_status" in pms_indexes:
            op.drop_index(
                "ix_pms_integrations_sync_status", table_name="pms_integrations"
            )

        pms_columns = {col["name"] for col in inspector.get_columns("pms_integrations")}
        for col in (
            "last_failed_at",
            "consecutive_failed_count",
            "last_sync_at",
            "sync_status",
            "config_json",
            "api_key",
            "api_endpoint",
            "pms_type",
        ):
            if col in pms_columns:
                op.drop_column("pms_integrations", col)

    # 回滾新增表（逆序）
    if "booking_records" in existing_tables:
        op.drop_table("booking_records")

    if "faq_pms_connections" in existing_tables:
        op.drop_table("faq_pms_connections")

    if "chatbot_sessions" in existing_tables:
        op.drop_table("chatbot_sessions")

    if "fb_channels" in existing_tables:
        op.drop_table("fb_channels")
