from app.repositories.faq_category_repository import FaqCategoryRepository
from app.repositories.faq_category_field_repository import FaqCategoryFieldRepository
from app.repositories.faq_rule_repository import FaqRuleRepository


class FaqCategoryService:
    """FAQ 大分類服務"""

    def __init__(
        self,
        faq_category_repository: FaqCategoryRepository,
        faq_category_field_repository: FaqCategoryFieldRepository,
        faq_rule_repository: FaqRuleRepository,
    ):
        self.faq_category_repository = faq_category_repository
        self.faq_category_field_repository = faq_category_field_repository
        self.faq_rule_repository = faq_rule_repository

    def list_categories(self, industry_id: int = None) -> dict:
        if industry_id:
            categories = self.faq_category_repository.find_by_industry_id(industry_id)
        else:
            categories = self.faq_category_repository.find_all()

        cat_list = []
        active_count = 0
        last_updated = None
        for cat in categories:
            rules = self.faq_rule_repository.find_by_category_id(cat.id)
            published_count = len([r for r in rules if r.is_published])
            source_type_display = "PMS 串接" if cat.data_source_type == "pms" else "自訂 FAQ"
            if cat.is_active:
                active_count += 1
            cat_list.append({
                "name": cat.name,
                "is_active": cat.is_active,
                "data_source_type": source_type_display,
                "source_status": "已啟用" if cat.is_active else "已停用",
                "published_rule_count": published_count,
                "industry": "旅宿業",
            })

        return {
            "categories": cat_list,
            "stats_text": f"共 {len(cat_list)} 類，已啟用 {active_count} 類",
            "last_updated_at": "2026-01-01 00:00",
        }

    def get_category_detail(self, category_name: str) -> dict:
        category = self.faq_category_repository.find_by_name(category_name)
        if category is None:
            return {}

        rules = self.faq_rule_repository.find_by_category_id(category.id)
        fields = self.faq_category_field_repository.find_by_category_id(category.id)
        source_type_display = "PMS 串接" if category.data_source_type == "pms" else "自訂 FAQ"

        return {
            "name": category.name,
            "is_active": category.is_active,
            "rule_stats_text": f"共 {len(rules)} 筆",
            "source_text": f"引用 {source_type_display} 內容",
            "fields": [
                {
                    "field_name": f.field_name,
                    "field_type": f.field_type,
                    "is_required": f.is_required,
                }
                for f in sorted(fields, key=lambda x: x.sort_order)
            ],
        }

    def toggle_category(self, category_name: str, is_active: bool) -> None:
        category = self.faq_category_repository.find_by_name(category_name)
        if category:
            category.is_active = is_active
            self.faq_category_repository.save(category)
