# 房型圖片上傳與顯示 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓後台 FAQ 管理介面可上傳房型/設施圖片，並在 Chatbot 房型卡片中正確顯示（含預設圖 fallback）。

**Architecture:** 複用現有 `/api/v1/upload` 上傳端點（已有 5MB 限制、JPEG 轉換、靜態路由），前端在圖片 URL 輸入框旁加上傳按鈕，上傳成功後自動填入 URL。Chatbot 取卡片時若 `image_url` 為空則 fallback 至 `DEFAULT_ROOM_IMAGE_URL` 環境變數。

**Tech Stack:** FastAPI, Pillow, React/TypeScript, Tailwind CSS

---

## 現有基礎設施（不需修改）

| 元件 | 路徑 | 說明 |
|------|------|------|
| 上傳 API | `backend/app/api/v1/upload.py:37` | `POST /api/v1/upload` — 5MB 限制、JPEG 轉換、UUID 檔名 |
| 靜態路由 | `backend/app/main.py:161` | `/uploads` → `backend/public/uploads/` |
| 上傳設定 | `backend/app/config.py:96-109` | `upload_dir_path`, `get_public_url()` |
| KB Sync | `backend/app/services/kb_sync.py:94` | 已同步 `image_url` 欄位到 JSON |
| FAQ Schema | `backend/app/schemas/faq.py:62-73` | `content_json: Dict[str, Any]` — 已支援任意欄位 |

---

### Task 1: 後端 — 加入圖片寬度壓縮（1200px 上限）

現有 `upload.py` 只做 RGB 轉換，不做縮放。需加入寬度上限 1200px 的等比縮放。

**Files:**
- Modify: `backend/app/api/v1/upload.py:82-99`

**Step 1: 在 upload.py 的圖片處理區段加入縮放邏輯**

找到現有的 PIL 處理區段（約 Line 82-99），在 RGB 轉換後、儲存前加入：

```python
# --- 現有：RGB 轉換 ---
img = Image.open(io.BytesIO(content))
if img.mode in ("RGBA", "P"):
    img = img.convert("RGB")

# --- 新增：等比縮放至寬度上限 1200px ---
MAX_WIDTH = 1200
if img.width > MAX_WIDTH:
    ratio = MAX_WIDTH / img.width
    new_height = int(img.height * ratio)
    img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
```

**Step 2: 執行手動測試**

```bash
# 用 curl 上傳一張大於 1200px 寬的圖片
curl -X POST http://localhost:8700/api/v1/upload \
  -F "file=@/path/to/large-image.jpg" | python3 -m json.tool
# 預期：回傳 url，下載該 url 確認寬度 <= 1200px
```

**Step 3: Commit**

```bash
git add backend/app/api/v1/upload.py
git commit -m "feat: add 1200px max-width resize to image upload"
```

---

### Task 2: 後端 — 加入 DEFAULT_ROOM_IMAGE_URL 環境變數與 fallback 邏輯

**Files:**
- Modify: `backend/app/config.py` — 加入環境變數
- Modify: `backend/.env.example` — 加入範例值
- Modify: `backend/app/services/chatbot_service.py:68-107` — `_kb_fallback_rooms()` 加 fallback
- Modify: `backend/app/services/chatbot_service.py:110-135` — `_enrich_cards_with_kb()` 加 fallback

**Step 1: config.py 加入環境變數**

在 `Settings` class 中加入：

```python
DEFAULT_ROOM_IMAGE_URL: str = ""
```

**Step 2: .env.example 加入範例**

```env
DEFAULT_ROOM_IMAGE_URL=https://linebot.star-bit.io/uploads/default_room.jpg
```

**Step 3: 修改 `_kb_fallback_rooms()` 加入 fallback**

在 `backend/app/services/chatbot_service.py` 的 `_kb_fallback_rooms()` 函式中（約 Line 93），修改 image_url 提取邏輯：

```python
# 現有（Line 93）:
image_url = str(item.get("url") or item.get("image_url") or "") or None

# 改為:
from app.config import settings
raw_image = str(item.get("image_url") or item.get("url") or "").strip()
image_url = raw_image if raw_image else (settings.DEFAULT_ROOM_IMAGE_URL or None)
```

