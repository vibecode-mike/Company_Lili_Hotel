class Industry:
    """產業定義 Aggregate"""

    def __init__(self, name: str, is_active: bool = True, id: int = None):
        self.id = id
        self.name = name
        self.is_active = is_active
