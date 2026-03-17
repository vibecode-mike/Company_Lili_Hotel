"""
FAQ 知識庫管理與 AI 聊天相關 Schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# === FaqCategoryField ===

class FaqCategoryFieldSchema(BaseModel):
    """大分類欄位定義"""

    id: int
    field_name: str
    field_type: str
    is_required: bool
    sort_order: int

    class Config:
        from_attributes = True


# === FaqCategory ===

class FaqCategorySchema(BaseModel):
    """大分類詳情（含欄位定義）"""

    id: int
    industry_id: int
    name: str
    is_active: bool
    is_system_default: bool
    sort_order: int
    fields: List[FaqCategoryFieldSchema] = []
    rule_count: int = 0

    class Config:
        from_attributes = True


class FaqCategoryToggleSchema(BaseModel):
    """啟用/停用大分類"""

    is_active: bool


# === FaqRuleTag ===

class FaqRuleTagSchema(BaseModel):
    """規則標籤"""

    id: int
    tag_name: str

    class Config:
        from_attributes = True


# === FaqRule ===

class FaqRuleCreateSchema(BaseModel):
    """建立規則"""

    content_json: Dict[str, Any]
    tag_names: List[str] = []


class FaqRuleUpdateSchema(BaseModel):
    """編輯規則"""

    content_json: Optional[Dict[str, Any]] = None
    tag_names: Optional[List[str]] = None


class FaqRuleSchema(BaseModel):
    """規則詳情"""

    id: int
    category_id: int
    content_json: Dict[str, Any]
    status: str
    is_enabled: bool = True
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    published_at: Optional[datetime] = None
    published_by: Optional[int] = None
    tags: List[FaqRuleTagSchema] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FaqRuleListSchema(BaseModel):
    """規則清單項"""

    id: int
    category_id: int
    content_json: Dict[str, Any]
    status: str
    is_enabled: bool = True
    tags: List[FaqRuleTagSchema] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === FaqRuleVersion ===

class FaqRuleVersionSchema(BaseModel):
    """規則版本"""

    id: int
    rule_id: int
    content_json: Dict[str, Any]
    status: str
    version_number: int
    snapshot_at: datetime

    class Config:
        from_attributes = True


# === AiTokenUsage ===

class AiTokenUsageSchema(BaseModel):
    """Token 用量"""

    id: int
    industry_id: int
    total_quota: int
    used_amount: int
    remaining: int = 0
    usage_percent: float = 0.0

    class Config:
        from_attributes = True


class AiTokenUsageUpdateSchema(BaseModel):
    """設定 Token 額度"""

    total_quota: int = Field(..., ge=0)


# === AiToneConfig ===

class AiToneConfigSchema(BaseModel):
    """語氣設定"""

    id: int
    tone_type: str
    tone_name: str
    prompt_text: str
    is_active: bool

    class Config:
        from_attributes = True


# === FaqModuleAuth ===

class FaqModuleAuthSchema(BaseModel):
    """模組授權狀態"""

    id: int
    client_id: str
    is_authorized: bool
    authorized_at: Optional[datetime] = None
    authorized_by: Optional[str] = None

    class Config:
        from_attributes = True


class FaqRuleToggleSchema(BaseModel):
    """切換規則啟用狀態（兩維度模型）"""

    is_enabled: Optional[bool] = None
    status: Optional[str] = Field(None, pattern="^(active|draft)$")


class FaqModuleAuthUpdateSchema(BaseModel):
    """設定模組授權"""

    client_id: str
    is_authorized: bool


# === AI Chat ===

class AiChatRequestSchema(BaseModel):
    """AI 聊天請求"""

    message: str = Field(..., min_length=1, max_length=2000)
    line_uid: Optional[str] = None
    channel_type: str = "line"


class AiChatResponseSchema(BaseModel):
    """AI 聊天回應"""

    reply: str
    tokens_used: int = 0
    referenced_rules: List[Dict[str, Any]] = []
    auto_tags: List[str] = []
    token_exhausted: bool = False


class AiTestChatRequestSchema(BaseModel):
    """測試聊天請求"""

    message: str = Field(..., min_length=1, max_length=2000)
    rule_ids: List[int] = []
    category_id: Optional[int] = None