注意：優先取 `image_url`，再取 `url`（修正原本順序錯誤）。

**Step 4: 修改 `_enrich_cards_with_kb()` 加入 fallback**

在 `_enrich_cards_with_kb()` 函式中（約 Line 128），同樣修改：

```python
# 現有（Line 128）:
image = str(kb.get("url") or kb.get("image_url") or "") or None

# 改為:
raw_image = str(kb.get("image_url") or kb.get("url") or "").strip()
image = raw_image if raw_image else (settings.DEFAULT_ROOM_IMAGE_URL or None)
```

**Step 5: 驗證 chatbot 在無圖片時使用預設圖**

```bash
# 在 .env 設定 DEFAULT_ROOM_IMAGE_URL 後重啟 backend
# 透過 chatbot 觸發訂房查詢，確認卡片圖片顯示預設圖
```

**Step 6: Commit**

```bash
git add backend/app/config.py backend/.env.example backend/app/services/chatbot_service.py
git commit -m "feat: add DEFAULT_ROOM_IMAGE_URL fallback for room cards"
```

---

### Task 3: 前端 — 建立可複用的 ImageUploadField 元件

**Files:**
- Create: `frontend/src/components/common/ImageUploadField.tsx`

**Step 1: 建立元件**

```tsx
import React, { useRef, useState } from "react";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label: string;
  aspectRatio?: string;        // e.g. "3/2", "1264/848"
  placeholder?: string;
}

export default function ImageUploadField({
  value,
  onChange,
  disabled = false,
  label,
  aspectRatio = "3/2",
  placeholder = "輸入圖片 URL",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 前端 5MB 預檢
    if (file.size > 5 * 1024 * 1024) {
      alert("檔案大小不可超過 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/upload`,
        { method: "POST", body: formData },
      );
      const json = await res.json();
      if (json.code === 200 && json.data?.url) {
        onChange(json.data.url);
      } else {
        alert(json.message || "上傳失敗");
      }
    } catch {
      alert("上傳失敗，請稍後再試");
    } finally {
      setUploading(false);
      // 清除 file input 以便重複選取同一檔案
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-[8px] w-full">
      {/* 圖片預覽 */}
      {value && (
        <div
          className="relative rounded-[4px] overflow-hidden w-full shrink-0"
          style={{ aspectRatio }}
        >
          <img
            src={value}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* URL 輸入 + 上傳按鈕 */}
      <div className="flex gap-[8px] items-center">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || uploading}
          className="flex-1 min-w-0 h-[36px] px-[12px] rounded-[4px] border border-[#d9d9d9] text-[14px] outline-none focus:border-[#1677ff] disabled:bg-[#f5f5f5] disabled:text-[#999]"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="shrink-0 h-[36px] px-[12px] rounded-[4px] border border-[#d9d9d9] bg-white text-[14px] text-[#333] hover:border-[#1677ff] hover:text-[#1677ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "上傳中..." : "上傳圖片"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px]">
        支援 JPG / PNG / GIF，上限 5MB；或直接輸入圖片 URL
      </p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/common/ImageUploadField.tsx
git commit -m "feat: add reusable ImageUploadField component with upload + URL input"
```

---

### Task 4: 前端 — 在 AIChatbotEditModal 中替換圖片欄位

將房型圖片和設施圖片區塊替換為 `ImageUploadField`。

**Files:**
- Modify: `frontend/src/components/chatbot/AIChatbotEditModal.tsx`

**Step 1: 加入 import**

在檔案頂部加入：

```tsx
import ImageUploadField from "../common/ImageUploadField";
```

**Step 2: 替換房型圖片區塊（約 Line 732-764）**

將整個 `{/* 房型圖片 */}` 區塊替換為：

```tsx
{/* 房型圖片 */}
<div className="flex flex-col gap-[12px] w-full">
  <FieldLabel label="房型圖片" />
  <ImageUploadField
    value={displayImage || ""}
    onChange={field("customImageUrl")}
    disabled={saving}
    label="房型圖片"
    aspectRatio="3/2"
  />
</div>
```

**Step 3: 替換設施圖片區塊（約 Line 1015-1047）**

將整個 `{/* 設施圖片 */}` 區塊替換為：

```tsx
{/* 設施圖片 */}
<div className="flex flex-col gap-[12px] w-full">
  <FieldLabel label="設施圖片" />
  <ImageUploadField
    value={draft.imageUrl}
    onChange={field("imageUrl")}
    disabled={saving}
    label="設施圖片"
    aspectRatio="1264/848"
  />
</div>
```

**Step 4: 同時替換獨立的 RoomImageSection 元件（約 Line 270-302）**

如果 `RoomImageSection` 子元件也有相同的圖片輸入邏輯，也一併替換。

**Step 5: 前端驗證**

```bash
cd frontend && npm run dev
# 開啟後台 → AI 客服 → FAQ 管理 → 編輯房型規則
# 測試：1) 點「上傳圖片」選擇檔案 → URL 自動填入 + 預覽顯示
# 測試：2) 直接貼 URL → 預覽顯示
# 測試：3) 上傳超過 5MB 檔案 → 顯示錯誤提示
```

**Step 6: Commit**

```bash
git add frontend/src/components/chatbot/AIChatbotEditModal.tsx
git commit -m "feat: replace image URL inputs with ImageUploadField in FAQ editor"
```

---

### Task 5: 前端 — Chatbot Widget 房型卡片圖片顯示

確認 Chatbot Widget 的房型卡片正確使用 `image_url` 欄位，並處理載入失敗。

**Files:**
- Modify: `frontend/src/components/chatbot/ChatWidget.tsx`（若有房型卡片渲染邏輯）

**Step 1: 找到卡片渲染邏輯**

搜尋 `ChatWidget.tsx` 中渲染房型卡片的位置，確認 `image_url` 有被使用。

**Step 2: 加入圖片載入失敗處理**

在卡片的 `<img>` 標籤加入 `onError` fallback：

```tsx
<img
  src={card.image_url || ""}
  alt={card.room_type_name}
  className="w-full h-[160px] object-cover rounded-t-[8px]"
  onError={(e) => {
    const target = e.currentTarget as HTMLImageElement;
    // 避免無限迴圈：只嘗試一次 fallback
    if (!target.dataset.fallback) {
      target.dataset.fallback = "true";
      target.src = "/uploads/default_room.jpg";
    } else {
      target.style.display = "none";
    }
  }}
/>
```

**Step 3: 驗證**

```bash
# 透過 Webchat Widget 觸發訂房流程
# 確認：有圖片的房型正確顯示、無圖片的房型顯示預設圖
```

**Step 4: Commit**

```bash
git add frontend/src/components/chatbot/ChatWidget.tsx
git commit -m "feat: add image fallback handling in room type cards"
```

---

### Task 6: 整合驗證與清理

**Step 1: 端到端驗證**

```bash
# 1. 重啟 backend（確保 DEFAULT_ROOM_IMAGE_URL 生效）
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8700

# 2. 後台操作
#    - 進入 FAQ 管理 → 訂房分類 → 編輯某房型規則
#    - 上傳圖片 → 確認 URL 自動填入 → 儲存 → 發佈
#    - 確認 KB JSON 同步更新（cat backend/kb/booking_billing.json）

# 3. Chatbot 驗證
#    - 透過 Webchat 問「我要訂房」
#    - 確認房型卡片圖片正確顯示
#    - 確認無圖片房型顯示預設圖
```

**Step 2: 確認無遺留的舊路徑**

```bash
# 檢查 booking_billing.json 中的 /assets/kb_rooms/ 舊路徑
# 如有需要，在後台更新為新上傳的圖片 URL
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: cleanup and verify room image upload integration"
```

---

## 任務依賴關係

```
Task 1 (壓縮) ─────────────┐
                            ├──→ Task 4 (前端替換) ──→ Task 5 (Widget) ──→ Task 6 (驗證)
Task 2 (fallback) ─────────┤
                            │
Task 3 (ImageUploadField) ──┘
```

- Task 1, 2, 3 互相獨立，可平行開發
- Task 4 依賴 Task 3（需要 ImageUploadField 元件）
- Task 5 依賴 Task 2（需要 DEFAULT_ROOM_IMAGE_URL）
- Task 6 依賴全部完成
