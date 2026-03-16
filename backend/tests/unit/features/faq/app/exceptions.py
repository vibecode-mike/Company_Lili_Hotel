class FaqValidationError(Exception):
    """FAQ 驗證錯誤"""
    pass


class FaqAuthorizationError(Exception):
    """FAQ 授權錯誤"""
    pass


class FaqRuleLimitError(Exception):
    """FAQ 規則數量超限"""
    pass


class FaqPublishError(Exception):
    """FAQ 發佈錯誤"""
    pass
