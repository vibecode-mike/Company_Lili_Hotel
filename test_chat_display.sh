#!/bin/bash

# 測試聊天顯示功能

echo "=========================================="
echo "測試聊天顯示功能"
echo "=========================================="

# 1. 檢查會員是否有 line_uid
echo -e "\n1. 檢查會員 7 的 LINE 綁定狀態："
mysql -u root -p123456 lili_hotel -e "SELECT id, username, line_uid FROM members WHERE id = 7;" 2>&1 | grep -v Warning

# 2. 檢查該會員的聊天記錄數量
echo -e "\n2. 檢查會員 7 的聊天記錄數量："
mysql -u root -p123456 lili_hotel -e "
    SELECT
        thread_id,
        COUNT(*) as message_count,
        COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as incoming_count,
        COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as outgoing_count
    FROM conversation_messages
    WHERE thread_id = 'U1357e6d9c1f91eb5d30b935dc960e54f'
    GROUP BY thread_id;
" 2>&1 | grep -v Warning

# 3. 測試 API 端點（需要 token）
echo -e "\n3. 測試聊天記錄 API（檢查回應格式）："
curl -s "http://127.0.0.1:8700/api/v1/members/7/chat-messages?page=1&page_size=3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"API 回應格式: code={data.get('code')}, has_data={bool(data.get('data'))}\")
if data.get('data'):
    messages = data['data'].get('messages', [])
    print(f\"訊息數量: {len(messages)}\")
    if messages:
        print(f\"第一筆訊息: id={messages[0].get('id')}, type={messages[0].get('type')}, source={messages[0].get('source')}\")
"

# 4. 查看最近的聊天記錄詳細內容
echo -e "\n4. 查看最近 5 筆聊天記錄："
mysql -u root -p123456 lili_hotel -e "
    SELECT
        id,
        direction,
        CASE
            WHEN direction = 'outgoing' THEN LEFT(response, 30)
            WHEN direction = 'incoming' THEN LEFT(question, 30)
        END as content,
        message_source,
        created_at
    FROM conversation_messages
    WHERE thread_id = 'U1357e6d9c1f91eb5d30b935dc960e54f'
    ORDER BY created_at DESC
    LIMIT 5;
" 2>&1 | grep -v Warning

echo -e "\n=========================================="
echo "測試完成"
echo "=========================================="
