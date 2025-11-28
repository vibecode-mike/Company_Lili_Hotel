"""
LINE App FastAPI - 主應用入口
異步高性能版本

運行命令：
uvicorn app.main:app --reload --host 0.0.0.0 --port 3002
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 創建 FastAPI 應用
app = FastAPI(
    title="LINE App API",
    description="LINE Bot 異步高性能版本 - FastAPI",
    version="2.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生產環境應該限制具體域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 健康檢查端點
@app.get("/")
async def root():
    """根路徑健康檢查"""
    return {"status": "ok", "message": "LINE App FastAPI is running", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    """健康檢查端點（含資料庫連接檢查）"""
    from app.db_async import check_db_connection

    db_status = "unknown"
    try:
        db_connected = await check_db_connection()
        db_status = "connected" if db_connected else "disconnected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        logger.error(f"Database health check failed: {e}")

    return {
        "status": "healthy",
        "service": "line_app_fastapi",
        "version": "2.0.0",
        "database": db_status
    }

# 註冊路由
from app.routers import (
    test_db, test_line, test_gpt, webhook, broadcast, liff, survey, bot_info,
    chat, usage_monitor, webhook_management, admin
)

app.include_router(test_db.router)
app.include_router(test_line.router)
app.include_router(test_gpt.router)
app.include_router(webhook.router)
app.include_router(broadcast.router)
app.include_router(liff.router)
app.include_router(survey.router)
app.include_router(bot_info.router)
app.include_router(chat.router)
app.include_router(usage_monitor.router)
app.include_router(webhook_management.router)
app.include_router(admin.router)

# 靜態檔案服務
from fastapi.staticfiles import StaticFiles
from app.config import ASSET_LOCAL_DIR

app.mount(
    "/uploads",
    StaticFiles(directory=ASSET_LOCAL_DIR),
    name="uploads"
)
logger.info(f"Static files mounted: /uploads -> {ASSET_LOCAL_DIR}")

# 全局異常處理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# 啟動事件
@app.on_event("startup")
async def startup_event():
    logger.info("LINE App FastAPI starting up...")
    logger.info("API documentation available at /docs and /redoc")

    # 測試資料庫連接
    from app.db_async import check_db_connection
    try:
        db_ok = await check_db_connection()
        if db_ok:
            logger.info("✅ Database connection successful")
        else:
            logger.warning("⚠️ Database connection failed")
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}")

# 關閉事件
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("LINE App FastAPI shutting down...")

    # 關閉 LINE Service
    from app.services.line_service import close_line_service
    try:
        await close_line_service()
        logger.info("✅ LINE Service closed")
    except Exception as e:
        logger.error(f"❌ Error closing LINE Service: {e}")

    # 關閉 GPT Service
    from app.services.gpt_service import close_gpt_service
    try:
        await close_gpt_service()
        logger.info("✅ GPT Service closed")
    except Exception as e:
        logger.error(f"❌ Error closing GPT Service: {e}")

    # 關閉資料庫引擎
    from app.db_async import dispose_engine
    try:
        await dispose_engine()
        logger.info("✅ Database engine disposed")
    except Exception as e:
        logger.error(f"❌ Error disposing database engine: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=3002,
        reload=True,
        log_level="info"
    )
