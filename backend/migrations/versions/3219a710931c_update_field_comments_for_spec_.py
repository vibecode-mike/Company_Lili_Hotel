"""update_field_comments_for_spec_clarification

Revision ID: 3219a710931c
Revises: 23aaa1ac9d45
Create Date: 2025-11-13 05:19:02.936416

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3219a710931c'
down_revision: Union[str, None] = '23aaa1ac9d45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    根據 spec 澄清過程更新欄位註解:
    1. members.line_avatar - 更新為詳細的 CDN URL 說明
    2. member_tags.tag_name - 添加格式限制說明
    3. interaction_tags.tag_name - 添加格式限制說明
    """
    # 更新 members.line_avatar 注释
    op.alter_column(
        'members',
        'line_avatar',
        existing_type=sa.String(500),
        comment='LINE 會員頭像 CDN URL（儲存 LINE 提供的完整 URL，如 https://profile.line-scdn.net/xxxxx），若無頭像或 URL 失效則顯示預設頭像。URL 來源：會員加入時從 LINE Profile API 取得，儲存後不定期更新。前端顯示時直接載入此 URL',
        existing_nullable=True
    )

    # 更新 member_tags.tag_name 注释
    op.alter_column(
        'member_tags',
        'tag_name',
        existing_type=sa.String(20),
        comment='標籤名稱，不得超過 20 個字元（中英文皆計算，每個字元計 1）。格式限制：僅允許中文（\\u4e00-\\u9fa5）、英文（a-zA-Z）、數字（0-9）、空格，禁止特殊字元與 Emoji。驗證：前端使用正則表達式 /^[\\u4e00-\\u9fa5a-zA-Z0-9\\s]+$/ 即時驗證',
        existing_nullable=False
    )

    # 更新 interaction_tags.tag_name 注释
    op.alter_column(
        'interaction_tags',
        'tag_name',
        existing_type=sa.String(20),
        comment='標籤名稱，不得超過 20 個字元（中英文皆計算，每個字元計 1）。格式限制：僅允許中文（\\u4e00-\\u9fa5）、英文（a-zA-Z）、數字（0-9）、空格，禁止特殊字元與 Emoji。驗證：前端使用正則表達式 /^[\\u4e00-\\u9fa5a-zA-Z0-9\\s]+$/ 即時驗證',
        existing_nullable=False
    )


def downgrade() -> None:
    """
    回滾到原始註解
    """
    # 還原 members.line_avatar 注释
    op.alter_column(
        'members',
        'line_avatar',
        existing_type=sa.String(500),
        comment='LINE 頭像 URL',
        existing_nullable=True
    )

    # 還原 member_tags.tag_name 注释
    op.alter_column(
        'member_tags',
        'tag_name',
        existing_type=sa.String(20),
        comment='標籤名稱',
        existing_nullable=False
    )

    # 還原 interaction_tags.tag_name 注释
    op.alter_column(
        'interaction_tags',
        'tag_name',
        existing_type=sa.String(20),
        comment='標籤名稱',
        existing_nullable=False
    )
