class FaqCategory:
    """FAQ 大分類 Aggregate"""

    def __init__(
        self,
        name: str,
        industry_id: int = None,
        is_active: bool = True,
        data_source_type: str = "custom_faq",
        is_system_default: bool = True,
        sort_order: int = 0,
        id: int = None,
    ):
        self.id = id
        self.industry_id = industry_id
        self.name = name
        self.is_active = is_active
        self.data_source_type = data_source_type
        self.is_system_default = is_system_default
        self.sort_order = sort_order
