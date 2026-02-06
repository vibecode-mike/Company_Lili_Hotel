# 快速參考指南

**最後更新：** 2026-01-23 19:35

---

## 🚀 常用操作

### 啟動服務

#### 後端啟動
```bash
# 1. 進入項目目錄
cd /data2/lili_hotel

# 2. 激活虛擬環境
source venv/bin/activate

# 3. 檢查端口是否被占用
lsof -i :8700

# 4. 如果被占用，先停止
fuser -k 8700/tcp

# 5. 啟動後端
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8700 > /tmp/backend.log 2>&1 &

# 6. 驗證啟動成功（等待 5 秒）
sleep 5
curl http://localhost:8700/api/v1/messages | jq '.code'
# 預期：200

# 7. 查看日誌
tail -f /tmp/backend.log
```

#### 前端啟動
```bash
# 1. 進入前端目錄
cd /data2/lili_hotel/frontend

# 2. 啟動開發服務器
npm run dev

# 3. 訪問
# http://localhost:5174/
```

---

## 📊 API 測試

### 基礎測試
```bash
# 測試 API 是否響應
curl -s http://localhost:8700/api/v1/messages | jq '.code'

# 獲取消息列表
curl -s 'http://localhost:8700/api/v1/messages?page=1&page_size=20' | jq '{
  code,
  total: .data.total,
  page: .data.page,
  page_size: .data.page_size,
  items_count: (.data.items | length)
}'

# 統計平台分佈
curl -s 'http://localhost:8700/api/v1/messages?page=1&page_size=100' | jq '{
  total: .data.total,
  fb_count: [.data.items[] | select(.platform == "Facebook")] | length,
  line_count: [.data.items[] | select(.platform == "LINE")] | length,
  status_counts: .data.status_counts
}'
```

### 狀態篩選測試
```bash
# 篩選已發送消息（需要 URL 編碼）
# 已發送 = %E5%B7%B2%E7%99%BC%E9%80%81
curl -s 'http://localhost:8700/api/v1/messages?send_status=%E5%B7%B2%E7%99%BC%E9%80%81&page=1&page_size=20' | jq '{
  code,
  total: .data.total,
  items_count: (.data.items | length)
}'

# 篩選草稿（需要 URL 編碼）
# 草稿 = %E8%8D%89%E7%A8%BF
curl -s 'http://localhost:8700/api/v1/messages?send_status=%E8%8D%89%E7%A8%BF&page=1&page_size=20' | jq '{
  code,
  total: .data.total
}'
```

### 分頁測試
```bash
# 測試第 1 頁
curl -s 'http://localhost:8700/api/v1/messages?page=1&page_size=20' | jq '.data.page, .data.items | length'

# 測試第 2 頁
curl -s 'http://localhost:8700/api/v1/messages?page=2&page_size=20' | jq '.data.page, .data.items | length'

# 測試最後一頁
curl -s 'http://localhost:8700/api/v1/messages?page=7&page_size=20' | jq '.data.page, .data.items | length'
```

---

## 🔍 故障排查

### 後端無法啟動

#### 檢查端口占用
```bash
# 查看端口占用情況
lsof -i :8700

# 或使用 netstat
netstat -tulpn | grep 8700

# 強制停止占用進程
fuser -k 8700/tcp
```

#### 檢查錯誤日誌
```bash
# 查看最近 50 行日誌
tail -50 /tmp/backend.log

# 搜索錯誤
grep -i "error" /tmp/backend.log | tail -20

# 搜索警告
grep -i "warning" /tmp/backend.log | tail -20

# 實時監控日誌
tail -f /tmp/backend.log
```

#### 常見錯誤

**1. 導入錯誤**
```
ModuleNotFoundError: No module named 'xxx'
```
**解決：** 檢查導入路徑，確認包已安裝
```bash
pip install -r requirements.txt
```

**2. 端口被占用**
```
ERROR: [Errno 98] Address already in use
```
**解決：** 停止占用進程
```bash
fuser -k 8700/tcp
```

**3. 數據庫連接失敗**
```
sqlalchemy.exc.OperationalError
```
**解決：** 檢查數據庫配置和連接
```bash
# 檢查 .env 文件
cat backend/.env | grep DATABASE_URL
```

### 前端無法顯示

#### 檢查 API 連接
```bash
# 測試後端是否正常
curl http://localhost:8700/api/v1/messages | jq '.code'

# 檢查前端環境變量
cat frontend/.env.development
```

#### 檢查瀏覽器控制台
1. 打開瀏覽器開發者工具（F12）
2. 查看 Console 選項卡
3. 查看 Network 選項卡

#### 常見問題

**1. 404 Not Found**
- 後端未啟動
- API 路徑錯誤
- 端口配置錯誤

**2. CORS 錯誤**
- 檢查後端 CORS 配置
- 確認 API_BASE_URL 正確

**3. WebSocket 錯誤**
```
SecurityError: An insecure WebSocket connection may not be initiated
```
- 確認 VITE_WS_PORT 為空（通過 nginx）
- 確認 nginx 配置 WebSocket 代理

---

## 📝 日誌查看

