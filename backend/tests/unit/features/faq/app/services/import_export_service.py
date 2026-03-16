from app.repositories.faq_rule_repository import FaqRuleRepository
from app.repositories.faq_category_repository import FaqCategoryRepository


class ImportExportService:
    """規則匯入匯出服務"""

    def __init__(
        self,
        faq_rule_repository: FaqRuleRepository,
        faq_category_repository: FaqCategoryRepository,
    ):
        self.faq_rule_repository = faq_rule_repository
        self.faq_category_repository = faq_category_repository

    def export_rules(self, category_name: str) -> dict:
        category = self.faq_category_repository.find_by_name(category_name)
        if category is None:
            return {"rules": []}
        rules = self.faq_rule_repository.find_by_category_id(category.id)
        return {
            "category": category_name,
            "rules": [
                {
                    "content": r.content_json,
                    "is_enabled": r.is_enabled,
                    "is_published": r.is_published,
                }
                for r in rules
            ],
        }

    def import_rules(self, category_name: str, file_data: dict) -> None:
        category = self.faq_category_repository.find_by_name(category_name)
        if category is None:
            return
        # Delete existing rules
        existing = self.faq_rule_repository.find_by_category_id(category.id)
        for rule in existing:
            self.faq_rule_repository.delete(rule.id)
        # Import new rules from file_data
        from app.models.faq_rule import FaqRule
        for rule_data in file_data.get("data", []):
            rule = FaqRule(
                category_id=category.id,
                content_json=rule_data if isinstance(rule_data, dict) else {},
                is_enabled=True,
                is_published=False,
            )
            self.faq_rule_repository.save(rule)
