"""
问卷管理业务逻辑层
职责：处理问卷相关的业务逻辑，与数据库和外部服务交互
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
import logging

from app.models.survey import (
    Survey,
    SurveyTemplate,
    SurveyQuestion,
    SurveyResponse as SurveyResponseModel,
    SurveyStatus,
    QuestionType,
)
from app.schemas.survey import (
    SurveyCreate,
    SurveyUpdate,
    SurveyQuestionCreate,
    SurveyResponseAnswerCreate,
)
from app.services.scheduler import scheduler

logger = logging.getLogger(__name__)


class SurveyService:
    """问卷服务"""

    # ========== Survey Template Methods ==========

    async def list_templates(
        self,
        db: AsyncSession,
        is_active: bool = True
    ) -> List[SurveyTemplate]:
        """获取问卷范本列表"""
        query = select(SurveyTemplate).where(
            SurveyTemplate.is_active == is_active
        ).order_by(SurveyTemplate.created_at.desc())

        result = await db.execute(query)
        return result.scalars().all()

    async def get_template_by_id(
        self,
        db: AsyncSession,
        template_id: int
    ) -> Optional[SurveyTemplate]:
        """获取单一问卷范本"""
        query = select(SurveyTemplate).where(SurveyTemplate.id == template_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    # ========== Survey CRUD Methods ==========

    async def create_survey(
        self,
        db: AsyncSession,
        survey_data: SurveyCreate
    ) -> Survey:
        """
        创建问卷

        Args:
            db: 数据库 session
            survey_data: 问卷创建数据

        Returns:
            创建的问卷对象
        """
        # 验证范本是否存在
        template = await self.get_template_by_id(db, survey_data.template_id)
        if not template:
            raise ValueError(f"Survey template {survey_data.template_id} not found")

        # 创建问卷
        survey = Survey(
            name=survey_data.name,
            template_id=survey_data.template_id,
            description=survey_data.description,
            target_audience=survey_data.target_audience,
            target_tags=survey_data.target_tags,
            schedule_type=survey_data.schedule_type,
            scheduled_at=survey_data.scheduled_at,
            status=SurveyStatus.DRAFT,
        )
        db.add(survey)
        await db.flush()
        await db.refresh(survey)

        # 创建问卷题目
        if survey_data.questions:
            await self._create_survey_questions(db, survey, survey_data.questions)

        # 如果有排程时间，添加排程任务
        if survey_data.scheduled_at:
            await self._schedule_survey(survey)

        await db.commit()
        logger.info(f"✅ Created survey: {survey.name} (ID: {survey.id})")
        return survey

    async def get_survey_by_id(
        self,
        db: AsyncSession,
        survey_id: int
    ) -> Optional[Survey]:
        """获取单一问卷（包含题目）"""
        query = (
            select(Survey)
            .options(
                selectinload(Survey.template),
                selectinload(Survey.questions)
            )
            .where(Survey.id == survey_id)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def list_surveys(
        self,
        db: AsyncSession,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Survey], int]:
        """
        获取问卷列表

        Args:
            db: 数据库 session
            status_filter: 状态筛选
            search: 搜索关键字
            page: 页码
            limit: 每页数量

        Returns:
            (问卷列表, 总数)
        """
        query = select(Survey).options(
            selectinload(Survey.template),
            selectinload(Survey.questions)
        )

        # 状态筛选
        if status_filter:
            try:
                survey_status = SurveyStatus(status_filter)
                query = query.where(Survey.status == survey_status)
            except ValueError:
                pass

        # 搜索
        if search:
            query = query.where(Survey.name.ilike(f"%{search}%"))

        # 排序
        query = query.order_by(Survey.created_at.desc())

        # 获取总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 分页
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        surveys = result.scalars().all()

        return surveys, total

    async def update_survey(
        self,
        db: AsyncSession,
        survey_id: int,
        survey_data: SurveyUpdate
    ) -> Optional[Survey]:
        """更新问卷（仅草稿可修改）"""
        survey = await self.get_survey_by_id(db, survey_id)
        if not survey:
            return None

        if survey.status != SurveyStatus.DRAFT:
            raise ValueError("Only draft surveys can be updated")

        # 更新基本字段
        for field, value in survey_data.dict(exclude_unset=True).items():
            if field != "questions":
                setattr(survey, field, value)

        # 更新题目（删除旧的，创建新的）
        if survey_data.questions is not None:
            await self._update_survey_questions(db, survey, survey_data.questions)

        await db.commit()
        await db.refresh(survey)

        logger.info(f"✅ Updated survey {survey_id}")
        return survey

    async def delete_survey(
        self,
        db: AsyncSession,
        survey_id: int
    ) -> bool:
        """删除问卷（仅草稿可删除）"""
        survey = await self.get_survey_by_id(db, survey_id)
        if not survey:
            return False

        if survey.status != SurveyStatus.DRAFT:
            raise ValueError("Only draft surveys can be deleted")

        await db.delete(survey)
        await db.commit()

        logger.info(f"✅ Deleted survey {survey_id}")
        return True

    # ========== Survey Send Methods ==========

    async def send_survey(
        self,
        db: AsyncSession,
        survey_id: int
    ) -> Dict[str, Any]:
        """
        立即发送问卷

        Args:
            db: 数据库 session
            survey_id: 问卷 ID

        Returns:
            发送结果
        """
        survey = await self.get_survey_by_id(db, survey_id)
        if not survey:
            raise ValueError(f"Survey {survey_id} not found")

        if survey.status == SurveyStatus.PUBLISHED:
            raise ValueError("Survey already published")

        # 调用 LINE Bot 服务发送
        from app.services.linebot_service import LineBotService
        linebot_service = LineBotService()
        result = await linebot_service.send_survey(survey_id)

        # 更新状态
        survey.status = SurveyStatus.PUBLISHED
        survey.sent_at = datetime.now()
        await db.commit()

        logger.info(f"✅ Survey {survey_id} sent successfully")
        return result

    # ========== Survey Response Methods ==========

    async def submit_response(
        self,
        db: AsyncSession,
        survey_id: int,
        member_id: int,
        answers_data: SurveyResponseAnswerCreate
    ) -> SurveyResponseModel:
        """提交问卷回答"""
        # 检查问卷是否存在
        survey = await self.get_survey_by_id(db, survey_id)
        if not survey:
            raise ValueError(f"Survey {survey_id} not found")

        # 创建回答记录
        response = SurveyResponseModel(
            survey_id=survey_id,
            member_id=member_id,
            answers=answers_data.answers,
            is_completed=True,
            completed_at=datetime.now(),
        )
        db.add(response)

        # 更新问卷统计
        survey.response_count += 1
        await db.commit()

        logger.info(f"✅ Member {member_id} submitted response for survey {survey_id}")
        return response

    async def get_survey_statistics(
        self,
        db: AsyncSession,
        survey_id: int
    ) -> Dict[str, Any]:
        """获取问卷统计数据"""
        survey = await self.get_survey_by_id(db, survey_id)
        if not survey:
            raise ValueError(f"Survey {survey_id} not found")

        # 获取回答统计
        response_query = select(func.count()).where(
            SurveyResponseModel.survey_id == survey_id
        )
        response_result = await db.execute(response_query)
        total_responses = response_result.scalar()

        return {
            "survey_id": survey_id,
            "survey_name": survey.name,
            "total_responses": total_responses,
            "view_count": survey.view_count,
            "completion_rate": (total_responses / survey.view_count * 100) if survey.view_count > 0 else 0,
        }

    # ========== 私有辅助方法 ==========

    async def _create_survey_questions(
        self,
        db: AsyncSession,
        survey: Survey,
        questions_data: List[SurveyQuestionCreate]
    ):
        """创建问卷题目"""
        for idx, question_data in enumerate(questions_data):
            question = SurveyQuestion(
                survey_id=survey.id,
                question_type=QuestionType(question_data.question_type),
                question_text=question_data.question_text,
                font_size=question_data.font_size,
                description=question_data.description,
                options=question_data.options,
                is_required=question_data.is_required,
                min_length=question_data.min_length,
                max_length=question_data.max_length,
                min_value=question_data.min_value,
                max_value=question_data.max_value,
                order=idx,
                video_description=question_data.video_description,
                video_link=question_data.video_link,
                image_description=question_data.image_description,
                image_link=question_data.image_link,
                image_base64=question_data.image_base64,
            )
            db.add(question)

    async def _update_survey_questions(
        self,
        db: AsyncSession,
        survey: Survey,
        questions_data: List[SurveyQuestionCreate]
    ):
        """更新问卷题目（删除旧的，创建新的）"""
        # 删除旧题目
        await db.execute(
            delete(SurveyQuestion).where(SurveyQuestion.survey_id == survey.id)
        )
        # 创建新题目
        await self._create_survey_questions(db, survey, questions_data)

    async def _schedule_survey(self, survey: Survey):
        """排程问卷发送"""
        if survey.scheduled_at:
            success = await scheduler.schedule_survey(
                survey.id,
                survey.scheduled_at
            )
            if success:
                survey.status = SurveyStatus.SCHEDULED
                logger.info(f"📅 Scheduled survey {survey.id} for {survey.scheduled_at}")


# 全局服务实例
survey_service = SurveyService()
