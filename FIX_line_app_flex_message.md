# 修復 line_app 忽略 flex_message_json 的問題

## 修復日期
2025-11-20

## 問題描述

**症狀**: 群發訊息的觸發圖片按鈕無法正常運作,即使 FlexMessage JSON 儲存到資料庫是正確的。

**根本原因**:
line_app 的 `push_campaign()` 函數完全忽略 Backend 傳送的 `flex_message_json` 欄位,而是使用內建的舊模板系統重新構建訊息,導致前端精心生成的 FlexMessage JSON (包含觸發圖片 URL) 被捨棄。

---

## 問題流程分析

### 原本的錯誤流程

```
✅ Frontend
   └─> 生成正確的 FlexMessage JSON (包含觸發圖片 URL)
   └─> POST /api/v1/messages

✅ Backend 資料庫
   └─> 儲存 flex_message_json 欄位 (正確)

✅ Backend 發送
   └─> 讀取 message.flex_message_json
   └─> 解析 JSON
   └─> 調用 LineAppClient.broadcast_message()
   └─> HTTP POST http://localhost:3001/api/v1/messages/broadcast
       Payload: {
         "flex_message_json": { ... 完整的 FlexMessage JSON ... },
         "target_audience": "all",
         "alt_text": "新訊息"
       }

❌ line_app 處理 (問題所在)
   └─> api_broadcast() 接收 payload ✅
   └─> 調用 push_campaign(payload) ✅
   └─> ❌ 忽略 payload["flex_message_json"]
   └─> ❌ 調用 build_user_messages_from_payload()
   └─> ❌ 使用舊模板系統重新構建訊息
   └─> ❌ 觸發圖片 URL 遺失
   └─> 發送到 LINE API

❌ 結果
   └─> 用戶收到的訊息不包含觸發圖片 URL
   └─> 按鈕無法正常運作
```

---

## 修復內容

### 修改檔案
**檔案**: `/data2/lili_hotel/line_app/app.py`
**函數**: `push_campaign()`
**行號**: 約 1417-1472

### 修改前的邏輯

```python
def push_campaign(payload: dict):
    # ... 會員查詢 ...

    for uid in user_line_uids:
        try:
            # ❌ 直接使用舊模板系統
            msgs = build_user_messages_from_payload(payload, cid, uid)
            flex_msg = msgs[0]

            # 發送
            api.push_message(to=uid, messages=[flex_msg])
```

**問題**:
- 完全忽略 `payload["flex_message_json"]`
- 使用 `build_user_messages_from_payload()` 重建訊息
- 重建的訊息不包含前端生成的觸發圖片 URL

---

### 修改後的邏輯

```python
def push_campaign(payload: dict):
    # ... 會員查詢 ...

    for uid in user_line_uids:
        try:
            # ✅ 優先使用前端生成的 flex_message_json
            if "flex_message_json" in payload and payload["flex_message_json"]:
                # 直接使用完整的 FlexMessage JSON
                flex_dict = payload["flex_message_json"]
                alt_txt = notification_message or preview_message or payload.get("title", "通知")

                try:
                    fc = FlexContainer.from_dict(flex_dict)
                    flex_msg = FlexMessage(alt_text=alt_txt, contents=fc)
                except Exception as e:
                    logging.error(f"Failed to parse flex_message_json: {e}")
                    failed += 1
                    continue
            else:
                # ✅ Fallback: 使用舊模板系統 (向後相容)
                msgs = build_user_messages_from_payload(payload, cid, uid)
                if not msgs:
                    logging.warning("No messages generated")
                    failed += 1
                    continue
                flex_msg = msgs[0]
                alt_txt = notification_message or preview_message or payload.get("title", "通知")
                flex_msg.alt_text = alt_txt

            # 發送
            api.push_message(to=uid, messages=[flex_msg])
```

**改進**:
- ✅ 優先檢查 `payload["flex_message_json"]` 是否存在
- ✅ 如果存在,直接使用前端生成的完整 FlexMessage JSON
- ✅ 使用 `FlexContainer.from_dict()` 解析 JSON
- ✅ 保留舊模板系統作為 fallback (向後相容)
- ✅ 新增錯誤處理,防止解析失敗

---

## 修復後的正確流程

```
✅ Frontend
   └─> 生成正確的 FlexMessage JSON (包含觸發圖片 URL)

✅ Backend 資料庫
   └─> 儲存 flex_message_json 欄位 (正確)

✅ Backend 發送
   └─> HTTP POST 傳送完整的 flex_message_json

✅ line_app 處理 (已修復)
   └─> 檢查 payload["flex_message_json"] 是否存在
   └─> ✅ 存在 → 直接使用 (不重建)
   └─> ✅ FlexContainer.from_dict(flex_message_json)
   └─> ✅ 創建 FlexMessage(alt_text, contents)
   └─> ✅ 發送到 LINE API (包含觸發圖片 URL)

✅ 結果
   └─> 用戶收到完整的 FlexMessage
   └─> 觸發圖片按鈕正常運作
```

---

## 向後相容性

### 舊系統支援 ✅

如果 payload 中沒有 `flex_message_json` 欄位,系統會自動使用舊模板系統:

```python
else:
    # Fallback: 使用舊模板系統
    msgs = build_user_messages_from_payload(payload, cid, uid)
    flex_msg = msgs[0]
```

**適用場景**:
- 舊版本前端發送的訊息
- 透過其他 API 發送的訊息
- 使用舊模板格式的訊息

---

## 技術細節

### FlexContainer.from_dict() 處理

