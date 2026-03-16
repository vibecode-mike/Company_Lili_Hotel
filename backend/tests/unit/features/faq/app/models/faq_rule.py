class FaqRule:
    """FAQ 規則 Aggregate（雙維度狀態模型）"""

    def __init__(
        self,
        category_id: int,
        content_json: dict = None,
        is_enabled: bool = True,
        is_published: bool = False,
        id: int = None,
    ):
        self.id = id
        self.category_id = category_id
        self.content_json = content_json or {}
        self.is_enabled = is_enabled
        self.is_published = is_published
