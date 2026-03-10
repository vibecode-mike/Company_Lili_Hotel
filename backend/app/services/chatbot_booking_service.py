"""
Database helpers for chatbot booking flow.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chatbot_booking import BookingRecord, ChatbotSession
from app.models.member import Member


class ChatbotBookingService:
    async def upsert_member(
        self,
        db: AsyncSession,
        *,
        name: str,
        phone: str,
        email: str,
    ) -> tuple[Member, bool]:
        stmt = (
            select(Member)
            .where(or_(Member.email == email, Member.phone == phone))
            .order_by(Member.id.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        member = result.scalar_one_or_none()
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        if member:
            member.name = name
            member.phone = phone
            member.email = email
            member.last_interaction_at = now
            await db.flush()
            return member, False

        member = Member(
            name=name,
            phone=phone,
            email=email,
            join_source="Webchat",
            gpt_enabled=True,
            last_interaction_at=now,
        )
        db.add(member)
        await db.flush()
        return member, True

    async def upsert_chatbot_session(
        self,
        db: AsyncSession,
        *,
        state: Any,
        crm_member_id: Optional[int] = None,
    ) -> ChatbotSession:
        result = await db.execute(
            select(ChatbotSession).where(ChatbotSession.id == state.session_id).limit(1)
        )
        session = result.scalar_one_or_none()
        if not session:
            session = ChatbotSession(id=state.session_id)
            db.add(session)

        session.browser_key = state.browser_key
        session.hotel_id = state.hotel_id
        session.intent_state = state.intent_state
        session.turn_count = state.turn_count
        session.booking_adults = state.booking_adults
        session.booking_children = state.booking_children
        session.checkin_date = state.checkin_date_obj
        session.checkout_date = state.checkout_date_obj
        session.selected_room_type = state.selected_room_type
        session.selected_room_count = state.selected_room_count
        session.member_name = state.member_name
        session.member_phone = state.member_phone
        session.member_email = state.member_email
        session.crm_member_id = crm_member_id if crm_member_id is not None else state.crm_member_id
        session.needs_human_followup = state.needs_human_followup
        await db.flush()
        return session

    async def create_booking_record(
        self,
        db: AsyncSession,
        *,
        record_id: str,
        state: Any,
        room_type_name: str,
        booking_url: str,
        data_source: str,
        crm_member_id: Optional[int] = None,
        pms_cart_id: Optional[str] = None,
    ) -> BookingRecord:
        record = BookingRecord(
            id=record_id,
            session_id=state.session_id,
            crm_member_id=crm_member_id,
            room_type_code=state.selected_room_type or "",
            room_type_name=room_type_name,
            room_count=state.selected_room_count or 1,
            checkin_date=state.checkin_date_obj,
            checkout_date=state.checkout_date_obj,
            adults=state.booking_adults or 1,
            children=state.booking_children or 0,
            pms_booking_url=booking_url,
            pms_cart_id=pms_cart_id,
            session_log=state.history,
            data_source=data_source,
            source="Webchat",
        )
        db.add(record)
        await db.flush()
        return record

    async def get_booking_record(
        self,
        db: AsyncSession,
        booking_record_id: str,
    ) -> Optional[BookingRecord]:
        result = await db.execute(
            select(BookingRecord).where(BookingRecord.id == booking_record_id).limit(1)
        )
        return result.scalar_one_or_none()

    async def link_booking_record_member(
        self,
        db: AsyncSession,
        *,
        booking_record: BookingRecord,
        member_id: int,
    ) -> BookingRecord:
        booking_record.crm_member_id = member_id
        await db.flush()
        return booking_record
