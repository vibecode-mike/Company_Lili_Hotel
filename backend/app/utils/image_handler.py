"""
圖片處理工具模組

統一處理圖片上傳、Base64 轉換、URL 生成等功能
整合 line_app 和 backend 的圖片處理邏輯
"""
import os
import re
import base64
import hashlib
import logging
from pathlib import Path
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# 正則表達式用於解析 Data URI 格式的 Base64 圖片
_data_uri_re = re.compile(r"^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$")

# 上傳目錄配置
UPLOAD_DIR = Path("/data2/lili_hotel/backend/public/uploads")

# 公開訪問 URL 基礎路徑 - 從 Settings 導入
from app.config import settings
PUBLIC_BASE = settings.PUBLIC_BASE

# 路由前綴
ASSET_ROUTE_PREFIX = "/uploads"

# 允許的圖片格式
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def ensure_upload_dir() -> None:
    """
    確保上傳目錄存在

    在每次上傳前調用，確保目錄創建成功
    """
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        logger.debug(f"📁 Upload directory ready: {UPLOAD_DIR}")
    except Exception as e:
        logger.error(f"❌ Failed to create upload directory: {e}")
        raise


# 初始化時創建上傳目錄
ensure_upload_dir()


def get_file_hash(content: bytes) -> str:
    """
    計算文件內容的 SHA256 hash

    Args:
        content: 文件的二進制內容

    Returns:
        str: Hash 值（截取前 24 個字符）
    """
    return hashlib.sha256(content).hexdigest()[:24]


def save_base64_image(base64_str: str) -> Tuple[str, str]:
    """
    將 Base64 編碼的圖片保存為文件

    支持兩種格式：
    1. Data URI 格式: data:image/png;base64,iVBORw0KG...
    2. 純 Base64 字符串: iVBORw0KG...

    使用 SHA256 hash 作為文件名，自動去重（相同內容的圖片只保存一次）

    Args:
        base64_str: Base64 編碼的圖片字符串

    Returns:
        Tuple[str, str]: (public_url, relative_path)
            - public_url: 完整的公開訪問 URL
            - relative_path: 相對路徑（用於資料庫存儲）

    Raises:
        ValueError: Base64 解碼失敗時拋出
    """
    # 解析 Data URI 格式（如果有的話）
    m = _data_uri_re.match(base64_str.strip())
    if m:
        mime, b64 = m.group(1), m.group(2)
        # MIME 類型到文件副檔名的映射
        exts = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/gif": "gif"
        }
        ext = exts.get(mime, "png")
    else:
        # 純 Base64 字符串，默認為 PNG
        b64 = base64_str.strip()
        ext = "png"

    # 解碼 Base64
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        # 如果解碼失敗，嘗試添加 padding 後再解碼
        try:
            raw = base64.b64decode(b64 + "===")
        except Exception as e:
            raise ValueError(f"Base64 解碼失敗: {str(e)}")

    # 計算文件 hash（24 個字符）
    h = get_file_hash(raw)

    # 生成相對路徑和絕對路徑
    rel = f"{ASSET_ROUTE_PREFIX}/{h}.{ext}"
    abs_path = UPLOAD_DIR / f"{h}.{ext}"

    # 保存文件（如果不存在）
    if not abs_path.exists():
        with open(abs_path, "wb") as f:
            f.write(raw)

    # 生成公開訪問 URL
    public_url = f"{PUBLIC_BASE}{rel}"

    return public_url, rel


def image_url_from_item(item: dict) -> Optional[str]:
    """
    從項目字典中提取或生成圖片 URL

    處理四種情況：
    1. 如果有 image_url（完整網址），直接使用
    2. 如果有 image_base64，轉換為文件並返回 URL
    3. 如果有 image_path 且是完整 URL，直接返回
    4. 如果有 image_path 但是相對路徑，拼接 PUBLIC_BASE

    Args:
        item: 包含圖片信息的字典，可能有以下鍵：
            - image_url:  完整圖片 URL
            - image_base64: Base64 編碼的圖片
            - image_path: 圖片路徑（相對路徑或完整 URL）

    Returns:
        Optional[str]: 圖片的公開訪問 URL，如果沒有圖片則返回 None

    Example:
        >>> item = {"image_base64": "data:image/png;base64,iVBORw0..."}
        >>> url = image_url_from_item(item)
        >>> print(url)
        http://localhost:8700/uploads/abc123def456.png

        >>> item = {"image_url": "https://example.com/image.jpg"}
        >>> url = image_url_from_item(item)
        >>> print(url)
        https://example.com/image.jpg

        >>> item = {"image_path": "/uploads/abc123.jpg"}
        >>> url = image_url_from_item(item)
        >>> print(url)
        http://localhost:8700/uploads/abc123.jpg
    """
    # 直接使用已存在的完整 URL
    if item.get("image_url"):
        return item["image_url"]

    # 優先處理 Base64 圖片
    if item.get("image_base64"):
        url, _ = save_base64_image(item["image_base64"])
        return url

    # 處理圖片路徑
    path = item.get("image_path")
    if not path:
        return None

    # 如果已經是完整 URL，直接返回
    if path.startswith("http"):
        return path

    # 相對路徑，拼接 PUBLIC_BASE
    return f"{PUBLIC_BASE}{path}"


def get_public_url(filename: str) -> str:
    """
    獲取文件的公開訪問 URL

    Args:
        filename: 文件名（不包含路徑）

    Returns:
        str: 完整的公開訪問 URL

    Example:
        >>> url = get_public_url("abc123.jpg")
        >>> print(url)
        http://localhost:8700/uploads/abc123.jpg
    """
    return f"{PUBLIC_BASE}{ASSET_ROUTE_PREFIX}/{filename}"


def validate_image_file(filename: str, content: bytes) -> Tuple[bool, Optional[str]]:
    """
    驗證圖片文件

    Args:
        filename: 文件名
        content: 文件內容

    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
            - is_valid: 是否有效
            - error_message: 錯誤訊息（如果有效則為 None）
    """
    # 驗證文件類型
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"不支援的圖片格式。允許的格式: {', '.join(ALLOWED_EXTENSIONS)}"

    # 驗證文件大小
    if len(content) > MAX_FILE_SIZE:
        return False, f"文件過大。最大允許 {MAX_FILE_SIZE // (1024 * 1024)}MB"

    return True, None


# ============================================================
# 以下為向後兼容的舊函數（用於 linebot_service.py 等模組）
# ============================================================

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


def file_path_to_base64(file_path: str) -> Optional[str]:
    """
    將檔案路徑或 URL 轉為 Base64 編碼

    支援兩種輸入格式：
    1. HTTP/HTTPS URL: 下載圖片並轉換
    2. 本地檔案路徑: 讀取本地文件並轉換

    Args:
        file_path: 檔案路徑或 URL (例如: /uploads/abc123.jpg 或 https://example.com/image.jpg)

    Returns:
        str: Base64 編碼的圖片 (data URI format)
        None: 如果檔案不存在或讀取失敗
    """
    try:
        # 檢測是否為 HTTP/HTTPS URL
        if file_path.startswith(("http://", "https://")):
            logger.info(f"🌐 Detected URL, downloading: {file_path}")
            return url_to_base64(file_path)

        # 處理本地檔案路徑
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
