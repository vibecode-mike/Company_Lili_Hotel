"""
Facebook Graph API helpers
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

import requests

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FacebookVerifyResult:
    is_valid: bool
    page_name: str | None = None
    error_code: int | None = None
    error_message: str | None = None


def _graph_url(path: str) -> str:
    version = (settings.FACEBOOK_GRAPH_API_VERSION or "v21.0").strip()
    if not version.startswith("v"):
        version = f"v{version}"
    return f"https://graph.facebook.com/{version}{path}"


def _extract_error(payload: Any) -> tuple[int | None, str | None]:
    if not isinstance(payload, dict):
        return None, None
    error = payload.get("error")
    if not isinstance(error, dict):
        return None, None
    code = error.get("code")
    message = error.get("message")
    return (int(code) if isinstance(code, int) else None, message if isinstance(message, str) else None)


def verify_page_access_token(page_id: str, page_access_token: str, timeout: int = 10) -> FacebookVerifyResult:
    """
    Verify page access token by fetching page info.

    Notes:
    - This does not require app secret.
    - If you also want to enforce "issued for this app", use debug_token with app secret.
    """

    try:
        response = requests.get(
            _graph_url(f"/{page_id}"),
            params={"fields": "id,name", "access_token": page_access_token},
            timeout=timeout,
        )
    except requests.exceptions.RequestException as exc:
        logger.error("Facebook Graph API request failed: %s", exc)
        return FacebookVerifyResult(is_valid=False, error_message="無法連線至 Facebook Graph API")

    try:
        payload = response.json()
    except ValueError:
        payload = None

    if response.status_code == 200 and isinstance(payload, dict):
        page_name = payload.get("name")
        if isinstance(page_name, str) and page_name.strip():
            return FacebookVerifyResult(is_valid=True, page_name=page_name.strip())
        return FacebookVerifyResult(is_valid=True, page_name=None)

    error_code, error_message = _extract_error(payload)
    return FacebookVerifyResult(
        is_valid=False,
        error_code=error_code,
        error_message=error_message or "Facebook Token 驗證失敗",
    )
