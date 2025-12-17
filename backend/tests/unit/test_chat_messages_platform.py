import os
import sys
import pytest
import uuid
from datetime import datetime

# Override required env vars before importing app modules
os.environ.setdefault("SECRET_KEY", "test")
os.environ.setdefault("LINE_CHANNEL_ACCESS_TOKEN", "test")
os.environ.setdefault("LINE_CHANNEL_SECRET", "test")
os.environ.setdefault("OPENAI_API_KEY", "test")

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.api.v1.chat_messages import get_chat_messages
from app.models.member import Member
from app.models.conversation import ConversationThread, ConversationMessage


class DummyAsyncSession:
    def __init__(self, sync_session):
        self._sync_session = sync_session

    def add(self, obj):
        return self._sync_session.add(obj)

    def add_all(self, objs):
        return self._sync_session.add_all(objs)

    async def execute(self, stmt, params=None):
        return self._sync_session.execute(stmt, params or {})

    async def commit(self):
        return self._sync_session.commit()

    async def flush(self):
        return self._sync_session.flush()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        self._sync_session.close()


@pytest.mark.asyncio
async def test_get_chat_messages_by_platform():
    engine = create_engine("sqlite:///:memory:", echo=False, future=True)
    # 只建立所需表，避免 SQLite 不支持 MEDIUMTEXT
    Member.__table__.create(engine)
    ConversationThread.__table__.create(engine)
    ConversationMessage.__table__.create(engine)
    SessionLocal = sessionmaker(bind=engine)

    sync_session = SessionLocal()
    async_session = DummyAsyncSession(sync_session)

    member = Member(
        id=1,
        email="user@example.com",
        line_uid="U1",
        fb_uid="F1",
        webchat_uid="W1",
        join_source="LINE",
        last_interaction_at=datetime.utcnow(),
    )
    async_session.add(member)
    async_session.add_all(
        [
            # thread_id uses platform_uid; platform is stored in a separate column.
            ConversationThread(id="U1", member_id=1, platform="LINE", platform_uid="U1"),
            ConversationThread(id="F1", member_id=1, platform="Facebook", platform_uid="F1"),
            ConversationThread(id="W1", member_id=1, platform="Webchat", platform_uid="W1"),
        ]
    )
    async_session.add_all(
        [
            ConversationMessage(
                id=str(uuid.uuid4()),
                thread_id="U1",
                platform="LINE",
                direction="incoming",
                question="hello line",
                created_at=datetime.utcnow(),
            ),
            ConversationMessage(
                id=str(uuid.uuid4()),
                thread_id="F1",
                platform="Facebook",
                direction="incoming",
                question="hello fb",
                created_at=datetime.utcnow(),
            ),
        ]
    )
    await async_session.commit()

    resp_line = await get_chat_messages(member_id=1, page=1, page_size=50, platform="LINE", db=async_session)
    assert resp_line.data["total"] == 1
    assert resp_line.data["messages"][0]["type"] == "user"

    resp_fb = await get_chat_messages(member_id=1, page=1, page_size=50, platform="Facebook", db=async_session)
    assert resp_fb.data["total"] == 1
    assert resp_fb.data["messages"][0]["text"] == "hello fb"

    # default platform is LINE when not provided
    resp_default = await get_chat_messages(member_id=1, page=1, page_size=50, platform=None, db=async_session)
    assert resp_default.data["total"] == 1
