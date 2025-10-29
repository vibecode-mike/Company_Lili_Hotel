# 📤 群發訊息發布流程完整說明

## 🔄 完整流程圖

```
前端 (React)
    ↓ HTTP POST
Backend API (FastAPI)
    ↓ 調用
LINE Bot App (Flask)
    ↓ 發送
LINE Messaging API
    ↓ 推送
用戶的 LINE
```

---

## 1️⃣ 前端提交的 JSON 格式

### API 端點
```
POST http://localhost:8700/api/v1/campaigns
Content-Type: application/json
```

### 圖片點擊型 (image_click) 完整範例

```json
{
  "template_type": "image_click",
  "title": "雙十優惠活動",
  "notification_text": "連住兩晚 85 折｜含早餐",
  "preview_text": "點擊查看優惠詳情",
  "target_audience": "all",
  "target_tags": [],
  "schedule_type": "immediate",
  "scheduled_at": null,
  "interaction_tag": null,
  "carousel_items": [
    {
      "image_url": "http://localhost:8700/uploads/abc123def456.jpg",
      "title": "雙十優惠",
      "description": "連住兩晚享 85 折優惠",
      "price": null,
      "action_url": null,
      "interaction_tag": null,
      "action_button_enabled": false,
      "action_button_text": "",
      "action_button_interaction_type": "none",
      "action_button_url": null,
      "action_button_trigger_message": null,
      "action_button_trigger_image_url": null,
      "image_aspect_ratio": "1:1",
      "image_click_action_type": "open_image",
      "image_click_action_value": null,
      "sort_order": 0
    }
  ]
}
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 | 範例值 |
|------|------|------|------|--------|
| `template_type` | string | ✅ | 模板類型 | `"image_click"`, `"image_card"`, `"text_button"` |
| `title` | string | ✅ | 活動標題 | `"雙十優惠活動"` |
| `notification_text` | string | ✅ | 通知訊息 | `"連住兩晚 85 折"` |
| `preview_text` | string | ✅ | 預覽文字 | `"點擊查看詳情"` |
| `target_audience` | string | ✅ | 目標對象 | `"all"` 或 `"tags"` |
| `target_tags` | array | ❌ | 標籤列表 | `["VIP", "常客"]` |
| `schedule_type` | string | ✅ | 發送類型 | `"immediate"`, `"scheduled"`, `"draft"` |
| `scheduled_at` | datetime | ❌ | 排程時間 | `"2025-10-25T10:00:00"` |
| `carousel_items` | array | ✅ | 輪播項目 | 見下方 |

### carousel_items 欄位（圖片點擊型新增欄位）

| 欄位 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `image_url` | string | ✅ | - | 上傳後的圖片 URL |
| `image_aspect_ratio` | string | ❌ | `"1:1"` | 圖片長寬比例：`"1:1"`, `"20:13"`, `"3:4"` |
| `image_click_action_type` | string | ❌ | `"open_image"` | 點擊動作類型：`"open_image"`, `"open_url"` |
| `image_click_action_value` | string | ❌ | `null` | 動作值（URL 或其他） |
| `title` | string | ❌ | - | 標題（圖片點擊型不顯示） |
| `description` | string | ❌ | - | 描述（圖片點擊型不顯示） |
| `action_button_enabled` | boolean | ❌ | `false` | 是否啟用動作按鈕 |
| `sort_order` | number | ❌ | `0` | 排序順序 |

---

## 2️⃣ Backend API 處理流程

### 檔案位置
```
/data2/lili_hotel/backend/app/api/v1/campaigns.py
```

### 處理步驟

#### Step 1: 創建消息模板
```python
template = MessageTemplate(
    type=TemplateType("image_click"),
    name="雙十優惠活動",
    content="連住兩晚 85 折｜含早餐",
    notification_text="連住兩晚 85 折｜含早餐",
    preview_text="點擊查看優惠詳情",
)
db.add(template)
await db.flush()  # 獲取 template.id
```

#### Step 2: 創建輪播項目
```python
for item in campaign_data.carousel_items:
    carousel_item = TemplateCarouselItem(
        template_id=template.id,
        image_url=item.image_url,
        title=item.title,
        description=item.description,
        image_aspect_ratio=item.image_aspect_ratio or "1:1",
        image_click_action_type=item.image_click_action_type or "open_image",
        image_click_action_value=item.image_click_action_value,
        sort_order=item.sort_order,
    )
    db.add(carousel_item)
