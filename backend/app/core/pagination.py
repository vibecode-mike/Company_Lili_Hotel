"""
分頁處理 - 提供通用分頁功能避免代碼重複 (DRY 原則)
"""
from typing import Generic, TypeVar, List, Optional, Any
from pydantic import BaseModel, Field
from math import ceil
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class PageParams(BaseModel):
    """分頁參數"""

    page: int = Field(1, ge=1, le=10000, description="頁碼")
    page_size: int = Field(20, ge=1, le=200, description="每頁數量")

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

    items: List[T] = Field(default_factory=list, description="數據列表")
    total: int = Field(0, description="總記錄數")
    page: int = Field(1, description="當前頁碼")
    page_size: int = Field(20, description="每頁數量")
    total_pages: int = Field(0, description="總頁數")

    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PageResponse[T]":
        """創建分頁響應

        Args:
            items: 當前頁數據列表
            total: 總記錄數
            page: 當前頁碼
            page_size: 每頁數量

        Returns:
            PageResponse: 分頁響應對象
        """
        total_pages = ceil(total / page_size) if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


async def paginate_query(
    db: AsyncSession,
    query: Select,
    page_params: PageParams,
    *,
    count_query: Optional[Select] = None
) -> tuple[List[Any], int]:
    """通用分頁查詢函數 - 避免分頁邏輯重複 (DRY 原則)

    對 SQLAlchemy 查詢應用分頁邏輯並返回結果和總數。

    Args:
        db: 數據庫 session
        query: SQLAlchemy 查詢對象 (Select)
        page_params: 分頁參數
        count_query: 可選的自定義計數查詢 (用於複雜查詢優化)

    Returns:
        tuple: (當前頁數據列表, 總記錄數)

    Example:
        ```python
        # 基本用法
        query = select(Member).where(Member.is_active == True)
        items, total = await paginate_query(db, query, page_params)

        # 帶預加載關聯
        query = select(Member).options(selectinload(Member.tags))
        items, total = await paginate_query(db, query, page_params)

        # 自定義計數查詢 (性能優化)
        count_q = select(func.count(Member.id)).where(Member.is_active == True)
        items, total = await paginate_query(db, query, page_params, count_query=count_q)
        ```
    """
    # 1. 計算總數
    if count_query is None:
        # 默認計數查詢: 從原查詢創建子查詢計數
        count_query = select(func.count()).select_from(query.subquery())

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # 2. 應用分頁
    paginated_query = query.offset(page_params.offset).limit(page_params.limit)

    # 3. 執行查詢
    result = await db.execute(paginated_query)
    items = result.scalars().all()

    return list(items), total
