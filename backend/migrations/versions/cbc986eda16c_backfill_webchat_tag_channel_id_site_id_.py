"""backfill webchat tag channel_id site_id to line_channel_id

把 tag_trigger_logs / member_interaction_tags / member_tags 三表中
channel_id 為 webchat site_id 的舊資料，依 webchat_site_channels 對應表
換成 LINE OA channel_id。

背景：
  webchat 端原本把 member_*.channel_id / tag_trigger_logs.channel_id 存成
  webchat_site_id（如 'starbit-mike'），但 analytics / 多 OA 隔離一律以
  LINE OA channel_id（如 '2005363092'）為單一識別 → 對不上 → 官網人次
  永遠 0、Webchat 訪客跨 OA 顯示。

  寫入端已修：
    - platform_channel_resolver.resolve_for_member webchat 回傳 line_channel_id
    - chatbot_service.track_widget_click 改用 member.line_channel_id

  本 migration 處理已寫入的舊資料（dev 上目前 12 列：6 + 1 + 5）。
  使用 JOIN 寫法避免硬編對應，未來新增 site 也安全（只要 webchat_site_channels
  有對應就會被 backfill）。idempotent — 重跑沒事（match 不到就 0 rows affected）。

Revision ID: cbc986eda16c
Revises: 09056438428d
Create Date: 2026-05-18 15:28:56.325750

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'cbc986eda16c'
down_revision: Union[str, None] = '09056438428d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TABLES = ('tag_trigger_logs', 'member_interaction_tags', 'member_tags')


def upgrade() -> None:
    # 每張表都用 JOIN webchat_site_channels 把 channel_id 從 site_id 換成 LINE OA channel_id
    # JOIN ON wsc.site_id = t.channel_id 確保只動到舊式 site_id 列（不會誤改 LINE 列）
    for tbl in _TABLES:
        op.execute(f"""
            UPDATE {tbl} t
            JOIN webchat_site_channels wsc ON wsc.site_id = t.channel_id
            SET t.channel_id = wsc.line_channel_id
        """)


def downgrade() -> None:
    # 回滾：把 LINE OA channel_id 換回 site_id
    # ⚠️ 注意：若同一個 LINE OA channel_id 對應多個 webchat site（未來情境），
    #        此 downgrade 會塞錯 site_id。目前 1:1 安全。
    for tbl in _TABLES:
        op.execute(f"""
            UPDATE {tbl} t
            JOIN webchat_site_channels wsc ON wsc.line_channel_id = t.channel_id
            SET t.channel_id = wsc.site_id
        """)
