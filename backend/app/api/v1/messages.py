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
from app.api.v1.auth import get_current_user
from app.models.user import User

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
    channel_id: Optional[str] = Query(None, description="LINE 频道 ID（多租户支持）"),
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
            channel_id
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
    current_user: User = Depends(get_current_user),
):
    """
    创建群发消息

    Request Body:
        - draft_id: 来源草稿 ID（可选，有值时复制草稿发布，原草稿保留）
        - flex_message_json: 前端生成的 Flex Message JSON（必填）
        - target_type: 发送对象类型 ("all_friends" | "filtered")
        - target_filter: 筛选条件（可选）
        - schedule_type: 发送方式 ("immediate" | "scheduled" | "draft")
        - scheduled_at: 排程时间（可选）
        - ...其他字段

    行为说明:
        - 无 draft_id: 直接创建新消息
        - 有 draft_id: 复制草稿内容到新记录，原草稿保留在草稿列表中

    Returns:
        创建的消息对象详情
    """
    try:
        # 根據平台驗證必填欄位
        platform = getattr(data, 'platform', None) or "LINE"
        if platform == "Facebook":
            if not data.fb_message_json:
                raise ValueError("fb_message_json 是 Facebook 平台的必填字段")
        else:
            # LINE 或其他平台
            if not data.flex_message_json:
                raise ValueError("flex_message_json 是必填字段")

        channel_id = getattr(data, 'channel_id', None)
        if data.draft_id:
            logger.info(f"📤 从草稿发布: draft_id={data.draft_id}, schedule_type={data.schedule_type}, platform={platform}, channel_id={channel_id}")
        else:
            logger.info(f"📤 创建群发消息: schedule_type={data.schedule_type}, platform={platform}, channel_id={channel_id}")

        message = await message_service.create_message(
            db=db,
            flex_message_json=data.flex_message_json,
            target_type=data.target_type,
            schedule_type=data.schedule_type,
            template_name=None,  # 由 service 自动生成模板名称
            target_filter=data.target_filter,
            scheduled_at=data.scheduled_at,
            campaign_id=data.campaign_id,
            notification_message=data.notification_message,
            thumbnail=data.thumbnail,
            interaction_tags=data.interaction_tags,
            message_title=data.message_title,
            draft_id=data.draft_id,  # 来源草稿 ID
            platform=platform,  # 發送平台
            channel_id=getattr(data, 'channel_id', None),  # 渠道 ID（LINE channel_id 或 FB page_id）
            fb_message_json=getattr(data, 'fb_message_json', None),  # Facebook JSON
            estimated_send_count=data.estimated_send_count,  # 預計發送人數（FB 渠道由前端傳入）
            created_by=current_user.id,  # 發送人員（當前登入者）
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
        logger.info(f"📝 更新数据: channel_id={update_data.get('channel_id')}, platform={update_data.get('platform')}")

        message = await message_service.update_message(
            db,
            message_id,
            **update_data
        )

        logger.info(f"✅ 消息更新成功: ID={message_id}, channel_id={message.channel_id}")

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

        channel_id = request.channel_id if request else None
        jwt_token = request.jwt_token if request else None
        page_id = request.page_id if request else None

        result = await message_service.send_message(
            db,
            message_id,
            channel_id,
            jwt_token,
            page_id
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


@router.get("/fb/{fb_message_id}")
async def get_fb_message_detail(
    fb_message_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    獲取 FB 訊息詳情（從外部 API）

    Args:
        fb_message_id: 外部 FB 群發訊息 ID

    Returns:
        FB 訊息詳情，包含反向轉換後的 flex_message_json
    """
    try:
        from app.clients.fb_message_client import FbMessageClient
        from app.config import settings

        logger.info(f"📖 獲取 FB 訊息詳情: ID={fb_message_id}")

        fb_client = FbMessageClient()

        # 1. 登入取得 JWT
        login_result = await fb_client.firm_login(
            account=settings.FB_FIRM_ACCOUNT,
            password=settings.FB_FIRM_PASSWORD
        )
        if not login_result.get("ok"):
            logger.error(f"❌ FB 登入失敗: {login_result}")
            raise HTTPException(status_code=401, detail="FB 登入失敗")

        jwt_token = login_result["access_token"]

        # 2. 取得訊息列表以獲取基本資訊
        list_result = await fb_client.get_broadcast_list(jwt_token)
        fb_message = None
        if list_result.get("ok"):
            for msg in list_result.get("data", []):
                if msg.get("id") == fb_message_id:
                    fb_message = msg
                    break

        if not fb_message:
            logger.warning(f"⚠️ FB 訊息不存在: ID={fb_message_id}")
            raise HTTPException(status_code=404, detail=f"FB 訊息不存在: ID={fb_message_id}")

        # 3. 取得卡片詳情
        detail_result = await fb_client.get_broadcast_detail(fb_message_id, jwt_token)

        flex_message_json = None
        if detail_result.get("ok"):
            fb_cards = detail_result.get("data", [])
            # 反向轉換為 Flex Message 格式
            flex_message_json = message_service._transform_fb_detail_to_flex_message(fb_cards)
            logger.info(f"✅ FB 卡片轉換成功: {len(fb_cards)} 張卡片")

        # 4. 處理時間戳（從 Unix timestamp 轉換）
        create_time = fb_message.get("create_time")
        send_time = None
        if create_time:
            try:
                from datetime import datetime
                send_time = datetime.fromtimestamp(create_time).isoformat()
            except (ValueError, TypeError):
                send_time = None

        # 5. 組裝返回資料
        result = {
            "id": f"fb-{fb_message_id}",
            "message_title": fb_message.get("title", "未命名訊息"),
            "notification_message": None,
            "thumbnail": None,
            "template": {
                "id": 0,
                "template_type": "FlexMessage",
                "name": fb_message.get("title", "FB 訊息"),
            },
            "platform": "Facebook",
            "channel_id": fb_message.get("page_id"),
            "channel_name": fb_message.get("channel_name"),
            "send_status": "已發送",
            "send_count": fb_message.get("amount", 0),
            "open_count": 0,
            "click_count": fb_message.get("click_amount", 0),
            "send_time": send_time,
            "created_at": send_time,
            "updated_at": None,
            "interaction_tags": [k.get("name") for k in fb_message.get("keywords", []) if k.get("name")],
            "flex_message_json": flex_message_json,
            "fb_message_json": None,
            "target_type": "all_friends",
            "target_filter": None,
            "template_id": 0,
            "trigger_condition": None,
            "failure_reason": None,
            "campaign_id": None,
            "created_by": None,
            "estimated_send_count": fb_message.get("amount", 0),
            "available_quota": 0,
            "scheduled_at": None,
            "source_draft_id": None,
            "open_rate": None,
            "click_rate": None,
        }

        logger.info(f"✅ FB 訊息詳情獲取成功: ID={fb_message_id}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 獲取 FB 訊息詳情失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"獲取 FB 訊息詳情失敗: {str(e)}")


@router.get("/{message_id}", response_model=MessageDetail)
async def get_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    获取消息详情

    Returns:
        消息对象详情，包括关联的模板信息和点击次数
    """
    try:
        logger.info(f"📖 获取消息详情: ID={message_id}")

        message = await message_service.get_message(db, message_id)

        if not message:
            raise HTTPException(status_code=404, detail=f"消息不存在: ID={message_id}")

        # 获取点击次数
        click_count = await message_service.get_message_click_count(db, message_id)

        # 将 Message 对象转换为字典，添加 click_count 和 flex_message_json
        # 处理可能为 None 的字段，使用默认值
        message_dict = {
            "id": message.id,
            "message_title": message.message_title,
            "notification_message": message.notification_message,
            "thumbnail": message.thumbnail,
            "template": {
                "id": message.template.id,
                "template_type": message.template.template_type,
                "name": message.template.name,
            },
            "send_status": message.send_status,
            "interaction_tags": message.interaction_tags or [],
            "platform": message.platform or "LINE",
            "channel_id": message.channel_id,  # 渠道ID（LINE channel_id 或 FB page_id）
            "send_count": message.send_count or 0,
            "open_count": message.open_count or 0,
            "open_rate": None,
            "click_rate": None,
            "scheduled_at": message.scheduled_datetime_utc,
            "send_time": message.send_time,
            "source_draft_id": message.source_draft_id,  # 来源草稿 ID
            "created_at": message.created_at,
            "updated_at": message.updated_at,
            "template_id": message.template_id,
            "target_type": message.target_type,
            "target_filter": message.target_filter,
            "trigger_condition": message.trigger_condition,
            "failure_reason": message.failure_reason,
            "campaign_id": message.campaign_id,
            "created_by": None,  # TODO: implement user relationship
            "estimated_send_count": message.estimated_send_count or 0,
            "available_quota": message.available_quota or 0,
            "click_count": click_count,
            "flex_message_json": message.flex_message_json,
            "fb_message_json": message.fb_message_json,
        }

        logger.info(f"✅ 消息详情获取成功: ID={message_id}, 点击次数={click_count}")

        return message_dict

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 获取消息详情失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取消息详情失败: {str(e)}")


@router.delete("/{message_id}", response_model=SuccessResponse)
async def delete_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    刪除群發消息（僅限草稿和已排程狀態）

    只有狀態為「草稿」或「已排程」的消息才能刪除
    已發送、發送中或失敗的消息不能刪除

    Returns:
        SuccessResponse: 刪除成功確認
    """
    try:
        logger.info(f"🗑️ 刪除消息請求: ID={message_id}")

        await message_service.delete_message(db, message_id)

        logger.info(f"✅ 消息刪除成功: ID={message_id}")

        return SuccessResponse(
            data={"message": "訊息已刪除", "deleted_id": message_id}
        )

    except ValueError as e:
        logger.warning(f"⚠️ 刪除消息失敗: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ 刪除消息失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"刪除消息失敗: {str(e)}")
