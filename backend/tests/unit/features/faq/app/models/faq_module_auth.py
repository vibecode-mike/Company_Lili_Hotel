class FaqModuleAuth:
    """FAQ 模組授權 Aggregate"""

    def __init__(
        self,
        client_id: str,
        is_authorized: bool = False,
        id: int = None,
    ):
        self.id = id
        self.client_id = client_id
        self.is_authorized = is_authorized