```

#### Step 3: 創建活動
```python
campaign = Campaign(
    title="雙十優惠活動",
    template_id=template.id,
    target_audience={"type": "all"},
    status=CampaignStatus.SENT,
    sent_at=datetime.now(),
)
db.add(campaign)
await db.commit()
```

#### Step 4: 構建 Payload 給 LINE Bot
```python
payload = build_campaign_payload(campaign_full)
```

#### Step 5: 調用 LINE Bot 發送
```python
broadcast_message = _get_broadcast_message()
result = broadcast_message(payload)
```

---

## 3️⃣ 傳遞給 line_app/app.py 的 Payload 格式

### 函數調用方式

```python
# Backend 動態導入 line_app/app.py
import importlib.util
from pathlib import Path

project_root = Path(__file__).parent.parent.parent.parent.parent
line_app_py = project_root / "line_app" / "app.py"

spec = importlib.util.spec_from_file_location("line_app_broadcast", line_app_py)
line_app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(line_app_module)

# 調用 broadcast_message 函數
broadcast_message = line_app_module.broadcast_message
result = broadcast_message(payload)
```

### Payload JSON 格式

```json
{
  "name": "雙十優惠活動",
  "title": "雙十優惠活動",
  "template_type": "image_click",
  "notification_text": "連住兩晚 85 折｜含早餐",
  "preview_text": "點擊查看優惠詳情",
  "template_id": 123,
  "interaction_tag": null,
  "target_audience": "all",
  "target_tags": [],
  "carousel_items": [
    {
      "image_path": "http://localhost:8700/uploads/abc123def456.jpg",
      "title": "雙十優惠",
      "description": "連住兩晚享 85 折優惠",
      "price": null,
      "action_url": null,
      "action_button_enabled": false,
      "action_button_text": "查看詳情",
      "action_button_interaction_type": "none",
      "action_button_url": null,
      "action_button_trigger_message": null,
      "action_button_trigger_image_url": null,
      "image_aspect_ratio": "1:1",
      "image_click_action_type": "open_image",
      "image_click_action_value": null,
      "sort_order": 0
    }
  ]
}
```

---

## 4️⃣ line_app/app.py 處理流程

### 檔案位置
```
/data2/lili_hotel/line_app/app.py
```

### 函數調用鏈

```python
broadcast_message(payload)
  ↓
build_user_messages_from_payload(payload, campaign_id=None, line_user_id=None)
  ↓
make_image_click_bubble(item, tracked_uri=None)
  ↓
FlexContainer.from_dict(flex)
  ↓
FlexMessage(alt_text="雙十優惠活動", contents=fc)
  ↓
messaging_api.broadcast(BroadcastRequest(messages=msgs))
```

### make_image_click_bubble 函數邏輯

```python
def make_image_click_bubble(item: dict, tracked_uri: Optional[str]):
    """生成圖片點擊型 Flex Message Bubble"""

    # 取得圖片 URL
    image_url = image_url_from_item(item) or "https://dummyimage.com/..."

    # 取得長寬比例（預設 1:1）
    aspect_ratio = item.get("image_aspect_ratio", "1:1")

    # 取得點擊動作類型（預設 open_image）
    click_action_type = item.get("image_click_action_type", "open_image")
    click_action_value = item.get("image_click_action_value")

    # 決定點擊圖片的 URI
    if click_action_type == "open_image":
        action_uri = image_url  # 點擊圖片打開圖片本身
    elif click_action_type == "open_url" and click_action_value:
        action_uri = tracked_uri or click_action_value  # 打開指定網址
    else:
        action_uri = tracked_uri or image_url  # 預設

    # 構建 Flex Bubble（只有圖片，沒有 body）
    return {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": image_url,
            "size": "full",
            "aspectRatio": aspect_ratio,
            "aspectMode": "cover",
            "action": {
                "type": "uri",
                "uri": action_uri
            }
        }
    }
```

---

## 5️⃣ 最終發送到 LINE 的 Flex Message

### 單張圖片

```json
{
  "type": "flex",
  "altText": "雙十優惠活動",
  "contents": {
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": "http://localhost:8700/uploads/abc123def456.jpg",
      "size": "full",
      "aspectRatio": "1:1",
      "aspectMode": "cover",
      "action": {
        "type": "uri",
        "uri": "http://localhost:8700/uploads/abc123def456.jpg"
      }
    }
  }
}
```

### 多張圖片 (Carousel)

```json
{
  "type": "flex",
  "altText": "雙十優惠活動",
  "contents": {
    "type": "carousel",
    "contents": [
      {
        "type": "bubble",
        "hero": {
          "type": "image",
          "url": "http://localhost:8700/uploads/image1.jpg",
          "size": "full",
          "aspectRatio": "1:1",
          "aspectMode": "cover",
          "action": {
            "type": "uri",
            "uri": "http://localhost:8700/uploads/image1.jpg"
          }
        }
      },
      {
        "type": "bubble",
        "hero": {
          "type": "image",
          "url": "http://localhost:8700/uploads/image2.jpg",
          "size": "full",
          "aspectRatio": "20:13",
          "aspectMode": "cover",
          "action": {
            "type": "uri",
            "uri": "http://localhost:8700/uploads/image2.jpg"
          }
        }
      }
    ]
  }
}
```

---

## 6️⃣ LINE API 發送邏輯

### broadcast_message 函數

```python
def broadcast_message(payload):
    """群發 Flex 或文字訊息（支持標籤篩選）"""
    target_audience = payload.get("target_audience", "all")
    target_tags = payload.get("target_tags", [])

    # 構建 LINE Flex Message
    msgs = build_user_messages_from_payload(payload, None, None)

    if target_audience == "all":
        # 發送給所有用戶 - 使用 broadcast API
        messaging_api.broadcast(BroadcastRequest(messages=msgs))
        return {"ok": True, "method": "broadcast", "sent": total_users}
    else:
        # 發送給特定標籤用戶 - 使用 multicast API
        # 查詢標籤用戶
        user_ids = query_users_by_tags(target_tags)

        # 分批發送 (每批最多 500 人)
        for chunk in [user_ids[i:i + 500] for i in range(0, len(user_ids), 500)]:
            messaging_api.multicast(MulticastRequest(to=chunk, messages=msgs))

        return {"ok": True, "method": "multicast", "sent": len(user_ids)}
