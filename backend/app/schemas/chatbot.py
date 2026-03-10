"""
Chatbot booking schemas.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RoomCardSchema(BaseModel):
    room_type_code: str
    room_type_name: str
    price: int
    price_label: str
    available_count: Optional[int] = None
    max_occupancy: int
    image_url: Optional[str] = None
    features: str = ""
    source: Literal["pms", "faq_static"]


class BookingContextSchema(BaseModel):
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None
    adults: Optional[int] = None
    room_plan_requests: List[dict] = []


class ChatbotMessageInSchema(BaseModel):
    browser_key: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=2000)
    hotel_id: Optional[int] = None


class ChatbotMessageOutSchema(BaseModel):
    session_id: str
    intent_state: Literal["detecting", "confirmed", "none"]
    reply_type: Literal["text", "room_cards", "member_form", "booking_confirm"]
    reply: str
    room_cards: List[RoomCardSchema] = []
    missing_fields: List[str] = []
    turn_count: int
    booking_context: BookingContextSchema = BookingContextSchema()
    booking_url: Optional[str] = None


class ChatbotRoomsOutSchema(BaseModel):
    source: Literal["pms", "faq_static"]
    rooms: List[RoomCardSchema]


class RoomSelectionSchema(BaseModel):
    room_type_code: str
    room_count: int = Field(default=1, ge=0, le=9)  # 0 will be coerced to 1 by service
    room_type_name: Optional[str] = None
    source: Optional[Literal["pms", "faq_static"]] = None


class ConfirmRoomInSchema(BaseModel):
    browser_key: str
    # New multi-room format (spec v0.6+)
    rooms: Optional[List[RoomSelectionSchema]] = None
    # Legacy single-room format (backward compat)
    room_type_code: Optional[str] = None
    room_count: Optional[int] = Field(default=None, ge=0, le=9)
    room_type_name: Optional[str] = None
    source: Optional[Literal["pms", "faq_static"]] = None


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


class ConfirmRoomOutSchema(BaseModel):
    reply_type: Literal["member_form"] = "member_form"
    session_id: str
    selected_room_type: str
    selected_room_count: int
    member_form: MemberFormDefinitionSchema


class SessionResetInSchema(BaseModel):
    browser_key: str


class SessionResetOutSchema(BaseModel):
    ok: bool
    session_id: str


class BookingUrlInSchema(BaseModel):
    browser_key: str
    room_type_code: str
    room_count: int = Field(..., ge=1, le=9)
    checkin_date: str
    checkout_date: str
    adults: int = Field(..., ge=1, le=20)
    children: int = Field(default=0, ge=0, le=20)
    guest_name: str = Field(..., min_length=1, max_length=100)
    guest_phone: str
    guest_email: EmailStr

    @field_validator("guest_phone")
    @classmethod
    def validate_guest_phone(cls, value: str) -> str:
        phone = str(value).strip()
        if not phone.isdigit() or len(phone) != 10:
            raise ValueError("電話格式錯誤，請輸入 10 位數號碼")
        return phone


class BookingUrlOutSchema(BaseModel):
    booking_url: str
    booking_record_id: str
    crm_member_id: Optional[int] = None


class ChatbotMemberInSchema(BaseModel):
    browser_key: str
    name: str = Field(..., min_length=1, max_length=100)
    phone: str
    email: EmailStr
    booking_record_id: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        phone = str(value).strip()
        if not phone.isdigit() or len(phone) != 10:
            raise ValueError("電話格式錯誤，請輸入 10 位數號碼")
        return phone


class ChatbotMemberOutSchema(BaseModel):
    member_id: int
    is_new_member: bool
    tags_applied: List[str] = []


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

