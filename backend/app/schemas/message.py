"""
群發訊息相關 Schema (Message)
注意：原 campaigns 表已重命名為 messages（語意變更）
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from decimal import Decimal


def _normalize_interaction_tags(value):
    """接收逗號字串或陣列並回傳去重後的標籤陣列"""
    if value is None:
        return None

    if isinstance(value, str):
        candidates = value.split(",")
    elif isinstance(value, list):
        candidates = value
    else:
        raise ValueError("互動標籤格式須為陣列或逗號分隔字串")

    normalized: List[str] = []
    seen = set()
    for tag in candidates:
        if tag is None:
            continue
        text = str(tag).strip()
        if not text or text in seen:
            continue
        seen.add(text)
        normalized.append(text)

    return normalized or None


class CarouselItemCreate(BaseModel):
    """輪播項目創建"""

    image_url: Optional[str] = None  # 前端上傳後獲得的圖片 URL
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    action_url: Optional[str] = None
    interaction_tag: Optional[str] = None
    action_button_enabled: bool = False
    action_button_text: Optional[str] = None
    action_button_interaction_type: Optional[str] = None
    action_button_url: Optional[str] = None  # 動作按鈕網址
    action_button_trigger_message: Optional[str] = None  # 動作按鈕觸發訊息
    action_button_trigger_image_url: Optional[str] = None  # 動作按鈕觸發圖片URL
    action_button2_enabled: bool = False  # 第二個動作按鈕啟用狀態
    action_button2_text: Optional[str] = None  # 第二個動作按鈕文字
    action_button2_interaction_type: Optional[str] = None  # 第二個動作按鈕互動類型
    action_button2_url: Optional[str] = None  # 第二個動作按鈕網址
    action_button2_trigger_message: Optional[str] = None  # 第二個動作按鈕觸發訊息
    action_button2_trigger_image_url: Optional[str] = None  # 第二個動作按鈕觸發圖片URL
    image_aspect_ratio: str = "1:1"  # 圖片長寬比例
    image_click_action_type: str = "open_image"  # 圖片點擊動作類型
    image_click_action_value: Optional[str] = None  # 圖片點擊動作值
    sort_order: int = 0


class MessageBase(BaseModel):
    """群發訊息基礎模型"""

    template_id: int
    message_title: Optional[str] = None  # 訊息標題（用於列表顯示）
    notification_message: Optional[str] = None  # 通知推播訊息（顯示在手機通知欄）
    thumbnail: Optional[str] = None  # 縮圖 URL
    interaction_tags: Optional[List[str]] = None  # 互動標籤

    # 發送對象設定（兩欄位設計）
    target_type: str  # 所有好友/篩選目標對象
    target_filter: Optional[Dict[str, Any]] = None  # 篩選條件（JSON格式）

    # 排程設定
    scheduled_at: Optional[datetime] = None  # 排程發送時間（UTC）

    trigger_condition: Optional[Dict[str, Any]] = None  # 特定觸發條件

    @field_validator('scheduled_at', mode='before')
    @classmethod
    def parse_scheduled_at(cls, v):
        """解析排程時間（支援字串或 datetime 對象）"""
        if v is None:
            return None
        if isinstance(v, str):
            # 解析 "YYYY-MM-DD HH:MM:SS" 格式
            try:
                return datetime.strptime(v, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                # 嘗試 ISO 8601 格式
                try:
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    raise ValueError(f'無效的日期時間格式: {v}')
        return v

    @field_validator('interaction_tags', mode='before')
    @classmethod
    def validate_interaction_tags(cls, value):
        return _normalize_interaction_tags(value)


class MessageCreate(BaseModel):
    """創建群發訊息"""

    # 草稿發布功能
    draft_id: Optional[int] = None  # 來源草稿ID（有值時複製草稿發布，原草稿保留）

    # 基本欄位
    template_id: Optional[int] = None  # 模板ID（可選，服務會自動創建）
    message_title: Optional[str] = None  # 訊息標題（用於列表顯示）
    thumbnail: Optional[str] = None  # 縮圖 URL

    # 圖片相關（單圖模式）
    image_url: Optional[str] = None  # 前端上傳後獲得的圖片 URL（主圖）
    interaction_type: Optional[str] = None
    interaction_tags: Optional[List[str]] = None  # 改為數組支持多標籤
    trigger_message: Optional[str] = None
    trigger_image_url: Optional[str] = None  # 觸發圖片 URL

    # 訊息相關
    notification_message: Optional[str] = None
    template_type: Optional[str] = None  # Template01/Template02/Template03/Template04

    # 發送對象設定（兩欄位設計，符合官方規格）
    target_type: str  # 所有好友/篩選目標對象
    target_filter: Optional[Dict[str, Any]] = None  # 篩選條件（JSON格式）

    # 排程設定
    schedule_type: str  # 'immediate', 'scheduled', 'draft'
    scheduled_at: Optional[datetime] = None

    # 輪播相關（多圖模式）
    carousel_items: Optional[List[CarouselItemCreate]] = None

    # 進階觸發條件
    trigger_condition: Optional[Dict[str, Any]] = None

    # Flex Message 支援
    flex_message_json: Optional[str] = None  # LINE Flex Message JSON 字串

    # 系統欄位
    campaign_id: Optional[int] = None  # 關聯活動ID（選填）
    estimated_send_count: int = 0  # 預計發送好友人數
    available_quota: int = 0  # 可用訊息配額用量

    @field_validator('scheduled_at', mode='before')
    @classmethod
    def parse_scheduled_at(cls, v):
        """解析排程時間（支援字串或 datetime 對象）"""
        if v is None:
            return None
        if isinstance(v, str):
            # 解析 "YYYY-MM-DD HH:MM:SS" 格式
            try:
                return datetime.strptime(v, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                # 嘗試 ISO 8601 格式
                try:
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    raise ValueError(f'無效的日期時間格式: {v}')
        return v

    @field_validator('scheduled_at')
    @classmethod
    def validate_scheduled_at_future(cls, v):
        """驗證排程時間必須在未來"""
        if v is not None:
            # 確保時區一致性：移除時區資訊進行比較
            now = datetime.now()
            scheduled = v.replace(tzinfo=None) if v.tzinfo is not None else v
            if scheduled <= now:
                raise ValueError('排程發送時間不可早於目前時間')
        return v

    @field_validator('interaction_tags', mode='before')
    @classmethod
    def validate_interaction_tags(cls, value):
        return _normalize_interaction_tags(value)


class MessageUpdate(MessageBase):
    """更新群發訊息"""

    template_id: Optional[int] = None  # 更新時可選
    target_type: Optional[str] = None  # 更新時可選
    message_title: Optional[str] = None  # 訊息標題（更新時可選）
    flex_message_json: Optional[str] = None  # Flex Message JSON（更新時可選）
    failure_reason: Optional[str] = None  # 發送失敗原因
    scheduled_at: Optional[datetime] = None  # ✅ 排程時間（更新時可選）

class TemplateInfo(BaseModel):
    """模板信息

    Note: MessageTemplate 模型使用 template_type 字段，此 schema 序列化为 type
    """

    id: int
    template_type: str = Field(
        ...,
        serialization_alias="type",  # 序列化时输出为 "type"
        description="模板类型"
    )
    name: Optional[str] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


class MessageListItem(BaseModel):
    """群發訊息列表項"""

    id: int
    message_title: Optional[str] = None  # 訊息標題（用於列表顯示）
    notification_message: Optional[str] = None  # 通知推播訊息（顯示在手機通知欄）
    thumbnail: Optional[str] = None  # 縮圖 URL
    template: TemplateInfo
    send_status: str  # 已排程/已發送/草稿/發送失敗
    interaction_tags: Optional[List[str]] = None  # 互動標籤數組
    platform: str = "LINE"  # 平台名稱（目前固定為 LINE）
    send_count: int = 0  # 傳送人數
    open_count: int = 0  # 開啟次數（不重複）
    click_count: int = 0  # 點擊次數（互動標籤 trigger_member_count 加總）
    open_rate: Optional[float] = None
    click_rate: Optional[float] = None
    scheduled_at: Optional[datetime] = Field(
        default=None,
        validation_alias="scheduled_datetime_utc",
        description="排程發送時間（UTC）",
    )
    send_time: Optional[datetime] = None  # 傳送時間
    source_draft_id: Optional[int] = None  # 來源草稿ID
    created_at: datetime
    updated_at: Optional[datetime] = None  # 最後更新時間

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


# 向後兼容：保留舊名稱作為別名
class UserInfo(BaseModel):
    """用戶信息"""

    id: int
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class MessageDetail(MessageListItem):
    """群發訊息詳情"""

    template_id: int
    target_type: str  # 所有好友/篩選目標對象
    target_filter: Optional[Dict[str, Any]] = None  # 篩選條件（JSON格式）
    trigger_condition: Optional[Dict[str, Any]] = None
    failure_reason: Optional[str] = None  # 發送失敗原因
    campaign_id: Optional[int] = None  # 關聯活動ID（選填）
    created_by: Optional[UserInfo] = None
    estimated_send_count: int = 0  # 預計發送好友人數
    available_quota: int = 0  # 可用訊息配額用量
    click_count: int = 0  # 點擊次數（從ComponentInteractionLog統計）
    flex_message_json: Optional[str] = None  # Flex Message JSON字串（用於前端預覽）


class MessageSearchParams(BaseModel):
    """群發訊息搜索參數"""

    search: Optional[str] = None
    send_status: Optional[str] = None  # 已排程/已發送/草稿/發送失敗
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = 1
    page_size: int = 20


class SendMessageResponse(BaseModel):
    """發送群發訊息響應"""

    message_id: int
    sent_count: int
    sent_at: datetime


class MessageListResponse(BaseModel):
    """群發訊息列表回應"""

    items: List[MessageListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    status_counts: Dict[str, int]



class RecipientListItem(BaseModel):
    """接收者列表項"""

    member: Dict[str, Any]
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    status: str  # pending/sent/opened/clicked/failed

    class Config:
        from_attributes = True


# ========== 新增：群發訊息配額相關 Schema ==========

class QuotaStatusRequest(BaseModel):
    """配額查詢請求"""

    target_type: str  # "all_friends" | "filtered"
    target_filter: Optional[Dict[str, Any]] = None  # 篩選條件 {"include": [...], "exclude": [...]}


class QuotaStatusResponse(BaseModel):
    """配額查詢響應"""

    estimated_send_count: int  # 預計發送人數
    available_quota: int  # 可用配額
    is_sufficient: bool  # 配額是否充足
    quota_type: str  # 配額類型：none | limited
    monthly_limit: Optional[int] = None  # 月度限額（如果有）
    used: int  # 已使用配額
    quota_consumption: int  # 本次將消耗的配額


class MessageSendRequest(BaseModel):
    """消息發送請求"""

    channel_id: Optional[str] = None  # LINE 頻道 ID（多租戶支持）


class MessageSendResponse(BaseModel):
    """消息發送響應"""

    message: str  # 提示消息
    sent_count: int  # 成功發送數量
    failed_count: int  # 失敗數量
    errors: Optional[List[str]] = None  # 錯誤信息列表
