from app.models.faq_rule import FaqRule
from app.repositories.faq_rule_repository import FaqRuleRepository
from app.repositories.faq_category_repository import FaqCategoryRepository
from app.repositories.faq_category_field_repository import FaqCategoryFieldRepository
from app.exceptions import FaqValidationError, FaqRuleLimitError, FaqPublishError


class FaqRuleService:
    """FAQ 規則服務"""

    MAX_RULES_PER_CATEGORY = 20

    def __init__(
        self,
        faq_rule_repository: FaqRuleRepository,
        faq_category_repository: FaqCategoryRepository,
        faq_category_field_repository: FaqCategoryFieldRepository,
    ):
        self.faq_rule_repository = faq_rule_repository
        self.faq_category_repository = faq_category_repository
        self.faq_category_field_repository = faq_category_field_repository

    def create_rule(self, category_name: str, content: dict) -> None:
        category = self.faq_category_repository.find_by_name(category_name)
        category_id = category.id if category else 0

        # Check limit
        current_count = self.faq_rule_repository.count_by_category_id(category_id)
        if current_count >= self.MAX_RULES_PER_CATEGORY:
            raise FaqRuleLimitError("已達規則數量上限（20 筆），無法新增")

        rule = FaqRule(
            category_id=category_id,
            content_json=content,
            is_enabled=True,
            is_published=False,
        )
        self.faq_rule_repository.save(rule)

    def edit_rule(self, rule_id: int, content: dict) -> None:
        rule = self.faq_rule_repository.find_by_id(rule_id)
        if rule is None:
            return

        rule.content_json = content
        rule.is_published = False
        self.faq_rule_repository.save(rule)

    def delete_rule(self, rule_id: int) -> None:
        self.faq_rule_repository.delete(rule_id)

    def toggle_rule(self, rule_id: int, is_enabled: bool) -> None:
        rule = self.faq_rule_repository.find_by_id(rule_id)
        if rule is None:
            return
        rule.is_enabled = is_enabled
        rule.is_published = False
        self.faq_rule_repository.save(rule)

    def publish(self) -> None:
        rules = self.faq_rule_repository.find_all()
        for rule in rules:
            if not rule.is_published:
                rule.is_published = True
                self.faq_rule_repository.save(rule)

    def get_edit_form(self, category_name: str) -> dict:
        category = self.faq_category_repository.find_by_name(category_name)
        if category is None:
            return {"fields": []}
        fields = self.faq_category_field_repository.find_by_category_id(category.id)
        return {
            "fields": [
                {
                    "field_name": f.field_name,
                    "field_type": f.field_type,
                    "is_required": f.is_required,
                }
                for f in sorted(fields, key=lambda x: x.sort_order)
            ]
        }

    def validate_required_fields(self, category_name: str, content: dict) -> None:
        category = self.faq_category_repository.find_by_name(category_name)
        if category is None:
            return
        fields = self.faq_category_field_repository.find_by_category_id(category.id)
        for field in fields:
            if field.is_required and field.field_name not in content:
                raise FaqValidationError(f"{field.field_name}為必填欄位")
