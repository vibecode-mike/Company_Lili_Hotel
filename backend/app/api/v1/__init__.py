"""
API v1 路由

v0.2 資料庫重構後的路由說明：
=============================
- /campaigns：群發訊息（向後兼容，實際操作 messages 表）
- /campaigns_new：活動管理（新功能，操作 campaigns 表）
- /pms_integrations：PMS 系統整合
- /consumption_records：消費紀錄
"""
from fastapi import APIRouter
from app.api.v1 import (
    auth,
    members,
    campaigns,
    campaigns_new,
    surveys,
    tags,
    upload,
    tracking,
    auto_responses,
    pms_integrations,
    consumption_records,
)

api_router = APIRouter()

# 註冊路由
api_router.include_router(auth.router, prefix="/auth", tags=["認證授權"])
api_router.include_router(members.router, prefix="/members", tags=["會員管理"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["群發訊息（舊）"])
api_router.include_router(campaigns_new.router, prefix="/campaigns_new", tags=["活動管理（新）"])
api_router.include_router(surveys.router, prefix="/surveys", tags=["問卷管理"])
api_router.include_router(tags.router, prefix="/tags", tags=["標籤管理"])
api_router.include_router(upload.router, prefix="/upload", tags=["文件上傳"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["追蹤統計"])
api_router.include_router(auto_responses.router, prefix="/auto_responses", tags=["自動回應"])
api_router.include_router(pms_integrations.router, prefix="/pms_integrations", tags=["PMS 系統整合"])
api_router.include_router(consumption_records.router, prefix="/consumption_records", tags=["消費紀錄"])
