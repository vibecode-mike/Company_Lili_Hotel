from behave import given
from app.models.faq_category import FaqCategory
from app.models.faq_category_field import FaqCategoryField


CATEGORY_FIELDS = {
    "訂房": [
        ("房型名稱", "text", True, 1),
        ("房型特色", "text", True, 2),
        ("房價", "text", True, 3),
        ("人數", "text", True, 4),
        ("間數", "text", False, 5),
        ("url", "text", False, 6),
        ("標籤", "tag", False, 7),
    ],
    "設施": [
        ("設施名稱", "text", True, 1),
        ("位置", "text", False, 2),
        ("費用", "text", False, 3),
        ("開放時間", "text", False, 4),
        ("說明", "text", False, 5),
        ("url", "text", False, 6),
        ("標籤", "tag", False, 7),
    ],
}


def _create_category_with_fields(context, name, is_active=True, data_source_type=None):
    """Create a category and auto-create field definitions for known categories."""
    existing = context.repos.faq_category.find_by_name(name)
    if existing:
        return existing
    kwargs = {"name": name, "is_active": is_active}
    if data_source_type:
        kwargs["data_source_type"] = data_source_type
    category = FaqCategory(**kwargs)
    context.repos.faq_category.save(category)
    if name in CATEGORY_FIELDS:
        for field_name, field_type, is_required, sort_order in CATEGORY_FIELDS[name]:
            field = FaqCategoryField(
                category_id=category.id,
                field_name=field_name,
                field_type=field_type,
                is_required=is_required,
                sort_order=sort_order,
            )
            context.repos.faq_category_field.save(field)
    return category


@given('旅宿業有以下大分類')
def step_impl(context):
    for row in context.table:
        source_type_map = {"PMS 串接": "pms", "自訂 FAQ": "custom_faq"}
        _create_category_with_fields(
            context,
            row["category_name"],
            is_active=row["is_active"].lower() == "true",
            data_source_type=source_type_map.get(row["data_source_type"], row["data_source_type"]),
        )


@given('大分類「{category_name}」的資料來源類型為「{source_type}」')
def step_impl(context, category_name, source_type):
    source_type_map = {"PMS 串接": "pms", "自訂 FAQ": "custom_faq"}
    _create_category_with_fields(
        context,
        category_name,
        data_source_type=source_type_map.get(source_type, source_type),
    )


@given('大分類「{category_name}」已啟用')
def step_impl(context, category_name):
    _create_category_with_fields(context, category_name, is_active=True)


@given('大分類「{category_name}」目前為啟用狀態')
def step_impl(context, category_name):
    _create_category_with_fields(context, category_name, is_active=True)


@given('大分類「{category_name}」目前為關閉狀態')
def step_impl(context, category_name):
    _create_category_with_fields(context, category_name, is_active=False)
