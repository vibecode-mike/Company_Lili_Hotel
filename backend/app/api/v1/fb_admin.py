"""
FB Admin proxy — 後端代打 api-youth-tycg/firm_login，
讓前端不持有 firm 密碼。
"""
import httpx
from fastapi import APIRouter, HTTPException

from app.config import settings

router = APIRouter()


@router.post("/fb-firm-login", summary="後端代打 api-youth-tycg/firm_login")
async def fb_firm_login_proxy():
    """
    前端呼叫這個 endpoint（不帶任何 credential）。
    Backend 用 settings.FB_FIRM_PASSWORD（dev 從 .env / staging+prod 從
    Secret Manager 經 load-secrets.sh 注入）打對方 firm_login，
    把 JWT token 回傳給前端。
    """
    fb_api_base = settings.FB_API_URL.rstrip("/")

    if not settings.FB_FIRM_PASSWORD:
        raise HTTPException(status_code=500, detail="FB_FIRM_PASSWORD 未設定")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{fb_api_base}/api/v1/admin/firm_login",
                json={
                    "account": settings.FB_FIRM_ACCOUNT,
                    "password": settings.FB_FIRM_PASSWORD,
                },
                headers={"Content-Type": "application/json"},
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"無法連接 FB API: {e}") from e

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"FB firm_login 失敗: {response.text[:200]}",
        )

    return response.json()
