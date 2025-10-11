"""
分頁處理
"""
from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel
from math import ceil

T = TypeVar("T")


class PageParams(BaseModel):
    """分頁參數"""

    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        """計算偏移量"""
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        """獲取限制數量"""
        return self.page_size


class PageResponse(BaseModel, Generic[T]):
    """分頁響應"""

    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PageResponse[T]":
        """創建分頁響應"""
        total_pages = ceil(total / page_size) if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
