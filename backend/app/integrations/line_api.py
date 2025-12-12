"""
LINE Messaging API 集成
"""
from linebot.v3 import WebhookHandler
from linebot.v3.messaging import (
    ApiClient,
    Configuration,
    MessagingApi,
    TextMessage,
    ImageMessage,
    TemplateMessage,
    ButtonsTemplate,
    CarouselTemplate,
    CarouselColumn,
    MessageAction,
    URIAction,
    PushMessageRequest,
    MulticastRequest,
)
from app.config import settings
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class LINEService:
    """LINE Messaging API 服務"""

    def __init__(self):
        self.configuration = Configuration(access_token=settings.LINE_CHANNEL_ACCESS_TOKEN)
        self.api_client = ApiClient(self.configuration)
        self.messaging_api = MessagingApi(self.api_client)
        self.handler = WebhookHandler(settings.LINE_CHANNEL_SECRET)

    async def push_message(self, line_uid: str, messages: List[Any]) -> bool:
        """推送消息給單個用戶"""
        try:
            request = PushMessageRequest(to=line_uid, messages=messages)
            await self.messaging_api.push_message(request)
            return True
        except Exception as e:
            logger.error(f"Push message failed: {str(e)}")
            return False

    async def multicast_message(self, line_uids: List[str], messages: List[Any]) -> Dict[str, int]:
        """群發消息給多個用戶"""
        try:
            # LINE API 限制：每次最多 500 個用戶
            batch_size = 500
            total_sent = 0
            total_failed = 0

            for i in range(0, len(line_uids), batch_size):
                batch = line_uids[i : i + batch_size]
                try:
                    request = MulticastRequest(to=batch, messages=messages)
                    await self.messaging_api.multicast(request)
                    total_sent += len(batch)
                except Exception as e:
                    logger.error(f"Multicast batch failed: {str(e)}")
                    total_failed += len(batch)

            return {"sent": total_sent, "failed": total_failed}
        except Exception as e:
            logger.error(f"Multicast message failed: {str(e)}")
            return {"sent": 0, "failed": len(line_uids)}

    def create_text_message(self, text: str) -> TextMessage:
        """創建文字消息"""
        return TextMessage(text=text)

    def create_image_message(self, original_url: str, preview_url: str) -> ImageMessage:
        """創建圖片消息"""
        return ImageMessage(originalContentUrl=original_url, previewImageUrl=preview_url)

    def create_buttons_template(
        self,
        text: str,
        actions: List[Any],
        title: Optional[str] = None,
        image_url: Optional[str] = None,
    ) -> TemplateMessage:
        """創建按鈕模板"""
        template = ButtonsTemplate(
            text=text,
            actions=actions,
            title=title,
            thumbnailImageUrl=image_url,
        )
        return TemplateMessage(altText="按鈕消息", template=template)

    def create_carousel_template(self, columns: List[CarouselColumn]) -> TemplateMessage:
        """創建輪播模板"""
        template = CarouselTemplate(columns=columns)
        return TemplateMessage(altText="輪播消息", template=template)

    def create_carousel_column(
        self,
        title: str,
        text: str,
        actions: List[Any],
        image_url: Optional[str] = None,
    ) -> CarouselColumn:
        """創建輪播列"""
        return CarouselColumn(
            thumbnailImageUrl=image_url,
            title=title,
            text=text,
            actions=actions,
        )

    def create_message_action(self, label: str, text: str) -> MessageAction:
        """創建消息動作"""
        return MessageAction(label=label, text=text)

    def create_uri_action(self, label: str, uri: str) -> URIAction:
        """創建URI動作"""
        return URIAction(label=label, uri=uri)

    async def get_profile(self, line_uid: str) -> Optional[Dict[str, Any]]:
        """獲取用戶資料"""
        try:
            profile = await self.messaging_api.get_profile(line_uid)
            return {
                "userId": profile.user_id,
                "displayName": profile.display_name,
                "pictureUrl": profile.picture_url,
                "statusMessage": profile.status_message,
            }
        except Exception as e:
            logger.error(f"Get profile failed: {str(e)}")
            return None

    async def get_quota(self) -> Dict[str, int]:
        """獲取剩餘配額"""
        try:
            quota = await self.messaging_api.get_message_quota()
            return {"totalUsage": quota.total_usage, "value": quota.value, "type": quota.type}
        except Exception as e:
            logger.error(f"Get quota failed: {str(e)}")
            return {"totalUsage": 0, "value": 0, "type": "none"}


# 創建全域實例
line_service = LINEService()
