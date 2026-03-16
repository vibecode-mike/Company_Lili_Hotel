from typing import Optional, List
from app.models.faq_rule_version import FaqRuleVersion


class FaqRuleVersionRepository:
    """FAQ 規則版本 Repository - Fake 實作"""

    def __init__(self):
        self._store = {}  # key: id, value: FaqRuleVersion
        self._next_id = 1

    def save(self, version: FaqRuleVersion) -> None:
        if version.id is None:
            version.id = self._next_id
            self._next_id += 1
        self._store[version.id] = version

    def find_latest_by_rule_id(self, rule_id: int) -> Optional[FaqRuleVersion]:
        versions = self.find_by_rule_id(rule_id)
        if not versions:
            return None
        return max(versions, key=lambda v: v.version_number)

    def find_by_rule_id(self, rule_id: int) -> List[FaqRuleVersion]:
        return [v for v in self._store.values() if v.rule_id == rule_id]
