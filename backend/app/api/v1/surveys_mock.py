"""
問卷管理 API - 模擬數據版本 (暫時解決方案，待磁碟空間釋放後遷移到真實資料庫)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from datetime import datetime
from typing import List, Optional

router = APIRouter()

# 模擬資料
MOCK_TEMPLATES = [
    {
        "id": 1,
        "name": "會員基本資料收集",
        "description": "收集會員基本聯絡資訊與人口統計資料",
        "icon": "📋",
        "category": "member_info",
        "is_active": True,
        "created_at": "2025-01-01T00:00:00",
        "updated_at": "2025-01-01T00:00:00",
    },
    {
        "id": 2,
        "name": "客戶滿意度調查",
        "description": "收集客戶對服務的滿意度回饋",
        "icon": "⭐",
        "category": "satisfaction",
        "is_active": True,
        "created_at": "2025-01-01T00:00:00",
        "updated_at": "2025-01-01T00:00:00",
    },
    {
        "id": 3,
        "name": "活動報名表單",
        "description": "收集活動報名資訊",
        "icon": "🎉",
        "category": "event",
        "is_active": True,
        "created_at": "2025-01-01T00:00:00",
        "updated_at": "2025-01-01T00:00:00",
    },
]

MOCK_SURVEYS = []


# ============ Survey Template Routes ============
@router.get("/templates")
async def get_survey_templates(db: AsyncSession = Depends(get_db)):
    """獲取問卷範本列表 (模擬資料)"""
    return MOCK_TEMPLATES


@router.get("/templates/{template_id}")
async def get_survey_template(template_id: int, db: AsyncSession = Depends(get_db)):
    """獲取單一問卷範本 (模擬資料)"""
    template = next((t for t in MOCK_TEMPLATES if t["id"] == template_id), None)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="問卷範本不存在"
        )
    return template


# ============ Survey Routes ============
@router.get("")
async def get_surveys(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """獲取問卷列表 (模擬資料)"""
    filtered_surveys = MOCK_SURVEYS.copy()

    # 應用狀態篩選
    if status_filter:
        filtered_surveys = [s for s in filtered_surveys if s["status"] == status_filter]

    # 應用搜尋
    if search:
        filtered_surveys = [
            s for s in filtered_surveys if search.lower() in s["name"].lower()
        ]

    return filtered_surveys


@router.get("/{survey_id}")
async def get_survey(survey_id: int, db: AsyncSession = Depends(get_db)):
    """獲取單一問卷 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")
    return survey


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_survey(survey_data: dict, db: AsyncSession = Depends(get_db)):
    """創建問卷 (模擬資料)"""
    new_survey = {
        "id": len(MOCK_SURVEYS) + 1,
        "name": survey_data.get("name", "未命名問卷"),
        "template_id": survey_data.get("template_id"),
        "template": next(
            (
                t
                for t in MOCK_TEMPLATES
                if t["id"] == survey_data.get("template_id")
            ),
            None,
        ),
        "description": survey_data.get("description"),
        "target_audience": survey_data.get("target_audience", "all"),
        "target_tags": survey_data.get("target_tags"),
        "schedule_type": survey_data.get("schedule_type", "immediate"),
        "scheduled_at": survey_data.get("scheduled_at"),
        "status": "draft",
        "response_count": 0,
        "view_count": 0,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "created_by": 1,
        "questions": survey_data.get("questions", []),
    }
    MOCK_SURVEYS.append(new_survey)

    return {
        "id": new_survey["id"],
        "name": new_survey["name"],
        "status": new_survey["status"],
        "message": "問卷創建成功",
    }


