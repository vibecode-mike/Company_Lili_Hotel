from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4


# =========================
# Entities (in-memory only)
# =========================


@dataclass
class Member:
    member_id: str
    email: Optional[str] = None
    line_uid: Optional[str] = None
    fb_customer_id: Optional[str] = None
    webchat_uid: Optional[str] = None
    join_source: Optional[str] = None
    last_interaction_at: Optional[datetime] = None


@dataclass
class LineFriend:
    line_uid: str
    member_id: Optional[str] = None
    email: Optional[str] = None
    last_interaction_at: Optional[datetime] = None


@dataclass
class FacebookFriend:
    fb_customer_id: str
    member_id: Optional[str] = None
    email: Optional[str] = None
    last_interaction_at: Optional[datetime] = None


@dataclass
class WebchatFriend:
    webchat_uid: str
    member_id: Optional[str] = None
    email: Optional[str] = None
    is_following: bool = True
    last_interaction_at: Optional[datetime] = None
    followed_at: Optional[datetime] = None
    unfollowed_at: Optional[datetime] = None


@dataclass
class ConversationThread:
    thread_id: str  # {platform}:{platform_uid}
    member_id: str
    platform: str
    platform_uid: str
    last_message_at: Optional[datetime] = None


# =========================
# Repositories (in-memory)
# =========================


class MemberRepository:
    def __init__(self) -> None:
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

    def find_by_fb_customer_id(self, fb_customer_id: str) -> Optional[Member]:
        return next((m for m in self.members.values() if m.fb_customer_id == fb_customer_id), None)

    def find_by_webchat_uid(self, webchat_uid: str) -> Optional[Member]:
        return next((m for m in self.members.values() if m.webchat_uid == webchat_uid), None)

    def list_members(self) -> List[Member]:
        return list(self.members.values())


class LineFriendRepository:
    def __init__(self) -> None:
        self.friends: Dict[str, LineFriend] = {}

    def save(self, friend: LineFriend) -> None:
        self.friends[friend.line_uid] = friend

    def find_by_uid(self, line_uid: str) -> Optional[LineFriend]:
        return self.friends.get(line_uid)

    def update_member_id(self, line_uid: str, member_id: str) -> None:
        if line_uid in self.friends:
            self.friends[line_uid].member_id = member_id


class FacebookFriendRepository:
    def __init__(self) -> None:
        self.friends: Dict[str, FacebookFriend] = {}

    def save(self, friend: FacebookFriend) -> None:
        self.friends[friend.fb_customer_id] = friend

    def find_by_uid(self, fb_customer_id: str) -> Optional[FacebookFriend]:
        return self.friends.get(fb_customer_id)

    def update_member_id(self, fb_customer_id: str, member_id: str) -> None:
        if fb_customer_id in self.friends:
            self.friends[fb_customer_id].member_id = member_id


class WebchatFriendRepository:
    def __init__(self) -> None:
        self.friends: Dict[str, WebchatFriend] = {}

    def save(self, friend: WebchatFriend) -> None:
        self.friends[friend.webchat_uid] = friend

    def find_by_uid(self, webchat_uid: str) -> Optional[WebchatFriend]:
        return self.friends.get(webchat_uid)

    def update_member_id(self, webchat_uid: str, member_id: str) -> None:
        if webchat_uid in self.friends:
            self.friends[webchat_uid].member_id = member_id

    def update_follow_status(
        self, webchat_uid: str, is_following: bool, *, followed_at: Optional[datetime] = None, unfollowed_at: Optional[datetime] = None
    ) -> None:
        if webchat_uid in self.friends:
            friend = self.friends[webchat_uid]
            friend.is_following = is_following
            friend.followed_at = followed_at
            friend.unfollowed_at = unfollowed_at


class ConversationThreadRepository:
    def __init__(self) -> None:
        self.threads: Dict[str, ConversationThread] = {}

    def upsert_thread(self, member_id: str, platform: str, platform_uid: str) -> ConversationThread:
        thread_id = f"{platform}:{platform_uid}"
        thread = self.threads.get(thread_id)
        if thread:
            thread.member_id = member_id
            thread.last_message_at = datetime.now(timezone.utc)
            return thread
        thread = ConversationThread(thread_id=thread_id, member_id=member_id, platform=platform, platform_uid=platform_uid, last_message_at=datetime.now(timezone.utc))
        self.threads[thread_id] = thread
        return thread

    def find_thread(self, thread_id: str) -> Optional[ConversationThread]:
        return self.threads.get(thread_id)

    def find_by_member_and_platform(self, member_id: str, platform: str) -> Optional[ConversationThread]:
        return next((t for t in self.threads.values() if t.member_id == member_id and t.platform == platform), None)


