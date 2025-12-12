# Figma 導入文件清理和重命名方案

## 📊 現狀分析

**目錄統計：**
- 📁 `/imports/` 目錄：69 個文件
- 💾 總大小：約 1.7MB
- 🔴 最大文件：`MemberManagementInboxHoverAndPressed.tsx` (2,952 行)

**主要問題：**
1. ❌ 文件過多且龐大
2. ❌ 命名混亂（如 `Frame3468772.tsx`）
3. ❌ 難以維護和查找
4. ❌ 包含大量未使用的文件
5. ❌ SVG 路徑文件命名無意義（如 `svg-7n2x2m6q7b.ts`）

---

## 📋 實際使用的文件清單

### 組件文件（6 個）✅

| 當前文件名 | 建議重命名 | 使用位置 | 用途 |
|-----------|-----------|---------|------|
| `ButtonEdit.tsx` | ✅ 保持 | AutoReplyTableStyled, InteractiveMessageTable | 編輯按鈕 |
| `IcInfo.tsx` | `InfoIcon.tsx` | InteractiveMessageTable | 信息圖標 |
| `ActionTriggerTextMessage.tsx` | ✅ 保持 | MessageCreation | 文字訊息觸發器 |
| `ActionTriggerImageMessage.tsx` | ✅ 保持 | MessageCreation | 圖片訊息觸發器 |
| `MainContainer-6001-1415.tsx` | `MemberListContainer.tsx` | MessageList, MemberManagementPage | 會員列表容器 |
| `MainContainer-6001-3170.tsx` | `MemberDetailContainer.tsx` | MessageList, MemberDetailPage | 會員詳情容器 |

### SVG 路徑文件（20 個）✅

| 當前文件名 | 建議重命名 | 主要用途 | 使用位置 |
|-----------|-----------|---------|---------|
| `svg-ckckvhq9os.ts` | `svg-icons-common.ts` | 通用圖標（搜索等） | AutoReply, MessageList |
| `svg-wbwsye31ry.ts` | `svg-table-icons.ts` | 表格圖標（排序、切換等） | AutoReplyTableStyled |
| `svg-708vqjfcuf.ts` | `svg-carousel-icons.ts` | 輪播圖標 | CarouselMessageEditor |
| `svg-9tjcfsdo1d.ts` | `svg-chat-icons.ts` | 聊天室圖標 | ChatRoom |
| `svg-9n0wtrekj3.ts` | `svg-modal-icons.ts` | 模態框圖標 | CreateAutoReplyInteractive |
| `svg-er211vihwc.ts` | `svg-filter-icons.ts` | 過濾器圖標 | FilterModal |
| `svg-eulbcts4ba.ts` | `svg-toggle-icons.ts` | 切換按鈕圖標 | FilterModal |
| `svg-noih6nla1w.ts` | `svg-message-table-icons.ts` | 訊息表格圖標 | InteractiveMessageTable |
| `svg-12t3cmqk9i.ts` | `svg-tag-input-icons.ts` | 標籤輸入圖標 | KeywordTagsInput |
| `svg-pen3bccldb.ts` | `svg-tag-modal-icons.ts` | 標籤模態框圖標 | MemberTagEditModal |
| `svg-jb10q6lg6b.ts` | `svg-sidebar-icons.ts` | 側邊欄圖標 | MessageCreation, Sidebar, StarbitLogo |
| `svg-zrjx6.tsx` | `StarbitLogo.tsx` | Starbit Logo | MessageCreation, MessageList, StarbitLogo |
| `svg-b62f9l13m2.ts` | `svg-close-icons.ts` | 關閉圖標 | MessageCreation |
| `svg-wb8nmg8j6i.ts` | `svg-upload-icons.ts` | 上傳圖標 | MessageCreation |
| `svg-hbkooryl5v.ts` | `svg-message-type-icons.ts` | 訊息類型圖標 | MessageCreation |
| `svg-zsmss3rzwc.ts` | `svg-toast-success-icons.ts` | Toast 成功圖標 | ToastProvider |
| `svg-zvk2z161dz.ts` | `svg-toast-error-icons.ts` | Toast 錯誤圖標 | ToastProvider |
| `svg-qyn0laeroz.ts` | `svg-time-icons.ts` | 時間選擇圖標 | TriggerTimeOptions |
| `svg-ukuy34kve3.ts` | `svg-drawer-icons.ts` | 抽屜圖標 | MessageDetailDrawer |
| `svg-0m1jkx8owp.ts` | `svg-pagination-icons.ts` | 分頁圖標 | MessageDetailDrawer, ArrowButton |

**小計：26 個實際使用的文件**

---

## 🗑️ 可能未使用的文件（43 個）

### 大型組件文件
- `MemberManagementInboxHoverAndPressed.tsx` (2,952 行) ⚠️
- `MemberManagementInboxEditing.tsx`
- `MemberTagModalFuzzySearchCreation.tsx`
- `MemberTagModalNormal.tsx`
- `Frame3468772.tsx` ❌ 無意義命名
- `Frame3468775.tsx` ❌ 無意義命名
- 等等...

