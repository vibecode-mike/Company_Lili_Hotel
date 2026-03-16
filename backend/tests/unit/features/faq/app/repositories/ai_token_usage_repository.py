from typing import Optional
from app.models.ai_token_usage import AiTokenUsage


class AiTokenUsageRepository:
    """AI Token 用量 Repository - Fake 實作"""

    def __init__(self):
        self._store = {}  # key: client_id, value: AiTokenUsage

    def save(self, usage: AiTokenUsage) -> None:
        self._store[usage.client_id] = usage

    def find_by_client_id(self, client_id: str) -> Optional[AiTokenUsage]:
        return self._store.get(client_id)
