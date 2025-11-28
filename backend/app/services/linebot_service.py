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

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.message import Message
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

    line_app_path = settings.line_app_path
    line_app_py = line_app_path / "app.py"

    # 加載環境變量
    line_app_env = line_app_path / ".env"
    if line_app_env.exists():
        load_dotenv(line_app_env, override=True)

    # 將 line_app 目錄添加到 sys.path，以便 app.py 可以導入同目錄下的模組（如 usage_monitor）
    line_app_str = str(line_app_path)
    if line_app_str not in sys.path:
        sys.path.insert(0, line_app_str)

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
            if not hasattr(hotel_bot_module, 'push_campaign'):
                raise RuntimeError("hotel_bot_module.push_campaign function not found")

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
                    select(Message)
                    .options(
                        selectinload(Message.template).selectinload(MessageTemplate.carousel_items)
                    )
                    .where(Message.id == campaign_id)
                )
                result = await db.execute(stmt)
                campaign = result.scalar_one_or_none()

                if not campaign:
                    error_msg = f"Campaign {campaign_id} not found"
                    logger.error(f"❌ {error_msg}")
                    return {"ok": False, "sent": 0, "error": error_msg}

                # 2. 構建 payload（使用新版 target_type + target_filter）
                target_tag_names = await self._resolve_member_tag_names_from_filter(db, campaign.target_filter)
                payload = self._build_campaign_payload(campaign, target_tag_names)

                # 3. 獲取 line_app 模組並調用 push_campaign
                hotel_bot_module = _get_line_app_module()
                result = hotel_bot_module.push_campaign(payload)

                # 4. 根據呼叫結果更新資料庫狀態
                sent_count = 0
                failed_count = 0
                ok = False
                if isinstance(result, dict):
                    sent_count = result.get("sent", 0) or 0
                    failed_count = result.get("failed", 0) or 0
                    ok = bool(result.get("ok")) and sent_count > 0

                campaign.send_count = sent_count

                if ok:
                    campaign.send_status = "已發送"
                    campaign.send_time = datetime.now()
                else:
                    campaign.send_status = "發送失敗"
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

    async def _resolve_member_tag_names_from_filter(
        self,
        db: AsyncSession,
        target_filter: Optional[Dict[str, Any]],
    ) -> List[str]:
        """
        從 target_filter 中提取標籤名稱（新版設計）

        Args:
            db: 數據庫 session
            target_filter: 篩選條件 {"include": [...], "exclude": [...]}

        Returns:
            標籤名稱列表
        """
        if not target_filter or not isinstance(target_filter, dict):
            return []

        # 目前只處理 include 標籤
        raw_tags = target_filter.get("include") or []
        if not raw_tags:
            return []

        # 標籤通常已經是名稱字串，直接返回
        return [str(tag) for tag in raw_tags if tag]

    def _build_campaign_payload(
        self,
        campaign: Message,
        target_tag_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        構建 campaign payload 給 HotelBot

        Args:
            campaign: Message 物件

        Returns:
            Dict: HotelBot 所需的 payload 格式
        """
        template = campaign.template

        # 基本資料
        # 將 interaction_tags 轉換為 JSON 字符串，供 line_app 直接存入數據庫
        import json
        interaction_tags = campaign.interaction_tags or []
        interaction_tags_json = json.dumps(interaction_tags, ensure_ascii=False) if isinstance(interaction_tags, list) else interaction_tags

        # 驗證 campaign.id 必須存在
        if campaign.id is None:
            error_msg = f"❌ Campaign ID is None when building payload for campaign '{campaign.message_content}'"
            logger.error(error_msg)
            raise ValueError(error_msg)

        logger.debug(f"✅ Building payload with source_campaign_id={campaign.id} for campaign '{campaign.message_content}'")

        payload = {
            "name": campaign.message_content,
            "title": campaign.message_content,
            # 移除 template_type，因為現在使用 Flex Message JSON
            "notification_message": template.notification_message or "",
            "template_id": template.id,
            "interaction_tags": interaction_tags_json,
            "source_campaign_id": campaign.id,
        }

        # 添加 Flex Message JSON（如果存在）
        if campaign.flex_message_json:
            payload["flex_message_json"] = campaign.flex_message_json

        # 處理目標對象（使用新版 target_type + target_filter）
        if campaign.target_type == "篩選目標對象" and campaign.target_filter:
            payload["target_audience"] = "tags"
            resolved_tags = target_tag_names or []
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

