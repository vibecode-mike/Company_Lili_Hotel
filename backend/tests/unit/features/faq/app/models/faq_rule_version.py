class FaqRuleVersion:
    """FAQ 規則版本快照 Aggregate"""

    def __init__(
        self,
        rule_id: int,
        content_json: dict = None,
        is_enabled: bool = True,
        version_number: int = 1,
        id: int = None,
    ):
        self.id = id
        self.rule_id = rule_id
        self.content_json = content_json or {}
        self.is_enabled = is_enabled
        self.version_number = version_number
