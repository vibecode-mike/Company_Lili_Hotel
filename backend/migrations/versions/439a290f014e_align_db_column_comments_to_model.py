"""align_db_column_comments_to_model

對齊 DB column comment 到 model — 42 處 comment 從 DB 端拉齊 model 端字串。

歷史脈絡：
- Dev 工作流是頻繁改 model comment，但不寫對應 migration 改 DB comment（太麻煩）
- 結果：DB comments 都是 stale 化石（初始 create_table 時的字串、或 column rename 殘留）
- Model comments 才是當前 dev 認知，git blame 顯示每項都比 DB 較新

本 migration 純改 DB 端 information_schema.COLUMNS.COLUMN_COMMENT，
不動資料、不動型別、不動 nullable、不動 default。

跳過的 4 項（仍會在 alembic check 顯示為 drift）：
- faq_pms_connections.id / created_at / updated_at（從 Base 繼承，model 沒明寫）
- line_friends.updated_at（SQLAlchemy 父子類繼承 quirk，字串本來就一樣）

Downgrade：no-op（DB 原始 comments 是各時期化石、難以準確還原）。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '439a290f014e'
down_revision: Union[str, None] = '8b770f5d4f20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('auto_response_keywords', 'created_at',
        existing_type=sa.DateTime(),
        existing_nullable=False,
        comment='建立時間')
    op.alter_column('auto_response_keywords', 'id',
        existing_type=sa.BigInteger(),
        existing_nullable=False,
        comment='')
    op.alter_column('auto_response_keywords', 'updated_at',
        existing_type=sa.DateTime(),
        existing_nullable=True,
        comment='更新時間')
    op.alter_column('auto_responses', 'weekdays',
        existing_type=sa.String(length=20),
        existing_nullable=True,
        comment='週期性星期設定，逗號分隔：1=週一...7=週日，如 1,2,3,4,5')
    op.alter_column('booking_records', 'adults',
        existing_type=sa.SmallInteger(),
        existing_nullable=False,
        comment='總大人數（由 selected_rooms 累加）')
    op.alter_column('booking_records', 'checkout_date',
        existing_type=sa.Date(),
        existing_nullable=False,
        comment='退房日期；必須晚於 checkin_date')
    op.alter_column('booking_records', 'created_at',
        existing_type=sa.DateTime(),
        existing_nullable=False,
        comment='建立時間（UTC），即訪客點擊「立即預訂」的時間')
    op.alter_column('booking_records', 'crm_member_id',
        existing_type=sa.BigInteger(),
        existing_nullable=True,
        comment='關聯的 CRM 會員 ID；ENABLE_DB=false 時為 null')
    op.alter_column('booking_records', 'id',
        existing_type=sa.String(length=36),
        existing_nullable=False,
        comment='UUID，訂房紀錄 ID（reservation_id）')
    op.alter_column('booking_records', 'room_count',
        existing_type=sa.SmallInteger(),
        existing_nullable=False,
        comment='向下相容：selected_rooms[0].room_count')
    op.alter_column('booking_records', 'room_type_code',
        existing_type=sa.String(length=100),
        existing_nullable=False,
        comment='向下相容：selected_rooms[0].room_type_code')
    op.alter_column('booking_records', 'room_type_name',
        existing_type=sa.String(length=200),
        existing_nullable=False,
        comment='向下相容：selected_rooms[0].room_type_name')
    op.alter_column('booking_records', 'source',
        existing_type=sa.String(length=20),
        existing_nullable=False,
        comment='訂房來源標識，固定為 Webchat')
    op.alter_column('chatbot_sessions', 'selected_room_count',
        existing_type=sa.SmallInteger(),
        existing_nullable=True,
        comment='向下相容欄位：selected_rooms[0].room_count')
    op.alter_column('chatbot_sessions', 'selected_room_type',
        existing_type=sa.String(length=100),
        existing_nullable=True,
        comment='向下相容欄位：selected_rooms[0].room_type_code')
    op.alter_column('conversation_messages', 'created_at',
        existing_type=sa.DateTime(),
        existing_nullable=True,
        comment='建立時間')
    op.alter_column('conversation_messages', 'direction',
        existing_type=sa.String(length=20),
        existing_nullable=True,
        comment='方向：incoming/outgoing')
    op.alter_column('conversation_messages', 'message_source',
        existing_type=sa.String(length=20),
        existing_nullable=True,
        comment='訊息來源：webhook|manual|gpt|keyword|welcome|always|broadcast')
    op.alter_column('conversation_messages', 'role',
        existing_type=sa.String(length=20),
        existing_nullable=True,
        comment='角色：user / assistant')
    op.alter_column('conversation_messages', 'thread_id',
        existing_type=sa.String(length=150),
        existing_nullable=False,
        comment='所屬對話串')
    op.alter_column('conversation_messages', 'updated_at',
        existing_type=sa.DateTime(),
        existing_nullable=True,
        comment='更新時間')
    op.alter_column('conversation_threads', 'id',
        existing_type=sa.String(length=150),
        existing_nullable=False,
        comment='對話串ID，直接使用渠道 UID')
    op.alter_column('faq_rules', 'status',
        existing_type=sa.String(length=20),
        existing_nullable=False,
        comment='發佈狀態：draft（未發佈）/ active（已發佈）')
    op.alter_column('fb_channels', 'is_active',
        existing_type=sa.Boolean(),
        existing_nullable=False,
        comment='是否啟用（管理員手動控制）')
    op.alter_column('line_channels', 'channel_id',
        existing_type=sa.String(length=100),
        existing_nullable=True,
        comment='Messaging API Channel ID')
    op.alter_column('line_channels', 'login_channel_id',
        existing_type=sa.String(length=100),
        existing_nullable=True,
        comment='LINE Login Channel ID')
    op.alter_column('line_channels', 'login_channel_secret',
        existing_type=sa.String(length=100),
        existing_nullable=True,
        comment='LINE Login Channel Secret')
    op.alter_column('member_interaction_tags', 'click_count',
        existing_type=sa.Integer(),
        existing_nullable=False,
        comment='點擊次數，>= 1。預設值：1（首次點擊）。重複點擊同一組合時執行 UPDATE click_count = click_count + 1，累計點擊次數不去重。手動標籤此欄位固定為 1')
    op.alter_column('members', 'fb_customer_id',
        existing_type=sa.String(length=100),
        existing_nullable=True,
        comment='Facebook Customer ID，透過 Facebook OAuth 登入時取得')
    op.alter_column('members', 'id_number',
        existing_type=sa.String(length=20),
        existing_nullable=True,
        comment='身分證字號')
    op.alter_column('members', 'join_source',
        existing_type=sa.String(length=20),
        existing_nullable=False,
        comment='加入來源：LINE/CRM/PMS/ERP/系統/Webchat')
    op.alter_column('message_deliveries', 'clicked_at',
        existing_type=sa.DateTime(),
        existing_nullable=True,
        comment='點擊時間（UTC）')
    op.alter_column('message_deliveries', 'delivery_id',
        existing_type=sa.String(length=50),
        existing_nullable=False,
        comment='發送記錄唯一識別碼')
    op.alter_column('message_deliveries', 'delivery_status',
        existing_type=sa.String(length=20),
        existing_nullable=False,
        comment='狀態：pending/sent/failed/opened/clicked')
    op.alter_column('message_deliveries', 'failure_reason',
        existing_type=sa.String(length=500),
        existing_nullable=True,
        comment='發送失敗原因')
    op.alter_column('message_deliveries', 'opened_at',
        existing_type=sa.DateTime(),
        existing_nullable=True,
        comment='開啟時間（UTC）')
    op.alter_column('message_deliveries', 'sent_at',
        existing_type=sa.DateTime(),
        existing_nullable=True,
        comment='實際發送時間（UTC）')
    op.alter_column('messages', 'message_title',
        existing_type=sa.String(length=500),
        existing_nullable=True,
        comment='訊息標題（用於列表顯示）')
    op.alter_column('messages', 'send_status',
        existing_type=sa.String(length=20),
        existing_nullable=False,
        comment='發送狀態：draft/scheduled/sending/sent/failed')
    op.alter_column('message_templates', 'notification_message',
        existing_type=sa.String(length=100),
        existing_nullable=True,
        comment='通知推播訊息（顯示在手機通知欄）')
    op.alter_column('pms_integrations', 'config_json',
        existing_type=sa.JSON(),
        existing_nullable=True,
        comment='PMS 特定配置（JSON格式）')
    op.alter_column('pms_integrations', 'sync_status',
        existing_type=sa.String(length=20),
        existing_nullable=False,
        comment='同步狀態：active/failed/disabled')



def downgrade() -> None:
    """Downgrade is no-op — original DB comments were a mix of fossils from various points in time and would be impractical to restore accurately."""
    pass

