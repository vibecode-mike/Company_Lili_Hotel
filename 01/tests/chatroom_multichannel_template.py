import sys
from datetime import datetime
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from chatroom_multichannel_interfaces import (  # noqa: E402
    ChatLogEntry,
    ChatroomEventHandler,
    ChatroomPolicy,
    ChatroomReadModel,
    ChatroomService,
    ConversationMessage,
    ConversationThread,
    ConversationThreadRepository,
    Member,
    MemberRepository,
    FbFriend,
    FbFriendRepository,
    LineFriend,
    LineFriendRepository,
    WebchatFriend,
    WebchatFriendRepository,
    ChatLogRepository,
    ConversationMessageRepository,
)


@pytest.fixture(scope="module")
def context():
    member_repository = MemberRepository()
    line_friend_repository = LineFriendRepository()
    fb_friend_repository = FbFriendRepository()
    webchat_friend_repository = WebchatFriendRepository()
    thread_repository = ConversationThreadRepository()
    message_repository = ConversationMessageRepository()
    chat_log_repository = ChatLogRepository()
    service = ChatroomService(
        member_repository=member_repository,
        line_friend_repository=line_friend_repository,
        fb_friend_repository=fb_friend_repository,
        webchat_friend_repository=webchat_friend_repository,
        thread_repository=thread_repository,
        message_repository=message_repository,
        chat_log_repository=chat_log_repository,
    )
    read_model = ChatroomReadModel(
        member_repository=member_repository,
        line_friend_repository=line_friend_repository,
        fb_friend_repository=fb_friend_repository,
        webchat_friend_repository=webchat_friend_repository,
        thread_repository=thread_repository,
        message_repository=message_repository,
        chat_log_repository=chat_log_repository,
    )
    return {
        "member_repository": member_repository,
        "line_friend_repository": line_friend_repository,
        "fb_friend_repository": fb_friend_repository,
        "webchat_friend_repository": webchat_friend_repository,
        "thread_repository": thread_repository,
        "message_repository": message_repository,
        "chat_log_repository": chat_log_repository,
        "service": service,
        "read_model": read_model,
        "policy": ChatroomPolicy(),
        "events": ChatroomEventHandler(),
    }


# Feature-level Background
@pytest.fixture(scope="module", autouse=True)
def feature_background(context):
    service = context["service"]
    member_repository = context["member_repository"]
    line_friend_repository = context["line_friend_repository"]
    fb_friend_repository = context["fb_friend_repository"]
    webchat_friend_repository = context["webchat_friend_repository"]
    service.enforce_oauth_login_for_webchat()
    line_friend_repository.save(LineFriend(line_uid="BACKGROUND_LINE_UID"))
    fb_friend_repository.save(FbFriend(fb_uid="BACKGROUND_FB_UID"))
    webchat_friend_repository.save(WebchatFriend(webchat_uid="BACKGROUND_WEBCHAT_UID"))
    member_repository.save(Member(member_id="BACKGROUND_MEMBER", join_source="WEBCHAT"))


