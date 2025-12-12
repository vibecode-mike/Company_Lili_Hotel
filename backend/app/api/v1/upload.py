"""
Image Upload API Endpoint
上传图片接口
"""
import uuid
from datetime import datetime
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
    """获取文件扩展名"""
    return Path(filename).suffix.lower()


def generate_unique_filename(original_filename: str) -> str:
    """生成唯一文件名: timestamp_uuid_original"""
    ext = get_file_extension(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{ext}"




@router.post("", summary="上传图片", description="上传图片文件，返回图片URL")
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片接口（前端已裁切）

    Args:
        file: 上传的文件对象（已由前端裁切）

    Returns:
        {
            "code": 200,
            "message": "上传成功",
            "data": {
                "url": "https://linebot.star-bit.io/uploads/20250128_abc12345.jpg",
                "filename": "20250128_abc12345.jpg",
                "size": 123456
            }
        }
    """
    try:
        # 1. 检查文件是否存在
        if not file:
            raise HTTPException(status_code=400, detail="未选择文件")

        # 2. 检查文件扩展名
        file_ext = get_file_extension(file.filename)
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件格式。允许的格式: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # 3. 读取文件内容并检查大小
        contents = await file.read()
        file_size = len(contents)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"文件大小超过限制。最大允许: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )

        if file_size == 0:
            raise HTTPException(status_code=400, detail="文件为空")

        # 4. 圖片處理
        try:
            # 讀取圖片
            img = Image.open(BytesIO(contents))

            # 確保為 RGB 模式 (處理 RGBA、灰階等)
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # 保存為 JPEG（前端已裁切，不需要再裁切）
            output = BytesIO()
            img.save(output, format='JPEG', quality=95, optimize=True)
            output.seek(0)
            contents = output.read()
            file_size = len(contents)

        except Exception as e:
            raise HTTPException(status_code=400, detail=f"图片处理失败: {str(e)}")

        # 5. 生成唯一文件名 (強制使用 .jpg)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        unique_filename = f"{timestamp}_{unique_id}.jpg"
        file_path = settings.upload_dir_path / unique_filename

        # 6. 确保上传目录存在
        settings.upload_dir_path.mkdir(parents=True, exist_ok=True)

        # 7. 保存文件
        with open(file_path, "wb") as f:
            f.write(contents)

        # 8. 生成访问URL
        file_url = settings.get_public_url(unique_filename)

        # 9. 返回成功响应
        return JSONResponse(
            status_code=200,
            content={
                "code": 200,
                "message": "上传成功",
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
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


@router.delete("/upload/{filename}", summary="删除图片", description="删除已上传的图片")
async def delete_image(filename: str):
    """
    删除图片接口（可选）

    Args:
        filename: 文件名

    Returns:
        {"code": 200, "message": "删除成功"}
    """
    try:
        file_path = settings.upload_dir_path / filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="文件不存在")

        # 删除文件
        file_path.unlink()

        return JSONResponse(
            status_code=200,
            content={
                "code": 200,
                "message": "删除成功"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")
