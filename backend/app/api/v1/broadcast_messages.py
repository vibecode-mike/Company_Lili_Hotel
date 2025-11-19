"""
群发消息 API (Broadcast Messages)
专门用于前后端接通的群发消息功能

主要功能：
1. 配额查询（真实数据）
2. 创建/更新消息
3. 发送消息
4. 获取消息详情
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.database import get_db
from app.schemas.common import SuccessResponse
from app.schemas.message import (
    QuotaStatusRequest,
    QuotaStatusResponse,
    MessageCreate,
    MessageUpdate,
    MessageDetail,
    MessageSendRequest,
    MessageSendResponse,
    MessageSearchParams,
)
from app.services.message_service import MessageService

router = APIRouter()
logger = logging.getLogger(__name__)

# 创建服务实例
message_service = MessageService()


@router.get("", response_model=SuccessResponse)
async def list_messages(
    params: MessageSearchParams = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    取得群發訊息列表
    """
    try:
        data = await message_service.list_messages(
            db=db,
            send_status=params.send_status,
            search=params.search,
            start_date=params.start_date,
            end_date=params.end_date,
            page=params.page,
            page_size=params.page_size,
        )
        return SuccessResponse(data=data)
    except Exception as e:
        logger.error(f"❌ 獲取群發訊息列表失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"獲取群發訊息列表失敗: {str(e)}")


@router.post("/quota", response_model=QuotaStatusResponse)
async def get_quota_status(
    data: QuotaStatusRequest,
    line_channel_id: Optional[str] = Query(None, description="LINE 频道 ID（多租户支持）"),
    db: AsyncSession = Depends(get_db),
):
    """
    获取配额状态（真实数据）

    调用 LINE API 获取实际的配额信息，并计算预计发送人数

    Returns:
        QuotaStatusResponse: {
            estimated_send_count: 预计发送人数,
            available_quota: 可用配额,
            is_sufficient: 配额是否充足,
            quota_type: 配额类型,
            monthly_limit: 月度限额,
            used: 已使用配额
        }
    """
    try:
        logger.info(f"📊 查询配额状态: target_type={data.target_type}")

        result = await message_service.get_quota_status(
            db,
            data.target_type,
            data.target_filter,
            line_channel_id
        )

        logger.info(
            f"✅ 配额查询成功: 预计发送 {result['estimated_send_count']} 人, "
            f"可用配额 {result['available_quota']} 则"
        )

        return QuotaStatusResponse(**result)

    except Exception as e:
        logger.error(f"❌ 配额查询失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"配额查询失败: {str(e)}")


@router.post("", response_model=MessageDetail)
async def create_message(
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    创建群发消息

    Request Body:
        - flex_message_json: 前端生成的 Flex Message JSON（必填）
        - target_type: 发送对象类型 ("all_friends" | "filtered")
        - target_filter: 筛选条件（可选）
        - schedule_type: 发送方式 ("immediate" | "scheduled" | "draft")
        - scheduled_at: 排程时间（可选）
        - ...其他字段

    Returns:
        创建的消息对象详情
    """
    try:
        # 验证 flex_message_json 必填
        if not data.flex_message_json:
            raise ValueError("flex_message_json 是必填字段")

        logger.info(f"📤 创建群发消息: schedule_type={data.schedule_type}")

        message = await message_service.create_message(
            db=db,
            flex_message_json=data.flex_message_json,
            target_type=data.target_type,
            schedule_type=data.schedule_type,
            template_name=None,  # 由 service 自动生成模板名称
            target_filter=data.target_filter,
            scheduled_at=data.scheduled_at,
            campaign_id=data.campaign_id,
            notification_text=data.notification_text,
            thumbnail=data.thumbnail,
        )

        logger.info(f"✅ 消息创建成功: ID={message.id}")

        return message

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ 创建消息失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"创建消息失败: {str(e)}")


@router.put("/{message_id}", response_model=MessageDetail)
async def update_message(
    message_id: int,
    data: MessageUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新消息（草稿编辑）

    只有状态为"草稿"的消息才能更新
    """
    try:
        logger.info(f"📝 更新消息: ID={message_id}")

        # 准备更新数据
        update_data = data.model_dump(exclude_unset=True)

        message = await message_service.update_message(
            db,
            message_id,
            **update_data
        )

        logger.info(f"✅ 消息更新成功: ID={message_id}")

        return message

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ 更新消息失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"更新消息失败: {str(e)}")


@router.post("/{message_id}/send", response_model=MessageSendResponse)
async def send_message(
    message_id: int,
    request: Optional[MessageSendRequest] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    发送群发消息

    实际调用 line_app/app.py 的 push_campaign 函数

    Steps:
    1. 获取消息和模板
    2. 构建 line_app payload
    3. 预检配额
    4. 调用 line_app 发送
    5. 更新消息状态

    Returns:
        MessageSendResponse: {
            message: 提示消息,
            sent_count: 成功发送数量,
            failed_count: 失败数量
        }
    """
    try:
        logger.info(f"📤 发送消息: ID={message_id}")

        line_channel_id = request.line_channel_id if request else None

        result = await message_service.send_message(
            db,
            message_id,
            line_channel_id
        )

        if not result.get("ok"):
            # 发送失败 - 处理 error (单数) 和 errors (复数) 两种情况
            error_detail = result.get('errors') or result.get('error') or '未知错误'
            error_msg = f"发送失败: {error_detail}"
            logger.error(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)

        # 发送成功
        sent_count = result.get("sent", 0)
        failed_count = result.get("failed", 0)

        logger.info(f"✅ 发送完成: 成功 {sent_count}, 失败 {failed_count}")

        return MessageSendResponse(
            message="发送成功",
            sent_count=sent_count,
            failed_count=failed_count,
            errors=result.get("errors")
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 发送消息失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"发送消息失败: {str(e)}")


@router.get("/{message_id}", response_model=MessageDetail)
async def get_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    获取消息详情

    Returns:
        消息对象详情，包括关联的模板信息
    """
    try:
        logger.info(f"📖 获取消息详情: ID={message_id}")

        message = await message_service.get_message(db, message_id)

        if not message:
            raise HTTPException(status_code=404, detail=f"消息不存在: ID={message_id}")

        logger.info(f"✅ 消息详情获取成功: ID={message_id}")

        return message

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 获取消息详情失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取消息详情失败: {str(e)}")
