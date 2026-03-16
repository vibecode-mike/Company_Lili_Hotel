from app.models.faq_module_auth import FaqModuleAuth
from app.repositories.faq_module_auth_repository import FaqModuleAuthRepository
from app.exceptions import FaqAuthorizationError


class FaqModuleService:
    """FAQ 模組授權服務"""

    def __init__(self, faq_module_auth_repository: FaqModuleAuthRepository):
        self.faq_module_auth_repository = faq_module_auth_repository

    def authorize(self, client_id: str) -> None:
        auth = self.faq_module_auth_repository.find_by_client_id(client_id)
        if auth is None:
            auth = FaqModuleAuth(client_id=client_id, is_authorized=True)
        else:
            auth.is_authorized = True
        self.faq_module_auth_repository.save(auth)

    def check_access(self, client_id: str) -> dict:
        auth = self.faq_module_auth_repository.find_by_client_id(client_id)
        if auth is None or not auth.is_authorized:
            raise FaqAuthorizationError("請聯繫系統商開通")
        return {"accessible": True}
