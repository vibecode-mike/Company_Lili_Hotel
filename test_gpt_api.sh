#!/bin/bash

# GPT Timer API 測試腳本
# 用於驗證後端 API 是否正常工作

set -e

echo "=========================================="
echo "GPT Timer API 測試腳本"
echo "=========================================="
echo ""

# 配置
BASE_URL="http://127.0.0.1:8700"
API_URL="${BASE_URL}/api/v1"

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 測試結果計數
PASS=0
FAIL=0

# 測試函數
test_api() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_code="$5"

    echo -n "測試: ${test_name}... "

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer test_token" \
            -d "$data" \
            "${API_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer test_token" \
            "${API_URL}${endpoint}")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_code, Got: $http_code)"
        echo "Response: $body"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

echo "步驟 1: 檢查後端服務健康狀態"
echo "----------------------------------------"
if curl -s "${BASE_URL}/health" | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} 後端服務正常運行"
else
    echo -e "${RED}✗${NC} 後端服務未運行或異常"
    exit 1
fi
echo ""

echo "步驟 2: 獲取測試會員資料"
echo "----------------------------------------"

# 獲取第一個會員 ID
MEMBER_ID=$(curl -s "${API_URL}/members?page=1&page_size=1" \
    -H "Authorization: Bearer test_token" | \
    grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MEMBER_ID" ]; then
    echo -e "${RED}✗${NC} 無法獲取測試會員 ID"
    echo "請確保資料庫中有會員資料"
    exit 1
fi

echo -e "${GREEN}✓${NC} 測試會員 ID: $MEMBER_ID"
echo ""

echo "步驟 3: 測試 GPT 設定 API"
echo "----------------------------------------"

# 獲取會員當前狀態
echo "3.1 獲取會員當前 gpt_enabled 狀態"
CURRENT_STATE=$(curl -s "${API_URL}/members/${MEMBER_ID}" \
    -H "Authorization: Bearer test_token" | \
    grep -o '"gpt_enabled":[^,}]*' | cut -d':' -f2)
echo "當前狀態: gpt_enabled = $CURRENT_STATE"
echo ""

# 測試 1: 設置 gpt_enabled = false
echo "3.2 測試設置 gpt_enabled = false"
test_api "設置 GPT 為關閉" \
    "PUT" \
    "/members/${MEMBER_ID}" \
    '{"gpt_enabled": false}' \
    "200"

# 驗證設置成功
VERIFY_STATE=$(curl -s "${API_URL}/members/${MEMBER_ID}" \
    -H "Authorization: Bearer test_token" | \
    grep -o '"gpt_enabled":[^,}]*' | cut -d':' -f2)
if [ "$VERIFY_STATE" = "false" ]; then
    echo -e "  ${GREEN}✓${NC} 驗證成功: gpt_enabled = false"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}✗${NC} 驗證失敗: gpt_enabled = $VERIFY_STATE (預期: false)"
    FAIL=$((FAIL + 1))
fi
echo ""

# 測試 2: 設置 gpt_enabled = true
echo "3.3 測試設置 gpt_enabled = true"
test_api "設置 GPT 為啟用" \
    "PUT" \
    "/members/${MEMBER_ID}" \
    '{"gpt_enabled": true}' \
    "200"

# 驗證設置成功
VERIFY_STATE=$(curl -s "${API_URL}/members/${MEMBER_ID}" \
    -H "Authorization: Bearer test_token" | \
    grep -o '"gpt_enabled":[^,}]*' | cut -d':' -f2)
if [ "$VERIFY_STATE" = "true" ]; then
    echo -e "  ${GREEN}✓${NC} 驗證成功: gpt_enabled = true"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}✗${NC} 驗證失敗: gpt_enabled = $VERIFY_STATE (預期: true)"
    FAIL=$((FAIL + 1))
fi
echo ""

# 測試 3: 多次快速切換（壓力測試）
echo "3.4 測試快速切換 GPT 狀態（壓力測試）"
for i in {1..5}; do
    test_api "快速切換 #$i (false)" \
        "PUT" \
        "/members/${MEMBER_ID}" \
        '{"gpt_enabled": false}' \
        "200" > /dev/null

    test_api "快速切換 #$i (true)" \
        "PUT" \
        "/members/${MEMBER_ID}" \
        '{"gpt_enabled": true}' \
        "200" > /dev/null
done
echo -e "${GREEN}✓${NC} 完成 5 次快速切換測試"
echo ""

echo "步驟 4: 測試聊天訊息發送 API"
echo "----------------------------------------"
test_api "發送聊天訊息" \
    "POST" \
    "/members/${MEMBER_ID}/chat/send" \
    '{"text": "API 測試訊息"}' \
    "200"
echo ""

echo "=========================================="
echo "測試結果總結"
echo "=========================================="
echo -e "通過: ${GREEN}${PASS}${NC} 個測試"
echo -e "失敗: ${RED}${FAIL}${NC} 個測試"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 所有測試通過！${NC}"
    echo ""
    echo "後端 API 工作正常，您可以開始前端測試了。"
    echo "前端測試指南：/data2/lili_hotel/test_gpt_timer.md"
    exit 0
else
    echo -e "${RED}✗ 有測試失敗，請檢查後端服務${NC}"
    exit 1
fi
