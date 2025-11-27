"""
輸入驗證工具模組

提供通用的輸入驗證和清理功能，防止注入攻擊和惡意輸入
"""
import re
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class InputValidator:
    """輸入驗證器"""

    # 最大長度限制
    MAX_SEARCH_LENGTH = 100
    MAX_TAG_NAME_LENGTH = 50
    MAX_NOTE_LENGTH = 1000

    # 允許的字符模式
    SEARCH_PATTERN = re.compile(r'^[\w\s\u4e00-\u9fff@.\-+()（）]+$', re.UNICODE)
    TAG_NAME_PATTERN = re.compile(r'^[\w\s\u4e00-\u9fff\-]+$', re.UNICODE)

    # SQL 特殊字符（用於額外檢查）
    SQL_SPECIAL_CHARS = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'exec', 'execute', 'union', 'select', 'drop', 'delete', 'insert', 'update']

    @classmethod
    def sanitize_search_input(cls, search: str) -> Optional[str]:
        """
        清理搜索輸入

        Args:
            search: 原始搜索字符串

        Returns:
            Optional[str]: 清理後的搜索字符串，如果無效則返回 None

        Raises:
            ValueError: 當輸入包含危險字符時
        """
        if not search:
            return None

        # 去除首尾空白
        search = search.strip()

        # 長度檢查
        if len(search) > cls.MAX_SEARCH_LENGTH:
            logger.warning(f"Search input too long: {len(search)} chars (max: {cls.MAX_SEARCH_LENGTH})")
            raise ValueError(f"搜索字符串過長，最大允許 {cls.MAX_SEARCH_LENGTH} 字符")

        # 空字符串檢查
        if not search:
            return None

        # SQL 注入特殊字符檢查（額外安全層）
        search_lower = search.lower()
        for dangerous_char in cls.SQL_SPECIAL_CHARS:
            if dangerous_char in search_lower:
                logger.warning(f"Potentially dangerous SQL pattern detected in search: {dangerous_char}")
                raise ValueError(f"搜索字符串包含不允許的字符: {dangerous_char}")

        # 字符模式驗證
        if not cls.SEARCH_PATTERN.match(search):
            logger.warning(f"Invalid characters in search input: {search}")
            raise ValueError("搜索字符串包含非法字符，僅允許字母、數字、中文、空格和基本符號（@.-+()）")

        return search

    @classmethod
    def sanitize_tag_name(cls, tag_name: str) -> Optional[str]:
        """
        清理標籤名稱

        Args:
            tag_name: 原始標籤名稱

        Returns:
            Optional[str]: 清理後的標籤名稱，如果無效則返回 None

        Raises:
            ValueError: 當輸入無效時
        """
        if not tag_name:
            return None

        tag_name = tag_name.strip()

        if len(tag_name) > cls.MAX_TAG_NAME_LENGTH:
            raise ValueError(f"標籤名稱過長，最大允許 {cls.MAX_TAG_NAME_LENGTH} 字符")

        if not tag_name:
            return None

        if not cls.TAG_NAME_PATTERN.match(tag_name):
            raise ValueError("標籤名稱包含非法字符，僅允許字母、數字、中文、空格和連字符")

        return tag_name

    @classmethod
    def escape_like_pattern(cls, pattern: str) -> str:
        """
        轉義 SQL LIKE 模式中的特殊字符

        Args:
            pattern: 原始模式字符串

        Returns:
            str: 轉義後的模式字符串
        """
        if not pattern:
            return pattern

        # 轉義 SQL LIKE 特殊字符
        # % 和 _ 是 LIKE 的通配符，需要轉義
        pattern = pattern.replace('\\', '\\\\')  # 先轉義反斜線
        pattern = pattern.replace('%', r'\%')
        pattern = pattern.replace('_', r'\_')

        return pattern

    @classmethod
    def validate_pagination(cls, page: int, page_size: int) -> tuple[int, int]:
        """
        驗證分頁參數

        Args:
            page: 頁碼
            page_size: 每頁數量

        Returns:
            tuple[int, int]: 驗證後的 (page, page_size)

        Raises:
            ValueError: 當參數無效時
        """
        if page < 1:
            raise ValueError("頁碼必須大於等於 1")

        if page_size < 1:
            raise ValueError("每頁數量必須大於等於 1")

        if page_size > 100:
            raise ValueError("每頁數量不能超過 100")

        return page, page_size

    @classmethod
    def sanitize_note(cls, note: Optional[str]) -> Optional[str]:
        """
        清理備註內容

        Args:
            note: 原始備註內容

        Returns:
            Optional[str]: 清理後的備註，如果無效則返回 None

        Raises:
            ValueError: 當內容過長時
        """
        if not note:
            return None

        note = note.strip()

        if len(note) > cls.MAX_NOTE_LENGTH:
            raise ValueError(f"備註內容過長，最大允許 {cls.MAX_NOTE_LENGTH} 字符")

        if not note:
            return None

        return note


def validate_email_format(email: str) -> bool:
    """
    驗證電子郵件格式

    Args:
        email: 電子郵件地址

    Returns:
        bool: 是否為有效格式
    """
    email_pattern = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    return bool(email_pattern.match(email))


def validate_phone_format(phone: str) -> bool:
    """
    驗證手機號碼格式（台灣）

    Args:
        phone: 手機號碼

    Returns:
        bool: 是否為有效格式
    """
    # 台灣手機號碼格式：09xx-xxxxxx 或 09xxxxxxxx
    phone_pattern = re.compile(r'^09\d{8}$|^09\d{2}-?\d{6}$')
    # 移除可能的連字符
    phone_clean = phone.replace('-', '').replace(' ', '')
    return bool(phone_pattern.match(phone_clean))
