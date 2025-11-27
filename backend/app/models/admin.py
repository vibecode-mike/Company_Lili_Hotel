"""
管理員和權限系統模型
包含：Admin（管理員）、Role（角色）、Permission（權限）、AdminRole（管理員角色關聯）、RolePermission（角色權限關聯）
"""
from sqlalchemy import (
    Column,
    String,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class Admin(Base):
    """管理員表"""

    __tablename__ = "admins"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False, comment="登入信箱，作為識別帳號")
    password_hash = Column(
        String(255),
        nullable=False,
        comment="密碼雜湊值（使用 bcrypt/Argon2 加密儲存）",
    )
    name = Column(String(100), comment="管理員名稱")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    admin_roles = relationship(
        "AdminRole", back_populates="admin", cascade="all, delete-orphan"
    )


class Role(Base):
    """角色表"""

    __tablename__ = "roles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    role_name = Column(
        String(50),
        unique=True,
        nullable=False,
        comment="角色名稱，如「超級管理員」「管理員」「一般員工」",
    )
    role_code = Column(
        String(50),
        unique=True,
        nullable=False,
        comment="角色代碼，如「superadmin」「admin」「staff」",
    )
    description = Column(String(255), comment="角色描述")
    is_system_role = Column(
        Boolean, nullable=False, default=False, comment="是否為系統預設角色"
    )
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新時間")

    # 關聯關係
    admin_roles = relationship(
        "AdminRole", back_populates="role", cascade="all, delete-orphan"
    )
    role_permissions = relationship(
        "RolePermission", back_populates="role", cascade="all, delete-orphan"
    )


class Permission(Base):
    """權限表"""

    __tablename__ = "permissions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    permission_name = Column(
        String(100),
        unique=True,
        nullable=False,
        comment="權限名稱，如「查看會員資料」「發送群發訊息」",
    )
    permission_code = Column(
        String(100),
        unique=True,
        nullable=False,
        comment="權限代碼，如「member.view」「message.send」",
    )
    resource = Column(String(50), comment="資源類別，如「member」「message」「tag」")
    action = Column(String(50), comment="操作類型，如「view」「create」「update」")
    description = Column(String(255), comment="權限描述")
    created_at = Column(DateTime, server_default=func.now(), comment="建立時間")

    # 關聯關係
    role_permissions = relationship(
        "RolePermission", back_populates="permission", cascade="all, delete-orphan"
    )


class AdminRole(Base):
    """管理員-角色關聯表"""

    __tablename__ = "admin_roles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(
        BigInteger,
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
        comment="管理員 ID",
    )
    role_id = Column(
        BigInteger,
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        comment="角色 ID",
    )
    assigned_at = Column(DateTime, server_default=func.now(), comment="指派時間")
    assigned_by = Column(BigInteger, comment="指派人（管理員 ID）")

    # 關聯關係
    admin = relationship("Admin", back_populates="admin_roles")
    role = relationship("Role", back_populates="admin_roles")

    __table_args__ = (
        UniqueConstraint(
            "admin_id", "role_id", name="uq_admin_role"
        ),
    )


class RolePermission(Base):
    """角色-權限關聯表"""

    __tablename__ = "role_permissions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    role_id = Column(
        BigInteger,
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        comment="角色 ID",
    )
    permission_id = Column(
        BigInteger,
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
        comment="權限 ID",
    )
    granted_at = Column(DateTime, server_default=func.now(), comment="授予時間")
    granted_by = Column(BigInteger, comment="授予人（管理員 ID）")

    # 關聯關係
    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")

    __table_args__ = (
        UniqueConstraint(
            "role_id", "permission_id", name="uq_role_permission"
        ),
    )