@router.put("/{survey_id}")
async def update_survey(
    survey_id: int, survey_data: dict, db: AsyncSession = Depends(get_db)
):
    """更新問卷 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    if survey["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只能編輯草稿狀態的問卷"
        )

    # 更新問卷資料
    survey.update(
        {
            "name": survey_data.get("name", survey["name"]),
            "description": survey_data.get("description", survey["description"]),
            "target_audience": survey_data.get(
                "target_audience", survey["target_audience"]
            ),
            "target_tags": survey_data.get("target_tags", survey["target_tags"]),
            "schedule_type": survey_data.get("schedule_type", survey["schedule_type"]),
            "scheduled_at": survey_data.get("scheduled_at", survey["scheduled_at"]),
            "questions": survey_data.get("questions", survey.get("questions", [])),
            "updated_at": datetime.now().isoformat(),
        }
    )

    return {
        "id": survey["id"],
        "name": survey["name"],
        "status": survey["status"],
        "message": "問卷更新成功",
    }


@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_survey(survey_id: int, db: AsyncSession = Depends(get_db)):
    """刪除問卷 (模擬資料)"""
    global MOCK_SURVEYS
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    MOCK_SURVEYS = [s for s in MOCK_SURVEYS if s["id"] != survey_id]


@router.post("/{survey_id}/publish")
async def publish_survey(survey_id: int, db: AsyncSession = Depends(get_db)):
    """發布問卷 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    if survey["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只能發布草稿狀態的問卷"
        )

    survey["status"] = "published"
    survey["updated_at"] = datetime.now().isoformat()

    return {
        "id": survey["id"],
        "name": survey["name"],
        "status": survey["status"],
        "message": "問卷發布成功",
    }


# ============ Survey Response Routes ============
@router.get("/{survey_id}/responses")
async def get_survey_responses(
    survey_id: int,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """獲取問卷回應列表 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")
    return []


@router.get("/{survey_id}/responses/{response_id}")
async def get_survey_response(
    survey_id: int, response_id: int, db: AsyncSession = Depends(get_db)
):
    """獲取單一問卷回應 (模擬資料)"""
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="回應不存在")


@router.get("/{survey_id}/statistics")
async def get_survey_statistics(survey_id: int, db: AsyncSession = Depends(get_db)):
    """獲取問卷統計 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    return {
        "total_responses": 0,
        "total_views": 0,
        "completion_rate": 0.0,
        "average_time": 0.0,
        "question_stats": [],
    }


# ============ Survey Question Routes ============
@router.post("/{survey_id}/questions")
async def create_question(
    survey_id: int, question_data: dict, db: AsyncSession = Depends(get_db)
):
    """創建問卷題目 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    if survey["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只能編輯草稿狀態的問卷"
        )

    new_question = {
        "id": len(survey.get("questions", [])) + 1,
        **question_data,
    }
    if "questions" not in survey:
        survey["questions"] = []
    survey["questions"].append(new_question)

    return {"id": new_question["id"], "message": "題目創建成功"}


@router.put("/{survey_id}/questions/{question_id}")
async def update_question(
    survey_id: int,
    question_id: int,
    question_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """更新問卷題目 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    if survey["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只能編輯草稿狀態的問卷"
        )

    questions = survey.get("questions", [])
    question = next((q for q in questions if q.get("id") == question_id), None)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="題目不存在")

    question.update(question_data)
    return {"id": question["id"], "message": "題目更新成功"}


@router.delete("/{survey_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    survey_id: int, question_id: int, db: AsyncSession = Depends(get_db)
):
    """刪除問卷題目 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    if survey["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只能編輯草稿狀態的問卷"
        )

    questions = survey.get("questions", [])
    survey["questions"] = [q for q in questions if q.get("id") != question_id]


@router.post("/{survey_id}/questions/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_questions(
    survey_id: int, question_ids: dict, db: AsyncSession = Depends(get_db)
):
    """重新排序問卷題目 (模擬資料)"""
    survey = next((s for s in MOCK_SURVEYS if s["id"] == survey_id), None)
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="問卷不存在")

    if survey["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="只能編輯草稿狀態的問卷"
        )

    # 簡化實現，實際應根據 question_ids 重新排序
    pass
