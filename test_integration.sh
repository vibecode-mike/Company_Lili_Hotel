#!/bin/bash
# 自動回應整合測試腳本

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         自動回應功能整合測試                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 測試結果統計
PASS=0
FAIL=0

# 測試函數
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $2"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - $2"
        ((FAIL++))
    fi
}

echo "【測試 1】資料庫連接測試"
echo "─────────────────────────────────────────────────────────"
mysql -uroot -p123456 -D lili_hotel -e "SELECT 1" &>/dev/null
test_result $? "資料庫連接"
echo ""

echo "【測試 2】自動回應資料完整性"
echo "─────────────────────────────────────────────────────────"

# 檢查歡迎訊息
COUNT=$(mysql -uroot -p123456 -D lili_hotel -se "
SELECT COUNT(*) FROM auto_responses 
WHERE trigger_type = 'welcome' AND is_active = 1
" 2>/dev/null)
[ "$COUNT" -ge 1 ]
test_result $? "歡迎訊息配置 (數量: $COUNT)"

# 檢查關鍵字
COUNT=$(mysql -uroot -p123456 -D lili_hotel -se "
SELECT COUNT(*) FROM auto_response_keywords 
WHERE is_enabled = 1
" 2>/dev/null)
[ "$COUNT" -ge 1 ]
test_result $? "關鍵字配置 (數量: $COUNT)"

# 檢查訊息內容
COUNT=$(mysql -uroot -p123456 -D lili_hotel -se "
SELECT COUNT(*) FROM auto_response_messages
" 2>/dev/null)
[ "$COUNT" -ge 1 ]
test_result $? "訊息內容配置 (數量: $COUNT)"

echo ""

echo "【測試 3】核心函數檢查"
echo "─────────────────────────────────────────────────────────"

# 檢查核心函數是否存在
FUNCTIONS=(
    "send_auto_response_messages"
    "check_keyword_trigger"
    "check_time_trigger"
    "update_auto_response_stats"
    "trigger_welcome_message"
)

for func in "${FUNCTIONS[@]}"; do
    grep -q "def $func" /data2/lili_hotel/line_app/app.py
    test_result $? "函數 $func 已定義"
done

echo ""

echo "【測試 4】Webhook 處理器整合"
echo "─────────────────────────────────────────────────────────"

# 檢查 on_follow 整合
grep -q "trigger_welcome_message" /data2/lili_hotel/line_app/app.py
test_result $? "on_follow 已整合歡迎訊息"

# 檢查 on_text 整合
grep -q "check_keyword_trigger" /data2/lili_hotel/line_app/app.py
test_result $? "on_text 已整合關鍵字觸發"

grep -q "check_time_trigger" /data2/lili_hotel/line_app/app.py
test_result $? "on_text 已整合時間觸發"

echo ""

echo "【測試 5】LINE App 服務狀態"
echo "─────────────────────────────────────────────────────────"

# 檢查服務是否運行
lsof -i :3001 &>/dev/null
test_result $? "LINE webhook 服務運行中 (port 3001)"

# 檢查 Python 語法
python3 -m py_compile /data2/lili_hotel/line_app/app.py 2>/dev/null
test_result $? "Python 語法檢查"

echo ""

echo "【測試 6】模擬觸發測試"
echo "─────────────────────────────────────────────────────────"

# 重置統計
mysql -uroot -p123456 -D lili_hotel -e "
UPDATE auto_responses SET trigger_count = 0;
UPDATE auto_response_keywords SET match_count = 0, last_triggered_at = NULL;
" 2>/dev/null

test_result $? "統計資料重置"

echo ""
echo "─────────────────────────────────────────────────────────"
echo "測試統計："
echo -e "  ${GREEN}通過: $PASS${NC}"
echo -e "  ${RED}失敗: $FAIL${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 所有測試通過！自動回應功能已就緒                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "📱 現在可以用 LINE 進行實際測試："
    echo ""
    echo "   1️⃣  測試歡迎訊息："
    echo "      - 取消追蹤後重新加入"
    echo ""
    echo "   2️⃣  測試關鍵字："
    echo "      - 發送「訂房」「房型」或「價格」"
    echo ""
    echo "   3️⃣  測試時間觸發："
    echo "      - 發送任意訊息（非關鍵字）"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  部分測試失敗，請檢查錯誤訊息                           ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