### 後端日誌
```bash
# 實時查看
tail -f /tmp/backend.log

# 搜索特定關鍵詞
grep "FB" /tmp/backend.log | tail -20

# 查看啟動信息
grep -E "Uvicorn running|Application startup|Started server" /tmp/backend.log
```

### Nginx 日誌
```bash
# 錯誤日誌
sudo tail -f /var/log/nginx/error.log

# 訪問日誌
sudo tail -f /var/log/nginx/access.log
```

---

## 🔐 密碼和配置

### 後端配置
```bash
# 查看配置（不顯示密碼）
cat backend/.env | grep -v PASSWORD

# 測試配置是否正確
cd backend
python -c "from app.config import settings; print(f'FB API URL: {settings.FB_API_URL}'); print(f'FB Firm Account: {settings.FB_FIRM_ACCOUNT}')"
```

### 前端配置
```bash
# 開發環境
cat frontend/.env.development

# 生產環境
cat frontend/.env.production
```

---

## 🧪 測試腳本

### 完整 API 測試腳本
```bash
#!/bin/bash

echo "=== API 測試開始 ==="

# 1. 基礎連接測試
echo -e "\n1. 測試基礎連接..."
CODE=$(curl -s http://localhost:8700/api/v1/messages | jq -r '.code')
if [ "$CODE" == "200" ]; then
  echo "✅ API 響應正常"
else
  echo "❌ API 響應異常: $CODE"
  exit 1
fi

# 2. 分頁測試
echo -e "\n2. 測試分頁..."
PAGE1_COUNT=$(curl -s 'http://localhost:8700/api/v1/messages?page=1&page_size=20' | jq '.data.items | length')
if [ "$PAGE1_COUNT" == "20" ]; then
  echo "✅ 第 1 頁返回 20 條"
else
  echo "⚠️ 第 1 頁返回 $PAGE1_COUNT 條"
fi

# 3. 平台統計測試
echo -e "\n3. 測試平台統計..."
STATS=$(curl -s 'http://localhost:8700/api/v1/messages?page=1&page_size=100' | jq '{
  total: .data.total,
  fb: [.data.items[] | select(.platform == "Facebook")] | length,
  line: [.data.items[] | select(.platform == "LINE")] | length
}')
echo "📊 統計結果: $STATS"

# 4. FB 外部 API 集成測試
echo -e "\n4. 測試 FB 外部 API 集成..."
FB_LOG=$(grep "✅ 從 FB 外部 API 獲取" /tmp/backend.log | tail -1)
if [ ! -z "$FB_LOG" ]; then
  echo "✅ FB 外部 API 集成正常"
  echo "   $FB_LOG"
else
  echo "⚠️ 未找到 FB API 調用日誌"
fi

echo -e "\n=== API 測試完成 ==="
```

保存為 `test_api.sh`，執行：
```bash
chmod +x test_api.sh
./test_api.sh
```

---

## 📦 Git 操作

### 查看狀態
```bash
# 查看修改文件
git status

# 查看差異
git diff

# 查看最近 5 次提交
git log --oneline -5
```

### 提交代碼
```bash
# 添加修改的文件
git add backend/app/services/message_service.py
git add frontend/src/contexts/MessagesContext.tsx

# 提交
git commit -m "feat: 實施方案 B - 後端完全代理 FB API"

# 推送到遠程
git push origin multichannel
```

---

## 📋 檢查清單

### 開發環境啟動檢查
- [ ] 後端虛擬環境已激活
- [ ] 端口 8700 未被占用
- [ ] 後端服務啟動成功
- [ ] API 返回 HTTP 200
- [ ] 前端服務啟動成功
- [ ] 瀏覽器能訪問 http://localhost:5174/
- [ ] 控制台無錯誤

### 功能測試檢查
- [ ] 消息列表正常顯示
- [ ] FB 消息正常顯示（27 條）
- [ ] LINE 消息正常顯示
- [ ] 分頁功能正常（20 條/頁）
- [ ] 狀態篩選功能正常
- [ ] 狀態統計正確

### 部署前檢查
- [ ] 所有測試通過
- [ ] 代碼已提交到 Git
- [ ] 文檔已更新
- [ ] .env 文件配置正確
- [ ] 數據庫遷移已執行
- [ ] Nginx 配置已更新

---

## 🆘 緊急聯絡

### 相關文檔
- `docs/SOLUTION_B_COMPLETION.md` - 實施完成報告
- `docs/SOLUTION_B_IMPLEMENTATION.md` - 實施指南
- `docs/TROUBLESHOOTING_NO_DISPLAY.md` - 故障排查
- `docs/WEBSOCKET_HTTPS_FIX.md` - WebSocket 修復

### 常用命令速查
```bash
# 後端重啟
fuser -k 8700/tcp && cd /data2/lili_hotel && source venv/bin/activate && nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8700 > /tmp/backend.log 2>&1 &

# 查看後端日誌
tail -f /tmp/backend.log

# 測試 API
curl http://localhost:8700/api/v1/messages | jq '.code'

# 前端重啟
cd /data2/lili_hotel/frontend && npm run dev
```

---

**創建時間：** 2026-01-23 19:35
**適用版本：** Solution B
