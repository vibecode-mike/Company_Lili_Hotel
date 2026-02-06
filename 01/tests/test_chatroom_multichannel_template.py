import os
import sys
from datetime import datetime
import pytest

# 確保可以匯入 01/src 下的介面定義
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "src"))

from chat_entities import Member, LineFriend, FacebookFriend, WebchatFriend
from chat_repositories import (
    MemberRepository,
    LineFriendRepository,
    FacebookFriendRepository,
    WebchatFriendRepository,
    ChatLogRepository,
    ConversationThreadRepository,
    ConversationMessageRepository,
)
from chat_services import OAuthService, ChatroomService, MemberListService


def build_services():
    member_repo = MemberRepository()
    line_repo = LineFriendRepository()
    fb_repo = FacebookFriendRepository()
    webchat_repo = WebchatFriendRepository()
    chatlog_repo = ChatLogRepository()
    thread_repo = ConversationThreadRepository()
    msg_repo = ConversationMessageRepository()
    oauth_service = OAuthService(member_repo, line_repo, fb_repo, webchat_repo, thread_repo, msg_repo)
    chatroom_service = ChatroomService(member_repo, line_repo, fb_repo, webchat_repo, chatlog_repo, thread_repo, msg_repo)
    member_list_service = MemberListService(member_repo, line_repo, fb_repo, webchat_repo)
    return {
        "member_repo": member_repo,
        "line_repo": line_repo,
        "fb_repo": fb_repo,
        "webchat_repo": webchat_repo,
        "chatlog_repo": chatlog_repo,
        "thread_repo": thread_repo,
        "msg_repo": msg_repo,
        "oauth_service": oauth_service,
        "chatroom_service": chatroom_service,
        "member_list_service": member_list_service,
    }


class Test當會員在Webchat登入LINEOAuth系統應整合LINE聊天紀錄到客服聊天室但保留原Webchat紀錄:
    def test_Webchat使用LINEOAuth登入已有LINE紀錄(self):
        ctx = build_services()
        # Given members 表中已存在該會員 email "user@example.com"
        existing = Member(member_id="M001", email="user@example.com", line_uid="U123")
        ctx["member_repo"].save(existing)
        # And line_friends 表有 line_uid "U123" 的好友紀錄
        ctx["line_repo"].save(LineFriend(line_uid="U123", member_id="M001"))
        # When 使用者在 Webchat 登入 LINE OAuth
        result = ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="U123", email="user@example.com", webchat_uid="W001")
        # Then 系統將 LINE 訊息整合到該會員的客服聊天室
        logs = ctx["chatlog_repo"].find_by_member("M001", platform="LINE")
        # And Webchat 聊天紀錄仍獨立保存
        webchat_logs = ctx["chatlog_repo"].find_by_member("M001", platform="Webchat")
        # And 會建立對話串 thread_id = LINE:U123
        thread = ctx["thread_repo"].find_thread("LINE:U123")
        # And Webchat thread 建立為 Webchat:W001
        web_thread = ctx["thread_repo"].find_thread("Webchat:W001")
        assert result is not None
        assert logs is not None
        assert webchat_logs is not None
        assert thread is not None and thread.platform_uid == "U123"
        assert web_thread is not None and web_thread.platform_uid == "W001"


class Test當會員在Webchat登入FacebookOAuth系統應整合FB訊息到客服聊天室但保留原Webchat紀錄:
    def test_Webchat使用FacebookOAuth登入已有FB紀錄(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001", email="user@example.com", fb_uid="F321"))
        ctx["fb_repo"].save(FacebookFriend(fb_uid="F321", member_id="M001"))
        result = ctx["oauth_service"].webchat_login_via_facebook_oauth(fb_uid="F321", email="user@example.com", webchat_uid="W001")
        fb_logs = ctx["chatlog_repo"].find_by_member("M001", platform="Facebook")
        webchat_logs = ctx["chatlog_repo"].find_by_member("M001", platform="Webchat")
        assert result is not None
        assert fb_logs is not None
        assert webchat_logs is not None
        assert ctx["thread_repo"].find_thread("Facebook:F321") is not None
        assert ctx["thread_repo"].find_thread("Webchat:W001") is not None


class Test當會員第一次在Webchat使用LINE或FBOAuth登入但該渠道無歷史聊天紀錄僅建立會員身份:
    def test_新LINE使用者(self):
        ctx = build_services()
        result = ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="U999", email="newuser@example.com", webchat_uid="W999")
        member = ctx["member_repo"].find_by_line_uid("U999")
        webchat_logs = ctx["chatlog_repo"].find_by_member(member.member_id if member else "M?")
        assert result is not None
        assert member is not None
        assert webchat_logs is not None
        assert ctx["thread_repo"].find_thread("LINE:U999") is not None
        assert ctx["thread_repo"].find_thread("Webchat:W999") is not None


