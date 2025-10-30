import json
from app import broadcast_message #群發
from app import push_campaign

if __name__ == "__main__":
    payload = {
        "type": "IMAGE_CARD",
        "title": "雙十快樂優惠",
        "notification_text": "連住兩晚 85 折｜含早餐",
        "image_url": "https://linebot.star-bit.io/uploads/banner_20251020.jpg?v=20251020",
        "url": "https://www.star-bit.io/",         # ← 原本是 action_url，改成 url
        "action_button_text": "查看詳情",
        "interaction_type": "open_url",            # ← 建議補上，確保按鈕可點且走追蹤
        "target_audience": "all",
        "source_campaign_id": 180  # ← 活動ID，只用來測試
    }
    result = push_campaign(payload)  # ← 改成逐一推播（每人都會帶 uid/cid）
    print(result)
