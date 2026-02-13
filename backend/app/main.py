"""
FastAPI 應用入口
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.config import settings
from app.database import close_db
from app.api.v1 import api_router
from app.core.exceptions import AppException
from app.services.scheduler import scheduler
from datetime import datetime
import logging

# 配置日誌
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# 創建 FastAPI 應用
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url=f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
    redoc_url=f"{settings.API_V1_STR}/redoc" if settings.DEBUG else None,
)

# CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# 安全標頭中間件
app.add_middleware(SecurityHeadersMiddleware)


# 應用啟動事件
@app.on_event("startup")
async def startup_event():
    """應用啟動時執行"""
    logger.info("🚀 Starting application...")

    # 記錄安全配置
    security_logger = logging.getLogger("security")
    security_logger.info("=== Security Configuration ===")
    security_logger.info(f"Environment: {settings.ENVIRONMENT}")
    security_logger.info(f"DEBUG mode: {settings.DEBUG}")
    security_logger.info(f"CORS origins: {settings.allowed_origins_list}")
    security_logger.info(f"API docs enabled: {settings.DEBUG}")

    # 安全警告
    if settings.DEBUG:
        security_logger.warning("WARNING: Running in DEBUG mode - not suitable for production!")
    if settings.ALLOWED_ORIGINS == "*":
        security_logger.warning("WARNING: CORS allows all origins!")
    if "change" in settings.SECRET_KEY.lower() or len(settings.SECRET_KEY) < 32:
        security_logger.warning("WARNING: SECRET_KEY appears to be a development placeholder!")

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
            "timestamp": datetime.utcnow().isoformat(),
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
            "timestamp": datetime.utcnow().isoformat(),
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
            "timestamp": datetime.utcnow().isoformat(),
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

# 掛載靜態文件目錄（上傳的圖片）
UPLOAD_DIR = settings.upload_dir_path
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )
