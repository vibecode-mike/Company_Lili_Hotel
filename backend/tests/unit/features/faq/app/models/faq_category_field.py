class FaqCategoryField:
    """大分類欄位定義 Aggregate"""

    def __init__(
        self,
        category_id: int,
        field_name: str,
        field_type: str = "text",
        is_required: bool = False,
        sort_order: int = 0,
        id: int = None,
    ):
        self.id = id
        self.category_id = category_id
        self.field_name = field_name
        self.field_type = field_type
        self.is_required = is_required
        self.sort_order = sort_order
