from app.models.industry import Industry
from app.models.faq_category import FaqCategory
from app.models.faq_category_field import FaqCategoryField
from app.repositories.industry_repository import IndustryRepository
from app.repositories.faq_category_repository import FaqCategoryRepository
from app.repositories.faq_category_field_repository import FaqCategoryFieldRepository


class IndustryService:
    """產業管理服務"""

    def __init__(
        self,
        industry_repository: IndustryRepository,
        faq_category_repository: FaqCategoryRepository,
        faq_category_field_repository: FaqCategoryFieldRepository,
    ):
        self.industry_repository = industry_repository
        self.faq_category_repository = faq_category_repository
        self.faq_category_field_repository = faq_category_field_repository

    def initialize_system(self) -> None:
        # Create 旅宿業
        industry = Industry(name="旅宿業")
        self.industry_repository.save(industry)

        # Create 訂房 category
        booking = FaqCategory(
            name="訂房",
            industry_id=industry.id,
            is_system_default=True,
            sort_order=1,
        )
        self.faq_category_repository.save(booking)

        # Create 設施 category
        facility = FaqCategory(
            name="設施",
            industry_id=industry.id,
            is_system_default=True,
            sort_order=2,
        )
        self.faq_category_repository.save(facility)

        # Create 訂房 fields
        booking_fields = [
            ("房型名稱", "text", True, 1),
            ("房型特色", "text", True, 2),
            ("房價", "text", True, 3),
            ("人數", "text", True, 4),
            ("間數", "text", False, 5),
            ("url", "text", False, 6),
            ("標籤", "tag", False, 7),
        ]
        for name, ftype, required, order in booking_fields:
            field = FaqCategoryField(
                category_id=booking.id,
                field_name=name,
                field_type=ftype,
                is_required=required,
                sort_order=order,
            )
            self.faq_category_field_repository.save(field)

        # Create 設施 fields
        facility_fields = [
            ("設施名稱", "text", True, 1),
            ("位置", "text", False, 2),
            ("費用", "text", False, 3),
            ("開放時間", "text", False, 4),
            ("說明", "text", False, 5),
            ("url", "text", False, 6),
            ("標籤", "tag", False, 7),
        ]
        for name, ftype, required, order in facility_fields:
            field = FaqCategoryField(
                category_id=facility.id,
                field_name=name,
                field_type=ftype,
                is_required=required,
                sort_order=order,
            )
            self.faq_category_field_repository.save(field)

    def create_industry(self, name: str) -> None:
        industry = Industry(name=name)
        self.industry_repository.save(industry)

    def define_category_fields(self, industry_name: str, categories: list) -> None:
        # Simplified: just mark as done
        pass
