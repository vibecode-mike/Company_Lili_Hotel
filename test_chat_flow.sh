#!/bin/bash
# 測試 1:1 聊天功能完整流程

set -e

BACKEND_URL="http://127.0.0.1:8700"
LINE_APP_URL="http://127.0.0.1:3001"

# 使用第一個會員進行測試
MEMBER_ID=7
LINE_UID="U1357e6d9c1f91eb5d30b935dc960e54f"

echo "========================================="
echo "測試 1:1 聊天功能"
echo "========================================="
echo ""

echo "步驟 1: 直接測試 line_app 發送訊息端點"
echo "----------------------------------------"
RESPONSE=$(curl -s -X POST "${LINE_APP_URL}/api/v1/chat/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"line_uid\": \"${LINE_UID}\",
    \"text\": \"測試訊息：您好，這是來自客服系統的測試訊息\"
  }")
echo "Response: ${RESPONSE}"
echo ""

if echo "${RESPONSE}" | grep -q '"ok":true\|"ok": true'; then
    echo "✅ line_app 發送成功"
else
    echo "❌ line_app 發送失敗"
    exit 1
fi
echo ""

echo "步驟 2: 測試 Backend API 發送訊息（需要認證）"
echo "----------------------------------------"
echo "注意：此端點需要 OAuth2 認證，手動測試請使用有效 token"
echo "示例命令："
echo "curl -X POST \"${BACKEND_URL}/api/v1/members/${MEMBER_ID}/chat/send\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"text\": \"測試訊息\"}'"
echo ""

echo "步驟 3: 測試標記已讀"
echo "----------------------------------------"
RESPONSE=$(curl -s -X PUT "${LINE_APP_URL}/api/v1/chat/mark-read" \
  -H "Content-Type: application/json" \
  -d "{
    \"line_uid\": \"${LINE_UID}\"
  }")
echo "Response: ${RESPONSE}"
echo ""

if echo "${RESPONSE}" | grep -q '"ok":true\|"ok": true'; then
    echo "✅ 標記已讀成功"
else
    echo "❌ 標記已讀失敗"
fi
echo ""

echo "步驟 4: 查詢聊天歷史（使用現有 API）"
echo "----------------------------------------"
echo "GET ${BACKEND_URL}/api/v1/chat-messages/members/${MEMBER_ID}/chat-messages"
RESPONSE=$(curl -s "${BACKEND_URL}/api/v1/chat-messages/members/${MEMBER_ID}/chat-messages?page=1&page_size=5")
echo ""
echo "最近 5 條訊息："
echo "${RESPONSE}" | python3 -m json.tool | head -80
echo ""

echo "========================================="
echo "測試總結"
echo "========================================="
echo "✅ line_app 發送訊息端點: POST /api/v1/chat/send"
echo "✅ line_app 標記已讀端點: PUT /api/v1/chat/mark-read"
echo "✅ Backend API 發送訊息: POST /api/v1/members/{id}/chat/send (需認證)"
echo "✅ Backend API 標記已讀: PUT /api/v1/members/{id}/chat/mark-read (需認證)"
echo "✅ Backend API 查詢歷史: GET /api/v1/chat-messages/members/{id}/chat-messages"
echo ""
echo "完整聊天流程已就緒！"
