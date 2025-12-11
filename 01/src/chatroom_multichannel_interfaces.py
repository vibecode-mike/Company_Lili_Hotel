from __future__ import annotations

from datetime import datetime
from typing import List, Optional


class Member:
    def __init__(
        self,
        member_id: str,
        email: Optional[str] = None,
        line_uid: Optional[str] = None,
        fb_uid: Optional[str] = None,
        webchat_uid: Optional[str] = None,
        join_source: Optional[str] = None,
        line_name: Optional[str] = None,
        fb_name: Optional[str] = None,
        webchat_name: Optional[str] = None,
        last_interaction_at: Optional[datetime] = None,
    ):
        self.member_id = member_id
        self.email = email
        self.line_uid = line_uid
        self.fb_uid = fb_uid
        self.webchat_uid = webchat_uid
        self.join_source = join_source
        self.line_name = line_name
        self.fb_name = fb_name
        self.webchat_name = webchat_name
        self.last_interaction_at = last_interaction_at


class LineFriend:
    def __init__(
        self,
        line_uid: str,
        member_id: Optional[str] = None,
        line_display_name: Optional[str] = None,
        line_picture_url: Optional[str] = None,
        is_following: bool = True,
        followed_at: Optional[datetime] = None,
        unfollowed_at: Optional[datetime] = None,
        last_interaction_at: Optional[datetime] = None,
    ):
        self.line_uid = line_uid
        self.member_id = member_id
        self.line_display_name = line_display_name
        self.line_picture_url = line_picture_url
        self.is_following = is_following
        self.followed_at = followed_at
        self.unfollowed_at = unfollowed_at
        self.last_interaction_at = last_interaction_at


class FbFriend:
    def __init__(
        self,
        fb_uid: str,
        member_id: Optional[str] = None,
        fb_display_name: Optional[str] = None,
        fb_picture_url: Optional[str] = None,
        email: Optional[str] = None,
        is_following: bool = True,
        followed_at: Optional[datetime] = None,
        unfollowed_at: Optional[datetime] = None,
        last_interaction_at: Optional[datetime] = None,
    ):
        self.fb_uid = fb_uid
        self.member_id = member_id
        self.fb_display_name = fb_display_name
        self.fb_picture_url = fb_picture_url
        self.email = email
        self.is_following = is_following
        self.followed_at = followed_at
        self.unfollowed_at = unfollowed_at
        self.last_interaction_at = last_interaction_at


class WebchatFriend:
    def __init__(
        self,
        webchat_uid: str,
        member_id: Optional[str] = None,
        webchat_display_name: Optional[str] = None,
        webchat_picture_url: Optional[str] = None,
        email: Optional[str] = None,
        is_following: bool = True,
        followed_at: Optional[datetime] = None,
        unfollowed_at: Optional[datetime] = None,
        last_interaction_at: Optional[datetime] = None,
    ):
        self.webchat_uid = webchat_uid
        self.member_id = member_id
        self.webchat_display_name = webchat_display_name
        self.webchat_picture_url = webchat_picture_url
        self.email = email
        self.is_following = is_following
        self.followed_at = followed_at
        self.unfollowed_at = unfollowed_at
        self.last_interaction_at = last_interaction_at


class ConversationThread:
    def __init__(
        self,
        thread_id: str,
        member_id: str,
        platform: str,
        platform_uid: str,
        last_message_at: Optional[datetime] = None,
    ):
        self.thread_id = thread_id
        self.member_id = member_id
        self.platform = platform
        self.platform_uid = platform_uid
        self.last_message_at = last_message_at


class ConversationMessage:
    def __init__(
        self,
        message_id: str,
        thread_id: str,
        platform: str,
        content: str,
        sent_at: datetime,
    ):
        self.message_id = message_id
        self.thread_id = thread_id
        self.platform = platform
        self.content = content
        self.sent_at = sent_at


