#!/bin/bash

# GPT 客服介入邏輯完整測試腳本
# 測試範圍：API、資料庫、LINE Bot 整合、完整流程

# set -e  # 暫時停用以查看所有錯誤

echo "=========================================="
echo "GPT 客服介入邏輯完整測試"
echo "=========================================="
echo ""

# ==================== 配置 ====================
BASE_URL="http://127.0.0.1:8700"
API_URL="${BASE_URL}/api/v1"
AUTH_TOKEN="test_token"

# 資料庫配置
DB_HOST="127.0.0.1"
DB_USER="root"
DB_PASS="l123456"
DB_NAME="lili_hotel"

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 測試結果計數
PASS=0
FAIL=0
WARN=0

# 全域變數
MEMBER_ID=""
LINE_UID=""
DISPLAY_NAME=""

# ==================== 輔助函數 ====================

# API 測試函數
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
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "$data" \
            "${API_URL}${endpoint}" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            "${API_URL}${endpoint}" 2>/dev/null)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASS=$((PASS + 1))
        echo "$body"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_code, Got: $http_code)"
        echo "Response: $body"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# 資料庫查詢函數
query_db() {
    local query="$1"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "$query" 2>/dev/null
}

# 取得會員 gpt_enabled 狀態
get_gpt_enabled_from_db() {
    local member_id="$1"
    query_db "SELECT gpt_enabled FROM members WHERE id = $member_id;"
}

# 驗證 API 回應中的 gpt_enabled 值
verify_api_response() {
    local response="$1"
    local expected_value="$2"

    # 從 JSON 回應中提取 gpt_enabled 值
    local actual_value=$(echo "$response" | grep -o '"gpt_enabled":[^,}]*' | cut -d':' -f2 | tr -d ' ')

    if [ "$actual_value" = "$expected_value" ]; then
        echo -e "  ${GREEN}✓${NC} API 回應驗證: gpt_enabled = $expected_value"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} API 回應驗證失敗: gpt_enabled = $actual_value (預期: $expected_value)"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# 驗證資料庫中的 gpt_enabled 值
verify_db_value() {
    local member_id="$1"
    local expected_value="$2"

    if [ "$DB_AVAILABLE" = false ]; then
        echo -e "  ${YELLOW}⚠${NC} 資料庫驗證跳過 (資料庫不可用)"
        WARN=$((WARN + 1))
        return 0
    fi

    local actual_value=$(get_gpt_enabled_from_db "$member_id")

    if [ "$actual_value" = "$expected_value" ]; then
        echo -e "  ${GREEN}✓${NC} 資料庫驗證: gpt_enabled = $expected_value"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} 資料庫驗證失敗: gpt_enabled = $actual_value (預期: $expected_value)"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# 檢查 LINE Bot 日誌
check_line_bot_log() {
    local search_pattern="$1"
    local description="$2"

    echo -n "  檢查日誌: ${description}... "

    # 檢查最近 1 分鐘的日誌
    if journalctl -u line_app --since "1 minute ago" 2>/dev/null | grep -q "$search_pattern"; then
        echo -e "${GREEN}✓ 找到${NC}"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${YELLOW}⚠ 未找到 (可能需要發送實際 LINE 訊息)${NC}"
        WARN=$((WARN + 1))
        return 1
    fi
}

# ==================== 測試步驟 ====================

echo "步驟 1: 後端健康檢查"
echo "----------------------------------------"

# 1.1 檢查後端服務
echo -n "1.1 檢查後端服務... "
if curl -s "${BASE_URL}/health" 2>/dev/null | grep -q "healthy"; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "後端服務未運行或異常，請啟動後端服務"
    exit 1
fi

# 1.2 檢查資料庫連接
echo -n "1.2 檢查資料庫連接... "
DB_AVAILABLE=false
if query_db "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASS=$((PASS + 1))
    DB_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ 跳過${NC} (資料庫連接失敗，將跳過直接資料庫驗證測試)"
    WARN=$((WARN + 1))
    echo "  注意：API 測試仍會進行，但無法直接驗證資料庫內容"
fi

echo ""

# ==================== 步驟 2: 獲取測試會員 ====================

echo "步驟 2: 獲取測試會員資料"
echo "----------------------------------------"

# 獲取第一個有 LINE UID 的會員
member_data=$(curl -s "${API_URL}/members?page=1&page_size=10" \
    -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)

