import json
from app import push_campaign

"""
正確模式（你要的）：
- 聊天室：只出現一張 Flex 圖卡
- 手機通知列：顯示 notification_message
"""

if __name__ == "__main__":
    payload = {
        "type": "IMAGE_CARD",

        # 這行只會出現在「手機通知」，不會出現在聊天室
        "notification_message": "【手機通知】聖誕住房優惠 12/24–12/26 連住兩晚，再送聖誕驚喜小禮。",

        # 這行只會當 Flex 的 alt_text（聊天室氣泡不會顯示）
        "preview_message": "🎄 【聊天室預覽】聖誕節住房優惠中，最低享有八折！",

        # Flex 卡片內容
        "title": "聖誕節住房優惠",
        "text": "🎄 聖誕節連假住房 8 折起，點進來看房型與加碼贈品！",
        "image_url": "https://linebot.star-bit.io/uploads/christmas_test.jpg",
        "url": "https://www.star-bit.io/",
        "action_button_text": "立即查看聖誕優惠",

        "interaction_type": "open_url",
        "interaction_tags": ["聖誕節", "住房優惠", "連住折扣"],

        "target_audience": "all",
        "source_campaign_id": 20251225,
    }

    result = push_campaign(payload)
    print(json.dumps(result, ensure_ascii=False, indent=2))
