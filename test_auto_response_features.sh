#!/bin/bash
# 測試自動回應功能

API_BASE="http://127.0.0.1:8700/api/v1"

echo "=========================================="
echo "自動回應功能測試"
echo "=========================================="

# 獲取 token
echo ""
echo "1. 登入獲取 Token..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123")

TOKEN=$(echo $TOKEN_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 登入失敗: $TOKEN_RESPONSE"
  exit 1
fi
echo "✅ 登入成功"

# 測試 1: 歡迎訊息衝突檢測
echo ""
echo "=========================================="
echo "2. 測試歡迎訊息衝突檢測"
echo "=========================================="

# 建立第一個歡迎訊息
echo "建立第一個歡迎訊息..."
WELCOME1=$(curl -s -X POST "$API_BASE/auto_responses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試歡迎訊息1",
    "trigger_type": "welcome",
    "messages": ["歡迎光臨！"],
    "is_active": true,
    "channel_id": "test_channel_001"
  }')
WELCOME1_ID=$(echo $WELCOME1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)
echo "第一個歡迎訊息 ID: $WELCOME1_ID"

# 建立第二個歡迎訊息（應該檢測到衝突）
echo ""
echo "建立第二個歡迎訊息（相同 channel_id）..."
WELCOME2=$(curl -s -X POST "$API_BASE/auto_responses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試歡迎訊息2",
    "trigger_type": "welcome",
    "messages": ["歡迎光臨2！"],
    "is_active": true,
    "channel_id": "test_channel_001"
  }')

CONFLICT=$(echo $WELCOME2 | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('conflict',False))" 2>/dev/null)
if [ "$CONFLICT" = "True" ]; then
  echo "✅ 歡迎訊息衝突檢測正常"
else
  echo "⚠️  歡迎訊息衝突檢測結果: $WELCOME2"
fi

# 測試 2: 一律回應日期重疊檢測
echo ""
echo "=========================================="
echo "3. 測試一律回應日期重疊檢測"
echo "=========================================="

# 建立第一個一律回應
echo "建立第一個一律回應..."
ALWAYS1=$(curl -s -X POST "$API_BASE/auto_responses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試一律回應1",
    "trigger_type": "follow",
    "messages": ["感謝您的訊息！"],
    "is_active": true,
    "date_range_start": "2025-01-01",
    "date_range_end": "2025-01-31",
    "channel_id": "test_channel_001"
  }')
ALWAYS1_ID=$(echo $ALWAYS1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)
echo "第一個一律回應 ID: $ALWAYS1_ID"

# 建立第二個一律回應（日期重疊）
echo ""
echo "建立第二個一律回應（日期重疊）..."
ALWAYS2=$(curl -s -X POST "$API_BASE/auto_responses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試一律回應2",
    "trigger_type": "follow",
    "messages": ["感謝您的訊息2！"],
    "is_active": true,
    "date_range_start": "2025-01-15",
    "date_range_end": "2025-02-15",
    "channel_id": "test_channel_001"
  }')

CONFLICT2=$(echo $ALWAYS2 | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('conflict',False))" 2>/dev/null)
if [ "$CONFLICT2" = "True" ]; then
  echo "✅ 一律回應日期重疊檢測正常"
else
  echo "⚠️  一律回應日期重疊檢測結果: $ALWAYS2"
fi

# 測試 3: 重複關鍵字檢測
echo ""
echo "=========================================="
echo "4. 測試重複關鍵字檢測"
echo "=========================================="

# 建立第一個關鍵字自動回應
echo "建立第一個關鍵字自動回應（關鍵字: 優惠, 折扣）..."
KW1=$(curl -s -X POST "$API_BASE/auto_responses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試關鍵字1",
    "trigger_type": "keyword",
    "keywords": ["優惠", "折扣"],
    "messages": ["目前有優惠活動！"],
    "is_active": true
  }')
KW1_ID=$(echo $KW1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)
echo "第一個關鍵字自動回應 ID: $KW1_ID"

# 建立第二個關鍵字自動回應（包含重複關鍵字）
echo ""
echo "建立第二個關鍵字自動回應（關鍵字: 優惠, 促銷）..."
KW2=$(curl -s -X POST "$API_BASE/auto_responses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試關鍵字2",
    "trigger_type": "keyword",
    "keywords": ["優惠", "促銷"],
    "messages": ["歡迎參加促銷活動！"],
    "is_active": true
  }')
KW2_ID=$(echo $KW2 | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)
echo "第二個關鍵字自動回應 ID: $KW2_ID"

# 查詢第一個關鍵字自動回應，檢查 is_duplicate 標記
echo ""
echo "檢查第一個自動回應的關鍵字 is_duplicate 標記..."
KW1_DETAIL=$(curl -s -X GET "$API_BASE/auto_responses/$KW1_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "第一個自動回應詳情:"
echo $KW1_DETAIL | python3 -c "
import sys,json
d=json.load(sys.stdin)
keywords = d.get('data',{}).get('keywords',[])
for kw in keywords:
    print(f\"  - {kw.get('keyword')}: is_duplicate={kw.get('is_duplicate', False)}\")"

# 測試 4: 獲取自動回應列表，確認 channels 和 channel_id
echo ""
echo "=========================================="
echo "5. 測試 API 回應格式"
echo "=========================================="

LIST=$(curl -s -X GET "$API_BASE/auto_responses" \
  -H "Authorization: Bearer $TOKEN")
echo "自動回應列表 (前 3 筆):"
echo $LIST | python3 -c "
import sys,json
d=json.load(sys.stdin)
items = d.get('data',[])[:3]
for item in items:
    print(f\"  - {item.get('name')}: channel_id={item.get('channel_id')}, trigger_type={item.get('trigger_type')}\")"

# 清理測試資料
echo ""
echo "=========================================="
echo "6. 清理測試資料"
echo "=========================================="

for ID in $WELCOME1_ID $ALWAYS1_ID $KW1_ID $KW2_ID; do
  if [ ! -z "$ID" ] && [ "$ID" != "None" ]; then
    curl -s -X DELETE "$API_BASE/auto_responses/$ID" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
    echo "已刪除 ID: $ID"
  fi
done

echo ""
echo "=========================================="
echo "測試完成"
echo "=========================================="
