"""add_booking_record_full_fields

Revision ID: 002
Revises: 5498ad9c6615
Create Date: 2026-03-10 15:23:30.465213

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '5498ad9c6615'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    # --- booking_records: 補齊 DBML 規格欄位 ---
    if "booking_records" in inspector.get_table_names():
        existing_cols = {col["name"] for col in inspector.get_columns("booking_records")}

        if "selected_rooms" not in existing_cols:
            # 先加 nullable=True，後續可由應用層保證非空
            op.add_column(
                "booking_records",
                sa.Column(
                    "selected_rooms",
                    sa.JSON(),
                    nullable=True,
                    comment="多房型混搭快照陣列，格式 [{room_type_code, room_type_name, room_count, source}]",
                ),
            )
        if "member_name" not in existing_cols:
            op.add_column(
                "booking_records",
                sa.Column(
                    "member_name",
                    sa.String(length=100),
                    nullable=True,
                    comment="訪客姓名快照（訂房當下的值）",
                ),
            )
        if "member_phone" not in existing_cols:
            op.add_column(
                "booking_records",
                sa.Column(
                    "member_phone",
                    sa.String(length=20),
                    nullable=True,
                    comment="訪客電話快照，10 位數字",
                ),
            )
        if "member_email" not in existing_cols:
            op.add_column(
                "booking_records",
                sa.Column(
                    "member_email",
                    sa.String(length=255),
                    nullable=True,
                    comment="訪客 Email 快照，需含 @",
                ),
            )
        if "cart_url" not in existing_cols:
            op.add_column(
                "booking_records",
                sa.Column(
                    "cart_url",
                    sa.String(length=500),
                    nullable=True,
                    comment="PMS 購物車 URL（booking-save 呼叫 PMS 建立購物車後儲存）",
                ),
            )
        if "db_saved" not in existing_cols:
            op.add_column(
                "booking_records",
                sa.Column(
                    "db_saved",
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.text("1"),
                    comment="true=正式 DB 寫入；false=測試模式 JSON 降級",
                ),
            )

    # --- chatbot_sessions: 補齊 room_plan_requests / selected_rooms ---
    if "chatbot_sessions" in inspector.get_table_names():
        existing_cols = {col["name"] for col in inspector.get_columns("chatbot_sessions")}

        if "room_plan_requests" not in existing_cols:
            op.add_column(
                "chatbot_sessions",
                sa.Column(
                    "room_plan_requests",
                    sa.JSON(),
                    nullable=True,
                    comment="幾間幾人房請求陣列，格式 [{room_count, adults_per_room}]；rotate 時清空",
                ),
            )
        if "selected_rooms" not in existing_cols:
            op.add_column(
                "chatbot_sessions",
                sa.Column(
                    "selected_rooms",
                    sa.JSON(),
                    nullable=True,
                    comment="訪客點選確認的房型與間數陣列，格式 [{room_type_code, room_type_name, room_count, source}]",
                ),
            )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    if "chatbot_sessions" in inspector.get_table_names():
        existing_cols = {col["name"] for col in inspector.get_columns("chatbot_sessions")}
        if "selected_rooms" in existing_cols:
            op.drop_column("chatbot_sessions", "selected_rooms")
        if "room_plan_requests" in existing_cols:
            op.drop_column("chatbot_sessions", "room_plan_requests")

    if "booking_records" in inspector.get_table_names():
        existing_cols = {col["name"] for col in inspector.get_columns("booking_records")}
        for col in ("db_saved", "cart_url", "member_email", "member_phone", "member_name", "selected_rooms"):
            if col in existing_cols:
                op.drop_column("booking_records", col)
