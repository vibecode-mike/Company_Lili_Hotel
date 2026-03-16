class AiTokenUsage:
    """AI Token 用量 Aggregate"""

    def __init__(
        self,
        client_id: str,
        total_quota: int = 0,
        used_amount: int = 0,
        id: int = None,
    ):
        self.id = id
        self.client_id = client_id
        self.total_quota = total_quota
        self.used_amount = used_amount
