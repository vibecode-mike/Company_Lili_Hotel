"""
FastAPI 應用入口
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import httpx
from app.config import settings
from app.database import close_db
from app.api.v1 import api_router
from app.core.exceptions import AppException
from app.services.scheduler import scheduler
from datetime import datetime, timezone
import logging

# 配置日誌
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 創建 FastAPI 應用
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url=f"{settings.API_V1_STR}/docs",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 應用啟動事件
@app.on_event("startup")
async def startup_event():
    """應用啟動時執行"""
    logger.info("🚀 Starting application...")

    # 初始化資料庫（可選，如果需要自動創建表）
    # await init_db()

    # 啟動排程器
    try:
        scheduler.start()
        logger.info("✅ Scheduler started successfully")

        # 從資料庫恢復排程任務
        await scheduler.restore_scheduled_jobs()

        # 顯示已排程的任務
        jobs = scheduler.get_scheduled_jobs()
        if jobs:
            logger.info(f"📅 Found {len(jobs)} scheduled jobs:")
            for job in jobs:
                logger.info(f"  - {job['name']}: {job['next_run_time']}")
        else:
            logger.info("📅 No scheduled jobs found")

    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")

    # 初始化 PMS per-channel 啟用狀態（Phase E-3：所有 channel 一次載入）
    try:
        from sqlalchemy import select

        from app.database import AsyncSessionLocal
        from app.models.chatbot_booking import FaqPmsConnection
        from app.services.chatbot_service import init_pms_from_db_all

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(FaqPmsConnection.channel_id, FaqPmsConnection.status)
            )
            rows = result.fetchall()
            init_pms_from_db_all([(r[0], r[1]) for r in rows])
            enabled_count = sum(1 for r in rows if r[1] == "enabled")
            logger.info(
                f"✅ PMS per-channel status initialized: "
                f"{len(rows)} channels, {enabled_count} enabled"
            )
    except Exception as e:
        logger.error(f"❌ Failed to init PMS status: {e}")

    logger.info("✅ Application started successfully")


# 應用關閉事件
@app.on_event("shutdown")
async def shutdown_event():
    """應用關閉時執行"""
    logger.info("⏹️  Shutting down application...")

    # 關閉排程器
    try:
        scheduler.shutdown()
        logger.info("✅ Scheduler shutdown successfully")
    except Exception as e:
        logger.error(f"❌ Failed to shutdown scheduler: {e}")

    # 關閉資料庫連接
    await close_db()
    logger.info("✅ Application shut down successfully")


# 全域異常處理
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """處理自定義應用異常"""
    return JSONResponse(
        status_code=exc.code,
        content={
            "code": exc.code,
            "message": exc.message,
            "timestamp": datetime.now().isoformat(),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """處理請求驗證異常"""
    errors = []
    for error in exc.errors():
        errors.append(
            {
                "field": ".".join(str(x) for x in error["loc"][1:]),
                "message": error["msg"],
            }
        )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": 422,
            "message": "Invalid request parameters",
            "errors": errors,
            "timestamp": datetime.now().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """處理一般異常"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": "Internal server error",
            "timestamp": datetime.now().isoformat(),
        },
    )


# 健康檢查端點
@app.get("/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


# 註冊 API 路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 點擊追蹤轉發到 line_app（因為外部代理只轉發 /api/ 路徑）
@app.get("/api/v1/track")
async def track_redirect(request: Request):
    """轉發點擊追蹤到 line_app 的 /__track"""
    query_string = str(request.query_params)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"http://localhost:3001/__track?{query_string}",
            follow_redirects=False
        )
    # line_app 的 __track 回傳 302 redirect，直接轉發
    if resp.status_code in (301, 302):
        return RedirectResponse(url=resp.headers.get("location", "/"), status_code=resp.status_code)
    return JSONResponse(content={"ok": True}, status_code=resp.status_code)


# 掛載靜態文件目錄（上傳的圖片）
UPLOAD_DIR = settings.upload_dir_path
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
# 額外掛載一個走 /api/v1/ 路徑的圖片路由，讓外部代理能正確轉發
app.mount("/api/v1/public/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="public_uploads")

# Chatbot widget 靜態檔（供外部網頁嵌入）
from pathlib import Path as _Path
WIDGET_DIR = _Path(__file__).resolve().parent.parent.parent / "widget"
if WIDGET_DIR.is_dir():
    app.mount("/api/v1/widget", StaticFiles(directory=str(WIDGET_DIR)), name="widget")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )
