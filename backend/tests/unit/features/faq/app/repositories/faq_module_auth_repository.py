from typing import Optional
from app.models.faq_module_auth import FaqModuleAuth


class FaqModuleAuthRepository:
    """FAQ 模組授權 Repository - Fake 實作"""

    def __init__(self):
        self._store = {}  # key: client_id, value: FaqModuleAuth

    def save(self, auth: FaqModuleAuth) -> None:
        self._store[auth.client_id] = auth

    def find_by_client_id(self, client_id: str) -> Optional[FaqModuleAuth]:
        return self._store.get(client_id)
