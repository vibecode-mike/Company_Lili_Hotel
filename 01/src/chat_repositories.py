from typing import List, Optional, Dict
from chat_entities import (
    Member,
    LineFriend,
    FacebookFriend,
    WebchatFriend,
    ChatLog,
    ConversationThread,
    ConversationMessage,
)


class MemberRepository:
    """會員存取介面（紅燈階段，無實作）"""

    def __init__(self):
        self.members: Dict[str, Member] = {}
        self._seq = 1

    def next_member_id(self) -> str:
        member_id = f"M{self._seq:03d}"
        self._seq += 1
        return member_id

    def save(self, member: Member) -> None:
        if not member.member_id:
            member.member_id = self.next_member_id()
        self.members[member.member_id] = member

    def find_by_email(self, email: str) -> Optional[Member]:
        return next((m for m in self.members.values() if m.email == email), None)

    def find_by_line_uid(self, line_uid: str) -> Optional[Member]:
        return next((m for m in self.members.values() if m.line_uid == line_uid), None)

    def find_by_fb_uid(self, fb_uid: str) -> Optional[Member]:
        return next((m for m in self.members.values() if m.fb_uid == fb_uid), None)

    def find_by_webchat_uid(self, webchat_uid: str) -> Optional[Member]:
        return next((m for m in self.members.values() if m.webchat_uid == webchat_uid), None)

    def merge_members(self, source_member_id: str, target_member_id: str) -> None:
        source = self.members.get(source_member_id)
        target = self.members.get(target_member_id)
        if not source or not target:
            return
        # 簡單地把缺漏欄位填入目標，然後刪除來源
        if not target.email and source.email:
            target.email = source.email
        if not target.line_uid and source.line_uid:
            target.line_uid = source.line_uid
        if not target.fb_uid and source.fb_uid:
            target.fb_uid = source.fb_uid
        if not target.webchat_uid and source.webchat_uid:
            target.webchat_uid = source.webchat_uid
        self.members[target_member_id] = target
        self.members.pop(source_member_id, None)

    def list_members(self) -> List[Member]:
        return list(self.members.values())


class LineFriendRepository:
    def __init__(self):
        self.friends: Dict[str, LineFriend] = {}

    def save(self, friend: LineFriend) -> None:
        self.friends[friend.line_uid] = friend

    def find_by_uid(self, line_uid: str) -> Optional[LineFriend]:
        return self.friends.get(line_uid)

    def update_member_id(self, line_uid: str, member_id: str) -> None:
        if line_uid in self.friends:
            self.friends[line_uid].member_id = member_id

    def update_follow_status(self, line_uid: str, is_following: bool) -> None:
        if line_uid in self.friends:
            self.friends[line_uid].is_following = is_following


class FacebookFriendRepository:
    def __init__(self):
        self.friends: Dict[str, FacebookFriend] = {}

    def save(self, friend: FacebookFriend) -> None:
        self.friends[friend.fb_uid] = friend

    def find_by_uid(self, fb_uid: str) -> Optional[FacebookFriend]:
        return self.friends.get(fb_uid)

    def update_member_id(self, fb_uid: str, member_id: str) -> None:
        if fb_uid in self.friends:
            self.friends[fb_uid].member_id = member_id

    def update_follow_status(self, fb_uid: str, is_following: bool) -> None:
        if fb_uid in self.friends:
            self.friends[fb_uid].is_following = is_following


class WebchatFriendRepository:
    def __init__(self):
        self.friends: Dict[str, WebchatFriend] = {}

    def save(self, friend: WebchatFriend) -> None:
        self.friends[friend.webchat_uid] = friend

    def find_by_uid(self, webchat_uid: str) -> Optional[WebchatFriend]:
        return self.friends.get(webchat_uid)

    def update_member_id(self, webchat_uid: str, member_id: str) -> None:
        if webchat_uid in self.friends:
            self.friends[webchat_uid].member_id = member_id

    def update_follow_status(
        self, webchat_uid: str, is_following: bool, *, followed_at=None, unfollowed_at=None
    ) -> None:
        if webchat_uid in self.friends:
            friend = self.friends[webchat_uid]
            friend.is_following = is_following
            friend.followed_at = followed_at
            friend.unfollowed_at = unfollowed_at


class ChatLogRepository:
    def __init__(self):
        self.logs: List[ChatLog] = []

    def save_log(self, log: ChatLog) -> None:
        self.logs.append(log)

    def find_by_member(self, member_id: str, platform: str | None = None):
        if platform:
            return [l for l in self.logs if l.member_id == member_id and l.platform == platform]
        return [l for l in self.logs if l.member_id == member_id]

    def list_by_member(self, member_id: str) -> List[ChatLog]:
        return [l for l in self.logs if l.member_id == member_id]


class ConversationThreadRepository:
    def __init__(self):
        self.threads: Dict[str, ConversationThread] = {}

    def upsert_thread(self, member_id: str, platform: str, platform_uid: str, conversation_name: str | None = None) -> ConversationThread:
        thread_id = f"{platform}:{platform_uid}"
        thread = self.threads.get(thread_id)
        if thread:
            thread.member_id = member_id
            thread.platform = platform
            thread.platform_uid = platform_uid
            thread.conversation_name = conversation_name
            self.threads[thread_id] = thread
            return thread
        thread = ConversationThread(
            thread_id=thread_id,
            member_id=member_id,
            platform=platform,
            platform_uid=platform_uid,
            conversation_name=conversation_name,
        )
        self.threads[thread_id] = thread
        return thread

    def find_thread(self, thread_id: str) -> ConversationThread | None:
        return self.threads.get(thread_id)

    def find_by_member_and_platform(self, member_id: str, platform: str) -> ConversationThread | None:
        for t in self.threads.values():
            if t.member_id == member_id and t.platform == platform:
                return t
        return None


class ConversationMessageRepository:
    def __init__(self):
        self.messages: List[ConversationMessage] = []

    def save(self, msg: ConversationMessage) -> None:
        self.messages.append(msg)

    def list_by_thread(self, thread_id: str) -> List[ConversationMessage]:
        return [m for m in self.messages if m.thread_id == thread_id]
