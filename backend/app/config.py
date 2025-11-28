"""
配置管理模組
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from pathlib import Path
import os


class Settings(BaseSettings):
    """應用配置"""

    model_config = SettingsConfigDict(
        extra="ignore",
        env_file=".env",
        case_sensitive=True,
    )

    # 應用基本配置
    PROJECT_NAME: str = "力麗飯店 LineOA CRM"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # 資料庫配置
    DATABASE_URL: str = "mysql+aiomysql://root:l123456@127.0.0.1:3306/lili_hotel"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # 安全配置
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # LINE Messaging API
    LINE_CHANNEL_ACCESS_TOKEN: str
    LINE_CHANNEL_SECRET: str

    # OpenAI 配置
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    # 文件存儲配置
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_IMAGE_TYPES: str = "jpg,jpeg,png,webp"
    PUBLIC_BASE: str = "https://linebot.star-bit.io"  # 公開訪問的基礎URL

    # LINE App 服務 URL
    LINE_APP_URL: str = "http://localhost:3001"

    # CORS
    ALLOWED_ORIGINS: str = "*"

    @property
    def project_root(self) -> Path:
        """專案根目錄"""
        return Path(__file__).resolve().parent.parent.parent

    @property
    def upload_dir_path(self) -> Path:
        """上傳目錄的完整路徑"""
        if os.path.isabs(self.UPLOAD_DIR):
            return Path(self.UPLOAD_DIR)
        return self.project_root / "backend" / "public" / self.UPLOAD_DIR

    @property
    def allowed_origins_list(self) -> List[str]:
        """解析允許的來源為列表"""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


# 創建全域設定實例
settings = Settings()
