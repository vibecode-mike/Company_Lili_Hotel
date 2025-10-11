"""
FastAPI 應用入口
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import init_db, close_db
from app.api.v1 import api_router
from app.core.exceptions import AppException
from datetime import datetime
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
    logger.info("Starting application...")
    # 初始化資料庫（可選，如果需要自動創建表）
    # await init_db()
    logger.info("Application started successfully")


# 應用關閉事件
@app.on_event("shutdown")
async def shutdown_event():
    """應用關閉時執行"""
    logger.info("Shutting down application...")
    await close_db()
    logger.info("Application shut down successfully")


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )
