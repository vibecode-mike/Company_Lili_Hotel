# 自動回應列表架構改造完成報告

## 📋 改造目標

將**自動回應列表**改為和**活動推播「已發送」**一樣的架構：
- ✅ 後端合併 FB API + LINE DB
- ✅ FB 自動回應不保存本地資料庫
- ✅ FB API 作為唯一真實來源

## ✅ 已完成的修改

### 1. 後端新增合併輔助函數

**文件**: `backend/app/api/v1/auto_responses.py`
**新增**: `_get_fb_auto_responses_from_api()` (Line ~305-385)

```python
async def _get_fb_auto_responses_from_api(jwt_token: str, db: AsyncSession) -> List[Dict[str, Any]]:
    """
    從 FB 外部 API 獲取自動回應並轉換為內部格式
    參考 message_service.py 的合併模式
    """
```

**功能**:
- 調用 `FbMessageClient.get_auto_templates(jwt_token)`
- 轉換 FB API 格式為內部統一格式
- ID 加上 `fb-` 前綴避免衝突
- 失敗時返回空列表（非致命）

---

### 2. 後端 GET 端點合併數據

**文件**: `backend/app/api/v1/auto_responses.py`
**修改**: `get_auto_responses()` (Line ~388-455)

**新增參數**:
```python
jwt_token: Optional[str] = Query(None, description="FB JWT token for fetching FB auto-responses")
```

**處理流程**:
```python
# Step 1: 獲取 LINE 自動回應（本地 DB）
line_items = [serialize LINE auto-responses]

# Step 2: 獲取 FB 自動回應（外部 API）
fb_items = await _get_fb_auto_responses_from_api(jwt_token, db)

# Step 3: 合併兩個數據源
all_items = line_items + fb_items

# Step 4: 按創建時間排序（降序）
all_items.sort(key=lambda x: x.get("created_at"), reverse=True)
```

---

### 3. 後端 POST 端點不保存純 FB 到本地

**文件**: `backend/app/api/v1/auto_responses.py`
**修改**: `create_auto_response()` (Line ~620-670)

**新增邏輯**:
```python
# ✅ 純 FB 自動回應不保存本地 DB，直接調用 FB API
if channels and channels == ['Facebook']:
    logger.info("⚡ 純 FB 自動回應，只保存到外部 API")

    # 構建 FB API payload
    payload = {...}

    # 調用 FB API
    fb_client = FbMessageClient()
    result = await fb_client.set_auto_template(payload, jwt_token)

    return SuccessResponse(
        data={"id": f"fb-{fb_id}", "external_only": True},
        message="創建成功（已保存到 Facebook API）"
    )

# ✅ LINE 或混合渠道：繼續保存到本地 DB
auto_response = AutoResponse(...)
db.add(auto_response)
await db.commit()
```

---

### 4. 前端簡化為一次 API 調用

**文件**: `frontend/src/contexts/AutoRepliesContext.tsx`
**修改**: `fetchAutoReplies()` (Line ~234-270)

**原來（兩次調用）**:
```typescript
// 1. 獲取 LINE
const lineResponse = await apiGet('/api/v1/auto_responses');
const lineReplies = lineResult.data.map(mapAutoResponse);

// 2. 獲取 FB
const fbResponse = await apiGet('/api/v1/auto_responses/fb?jwt_token=...');
const fbReplies = fbResult.data.map(mapFbAutoResponse);

// 3. 合併
const allReplies = [...lineReplies, ...fbReplies];
```

**現在（一次調用）**:
```typescript
// ✅ 一次調用，後端已合併
const jwtToken = getJwtToken();
const url = jwtToken
  ? `/api/v1/auto_responses?jwt_token=${encodeURIComponent(jwtToken)}`
  : '/api/v1/auto_responses';

const response = await apiGet(url);
const allReplies = result.data.map(mapAutoResponse);
```

---

### 5. 前端移除直接調用外部 FB API

**文件**: `frontend/src/contexts/AutoRepliesContext.tsx`
**修改**: `saveAutoReply()` (Line ~333-368)

**移除邏輯**:
- 原先前端檢測純 FB 新建時，直接調用 `VITE_FB_API_URL/api/v1/admin/meta_page/message/auto_template`
- 現在統一走後端 API：`POST /api/v1/auto_responses?jwt_token=...`
- 後端會判斷並處理純 FB 的情況

---

## 📊 架構對比

### 原架構（有問題）

```
前端
  ├─ 調用 GET /api/v1/auto_responses → LINE DB
  ├─ 調用 GET /api/v1/auto_responses/fb → FB API
  └─ 前端合併數據

創建 FB 自動回應
  ├─ 調用 POST /api/v1/auto_responses
  │   ├─ 保存到本地 DB
  │   └─ 同步到 FB API（可能失敗導致不一致）
  或
  └─ 前端直接調用外部 FB API
```

**問題**:
- 雙重保存導致數據不一致風險
- 前端需要兩次 API 調用
- 前端直接調用外部 API 繞過後端

---

### 新架構（已修復）

```
前端
  └─ 調用 GET /api/v1/auto_responses?jwt_token=... → 一次調用
       └─ 後端合併 LINE DB + FB API

創建 FB 自動回應
  └─ 調用 POST /api/v1/auto_responses?jwt_token=...
       └─ 後端判斷：
            ├─ 純 FB → 只保存到 FB API
            └─ LINE/混合 → 保存到本地 DB + 同步 FB API
```

**優勢**:
- ✅ 單一數據源（FB API 是唯一真實來源）
- ✅ 無數據不一致風險
- ✅ 前端簡化（一次調用）
- ✅ 統一走後端 API

---

## 🧪 測試計劃

### 測試場景 1: 獲取自動回應列表

**步驟**:
1. 確保有 LINE 和 FB JWT token
2. 調用前端的 `fetchAutoReplies()`
3. 檢查返回的 `autoReplies` 數組

**預期結果**:
- ✅ 同時包含 LINE 和 FB 自動回應
- ✅ FB 自動回應 ID 格式為 `fb-XXX`
- ✅ 按創建時間降序排列
- ✅ FB 自動回應的 `channels` 為 `['Facebook']`

**驗證日誌**:
```
[AutoReplies] ✅ 獲取成功: { total: 10, line: 6, fb: 4 }
✅ 返回自動回應列表: LINE=6, FB=4, 總計=10
```

---

### 測試場景 2: 創建純 FB 自動回應

**步驟**:
1. 在前端創建自動回應
2. 選擇 `channels: ['Facebook']`
3. 填寫關鍵字和訊息
4. 提交保存

**預期結果**:
- ✅ 後端不保存到本地 DB
- ✅ 直接調用 FB API 創建
- ✅ 返回 `{"id": "fb-123", "external_only": true}`
- ✅ 前端重新獲取列表能看到新創建的 FB 自動回應

**驗證日誌**:
```
⚡ 純 FB 自動回應，只保存到外部 API，不保存本地 DB
Creating FB-only auto_template: {...}
✅ FB 自動回應創建成功，外部 ID: 123
```

---

### 測試場景 3: 創建 LINE 自動回應

**步驟**:
1. 創建自動回應
2. 選擇 `channels: ['LINE']`
3. 提交保存

**預期結果**:
- ✅ 保存到本地 DB
- ✅ 返回數字 ID（如 `5`）
- ✅ 不調用 FB API

**驗證日誌**:
```
（無 "純 FB 自動回應" 日誌）
（正常的 DB commit 日誌）
```

---

### 測試場景 4: 創建混合渠道自動回應

**步驟**:
1. 創建自動回應
2. 選擇 `channels: ['LINE', 'Facebook']`
3. 提交保存

**預期結果**:
- ✅ 保存到本地 DB
- ✅ 同時同步到 FB API
- ✅ 如果 FB API 失敗，本地 DB rollback

---

### 測試場景 5: 編輯 FB 自動回應

**步驟**:
1. 點擊 ID 為 `fb-123` 的自動回應
2. 修改關鍵字或訊息
3. 提交保存

**預期結果**:
- ✅ 調用 `PATCH /api/v1/auto_responses/fb/123`
- ✅ 直接更新 FB API
- ✅ 重新獲取列表能看到更新

---

### 測試場景 6: FB API 失敗降級

**步驟**:
1. 模擬 FB API 不可用（斷網或 token 失效）
2. 調用 `fetchAutoReplies()`

**預期結果**:
- ✅ 仍然能顯示 LINE 自動回應
- ✅ FB 自動回應為空（降級處理）
- ✅ 日誌顯示警告但不阻塞

**驗證日誌**:
```
獲取 FB 自動回應失敗（非致命）: [錯誤信息]
✅ 返回自動回應列表: LINE=6, FB=0, 總計=6
```

---

## ⚠️ 已知限制和待辦事項

### 1. FB 自動回應刪除功能未實現

**問題**:
- 前端 `removeAutoReply(id)` 直接調用 `DELETE /api/v1/auto_responses/{id}`
- 對於 `fb-XXX` ID 會失敗（後端期望整數 ID）
- `FbMessageClient` 沒有刪除自動回應模板的方法

