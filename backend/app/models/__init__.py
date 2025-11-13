"""
資料庫模型模組
"""
from app.models.base import Base
from app.models.user import User
from app.models.member import Member
from app.models.tag import MemberTag, InteractionTag
from app.models.campaign import Message, MessageRecipient
from app.models.new_campaign import Campaign
from app.models.template import MessageTemplate, TemplateCarouselItem
from app.models.auto_response import AutoResponse, AutoResponseKeyword
from app.models.auto_response_message import AutoResponseMessage
from app.models.message_record import MessageRecord
from app.models.member_interaction_record import MemberInteractionRecord
from app.models.consumption_record import ConsumptionRecord
from app.models.pms_integration import PMSIntegration
from app.models.tag_trigger_log import TagTriggerLog
from app.models.tag_rule import TagRule
from app.models.admin import Admin, Role, Permission, AdminRole, RolePermission
from app.models.line_config import LineOAConfig, LoginConfig, LoginSession, SystemAuthorization
from app.models.survey import Survey, SurveyTemplate, SurveyQuestion, SurveyResponse
from app.models.tracking import ComponentInteractionLog, InteractionType, RyanClickDemo

__all__ = [
    "Base",
    "User",
    "Member",
    "MemberTag",
    "InteractionTag",
    "Message",
    "MessageRecipient",
    "MessageRecord",
    "Campaign",
    "MessageTemplate",
    "TemplateCarouselItem",
    "AutoResponse",
    "AutoResponseKeyword",
    "AutoResponseMessage",
    "MemberInteractionRecord",
    "ConsumptionRecord",
    "PMSIntegration",
    "TagTriggerLog",
    "TagRule",
    "Admin",
    "Role",
    "Permission",
    "AdminRole",
    "RolePermission",
    "LineOAConfig",
    "LoginConfig",
    "LoginSession",
    "SystemAuthorization",
    "Survey",
    "SurveyTemplate",
    "SurveyQuestion",
    "SurveyResponse",
    "ComponentInteractionLog",
    "InteractionType",
    "RyanClickDemo",
]
