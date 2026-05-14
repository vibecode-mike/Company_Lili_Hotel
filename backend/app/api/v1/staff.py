"""
員工帳號 API

- /staff/my-channels：登入者可看到的 LINE OA（ChannelContext 用）
- /staff/users：admin only 帳號管理 CRUD
- /staff/users/{id}/channels：admin only 指派可用館別
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
import logging

from app.database import get_db
from app.models.user import User, UserRole
from app.models.user_channel import UserChannel
from app.models.line_channel import LineChannel
from app.schemas.line_channel import LineChannelResponse
from app.core.security import get_password_hash
from app.api.v1.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ---------- Pydantic Schemas ----------

class StaffChannelBrief(BaseModel):
    channel_id: str
    channel_name: Optional[str] = None
    basic_id: Optional[str] = None

    class Config:
        from_attributes = True


class StaffUserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    last_login_at: Optional[datetime] = None
    channels: List[StaffChannelBrief] = []

    class Config:
        from_attributes = True


class StaffUserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    role: UserRole = UserRole.CUSTOMER_SERVICE
    is_active: bool = True
    channel_ids: List[str] = Field(default_factory=list, description="可存取的 LINE channel_id 清單")


class StaffUserUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class StaffChannelsUpdate(BaseModel):
    channel_ids: List[str] = Field(default_factory=list)


# ---------- Helpers ----------

async def _require_admin(current_user: User) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="僅限 ADMIN 角色操作")
    return current_user


async def _load_user_channels(db: AsyncSession, user_id: int) -> List[LineChannel]:
    """撈某個 user 可看的 LINE channels（依 LineChannel.id 排序）"""
    stmt = (
        select(LineChannel)
        .join(UserChannel, UserChannel.line_channel_id == LineChannel.channel_id)
        .where(UserChannel.user_id == user_id)
        .where(LineChannel.is_active == True)
        .order_by(LineChannel.id.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def _count_active_admins(db: AsyncSession, exclude_user_id: Optional[int] = None) -> int:
    stmt = select(func.count(User.id)).where(
        User.role == UserRole.ADMIN,
        User.is_active == True,
    )
    if exclude_user_id is not None:
        stmt = stmt.where(User.id != exclude_user_id)
    result = await db.execute(stmt)
    return result.scalar_one()


async def _to_response(db: AsyncSession, user: User) -> StaffUserResponse:
    channels = await _load_user_channels(db, user.id)
    return StaffUserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=bool(user.is_active),
        last_login_at=user.last_login_at,
        channels=[
            StaffChannelBrief(
                channel_id=c.channel_id or "",
                channel_name=c.channel_name,
                basic_id=c.basic_id,
            )
            for c in channels
        ],
    )


# ---------- Endpoints ----------

@router.get("/my-channels", response_model=List[LineChannelResponse])
async def list_my_channels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """登入者可看到的 LINE OA 清單（給 ChannelContext 拉）"""
    channels = await _load_user_channels(db, current_user.id)
    return channels


@router.get("/users", response_model=List[StaffUserResponse])
async def list_staff_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """列出所有帳號 + 各自的館別（admin only）"""
    await _require_admin(current_user)
    result = await db.execute(select(User).order_by(User.id.asc()))
    users = list(result.scalars().all())
    return [await _to_response(db, u) for u in users]


@router.post("/users", response_model=StaffUserResponse, status_code=201)
async def create_staff_user(
    data: StaffUserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """新增帳號（admin only）"""
    await _require_admin(current_user)

    # 檢查重複
    dup = await db.execute(
        select(User).where(
            (User.username == data.username) | (User.email == data.email)
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="帳號或 Email 已存在")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
        is_active=data.is_active,
    )
    db.add(user)
    await db.flush()  # 取得 user.id

    # 指派 channels
    if data.channel_ids:
        await _assign_channels(db, user.id, data.channel_ids)

    await db.commit()
    await db.refresh(user)
    logger.info(f"✅ 新增帳號: id={user.id} username={user.username}")
    return await _to_response(db, user)


@router.patch("/users/{user_id}", response_model=StaffUserResponse)
async def update_staff_user(
    user_id: int,
    data: StaffUserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新帳號（admin only）"""
    await _require_admin(current_user)

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="帳號不存在")

    update_dict = data.model_dump(exclude_unset=True)

    # 不能改自己 role / is_active 為非 admin / disabled
    if current_user.id == user_id:
        if "role" in update_dict and update_dict["role"] != UserRole.ADMIN:
            raise HTTPException(status_code=400, detail="不能把自己降為非 ADMIN")
        if update_dict.get("is_active") is False:
            raise HTTPException(status_code=400, detail="不能停用自己的帳號")

    # 改 role 或 is_active 時，確認系統內至少還有 1 個 active admin
    if (
        ("role" in update_dict and update_dict["role"] != UserRole.ADMIN and user.role == UserRole.ADMIN)
        or (update_dict.get("is_active") is False and user.role == UserRole.ADMIN)
    ):
        remaining = await _count_active_admins(db, exclude_user_id=user_id)
        if remaining < 1:
            raise HTTPException(status_code=400, detail="系統至少需保留 1 個啟用中的 ADMIN")

    # Email 唯一性
    if "email" in update_dict and update_dict["email"] != user.email:
        dup = await db.execute(
            select(User).where(User.email == update_dict["email"], User.id != user_id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email 已被使用")

    # 密碼 hash
    if "password" in update_dict and update_dict["password"]:
        user.password_hash = get_password_hash(update_dict.pop("password"))
    else:
        update_dict.pop("password", None)

    for k, v in update_dict.items():
        setattr(user, k, v)

    await db.commit()
    await db.refresh(user)
    logger.info(f"✅ 更新帳號: id={user_id} fields={list(update_dict.keys())}")
    return await _to_response(db, user)


@router.delete("/users/{user_id}")
async def delete_staff_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """刪除帳號（admin only，禁刪自己、禁刪最後一個 admin）"""
    await _require_admin(current_user)

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="不能刪除自己的帳號")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="帳號不存在")

    if user.role == UserRole.ADMIN:
        remaining = await _count_active_admins(db, exclude_user_id=user_id)
        if remaining < 1:
            raise HTTPException(status_code=400, detail="系統至少需保留 1 個啟用中的 ADMIN")

    await db.delete(user)
    await db.commit()
    logger.info(f"✅ 刪除帳號: id={user_id}")
    return {"code": 200, "message": "已刪除"}


