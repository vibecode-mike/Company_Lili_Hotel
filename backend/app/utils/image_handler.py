"""
圖片處理工具模組
處理圖片路徑轉 Base64 編碼
"""
import base64
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


def file_path_to_base64(file_path: str) -> Optional[str]:
    """
    將檔案路徑轉為 Base64 編碼

    Args:
        file_path: 檔案路徑 (例如: /uploads/abc123.jpg)

    Returns:
        str: Base64 編碼的圖片 (data URI format)
        None: 如果檔案不存在或讀取失敗
    """
    try:
        # 處理相對路徑
        if file_path.startswith("/"):
            file_path = file_path.lstrip("/")

        # 構建完整路徑
        full_path = PROJECT_ROOT / "public" / file_path

        if not full_path.exists():
            logger.error(f"❌ File not found: {full_path}")
            return None

        # 讀取檔案並轉為 Base64
        with open(full_path, "rb") as f:
            image_data = f.read()
            base64_str = base64.b64encode(image_data).decode("utf-8")

        # 判斷檔案類型
        suffix = full_path.suffix.lower()
        mime_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        mime_type = mime_types.get(suffix, "image/jpeg")

        # 返回 data URI format
        data_uri = f"data:{mime_type};base64,{base64_str}"
        logger.info(f"✅ Converted {file_path} to base64 ({len(base64_str)} chars)")

        return data_uri

    except Exception as e:
        logger.error(f"❌ Failed to convert {file_path} to base64: {e}")
        return None


def url_to_base64(url: str) -> Optional[str]:
    """
    從 URL 下載圖片並轉為 Base64

    Args:
        url: 圖片 URL

    Returns:
        str: Base64 編碼的圖片
        None: 如果下載失敗
    """
    try:
        import httpx

        response = httpx.get(url, timeout=10)
        response.raise_for_status()

        image_data = response.content
        base64_str = base64.b64encode(image_data).decode("utf-8")

        # 從 Content-Type 取得 MIME type
        content_type = response.headers.get("content-type", "image/jpeg")
        data_uri = f"data:{content_type};base64,{base64_str}"

        logger.info(f"✅ Downloaded and converted {url} to base64")
        return data_uri

    except Exception as e:
        logger.error(f"❌ Failed to download {url}: {e}")
        return None
