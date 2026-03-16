"""
AI 聊天服務層
"""
import asyncio
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging

from app.models.faq import (
    FaqCategory,
    FaqRule,
    FaqRuleTag,
    AiTokenUsage,
    AiToneConfig,
    FaqModuleAuth,
    Industry,
)
from app.models.chatbot_booking import FaqPmsConnection
from app.models.conversation import ConversationMessage
from app.models.tag import MemberTag
from app.models.member import Member
from app.integrations.openai_service import openai_service
from app.services.pms_chatbot_client import (
    pms_enabled as pms_configured,
    query_pms,
)

logger = logging.getLogger(__name__)


class AiChatService:
    """AI 聊天服務"""

    async def chat(
        self,
        db: AsyncSession,
        message: str,
        line_uid: Optional[str] = None,
        industry_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        統一 AI 聊天入口

        Returns:
            {
                "reply": str,
                "tokens_used": int,
                "referenced_rules": [...],
                "auto_tags": [...]
            }
        """
        # 1. 取得產業
        if not industry_id:
            ind_stmt = select(Industry).where(Industry.is_active == True).limit(1)
            ind_result = await db.execute(ind_stmt)
            industry = ind_result.scalar_one_or_none()
            if not industry:
                return self._error_response("系統尚未設定產業資料")
            industry_id = industry.id

        # 2. 檢查 Token 額度
        usage_stmt = select(AiTokenUsage).where(
            AiTokenUsage.industry_id == industry_id
        )
        usage_result = await db.execute(usage_stmt)
        token_usage = usage_result.scalar_one_or_none()

        if token_usage and token_usage.total_quota > 0:
            if token_usage.used_amount >= token_usage.total_quota:
                return self._error_response(
                    "AI Token 額度已用完，系統已降級至關鍵字回覆模式。",
                    token_exhausted=True,
                )

        # 3. 取得啟用的大分類下 active 規則作為知識庫
        rules_stmt = (
            select(FaqRule)
            .join(FaqCategory, FaqRule.category_id == FaqCategory.id)
            .options(selectinload(FaqRule.tags))
            .where(
                FaqCategory.industry_id == industry_id,
                FaqCategory.is_active == True,
                FaqRule.status == "active",
            )
        )
        rules_result = await db.execute(rules_stmt)
        active_rules = rules_result.scalars().all()

        # 3b. PMS 優先：訂房分類若 PMS 啟用，用即時房況取代 FAQ 靜態規則
        pms_context = await self._get_pms_booking_context(db)
        booking_cat_id = await self._get_booking_category_id(db)

        # 組裝知識庫 context
        knowledge_context = self._build_knowledge_context(
            active_rules, pms_context=pms_context, booking_category_id=booking_cat_id
        )

        # 4. 取得語氣 prompt
        tone_stmt = select(AiToneConfig).where(AiToneConfig.is_active == True)
        tone_result = await db.execute(tone_stmt)
        tone = tone_result.scalar_one_or_none()
        tone_prompt = tone.prompt_text if tone else "你是力麗飯店的客服人員，請用專業友善的語氣回答。"

        # 5. 組裝 messages 呼叫 OpenAI（含對話記憶）
        system_prompt = f"{tone_prompt}\n\n以下是你的知識庫，回答時請優先參考這些資訊：\n{knowledge_context}"

        messages = [{"role": "system", "content": system_prompt}]

        # 加入對話歷史（排除當前訊息）
        if line_uid:
            history = await self._get_conversation_history(db, line_uid, limit=10)
            messages.extend(history)

        messages.append({"role": "user", "content": message})

        reply = await openai_service.chat_completion(
            messages=messages,
            temperature=0.5,
            max_tokens=800,
        )

        if not reply:
            return self._error_response("AI 回覆失敗，請稍後再試。")

        # 6. 估算 token 消耗（簡易估算）
        tokens_used = self._estimate_tokens(system_prompt + message + reply)

        # 7. 更新 token 用量
        if token_usage:
            token_usage.used_amount += tokens_used
            await db.flush()

        # 8. 自動貼標籤
        auto_tags = []
        if line_uid and active_rules:
            auto_tags = await self._auto_tag_member(
                db, line_uid, message, reply, active_rules
            )

        return {
            "reply": reply,
            "tokens_used": tokens_used,
            "referenced_rules": [
                {
                    "id": r.id,
                    "category_id": r.category_id,
                    "content_json": self._parse_json(r.content_json),
                }
                for r in active_rules[:5]  # 最多回傳 5 筆參考規則
            ],
            "auto_tags": auto_tags,
            "token_exhausted": False,
        }

    async def test_chat(
        self,
        db: AsyncSession,
        message: str,
        rule_ids: List[int] = None,
        category_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        測試聊天（不計 token、不貼 tag）
        引用 draft + active 規則（含未發佈），PMS 優先順序與正式聊天一致。
        """
        # 取得指定規則
        if rule_ids:
            rules_stmt = (
                select(FaqRule)
                .options(selectinload(FaqRule.tags))
                .where(FaqRule.id.in_(rule_ids))
            )
        elif category_id:
            rules_stmt = (
                select(FaqRule)
                .options(selectinload(FaqRule.tags))
                .where(FaqRule.category_id == category_id)
            )
        else:
            rules_stmt = (
                select(FaqRule)
                .options(selectinload(FaqRule.tags))
                .where(FaqRule.status.in_(["draft", "active"]))
            )

        rules_result = await db.execute(rules_stmt)
        rules = rules_result.scalars().all()

        # PMS 優先：與正式聊天相同邏輯
        pms_context = await self._get_pms_booking_context(db)
        booking_cat_id = await self._get_booking_category_id(db)

        knowledge_context = self._build_knowledge_context(
            rules, pms_context=pms_context, booking_category_id=booking_cat_id
        )

        # 取得語氣
        tone_stmt = select(AiToneConfig).where(AiToneConfig.is_active == True)
        tone_result = await db.execute(tone_stmt)
        tone = tone_result.scalar_one_or_none()
        tone_prompt = tone.prompt_text if tone else "你是力麗飯店的客服人員。"

        system_prompt = f"{tone_prompt}\n\n知識庫：\n{knowledge_context}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ]

        reply = await openai_service.chat_completion(
            messages=messages,
            temperature=0.5,
            max_tokens=800,
        )

        return {
            "reply": reply or "AI 回覆失敗",
            "tokens_used": 0,
            "referenced_rules": [],
            "auto_tags": [],
        }

    # === Private helpers ===

    async def _get_conversation_history(
        self, db: AsyncSession, line_uid: str, limit: int = 10
    ) -> List[Dict[str, str]]:
        """從 conversation_messages 取得近 N 輪對話歷史"""
        stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.thread_id == line_uid)
            .order_by(ConversationMessage.created_at.desc())
            .limit(limit * 2 + 1)  # user+assistant pairs, +1 for current message to exclude
        )
        result = await db.execute(stmt)
        messages = result.scalars().all()

        if not messages:
            return []

        # 排除最新一筆 incoming（LINE App 在呼叫 AI 前已存入 DB）
        if messages and messages[0].role == "user":
            messages = messages[1:]

        # 反轉為時間正序
        history = []
        for msg in reversed(messages):
            if msg.content:
                history.append({"role": msg.role, "content": msg.content})

        return history

    async def _get_pms_booking_context(self, db: AsyncSession) -> Optional[str]:
        """檢查訂房分類的 PMS 串接狀態，若啟用則查詢即時房況作為知識庫。

        Returns:
            PMS 即時房況文本（若 PMS 啟用且查詢成功），否則 None。
        """
        # 找到「訂房」分類的 PMS 連線設定
        stmt = (
            select(FaqPmsConnection)
            .join(FaqCategory, FaqPmsConnection.faq_category_id == FaqCategory.id)
            .where(FaqCategory.name == "訂房", FaqPmsConnection.status == "enabled")
        )
        result = await db.execute(stmt)
        conn = result.scalar_one_or_none()

        if not conn or not pms_configured():
            return None

        try:
            raw = await asyncio.to_thread(query_pms, "", "", None, 2)
            rooms = raw.get("room", []) if isinstance(raw, dict) else []
            if not rooms:
                return None

            lines = ["【即時房況（PMS）】"]
            for room in rooms:
                code = room.get("roomtype", "")
                data_rows = room.get("data", []) or []
                if not data_rows:
                    continue
                price = data_rows[0].get("price", "—")
                remain = min((d.get("remain", 0) for d in data_rows), default=0)
                lines.append(f"- 房型代碼: {code}，即時房價: {price}，剩餘間數: {remain}")
            return "\n".join(lines)
        except Exception as exc:
            logger.warning(f"PMS 即時房況查詢失敗，降級至 FAQ：{exc}")
            return None

    def _build_knowledge_context(
        self,
        rules: List[FaqRule],
        pms_context: Optional[str] = None,
        booking_category_id: Optional[int] = None,
    ) -> str:
        """組裝知識庫 context 文本。

        若 pms_context 有值，訂房分類的 FAQ 規則會被 PMS 即時資料取代；
        其他分類的 FAQ 規則維持不變。
        """
        if not rules and not pms_context:
            return "目前尚無知識庫資料。"

        lines = []

        # PMS 即時房況優先（取代訂房分類的 FAQ 規則）
        if pms_context:
            lines.append(pms_context)

        for rule in rules:
            # 若 PMS 已提供訂房資料，跳過訂房分類的 FAQ 規則
            if pms_context and booking_category_id and rule.category_id == booking_category_id:
                continue
            content = self._parse_json(rule.content_json)
            if isinstance(content, dict):
                parts = [f"{k}: {v}" for k, v in content.items() if v]
                lines.append("- " + "，".join(parts))
            else:
                lines.append(f"- {content}")
        return "\n".join(lines) if lines else "目前尚無知識庫資料。"

    async def _get_booking_category_id(self, db: AsyncSession) -> Optional[int]:
        """取得「訂房」大分類的 ID"""
        stmt = select(FaqCategory.id).where(FaqCategory.name == "訂房").limit(1)
        result = await db.execute(stmt)
        row = result.scalar_one_or_none()
        return row

    def _parse_json(self, raw: Any) -> Any:
        """安全解析 JSON"""
        if isinstance(raw, str):
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                return raw
        return raw

    def _estimate_tokens(self, text: str) -> int:
        """簡易 token 估算（中文約 1.5 token/字，英文約 0.75 token/word）"""
        return max(1, int(len(text) * 0.75))

    def _error_response(self, message: str, token_exhausted: bool = False) -> Dict[str, Any]:
        """錯誤回應格式"""
        return {
            "reply": message,
            "tokens_used": 0,
            "referenced_rules": [],
            "auto_tags": [],
            "token_exhausted": token_exhausted,
        }

    async def _auto_tag_member(
        self,
        db: AsyncSession,
        line_uid: str,
        user_message: str,
        reply: str,
        rules: List[FaqRule],
    ) -> List[str]:
        """自動為會員貼標籤"""
        # 找到會員
        member_stmt = select(Member).where(Member.line_uid == line_uid)
        member_result = await db.execute(member_stmt)
        member = member_result.scalar_one_or_none()
        if not member:
            return []

        # 收集所有規則的 tag_names
        all_tag_names = set()
        for rule in rules:
            for tag in (rule.tags or []):
                all_tag_names.add(tag.tag_name)

        if not all_tag_names:
            return []

        # 為會員建立 MemberTag（如果不存在）
        tagged = []
        for tag_name in all_tag_names:
            # 檢查是否已存在
            existing_stmt = select(MemberTag).where(
                MemberTag.member_id == member.id,
                MemberTag.tag_name == tag_name,
                MemberTag.message_id == None,
            )
            existing_result = await db.execute(existing_stmt)
            existing = existing_result.scalar_one_or_none()

            if not existing:
                new_tag = MemberTag(
                    member_id=member.id,
                    tag_name=tag_name,
                    tag_source="AI",
                )
                db.add(new_tag)
                tagged.append(tag_name)

        if tagged:
            await db.flush()

        return tagged