async def _assign_channels(db: AsyncSession, user_id: int, channel_ids: List[str]) -> None:
    """覆寫該 user 的 user_channels：刪掉舊的、加入新的"""
    # 過濾掉 invalid channel_id
    cleaned = [cid.strip() for cid in channel_ids if cid and cid.strip()]
    cleaned = list(dict.fromkeys(cleaned))  # 去重

    # 驗證每個 channel_id 都存在
    if cleaned:
        valid_result = await db.execute(
            select(LineChannel.channel_id).where(LineChannel.channel_id.in_(cleaned))
        )
        valid = set(valid_result.scalars().all())
        invalid = [c for c in cleaned if c not in valid]
        if invalid:
            raise HTTPException(status_code=400, detail=f"無效的 channel_id: {invalid}")

    # 刪舊的、加新的
    await db.execute(delete(UserChannel).where(UserChannel.user_id == user_id))
    for cid in cleaned:
        db.add(UserChannel(user_id=user_id, line_channel_id=cid))


@router.patch("/users/{user_id}/channels", response_model=StaffUserResponse)
async def update_staff_user_channels(
    user_id: int,
    data: StaffChannelsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """指派 user 可看到的 LINE 館別（admin only）"""
    await _require_admin(current_user)

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="帳號不存在")

    await _assign_channels(db, user_id, data.channel_ids)
    await db.commit()
    logger.info(f"✅ 更新帳號館別: user_id={user_id} count={len(data.channel_ids)}")
    return await _to_response(db, user)