class TestWebchat使用LINEOAuth整合紀錄:
    """
    Rule: 當會員在 Webchat 登入 LINE OAuth，整合 LINE 紀錄並保留 Webchat 紀錄
    """

    def test_Webchat_LINE_OAuth已有LINE紀錄(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member = Member(member_id="M001", email="user@example.com", join_source="LINE")
        member_repository.save(member)
        line_friend_repository.save(
            LineFriend(line_uid="U123", member_id="M001", last_interaction_at=datetime.utcnow())
        )
        service.webchat_line_oauth_login(line_uid="U123", email="user@example.com", webchat_uid="W001")
        service.merge_line_messages_into_thread(member_id="M001", line_uid="U123")
        assert read_model.chat_log_integrity(member_id="M001") is True
        assert read_model.member_join_source(member_id="M001") == "LINE / Webchat"
        channels = read_model.reply_channel_switcher(member_id="M001")
        assert "LINE" in channels and "Webchat" in channels


class TestWebchat使用FacebookOAuth整合紀錄:
    """
    Rule: 當會員在 Webchat 登入 Facebook OAuth，整合 FB 紀錄並保留 Webchat 紀錄
    """

    def test_Webchat_Facebook_OAuth已有FB紀錄(self, context):
        member_repository = context["member_repository"]
        fb_friend_repository = context["fb_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(Member(member_id="M002", email="user@example.com", join_source="FACEBOOK"))
        fb_friend_repository.save(FbFriend(fb_uid="F321", member_id="M002", last_interaction_at=datetime.utcnow()))
        service.webchat_facebook_oauth_login(fb_uid="F321", email="user@example.com", webchat_uid="W002")
        service.merge_facebook_messages_into_thread(member_id="M002", fb_uid="F321")
        assert read_model.chat_log_integrity(member_id="M002") is True
        assert read_model.member_join_source(member_id="M002") == "Facebook / Webchat"
        channels = read_model.reply_channel_switcher(member_id="M002")
        assert "Facebook" in channels and "Webchat" in channels


class TestWebchat首次LINE或FBOAuth無歷史:
    """
    Rule: 當會員第一次在 Webchat 使用 LINE 或 FB OAuth 登入且無歷史紀錄，僅建立身份
    """

    def test_新LINE使用者建立會員與關聯(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        service.webchat_line_oauth_login(line_uid="U999", email="newuser@example.com", webchat_uid="W999")
        service.create_member_and_link_channels(
            member_id="M003",
            email="newuser@example.com",
            line_uid="U999",
            webchat_uid="W999",
        )
        service.link_webchat_friend_to_member(webchat_uid="W999", member_id="M003")
        service.create_line_friend(line_uid="U999", member_id="M003")
        assert isinstance(member_repository.find_by_member_id("M003"), Member)
        assert isinstance(line_friend_repository.find_by_uid("U999"), LineFriend)
        assert isinstance(webchat_friend_repository.find_by_uid("W999"), WebchatFriend)
        assert read_model.chat_log_view(member_id="M003") == []
        assert read_model.member_join_source(member_id="M003") == "Webchat"
        assert read_model.login_method_display(member_id="M003") == "LINE ICON + channel_name + U999"
        assert read_model.reply_channel_switcher(member_id="M003") == ["Webchat"]


class TestOAuth登入失敗處理:
    """
    Rule: 當 Webchat OAuth 登入失敗時提示錯誤並要求重試或改用其他方式
    """

    def test_LINE_OAuth登入失敗(self, context):
        service = context["service"]
        events = context["events"]
        read_model = context["read_model"]
        policy = context["policy"]
        service.initiate_line_oauth()
        events.line_oauth_failed(reason="user_cancelled")
        assert "取消授權" in read_model.send_error_ui(platform="LINE")
        assert "重試" in read_model.send_error_ui(platform="LINE")
        assert policy.block_anonymous_chat() is True
        service.log_oauth_failure(provider="LINE", error_type="user_cancelled", user_ip="127.0.0.1")

    def test_Facebook_OAuth登入失敗(self, context):
        service = context["service"]
        events = context["events"]
        read_model = context["read_model"]
        policy = context["policy"]
        service.initiate_facebook_oauth()
        events.facebook_oauth_failed(reason="timeout")
        assert "錯誤" in read_model.send_error_ui(platform="FACEBOOK")
        assert policy.block_anonymous_chat() is True

    def test_Google_OAuth登入失敗(self, context):
        service = context["service"]
        events = context["events"]
        read_model = context["read_model"]
        policy = context["policy"]
        service.initiate_google_oauth()
        events.google_oauth_failed(reason="network")
        assert "錯誤" in read_model.send_error_ui(platform="GOOGLE")
        assert policy.block_anonymous_chat() is True


class TestWebchat使用GoogleOAuth登入:
    """
    Rule: 當會員在 Webchat 使用 Google OAuth 登入時僅建立身份，除非 email 匹配才整合
    """

    def test_Google_OAuth新使用者(self, context):
        member_repository = context["member_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        service.webchat_google_oauth_login(email="guser@example.com", webchat_uid="WG001")
        service.create_webchat_member(member_id="M010", email="guser@example.com", webchat_uid="WG001")
        assert isinstance(member_repository.find_by_member_id("M010"), Member)
        assert isinstance(webchat_friend_repository.find_by_uid("WG001"), WebchatFriend)
        assert read_model.chat_log_view(member_id="M010") == []
        assert read_model.member_join_source(member_id="M010") == "Webchat"
        assert read_model.login_method_display(member_id="M010") == "Google ICON + guser@example.com"
        assert read_model.reply_channel_switcher(member_id="M010") == ["Webchat"]

    def test_Google_OAuth已有會員合併(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(
            Member(member_id="M011", email="guser@example.com", line_uid="U123", join_source="LINE")
        )
        line_friend_repository.save(LineFriend(line_uid="U123", member_id="M011"))
        webchat_friend_repository.save(WebchatFriend(webchat_uid="W011", member_id="M011"))
        service.webchat_google_oauth_login(email="guser@example.com", webchat_uid="W011")
        service.merge_webchat_messages_into_thread(member_id="M011", webchat_uid="W011")
        timeline = read_model.chat_thread_timeline(member_id="M011")
        assert isinstance(timeline, list)
        assert "LINE / Webchat" == read_model.member_join_source(member_id="M011")
        assert "Google ICON" in read_model.login_method_display(member_id="M011")
        assert "LINE" in read_model.message_source_labels(member_id="M011")


class Test客服聊天室顯示整合訊息與來源:
    """
    Rule: 客服聊天室應顯示所有整合後訊息，並標示來源
    """

    def test_整合多渠道訊息顯示(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        fb_friend_repository = context["fb_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        thread_repository = context["thread_repository"]
        message_repository = context["message_repository"]
        read_model = context["read_model"]
        member_repository.save(Member(member_id="M020", join_source="LINE / Facebook / Webchat"))
        line_friend_repository.save(LineFriend(line_uid="ULINE20", member_id="M020"))
        fb_friend_repository.save(FbFriend(fb_uid="UFB20", member_id="M020"))
        webchat_friend_repository.save(WebchatFriend(webchat_uid="UWC20", member_id="M020"))
        thread_repository.save(
            ConversationThread(
                thread_id="T20L",
                member_id="M020",
                platform="LINE",
                platform_uid="ULINE20",
            )
        )
        thread_repository.save(
            ConversationThread(thread_id="T20F", member_id="M020", platform="FACEBOOK", platform_uid="UFB20")
        )
        thread_repository.save(
            ConversationThread(thread_id="T20W", member_id="M020", platform="WEBCHAT", platform_uid="UWC20")
        )
        message_repository.save(
            ConversationMessage(
                message_id="MSG201",
                thread_id="T20L",
                platform="LINE",
                content="hi from line",
                sent_at=datetime.utcnow(),
            )
        )
        message_repository.save(
            ConversationMessage(
                message_id="MSG202",
                thread_id="T20F",
                platform="FACEBOOK",
                content="hi from fb",
                sent_at=datetime.utcnow(),
            )
        )
        message_repository.save(
            ConversationMessage(
                message_id="MSG203",
                thread_id="T20W",
                platform="WEBCHAT",
                content="hi from webchat",
                sent_at=datetime.utcnow(),
            )
        )
        timeline = read_model.chat_thread_timeline(member_id="M020")
        assert len(timeline) == 3
        sources = read_model.message_source_labels(member_id="M020")
        assert set(sources) == {"LINE", "FACEBOOK", "WEBCHAT"}
        assert read_model.member_join_source(member_id="M020") == "LINE / Facebook / Webchat"
        switcher = read_model.reply_channel_switcher(member_id="M020")
        assert "LINE" in switcher and "Facebook" in switcher and "Webchat" in switcher


class Test預設回覆渠道取最近互動:
    """
    Rule: 開啟聊天室時預設回覆渠道 = 最近互動渠道
    """

    def test_預設回覆渠道為最近互動渠道(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        fb_friend_repository = context["fb_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        now = datetime.utcnow()
        member_repository.save(Member(member_id="M030", join_source="LINE"))
        line_friend_repository.save(LineFriend(line_uid="UL30", member_id="M030", last_interaction_at=now))
        fb_friend_repository.save(FbFriend(fb_uid="UF30", member_id="M030", last_interaction_at=now))
        webchat_friend_repository.save(
            WebchatFriend(webchat_uid="UW30", member_id="M030", last_interaction_at=now.replace(hour=now.hour + 1))
        )
        service.open_customer_thread(member_id="M030")
        assert read_model.reply_channel_default(member_id="M030") == "Webchat"
        switcher = read_model.reply_channel_switcher(member_id="M030")
        assert {"LINE", "Facebook", "Webchat"}.issubset(set(switcher))
        statuses = read_model.channel_status_indicator(member_id="M030")
        assert len(statuses) == 3


class Test回覆渠道不可用時提示:
    """
    Rule: 當回覆渠道無法發送訊息時提示錯誤並要求手動切換
    """

    def test_LINE回覆窗口過期(self, context):
        service = context["service"]
        read_model = context["read_model"]
        policy = context["policy"]
        service.send_line_message(member_id="M001", content="hello")
        assert "LINE 回覆窗口已過期" in read_model.send_error_ui(platform="LINE")
        assert policy.manual_channel_switch_required() is True
        service.log_send_failure(member_id="M001", platform="LINE", reason="reply_token_expired")

    def test_Facebook對話窗口關閉(self, context):
        service = context["service"]
        read_model = context["read_model"]
        policy = context["policy"]
        service.send_facebook_message(member_id="M001", content="hello")
        assert "Facebook 對話窗口已關閉" in read_model.send_error_ui(platform="FACEBOOK")
        assert policy.manual_channel_switch_required() is True

    def test_Webchat用戶已離線(self, context):
        service = context["service"]
        read_model = context["read_model"]
        policy = context["policy"]
        service.send_webchat_message(member_id="M001", content="hello")
        pending = read_model.pending_send_queue(member_id="M001")
        assert isinstance(pending, list)
        assert "Webchat 用戶已離線" in read_model.send_error_ui(platform="WEBCHAT")
        assert policy.manual_channel_switch_required() is True


class Test多渠道會員合併策略:
    """
    Rule: OAuth 登入成功後依混合策略合併會員（優先 email → 渠道 UID → 建立新會員）
    """

    def test_email相同合併_LINE到既有會員(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(Member(member_id="M001", email="user@example.com"))
        fb_friend_repository = context["fb_friend_repository"]
        fb_friend_repository.save(FbFriend(fb_uid="F321", member_id="M001"))
        service.webchat_line_oauth_login(line_uid="U123", email="user@example.com", webchat_uid="W123")
        line_friend_repository.link_to_member(line_uid="U123", member_id="M001")
        service.link_webchat_friend_to_member(webchat_uid="W123", member_id="M001")
        assert read_model.merge_decision(member_id="M001") == "email_match"
        assert line_friend_repository.find_by_uid("U123").member_id == "M001"  # type: ignore[union-attr]
        assert webchat_friend_repository.find_by_uid("W123").member_id == "M001"  # type: ignore[union-attr]
        assert len(read_model.chat_thread_timeline(member_id="M001")) >= 0

    def test_無email但渠道UID已存在(self, context):
        line_friend_repository = context["line_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        line_friend_repository.save(LineFriend(line_uid="U123", member_id="M001"))
        service.webchat_line_oauth_login(line_uid="U123", email=None, webchat_uid="W123")
        assert read_model.merge_decision(member_id="M001") == "uid_match"
        service.reuse_existing_member(member_id="M001")
        service.link_webchat_friend_to_member(webchat_uid="W123", member_id="M001")
        assert webchat_friend_repository.find_by_uid("W123").member_id == "M001"  # type: ignore[union-attr]

    def test_無email且渠道UID不存在建立新會員(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        service.webchat_line_oauth_login(line_uid="U888", email=None, webchat_uid="W888")
        service.create_member_without_email(member_id="M003")
        service.create_line_friend(line_uid="U888", member_id="M003")
        service.link_webchat_friend_to_member(webchat_uid="W888", member_id="M003")
        assert isinstance(member_repository.find_by_member_id("M003"), Member)
        assert line_friend_repository.find_by_uid("U888").member_id == "M003"  # type: ignore[union-attr]
        assert webchat_friend_repository.find_by_uid("W888").member_id == "M003"  # type: ignore[union-attr]
        assert context["policy"].deferred_merge_on_email() is True

    def test_日後取得email觸發延遲合併(self, context):
        member_repository = context["member_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(Member(member_id="M003", email=None))
        member_repository.save(Member(member_id="M001", email="user@example.com"))
        service.merge_members(source_member_id="M003", target_member_id="M001")
        service.relink_friends_to_master_member(source_member_id="M003", target_member_id="M001")
        assert read_model.merge_decision(member_id="M001") == "email_match"

    def test_多渠道會員合併至同一member(self, context):
        member_repository = context["member_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(Member(member_id="M001", email="user@example.com"))
        service.webchat_line_oauth_login(line_uid="ULINK", email="user@example.com", webchat_uid="WLINK")
        service.webchat_facebook_oauth_login(fb_uid="UFBLINK", email="user@example.com", webchat_uid="WLINK")
        service.merge_webchat_messages_into_thread(member_id="M001", webchat_uid="WLINK")
        service.unify_member_links(member_id="M001")
        members = read_model.member_list()
        assert any(member.member_id == "M001" for member in members)
        assert read_model.member_join_source(member_id="M001") == "LINE / Facebook / Webchat"


class Test會員合併資料衝突處理:
    """
    Rule: 會員合併時資料衝突處理（新資料優先，空白不覆蓋）
    """

    def test_會員資料合併衝突處理(self, context):
        member_repository = context["member_repository"]
        read_model = context["read_model"]
        policy = context["policy"]
        service = context["service"]
        member_repository.save(
            Member(member_id="M050", email="merge@example.com", last_interaction_at=datetime.utcnow())
        )
        service.merge_member_profile(email="merge@example.com")
        result = read_model.profile_merge_result(member_id="M050")
        assert isinstance(result, dict)
        service.merge_member_tags(member_id="M050", tags=["VIP", "高消費客戶"])
        assert policy.ignore_blank_overwrite() is True


class Test客服聊天室下拉切換:
    """
    Rule: 客服可透過下拉選單切換同一 member_id 的不同渠道聊天紀錄
    """

    def test_客服切換渠道查看訊息(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        fb_friend_repository = context["fb_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        thread_repository = context["thread_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(Member(member_id="M060"))
        line_friend_repository.save(LineFriend(line_uid="UL60", member_id="M060"))
        fb_friend_repository.save(FbFriend(fb_uid="UF60", member_id="M060"))
        webchat_friend_repository.save(WebchatFriend(webchat_uid="UW60", member_id="M060"))
        thread_repository.save(
            ConversationThread(
                thread_id="T60",
                member_id="M060",
                platform="WEBCHAT",
                platform_uid="UW60",
            )
        )
        service.open_customer_thread(member_id="M060")
        assert "LINE" in read_model.reply_channel_switcher(member_id="M060")
        assert read_model.chat_thread_by_platform(member_id="M060", platform="WEBCHAT") == []
        assert isinstance(line_friend_repository.find_by_uid("UL60"), LineFriend)
        assert isinstance(fb_friend_repository.find_by_uid("UF60"), FbFriend)
        assert isinstance(webchat_friend_repository.find_by_uid("UW60"), WebchatFriend)


class TestWebchat訪客會話狀態管理:
    """
    Rule: Webchat 訪客會話結束判定依據 WebSocket 狀態，斷線時自動設為已離線
    """

    def test_訪客關閉瀏覽器會話自動結束(self, context):
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        events = context["events"]
        webchat_friend_repository.save(WebchatFriend(webchat_uid="W123", is_following=True))
        events.websocket_disconnected_timeout(webchat_uid="W123")
        assert webchat_friend_repository.find_by_uid("W123").is_following is False  # type: ignore[union-attr]
        assert "已離線" in read_model.chat_status_banner(member_id="W123")

    def test_訪客網路中斷後重新連線(self, context):
        events = context["events"]
        policy = context["policy"]
        read_model = context["read_model"]
        events.websocket_disconnected(webchat_uid="W123")
        events.websocket_reconnected(webchat_uid="W123")
        assert policy.session_continues() is True
        assert read_model.chat_continuation(member_id="W123") is True

    def test_訪客重新訪問網站(self, context):
        service = context["service"]
        read_model = context["read_model"]
        webchat_friend_repository = context["webchat_friend_repository"]
        webchat_friend_repository.save(WebchatFriend(webchat_uid="W123", is_following=False))
        service.establish_webchat_session(webchat_uid="W123")
        assert webchat_friend_repository.find_by_uid("W123").is_following is True  # type: ignore[union-attr]
        assert read_model.chat_continuation(member_id="W123") is True


class TestWebchatUID生成與識別:
    """
    Rule: webchat_uid 使用 UUID v4，由後端生成並儲存於 localStorage 跨 session 識別
    """

    def test_新訪客首次生成webchat_uid(self, context):
        service = context["service"]
        webchat_friend_repository = context["webchat_friend_repository"]
        uid = service.establish_webchat_session(webchat_uid=None)
        generated = service.generate_webchat_uid()
        service.create_webchat_friend(webchat_uid=generated)
        service.persist_uid_to_localstorage(webchat_uid=generated)
        assert isinstance(uid, str)
        assert isinstance(webchat_friend_repository.find_by_uid(generated), WebchatFriend)

    def test_訪客重新訪問使用既有uid(self, context):
        service = context["service"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        existing_uid = "550e8400-e29b-41d4-a716-446655440000"
        webchat_friend_repository.save(WebchatFriend(webchat_uid=existing_uid))
        service.establish_webchat_session(webchat_uid=existing_uid)
        service.send_uid_to_backend(webchat_uid=existing_uid)
        service.update_webchat_friend_state(webchat_uid=existing_uid, is_following=True)
        assert read_model.chat_continuation(member_id=existing_uid) is True

    def test_localstorage被清除視為新訪客(self, context):
        service = context["service"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service.establish_webchat_session(webchat_uid=None)
        new_uid = service.generate_webchat_uid()
        service.create_webchat_friend(webchat_uid=new_uid)
        assert isinstance(webchat_friend_repository.find_by_uid(new_uid), WebchatFriend)
        assert read_model.chat_thread_isolation(member_id=new_uid) is True


class Test新Webchat會員建立:
    """
    Rule: 當 Webchat OAuth 登入 email 不存在於 members 表時，建立新的 member_id
    """

    def test_新Webchat會員建立(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        service.webchat_line_oauth_login(
            line_uid="U999",
            email="newuser@example.com",
            webchat_uid="550e8400-e29b-41d4-a716-446655440000",
        )
        service.create_member_and_link_channels(
            member_id="M002",
            email="newuser@example.com",
            line_uid="U999",
            webchat_uid="550e8400-e29b-41d4-a716-446655440000",
        )
        assert isinstance(member_repository.find_by_member_id("M002"), Member)
        assert isinstance(line_friend_repository.find_by_uid("U999"), LineFriend)
        assert isinstance(webchat_friend_repository.find_by_uid("550e8400-e29b-41d4-a716-446655440000"), WebchatFriend)
        assert read_model.chat_log_view(member_id="M002") == []
        assert read_model.member_join_source(member_id="M002") == "Webchat"
        assert "LINE ICON" in read_model.login_method_display(member_id="M002")


class Test客服聊天室顯示整合訊息_可切換渠道:
    """
    Rule: 客服聊天室應顯示整合後訊息，並標示來源及可切換渠道
    """

    def test_客服聊天室顯示整合訊息(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        fb_friend_repository = context["fb_friend_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        thread_repository = context["thread_repository"]
        message_repository = context["message_repository"]
        read_model = context["read_model"]
        member_repository.save(Member(member_id="M070"))
        line_friend_repository.save(LineFriend(line_uid="U123", member_id="M070"))
        fb_friend_repository.save(FbFriend(fb_uid="F321", member_id="M070"))
        webchat_friend_repository.save(WebchatFriend(webchat_uid="W555", member_id="M070"))
        thread_repository.save(
            ConversationThread(
                thread_id="T70",
                member_id="M070",
                platform="WEBCHAT",
                platform_uid="W555",
            )
        )
        message_repository.save(
            ConversationMessage(
                message_id="MSG701",
                thread_id="T70",
                platform="WEBCHAT",
                content="webchat message",
                sent_at=datetime.utcnow(),
            )
        )
        timeline = read_model.chat_thread_timeline(member_id="M070")
        assert isinstance(timeline, list)
        assert set(read_model.message_source_labels(member_id="M070")) == {"LINE", "FACEBOOK", "WEBCHAT"}
        assert "LINE" in read_model.reply_channel_switcher(member_id="M070")


class Test會員列表顯示上次互動渠道:
    """
    Rule: 從會員列表點擊聊天按鈕進入客服聊天室時，初始訊息流依 last_interaction_at 最晚者
    """

    def test_上次互動為Webchat(self, context):
        member_repository = context["member_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(Member(member_id="M080"))
        latest = datetime(2025, 12, 2, 12, 0, 0)
        webchat_friend_repository.save(
            WebchatFriend(webchat_uid="UW80", member_id="M080", last_interaction_at=latest)
        )
        service.open_customer_thread(member_id="M080")
        assert read_model.chat_thread_by_platform(member_id="M080", platform="WEBCHAT") == []
        assert "Webchat" in read_model.reply_channel_switcher(member_id="M080")

    def test_上次互動為Facebook(self, context):
        member_repository = context["member_repository"]
        fb_friend_repository = context["fb_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(Member(member_id="M081"))
        fb_friend_repository.save(
            FbFriend(fb_uid="UF81", member_id="M081", last_interaction_at=datetime(2025, 12, 2, 13, 0, 0))
        )
        service.open_customer_thread(member_id="M081")
        assert read_model.chat_thread_by_platform(member_id="M081", platform="FACEBOOK") == []
        assert "Facebook" in read_model.reply_channel_switcher(member_id="M081")

    def test_上次互動為LINE(self, context):
        member_repository = context["member_repository"]
        line_friend_repository = context["line_friend_repository"]
        read_model = context["read_model"]
        service = context["service"]
        member_repository.save(Member(member_id="M082"))
        line_friend_repository.save(
            LineFriend(line_uid="UL82", member_id="M082", last_interaction_at=datetime(2025, 12, 2, 14, 0, 0))
        )
        service.open_customer_thread(member_id="M082")
        assert read_model.chat_thread_by_platform(member_id="M082", platform="LINE") == []
        assert "LINE" in read_model.reply_channel_switcher(member_id="M082")


class Test多渠道會員合併後最近互動顯示:
    """
    Rule: 合併後會員列表「最近互動」顯示最晚渠道並用該渠道頭像與姓名
    """

    def test_最近互動為Facebook(self, context):
        member_repository = context["member_repository"]
        fb_friend_repository = context["fb_friend_repository"]
        line_friend_repository = context["line_friend_repository"]
        read_model = context["read_model"]
        member_repository.save(Member(member_id="M090"))
        fb_friend_repository.save(
            FbFriend(
                fb_uid="F123",
                member_id="M090",
                fb_picture_url="fb_picture",
                fb_display_name="FB User",
                last_interaction_at=datetime(2025, 12, 1, 10, 0, 0),
            )
        )
        line_friend_repository.save(
            LineFriend(line_uid="L456", member_id="M090", last_interaction_at=datetime(2025, 12, 1, 9, 0, 0))
        )
        members = read_model.member_list()
        assert any(member.member_id == "M090" for member in members)
        assert read_model.member_join_source(member_id="M090").startswith("Facebook")

    def test_最近互動為LINE(self, context):
        member_repository = context["member_repository"]
        fb_friend_repository = context["fb_friend_repository"]
        line_friend_repository = context["line_friend_repository"]
        read_model = context["read_model"]
        member_repository.save(Member(member_id="M091"))
        fb_friend_repository.save(
            FbFriend(
                fb_uid="F321",
                member_id="M091",
                last_interaction_at=datetime(2025, 12, 1, 10, 0, 0),
            )
        )
        line_friend_repository.save(
            LineFriend(
                line_uid="L999",
                member_id="M091",
                line_picture_url="line_picture",
                line_display_name="LINE User",
                last_interaction_at=datetime(2025, 12, 1, 12, 0, 0),
            )
        )
        assert read_model.member_join_source(member_id="M091").startswith("LINE")
        assert "line_picture" in read_model.member_join_source(member_id="M091")

    def test_最近互動為Webchat(self, context):
        member_repository = context["member_repository"]
        webchat_friend_repository = context["webchat_friend_repository"]
        read_model = context["read_model"]
        member_repository.save(Member(member_id="M092"))
        webchat_friend_repository.save(
            WebchatFriend(
                webchat_uid="W789",
                member_id="M092",
                webchat_picture_url="webchat_picture",
                webchat_display_name="Webchat User",
                last_interaction_at=datetime(2025, 12, 1, 13, 0, 0),
            )
        )
        assert read_model.member_join_source(member_id="M092").startswith("Webchat")
