from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List


@dataclass
class Member:
    member_id: str
    email: Optional[str] = None
    join_source: Optional[str] = None
    line_uid: Optional[str] = None
    fb_uid: Optional[str] = None
    webchat_uid: Optional[str] = None
    last_interaction_at: Optional[datetime] = None


@dataclass
class LineFriend:
    line_uid: str
    member_id: Optional[str] = None
    line_display_name: Optional[str] = None
    line_picture_url: Optional[str] = None
    email: Optional[str] = None
    is_following: bool = True
    last_interaction_at: Optional[datetime] = None
    followed_at: Optional[datetime] = None
    unfollowed_at: Optional[datetime] = None


@dataclass
class FacebookFriend:
    fb_uid: str
    member_id: Optional[str] = None
    fb_display_name: Optional[str] = None
    fb_picture_url: Optional[str] = None
    email: Optional[str] = None
    is_following: bool = True
    last_interaction_at: Optional[datetime] = None
    followed_at: Optional[datetime] = None
    unfollowed_at: Optional[datetime] = None


@dataclass
class WebchatFriend:
    webchat_uid: str
    member_id: Optional[str] = None
    webchat_display_name: Optional[str] = None
    webchat_picture_url: Optional[str] = None
    email: Optional[str] = None
    is_following: bool = True
    last_interaction_at: Optional[datetime] = None
    followed_at: Optional[datetime] = None
    unfollowed_at: Optional[datetime] = None


@dataclass
class ChatLog:
    log_id: str
    member_id: str
    platform: str  # LINE / Facebook / Webchat
    direction: str  # incoming/outgoing
    message: str
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ConversationThread:
    thread_id: str  # 格式 {platform}:{platform_uid}
    member_id: str
    platform: str
    platform_uid: str
    conversation_name: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


@dataclass
class ConversationMessage:
    message_id: str
    thread_id: str
    platform: str
    direction: str  # incoming/outgoing
    message_type: str = "text"
    question: Optional[str] = None
    response: Optional[str] = None
    message_source: Optional[str] = None  # webhook/manual/gpt/keyword/etc
    created_at: datetime = field(default_factory=datetime.utcnow)
