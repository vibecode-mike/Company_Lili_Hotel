"""
AI 聊天服務層 — Tool Calling 模式（統一引擎）

正式模式：讀 FaqRuleVersion 快照（發佈凍結版本）
測試模式：讀 FaqRule（draft + active）
"""
import json
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from openai import AsyncOpenAI
import logging

from app.models.faq import (
    FaqRuleTag,
    AiTokenUsage,
    Industry,
)
from app.models.conversation import ConversationMessage
from app.models.tag import MemberTag
from app.models.member import Member
from app.config import settings
from app.services.chatbot_service import (
    _build_system_prompt,
    _get_tools,
    _kb_search,
)
from app.services.pms_chatbot_client import (
    pms_enabled as pms_configured,
    query_pms,
)

logger = logging.getLogger(__name__)


class AiChatService:
    """AI 聊天服務 — Tool Calling 模式"""

    def __init__(self):
        self._openai: Optional[AsyncOpenAI] = None

    def _get_openai(self) -> AsyncOpenAI:
        if self._openai is None:
            self._openai = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )
        return self._openai

    async def chat(
        self,
        db: AsyncSession,
        message: str,
        line_uid: Optional[str] = None,
        industry_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        統一 AI 聊天入口（Tool Calling + 發佈快照）

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
            ind_stmt = select(Industry).where(Industry.is_active == True).limit(1)  # noqa: E712
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

        # 3. 組裝 messages — 使用 chatbot_service 共用的 system prompt
        system_prompt = _build_system_prompt()
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt}
        ]

        # 加入對話歷史（from DB，聊天室獨有）
        if line_uid:
            history = await self._get_conversation_history(db, line_uid, limit=10)
            messages.extend(history)

        messages.append({"role": "user", "content": message})

        # 4. Tool Calling 迴圈（復用 chatbot_service 工具定義）
        client = self._get_openai()
        total_tokens_used = 0
        max_loops = 5
        reply = ""
        referenced_rule_ids: List[int] = []

        for _ in range(max_loops):
            resp = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                tools=_get_tools(),
                tool_choice="auto",
                timeout=30,
            )
            if resp.usage:
                total_tokens_used += resp.usage.total_tokens

            msg = resp.choices[0].message

            if not msg.tool_calls:
                reply = msg.content or ""
                break

            messages.append(msg)
            for tc in msg.tool_calls:
                fn_name = tc.function.name
                args = json.loads(tc.function.arguments)
                result = await self._execute_tool(db, fn_name, args)
                # 收集 kb_search 實際引用的規則 IDs
                if fn_name == "kb_search" and isinstance(result, dict):
                    referenced_rule_ids.extend(result.get("rule_ids", []))
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result, ensure_ascii=False),
                })
        else:
            reply = "很抱歉，系統暫時無法回應，請稍後再試。"

        # 5. 扣除 token（用 OpenAI 實際回報的 usage）
        if token_usage and total_tokens_used > 0:
            token_usage.used_amount += total_tokens_used
            await db.flush()

        # 6. 自動貼標籤（只貼 AI 當次引用的規則標籤）
        auto_tags = []
        if line_uid and referenced_rule_ids:
            auto_tags = await self._auto_tag_member(db, line_uid, referenced_rule_ids)

        return {
            "reply": reply,
            "tokens_used": total_tokens_used,
            "referenced_rules": [{"rule_id": rid} for rid in referenced_rule_ids],
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
        測試聊天（Tool Calling 模式，扣 token，不貼 tag）
        引用 draft + active 規則（含未發佈）。
        """
        # Token 額度檢查 + 扣除
        ind_stmt = select(Industry).where(Industry.is_active == True).limit(1)  # noqa: E712
        ind_result = await db.execute(ind_stmt)
        industry = ind_result.scalar_one_or_none()
        token_usage = None
        if industry:
            usage_result = await db.execute(
                select(AiTokenUsage).where(AiTokenUsage.industry_id == industry.id)
            )
            token_usage = usage_result.scalar_one_or_none()

        system_prompt = _build_system_prompt()
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ]

        client = self._get_openai()
        total_tokens_used = 0
        max_loops = 5
        reply = ""

        for _ in range(max_loops):
            resp = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                tools=_get_tools(),
                tool_choice="auto",
                timeout=30,
            )
            if resp.usage:
                total_tokens_used += resp.usage.total_tokens

            msg = resp.choices[0].message

            if not msg.tool_calls:
                reply = msg.content or ""
                break

            messages.append(msg)
            for tc in msg.tool_calls:
                fn_name = tc.function.name
                args = json.loads(tc.function.arguments)
                # 測試模式：讀 FaqRule（draft+active），不用快照
                result = await self._execute_tool(
                    db, fn_name, args, test_mode=True, use_snapshot=False
                )
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result, ensure_ascii=False),
                })
        else:
            reply = "AI 回覆失敗"

        # 扣除 token
        if token_usage and total_tokens_used > 0:
            token_usage.used_amount += total_tokens_used
            await db.flush()

        return {
            "reply": reply,
            "tokens_used": total_tokens_used,
            "referenced_rules": [],
            "auto_tags": [],
        }

    # === Tool execution ===

    async def _execute_tool(
        self,
        db: AsyncSession,
        fn_name: str,
        args: Dict[str, Any],
        test_mode: bool = False,
        use_snapshot: bool = True,
    ) -> Any:
        """執行 LLM 呼叫的工具"""
        if fn_name == "kb_search":
            return await _kb_search(
                db,
                args.get("category", ""),
                args.get("query", ""),
                test_mode=test_mode,
                use_snapshot=use_snapshot,
            )
        elif fn_name == "query_pms_availability":
            return await self._run_pms_tool(args)
        elif fn_name == "query_pms_mixed_availability":
            return await self._run_pms_mixed_tool(args)
        else:
            # confirm_room_selection, save_member_info 在聊天室不適用
            return {"info": "此功能僅在網站訂房時可用"}

    async def _run_pms_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """PMS 查詢（簡化版，不需 session 狀態）"""
        import asyncio
        startdate = args.get("startdate", "")
        enddate = args.get("enddate", "")
        housingcnt = args.get("housingcnt", 2)

        if not pms_configured():
            return {"error": "PMS 未串接", "rooms": []}

        try:
            raw = await asyncio.to_thread(query_pms, startdate, enddate, None, housingcnt)
            rooms = raw.get("room", []) if isinstance(raw, dict) else []
            result_rooms = []
            for room in rooms:
                code = room.get("roomtype", "")
                data_rows = room.get("data", []) or []
                if not data_rows:
                    continue
                price = data_rows[0].get("price", 0)
                remain = min((d.get("remain", 0) for d in data_rows), default=0)
                result_rooms.append({
                    "room_type_code": code,
                    "price": price,
                    "available_count": remain,
                })
            return {"ok": True, "rooms": result_rooms}
        except Exception as exc:
            logger.warning(f"PMS 查詢失敗：{exc}")
            return {"error": f"PMS 查詢失敗：{exc}", "rooms": []}

    async def _run_pms_mixed_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """混合房型查詢"""
        import asyncio
        startdate = args.get("startdate", "")
        enddate = args.get("enddate", "")
        requests = args.get("requests", [])

        if not pms_configured():
            return {"error": "PMS 未串接", "all_available": False, "items": []}

        try:
            raw = await asyncio.to_thread(query_pms, startdate, enddate, None, 2)
            rooms = raw.get("room", []) if isinstance(raw, dict) else []
            avail_map = {}
            for room in rooms:
                code = room.get("roomtype", "")
                data_rows = room.get("data", []) or []
                if data_rows:
                    avail_map[code] = min((d.get("remain", 0) for d in data_rows), default=0)

            items = []
            all_ok = True
            for req in requests:
                code = req.get("room_type_code", "")
                need = req.get("room_count", 1)
                have = avail_map.get(code, 0)
                ok = have >= need
                if not ok:
                    all_ok = False
                items.append({"room_type_code": code, "needed": need, "available": have, "ok": ok})

            return {"ok": True, "all_available": all_ok, "items": items}
        except Exception as exc:
            logger.warning(f"PMS mixed 查詢失敗：{exc}")
            return {"error": str(exc), "all_available": False, "items": []}

    # === Private helpers ===

    async def _get_conversation_history(
        self, db: AsyncSession, line_uid: str, limit: int = 10
    ) -> List[Dict[str, str]]:
        """從 conversation_messages 取得近 N 輪對話歷史"""
        stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.thread_id == line_uid)
            .order_by(ConversationMessage.created_at.desc())
            .limit(limit * 2 + 1)
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

    async def _auto_tag_member(
        self,
        db: AsyncSession,
        line_uid: str,
        referenced_rule_ids: List[int],
    ) -> List[str]:
        """自動為會員貼標籤（只貼 AI 當次引用的規則標籤）"""
        if not referenced_rule_ids:
            return []

        # 找到會員
        member_stmt = select(Member).where(Member.line_uid == line_uid)
        member_result = await db.execute(member_stmt)
        member = member_result.scalar_one_or_none()
        if not member:
            return []

        # 只從當次引用的規則收集 tag_names
        tag_stmt = select(FaqRuleTag.tag_name).where(
            FaqRuleTag.rule_id.in_(referenced_rule_ids)
        ).distinct()
        tag_result = await db.execute(tag_stmt)
        tag_names = {t for (t,) in tag_result.all()}

        if not tag_names:
            return []

        # 為會員建立 MemberTag（如果不存在）
        tagged = []
        for tag_name in tag_names:
            existing_stmt = select(MemberTag).where(
                MemberTag.member_id == member.id,
                MemberTag.tag_name == tag_name,
                MemberTag.message_id == None,  # noqa: E711
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

    def _error_response(self, message: str, token_exhausted: bool = False) -> Dict[str, Any]:
        """錯誤回應格式"""
        return {
            "reply": message,
            "tokens_used": 0,
            "referenced_rules": [],
            "auto_tags": [],
            "token_exhausted": token_exhausted,
        }
