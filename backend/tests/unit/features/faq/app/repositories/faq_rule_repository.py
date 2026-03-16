from typing import Optional, List
from app.models.faq_rule import FaqRule


class FaqRuleRepository:
    """FAQ 規則 Repository - Fake 實作"""

    def __init__(self):
        self._store = {}  # key: id, value: FaqRule
        self._next_id = 1

    def save(self, rule: FaqRule) -> None:
        if rule.id is None:
            rule.id = self._next_id
            self._next_id += 1
        self._store[rule.id] = rule

    def find_by_id(self, rule_id: int) -> Optional[FaqRule]:
        return self._store.get(rule_id)

    def find_by_category_id(self, category_id: int) -> List[FaqRule]:
        return [r for r in self._store.values() if r.category_id == category_id]

    def find_published_by_category_id(self, category_id: int) -> List[FaqRule]:
        return [r for r in self._store.values()
                if r.category_id == category_id and r.is_published]

    def find_unpublished(self) -> List[FaqRule]:
        return [r for r in self._store.values() if not r.is_published]

    def find_all(self) -> List[FaqRule]:
        return list(self._store.values())

    def delete(self, rule_id: int) -> None:
        self._store.pop(rule_id, None)

    def count_by_category_id(self, category_id: int) -> int:
        return len([r for r in self._store.values() if r.category_id == category_id])
