"""add FAQ and AI tables

Revision ID: 1afe56b89be0
Revises: bc93abf5b7fd
Create Date: 2026-02-26 03:12:30.798976

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1afe56b89be0'
down_revision: Union[str, None] = 'bc93abf5b7fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === 建立新表 ===

    op.create_table('industries',
        sa.Column('name', sa.String(length=50), nullable=False, comment='產業名稱'),
        sa.Column('is_active', sa.Boolean(), nullable=False, comment='是否啟用'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    op.create_table('ai_tone_configs',
        sa.Column('tone_type', sa.String(length=20), nullable=False, comment='語氣類型：professional / casual'),
        sa.Column('tone_name', sa.String(length=20), nullable=False, comment='語氣顯示名稱'),
        sa.Column('prompt_text', sa.Text(), nullable=False, comment='語氣 system prompt'),
        sa.Column('is_active', sa.Boolean(), nullable=False, comment='是否為當前啟用語氣'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('faq_module_auths',
        sa.Column('client_id', sa.String(length=100), nullable=False, comment='客戶帳號識別碼'),
        sa.Column('is_authorized', sa.Boolean(), nullable=False, comment='是否已授權'),
        sa.Column('authorized_at', sa.DateTime(), nullable=True, comment='授權開通時間'),
        sa.Column('authorized_by', sa.String(length=100), nullable=True, comment='授權操作者'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id')
    )

    op.create_table('ai_token_usages',
        sa.Column('industry_id', sa.BigInteger(), nullable=False, comment='所屬產業 ID'),
        sa.Column('total_quota', sa.BigInteger(), nullable=False, comment='Token 總額度'),
        sa.Column('used_amount', sa.BigInteger(), nullable=False, comment='已消耗 Token 數量'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.ForeignKeyConstraint(['industry_id'], ['industries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_token_usages_industry_id'), 'ai_token_usages', ['industry_id'], unique=False)

    op.create_table('faq_categories',
        sa.Column('industry_id', sa.BigInteger(), nullable=False, comment='所屬產業 ID'),
        sa.Column('name', sa.String(length=50), nullable=False, comment='大分類名稱'),
        sa.Column('is_active', sa.Boolean(), nullable=False, comment='是否啟用'),
        sa.Column('is_system_default', sa.Boolean(), nullable=False, comment='是否為系統預設大分類'),
        sa.Column('sort_order', sa.Integer(), nullable=False, comment='排序順序'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.ForeignKeyConstraint(['industry_id'], ['industries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_faq_categories_industry_id'), 'faq_categories', ['industry_id'], unique=False)

    op.create_table('faq_category_fields',
        sa.Column('category_id', sa.BigInteger(), nullable=False, comment='所屬大分類 ID'),
        sa.Column('field_name', sa.String(length=50), nullable=False, comment='欄位名稱'),
        sa.Column('field_type', sa.String(length=20), nullable=False, comment='欄位類型：text / tag'),
        sa.Column('is_required', sa.Boolean(), nullable=False, comment='是否為必填'),
        sa.Column('sort_order', sa.Integer(), nullable=False, comment='欄位排序順序'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.ForeignKeyConstraint(['category_id'], ['faq_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_faq_category_fields_category_id'), 'faq_category_fields', ['category_id'], unique=False)

    op.create_table('faq_rules',
        sa.Column('category_id', sa.BigInteger(), nullable=False, comment='所屬大分類 ID'),
        sa.Column('content_json', sa.Text(), nullable=False, comment='規則內容 JSON'),
        sa.Column('status', sa.String(length=20), nullable=False, comment='狀態：draft / active / disabled'),
        sa.Column('created_by', sa.BigInteger(), nullable=True, comment='建立者 User ID'),
        sa.Column('updated_by', sa.BigInteger(), nullable=True, comment='最後更新者 User ID'),
        sa.Column('published_at', sa.DateTime(), nullable=True, comment='最後發佈時間'),
        sa.Column('published_by', sa.BigInteger(), nullable=True, comment='最後發佈者 User ID'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.ForeignKeyConstraint(['category_id'], ['faq_categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['published_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_faq_rules_category_id'), 'faq_rules', ['category_id'], unique=False)
    op.create_index('ix_faq_rules_category_status', 'faq_rules', ['category_id', 'status'], unique=False)
    op.create_index('ix_faq_rules_status', 'faq_rules', ['status'], unique=False)

    op.create_table('faq_rule_tags',
        sa.Column('rule_id', sa.BigInteger(), nullable=False, comment='規則 ID'),
        sa.Column('tag_name', sa.String(length=20), nullable=False, comment='標籤名稱（對應 MemberTag.tag_name）'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.ForeignKeyConstraint(['rule_id'], ['faq_rules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('rule_id', 'tag_name', name='uq_faq_rule_tag')
    )
    op.create_index(op.f('ix_faq_rule_tags_rule_id'), 'faq_rule_tags', ['rule_id'], unique=False)
    op.create_index('ix_faq_rule_tags_tag_name', 'faq_rule_tags', ['tag_name'], unique=False)

    op.create_table('faq_rule_versions',
        sa.Column('rule_id', sa.BigInteger(), nullable=False, comment='所屬規則 ID'),
        sa.Column('content_json', sa.Text(), nullable=False, comment='版本內容快照 JSON'),
        sa.Column('status', sa.String(length=20), nullable=False, comment='快照時的規則狀態'),
        sa.Column('version_number', sa.Integer(), nullable=False, comment='版本號'),
        sa.Column('snapshot_at', sa.DateTime(), nullable=False, comment='快照建立時間'),
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False, comment='主鍵ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='創建時間'),
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新時間'),
        sa.ForeignKeyConstraint(['rule_id'], ['faq_rules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_faq_rule_versions_rule_id'), 'faq_rule_versions', ['rule_id'], unique=False)
    op.create_index('ix_faq_rule_versions_rule_version', 'faq_rule_versions', ['rule_id', 'version_number'], unique=False)

    # === Seed Data ===
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

    # Industry: 旅宿業
    op.execute(
        f"INSERT INTO industries (name, is_active, created_at) "
        f"VALUES ('旅宿業', 1, '{now}')"
    )

    # FaqCategory: 訂房, 設施 (industry_id=1)
    op.execute(
        f"INSERT INTO faq_categories (industry_id, name, is_active, is_system_default, sort_order, created_at) VALUES "
        f"((SELECT id FROM industries WHERE name='旅宿業'), '訂房', 1, 1, 1, '{now}'), "
        f"((SELECT id FROM industries WHERE name='旅宿業'), '設施', 1, 1, 2, '{now}')"
    )

    # FaqCategoryField: 訂房 7 欄位
    op.execute(
        f"INSERT INTO faq_category_fields (category_id, field_name, field_type, is_required, sort_order, created_at) VALUES "
        f"((SELECT id FROM faq_categories WHERE name='訂房' LIMIT 1), '房型名稱', 'text', 1, 1, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='訂房' LIMIT 1), '房型特色', 'text', 0, 2, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='訂房' LIMIT 1), '房價', 'text', 0, 3, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='訂房' LIMIT 1), '人數', 'text', 0, 4, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='訂房' LIMIT 1), '間數', 'text', 0, 5, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='訂房' LIMIT 1), 'url', 'text', 0, 6, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='訂房' LIMIT 1), '標籤', 'tag', 0, 7, '{now}')"
    )

    # FaqCategoryField: 設施 7 欄位
    op.execute(
        f"INSERT INTO faq_category_fields (category_id, field_name, field_type, is_required, sort_order, created_at) VALUES "
        f"((SELECT id FROM faq_categories WHERE name='設施' LIMIT 1), '設施名稱', 'text', 1, 1, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='設施' LIMIT 1), '位置', 'text', 0, 2, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='設施' LIMIT 1), '費用', 'text', 0, 3, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='設施' LIMIT 1), '開放時間', 'text', 0, 4, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='設施' LIMIT 1), '說明', 'text', 0, 5, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='設施' LIMIT 1), 'url', 'text', 0, 6, '{now}'), "
        f"((SELECT id FROM faq_categories WHERE name='設施' LIMIT 1), '標籤', 'tag', 0, 7, '{now}')"
    )

    # AiToneConfig: 專業 (active), 真人
    op.execute(
        f"INSERT INTO ai_tone_configs (tone_type, tone_name, prompt_text, is_active, created_at) VALUES "
        f"('professional', '專業', '你是飯店的專業客服人員。請使用正式、專業的語氣回答顧客的問題。回答應簡潔明瞭，提供準確的資訊。', 1, '{now}'), "
        f"('casual', '真人', '你是飯店的親切客服人員。請使用輕鬆、友善的口吻回答顧客的問題，就像跟朋友聊天一樣自然。適當使用口語化表達。', 0, '{now}')"
    )

    # AiTokenUsage: 旅宿業初始額度
    op.execute(
        f"INSERT INTO ai_token_usages (industry_id, total_quota, used_amount, created_at) VALUES "
        f"((SELECT id FROM industries WHERE name='旅宿業'), 0, 0, '{now}')"
    )


def downgrade() -> None:
    op.drop_index('ix_faq_rule_versions_rule_version', table_name='faq_rule_versions')
    op.drop_index(op.f('ix_faq_rule_versions_rule_id'), table_name='faq_rule_versions')
    op.drop_table('faq_rule_versions')
    op.drop_index('ix_faq_rule_tags_tag_name', table_name='faq_rule_tags')
    op.drop_index(op.f('ix_faq_rule_tags_rule_id'), table_name='faq_rule_tags')
    op.drop_table('faq_rule_tags')
    op.drop_index('ix_faq_rules_status', table_name='faq_rules')
    op.drop_index('ix_faq_rules_category_status', table_name='faq_rules')
    op.drop_index(op.f('ix_faq_rules_category_id'), table_name='faq_rules')
    op.drop_table('faq_rules')
    op.drop_index(op.f('ix_faq_category_fields_category_id'), table_name='faq_category_fields')
    op.drop_table('faq_category_fields')
    op.drop_index(op.f('ix_faq_categories_industry_id'), table_name='faq_categories')
    op.drop_table('faq_categories')
    op.drop_index(op.f('ix_ai_token_usages_industry_id'), table_name='ai_token_usages')
    op.drop_table('ai_token_usages')
    op.drop_table('industries')
    op.drop_table('faq_module_auths')
    op.drop_table('ai_tone_configs')
