from typing import Optional, List
from app.models.faq_category import FaqCategory


class FaqCategoryRepository:
    """FAQ 大分類 Repository - Fake 實作"""

    def __init__(self):
        self._store = {}  # key: id, value: FaqCategory
        self._name_index = {}  # key: name, value: id
        self._next_id = 1

    def save(self, category: FaqCategory) -> None:
        if category.id is None:
            category.id = self._next_id
            self._next_id += 1
        self._store[category.id] = category
        self._name_index[category.name] = category.id

    def find_by_id(self, category_id: int) -> Optional[FaqCategory]:
        return self._store.get(category_id)

    def find_by_name(self, name: str) -> Optional[FaqCategory]:
        cat_id = self._name_index.get(name)
        if cat_id is not None:
            return self._store.get(cat_id)
        return None

    def find_by_industry_id(self, industry_id: int) -> List[FaqCategory]:
        return [c for c in self._store.values() if c.industry_id == industry_id]

    def find_all(self) -> List[FaqCategory]:
        return list(self._store.values())