# =========================
# Services
# =========================


class OAuthService:
    def __init__(
        self,
        member_repo: MemberRepository,
        line_repo: LineFriendRepository,
        fb_repo: FacebookFriendRepository,
        webchat_repo: WebchatFriendRepository,
        thread_repo: Optional[ConversationThreadRepository] = None,
    ) -> None:
        self.member_repo = member_repo
        self.line_repo = line_repo
        self.fb_repo = fb_repo
        self.webchat_repo = webchat_repo
        self.thread_repo = thread_repo or ConversationThreadRepository()

    def webchat_login_via_line_oauth(self, *, line_uid: str, email: Optional[str], webchat_uid: Optional[str] = None) -> dict:
        if "ERR" in line_uid:
            raise Exception("LINE OAuth 失敗")
        existing_friend = self.line_repo.find_by_uid(line_uid)
        member = self._find_member_by_email_or_line(email, line_uid, existing_friend)
        if not member:
            member = Member(member_id=self.member_repo.next_member_id(), email=email, line_uid=line_uid, join_source="LINE")
        else:
            member.line_uid = member.line_uid or line_uid
            member.email = member.email or email
        self.member_repo.save(member)
        if not existing_friend:
            self.line_repo.save(LineFriend(line_uid=line_uid, member_id=member.member_id, email=email))
        else:
            self.line_repo.update_member_id(line_uid, member.member_id)

        if webchat_uid:
            existing_web = self.webchat_repo.find_by_uid(webchat_uid)
            if existing_web:
                self.webchat_repo.update_member_id(webchat_uid, member.member_id)
            else:
                self.webchat_repo.save(WebchatFriend(webchat_uid=webchat_uid, member_id=member.member_id, email=email))

        self.thread_repo.upsert_thread(member.member_id, "LINE", line_uid)
        if webchat_uid:
            self.thread_repo.upsert_thread(member.member_id, "Webchat", webchat_uid)
        return {"member_id": member.member_id}

    def webchat_login_via_facebook_oauth(self, *, fb_customer_id: str, email: Optional[str], webchat_uid: Optional[str] = None) -> dict:
        existing_friend = self.fb_repo.find_by_uid(fb_customer_id)
        if not email and not existing_friend:
            raise Exception("Facebook OAuth 缺少 email 或既有綁定")
        member = self._find_member_by_email_or_fb(email, fb_customer_id, existing_friend)
        if not member:
            member = Member(member_id=self.member_repo.next_member_id(), email=email, fb_customer_id=fb_customer_id, join_source="Facebook")
        else:
            member.fb_customer_id = member.fb_customer_id or fb_customer_id
            member.email = member.email or email
        self.member_repo.save(member)
        if not existing_friend:
            self.fb_repo.save(FacebookFriend(fb_customer_id=fb_customer_id, member_id=member.member_id, email=email))
        else:
            self.fb_repo.update_member_id(fb_customer_id, member.member_id)

        if webchat_uid:
            existing_web = self.webchat_repo.find_by_uid(webchat_uid)
            if existing_web:
                self.webchat_repo.update_member_id(webchat_uid, member.member_id)
            else:
                self.webchat_repo.save(WebchatFriend(webchat_uid=webchat_uid, member_id=member.member_id, email=email))

        self.thread_repo.upsert_thread(member.member_id, "Facebook", fb_customer_id)
        if webchat_uid:
            self.thread_repo.upsert_thread(member.member_id, "Webchat", webchat_uid)
        return {"member_id": member.member_id}

    def webchat_login_via_google_oauth(self, *, email: str, webchat_uid: Optional[str] = None) -> dict:
        if not email or "bad" in email:
            raise Exception("Google OAuth 失敗")
        member = self.member_repo.find_by_email(email)
        if not member:
            member = Member(member_id=self.member_repo.next_member_id(), email=email, join_source="Webchat")
        self.member_repo.save(member)
        if webchat_uid:
            existing_web = self.webchat_repo.find_by_uid(webchat_uid)
            if existing_web:
                self.webchat_repo.update_member_id(webchat_uid, member.member_id)
            else:
                self.webchat_repo.save(WebchatFriend(webchat_uid=webchat_uid, member_id=member.member_id, email=email))
            self.thread_repo.upsert_thread(member.member_id, "Webchat", webchat_uid)
        return {"member_id": member.member_id}

    def merge_member_profile_by_email(self, *, email: str, incoming_payload: dict) -> Member:
        member = self.member_repo.find_by_email(email)
        if not member:
            member = Member(member_id=self.member_repo.next_member_id(), email=email)
        for key in ["line_uid", "fb_customer_id", "webchat_uid"]:
            if incoming_payload.get(key) and getattr(member, key) is None:
                setattr(member, key, incoming_payload[key])
        self.member_repo.save(member)
        return member

    def _find_member_by_email_or_line(self, email: Optional[str], line_uid: str, existing_friend: Optional[LineFriend]) -> Optional[Member]:
        if email:
            member = self.member_repo.find_by_email(email)
            if member:
                return member
        if existing_friend:
            return self.member_repo.find_by_line_uid(line_uid)
        return None

    def _find_member_by_email_or_fb(self, email: Optional[str], fb_customer_id: str, existing_friend: Optional[FacebookFriend]) -> Optional[Member]:
        if email:
            member = self.member_repo.find_by_email(email)
            if member:
                return member
        if existing_friend:
            return self.member_repo.find_by_fb_customer_id(fb_customer_id)
        return None


