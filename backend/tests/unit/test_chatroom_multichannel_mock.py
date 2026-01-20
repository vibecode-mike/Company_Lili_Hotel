from datetime import datetime
import os
import sys
import pytest

# Minimal env for app.config to load
os.environ.setdefault("SECRET_KEY", "test")
os.environ.setdefault("LINE_CHANNEL_ACCESS_TOKEN", "test")
os.environ.setdefault("LINE_CHANNEL_SECRET", "test")
os.environ.setdefault("OPENAI_API_KEY", "test")

# allow direct import of backend app package when running from repo root
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from app.services.chatroom_multichannel_mock import (
    ChatroomService,
    OAuthService,
    Member,
    LineFriend,
    FacebookFriend,
    WebchatFriend,
    MemberRepository,
    LineFriendRepository,
    FacebookFriendRepository,
    WebchatFriendRepository,
    ConversationThreadRepository,
)


def build_services():
    member_repo = MemberRepository()
    line_repo = LineFriendRepository()
    fb_repo = FacebookFriendRepository()
    webchat_repo = WebchatFriendRepository()
    thread_repo = ConversationThreadRepository()
    oauth_service = OAuthService(member_repo, line_repo, fb_repo, webchat_repo, thread_repo)
    chatroom_service = ChatroomService(member_repo, line_repo, fb_repo, webchat_repo, thread_repo)
    return {
        "member_repo": member_repo,
        "line_repo": line_repo,
        "fb_repo": fb_repo,
        "webchat_repo": webchat_repo,
        "thread_repo": thread_repo,
        "oauth_service": oauth_service,
        "chatroom_service": chatroom_service,
    }


def test_line_oauth_creates_threads():
    ctx = build_services()
    ctx["member_repo"].save(Member(member_id="M001", email="user@example.com"))
    result = ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="U123", email="user@example.com", webchat_uid="W001")
    assert result["member_id"] == "M001"
    assert ctx["thread_repo"].find_thread("LINE:U123")
    assert ctx["thread_repo"].find_thread("Webchat:W001")


def test_facebook_oauth_creates_threads():
    ctx = build_services()
    ctx["member_repo"].save(Member(member_id="M001", email="user@example.com"))
    result = ctx["oauth_service"].webchat_login_via_facebook_oauth(fb_customer_id="F321", email="user@example.com", webchat_uid="W001")
    assert result["member_id"] == "M001"
    assert ctx["thread_repo"].find_thread("Facebook:F321")
    assert ctx["thread_repo"].find_thread("Webchat:W001")


def test_google_oauth_only_webchat_thread():
    ctx = build_services()
    result = ctx["oauth_service"].webchat_login_via_google_oauth(email="guser@example.com", webchat_uid="WG1")
    assert result["member_id"] == "M001"
    assert ctx["thread_repo"].find_thread("Webchat:WG1")


def test_open_chatroom_defaults_to_latest_platform():
    ctx = build_services()
    now = datetime.utcnow()
    ctx["member_repo"].save(Member(member_id="M001"))
    ctx["line_repo"].save(LineFriend(line_uid="U1", member_id="M001", last_interaction_at=now))
    ctx["fb_repo"].save(FacebookFriend(fb_customer_id="F1", member_id="M001", last_interaction_at=now))
    ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W1", member_id="M001", last_interaction_at=now))
    session = ctx["chatroom_service"].open_chatroom_session("M001", prefer_latest=True)
    assert set(session["available_platforms"]) == {"LINE", "Facebook", "Webchat"}
    assert session["default_platform"] in {"LINE", "Facebook", "Webchat"}
    for plat in ["LINE", "Facebook", "Webchat"]:
        assert session["threads"][plat].startswith(plat)
