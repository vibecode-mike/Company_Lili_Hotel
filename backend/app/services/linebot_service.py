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
from sqlalchemy.orm import selectinload

# 確保可以導入 HotelBot - 添加項目根目錄到 sys.path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

# 設置環境變量以避免 HotelBot 初始化失敗
# 從 backend/.env 或系統環境中讀取
from dotenv import load_dotenv
backend_env = Path(__file__).parent.parent.parent / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
# 也嘗試加載項目根目錄的 .env
root_env = project_root / ".env"
if root_env.exists():
    load_dotenv(root_env, override=True)

# 現在導入 HotelBot (環境變量已設置)
# 由於命名衝突 (backend/app 和 project_root/app)，需要特殊處理
try:
    # 嘗試從項目根目錄導入
    import importlib.util
    app_py_path = project_root / "app" / "app.py"
    spec = importlib.util.spec_from_file_location("hotel_bot_module", app_py_path)
    hotel_bot_module = importlib.util.module_from_spec(spec)

    # 延遲執行模組，捕獲可能的初始化錯誤
    try:
        spec.loader.exec_module(hotel_bot_module)
        HotelBot = hotel_bot_module.HotelBot
    except Exception as e:
        # 如果 HotelBot 初始化失敗（例如缺少 LINE 憑證），仍然導入類定義
        logging.warning(f"⚠️  Failed to execute hotel_bot_module: {e}")
        # 設置 HotelBot = None，稍後使用 Mock
        HotelBot = None
except Exception as e:
    logging.error(f"❌ Failed to import HotelBot module: {e}")
    HotelBot = None

from app.database import AsyncSessionLocal
from app.models.campaign import Campaign, CampaignStatus
from app.models.survey import Survey, SurveyStatus
from app.models.template import MessageTemplate
from app.utils.image_handler import file_path_to_base64

logger = logging.getLogger(__name__)


class MockHotelBot:
    """Mock HotelBot for testing without LINE credentials"""
    def push_campaign(self, payload: dict) -> Dict[str, Any]:
        logger.info(f"🧪 [MOCK] Would send campaign: {payload.get('name')}")
        return {"ok": True, "sent": 5, "campaign_id": 999}

    def create_and_send_survey_inline(self, payload: dict) -> Dict[str, Any]:
        logger.info(f"🧪 [MOCK] Would send survey: {payload.get('name')}")
        return {"ok": True, "sent": 5, "survey_id": 999}


class LineBotService:
    """LINE Bot 服務"""

    def __init__(self):
        """初始化 LINE Bot"""
        if HotelBot is None:
            logger.warning("⚠️  HotelBot class not available")
            logger.warning("⚠️  Using MockHotelBot for testing")
            self.bot = MockHotelBot()
            self.is_mock = True
        else:
            try:
                self.bot = HotelBot()
                self.is_mock = False
                logger.info("✅ HotelBot initialized")
            except Exception as e:
                logger.warning(f"⚠️  HotelBot initialization failed: {e}")
                logger.warning("⚠️  Using MockHotelBot for testing")
                self.bot = MockHotelBot()
                self.is_mock = True

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

                # 1. 讀取 campaign 及相關資料
                stmt = (
                    select(Campaign)
                    .options(selectinload(Campaign.template))
                    .where(Campaign.id == campaign_id)
                )
                result = await db.execute(stmt)
                campaign = result.scalar_one_or_none()

                if not campaign:
                    error_msg = f"Campaign {campaign_id} not found"
                    logger.error(f"❌ {error_msg}")
                    return {"ok": False, "sent": 0, "error": error_msg}

                # 2. 構建 payload
                payload = self._build_campaign_payload(campaign)

                # 3. 呼叫 HotelBot 發送
                result = self.bot.push_campaign(payload)

                # 4. 更新資料庫狀態
                campaign.status = CampaignStatus.SENT
                campaign.sent_at = datetime.now()
                campaign.sent_count = result.get("sent", 0)
                await db.commit()

                logger.info(
                    f"✅ Campaign {campaign_id} sent to {result.get('sent', 0)} users"
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

                # 3. 呼叫 HotelBot 發送
                result = self.bot.create_and_send_survey_inline(payload)

                # 4. 更新資料庫狀態
                survey.status = SurveyStatus.PUBLISHED
                survey.sent_at = datetime.now()
                await db.commit()

                logger.info(
                    f"✅ Survey {survey_id} sent to {result.get('sent', 0)} users"
                )
                return result

            except Exception as e:
                await db.rollback()
                error_msg = f"Failed to send survey: {str(e)}"
                logger.error(f"❌ {error_msg}")
                return {"ok": False, "sent": 0, "error": error_msg}

    def _build_campaign_payload(self, campaign: Campaign) -> Dict[str, Any]:
        """
        構建 campaign payload 給 HotelBot

        Args:
            campaign: Campaign 物件

        Returns:
            Dict: HotelBot 所需的 payload 格式
        """
        template = campaign.template

        # 基本資料
        payload = {
            "name": campaign.title,
            "title": campaign.title,
            "template_type": template.type.value if hasattr(template.type, "value") else str(template.type),
            "notification_text": template.notification_text or "",
            "preview_text": template.preview_text or "",
            "interaction_tag": campaign.interaction_tag,
        }

        # 處理輪播項目
        if hasattr(template, "carousel_items") and template.carousel_items:
            carousel_items = []
            for item in template.carousel_items:
                # 轉換圖片路徑為 Base64
                image_base64 = None
                if item.image_url:
                    image_base64 = file_path_to_base64(item.image_url)

                carousel_items.append(
                    {
                        "image_base64": image_base64,
                        "title": item.title,
                        "description": item.description,
                        "price": float(item.price) if item.price else None,
                        "action_url": item.action_url,
                        "sort_order": item.sort_order,
                    }
                )
            payload["carousel_items"] = carousel_items

        # 處理互動條件
        if campaign.trigger_condition:
            tc = campaign.trigger_condition
            payload["interaction_type"] = tc.get("type")
            if tc.get("type") == "open_url":
                payload["url"] = tc.get("value")
            elif tc.get("type") == "trigger_message":
                payload["trigger_message"] = tc.get("value")
            elif tc.get("type") == "trigger_image":
                payload["trigger_image_path"] = tc.get("value")

        # 處理目標對象
        if campaign.target_audience:
            payload["target_audience"] = campaign.target_audience.get("type", "all")
            if "tags" in campaign.target_audience:
                payload["target_tags"] = campaign.target_audience["tags"]

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
