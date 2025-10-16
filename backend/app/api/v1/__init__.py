"""
API v1 路由
"""
from fastapi import APIRouter
from app.api.v1 import auth, members, campaigns, surveys, tags

api_router = APIRouter()

# 註冊路由
api_router.include_router(auth.router, prefix="/auth", tags=["認證授權"])
api_router.include_router(members.router, prefix="/members", tags=["會員管理"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["活動推播"])
api_router.include_router(surveys.router, prefix="/surveys", tags=["問卷管理"])
api_router.include_router(tags.router, prefix="/tags", tags=["標籤管理"])
