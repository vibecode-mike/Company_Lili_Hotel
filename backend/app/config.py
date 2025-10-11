"""
配置管理模組
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """應用配置"""

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

    # CORS
    ALLOWED_ORIGINS: str = "*"

    @property
    def allowed_origins_list(self) -> List[str]:
        """解析允許的來源為列表"""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


# 創建全域設定實例
settings = Settings()