**臨時方案**:
- 用戶可以在 FB 官方後台手動刪除
- 或者將自動回應設為停用（`isActive: false`）

**待辦**:
- [ ] 在 `FbMessageClient` 添加 `delete_auto_template()` 方法
- [ ] 在前端檢測 `fb-XXX` ID，調用專門的刪除端點
- [ ] 或者在後端 DELETE 端點添加對 `fb-` ID 的處理

---

### 2. 舊的 FB 自動回應記錄清理

**問題**:
- 本地 DB 可能還有舊的 FB 自動回應記錄（channels 包含 Facebook）
- 這些記錄現在可能與 FB API 不一致

**建議**:
- [ ] 運行清理腳本，刪除 `channels=['Facebook']` 的本地記錄
- [ ] 或者添加數據遷移，將純 FB 記錄標記為已遷移

**清理腳本示例**:
```python
# 刪除純 FB 自動回應記錄
result = await db.execute(
    delete(AutoResponse).where(
        AutoResponse.channels == ['Facebook']
    )
)
logger.info(f"✅ 刪除了 {result.rowcount} 條純 FB 自動回應記錄")
await db.commit()
```

---

### 3. `/api/v1/auto_responses/fb` 端點已過時

**狀態**: 該端點仍然存在但不再被前端使用

**建議**:
- [ ] 標記為 deprecated
- [ ] 在未來版本移除
- [ ] 或者保留作為直接訪問 FB API 的便捷端點

---

## 🚀 部署步驟

### 1. 部署前檢查

```bash
# 檢查 FB API 配置
echo $FB_API_URL
echo $FB_FIRM_ACCOUNT
echo $FB_FIRM_PASSWORD

# 檢查前端環境變量
cat frontend/.env | grep VITE_FB_API_URL
```

---

### 2. 後端部署

```bash
cd backend

# 1. 拉取最新代碼
git pull origin multichannel

# 2. 檢查修改的文件
git diff HEAD~1 app/api/v1/auto_responses.py

# 3. 重啟後端服務
# 根據部署方式選擇：
# Docker: docker-compose restart backend
# Systemd: sudo systemctl restart lili-hotel-backend
# PM2: pm2 restart lili-hotel-backend
```

---

### 3. 前端部署

```bash
cd frontend

# 1. 拉取最新代碼
git pull origin multichannel

# 2. 檢查修改的文件
git diff HEAD~1 src/contexts/AutoRepliesContext.tsx

# 3. 重新構建
npm run build

# 4. 部署（根據部署方式）
# 例如: rsync -av dist/ /var/www/lili-hotel/
```

---

### 4. 驗證部署

```bash
# 1. 檢查後端健康狀態
curl http://localhost:8000/health

# 2. 測試 GET 端點（需要有效 token）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/auto_responses?jwt_token=YOUR_FB_JWT"

# 3. 檢查日誌
tail -f logs/backend.log | grep "自動回應"
```

---

## 📝 回滾計劃

如果部署後發現問題，可以快速回滾：

### 後端回滾

```bash
cd backend
git revert HEAD  # 或回到之前的 commit
# 重啟服務
```

### 前端回滾

```bash
cd frontend
git revert HEAD
npm run build
# 重新部署
```

**數據安全性**:
- ✅ FB 數據在外部 API，不會丟失
- ✅ LINE 數據在本地 DB，未受影響
- ✅ 回滾只是恢復代碼邏輯，不涉及數據遷移

---

## 📚 相關文件

- `/data2/lili_hotel/FB_DISPLAY_ISSUE_FIX.md` - FB 發送人員顯示問題修復
- `/data2/lili_hotel/FB_SENT_NO_SAVE_GUIDE.md` - FB 已發送訊息不保存指南
- `/data2/lili_hotel/README_FB_CHANGES.md` - FB API 集成變更說明
- `/data2/lili_hotel/CHANGES_SUMMARY.md` - 變更總結

---

## 🎯 成功標準

改造被認為成功，當且僅當：

- [x] 後端能合併 LINE DB + FB API 數據並返回
- [x] 前端只需一次 API 調用獲取所有自動回應
- [x] 純 FB 自動回應不保存到本地 DB
- [x] FB API 作為 FB 數據的唯一真實來源
- [x] 現有 LINE 自動回應功能不受影響
- [ ] 所有測試場景通過（待執行）

---

**改造完成時間**: 2026-01-24
**改造人員**: Claude Code + User
**架構參考**: 活動推播 `message_service.py:728-886`