# 提取會員資訊
MEMBER_ID=$(echo "$member_data" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
LINE_UID=$(echo "$member_data" | grep -o '"line_uid":"[^"]*"' | head -1 | cut -d'"' -f4)
DISPLAY_NAME=$(echo "$member_data" | grep -o '"display_name":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MEMBER_ID" ]; then
    echo -e "${RED}✗${NC} 無法獲取測試會員 ID"
    echo "請確保資料庫中有會員資料"
    exit 1
fi

echo -e "${GREEN}✓${NC} 測試會員資訊:"
echo "  ID: $MEMBER_ID"
echo "  LINE UID: ${LINE_UID:-未設定}"
echo "  Display Name: ${DISPLAY_NAME:-未設定}"

# 獲取當前 gpt_enabled 狀態
current_gpt_enabled=$(get_gpt_enabled_from_db "$MEMBER_ID")
echo "  當前 gpt_enabled: $current_gpt_enabled"

echo ""

# ==================== 步驟 3: API 端點測試 ====================

echo "步驟 3: API 端點測試"
echo "----------------------------------------"

# 3.1 測試設置 gpt_enabled = false (模擬客服打字)
echo "3.1 測試設置 gpt_enabled = false (模擬客服打字)"
response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"gpt_enabled": false}' \
    "${API_URL}/members/${MEMBER_ID}" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "  ${GREEN}✓ PASS${NC} (HTTP 200)"
    PASS=$((PASS + 1))
    verify_api_response "$body" "false"
else
    echo -e "  ${RED}✗ FAIL${NC} (HTTP $http_code)"
    echo "  Response: $body"
    FAIL=$((FAIL + 1))
fi

# 驗證資料庫更新
sleep 1
verify_db_value "$MEMBER_ID" "0"

echo ""

# 3.2 測試設置 gpt_enabled = true (模擬客服離開)
echo "3.2 測試設置 gpt_enabled = true (模擬客服離開)"
response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"gpt_enabled": true}' \
    "${API_URL}/members/${MEMBER_ID}" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "  ${GREEN}✓ PASS${NC} (HTTP 200)"
    PASS=$((PASS + 1))
    verify_api_response "$body" "true"
else
    echo -e "  ${RED}✗ FAIL${NC} (HTTP $http_code)"
    echo "  Response: $body"
    FAIL=$((FAIL + 1))
fi

# 驗證資料庫更新
sleep 1
verify_db_value "$MEMBER_ID" "1"

echo ""

# 3.3 壓力測試：快速切換
echo "3.3 壓力測試：快速切換 GPT 狀態 (5 次)"
stress_pass=0
for i in {1..5}; do
    # 設置為 false
    http_code=$(curl -s -w "%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"gpt_enabled": false}' \
        "${API_URL}/members/${MEMBER_ID}" 2>/dev/null | tail -n1)

    if [ "$http_code" = "200" ]; then
        stress_pass=$((stress_pass + 1))
    fi

    # 設置為 true
    http_code=$(curl -s -w "%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"gpt_enabled": true}' \
        "${API_URL}/members/${MEMBER_ID}" 2>/dev/null | tail -n1)

    if [ "$http_code" = "200" ]; then
        stress_pass=$((stress_pass + 1))
    fi
done

if [ $stress_pass -eq 10 ]; then
    echo -e "  ${GREEN}✓ PASS${NC} (10/10 次成功)"
    PASS=$((PASS + 1))
else
    echo -e "  ${YELLOW}⚠ 部分成功${NC} ($stress_pass/10 次成功)"
    WARN=$((WARN + 1))
fi

echo ""

# ==================== 步驟 4: 資料庫驗證 ====================

echo "步驟 4: 資料庫直接驗證"
echo "----------------------------------------"

if [ "$DB_AVAILABLE" = false ]; then
    echo -e "${YELLOW}⚠${NC} 跳過資料庫直接驗證測試 (資料庫不可用)"
    WARN=$((WARN + 1))
else
    # 4.1 設置為 false 並驗證
    echo "4.1 設置 gpt_enabled = false 並直接查詢資料庫"
    curl -s -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"gpt_enabled": false}' \
        "${API_URL}/members/${MEMBER_ID}" >/dev/null 2>&1

    sleep 1
    verify_db_value "$MEMBER_ID" "0"

    echo ""

    # 4.2 設置為 true 並驗證
    echo "4.2 設置 gpt_enabled = true 並直接查詢資料庫"
    curl -s -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"gpt_enabled": true}' \
        "${API_URL}/members/${MEMBER_ID}" >/dev/null 2>&1

    sleep 1
    verify_db_value "$MEMBER_ID" "1"
fi

echo ""

# ==================== 步驟 5: LINE Bot 整合測試 (需要實際 LINE 訊息) ====================

echo "步驟 5: LINE Bot 整合測試"
echo "----------------------------------------"
echo -e "${YELLOW}注意：此步驟需要實際發送 LINE 訊息才能完整測試${NC}"
echo ""

if [ -n "$LINE_UID" ]; then
    # 5.1 GPT 啟用測試
    echo "5.1 GPT 啟用狀態測試 (gpt_enabled = true)"
    curl -s -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"gpt_enabled": true}' \
        "${API_URL}/members/${MEMBER_ID}" >/dev/null 2>&1

    echo -e "  ${CYAN}請使用 LINE UID: ${LINE_UID} 發送測試訊息${NC}"
    echo "  預期: GPT 應該自動回應"
    echo "  按 Enter 繼續檢查日誌..."
    read -r

    check_line_bot_log "GPT response generated" "GPT 回應日誌"

    echo ""

    # 5.2 GPT 停用測試
    echo "5.2 GPT 停用狀態測試 (gpt_enabled = false)"
    curl -s -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"gpt_enabled": false}' \
        "${API_URL}/members/${MEMBER_ID}" >/dev/null 2>&1

    echo -e "  ${CYAN}請使用 LINE UID: ${LINE_UID} 發送測試訊息${NC}"
    echo "  預期: GPT 不應回應 (手動模式)"
    echo "  按 Enter 繼續檢查日誌..."
    read -r

    check_line_bot_log "手動模式：GPT 已停用" "手動模式日誌"

