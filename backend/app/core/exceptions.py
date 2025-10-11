"""
自定義異常
"""


class AppException(Exception):
    """應用基礎異常"""

    def __init__(self, message: str, code: int = 400):
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotFoundException(AppException):
    """資源未找到異常"""

    def __init__(self, message: str = "資源未找到"):
        super().__init__(message, 404)


class UnauthorizedException(AppException):
    """未授權異常"""

    def __init__(self, message: str = "未授權訪問"):
        super().__init__(message, 401)


class ForbiddenException(AppException):
    """禁止訪問異常"""

    def __init__(self, message: str = "禁止訪問"):
        super().__init__(message, 403)


class ValidationException(AppException):
    """驗證異常"""

    def __init__(self, message: str = "驗證失敗"):
        super().__init__(message, 422)


class InsufficientQuotaException(AppException):
    """配額不足異常"""

    def __init__(self, message: str = "訊息配額不足"):
        super().__init__(message, 400)