class ChatLogEntry:
    def __init__(
        self,
        log_id: str,
        platform: str,
        platform_uid: str,
        content: str,
        sent_at: datetime,
    ):
        self.log_id = log_id
        self.platform = platform
        self.platform_uid = platform_uid
        self.content = content
        self.sent_at = sent_at


class MemberRepository:
    def save(self, member: Member) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def find_by_email(self, email: str) -> Optional[Member]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def find_by_member_id(self, member_id: str) -> Optional[Member]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def list_members(self) -> List[Member]:
        raise NotImplementedError("紅燈階段：尚未實作")


class LineFriendRepository:
    def save(self, friend: LineFriend) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def find_by_uid(self, line_uid: str) -> Optional[LineFriend]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def link_to_member(self, line_uid: str, member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")


class FbFriendRepository:
    def save(self, friend: FbFriend) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def find_by_uid(self, fb_uid: str) -> Optional[FbFriend]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def link_to_member(self, fb_uid: str, member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")


class WebchatFriendRepository:
    def save(self, friend: WebchatFriend) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def find_by_uid(self, webchat_uid: str) -> Optional[WebchatFriend]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def link_to_member(self, webchat_uid: str, member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")


class ConversationThreadRepository:
    def save(self, thread: ConversationThread) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def find_by_member(self, member_id: str) -> List[ConversationThread]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def find_by_platform(self, member_id: str, platform: str) -> Optional[ConversationThread]:
        raise NotImplementedError("紅燈階段：尚未實作")


class ConversationMessageRepository:
    def save(self, message: ConversationMessage) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def list_by_thread(self, thread_id: str) -> List[ConversationMessage]:
        raise NotImplementedError("紅燈階段：尚未實作")


class ChatLogRepository:
    def save(self, entry: ChatLogEntry) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def list_by_platform_uid(self, platform: str, platform_uid: str) -> List[ChatLogEntry]:
        raise NotImplementedError("紅燈階段：尚未實作")


class ChatroomService:
    def __init__(
        self,
        member_repository: MemberRepository,
        line_friend_repository: LineFriendRepository,
        fb_friend_repository: FbFriendRepository,
        webchat_friend_repository: WebchatFriendRepository,
        thread_repository: ConversationThreadRepository,
        message_repository: ConversationMessageRepository,
        chat_log_repository: ChatLogRepository,
    ):
        self.member_repository = member_repository
        self.line_friend_repository = line_friend_repository
        self.fb_friend_repository = fb_friend_repository
        self.webchat_friend_repository = webchat_friend_repository
        self.thread_repository = thread_repository
        self.message_repository = message_repository
        self.chat_log_repository = chat_log_repository

    def enforce_oauth_login_for_webchat(self) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def webchat_line_oauth_login(self, line_uid: str, email: Optional[str], webchat_uid: Optional[str]) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def webchat_facebook_oauth_login(self, fb_uid: str, email: Optional[str], webchat_uid: Optional[str]) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def webchat_google_oauth_login(self, email: str, webchat_uid: Optional[str]) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def merge_line_messages_into_thread(self, member_id: str, line_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def merge_facebook_messages_into_thread(self, member_id: str, fb_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def merge_webchat_messages_into_thread(self, member_id: str, webchat_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def create_member_and_link_channels(
        self, member_id: str, email: Optional[str], line_uid: Optional[str], webchat_uid: Optional[str]
    ) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def create_webchat_member(self, member_id: str, email: Optional[str], webchat_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def create_member_without_email(self, member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def create_line_friend(self, line_uid: str, member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def link_webchat_friend_to_member(self, webchat_uid: str, member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def reuse_existing_member(self, member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def merge_members(self, source_member_id: str, target_member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def relink_friends_to_master_member(self, source_member_id: str, target_member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def unify_member_links(self, member_id: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def open_customer_thread(self, member_id: str) -> ConversationThread:
        raise NotImplementedError("紅燈階段：尚未實作")

    def send_line_message(self, member_id: str, content: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def send_facebook_message(self, member_id: str, content: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def send_webchat_message(self, member_id: str, content: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def log_send_failure(self, member_id: str, platform: str, reason: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def generate_webchat_uid(self) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def create_webchat_friend(self, webchat_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def persist_uid_to_localstorage(self, webchat_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def send_uid_to_backend(self, webchat_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def update_webchat_friend_state(self, webchat_uid: str, is_following: bool) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def establish_webchat_session(self, webchat_uid: Optional[str]) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def initiate_line_oauth(self) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def initiate_facebook_oauth(self) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def initiate_google_oauth(self) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def log_oauth_failure(self, provider: str, error_type: str, user_ip: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def merge_member_profile(self, email: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def merge_member_tags(self, member_id: str, tags: List[str]) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")


class ChatroomEventHandler:
    def line_oauth_failed(self, reason: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def facebook_oauth_failed(self, reason: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def google_oauth_failed(self, reason: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def websocket_disconnected_timeout(self, webchat_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def websocket_reconnected(self, webchat_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")

    def websocket_disconnected(self, webchat_uid: str) -> None:
        raise NotImplementedError("紅燈階段：尚未實作")


class ChatroomPolicy:
    def block_anonymous_chat(self) -> bool:
        raise NotImplementedError("紅燈階段：尚未實作")

    def manual_channel_switch_required(self) -> bool:
        raise NotImplementedError("紅燈階段：尚未實作")

    def deferred_merge_on_email(self) -> bool:
        raise NotImplementedError("紅燈階段：尚未實作")

    def ignore_blank_overwrite(self) -> bool:
        raise NotImplementedError("紅燈階段：尚未實作")

    def session_continues(self) -> bool:
        raise NotImplementedError("紅燈階段：尚未實作")


class ChatroomReadModel:
    def __init__(
        self,
        member_repository: MemberRepository,
        line_friend_repository: LineFriendRepository,
        fb_friend_repository: FbFriendRepository,
        webchat_friend_repository: WebchatFriendRepository,
        thread_repository: ConversationThreadRepository,
        message_repository: ConversationMessageRepository,
        chat_log_repository: ChatLogRepository,
    ):
        self.member_repository = member_repository
        self.line_friend_repository = line_friend_repository
        self.fb_friend_repository = fb_friend_repository
        self.webchat_friend_repository = webchat_friend_repository
        self.thread_repository = thread_repository
        self.message_repository = message_repository
        self.chat_log_repository = chat_log_repository

    def chat_log_integrity(self, member_id: str) -> bool:
        raise NotImplementedError("紅燈階段：尚未實作")

    def member_join_source(self, member_id: str) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def reply_channel_switcher(self, member_id: str) -> List[str]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def chat_log_view(self, member_id: str) -> List[ChatLogEntry]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def login_method_display(self, member_id: str) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def chat_thread_timeline(self, member_id: str) -> List[ConversationMessage]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def message_source_labels(self, member_id: str) -> List[str]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def chat_thread_by_platform(self, member_id: str, platform: str) -> List[ConversationMessage]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def reply_channel_default(self, member_id: str) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def channel_status_indicator(self, member_id: str) -> List[str]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def send_error_ui(self, platform: str) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def pending_send_queue(self, member_id: str) -> List[ConversationMessage]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def chat_status_banner(self, member_id: str) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def chat_continuation(self, member_id: str) -> bool:
        raise NotImplementedError("紅燈階段：尚未實作")

    def chat_thread_isolation(self, member_id: str) -> bool:
        raise NotImplementedError("紅燈階段：尚未實作")

    def merge_decision(self, member_id: str) -> str:
        raise NotImplementedError("紅燈階段：尚未實作")

    def member_list(self) -> List[Member]:
        raise NotImplementedError("紅燈階段：尚未實作")

    def profile_merge_result(self, member_id: str) -> dict:
        raise NotImplementedError("紅燈階段：尚未實作")
