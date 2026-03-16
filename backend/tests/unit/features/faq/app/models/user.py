class User:
    """使用者 Aggregate"""

    def __init__(
        self,
        username: str,
        permissions: list = None,
        role: str = "user",
        id: int = None,
    ):
        self.id = id
        self.username = username
        self.permissions = permissions or []
        self.role = role
