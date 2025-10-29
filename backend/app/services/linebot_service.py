"""
LINE Bot 服務層
封裝 LINE 推播邏輯，連接 FastAPI 和 LINE Bot SDK
"""
import logging
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# 設置 logger
logger = logging.getLogger(__name__)

from app.database import AsyncSessionLocal
from app.models.campaign import Campaign, CampaignStatus
from app.models.survey import Survey, SurveyStatus
from app.models.template import MessageTemplate
from app.models.tag import MemberTag
from app.utils.image_handler import file_path_to_base64

# ============================================================
# 輔助函數：獲取 line_app 的函數 (避免頂層導入衝突)
# ============================================================
def _get_line_app_module():
    """
    動態導入 line_app/app.py
    使用 importlib 避免 sys.modules 緩存衝突
    """
    import sys
    import importlib.util
    from pathlib import Path
    from dotenv import load_dotenv

    project_root = Path(__file__).parent.parent.parent.parent
    line_app_path = project_root / "line_app"
    line_app_py = line_app_path / "app.py"

    # 加載環境變量
    line_app_env = line_app_path / ".env"
    if line_app_env.exists():
        load_dotenv(line_app_env, override=True)

    # 使用 importlib 直接從文件路徑導入，避免 sys.modules['app'] 衝突
    spec = importlib.util.spec_from_file_location("line_app_module", line_app_py)
    line_app_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(line_app_module)

    return line_app_module


