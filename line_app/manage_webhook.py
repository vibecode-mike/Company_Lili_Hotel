#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
manage_webhook.py
用途：
  1) 設定 LINE Webhook URL
  2) 啟用 Use webhook
  3) 讀回目前的 webhook 設定（驗證網址是否變更）

使用範例：
  單一路徑（不帶 channel_id）：
    python manage_webhook.py \
      --channel-id 2005363092 \
      --access-token 'YOUR_LONG_LIVED_CHANNEL_ACCESS_TOKEN' \
      --base 'https://linebot.star-bit.io/callback'

  每客戶一條（自動把 channel_id 接在最後）：
    python manage_webhook.py \
      --channel-id 2005363092 \
      --access-token 'YOUR_LONG_LIVED_CHANNEL_ACCESS_TOKEN' \
      --base 'https://linebot.star-bit.io/callback' \
      --with-id
"""
import argparse
import json
import sys
import requests


LINE_SET_ENDPOINT = "https://api.line.me/v2/bot/channel/webhook/endpoint"
LINE_ENABLE = "https://api.line.me/v2/bot/channel/webhook/enable"
LINE_GET = "https://api.line.me/v2/bot/channel/webhook/endpoint"


def set_and_enable_webhook(channel_id: str, access_token: str, base_url: str, with_id: bool):
    """
    回傳 dict：
      {
        "webhook_url": "...",
        "set_status": 200,
        "enable_status": 200,
        "current": {...GET 回傳...}
      }
    """
    webhook_url = f"{base_url.rstrip('/')}"
    if with_id:
        webhook_url += f"/{channel_id}"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # STEP 1: 設定 endpoint
    r1 = requests.put(LINE_SET_ENDPOINT, headers=headers, json={"endpoint": webhook_url}, timeout=10)
    # STEP 2: 啟用 webhook
    r2 = requests.put(LINE_ENABLE, headers=headers, timeout=10)
    # STEP 3: 讀回目前設定
    r3 = requests.get(LINE_GET, headers=headers, timeout=10)

    try:
        current = r3.json()
    except Exception:
        current = {"raw": r3.text}

    return {
        "webhook_url": webhook_url,
        "set_status": r1.status_code,
        "enable_status": r2.status_code,
        "get_status": r3.status_code,
        "current": current,
    }


def main():
    ap = argparse.ArgumentParser(description="設定並啟用 LINE Webhook URL")
    ap.add_argument("--channel-id", required=True, help="Messaging API 的 Channel ID")
    ap.add_argument("--access-token", required=True, help="Messaging API 的『長期』Channel Access Token")
    ap.add_argument("--base", required=True, help="Webhook 基底網址，例如 https://linebot.star-bit.io/callback")
    ap.add_argument("--with-id", action="store_true", help="是否把 channel_id 接在 base 後面（/callback/<channel_id>）")
    args = ap.parse_args()

    try:
        result = set_and_enable_webhook(
            channel_id=args.channel_id,
            access_token=args.access_token,
            base_url=args.base,
            with_id=args.with_id,
        )
    except requests.RequestException as e:
        print(f"[ERROR] 呼叫 LINE API 失敗：{e}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(result, ensure_ascii=False, indent=2))

    ok = result["set_status"] == 200 and result["enable_status"] == 200 and result["get_status"] == 200
    if not ok:
        print("[WARN] 不是全部 200，請檢查 access_token 是否為 Messaging API 的長期 token、base URL 是否可外部存取。", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
