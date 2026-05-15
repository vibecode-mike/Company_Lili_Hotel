"""pms_integrations + faq_pms_connections add channel_id for multi-OA isolation

Revision ID: 0ef51a89c9bd
Revises: 19af6e748984
Create Date: 2026-05-15 12:18:51.974953

Phase D-3 多 OA 隔離：PMS 設定與 PMS 同步資料按 LINE OA 隔離。

- pms_integrations.channel_id：nullable + FK (SET NULL)。歷史資料無 channel；
  之後寫入時程式碼會帶上。
- faq_pms_connections.channel_id：NOT NULL + FK (CASCADE)。把唯一鍵從
  (faq_category_id) 改成 (faq_category_id, channel_id)，讓每個 OA 都能各自有
  一份 PMS 串接設定。既有資料 backfill 到思偉達飯店 channel `2005363092`。

注意：本 migration 只做 schema 變更，環境特定 backfill 已限定為「歸給思偉達」，
所有環境都共用同一個邏輯——若該環境的 faq_pms_connections 沒有任何 row（例如
全新部署），backfill UPDATE 為 no-op，安全。
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ef51a89c9bd'
down_revision: Union[str, None] = '19af6e748984'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SHIWEIDA_CHANNEL_ID = '2005363092'


def upgrade() -> None:
    # === pms_integrations ===
    # 加 channel_id（nullable），既有資料保持 NULL，新匯入時程式碼自動帶上
    op.add_column(
        'pms_integrations',
        sa.Column(
            'channel_id',
            sa.String(length=100),
            nullable=True,
            comment='所屬 LINE OA channel_id（多 OA 隔離）',
        ),
    )
    op.create_index('ix_pms_integrations_channel_id', 'pms_integrations', ['channel_id'])
    op.create_foreign_key(
        'fk_pms_integrations_channel_id',
        'pms_integrations',
        'line_channels',
        ['channel_id'],
        ['channel_id'],
        ondelete='SET NULL',
    )

    # === faq_pms_connections ===
    # 1) 加 channel_id（先 nullable，方便 backfill）
    op.add_column(
        'faq_pms_connections',
        sa.Column(
            'channel_id',
            sa.String(length=100),
            nullable=True,
            comment='所屬 LINE OA channel_id（多 OA 隔離）',
        ),
    )

    # 2) Backfill：既有 connection 歸給思偉達飯店 channel
    #    自我保護：只有當該環境的 line_channels 真的有這個 channel_id 時才 backfill，
    #    否則保持 NULL（後面 NOT NULL alter 會在有殘留 NULL 時 fail，逼 ops 處理）。
    #    這樣全新環境（fpc 0 筆）或 dev/staging/prod channel_id 不同的場景都安全。
    op.execute(
        f"""
        UPDATE faq_pms_connections fpc
        JOIN line_channels lc ON lc.channel_id = '{SHIWEIDA_CHANNEL_ID}'
        SET fpc.channel_id = lc.channel_id
        WHERE fpc.channel_id IS NULL
        """
    )

    # 3) 先加新的 composite unique（這樣 drop 舊 unique 後，FK 仍有 leftmost index 可用）
    op.create_unique_constraint(
        'uq_faq_pms_category_channel',
        'faq_pms_connections',
        ['faq_category_id', 'channel_id'],
    )

    # 4) 拿掉舊的 single-column unique（MySQL 預設名稱 = 欄位名 'faq_category_id'）
    op.drop_constraint('faq_category_id', 'faq_pms_connections', type_='unique')

    # 5) 收緊 channel_id 成 NOT NULL（backfill 後沒 NULL）
    op.alter_column(
        'faq_pms_connections',
        'channel_id',
        existing_type=sa.String(length=100),
        nullable=False,
        existing_comment='所屬 LINE OA channel_id（多 OA 隔離）',
    )

    # 6) 加 FK + 獨立索引
    op.create_index(
        'ix_faq_pms_connections_channel_id',
        'faq_pms_connections',
        ['channel_id'],
    )
    op.create_foreign_key(
        'fk_faq_pms_connections_channel_id',
        'faq_pms_connections',
        'line_channels',
        ['channel_id'],
        ['channel_id'],
        ondelete='CASCADE',
    )


def downgrade() -> None:
    # === faq_pms_connections ===
    op.drop_constraint('fk_faq_pms_connections_channel_id', 'faq_pms_connections', type_='foreignkey')
    op.drop_index('ix_faq_pms_connections_channel_id', table_name='faq_pms_connections')
    # 還原舊 unique 之前必須先 drop 新 composite，否則資料可能有 multi-row
    # 但同一個 faq_category_id（不同 channel）會違反舊 unique → downgrade 會失敗。
    # 這是預期行為：一旦升級進入多 OA 階段，downgrade 就是 one-way（會破壞多 OA 資料）。
    op.create_unique_constraint(
        'faq_category_id',
        'faq_pms_connections',
        ['faq_category_id'],
    )
    op.drop_constraint('uq_faq_pms_category_channel', 'faq_pms_connections', type_='unique')
    op.drop_column('faq_pms_connections', 'channel_id')

    # === pms_integrations ===
    op.drop_constraint('fk_pms_integrations_channel_id', 'pms_integrations', type_='foreignkey')
    op.drop_index('ix_pms_integrations_channel_id', table_name='pms_integrations')
    op.drop_column('pms_integrations', 'channel_id')
