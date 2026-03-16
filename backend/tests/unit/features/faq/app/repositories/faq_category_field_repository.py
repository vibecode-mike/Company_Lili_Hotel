from typing import List
from app.models.faq_category_field import FaqCategoryField


class FaqCategoryFieldRepository:
    """大分類欄位定義 Repository - Fake 實作"""

    def __init__(self):
        self._store = {}  # key: id, value: FaqCategoryField
        self._next_id = 1

    def save(self, field: FaqCategoryField) -> None:
        if field.id is None:
            field.id = self._next_id
            self._next_id += 1
        self._store[field.id] = field

    def find_by_category_id(self, category_id: int) -> List[FaqCategoryField]:
        return [f for f in self._store.values() if f.category_id == category_id]

    def save_all(self, fields: List[FaqCategoryField]) -> None:
        for field in fields:
            self.save(field)