### SVG 路徑文件（約 40+ 個未使用）
- `svg-0buukvztvq.ts`
- `svg-0lasnt9264.ts`
- `svg-0t36cx7k7a.ts`
- `svg-1t6cuxkd04.ts`
- 等等...（大量未使用的 SVG 文件）

---

## 🎯 清理和重命名方案

### 階段 1: 安全重命名（高優先級）⭐

#### 1.1 重命名組件文件

```bash
# 會員相關容器
MainContainer-6001-1415.tsx → MemberListContainer.tsx
MainContainer-6001-3170.tsx → MemberDetailContainer.tsx

# 圖標組件
IcInfo.tsx → InfoIcon.tsx
```

#### 1.2 重命名 SVG 文件（語義化）

```bash
# Logo 相關
svg-zrjx6.tsx → StarbitLogoAssets.tsx

# 功能分類重命名
svg-ckckvhq9os.ts → svg-icons-common.ts
svg-wbwsye31ry.ts → svg-table-icons.ts
svg-708vqjfcuf.ts → svg-carousel-icons.ts
svg-9tjcfsdo1d.ts → svg-chat-icons.ts
svg-9n0wtrekj3.ts → svg-modal-icons.ts
svg-er211vihwc.ts → svg-filter-icons.ts
svg-eulbcts4ba.ts → svg-toggle-icons.ts
svg-noih6nla1w.ts → svg-message-table-icons.ts
svg-12t3cmqk9i.ts → svg-tag-input-icons.ts
svg-pen3bccldb.ts → svg-tag-modal-icons.ts
svg-jb10q6lg6b.ts → svg-sidebar-icons.ts
svg-b62f9l13m2.ts → svg-close-icons.ts
svg-wb8nmg8j6i.ts → svg-upload-icons.ts
svg-hbkooryl5v.ts → svg-message-type-icons.ts
svg-zsmss3rzwc.ts → svg-toast-success-icons.ts
svg-zvk2z161dz.ts → svg-toast-error-icons.ts
svg-qyn0laeroz.ts → svg-time-icons.ts
svg-ukuy34kve3.ts → svg-drawer-icons.ts
svg-0m1jkx8owp.ts → svg-pagination-icons.ts
```

### 階段 2: 審查和刪除未使用文件（中優先級）

#### 2.1 創建備份目錄

```bash
mkdir -p /imports/_archived
mkdir -p /imports/_unused
```

#### 2.2 移動可能未使用的文件到審查目錄

**需要審查的大型文件：**
```bash
# 先移動到 _unused 目錄，測試 1-2 週
MemberManagementInboxHoverAndPressed.tsx → _unused/
MemberManagementInboxEditing.tsx → _unused/
Frame3468772.tsx → _unused/
Frame3468775.tsx → _unused/
```

#### 2.3 SVG 文件清理策略

**第一批清理候選（明顯未使用的）：**
- 所有未在代碼中被引用的 `svg-*.ts` 文件
- 移動到 `_unused/svg/` 目錄

### 階段 3: 優化文件結構（低優先級）

#### 3.1 創建分類子目錄

```
/imports/
  ├── components/         # 實際組件
  │   ├── buttons/
  │   ├── containers/
  │   └── icons/
  ├── svg/               # SVG 路徑
  │   ├── common/
  │   ├── table/
  │   ├── modal/
  │   └── toast/
  └── _archived/         # 已歸檔的文件
```

---

## 🔧 實施步驟

### Step 1: 創建重命名映射文件

創建一個映射文件記錄所有重命名：

```typescript
// rename-map.json
{
  "components": {
    "MainContainer-6001-1415.tsx": "MemberListContainer.tsx",
    "MainContainer-6001-3170.tsx": "MemberDetailContainer.tsx",
    "IcInfo.tsx": "InfoIcon.tsx"
  },
  "svg": {
    "svg-zrjx6.tsx": "StarbitLogoAssets.tsx",
    "svg-ckckvhq9os.ts": "svg-icons-common.ts",
    "svg-wbwsye31ry.ts": "svg-table-icons.ts",
    // ... 其他映射
  }
}
```

### Step 2: 安全重命名流程（每個文件）

1. ✅ 複製原文件為新名稱
2. ✅ 更新所有引用該文件的導入語句
3. ✅ 測試功能是否正常
4. ✅ 刪除原文件
5. ✅ 提交更改

### Step 3: 驗證測試清單

每次重命名後需要測試：
- [ ] 所有頁面能正常加載
- [ ] 沒有導入錯誤
- [ ] UI 顯示正常
- [ ] 功能操作正常

---

## 📊 預期效果

### 文件數量減少

| 類型 | 當前 | 清理後 | 減少 |
|------|------|--------|------|
| 組件文件 | ~30 個 | ~10 個 | -66% |
| SVG 文件 | ~40 個 | ~20 個 | -50% |
| 總計 | ~69 個 | ~30 個 | -56% |

