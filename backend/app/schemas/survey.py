"""
問卷相關 Schema
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.survey import SurveyStatus, QuestionType, TargetAudience, ScheduleType


# ============ Survey Template Schemas ============
class SurveyTemplateBase(BaseModel):
    """問卷範本基礎模型"""

    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    category: str
    default_questions: Optional[List[Dict[str, Any]]] = None
    is_active: bool = True


class SurveyTemplateCreate(SurveyTemplateBase):
    """創建問卷範本"""

    pass


class SurveyTemplateUpdate(SurveyTemplateBase):
    """更新問卷範本"""

    pass


class SurveyTemplateResponse(SurveyTemplateBase):
    """問卷範本響應"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Survey Question Schemas ============
class SurveyQuestionBase(BaseModel):
    """問卷題目基礎模型"""

    question_type: QuestionType
    question_text: str
    font_size: Optional[int] = None
    description: Optional[str] = None
    options: Optional[List[Dict[str, str]]] = None
    is_required: bool = False
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    min_value: Optional[int] = None
    max_value: Optional[int] = None
    order: int
    video_description: Optional[str] = None
    video_link: Optional[str] = None
    image_description: Optional[str] = None
    image_link: Optional[str] = None  # 編輯階段使用（方便預覽）
    image_base64: Optional[str] = None  # 發送給用戶時使用


class SurveyQuestionCreate(SurveyQuestionBase):
    """創建問卷題目"""

    pass


class SurveyQuestionUpdate(SurveyQuestionBase):
    """更新問卷題目"""

    pass


class SurveyQuestionResponse(SurveyQuestionBase):
    """問卷題目響應"""

    id: int

    class Config:
        from_attributes = True


# ============ Survey Schemas ============
class SurveyBase(BaseModel):
    """問卷基礎模型"""

    name: str
    template_id: int
    description: Optional[str] = None
    target_audience: TargetAudience = TargetAudience.ALL
    target_tags: Optional[List[str]] = None
    schedule_type: ScheduleType = ScheduleType.IMMEDIATE
    scheduled_at: Optional[datetime] = None


class SurveyCreate(SurveyBase):
    """創建問卷"""

    questions: List[SurveyQuestionCreate]


class SurveyUpdate(BaseModel):
    """更新問卷"""

    name: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[TargetAudience] = None
    target_tags: Optional[List[str]] = None
    schedule_type: Optional[ScheduleType] = None
    scheduled_at: Optional[datetime] = None
    questions: Optional[List[SurveyQuestionCreate]] = None


class SurveyListItem(BaseModel):
    """問卷列表項"""

    id: int
    name: str
    template_id: int
    template: Optional[SurveyTemplateResponse] = None
    description: Optional[str] = None
    target_audience: TargetAudience
    schedule_type: ScheduleType
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    status: SurveyStatus
    response_count: int
    view_count: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    questions: Optional[List[SurveyQuestionResponse]] = None

    class Config:
        from_attributes = True


class SurveyResponse(SurveyListItem):
    """問卷響應"""

    target_tags: Optional[List[str]] = None
    questions: Optional[List[SurveyQuestionResponse]] = None


# ============ Survey Response Schemas ============
class SurveyResponseAnswerBase(BaseModel):
    """問卷回應基礎模型"""

    survey_id: int
    member_id: int
    answers: Dict[str, Any]
    is_completed: bool = False
    source: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class SurveyResponseAnswerCreate(SurveyResponseAnswerBase):
    """創建問卷回應"""

    pass


class SurveyResponseAnswerUpdate(BaseModel):
    """更新問卷回應"""

    answers: Optional[Dict[str, Any]] = None
    is_completed: Optional[bool] = None


class SurveyResponseAnswerResponse(SurveyResponseAnswerBase):
    """問卷回應響應"""

    id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Survey Statistics Schemas ============
class QuestionStatistics(BaseModel):
    """題目統計"""

    question_id: int
    question_text: str
    responses: Dict[str, int]


class SurveyStatistics(BaseModel):
    """問卷統計"""

    total_responses: int
    total_views: int
    completion_rate: float
    average_time: float
    question_stats: List[QuestionStatistics]


# ============ Common Schemas ============
class SurveySearchParams(BaseModel):
    """問卷搜索參數"""

    status: Optional[SurveyStatus] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 20