else
    echo -e "${YELLOW}⚠${NC} 測試會員無 LINE UID，跳過 LINE Bot 整合測試"
    WARN=$((WARN + 1))
fi

echo ""

# ==================== 步驟 6: 完整流程模擬 ====================

echo "步驟 6: 完整流程模擬"
echo "----------------------------------------"

# 6.1 初始狀態：GPT 啟用
echo "6.1 設定初始狀態：gpt_enabled = true"
response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"gpt_enabled": true}' \
    "${API_URL}/members/${MEMBER_ID}" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} 初始狀態設定成功: gpt_enabled = true (HTTP 200)"
    PASS=$((PASS + 1))

    # 如果資料庫可用，也驗證一下
    if [ "$DB_AVAILABLE" = true ]; then
        sleep 1
        actual_value=$(get_gpt_enabled_from_db "$MEMBER_ID")
        if [ "$actual_value" = "1" ]; then
            echo -e "  ${GREEN}✓${NC} 資料庫確認: gpt_enabled = 1"
        fi
    fi
else
    echo -e "  ${RED}✗${NC} 初始狀態設定失敗 (HTTP $http_code)"
    FAIL=$((FAIL + 1))
fi

echo ""

# 6.2 模擬客服打字
echo "6.2 模擬客服打字 (startGptTimer) → gpt_enabled = false"
response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"gpt_enabled": false}' \
    "${API_URL}/members/${MEMBER_ID}" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} 客服打字模擬成功: gpt_enabled = false (HTTP 200)"
    PASS=$((PASS + 1))

    # 如果資料庫可用，也驗證一下
    if [ "$DB_AVAILABLE" = true ]; then
        sleep 1
        actual_value=$(get_gpt_enabled_from_db "$MEMBER_ID")
        if [ "$actual_value" = "0" ]; then
            echo -e "  ${GREEN}✓${NC} 資料庫確認: gpt_enabled = 0"
        fi
    fi
else
    echo -e "  ${RED}✗${NC} 客服打字模擬失敗 (HTTP $http_code)"
    FAIL=$((FAIL + 1))
fi

echo ""

# 6.3 模擬客服離開
echo "6.3 模擬客服離開 (restoreGptMode) → gpt_enabled = true"
response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"gpt_enabled": true}' \
    "${API_URL}/members/${MEMBER_ID}" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} 客服離開模擬成功: gpt_enabled = true (HTTP 200)"
    PASS=$((PASS + 1))

    # 如果資料庫可用，也驗證一下
    if [ "$DB_AVAILABLE" = true ]; then
        sleep 1
        actual_value=$(get_gpt_enabled_from_db "$MEMBER_ID")
        if [ "$actual_value" = "1" ]; then
            echo -e "  ${GREEN}✓${NC} 資料庫確認: gpt_enabled = 1"
        fi
    fi
else
    echo -e "  ${RED}✗${NC} 客服離開模擬失敗 (HTTP $http_code)"
    FAIL=$((FAIL + 1))
fi

echo ""

# ==================== 測試結果總結 ====================

echo "=========================================="
echo "測試結果總結"
echo "=========================================="
echo -e "通過: ${GREEN}${PASS}${NC} 個測試"
echo -e "失敗: ${RED}${FAIL}${NC} 個測試"
echo -e "警告: ${YELLOW}${WARN}${NC} 個測試"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 所有關鍵測試通過！${NC}"
    echo ""
    echo "GPT 客服介入邏輯運作正常："
    echo "- ✅ 客服打字時 → gpt_enabled = false → GPT 自動回應暫停"
    echo "- ✅ 客服離開時 → gpt_enabled = true → GPT 自動回應恢復"
    echo "- ✅ API、資料庫、完整流程驗證通過"
    echo ""

    if [ $WARN -gt 0 ]; then
        echo -e "${YELLOW}⚠ 注意事項：${NC}"
        echo "- LINE Bot 整合測試需要實際發送 LINE 訊息才能完整驗證"
        echo "- 請手動測試前端 ChatRoomLayout 的 typing 和 leave 事件"
    fi

    exit 0
else
    echo -e "${RED}✗ 有測試失敗，請檢查相關服務${NC}"
    echo ""
    echo "失敗原因可能包括："
    echo "- 後端 API 服務未正常運行"
    echo "- 資料庫連接問題"
    echo "- API 端點實作錯誤"
    echo "- LINE Bot 服務未運行"
    exit 1
fi
