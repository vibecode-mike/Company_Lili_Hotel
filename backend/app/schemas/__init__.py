"""
Pydantic Schemas 模組
"""

# 會員相關
from app.schemas.member import (
    MemberBase,
    MemberCreate,
    MemberUpdate,
    MemberListItem,
    MemberDetail,
    MemberSearchParams,
    AddTagsRequest,
    UpdateNotesRequest,
)

# 群發訊息相關
from app.schemas.message import (
    MessageBase,
    MessageCreate,
    MessageUpdate,
    MessageListItem,
    MessageListResponse,
    MessageDetail,
    MessageSearchParams,
    SendMessageResponse,
    RecipientListItem,
)

# 活動管理相關
from app.schemas.campaign import (
    CampaignBase,
    CampaignCreateNew,
    CampaignUpdateNew,
    CampaignListItemNew,
    CampaignDetailNew,
    CampaignSearchParams as CampaignSearchParamsNew,
)

# 模板相關
from app.schemas.template import (
    TemplateBase,
    TemplateCreate,
    TemplateUpdate,
    TemplateListItem,
    TemplateDetail,
    TemplateSearchParams,
    CarouselItemBase,
    CarouselItemCreate,
    CarouselItemResponse,
)

# 一對一訊息記錄
from app.schemas.message_record import (
    MessageRecordBase,
    MessageRecordCreate,
    MessageRecordUpdate,
    MessageRecordListItem,
    MessageRecordDetail,
)

# 消費紀錄
from app.schemas.consumption_record import (
    ConsumptionRecordBase,
    ConsumptionRecordCreate,
    ConsumptionRecordUpdate,
    ConsumptionRecordListItem,
    ConsumptionRecordDetail,
)

# PMS 系統整合
from app.schemas.pms_integration import (
    PMSIntegrationBase,
    PMSIntegrationCreate,
    PMSIntegrationUpdate,
    PMSIntegrationListItem,
    PMSIntegrationDetail,
    PMSMatchRequest,
    PMSSearchParams,
)

# 標籤管理
from app.schemas.tag import (
    TagBase,
    MemberTagCreate,
    MemberTagUpdate,
    InteractionTagCreate,
    InteractionTagUpdate,
    TagListItem,
    TagDetail,
    TagSearchParams,
    TagNameValidator,
)

__all__ = [
    # 會員
    "MemberBase",
    "MemberCreate",
    "MemberUpdate",
    "MemberListItem",
    "MemberDetail",
    "MemberSearchParams",
    "AddTagsRequest",
    "UpdateNotesRequest",
    # 群發訊息
    "MessageBase",
    "MessageCreate",
    "MessageUpdate",
    "MessageListItem",
    "MessageListResponse",
    "MessageDetail",
    "MessageSearchParams",
    "SendMessageResponse",
    "RecipientListItem",
    # 活動管理
    "CampaignBase",
    "CampaignCreateNew",
    "CampaignUpdateNew",
    "CampaignListItemNew",
    "CampaignDetailNew",
    "CampaignSearchParamsNew",
    # 模板
    "TemplateBase",
    "TemplateCreate",
    "TemplateUpdate",
    "TemplateListItem",
    "TemplateDetail",
    "TemplateSearchParams",
    "CarouselItemBase",
    "CarouselItemCreate",
    "CarouselItemResponse",
    # 一對一訊息記錄
    "MessageRecordBase",
    "MessageRecordCreate",
    "MessageRecordUpdate",
    "MessageRecordListItem",
    "MessageRecordDetail",
    # 消費紀錄
    "ConsumptionRecordBase",
    "ConsumptionRecordCreate",
    "ConsumptionRecordUpdate",
    "ConsumptionRecordListItem",
    "ConsumptionRecordDetail",
    # PMS 系統整合
    "PMSIntegrationBase",
    "PMSIntegrationCreate",
    "PMSIntegrationUpdate",
    "PMSIntegrationListItem",
    "PMSIntegrationDetail",
    "PMSMatchRequest",
    "PMSSearchParams",
    # 標籤
    "TagBase",
    "MemberTagCreate",
    "MemberTagUpdate",
    "InteractionTagCreate",
    "InteractionTagUpdate",
    "TagListItem",
    "TagDetail",
    "TagSearchParams",
    "TagNameValidator",
]
