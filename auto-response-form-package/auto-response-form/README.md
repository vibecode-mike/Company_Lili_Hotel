# LINE OA 自動回應表單元件

這是一個完整的 React + TypeScript + shadcn/ui 專案,實作了 LINE OA CRM 模組的自動回應表單功能。

## 功能特色

### 支援的互動狀態

1. **歡迎訊息 (Blank State)** - 初始空白狀態
2. **歡迎訊息 (Editing State)** - 編輯狀態,包含多則訊息和變數標籤
3. **觸發關鍵字 (Editing State - 無標籤)** - 未輸入關鍵字標籤時的狀態
4. **觸發關鍵字 (Editing State - 標籤編輯中)** - 關鍵字標籤編輯中的狀態
5. **一律回應 (Editing State)** - 一律回應的編輯狀態

### 主要功能

- ✅ 三種回應類型切換:歡迎訊息、觸發關鍵字、一律回應
- ✅ 觸發時間設定:立即回覆 / 指定日期或時間
- ✅ 關鍵字標籤管理 (新增、刪除、顯示)
- ✅ 訊息文字編輯,支援插入「好友的顯示名稱」變數
- ✅ 即時訊息預覽,含變數標籤高亮顯示
- ✅ 多則訊息排序切換
- ✅ 字數限制顯示 (0/100)
- ✅ 完整的表單驗證

## 技術棧

- **React 18** - UI 框架
- **TypeScript** - 型別安全
- **Vite** - 建置工具
- **Tailwind CSS** - 樣式框架
- **shadcn/ui** - UI 元件庫
- **Radix UI** - 無障礙 UI 元件基礎
- **Lucide React** - Icon 圖示庫

## 安裝與執行

### 1. 安裝依賴

```bash
cd auto-response-form
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

專案將在 `http://localhost:5173` 運行

### 3. 建置正式環境

```bash
npm run build
```

建置完成的檔案會在 `dist` 目錄中

### 4. 預覽正式版本

```bash
npm run preview
```

## 專案結構

```
auto-response-form/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui 元件
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── radio-group.tsx
│   │   │   └── badge.tsx
│   │   └── AutoResponseForm.tsx  # 主元件
│   ├── lib/
│   │   └── utils.ts         # 工具函數
│   ├── App.tsx              # 根元件
│   ├── main.tsx             # 入口檔案
│   └── index.css            # 全域樣式
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 元件使用說明

### AutoResponseForm 元件

這是主要的表單元件,包含完整的狀態管理和互動邏輯。

#### 狀態管理

```typescript
interface FormState {
  responseType: ResponseType;      // 回應類型
  triggerTime: TriggerTime;        // 觸發時間
  startDate: string;               // 開始日期
  endDate: string;                 // 結束日期
  startTime: string;               // 開始時間
  endTime: string;                 // 結束時間
  keywords: KeywordTag[];          // 關鍵字標籤陣列
  keywordInput: string;            // 關鍵字輸入框值
  messageText: string;             // 訊息文字
  currentMessageIndex: number;     // 當前訊息索引
}
```

#### 主要功能方法

- `handleResponseTypeChange()` - 處理回應類型變更
- `handleTriggerTimeChange()` - 處理觸發時間變更
- `addKeywordTag()` - 新增關鍵字標籤
- `removeKeywordTag()` - 移除關鍵字標籤
- `insertFriendName()` - 插入好友顯示名稱變數
- `renderMessagePreview()` - 渲染訊息預覽

## 設計系統

### 色彩定義

根據 Figma 設計稿,專案使用以下色彩系統:

- **Primary/50**: `#0F6BEB` - 主要藍色
- **Primary/40**: `#E1EBF9` - 淺藍色背景
- **Primary/20**: `#7A9FFF` - 藍色漸層
- **Secondary/20**: `#EBA20F` - 橘色標籤
- **Secondary/10**: `#FFFAF0` - 淺橘色背景
- **Grayscale/60**: `#242424` - 深灰色
- **Grayscale/50**: `#383838` - 中深灰色
- **Grayscale/40**: `#6E6E6E` - 中灰色
- **Grayscale/30**: `#A8A8A8` - 淺灰色
- **Grayscale/5**: `#F5F5F5` - 極淺灰背景
- **Grayscale/100**: `#FFFFFF` - 白色
- **Accesibility/70**: `#F44336` - 紅色(必填標記)

### 字體系統

- **H2 - Headline**: 32px / Regular / 1.5 line-height
- **H6 - Body 2, Button 1**: 16px / Regular / 1.5 line-height
- **H7 - Body 3, Button 2, Caption 2**: 14px / Regular / 1.5 line-height
- **H8 - Caption 1**: 14px / Medium / 1.5 line-height
- **H9 - Caption 3**: 12px / Regular / 1.5 line-height

使用字體: **Noto Sans TC**

## 互動說明

### 回應類型切換

1. **歡迎訊息**: 顯示 4 個訊息欄位,適合設定多則歡迎訊息
2. **觸發關鍵字**: 需設定關鍵字標籤,可輸入多個關鍵字
3. **一律回應**: 顯示 3 個訊息欄位,對所有訊息都會回應

### 觸發時間設定

- **立即回覆**: 收到訊息後立即回應
- **指定日期或時間**: 
  - 可設定日期範圍 (開始日期 ~ 結束日期)
  - 可設定時間範圍 (開始時間 ~ 結束時間,每天)

### 關鍵字標籤功能

- 在輸入框中輸入關鍵字後按 **Enter** 鍵新增標籤
- 最多可新增 20 個關鍵字標籤
- 點擊標籤上的 **×** 按鈕可移除標籤
- 標籤會以橘色背景顯示

### 訊息文字編輯

- 可在文字框中輸入訊息內容
- 點擊「好友的顯示名稱」按鈕可插入變數標籤
- 字數限制: 100 字元
- 即時顯示已輸入字數

### 訊息預覽

- 左側預覽區會即時顯示訊息效果
- 變數標籤 `{好友的顯示名稱}` 會以橘色標籤形式顯示
- 根據不同回應類型,顯示不同數量的訊息卡片

## 開發注意事項

1. **狀態管理**: 所有表單狀態統一在 `AutoResponseForm` 元件中管理
2. **類型安全**: 使用 TypeScript 確保型別正確性
3. **樣式一致性**: 遵循 shadcn/ui 的設計規範
4. **響應式設計**: 元件支援不同螢幕尺寸
5. **無障礙支援**: 使用 Radix UI 確保無障礙功能

## 瀏覽器支援

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 授權

此專案為內部使用,請勿對外分享。

## 聯絡資訊

如有問題或建議,請聯繫開發團隊。