```

---

## 7️⃣ 返回結果

### Backend API 返回格式

```json
{
  "id": 123,
  "title": "雙十優惠活動",
  "status": "sent",
  "sent_count": 1500,
  "created_at": "2025-10-22T20:00:00",
  "message": "活動發送成功，已發送給 1500 位用戶"
}
```

### line_app 返回格式

```python
{
    "ok": True,
    "method": "broadcast",  # 或 "multicast"
    "sent": 1500  # 發送人數
}
```

---

## 8️⃣ 完整調用時序圖

```
用戶點擊「發布給用戶」
    ↓
前端 POST /api/v1/campaigns
    {
      template_type: "image_click",
      carousel_items: [{
        image_url: "...",
        image_aspect_ratio: "1:1",
        image_click_action_type: "open_image"
      }]
    }
    ↓
Backend API (campaigns.py)
    ├─ 創建 MessageTemplate
    ├─ 創建 TemplateCarouselItem (含新欄位)
    ├─ 創建 Campaign
    └─ 調用 build_campaign_payload()
        ↓
        生成 payload = {
          template_type: "image_click",
          carousel_items: [{
            image_path: "...",
            image_aspect_ratio: "1:1",
            image_click_action_type: "open_image"
          }]
        }
        ↓
        調用 broadcast_message(payload)
            ↓
LINE Bot App (app.py)
    └─ broadcast_message()
        ├─ build_user_messages_from_payload()
        │   └─ make_image_click_bubble()
        │       └─ 生成 Flex Message
        │           {
        │             "type": "bubble",
        │             "hero": {
        │               "type": "image",
        │               "url": "...",
        │               "aspectRatio": "1:1",
        │               "action": {
        │                 "type": "uri",
        │                 "uri": "..."
        │               }
        │             }
        │           }
        └─ messaging_api.broadcast()
            ↓
LINE Messaging API
    ↓
用戶的 LINE 收到訊息
    └─ 點擊圖片 → 開啟圖片 URL
```

---

## 9️⃣ 測試範例

### 使用 curl 測試

```bash
curl -X POST http://localhost:8700/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "template_type": "image_click",
    "title": "測試活動",
    "notification_text": "測試訊息",
    "preview_text": "點擊查看",
    "target_audience": "all",
    "schedule_type": "immediate",
    "carousel_items": [{
      "image_url": "http://localhost:8700/uploads/test.jpg",
      "image_aspect_ratio": "1:1",
      "image_click_action_type": "open_image",
      "sort_order": 0
    }]
  }'
```

---

## 🔟 關鍵特性

### ✅ 已實現
- 自訂長寬比例（1:1, 20:13, 3:4）
- 點擊圖片打開圖片 URL
- 支援輪播（多張圖片）
- 即時發送 / 排程發送
- 標籤篩選目標對象

### 🚀 未來擴充
- 點擊圖片觸發其他動作（open_url, trigger_message, trigger_image）
- 添加動作按鈕（Phase 2）
- 點擊追蹤統計

---

## 📝 注意事項

1. **圖片 URL**: 必須是公開可訪問的 HTTP/HTTPS URL
2. **長寬比例**: LINE 支援的比例包括 1:1, 1.51:1, 1.91:1, 20:13 等
3. **圖片大小**: 建議 < 1 MB，尺寸根據比例調整
4. **Action URI**: 必須是 HTTPS URL（LINE 限制）
5. **發送限制**:
   - Broadcast: 所有用戶（每月有配額限制）
   - Multicast: 最多 500 人/次
   - Push: 單一用戶

---

生成時間：2025-10-22 20:40
文檔版本：1.0
