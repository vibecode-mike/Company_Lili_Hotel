"""
問卷管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.survey import (
    Survey,
    SurveyTemplate,
    SurveyQuestion,
    SurveyResponse as SurveyResponseModel,
    SurveyStatus,
)
from app.schemas.survey import (
    SurveyCreate,
    SurveyUpdate,
    SurveyResponse,
    SurveyListItem,
    SurveyTemplateResponse,
    SurveyQuestionCreate,
    SurveyResponseAnswerCreate,
    SurveyResponseAnswerResponse,
    SurveyStatistics,
)
from app.services.scheduler import scheduler
from app.services.linebot_service import LineBotService
from typing import List, Optional
from datetime import datetime
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

# 初始化服務
linebot_service = LineBotService()


# ============ Survey Template Routes ============
@router.get("/templates", response_model=List[SurveyTemplateResponse])
async def get_survey_templates(
    db: AsyncSession = Depends(get_db),
):
    """獲取問卷範本列表"""
    query = select(SurveyTemplate).where(SurveyTemplate.is_active == True).order_by(
        SurveyTemplate.created_at.desc()
    )
    result = await db.execute(query)
    templates = result.scalars().all()
    return templates


@router.get("/templates/{template_id}", response_model=SurveyTemplateResponse)
async def get_survey_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
):
    """獲取單一問卷範本"""
    query = select(SurveyTemplate).where(SurveyTemplate.id == template_id)
    result = await db.execute(query)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="問卷範本不存在"
        )

    return template


# ============ Survey Routes ============
@router.get("", response_model=List[SurveyListItem])
async def get_surveys(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """獲取問卷列表"""
    query = select(Survey).options(
        selectinload(Survey.template),
        selectinload(Survey.questions)
    )

    # 應用狀態篩選
    if status_filter:
        try:
            survey_status = SurveyStatus(status_filter)
            query = query.where(Survey.status == survey_status)
        except ValueError:
            pass  # 忽略無效的狀態值

    # 應用搜尋
    if search:
        query = query.where(Survey.name.ilike(f"%{search}%"))

    # 排序
    query = query.order_by(Survey.created_at.desc())

    # 分頁
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    surveys = result.scalars().all()

    return surveys


@router.get("/{survey_id}", response_model=SurveyResponse)
async def get_survey(
    survey_id: int,
    db: AsyncSession = Depends(get_db),
):
    """獲取單一問卷"""
    query = (
        select(Survey)
        .options(selectinload(Survey.template), selectinload(Survey.questions))
        .where(Survey.id == survey_id)
    )
    result = await db.execute(query)
    survey = result.scalar_one_or_none()

    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    return survey


@router.post("", status_code=status.HTTP_201_CREATED, response_model=SurveyResponse)
async def create_survey(
    survey_data: SurveyCreate,
    db: AsyncSession = Depends(get_db),
):
    """創建問卷"""
    try:
        # 驗證範本是否存在
        template_query = select(SurveyTemplate).where(
            SurveyTemplate.id == survey_data.template_id
        )
        template_result = await db.execute(template_query)
        template = template_result.scalar_one_or_none()

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="問卷範本不存在"
            )

        # 創建問卷
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
        await db.flush()  # 獲取 survey.id

        # 創建題目
        for question_data in survey_data.questions:
            question = SurveyQuestion(
                survey_id=survey.id,
                question_type=question_data.question_type,
                question_text=question_data.question_text,
                font_size=question_data.font_size,
                description=question_data.description,
                options=question_data.options,
                is_required=question_data.is_required,
                min_length=question_data.min_length,
                max_length=question_data.max_length,
                min_value=question_data.min_value,
                max_value=question_data.max_value,
                order=question_data.order,
                video_description=question_data.video_description,
                video_link=question_data.video_link,
                image_description=question_data.image_description,
                image_link=question_data.image_link,
                image_base64=question_data.image_base64,
            )
            db.add(question)

        await db.commit()

        # 重新查詢以獲取完整的 Survey 對象（包含關聯資料）
        query = (
            select(Survey)
            .options(selectinload(Survey.template), selectinload(Survey.questions))
            .where(Survey.id == survey.id)
        )
        result = await db.execute(query)
        survey = result.scalar_one()

        # 返回完整的 Survey 對象
        return survey

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"創建問卷失敗: {str(e)}",
        )


@router.put("/{survey_id}")
async def update_survey(
    survey_id: int,
    survey_data: SurveyUpdate,
    db: AsyncSession = Depends(get_db),
):
    """更新問卷"""
    try:
        # 獲取問卷
        query = select(Survey).where(Survey.id == survey_id)
        result = await db.execute(query)
        survey = result.scalar_one_or_none()

        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在"
            )

        # 檢查問卷狀態
        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能編輯草稿狀態的問卷",
            )

        # 更新問卷基本資料
        if survey_data.name is not None:
            survey.name = survey_data.name
        if survey_data.description is not None:
            survey.description = survey_data.description
        if survey_data.target_audience is not None:
            survey.target_audience = survey_data.target_audience
        if survey_data.target_tags is not None:
            survey.target_tags = survey_data.target_tags
        if survey_data.schedule_type is not None:
            survey.schedule_type = survey_data.schedule_type
        if survey_data.scheduled_at is not None:
            survey.scheduled_at = survey_data.scheduled_at

        # 更新題目
        if survey_data.questions is not None:
            # 刪除舊題目
            delete_stmt = delete(SurveyQuestion).where(
                SurveyQuestion.survey_id == survey_id
            )
            await db.execute(delete_stmt)

            # 創建新題目
            for question_data in survey_data.questions:
                question = SurveyQuestion(
                    survey_id=survey.id,
                    question_type=question_data.question_type,
                    question_text=question_data.question_text,
                    font_size=question_data.font_size,
                    description=question_data.description,
                    options=question_data.options,
                    is_required=question_data.is_required,
                    min_length=question_data.min_length,
                    max_length=question_data.max_length,
                    min_value=question_data.min_value,
                    max_value=question_data.max_value,
                    order=question_data.order,
                    video_description=question_data.video_description,
                    video_link=question_data.video_link,
                    image_description=question_data.image_description,
                    image_link=question_data.image_link,
                    image_base64=question_data.image_base64,
                )
                db.add(question)

        await db.commit()
        await db.refresh(survey)

        return {
            "id": survey.id,
            "name": survey.name,
            "status": survey.status.value,
            "message": "問卷更新成功",
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新問卷失敗: {str(e)}",
        )


@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_survey(
    survey_id: int,
    db: AsyncSession = Depends(get_db),
):
    """刪除問卷"""
    try:
        # 獲取問卷
        query = select(Survey).where(Survey.id == survey_id)
        result = await db.execute(query)
        survey = result.scalar_one_or_none()

        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在"
            )

        # 刪除問卷
        await db.delete(survey)
        await db.commit()

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"刪除問卷失敗: {str(e)}",
        )


# ============ Survey Response Routes ============
# 注意：問卷不提供主動推播功能，用戶透過 LIFF 連結填寫
# Campaign（群發訊息）才有主動推播功能
@router.post("/{survey_id}/responses", status_code=status.HTTP_201_CREATED)
async def submit_survey_response(
    survey_id: int,
    response_data: SurveyResponseAnswerCreate,
    x_line_user_id: str = None,
    db: AsyncSession = Depends(get_db),
):
    """提交問卷回應（LIFF 表單使用）"""
    try:
        # 驗證問卷是否存在
        survey_query = select(Survey).where(Survey.id == survey_id)
        survey_result = await db.execute(survey_query)
        survey = survey_result.scalar_one_or_none()

        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在"
            )

        # 檢查問卷是否已發布
        if survey.status != SurveyStatus.PUBLISHED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="此問卷尚未發布或已結束",
            )

        # TODO: 根據 LINE User ID 查詢 member_id
        # 目前暫時使用 response_data.member_id
        # 實際應用需要整合 LINE 用戶與會員系統的映射

        # 創建問卷回應
        response = SurveyResponseModel(
            survey_id=survey_id,
            member_id=response_data.member_id,
            answers=response_data.answers,
            is_completed=response_data.is_completed,
            completed_at=datetime.now() if response_data.is_completed else None,
            source=response_data.source or "liff",
            ip_address=response_data.ip_address,
            user_agent=response_data.user_agent,
        )
        db.add(response)

        # 更新問卷統計
        if response_data.is_completed:
            survey.response_count += 1

        await db.commit()
        await db.refresh(response)

        return {
            "id": response.id,
            "message": "問卷提交成功",
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"提交問卷回應失敗: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"提交問卷失敗: {str(e)}",
        )


@router.get("/{survey_id}/responses", response_model=List[SurveyResponseAnswerResponse])
async def get_survey_responses(
    survey_id: int,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """獲取問卷回應列表"""
    # 驗證問卷是否存在
    survey_query = select(Survey).where(Survey.id == survey_id)
    survey_result = await db.execute(survey_query)
    survey = survey_result.scalar_one_or_none()

    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    # 獲取回應
    query = (
        select(SurveyResponseModel)
        .where(SurveyResponseModel.survey_id == survey_id)
        .order_by(SurveyResponseModel.created_at.desc())
    )

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    responses = result.scalars().all()

    return responses


@router.get(
    "/{survey_id}/responses/{response_id}",
    response_model=SurveyResponseAnswerResponse,
)
async def get_survey_response(
    survey_id: int,
    response_id: int,
    db: AsyncSession = Depends(get_db),
):
    """獲取單一問卷回應"""
    query = select(SurveyResponseModel).where(
        SurveyResponseModel.survey_id == survey_id,
        SurveyResponseModel.id == response_id,
    )
    result = await db.execute(query)
    response = result.scalar_one_or_none()

    if not response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="回應不存在")

    return response


@router.get("/{survey_id}/statistics", response_model=SurveyStatistics)
async def get_survey_statistics(
    survey_id: int,
    db: AsyncSession = Depends(get_db),
):
    """獲取問卷統計"""
    # 驗證問卷是否存在
    survey_query = select(Survey).where(Survey.id == survey_id)
    survey_result = await db.execute(survey_query)
    survey = survey_result.scalar_one_or_none()

    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    # 獲取統計資料
    total_responses = survey.response_count
    total_views = survey.view_count
    completion_rate = (
        (total_responses / total_views * 100) if total_views > 0 else 0.0
    )

    # 簡化版統計，實際應用中需要更複雜的計算
    return {
        "total_responses": total_responses,
        "total_views": total_views,
        "completion_rate": completion_rate,
        "average_time": 0.0,  # 需要實現時間追蹤
        "question_stats": [],  # 需要實現題目統計
    }


# ============ Survey Question Routes ============
@router.post("/{survey_id}/questions")
async def create_question(
    survey_id: int,
    question_data: SurveyQuestionCreate,
    db: AsyncSession = Depends(get_db),
):
    """創建問卷題目"""
    try:
        # 驗證問卷是否存在
        survey_query = select(Survey).where(Survey.id == survey_id)
        survey_result = await db.execute(survey_query)
        survey = survey_result.scalar_one_or_none()

        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在"
            )

        # 檢查問卷狀態
        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能編輯草稿狀態的問卷",
            )

        # 創建題目
        question = SurveyQuestion(
            survey_id=survey_id,
            question_type=question_data.question_type,
            question_text=question_data.question_text,
            font_size=question_data.font_size,
            description=question_data.description,
            options=question_data.options,
            is_required=question_data.is_required,
            min_length=question_data.min_length,
            max_length=question_data.max_length,
            min_value=question_data.min_value,
            max_value=question_data.max_value,
            order=question_data.order,
            video_description=question_data.video_description,
            video_link=question_data.video_link,
            image_description=question_data.image_description,
            image_link=question_data.image_link,
            image_base64=question_data.image_base64,
        )
        db.add(question)
        await db.commit()
        await db.refresh(question)

        return {
            "id": question.id,
            "message": "題目創建成功",
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"創建題目失敗: {str(e)}",
        )


@router.put("/{survey_id}/questions/{question_id}")
async def update_question(
    survey_id: int,
    question_id: int,
    question_data: SurveyQuestionCreate,
    db: AsyncSession = Depends(get_db),
):
    """更新問卷題目"""
    try:
        # 獲取題目
        query = select(SurveyQuestion).where(
            SurveyQuestion.id == question_id, SurveyQuestion.survey_id == survey_id
        )
        result = await db.execute(query)
        question = result.scalar_one_or_none()

        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="題目不存在"
            )

        # 檢查問卷狀態
        survey_query = select(Survey).where(Survey.id == survey_id)
        survey_result = await db.execute(survey_query)
        survey = survey_result.scalar_one_or_none()

        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能編輯草稿狀態的問卷",
            )

        # 更新題目
        question.question_type = question_data.question_type
        question.question_text = question_data.question_text
        question.font_size = question_data.font_size
        question.description = question_data.description
        question.options = question_data.options
        question.is_required = question_data.is_required
        question.min_length = question_data.min_length
        question.max_length = question_data.max_length
        question.min_value = question_data.min_value
        question.max_value = question_data.max_value
        question.order = question_data.order
        question.video_description = question_data.video_description
        question.video_link = question_data.video_link
        question.image_description = question_data.image_description
        question.image_link = question_data.image_link
        question.image_base64 = question_data.image_base64

        await db.commit()

        return {
            "id": question.id,
            "message": "題目更新成功",
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新題目失敗: {str(e)}",
        )


@router.delete("/{survey_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    survey_id: int,
    question_id: int,
    db: AsyncSession = Depends(get_db),
):
    """刪除問卷題目"""
    try:
        # 獲取題目
        query = select(SurveyQuestion).where(
            SurveyQuestion.id == question_id, SurveyQuestion.survey_id == survey_id
        )
        result = await db.execute(query)
        question = result.scalar_one_or_none()

        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="題目不存在"
            )

        # 檢查問卷狀態
        survey_query = select(Survey).where(Survey.id == survey_id)
        survey_result = await db.execute(survey_query)
        survey = survey_result.scalar_one_or_none()

        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能編輯草稿狀態的問卷",
            )

        # 刪除題目
        await db.delete(question)
        await db.commit()

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"刪除題目失敗: {str(e)}",
        )


@router.post("/{survey_id}/questions/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_questions(
    survey_id: int,
    question_ids: List[int],
    db: AsyncSession = Depends(get_db),
):
    """重新排序問卷題目"""
    try:
        # 驗證問卷是否存在
        survey_query = select(Survey).where(Survey.id == survey_id)
        survey_result = await db.execute(survey_query)
        survey = survey_result.scalar_one_or_none()

        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在"
            )

        # 檢查問卷狀態
        if survey.status != SurveyStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能編輯草稿狀態的問卷",
            )

        # 更新題目順序
        for index, question_id in enumerate(question_ids):
            query = select(SurveyQuestion).where(
                SurveyQuestion.id == question_id,
                SurveyQuestion.survey_id == survey_id,
            )
            result = await db.execute(query)
            question = result.scalar_one_or_none()

            if question:
                question.order = index + 1

        await db.commit()

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"重新排序失敗: {str(e)}",
        )


@router.get("/{survey_id}/url")
async def get_survey_url(
    survey_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    取得問卷 LIFF 網址

    Args:
        survey_id: 問卷 ID

    Returns:
        Dict: {"url": "LIFF 網址", "survey_id": 問卷ID}
    """
    try:
        # 驗證問卷是否存在
        query = select(Survey).where(Survey.id == survey_id)
        result = await db.execute(query)
        survey = result.scalar_one_or_none()

        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="問卷不存在"
            )

        # 從環境變數讀取 LIFF_ID_OPEN
        liff_id_open = os.getenv("LIFF_ID_OPEN", "2008259921-07X8vMaQ")

        # 產生 LIFF 網址
        liff_url = f"https://liff.line.me/{liff_id_open}?sid={survey_id}"

        logger.info(f"📎 Generated LIFF URL for survey {survey_id}: {liff_url}")

        return {
            "url": liff_url,
            "survey_id": survey_id,
            "survey_name": survey.name,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to generate survey URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"產生網址失敗: {str(e)}",
        )