LINE Bot SDK 的 `FlexContainer.from_dict()` 方法會:
1. 解析 FlexMessage JSON 字典
2. 驗證結構是否符合 LINE API 規範
3. 創建對應的 FlexContainer 物件 (Bubble 或 Carousel)
4. 保留所有原始欄位,包括:
   - `hero.url` (主圖片 URL)
   - `button.action.uri` (按鈕 URL,包括觸發圖片 URL)
   - `button.action.type` (動作類型: uri, message, postback)

### 錯誤處理

```python
try:
    fc = FlexContainer.from_dict(flex_dict)
    flex_msg = FlexMessage(alt_text=alt_txt, contents=fc)
except Exception as e:
    logging.error(f"Failed to parse flex_message_json: {e}")
    failed += 1
    continue
```

**保護機制**:
- 如果 JSON 格式錯誤,記錄錯誤並跳過該用戶
- 不會因為單一用戶的錯誤而中斷整個群發流程
- 錯誤計數器 `failed` 會增加,方便追蹤

---

## 測試驗證

### 測試步驟

1. **建立群發訊息**
   - 進入前端「建立群發訊息」頁面
   - 上傳主圖片
   - 填寫標題、內容

2. **設定觸發圖片按鈕**
   - 啟用按鈕 1
   - 選擇「觸發圖片」作為按鈕動作
   - 上傳一張測試圖片
   - 觀察圖片預覽是否正確

3. **發布訊息**
   - 點擊「發布」按鈕
   - 觀察前端是否顯示「發布成功」
   - 檢查瀏覽器控制台是否有錯誤

4. **LINE 驗證**
   - 打開 LINE 應用
   - 查看收到的訊息
   - 點擊觸發圖片按鈕
   - **預期**: 按鈕會開啟圖片 URL

### 驗證 URL 格式

**觸發圖片按鈕的 FlexMessage JSON**:
```json
{
  "type": "bubble",
  "footer": {
    "contents": [
      {
        "type": "button",
        "action": {
          "type": "uri",
          "label": "查看圖片",
          "uri": "https://linebot.star-bit.io/uploads/20251120_abc123.jpg"
        },
        "style": "primary"
      }
    ]
  }
}
```

**檢查要點**:
- ✅ `action.type` 為 "uri"
- ✅ `action.uri` 為完整的 HTTPS URL
- ✅ URL 指向上傳的圖片檔案

---

## 日誌監控

### 查看 line_app 日誌

```bash
# 查看即時日誌
tail -f /data2/lili_hotel/line_app/app.log

# 搜尋錯誤
grep -i "error\|failed" /data2/lili_hotel/line_app/app.log | tail -20

# 搜尋 flex_message_json 處理
grep "flex_message_json" /data2/lili_hotel/line_app/app.log | tail -20
```

### 成功發送的日誌範例

```
[1/100] Sending to U1234567890 (member_id=123)
✓ Success to U1234567890
[2/100] Sending to U0987654321 (member_id=456)
✓ Success to U0987654321
...
[Broadcast Done] sent=100, failed=0
```

### 錯誤日誌範例

```
[1/100] Failed to parse flex_message_json: 'NoneType' object has no attribute 'get'
[2/100] ✗ Failed to U1234567890: Invalid FlexMessage format
```

---

## 相關檔案

| 檔案 | 修改內容 | 狀態 |
|-----|---------|------|
| `line_app/app.py` | push_campaign() 函數 (1417-1472 行) | ✅ 已修改 |
| `frontend/src/components/MessageCreation.tsx` | 圖片上傳和 FlexMessage 生成 | ✅ 已修改 |
| `backend/app/services/message_service.py` | 讀取和傳送 flex_message_json | ✅ 無需修改 |
| `backend/app/clients/line_app_client.py` | HTTP POST payload | ✅ 無需修改 |

---

## 完整解決方案總結

### 前端修復 (已完成)
1. ✅ 新增 `button*TriggerImageUrl` 狀態欄位
2. ✅ handlePublish 上傳觸發圖片,取得 URL
3. ✅ generateFlexMessage 支援 image action,填入 URL

### 後端修復 (無需修改)
1. ✅ 正確儲存 flex_message_json 到資料庫
2. ✅ 正確讀取並解析 JSON
3. ✅ 正確傳送給 line_app

### line_app 修復 (已完成)
1. ✅ 優先使用 payload["flex_message_json"]
2. ✅ 直接解析前端生成的 JSON
3. ✅ 保留舊模板系統作為 fallback

---

## 後續建議

### 1. 移除舊模板系統 (可選)

如果確認所有訊息都由前端生成 FlexMessage JSON,可以考慮完全移除舊模板系統:

```python
# 簡化版本
def push_campaign(payload: dict):
    flex_dict = payload.get("flex_message_json")
    if not flex_dict:
        raise ValueError("Missing flex_message_json in payload")

    for uid in user_line_uids:
        fc = FlexContainer.from_dict(flex_dict)
        flex_msg = FlexMessage(alt_text=alt_txt, contents=fc)
        api.push_message(to=uid, messages=[flex_msg])
```

**優點**: 代碼更簡潔,邏輯更清晰
**缺點**: 失去向後相容性

### 2. 追蹤連結功能

如果需要保留追蹤連結功能 (`__track` URL),可以在前端生成 FlexMessage 時插入追蹤參數。

### 3. 監控和告警

建議設置監控:
- 群發成功率
- FlexMessage 解析失敗率
- 平均發送時間

---

## 修復狀態

✅ **已完成並測試**

- [x] 修改 line_app/app.py
- [x] 重啟 line_app 服務
- [x] 向後相容性保留
- [x] 錯誤處理完善
- [x] 文檔撰寫完成

---

## 聯絡資訊

如有問題或建議,請聯繫開發團隊。
