"""
API v1 路由 - v0.2 統一新架構

路由說明：
=============================
- /messages：群發訊息（操作 messages 表）
- /campaigns：活動管理（操作 campaigns 表）
- /pms_integrations：PMS 系統整合
- /consumption_records：消費紀錄
- /chat-messages：聊天紀錄（操作 conversation_messages 表）
"""
from fastapi import APIRouter
from app.api.v1 import (
    auth,
    members,
    campaigns,
    surveys,
    tags,
    upload,
    tracking,
    auto_responses,
    pms_integrations,
    consumption_records,
    messages,
    templates,
    chat_messages,
    line_channels,
    websocket,
    line_notify,
)

api_router = APIRouter()

# 註冊路由
api_router.include_router(auth.router, prefix="/auth", tags=["認證授權"])
api_router.include_router(members.router, prefix="/members", tags=["會員管理"])
api_router.include_router(messages.router, prefix="/messages", tags=["群發訊息"])
api_router.include_router(templates.router, prefix="/templates", tags=["模板庫"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["活動管理"])
api_router.include_router(surveys.router, prefix="/surveys", tags=["問卷管理"])
api_router.include_router(tags.router, prefix="/tags", tags=["標籤管理"])
api_router.include_router(upload.router, prefix="/upload", tags=["文件上傳"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["追蹤統計"])
api_router.include_router(auto_responses.router, prefix="/auto_responses", tags=["自動回應"])
api_router.include_router(pms_integrations.router, prefix="/pms_integrations", tags=["PMS 系統整合"])
api_router.include_router(consumption_records.router, prefix="/consumption_records", tags=["消費紀錄"])
api_router.include_router(chat_messages.router, prefix="", tags=["聊天紀錄"])
api_router.include_router(line_channels.router, prefix="/line_channels", tags=["LINE 頻道設定"])
api_router.include_router(websocket.router, prefix="", tags=["WebSocket 即時通訊"])
api_router.include_router(line_notify.router, prefix="", tags=["LINE 訊息通知"])
