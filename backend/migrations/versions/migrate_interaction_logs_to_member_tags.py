"""migrate_interaction_logs_to_member_tags

將現有的 component_interaction_logs 資料同步到 member_interaction_tags 表，
實現「統一互動標籤存儲」的資料遷移。

遷移邏輯：
1. 找出所有有 interaction_tag_id 的 component_interaction_logs
2. 通過 line_id 關聯到 member_id
3. 聚合 click_count（按 member_id + tag_name 分組）
4. 插入到 member_interaction_tags（跳過已存在的標籤）

Revision ID: sync_interaction_logs_001
Revises: 69687b1f4576
Create Date: 2025-11-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = 'sync_interaction_logs_001'
down_revision: Union[str, None] = '69687b1f4576'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    將 component_interaction_logs 中的互動資料同步到 member_interaction_tags

    使用 INSERT ... ON DUPLICATE KEY UPDATE 實現 UPSERT：
    - 新標籤：INSERT with click_count
    - 已存在的標籤：累加 click_count
    """
    connection = op.get_bind()

    # 使用原生 SQL 執行批量遷移
    # 這個 SQL 會：
    # 1. 從 component_interaction_logs 和 interaction_tags 取得資料
    # 2. 通過 members.line_uid 關聯到 member_id
    # 3. 按 (member_id, tag_name) 聚合 click_count
    # 4. 使用 INSERT ... ON DUPLICATE KEY UPDATE 處理重複
    migrate_sql = text("""
        INSERT INTO member_interaction_tags
            (member_id, tag_name, tag_source, click_count, last_triggered_at, created_at)
        SELECT
            m.id AS member_id,
            it.tag_name,
            it.tag_source,
            COUNT(*) AS click_count,
            MAX(cil.triggered_at) AS last_triggered_at,
            NOW() AS created_at
        FROM component_interaction_logs cil
        INNER JOIN interaction_tags it ON cil.interaction_tag_id = it.id
        INNER JOIN members m ON cil.line_id = m.line_uid
        WHERE cil.interaction_tag_id IS NOT NULL
          AND m.line_uid IS NOT NULL
        GROUP BY m.id, it.tag_name, it.tag_source
        ON DUPLICATE KEY UPDATE
            click_count = member_interaction_tags.click_count + VALUES(click_count),
            last_triggered_at = GREATEST(
                COALESCE(member_interaction_tags.last_triggered_at, '1970-01-01'),
                VALUES(last_triggered_at)
            ),
            updated_at = NOW()
    """)

    result = connection.execute(migrate_sql)

    # 記錄遷移結果
    print(f"✅ 資料遷移完成: 影響 {result.rowcount} 筆記錄")


def downgrade() -> None:
    """
    回滾：刪除所有自動遷移的標籤（tag_source != 'CRM'）

    注意：這會刪除所有自動產生的互動標籤，但保留手動新增的（tag_source='CRM'）
    """
    connection = op.get_bind()

    # 只刪除非 CRM 來源的標籤（保留手動新增的）
    delete_sql = text("""
        DELETE FROM member_interaction_tags
        WHERE tag_source != 'CRM' OR tag_source IS NULL
    """)

    result = connection.execute(delete_sql)
    print(f"⚠️ 回滾完成: 刪除 {result.rowcount} 筆自動遷移的記錄")