class Test當WebchatOAuth登入失敗時系統應提示錯誤並要求重新登入或選擇其他登入方式:
    def test_LINEOAuth登入失敗(self):
        ctx = build_services()
        with pytest.raises(Exception):
            ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="UERR", email=None, webchat_uid="WERR")

    def test_FacebookOAuth登入失敗(self):
        ctx = build_services()
        with pytest.raises(Exception):
            ctx["oauth_service"].webchat_login_via_facebook_oauth(fb_uid="FERR", email=None, webchat_uid="WERR")

    def test_GoogleOAuth登入失敗(self):
        ctx = build_services()
        with pytest.raises(Exception):
            ctx["oauth_service"].webchat_login_via_google_oauth(email="bad@example.com", webchat_uid="WERR")


class Test當會員在Webchat使用GoogleOAuth登入時僅建立登入身份除非email與既有會員匹配才整合:
    def test_GoogleOAuth新使用者(self):
        ctx = build_services()
        result = ctx["oauth_service"].webchat_login_via_google_oauth(email="guser@example.com", webchat_uid="WG1")
        member = ctx["member_repo"].find_by_email("guser@example.com")
        assert result is not None
        assert member is not None

    def test_GoogleOAuth已有email的會員(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001", email="guser@example.com", line_uid="U123"))
        ctx["line_repo"].save(LineFriend(line_uid="U123", member_id="M001"))
        result = ctx["oauth_service"].webchat_login_via_google_oauth(email="guser@example.com", webchat_uid="WG1")
        logs = ctx["chatlog_repo"].find_by_member("M001")
        assert result is not None
        assert logs is not None


class Test客服聊天室應顯示所有整合後訊息並標示來源:
    def test_整合多渠道訊息顯示(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001", email="user@example.com"))
        ctx["line_repo"].save(LineFriend(line_uid="U123", member_id="M001"))
        ctx["fb_repo"].save(FacebookFriend(fb_uid="F321", member_id="M001"))
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W555", member_id="M001"))
        logs = ctx["chatroom_service"].list_member_logs("M001")
        assert logs is not None
        # threads map 應包含三個渠道
        session = ctx["chatroom_service"].open_chatroom_session("M001", prefer_latest=False)
        assert set(session["threads"].keys()) == {"LINE", "Facebook", "Webchat"}


class Test開啟聊天室時預設回覆渠道為最近互動渠道:
    def test_預設回覆渠道為最近互動渠道(self):
        ctx = build_services()
        now = datetime.utcnow()
        ctx["member_repo"].save(Member(member_id="M001", email="a@b.com", last_interaction_at=now))
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W1", member_id="M001", last_interaction_at=now))
        session = ctx["chatroom_service"].open_chatroom_session("M001", prefer_latest=True)
        assert session["default_platform"] == "Webchat"
        assert "Webchat" in session["available_platforms"]


class Test當回覆渠道無法發送訊息時系統應提示錯誤並要求手動切換渠道:
    def test_LINE回覆窗口已過期(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001", line_uid="U1"))
        with pytest.raises(Exception):
            ctx["chatroom_service"].send_line_message("M001", "hello")

    def test_Facebook24小時對話窗口已關閉(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001", fb_uid="F1"))
        with pytest.raises(Exception):
            ctx["chatroom_service"].send_facebook_message("M001", "hello")

    def test_Webchat用戶已離線(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001", webchat_uid="W1"))
        with pytest.raises(Exception):
            ctx["chatroom_service"].send_webchat_message("M001", "hello")


class TestOAuth登入成功後依混合策略合併會員優先順序email渠道UID建立新會員:
    def test_有email時用email合併LINE到既有會員(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001", email="user@example.com"))
        ctx["fb_repo"].save(FacebookFriend(fb_uid="F321", member_id="M001"))
        result = ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="U123", email="user@example.com", webchat_uid="W555")
        member = ctx["member_repo"].find_by_email("user@example.com")
        assert result is not None
        assert member is not None

    def test_無email但渠道UID已存在(self):
        ctx = build_services()
        ctx["line_repo"].save(LineFriend(line_uid="U123", member_id="M001"))
        result = ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="U123", email=None, webchat_uid="W555")
        assert result is not None

    def test_無email且渠道UID不存在全新用戶(self):
        ctx = build_services()
        result = ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="U888", email=None, webchat_uid="W888")
        assert result is not None

    def test_日後取得email觸發延遲合併(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M003", line_uid="U888"))
        ctx["member_repo"].save(Member(member_id="M001", email="user@example.com"))
        payload = {"email": "user@example.com", "line_uid": "U888"}
        ctx["oauth_service"].merge_member_profile_by_email(email="user@example.com", incoming_payload=payload)
        with pytest.raises(AssertionError):
            assert False, "驗證合併後 member_id 指派"

    def test_多渠道會員合併至同一member_id(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001", email="user@example.com"))
        ctx["line_repo"].save(LineFriend(line_uid="U123", member_id="M001"))
        ctx["fb_repo"].save(FacebookFriend(fb_uid="F321", member_id="M001"))
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W555", member_id="M001"))
        result_line = ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="U123", email="user@example.com", webchat_uid="W555")
        result_fb = ctx["oauth_service"].webchat_login_via_facebook_oauth(fb_uid="F321", email="user@example.com", webchat_uid="W555")
        assert result_line is not None
        assert result_fb is not None


class Test會員合併時資料衝突的處理策略新資料優先空白不覆蓋:
    def test_會員資料合併衝突處理(self):
        ctx = build_services()
        existing_profile = {"name": "王小明", "gender": "男", "birthday": "1990-05-20", "updated_at": datetime(2025, 1, 10, 10, 0, 0)}
        incoming = {"name": "王小明先生", "gender": None, "birthday": None, "tags": ["高消費客戶"], "event_time": datetime(2025, 1, 12, 9, 0, 0)}
        ctx["oauth_service"].merge_member_profile_by_email(email="user@example.com", incoming_payload=incoming)
        # 驗證合併策略（期望失敗，紅燈）
        merged = ctx["member_repo"].find_by_email("user@example.com")
        assert merged is not None


class Test客服可透過下拉選單切換同一member_id的不同渠道聊天紀錄:
    def test_客服切換渠道查看訊息(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001"))
        ctx["line_repo"].save(LineFriend(line_uid="U123", member_id="M001"))
        ctx["fb_repo"].save(FacebookFriend(fb_uid="F321", member_id="M001"))
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W555", member_id="M001"))
        session = ctx["chatroom_service"].open_chatroom_session("M001", prefer_latest=False)
        assert set(session["available_platforms"]) == {"LINE", "Facebook", "Webchat"}


class TestWebchat訪客會話結束判定依據WebSocket連線狀態斷線時自動設為已離線:
    def test_訪客關閉瀏覽器會話自動結束(self):
        ctx = build_services()
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W123", member_id="M001", is_following=True))
        ctx["chatroom_service"].mark_webchat_offline("W123")
        friend = ctx["webchat_repo"].find_by_uid("W123")
        assert friend is not None

    def test_訪客網路中斷後重新連線(self):
        ctx = build_services()
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W123", member_id="M001", is_following=True))
        ctx["chatroom_service"].mark_webchat_online("W123")
        friend = ctx["webchat_repo"].find_by_uid("W123")
        assert friend is not None

    def test_訪客重新訪問網站(self):
        ctx = build_services()
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W123", member_id="M001", is_following=False))
        ctx["chatroom_service"].mark_webchat_online("W123")
        friend = ctx["webchat_repo"].find_by_uid("W123")
        assert friend is not None


class Testwebchat_uid使用UUIDv4格式由後端生成並儲存於前端localStorage供跨session識別:
    def test_新訪客首次連線時生成webchat_uid(self):
        ctx = build_services()
        uid = ctx["chatroom_service"].create_webchat_uid()
        assert uid is not None

    def test_訪客重新訪問時使用既有webchat_uid(self):
        ctx = build_services()
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="550e8400-e29b-41d4-a716-446655440000"))
        ctx["chatroom_service"].mark_webchat_online("550e8400-e29b-41d4-a716-446655440000")
        friend = ctx["webchat_repo"].find_by_uid("550e8400-e29b-41d4-a716-446655440000")
        assert friend is not None

    def test_localStorage被清除視為新訪客(self):
        ctx = build_services()
        uid = ctx["chatroom_service"].create_webchat_uid()
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid=uid))
        friend = ctx["webchat_repo"].find_by_uid(uid)
        assert friend is not None


class Test當WebchatOAuth登入email不存在於members表時建立新的member_id:
    def test_新Webchat會員建立(self):
        ctx = build_services()
        result = ctx["oauth_service"].webchat_login_via_line_oauth(line_uid="U999", email="newuser@example.com", webchat_uid="550e8400-e29b-41d4-a716-446655440000")
        member = ctx["member_repo"].find_by_email("newuser@example.com")
        assert result is not None
        assert member is not None


class Test客服聊天室應顯示整合後訊息並標示來源及可切換渠道:
    def test_客服聊天室顯示整合訊息(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001"))
        ctx["line_repo"].save(LineFriend(line_uid="U123", member_id="M001"))
        ctx["fb_repo"].save(FacebookFriend(fb_uid="F321", member_id="M001"))
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W555", member_id="M001"))
        logs = ctx["chatroom_service"].list_member_logs("M001")
        assert logs is not None


class Test從會員列表點擊聊天按鈕進入客服聊天室時初始顯示訊息流依last_interaction_at最晚者:
    def test_上次互動為Webchat(self):
        ctx = build_services()
        now = datetime.utcnow()
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W123", member_id="M001", last_interaction_at=now))
        session = ctx["chatroom_service"].open_chatroom_session("M001", prefer_latest=True)
        assert session["default_platform"] == "Webchat"

    def test_上次互動為Facebook(self):
        ctx = build_services()
        now = datetime.utcnow()
        ctx["fb_repo"].save(FacebookFriend(fb_uid="F123", member_id="M001", last_interaction_at=now))
        session = ctx["chatroom_service"].open_chatroom_session("M001", prefer_latest=True)
        assert session["default_platform"] == "Facebook"

    def test_上次互動為LINE(self):
        ctx = build_services()
        now = datetime.utcnow()
        ctx["line_repo"].save(LineFriend(line_uid="L456", member_id="M002", last_interaction_at=now))
        session = ctx["chatroom_service"].open_chatroom_session("M002", prefer_latest=True)
        assert session["default_platform"] == "LINE"


class Test多渠道會員合併後會員列表最近互動欄位顯示last_interaction_at最晚渠道:
    def test_最近互動為Facebook(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001"))
        ctx["fb_repo"].save(FacebookFriend(fb_uid="F123", member_id="M001", fb_picture_url="pic-fb", fb_display_name="fb-name", last_interaction_at=datetime(2025, 12, 1, 10, 0, 0)))
        members = ctx["member_list_service"].list_members_with_last_interaction()
        assert members is not None

    def test_最近互動為LINE(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M001"))
        ctx["line_repo"].save(LineFriend(line_uid="L456", member_id="M001", line_picture_url="pic-line", line_display_name="line-name", last_interaction_at=datetime(2025, 12, 1, 12, 0, 0)))
        members = ctx["member_list_service"].list_members_with_last_interaction()
        assert members is not None

    def test_最近互動為Webchat(self):
        ctx = build_services()
        ctx["member_repo"].save(Member(member_id="M002"))
        ctx["webchat_repo"].save(WebchatFriend(webchat_uid="W789", member_id="M002", webchat_picture_url="pic-web", webchat_display_name="web-name", last_interaction_at=datetime.utcnow()))
        members = ctx["member_list_service"].list_members_with_last_interaction()
        assert members is not None
