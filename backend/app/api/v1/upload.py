"""
Image Upload API Endpoint
上傳圖片接口
"""
import uuid
from datetime import datetime, timezone
from io import BytesIO
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
from PIL import Image

from app.config import settings

router = APIRouter()

# 配置
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}


def get_file_extension(filename: str) -> str:
    """獲取文件擴展名"""
    return Path(filename).suffix.lower()


def generate_unique_filename(original_filename: str) -> str:
    """生成唯一文件名: timestamp_uuid_original"""
    ext = get_file_extension(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{ext}"




@router.post("", summary="上傳圖片", description="上傳圖片文件，返回圖片URL")
async def upload_image(file: UploadFile = File(...)):
    """
    上傳圖片接口（前端已裁切）

    Args:
        file: 上傳的文件對象（已由前端裁切）

    Returns:
        {
            "code": 200,
            "message": "上傳成功",
            "data": {
                "url": "{PUBLIC_BASE}/uploads/20250128_abc12345.jpg",
                "filename": "20250128_abc12345.jpg",
                "size": 123456
            }
        }
    """
    try:
        # 1. 檢查文件是否存在
        if not file:
            raise HTTPException(status_code=400, detail="未選擇文件")

        # 2. 檢查文件擴展名
        file_ext = get_file_extension(file.filename)
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件格式。允許的格式: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # 3. 讀取文件內容並檢查大小
        contents = await file.read()
        file_size = len(contents)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"文件大小超過限制。最大允許: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )

        if file_size == 0:
            raise HTTPException(status_code=400, detail="文件爲空")

        # 4. 圖片處理
        try:
            # 讀取圖片
            img = Image.open(BytesIO(contents))

            # 確保為 RGB 模式 (處理 RGBA、灰階等)
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # 等比縮放至寬度上限 1200px
            MAX_WIDTH = 1200
            if img.width > MAX_WIDTH:
                ratio = MAX_WIDTH / img.width
                new_height = int(img.height * ratio)
                img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)

            # 保存為 JPEG（前端已裁切，不需要再裁切）
            output = BytesIO()
            img.save(output, format='JPEG', quality=95, optimize=True)
            output.seek(0)
            contents = output.read()
            file_size = len(contents)

        except Exception as e:
            raise HTTPException(status_code=400, detail=f"圖片處理失敗：{str(e)}")

        # 5. 生成唯一文件名 (強制使用 .jpg)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        unique_filename = f"{timestamp}_{unique_id}.jpg"
        file_path = settings.upload_dir_path / unique_filename

        # 6. 確保上傳目錄存在
        settings.upload_dir_path.mkdir(parents=True, exist_ok=True)

        # 7. 保存文件
        with open(file_path, "wb") as f:
            f.write(contents)

        # 8. 生成訪問URL
        file_url = settings.get_public_url(unique_filename)

        # 9. 返回成功響應
        return JSONResponse(
            status_code=200,
            content={
                "code": 200,
                "message": "上傳成功",
                "data": {
                    "url": file_url,
                    "filename": unique_filename,
                    "size": file_size
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上傳失敗：{str(e)}")


@router.delete("/{filename}", summary="刪除圖片", description="刪除已上傳的圖片")
async def delete_image(filename: str):
    """
    刪除圖片接口（可選）

    Args:
        filename: 文件名

    Returns:
        {"code": 200, "message": "刪除成功"}
    """
    try:
        file_path = settings.upload_dir_path / filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="檔案不存在")

        # 刪除文件
        file_path.unlink()

        return JSONResponse(
            status_code=200,
            content={
                "code": 200,
                "message": "刪除成功"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刪除失敗：{str(e)}")
