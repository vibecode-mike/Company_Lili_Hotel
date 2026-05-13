"""
Chatbot booking schemas.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class RoomCardSchema(BaseModel):
    room_type_code: str
    room_type_name: str
    price: int
    price_label: str
    available_count: Optional[int] = None
    max_occupancy: int
    image_url: Optional[str] = None
    features: str = ""
    source: Literal["pms", "faq_static", "faq_kb"]


class BookingContextSchema(BaseModel):
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None
    adults: Optional[int] = None
    room_plan_requests: List[dict] = []


class ChatbotMessageInSchema(BaseModel):
    browser_key: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=2000)
    hotel_id: Optional[int] = None
    test_mode: bool = False
    # CRM 後台 ChatFAB 試聊框專用：不建立會員 / 不寫對話紀錄
    # （test_mode=true 是給公開 widget 跳過 token 扣減用的，跟這個不一樣）
    admin_test: bool = False
    # Widget 嵌入站點識別（讓會員管理能分辨同一個 widget JS 嵌在不同網站時的來源）
    site_id: Optional[str] = Field(None, max_length=50)  # 英文代號（穩定 key）
    site_name: Optional[str] = Field(None, max_length=100)  # 中文顯示名（UI 顯示）


ReplyType = Literal["text", "room_cards", "member_form", "booking_confirm"]


class ChatbotMessageOutSchema(BaseModel):
    session_id: str
    intent_state: Literal["detecting", "confirmed", "none"]
    reply_type: ReplyType
    reply: str
    room_cards: List[RoomCardSchema] = []
    missing_fields: List[str] = []
    turn_count: int = 0
    booking_context: BookingContextSchema = BookingContextSchema()
    # 以下欄位由 chat() 填入，handle_message() 使用預設值
    member_form: Optional[MemberFormDefinitionSchema] = None
    tokens_used: int = 0
    referenced_rules: List[Dict[str, Any]] = []
    auto_tags: List[str] = []
    token_exhausted: bool = False
    unanswered: bool = False


class ChatbotRoomsOutSchema(BaseModel):
    source: Literal["pms", "faq_static", "faq_kb"]
    rooms: List[RoomCardSchema]


class RoomSelectionSchema(BaseModel):
    room_type_code: str
    room_count: int = Field(default=1, ge=0, le=9)  # 0 will be coerced to 1 by service
    room_type_name: Optional[str] = None
    source: Optional[Literal["pms", "faq_static", "faq_kb"]] = None


class ConfirmRoomInSchema(BaseModel):
    browser_key: str
    # New multi-room format (spec v0.6+)
    rooms: Optional[List[RoomSelectionSchema]] = None
    # Legacy single-room format (backward compat)
    room_type_code: Optional[str] = None
    room_count: Optional[int] = Field(default=None, ge=0, le=9)
    room_type_name: Optional[str] = None
    source: Optional[Literal["pms", "faq_static", "faq_kb"]] = None


class MemberFormFieldSchema(BaseModel):
    field_name: str
    label: str
    is_required: bool
    input_type: Literal["text", "tel", "email"]
    validation_pattern: Optional[str] = None
    error_message: Optional[str] = None


class MemberFormDefinitionSchema(BaseModel):
    fields: List[MemberFormFieldSchema]
    privacy_note: str


class MemberPrefillSchema(BaseModel):
    guest_name: str = ""
    guest_phone: str = ""
    guest_email: str = ""


class ConfirmRoomOutSchema(BaseModel):
    reply_type: Literal["member_form"] = "member_form"
    session_id: str
    selected_room_type: str
    selected_room_count: int
    member_form: MemberFormDefinitionSchema
    member_prefill: Optional[MemberPrefillSchema] = None


class SessionResetInSchema(BaseModel):
    browser_key: str


class SessionResetOutSchema(BaseModel):
    ok: bool
    session_id: str


class BookingSaveInSchema(BaseModel):
    browser_key: str
    # Optional overrides (if not provided, values are read from in-memory session)
    member_name: Optional[str] = None
    member_phone: Optional[str] = None
    member_email: Optional[str] = None
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None


class BookingSavedDetailSchema(BaseModel):
    crm_member_id: Optional[int] = None
    selected_rooms: List[dict] = []
    room_type_code: Optional[str] = None
    db_saved: bool = True


class BookingSaveOutSchema(BaseModel):
    ok: bool = True
    reservation_id: str
    cart_url: Optional[str] = None
    saved: BookingSavedDetailSchema


class TrackClickInSchema(BaseModel):
    """Widget 點擊事件追蹤輸入。
    用於房卡 +、確認選房等 click 事件 → 自動打互動標籤。"""
    browser_key: str = Field(..., min_length=1, max_length=100)
    event_type: str = Field(..., max_length=50)  # room_select / room_confirm / suggestion / image
    category_name: Optional[str] = None  # FaqCategory.name 互動標籤名（如「訂房」）
    rule_id: Optional[int] = None  # 若可對應到 FaqRule，伺服器自動推導 tag + category
    room_type_code: Optional[str] = None  # 純 metadata，方便後續分析


class TrackClickOutSchema(BaseModel):
    ok: bool = True
    tagged: bool = False  # 是否成功寫入互動標籤（會員不存在時為 False）
