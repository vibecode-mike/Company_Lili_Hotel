from typing import Optional, List
from app.models.industry import Industry


class IndustryRepository:
    """產業 Repository - Fake 實作"""

    def __init__(self):
        self._store = {}  # key: name, value: Industry
        self._next_id = 1

    def save(self, industry: Industry) -> None:
        if industry.id is None:
            industry.id = self._next_id
            self._next_id += 1
        self._store[industry.name] = industry

    def find_by_name(self, name: str) -> Optional[Industry]:
        return self._store.get(name)

    def find_all(self) -> List[Industry]:
        return list(self._store.values())