### 文件大小減少

| 類型 | 當前 | 清理後 | 減少 |
|------|------|--------|------|
| 總大小 | 1.7MB | ~0.8MB | -53% |

### 可維護性提升

**重命名前：**
```typescript
import svgPaths from '../imports/svg-ckckvhq9os';
import MainContainer from '../imports/MainContainer-6001-3170';
```

**重命名後：**
```typescript
import svgPaths from '../imports/svg-icons-common';
import MemberDetailContainer from '../imports/MemberDetailContainer';
```

**提升效果：**
- ✅ 更清晰的語義
- ✅ 更容易查找
- ✅ 更好的代碼可讀性
- ✅ 減少認知負擔

---

## ⚠️ 風險和注意事項

### 風險評估

| 風險 | 等級 | 緩解措施 |
|------|------|----------|
| 錯誤刪除使用中的文件 | 🔴 高 | 先移動到 `_unused`，觀察 1-2 週 |
| 導入路徑更新遺漏 | 🟡 中 | 使用全局搜索確認所有引用 |
| 破壞現有功能 | 🟡 中 | 每次重命名後立即測試 |
| Git 歷史混亂 | 🟢 低 | 使用 git mv 保留歷史 |

### 安全檢查清單

在刪除任何文件前：
1. ✅ 全局搜索文件名（包括擴展名和不帶擴展名）
2. ✅ 檢查是否有動態導入
3. ✅ 檢查文檔中的引用
4. ✅ 移動到 `_unused` 而不是直接刪除
5. ✅ 運行完整測試套件
6. ✅ 在開發環境驗證 1-2 週

---

## 🎯 建議執行順序

### 第一週：安全重命名（3 個文件）

**優先處理影響最大的文件：**
1. `MainContainer-6001-1415.tsx` → `MemberListContainer.tsx`
2. `MainContainer-6001-3170.tsx` → `MemberDetailContainer.tsx`
3. `svg-zrjx6.tsx` → `StarbitLogoAssets.tsx`

**工作量估計：** 2-3 小時

### 第二週：SVG 文件重命名（10 個常用）

重命名最常用的 10 個 SVG 文件：
- `svg-ckckvhq9os.ts` → `svg-icons-common.ts`
- `svg-wbwsye31ry.ts` → `svg-table-icons.ts`
- `svg-jb10q6lg6b.ts` → `svg-sidebar-icons.ts`
- 等等...

**工作量估計：** 3-4 小時

### 第三週：審查未使用文件

1. 創建 `_unused` 目錄
2. 移動可疑文件
3. 測試所有功能
4. 觀察是否有錯誤

**工作量估計：** 2 小時

### 第四週：確認刪除

如果第三週沒有問題，確認刪除 `_unused` 目錄中的文件。

**工作量估計：** 1 小時

---

## 📝 重命名腳本示例

### 手動重命名步驟

```bash
# 1. 重命名文件（使用 git mv 保留歷史）
git mv imports/MainContainer-6001-1415.tsx imports/MemberListContainer.tsx

# 2. 更新所有引用（使用 sed 或手動）
# 在 MessageList.tsx 和 MemberManagementPage.tsx 中更新導入

# 3. 測試
npm run dev

# 4. 提交
git commit -m "refactor: rename MainContainer-6001-1415 to MemberListContainer"
```

### 批量搜索和替換

```bash
# 查找所有引用
grep -r "MainContainer-6001-1415" --include="*.tsx" --include="*.ts"

# VSCode 全局替換
# Ctrl+Shift+H (Windows) / Cmd+Shift+H (Mac)
# 查找: from '../imports/MainContainer-6001-1415'
# 替換: from '../imports/MemberListContainer'
```

---

## 🎉 最終目標

**短期目標（1 個月內）：**
- ✅ 重命名 6 個主要組件文件
- ✅ 重命名 20 個常用 SVG 文件
- ✅ 將未使用文件移動到 `_unused` 目錄

**中期目標（2-3 個月內）：**
- ✅ 確認刪除未使用文件
- ✅ 文件數量減少 50%+
- ✅ 文件大小減少 50%+
- ✅ 創建清晰的目錄結構

**長期目標：**
- ✅ 所有導入文件都有語義化命名
- ✅ 維護文檔記錄每個文件的用途
- ✅ 建立導入文件管理規範
- ✅ 定期審查和清理未使用文件

---

## 📚 參考資源

- **文件搜索工具：** VSCode 全局搜索、grep、ripgrep
- **Git 重命名：** `git mv` 命令保留文件歷史
- **測試工具：** 手動測試 + 自動化測試
- **備份策略：** Git 分支 + `_unused` 目錄

---

**創建時間：** 2025-11-18  
**狀態：** 📋 待執行  
**預計完成時間：** 1 個月  
**預計效果：** 文件數量和大小減少 50%+，可維護性提升 80%+
