from app.models.ai_token_usage import AiTokenUsage
from app.repositories.ai_token_usage_repository import AiTokenUsageRepository


class TokenService:
    """Token 管理服務"""

    def __init__(self, ai_token_usage_repository: AiTokenUsageRepository):
        self.ai_token_usage_repository = ai_token_usage_repository

    def set_quota(self, client_id: str, quota: int) -> None:
        usage = self.ai_token_usage_repository.find_by_client_id(client_id)
        if usage is None:
            usage = AiTokenUsage(client_id=client_id, total_quota=quota)
        else:
            usage.total_quota = quota
        self.ai_token_usage_repository.save(usage)

    def get_usage(self, client_id: str) -> dict:
        usage = self.ai_token_usage_repository.find_by_client_id(client_id)
        if usage is None:
            return {
                "total_quota": 0,
                "used_amount": 0,
                "available": 0,
                "ai_active": False,
            }
        available = max(0, usage.total_quota - usage.used_amount)
        ai_active = available > 0
        result = {
            "total_quota": usage.total_quota,
            "used_amount": usage.used_amount,
            "available": available,
            "ai_active": ai_active,
        }
        if not ai_active:
            result["lock_message"] = "當前客服已啟用 自動回應 模組，須加值請聯繫系統商"
        return result

    def consume(self, client_id: str, amount: int) -> None:
        usage = self.ai_token_usage_repository.find_by_client_id(client_id)
        if usage:
            usage.used_amount += amount
            self.ai_token_usage_repository.save(usage)
