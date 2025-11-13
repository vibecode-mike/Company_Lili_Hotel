"""
Adapters 模块
用于桥接外部系统（如 line_app）到 Backend
"""
from app.adapters.line_app_adapter import LineAppAdapter

__all__ = ["LineAppAdapter"]
