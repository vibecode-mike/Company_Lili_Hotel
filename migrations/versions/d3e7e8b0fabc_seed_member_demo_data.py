"""seed member demo data"""
from datetime import datetime

from alembic import op


# revision identifiers, used by Alembic.
revision = "d3e7e8b0fabc"
down_revision = "c6c141f82b63"
branch_labels = None
depends_on = None


SAMPLE_MEMBERS = [
    {
        "line_uid": "U0000000000000000000000000000001",
        "line_name": "User Name",
        "name": "Real Name",
        "phone": "0987654321",
        "email": "chox.ox@gmail.com",
        "avatar": "https://picsum.photos/seed/member1/200/200",
        "created_at": datetime(2025, 10, 2, 10, 40, 0),
        "last_interaction_at": datetime(2025, 10, 2, 18, 40, 0),
        "member_tags": ["VIP", "消費力高", "忠實顧客"],
        "interaction_tags": ["優惠活動", "伴手禮", "KOL"],
    },
    {
        "line_uid": "U0000000000000000000000000000002",
        "line_name": "JaneDoe88",
        "name": "Jane Doe",
        "phone": "0912345678",
        "email": "janedoe88@example.com",
        "avatar": "https://picsum.photos/seed/member2/200/200",
        "created_at": datetime(2025, 10, 3, 10, 0, 0),
        "last_interaction_at": datetime(2025, 10, 3, 10, 30, 0),
        "member_tags": ["新會員", "潛力客戶"],
        "interaction_tags": ["夏季特惠", "手工皂", "BeautyBlogger", "美容保養"],
    },
    {
        "line_uid": "U0000000000000000000000000000003",
        "line_name": "ChocLover",
        "name": "John Smith",
        "phone": "0923456789",
        "email": "john.smith@example.com",
        "avatar": "https://picsum.photos/seed/member3/200/200",
        "created_at": datetime(2025, 10, 4, 14, 20, 0),
        "last_interaction_at": datetime(2025, 10, 4, 16, 45, 0),
        "member_tags": ["常客", "送禮需求", "節日購物"],
        "interaction_tags": ["聖誕促銷", "巧克力禮盒", "Foodie"],
    },
]


def _insert_member(member):
    op.execute(
        """
        INSERT INTO members (
            line_uid, line_name, name, phone, email, join_source,
            line_avatar, created_at, updated_at, last_interaction_at
        )
        SELECT
            :line_uid, :line_name, :name, :phone, :email, 'LINE',
            :avatar, :created_at, :created_at, :last_interaction_at
        WHERE NOT EXISTS (
            SELECT 1 FROM members WHERE line_uid = :line_uid
        )
        """,
        member,
    )


def _insert_member_tag(line_uid: str, tag: str, ts: datetime):
    op.execute(
        """
        INSERT INTO member_tags (
            member_id, tag_name, tag_source, trigger_count,
            trigger_member_count, tagged_at, created_at, updated_at
        )
        SELECT
            m.id, :tag_name, 'CRM', 0, 0, :ts, :ts, :ts
        FROM members m
        WHERE m.line_uid = :line_uid
          AND NOT EXISTS (
            SELECT 1 FROM member_tags 
            WHERE member_id = m.id AND tag_name = :tag_name
        )
        """,
        {"line_uid": line_uid, "tag_name": tag, "ts": ts},
    )


def _ensure_interaction_tag(tag_name: str, ts: datetime):
    op.execute(
        """
        INSERT INTO interaction_tags (
            tag_name, tag_source, trigger_count, trigger_member_count,
            created_at, updated_at
        )
        SELECT :tag_name, '訊息模板', 0, 0, :ts, :ts
        WHERE NOT EXISTS (
            SELECT 1 FROM interaction_tags WHERE tag_name = :tag_name
        )
        """,
        {"tag_name": tag_name, "ts": ts},
    )


def _link_interaction_record(line_uid: str, tag_name: str, ts: datetime):
    op.execute(
        """
        INSERT INTO member_interaction_records (
            member_id, tag_id, message_id, triggered_at, created_at
        )
        SELECT m.id, t.id, NULL, :ts, :ts
        FROM members m
        JOIN interaction_tags t ON t.tag_name = :tag_name
        WHERE m.line_uid = :line_uid
          AND NOT EXISTS (
            SELECT 1 FROM member_interaction_records
            WHERE member_id = m.id AND tag_id = t.id AND message_id IS NULL
        )
        """,
        {"line_uid": line_uid, "tag_name": tag_name, "ts": ts},
    )


def upgrade() -> None:
    for member in SAMPLE_MEMBERS:
        _insert_member(member)
        ts = member["created_at"]

        for tag in member.get("member_tags", []):
            _insert_member_tag(member["line_uid"], tag, ts)

        for tag in member.get("interaction_tags", []):
            _ensure_interaction_tag(tag, ts)
            _link_interaction_record(member["line_uid"], tag, ts)


def downgrade() -> None:
    # Remove interaction records and tags we created
    for member in SAMPLE_MEMBERS:
        line_uid = member["line_uid"]

        for tag in member.get("interaction_tags", []):
            op.execute(
                """
                DELETE mir FROM member_interaction_records mir
                JOIN members m ON m.id = mir.member_id
                JOIN interaction_tags t ON t.id = mir.tag_id
                WHERE m.line_uid = :line_uid AND t.tag_name = :tag_name
                """,
                {"line_uid": line_uid, "tag_name": tag},
            )

        op.execute(
            """
            DELETE mt FROM member_tags mt
            JOIN members m ON m.id = mt.member_id
            WHERE m.line_uid = :line_uid
            """,
            {"line_uid": line_uid},
        )

        op.execute(
            """
            DELETE FROM members WHERE line_uid = :line_uid
            """,
            {"line_uid": line_uid},
        )

    # 清理互動標籤（僅在該標籤沒有其他紀錄時刪除）
    for tag in {tag for m in SAMPLE_MEMBERS for tag in m.get("interaction_tags", [])}:
        op.execute(
            """
            DELETE FROM interaction_tags
            WHERE tag_name = :tag_name
              AND NOT EXISTS (
                  SELECT 1 FROM member_interaction_records mir
                  JOIN interaction_tags t ON t.id = mir.tag_id
                  WHERE t.tag_name = :tag_name
              )
            """,
            {"tag_name": tag},
        )
