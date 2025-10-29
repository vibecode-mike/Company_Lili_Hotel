"""
問卷模型
"""
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    JSON,
    Text,
    Boolean,
)
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


class SurveyStatus(str, enum.Enum):
    """問卷狀態"""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"


class QuestionType(str, enum.Enum):
    """題目類型"""

    NAME = "NAME"
    PHONE = "PHONE"
    EMAIL = "EMAIL"
    BIRTHDAY = "BIRTHDAY"
    ADDRESS = "ADDRESS"
    GENDER = "GENDER"
    ID_NUMBER = "ID_NUMBER"
    LINK = "LINK"
    VIDEO = "VIDEO"
    IMAGE = "IMAGE"


class TargetAudience(str, enum.Enum):
    """目標受眾"""

    ALL = "ALL"
    FILTERED = "FILTERED"


class ScheduleType(str, enum.Enum):
    """排程類型"""

    IMMEDIATE = "IMMEDIATE"
    SCHEDULED = "SCHEDULED"


class SurveyTemplate(Base):
    """問卷範本表"""

    __tablename__ = "survey_templates"

    name = Column(String(100), nullable=False, comment="範本名稱")
    description = Column(Text, comment="範本描述")
    icon = Column(String(50), comment="範本圖標")
    category = Column(String(50), nullable=False, comment="範本類別")
    default_questions = Column(JSON, comment="預設題目")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否啟用")

    # 關聯關係
    surveys = relationship("Survey", back_populates="template")


class Survey(Base):
    """問卷主檔表"""

    __tablename__ = "surveys"

    name = Column(String(200), nullable=False, comment="問卷名稱")
    template_id = Column(
        BigInteger,
        ForeignKey("survey_templates.id", ondelete="RESTRICT"),
        nullable=False,
        comment="範本ID",
    )
    description = Column(Text, comment="問卷描述")
    target_audience = Column(
        SQLEnum(TargetAudience),
        nullable=False,
        default=TargetAudience.ALL,
        comment="目標受眾",
    )
    target_tags = Column(JSON, comment="目標標籤")
    schedule_type = Column(
        SQLEnum(ScheduleType),
        nullable=False,
        default=ScheduleType.IMMEDIATE,
        comment="排程類型",
    )
    scheduled_at = Column(DateTime, comment="排程時間")
    sent_at = Column(DateTime, comment="實際發送時間")
    status = Column(
        SQLEnum(SurveyStatus, native_enum=False, length=20, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=SurveyStatus.DRAFT,
        comment="狀態",
    )
    response_count = Column(Integer, default=0, comment="回應數")
    view_count = Column(Integer, default=0, comment="瀏覽數")
    created_by = Column(BigInteger, ForeignKey("users.id"), comment="創建者ID")

    # 關聯關係
    template = relationship("SurveyTemplate", back_populates="surveys")
    creator = relationship("User")
    questions = relationship(
        "SurveyQuestion", back_populates="survey", cascade="all, delete-orphan", order_by="SurveyQuestion.order"
    )
    responses = relationship(
        "SurveyResponse", back_populates="survey", cascade="all, delete-orphan"
    )


class SurveyQuestion(Base):
    """問卷題目表"""

    __tablename__ = "survey_questions"

    survey_id = Column(
        BigInteger,
        ForeignKey("surveys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="問卷ID",
    )
    question_type = Column(
        SQLEnum(QuestionType), nullable=False, comment="題目類型"
    )
    question_text = Column(Text, nullable=False, comment="題目文字")
    font_size = Column(Integer, comment="字型大小")
    description = Column(Text, comment="題目描述")
    options = Column(JSON, comment="選項")
    is_required = Column(Boolean, default=False, nullable=False, comment="是否必填")
    min_length = Column(Integer, comment="最小長度")
    max_length = Column(Integer, comment="最大長度")
    min_value = Column(Integer, comment="最小值")
    max_value = Column(Integer, comment="最大值")
    order = Column(Integer, nullable=False, comment="題目順序")
    video_description = Column(Text, comment="影片描述")
    video_link = Column(String(500), comment="影片超連結")
    image_description = Column(Text, comment="圖片描述")
    image_link = Column(String(500), comment="圖片連結（編輯使用）")
    image_base64 = Column(Text, comment="圖片Base64（發送使用）")

    # 關聯關係
    survey = relationship("Survey", back_populates="questions")


class SurveyResponse(Base):
    """問卷回應表"""

    __tablename__ = "survey_responses"

    survey_id = Column(
        BigInteger,
        ForeignKey("surveys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="問卷ID",
    )
    member_id = Column(
        BigInteger,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="會員ID",
    )
    answers = Column(JSON, nullable=False, comment="答案")
    is_completed = Column(Boolean, default=False, nullable=False, comment="是否完成")
    completed_at = Column(DateTime, comment="完成時間")
    source = Column(String(50), comment="來源")
    ip_address = Column(String(50), comment="IP地址")
    user_agent = Column(String(500), comment="用戶代理")

    # 關聯關係
    survey = relationship("Survey", back_populates="responses")
    member = relationship("Member")
