#!/bin/bash
# 測試排程自動發送功能
# 用法: ./test_scheduled_send.sh

set -e

BASE_URL="http://127.0.0.1:8700/api/v1"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}測試排程自動發送功能${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 計算 2 分鐘後的時間（台灣本地時間，不使用 UTC）
SCHEDULED_TIME=$(date -d "+2 minutes" +"%Y-%m-%d %H:%M:%S")
echo -e "${YELLOW}📅 排程時間設定為 2 分鐘後: ${SCHEDULED_TIME}${NC}"
echo ""

# Step 1: 建立排程訊息
echo -e "${BLUE}Step 1: 建立排程訊息${NC}"
echo "----------------------------------------"

CAMPAIGN_DATA=$(cat <<EOF
{
  "message_title": "測試排程自動發送 - $(date '+%H:%M:%S')",
  "notification_message": "這是一則排程測試訊息，將在 2 分鐘後自動發送",
  "schedule_type": "scheduled",
  "scheduled_at": "${SCHEDULED_TIME}",
  "target_type": "all_friends",
  "target_filter": {},
  "flex_message_json": "{\"type\":\"bubble\",\"body\":{\"type\":\"box\",\"layout\":\"vertical\",\"contents\":[{\"type\":\"text\",\"text\":\"排程測試訊息\",\"weight\":\"bold\",\"size\":\"xl\"},{\"type\":\"text\",\"text\":\"此訊息應該在排程時間自動發送\",\"wrap\":true,\"margin\":\"md\"}]}}"
}
EOF
)

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/messages" \
  -H "Content-Type: application/json" \
  -d "$CAMPAIGN_DATA")

CAMPAIGN_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')

if [ "$CAMPAIGN_ID" = "null" ] || [ -z "$CAMPAIGN_ID" ]; then
  echo -e "${RED}❌ 建立排程訊息失敗${NC}"
  echo "$CREATE_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✅ 成功建立排程訊息 ID: ${CAMPAIGN_ID}${NC}"
echo "$CREATE_RESPONSE" | jq '{id, message_title, send_status, scheduled_at}'
echo ""

# Step 2: 驗證排程狀態
echo -e "${BLUE}Step 2: 驗證排程狀態${NC}"
echo "----------------------------------------"

CAMPAIGN_DETAIL=$(curl -s "${BASE_URL}/messages/${CAMPAIGN_ID}")
SEND_STATUS=$(echo "$CAMPAIGN_DETAIL" | jq -r '.send_status')

if [ "$SEND_STATUS" = "已排程" ]; then
  echo -e "${GREEN}✅ 訊息狀態正確: ${SEND_STATUS}${NC}"
else
  echo -e "${RED}❌ 訊息狀態錯誤: ${SEND_STATUS} (預期: 已排程)${NC}"
  exit 1
fi

echo "$CAMPAIGN_DETAIL" | jq '{id, message_title, send_status, scheduled_at, send_count}'
echo ""

# Step 3: 檢查排程器任務
echo -e "${BLUE}Step 3: 檢查排程器任務列表${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📋 查看應用程式日誌以確認排程任務已註冊${NC}"
echo -e "${YELLOW}預期日誌: 'Campaign ${CAMPAIGN_ID} scheduled for...'${NC}"
echo ""

# Step 4: 等待自動發送
echo -e "${BLUE}Step 4: 等待自動發送 (2 分鐘倒數)${NC}"
echo "----------------------------------------"

for i in {120..1}; do
  printf "\r${YELLOW}⏳ 剩餘時間: %02d:%02d${NC}" $((i/60)) $((i%60))
  sleep 1
done
echo ""
echo ""

# 額外等待 10 秒確保發送完成
echo -e "${YELLOW}⏳ 額外等待 10 秒確保發送處理完成...${NC}"
sleep 10
echo ""

# Step 5: 驗證發送結果
echo -e "${BLUE}Step 5: 驗證發送結果${NC}"
echo "----------------------------------------"

FINAL_DETAIL=$(curl -s "${BASE_URL}/messages/${CAMPAIGN_ID}")
FINAL_STATUS=$(echo "$FINAL_DETAIL" | jq -r '.send_status')
SEND_COUNT=$(echo "$FINAL_DETAIL" | jq -r '.send_count')
SEND_TIME=$(echo "$FINAL_DETAIL" | jq -r '.send_time')

echo "最終狀態:"
echo "$FINAL_DETAIL" | jq '{id, message_title, send_status, send_count, send_time, scheduled_at}'
echo ""

# 判斷測試結果
if [ "$FINAL_STATUS" = "已發送" ] && [ "$SEND_COUNT" != "null" ] && [ "$SEND_COUNT" != "0" ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ 測試通過！${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}發送狀態: ${FINAL_STATUS}${NC}"
  echo -e "${GREEN}發送數量: ${SEND_COUNT}${NC}"
  echo -e "${GREEN}發送時間: ${SEND_TIME}${NC}"
  echo ""
  echo -e "${GREEN}✅ 排程自動發送功能正常運作${NC}"
elif [ "$FINAL_STATUS" = "發送失敗" ]; then
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}❌ 測試失敗 - 發送失敗${NC}"
  echo -e "${RED}========================================${NC}"
  echo -e "${YELLOW}請檢查應用程式日誌以了解失敗原因${NC}"
  exit 1
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}❌ 測試失敗 - 未自動發送${NC}"
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}發送狀態: ${FINAL_STATUS}${NC}"
  echo -e "${RED}發送數量: ${SEND_COUNT}${NC}"
  echo -e "${YELLOW}可能原因:${NC}"
  echo -e "${YELLOW}1. 排程器未正確啟動${NC}"
  echo -e "${YELLOW}2. 排程任務未註冊${NC}"
  echo -e "${YELLOW}3. 發送邏輯執行失敗${NC}"
  echo ""
  echo -e "${YELLOW}請檢查應用程式日誌: journalctl -u lili_hotel_backend -f${NC}"
  exit 1
fi

# Step 6: 檢查日誌
echo ""
echo -e "${BLUE}Step 6: 建議檢查日誌${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}查看最近 50 行後端日誌:${NC}"
echo -e "${YELLOW}journalctl -u lili_hotel_backend -n 50${NC}"
echo ""
echo -e "${YELLOW}即時監控日誌:${NC}"
echo -e "${YELLOW}journalctl -u lili_hotel_backend -f${NC}"
echo ""
echo -e "${YELLOW}預期看到的日誌:${NC}"
echo -e "${YELLOW}  🚀 Executing scheduled campaign ${CAMPAIGN_ID}${NC}"
echo -e "${YELLOW}  ✅ Campaign ${CAMPAIGN_ID} sent successfully to N users${NC}"