class ChatroomService:
    def __init__(
        self,
        member_repo: MemberRepository,
        line_repo: LineFriendRepository,
        fb_repo: FacebookFriendRepository,
        webchat_repo: WebchatFriendRepository,
        thread_repo: Optional[ConversationThreadRepository] = None,
    ) -> None:
        self.member_repo = member_repo
        self.line_repo = line_repo
        self.fb_repo = fb_repo
        self.webchat_repo = webchat_repo
        self.thread_repo = thread_repo or ConversationThreadRepository()

    def open_chatroom_session(self, member_id: str, prefer_latest: bool = True) -> dict:
        member = self.member_repo.members.get(member_id)
        available_platforms: List[str] = []
        latest_platform: Optional[str] = None
        latest_time: Optional[datetime] = None

        for friend in self.line_repo.friends.values():
            if friend.member_id == member_id:
                if not self.thread_repo.find_by_member_and_platform(member_id, "LINE"):
                    self.thread_repo.upsert_thread(member_id, "LINE", friend.line_uid)
                available_platforms.append("LINE")
                if friend.last_interaction_at and (latest_time is None or friend.last_interaction_at > latest_time):
                    latest_time = friend.last_interaction_at
                    latest_platform = "LINE"

        for friend in self.fb_repo.friends.values():
            if friend.member_id == member_id:
                if not self.thread_repo.find_by_member_and_platform(member_id, "Facebook"):
                    self.thread_repo.upsert_thread(member_id, "Facebook", friend.fb_customer_id)
                available_platforms.append("Facebook")
                if friend.last_interaction_at and (latest_time is None or friend.last_interaction_at > latest_time):
                    latest_time = friend.last_interaction_at
                    latest_platform = "Facebook"

        for friend in self.webchat_repo.friends.values():
            if friend.member_id == member_id:
                if not self.thread_repo.find_by_member_and_platform(member_id, "Webchat"):
                    self.thread_repo.upsert_thread(member_id, "Webchat", friend.webchat_uid)
                available_platforms.append("Webchat")
                if friend.last_interaction_at and (latest_time is None or friend.last_interaction_at > latest_time):
                    latest_time = friend.last_interaction_at
                    latest_platform = "Webchat"

        default_platform = latest_platform if prefer_latest else (available_platforms[0] if available_platforms else None)
        threads = {}
        for plat in available_platforms:
            t = self.thread_repo.find_by_member_and_platform(member_id, plat)
            if t:
                threads[plat] = t.thread_id

        return {
            "member": member,
            "default_platform": default_platform,
            "available_platforms": available_platforms,
            "threads": threads,
        }

    def create_webchat_uid(self) -> str:
        return str(uuid4())

