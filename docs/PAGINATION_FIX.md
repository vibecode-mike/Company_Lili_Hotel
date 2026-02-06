# 分頁修復：FB 外部 API 數據合併後正確分頁

## 🐛 問題描述

**症狀：** API 返回的消息數量超過 `page_size` 參數

**實際表現：**
- 請求 `page_size=20`
- 實際返回 `47` 條數據

**原因：**
在 `message_service.py` 的 `list_messages()` 方法中：
1. 先對本地 DB 查詢應用分頁（返回 20 條）
2. 然後添加所有 FB 外部 API 消息（27 條）
3. 結果：20 + 27 = 47 條

---

## ✅ 修復方案

### 原始代碼（錯誤）

```python
# 1. 對本地 DB 應用分頁
offset = max(page - 1, 0) * page_size
query = (
    base_query.order_by(Message.created_at.desc())
    .offset(offset)
    .limit(page_size)  # ❌ 過早分頁
)
result = await db.execute(query)
messages = result.scalars().all()

# 2. 添加 FB 消息（未分頁）
fb_sent_messages = await self._get_fb_sent_messages_from_api()
all_message_items = message_items + fb_sent_messages  # ❌ 導致總數超過 page_size
```

### 修復後代碼（正確）

```python
# 1. 獲取所有本地 DB 消息（不分頁）
query = base_query.order_by(Message.created_at.desc())
result = await db.execute(query)
messages = result.scalars().all()

# 2. 添加 FB 消息
fb_sent_messages = await self._get_fb_sent_messages_from_api()
all_message_items = message_items + fb_sent_messages

# 3. 按時間排序
all_message_items.sort(key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)

# 4. ✅ 在 Python 中應用分頁（合併後分頁）
offset = max(page - 1, 0) * page_size
paginated_items = all_message_items[offset:offset + page_size]
```

---

## 🎯 驗證結果

### 測試 1: 第一頁
```bash
curl 'http://localhost:8700/api/v1/messages?page=1&page_size=20'
```

**結果：**
```json
{
  "total": 129,
  "page": 1,
  "page_size": 20,
  "items_count": 20,  // ✅ 正確！（之前是 47）
  "fb_count": 18,
  "line_count": 2
}
```

### 測試 2: 第二頁
```bash
curl 'http://localhost:8700/api/v1/messages?page=2&page_size=20'
```

**結果：**
```json
{
  "total": 129,
  "page": 2,
  "page_size": 20,
  "items_count": 20,  // ✅ 正確
  "fb_count": 10,
  "line_count": 10
}
```

### 測試 3: 最後一頁（餘數）
```bash
curl 'http://localhost:8700/api/v1/messages?page=7&page_size=20'
```

**結果：**
```json
{
  "total": 129,
  "page": 7,
  "page_size": 20,
  "items_count": 9,  // ✅ 正確處理餘數（129 - 120 = 9）
  "fb_count": 0,
  "line_count": 9
}
```

---

## 📊 性能考慮

### 當前方案（內存分頁）

**優點：**
- 實現簡單
- 確保數據一致性
- 正確排序混合數據源

**缺點：**
- 需要加載所有本地 DB 消息到內存
- 對於大數據集（10,000+ 消息）可能影響性能

### 未來優化方案（如需要）

如果數據集增長到影響性能，可以考慮：

#### 方案 A: FB API 結果緩存
```python
@lru_cache(maxsize=1)
@timed_cache(seconds=300)  # 5 分鐘緩存
async def _get_fb_sent_messages_from_api(self):
    # ... 獲取 FB 消息
```

**優點：** 減少 FB API 調用次數

#### 方案 B: 分頁緩存
```python
# 緩存每頁的結果
cache_key = f"messages:page{page}:size{page_size}"
cached_result = await redis.get(cache_key)
if cached_result:
    return cached_result
```

**優點：** 提高重複請求速度

#### 方案 C: 異步預加載
```python
# 後台任務定期同步 FB 消息到本地 DB
@background_task(interval="5m")
async def sync_fb_messages():
    fb_messages = await get_fb_sent_messages()
    # 保存到本地緩存表
```

**優點：** 完全避免實時 API 調用

---

## 📝 修改文件

**主要修改：**
- `backend/app/services/message_service.py`
  - Line 689-702: 移除數據庫層面的分頁
  - Line 747-763: 添加合併後的 Python 分頁邏輯

**影響範圍：**
- API 端點：`GET /api/v1/messages`
- 前端頁面：活動與訊息推播列表

---

## 🚀 部署步驟

### 1. 更新代碼
```bash
cd /data2/lili_hotel
git pull origin multichannel
```

### 2. 重啟後端
```bash
fuser -k 8700/tcp
source venv/bin/activate
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8700 > /tmp/backend.log 2>&1 &
```

### 3. 驗證
```bash
# 測試第一頁
curl 'http://localhost:8700/api/v1/messages?page=1&page_size=20' | jq '.data.items | length'
# 應返回：20

# 測試最後一頁
curl 'http://localhost:8700/api/v1/messages?page=7&page_size=20' | jq '.data.items | length'
# 應返回：9
```

---

## 🔗 相關文檔

- **方案 B 實施：** `docs/SOLUTION_B_IMPLEMENTATION.md`
- **架構對比：** `docs/ARCHITECTURE_COMPARISON.md`
- **故障排查：** `docs/TROUBLESHOOTING_NO_DISPLAY.md`

---

**記錄時間：** 2026-01-23 19:30
**修復人員：** Claude
**狀態：** ✅ 已修復並驗證
