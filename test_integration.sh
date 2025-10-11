#!/bin/bash

echo "=== 力麗飯店 Campaign 功能整合測試 ==="
echo ""

# 1. 測試後端 API
echo "1. 測試後端 API..."
RESPONSE=$(curl -s http://127.0.0.1:8700/api/v1/campaigns)
COUNT=$(echo $RESPONSE | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "   ✅ 後端 API 正常，返回 $COUNT 筆資料"
else
    echo "   ❌ 後端 API 有問題"
    exit 1
fi

# 2. 測試資料庫
echo "2. 測試資料庫..."
DB_COUNT=$(mysql -u root -p123456 -se "SELECT COUNT(*) FROM lili_hotel.campaigns;" 2>/dev/null)
echo "   ✅ 資料庫有 $DB_COUNT 筆資料"

# 3. 檢查前端服務
echo "3. 檢查前端服務..."
if curl -s http://localhost:5174 > /dev/null; then
    echo "   ✅ 前端服務運行中 (http://localhost:5174)"
else
    echo "   ❌ 前端服務未運行"
fi

# 4. 顯示範例數據
echo ""
echo "4. 範例數據:"
echo $RESPONSE | python3 -m json.tool 2>/dev/null | head -20

echo ""
echo "=== 測試完成 ==="
echo ""
echo "請訪問: http://localhost:5174/campaigns"
echo "如果看不到數據，請："
echo "1. 打開瀏覽器開發者工具 (F12)"
echo "2. 查看 Console 標籤的錯誤訊息"
echo "3. 查看 Network 標籤確認 API 請求是否成功"
echo "4. 清除瀏覽器緩存 (Ctrl+Shift+R 或 Cmd+Shift+R)"