class LineBotService:
    """LINE Bot 服務"""

    def __init__(self):
        """初始化 LINE Bot - 驗證 line_app 可用"""
        try:
            # 驗證模組可以被導入
            hotel_bot_module = _get_line_app_module()

            # 驗證必要的函數存在
            if not hasattr(hotel_bot_module, 'broadcast_message'):
                raise RuntimeError("hotel_bot_module.broadcast_message function not found")
            if not hasattr(hotel_bot_module, 'push_survey_entry'):
                raise RuntimeError("hotel_bot_module.push_survey_entry function not found")

            logger.info("✅ LINE Bot service initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize LINE Bot service: {e}")
            logger.error("Please check LINE credentials in /data2/lili_hotel/line_app/.env")
            raise RuntimeError(f"LINE Bot service initialization failed: {e}") from e

    async def send_campaign(self, campaign_id: int) -> Dict[str, Any]:
        """
        發送推廣活動到 LINE

        Args:
            campaign_id: 活動 ID

        Returns:
            Dict: 發送結果 {ok: bool, sent: int, error: str}
        """
        async with AsyncSessionLocal() as db:
            try:
                logger.info(f"📤 Sending campaign {campaign_id}...")

                # 1. 讀取 campaign 及相關資料 (包含 carousel_items)
                from app.models.template import MessageTemplate
                stmt = (
                    select(Campaign)
                    .options(
                        selectinload(Campaign.template).selectinload(MessageTemplate.carousel_items)
                    )
                    .where(Campaign.id == campaign_id)
                )
                result = await db.execute(stmt)
                campaign = result.scalar_one_or_none()

                if not campaign:
                    error_msg = f"Campaign {campaign_id} not found"
                    logger.error(f"❌ {error_msg}")
                    return {"ok": False, "sent": 0, "error": error_msg}

                # 2. 構建 payload
                target_tag_names = await self._resolve_member_tag_names(db, campaign.target_audience)
                payload = self._build_campaign_payload(campaign, target_tag_names)

                # 3. 獲取 line_app 模組並調用 broadcast_message
                hotel_bot_module = _get_line_app_module()
                result = hotel_bot_module.broadcast_message(payload)

                # 4. 根據呼叫結果更新資料庫狀態
                sent_count = 0
                failed_count = 0
                ok = False
                if isinstance(result, dict):
                    sent_count = result.get("sent", 0) or 0
                    failed_count = result.get("failed", 0) or 0
                    ok = bool(result.get("ok")) and sent_count > 0

                campaign.sent_count = sent_count

                if ok:
                    campaign.status = CampaignStatus.SENT
                    campaign.sent_at = datetime.now()
                else:
                    campaign.status = CampaignStatus.FAILED
                    logger.error(
                        "❌ Campaign %s failed to send via LINE: %s",
                        campaign_id,
                        result.get("error") if isinstance(result, dict) else "unknown error",
                    )

                await db.commit()

                if ok:
                    if failed_count:
                        logger.warning(
                            "⚠️ Campaign %s sent to %s users with %s failures",
                            campaign_id,
                            sent_count,
                            failed_count,
                        )
                    else:
                        logger.info(
                            "✅ Campaign %s sent to %s users", campaign_id, sent_count
                        )
                else:
                    logger.warning(
                        "⚠️ Campaign %s not sent successfully", campaign_id
                    )
                return result

            except Exception as e:
                await db.rollback()
                error_msg = f"Failed to send campaign: {str(e)}"
                logger.error(f"❌ {error_msg}")
                return {"ok": False, "sent": 0, "error": error_msg}

    async def send_survey(self, survey_id: int) -> Dict[str, Any]:
        """
        發送問卷到 LINE

        Args:
            survey_id: 問卷 ID

        Returns:
            Dict: 發送結果 {ok: bool, sent: int, error: str}
        """
        async with AsyncSessionLocal() as db:
            try:
                logger.info(f"📤 Sending survey {survey_id}...")

                # 1. 讀取 survey 及題目
                stmt = (
                    select(Survey)
                    .options(selectinload(Survey.questions))
                    .where(Survey.id == survey_id)
                )
                result = await db.execute(stmt)
                survey = result.scalar_one_or_none()

                if not survey:
                    error_msg = f"Survey {survey_id} not found"
                    logger.error(f"❌ {error_msg}")
                    return {"ok": False, "sent": 0, "error": error_msg}

                # 2. 構建 payload
                payload = self._build_survey_payload(survey)

                # 3. 獲取 line_app 模組並調用 push_survey_entry
                hotel_bot_module = _get_line_app_module()
                sent_count = hotel_bot_module.push_survey_entry(
                    survey_id=survey_id,
                    title=survey.name,
                    preview_text=survey.description
                )

                # 4. 更新資料庫狀態 (確保狀態為 PUBLISHED 且記錄發送時間)
                survey.status = SurveyStatus.PUBLISHED
                survey.sent_at = datetime.now()
                await db.commit()

                logger.info(
                    f"✅ Survey {survey_id} sent to {sent_count} users"
                )
                return {"ok": True, "sent": sent_count}

            except Exception as e:
                await db.rollback()
                error_msg = f"Failed to send survey: {str(e)}"
                logger.error(f"❌ {error_msg}")
                return {"ok": False, "sent": 0, "error": error_msg}

    async def _resolve_member_tag_names(
        self,
        db: AsyncSession,
        target_audience: Any,
    ) -> List[str]:
        """
        將 target_audience 中的標籤 ID 轉換為名稱，確保 line_app 以標籤名稱篩選
        """
        if not target_audience or not isinstance(target_audience, dict):
            return []

        raw_tags = target_audience.get("tags") or []
        if not raw_tags:
            return []

        numeric_ids: List[int] = []
        names: List[str] = []

        for tag in raw_tags:
            if isinstance(tag, int):
                numeric_ids.append(tag)
            elif isinstance(tag, str):
                tag_str = tag.strip()
                if tag_str.isdigit():
                    numeric_ids.append(int(tag_str))
                elif tag_str:
                    names.append(tag_str)
            else:
                names.append(str(tag))

        if numeric_ids:
            stmt = select(MemberTag.id, MemberTag.name).where(MemberTag.id.in_(numeric_ids))
            result = await db.execute(stmt)
            id_name_map = {row.id: row.name for row in result.all()}

            for tag_id in numeric_ids:
                name = id_name_map.get(tag_id)
                if name:
                    names.append(name)
                else:
                    logger.warning(
                        "⚠️ Member tag id %s not found when resolving target audience",
                        tag_id,
                    )
                    names.append(str(tag_id))

        # 去重並保留順序
        seen = set()
        ordered_names: List[str] = []
        for name in names:
            if name and name not in seen:
                seen.add(name)
                ordered_names.append(name)

        return ordered_names

    def _build_campaign_payload(
        self,
        campaign: Campaign,
        target_tag_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        構建 campaign payload 給 HotelBot

        Args:
            campaign: Campaign 物件

        Returns:
            Dict: HotelBot 所需的 payload 格式
        """
        template = campaign.template

        # 基本資料
        # 將 interaction_tags 轉換為 JSON 字符串，供 line_app 直接存入數據庫
        import json
        interaction_tags = campaign.interaction_tags or []
        interaction_tags_json = json.dumps(interaction_tags, ensure_ascii=False) if isinstance(interaction_tags, list) else interaction_tags

        payload = {
            "name": campaign.title,
            "title": campaign.title,
            "template_type": template.type.value if hasattr(template.type, "value") else str(template.type),
            "notification_text": template.notification_text or "",
            "preview_text": template.preview_text or "",
            "template_id": template.id,
            "interaction_tags": interaction_tags_json,
        }

        # 處理目標對象 - 確保格式正確 (字串 "all" 或 "tags")
        audience_type = "all"
        target_condition = None
        raw_tags: List[Any] = []

        if campaign.target_audience:
            if isinstance(campaign.target_audience, dict):
                audience_type = str(campaign.target_audience.get("type") or "all").lower()
                target_condition = campaign.target_audience.get("condition")
                raw_tags = campaign.target_audience.get("tags") or []
            else:
                audience_type = str(campaign.target_audience).lower()

        if audience_type in {"filtered", "tags"}:
            payload["target_audience"] = "tags"
            resolved_tags = target_tag_names or []
            if not resolved_tags and raw_tags:
                resolved_tags = [str(tag) for tag in raw_tags if tag]
            if resolved_tags:
                payload["target_tags"] = resolved_tags
            else:
                logger.warning(
                    "⚠️ Campaign %s has filtered audience but no resolved tags; defaulting to all members",
                    campaign.id,
                )
                payload["target_audience"] = "all"
        else:
            payload["target_audience"] = "all"

        if target_condition:
            payload["target_condition"] = target_condition

        # 處理輪播項目
        if hasattr(template, "carousel_items") and template.carousel_items:
            carousel_items = []
            for item in template.carousel_items:
                # 直接使用圖片 URL，不進行 Base64 轉換
                # app.py 的 image_url_from_item() 會處理 HTTP/HTTPS URL
                carousel_items.append(
                    {
                        "id": item.id,
                        "image_url": item.image_url,  # 直接傳遞 URL
                        "title": item.title,
                        "description": item.description,
                        "price": float(item.price) if item.price else None,
                        "action_url": item.action_url,
                        "action_button_enabled": item.action_button_enabled if item.action_button_enabled is not None else False,
                        "action_button_text": item.action_button_text or "查看詳情",  # 使用用戶輸入，預設為「查看詳情」
                        "action_button_interaction_type": item.action_button_interaction_type or "none",
                        "action_button_url": item.action_button_url,  # 按鈕點擊開啟的 URL
                        "action_button_trigger_message": item.action_button_trigger_message,  # 按鈕點擊觸發的訊息
                        "action_button_trigger_image_url": item.action_button_trigger_image_url,  # 按鈕點擊觸發的圖片 URL
                        "action_button2_enabled": item.action_button2_enabled if item.action_button2_enabled is not None else False,  # 第二個按鈕啟用狀態
                        "action_button2_text": item.action_button2_text or "更多資訊",  # 第二個按鈕文字，預設為「更多資訊」
                        "action_button2_interaction_type": item.action_button2_interaction_type or "none",  # 第二個按鈕互動類型
                        "action_button2_url": item.action_button2_url,  # 第二個按鈕點擊開啟的 URL
                        "action_button2_trigger_message": item.action_button2_trigger_message,  # 第二個按鈕點擊觸發的訊息
                        "action_button2_trigger_image_url": item.action_button2_trigger_image_url,  # 第二個按鈕點擊觸發的圖片 URL
                        "image_aspect_ratio": item.image_aspect_ratio or "1:1",  # 圖片長寬比例
                        "image_click_action_type": item.image_click_action_type or "open_image",  # 圖片點擊動作類型
                        "image_click_action_value": item.image_click_action_value,  # 圖片點擊動作值
                        "interaction_tag_id": item.interaction_tag_id,
                        "sort_order": item.sort_order,
                    }
                )
            payload["carousel_items"] = carousel_items

        # 處理互動條件（單圖模式）- 統一使用 action_button_* 字段
        if campaign.trigger_condition:
            tc = campaign.trigger_condition
            payload["interaction_type"] = tc.get("type")
            if tc.get("type") == "open_url":
                payload["action_button_url"] = tc.get("value")
            elif tc.get("type") == "trigger_message":
                payload["action_button_trigger_message"] = tc.get("value")
            elif tc.get("type") == "trigger_image":
                payload["action_button_trigger_image_url"] = tc.get("value")

        logger.info(f"📦 Built campaign payload: {payload.get('name')}")
        return payload

    def _build_survey_payload(self, survey: Survey) -> Dict[str, Any]:
        """
        構建 survey payload 給 HotelBot

        Args:
            survey: Survey 物件

        Returns:
            Dict: HotelBot 所需的 payload 格式
        """
        # 基本資料
        payload = {
            "name": survey.name,
            "title": survey.name,
            "description": survey.description,
            "target_audience": survey.target_audience.value
            if hasattr(survey.target_audience, "value")
            else str(survey.target_audience),
        }

        # 處理題目
        questions = []
        for q in sorted(survey.questions, key=lambda x: x.order):
            question_data = {
                "question_text": q.question_text,
                "question_type": q.question_type.value
                if hasattr(q.question_type, "value")
                else str(q.question_type),
                "options": q.options or [],
                "is_required": q.is_required,
                "order": q.order,
            }

            # 處理圖片（如果有）
            if q.image_base64:
                question_data["image_base64"] = q.image_base64
            elif q.image_link:
                # 如果是檔案路徑，轉為 Base64
                if q.image_link.startswith("/uploads"):
                    question_data["image_base64"] = file_path_to_base64(q.image_link)
                else:
                    question_data["image_link"] = q.image_link

            questions.append(question_data)

        payload["questions"] = questions

        logger.info(
            f"📦 Built survey payload: {payload.get('name')} ({len(questions)} questions)"
        )
        return payload
