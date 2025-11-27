# 死代碼分析詳細報告
**生成時間**: 2025-11-27
**專案**: 力麗飯店 LINE CRM 系統

---

## 執行摘要

本次分析識別出以下可安全刪除的死代碼：

| 類別 | 檔案數量 | 磁碟空間 | 安全等級 |
|------|---------|---------|---------|
| **真正未使用的 Import 檔案** | 111 | ~750 KB | ✅ 高安全 |
| **Legacy Context 檔案** | 1 | ~3 KB | ✅ 高安全 |
| **文檔檔案 (MD)** | 41 | ~476 KB | ⚠️ 需審查 |
| **Python Cache 檔案** | 已清理 | N/A | ✅ 已完成 |

**總計可清理空間**: ~1.2 MB

---

## 第一部分：真正未使用的 Import 檔案 (111 個)

### 安全性評估：✅ 高安全（經過雙重驗證）

這些檔案經過以下驗證：
1. ✅ 在主要程式碼中沒有 import 引用
2. ✅ 在其他 import 檔案中沒有連鎖引用
3. ✅ 測試刪除 10 個檔案後，編譯成功

### SVG 圖標檔案 (61 個)

```
svg-0buukvztvq.ts          svg-3vs1ifqno1.ts          svg-m4hwvavtg8.ts
svg-0lasnt9264.ts          svg-3zvphj6nxz.ts          svg-message-table-icons.ts
svg-1t6cuxkd04.ts          svg-4rrs72qzsn.ts          svg-message-type-icons.ts
svg-1y29x0dthx.ts          svg-5qquvdjbtg.ts          svg-nzneb56q8o.ts
svg-20q90p6jd4.ts          svg-5s5ahpg9k6.ts          svg-o1a2tepzr5.ts
svg-2g8wfpe4xf.ts          svg-68s8th5l9k.ts          svg-oo6ifpjryi.ts
svg-2njf0zneg5.ts          svg-83yqv8tlla.ts          svg-pb17i9d1x8.ts
svg-2xudvy6k1j.ts          svg-8aajmaajmo.ts          svg-pfwcir2k51.ts
svg-35f4wo9hlt.ts          svg-8hwmteuou6.ts          svg-pt5jcv0lnu.ts
svg-3b1x2r9plc.ts          svg-8ud7idaroc.ts          svg-qmpnpcx65l.ts
svg-95gpt1wgnp.ts          svg-adh9dp2jm1.ts          svg-shfvr5xjjh.ts
svg-9o8uroawk6.ts          svg-af4gbf7p9c.ts          svg-sidebar-icons.ts
svg-b68uncuxmr.ts          svg-e4ite9d74v.ts          svg-table-icons.ts
svg-carousel-icons.ts      svg-efouxht4xp.ts          svg-tag-input-icons.ts
svg-chat-icons.ts          svg-epkf10l3t9.ts          svg-tl6yb52hbj.ts
svg-close-icons.ts         svg-ezbpzm9var.ts          svg-tnwqga98it.ts
svg-filter-icons.ts        svg-gu16o9nwcc.ts          svg-ttlsdrfrmm.ts
svg-htq1l2704k.ts          svg-hupbsnzfsw.ts          svg-uoeovfc4wp.ts
svg-iqmh875h1x.ts          svg-iyymfq1igb.ts          svg-vk9sq3zj24.ts
svg-jis7ew2sc3.ts          svg-jz2mmookf3.ts          svg-wn53sfg6s1.ts
svg-lap0jlerf8.ts          svg-xkenyh09fh.ts          svg-96sa7.tsx
svg-tiijt.tsx              svg-yanbh.tsx
```

### React 元件檔案 (50 個)

```
ButtonFilledButton.tsx              MemberTagModalFuzzySearchCreation.tsx
CardImage.tsx                       MemberTagModalNormal.tsx
Card.tsx                            MessageCard.tsx
ContentContainer.tsx                MessageContainer.tsx
DescriptionContainer-8423-31.tsx    ModalBlank.tsx
DescriptionContainer.tsx            ModalButton.tsx
DescriptionWrapper.tsx              ModalContent.tsx
DropdownItem.tsx                    ModalNormal.tsx
DropdownListHovered.tsx             PrimitiveDiv-8496-462.tsx
DropdownListNormal.tsx              PushMessage.tsx
Frame3468772.tsx                    RadioButton.tsx
Frame3468775.tsx                    SelectTargetAudienceNullValue.tsx
HeaderContainer.tsx                 SelectTargetAudienceSelected.tsx
HeaderContent.tsx                   SelectTargetAudienceSelecting.tsx
IconButton.tsx                      SplitButton.tsx
InboxContainerNormal.tsx            SwitchButtonActive.tsx
LineApi基本設定-8492-292.tsx        Table8Columns3Actions.tsx
LineApi基本設定.tsx                  TableListAtomic.tsx
LineFlexMessageBuilder.tsx          TableTitleAtomic.tsx
MainContent.tsx                     TextArea.tsx
Mask.tsx                            Toggle.tsx
MemberManagementInboxEditing.tsx    UploadHoverAndPressed.tsx
MemberManagementInboxHoverAndPressed.tsx  UploadNormal.tsx
```

### 刪除建議

**方案 A - 保守策略（建議）**：
```bash
# 1. 先刪除 SVG 圖標檔案（最安全）
cd /data2/lili_hotel/frontend/src/imports
rm svg-0buukvztvq.ts svg-0lasnt9264.ts ... # 61 個檔案

# 2. 測試編譯
cd /data2/lili_hotel/frontend
npm run build

# 3. 如果成功，再刪除 React 元件
rm ButtonFilledButton.tsx CardImage.tsx ... # 50 個檔案
npm run build
```

**方案 B - 一次性刪除**：
```bash
# 使用提供的腳本一次刪除所有 111 個檔案
cd /data2/lili_hotel/frontend/src
grep "TRULY_UNUSED" /tmp/accurate_unused.txt | \
  sed 's/TRULY_UNUSED: /imports\//' | \
  xargs rm
```

---

## 第二部分：Legacy 檔案

### DataContext.legacy.tsx

**路徑**: `frontend/src/contexts/DataContext.legacy.tsx`

**狀態**:
- ✅ 檔案內標註為「已棄用」(deprecated)
- ✅ 零引用（經確認）
- ✅ 功能已被新的獨立 Context 取代

**檔案說明**（來自檔案註解）：
```typescript
/**
 * DataContext 兼容層（已棄用）
 *
 * ⚠️ 不建議在新代碼中使用此文件
 * 請直接使用獨立的 Context：
 * - useMembers() from './MembersContext'
 * - useMessages() from './MessagesContext'
 * - useAutoReplies() from './AutoRepliesContext'
 * - useTags() from './TagsContext'
 */
```

**刪除建議**: ✅ 安全刪除
```bash
rm /data2/lili_hotel/frontend/src/contexts/DataContext.legacy.tsx
```

---

## 第三部分：文檔檔案 (MD)

### 概況

**總數**: 41 個 Markdown 檔案
**總大小**: ~476 KB
**位置**: `frontend/src/` 目錄中

### 檔案分類

#### 優化相關文檔 (19 個) - ⚠️ 建議保留或移動

這些是優化過程中產生的文檔記錄：

```
HOOKS_OPTIMIZATION_EXAMPLES.md     (26K)
IMPORTS_WEEK4_PLAN.md             (28K)
HOOKS_OPTIMIZATION_PLAN.md        (19K)
FILTERMODAL_OPTIMIZATION_REPORT.md (15K)
HOOKS_OPTIMIZATION_TRACKER.md     (14K)
MESSAGECREATION_OPTIMIZATION_GUIDE.md (14K)
IMPORTS_WEEK3_PLAN.md             (14K)
MEMO_OPTIMIZATION_GUIDE.md        (13K)
IMPORTS_CLEANUP_PLAN.md           (12K)
IMPORTS_PROJECT_OVERVIEW.md       (12K)
HOOKS_OPTIMIZATION_SUMMARY.md     (12K)
TYPESCRIPT_CONFIG_SETUP.md        (12K)
...等
```

#### 摘要文檔 (13 個) - ⚠️ 可合併為單一檔案

多個 SUMMARY 和 COMPLETE 檔案可能有重複內容：

```
CODE_CONSOLIDATION_SUMMARY.md
COMPONENT_CONSOLIDATION_SUMMARY.md
CONTEXT_REFACTOR_SUMMARY.md
OPTIMIZATION_FINAL_SUMMARY.md
FINAL_OPTIMIZATION_SUMMARY.md
REFACTORING_COMPLETE.md
CONTEXT_OPTIMIZATION_COMPLETE.md
IMPORTS_WEEK2_COMPLETE.md
IMPORTS_RENAME_COMPLETE_SUMMARY.md
...等
```

#### 有用的參考文檔 (5 個) - ✅ 建議保留

```
QUICK_START.md                    (11K) - 快速入門指南
QUICK_REFERENCE.md                (7.2K) - 快速參考
CONTEXT_API_REFERENCE.md          (7.9K) - API 參考
guidelines/Guidelines.md           - 開發指南
Attributions.md                   (289B) - 版權聲明
```

### 文檔處理建議

**選項 1 - 移動到文檔目錄（建議）**：
```bash
# 創建文檔目錄
mkdir -p /data2/lili_hotel/docs/{optimization,archive}

# 移動優化相關文檔
mv frontend/src/*OPTIMIZATION*.md docs/optimization/
mv frontend/src/*IMPORTS*.md docs/optimization/
mv frontend/src/*HOOKS*.md docs/optimization/

# 保留重要參考文檔在 frontend/src
# QUICK_START.md, QUICK_REFERENCE.md, CONTEXT_API_REFERENCE.md
```

**選項 2 - 合併摘要文檔**：
```bash
# 創建單一的項目歷史文檔
cat frontend/src/*SUMMARY*.md \
    frontend/src/*COMPLETE*.md \
    > docs/PROJECT_HISTORY.md

# 刪除原始檔案
rm frontend/src/*SUMMARY*.md frontend/src/*COMPLETE*.md
```

**選項 3 - 直接刪除舊的優化計劃（激進）**：
```bash
# 只保留最終結果，刪除過程文檔
rm frontend/src/*WEEK*.md
rm frontend/src/*PLAN*.md
rm frontend/src/*TRACKER*.md
```

---

## 第四部分：其他發現

### 被誤判但實際有使用的檔案 (40 個)

這些檔案在初始掃描中被標記為未使用，但實際上有被引用：

**重要發現**：
- `svg-icons-common.ts` - 被 AutoReply.tsx 和 MessageList.tsx 使用
- `ActionTriggerTextMessage.tsx` - 被 MessageCreation.tsx 使用
- `IcInfo.tsx` - 被 InteractiveMessageTable.tsx 使用
- `Container.tsx` - 被 5 個其他 import 檔案連鎖引用
- 其他檔案透過 import chain 間接被使用

**結論**: 初始的簡單 grep 掃描會有誤判，需要更深入的分析。

---

## 安全刪除步驟建議

### 階段 1: 最安全（立即執行）

```bash
# 1. 刪除 Legacy Context
rm /data2/lili_hotel/frontend/src/contexts/DataContext.legacy.tsx

# 2. 測試編譯
cd /data2/lili_hotel/frontend && npm run build
```

### 階段 2: SVG 圖標清理（安全）

```bash
# 刪除 61 個未使用的 SVG 檔案
cd /data2/lili_hotel/frontend/src/imports
rm svg-0buukvztvq.ts svg-0lasnt9264.ts svg-1t6cuxkd04.ts \
   svg-1y29x0dthx.ts svg-20q90p6jd4.ts svg-2g8wfpe4xf.ts \
   # ... (完整列表見上方)

# 測試編譯
cd /data2/lili_hotel/frontend && npm run build
```

### 階段 3: React 元件清理（中等風險，建議逐批測試）

```bash
# 第一批：10 個檔案測試
cd /data2/lili_hotel/frontend/src/imports
rm ButtonFilledButton.tsx CardImage.tsx Card.tsx \
   ContentContainer.tsx DescriptionContainer-8423-31.tsx \
   DescriptionContainer.tsx DescriptionWrapper.tsx \
   DropdownItem.tsx DropdownListHovered.tsx DropdownListNormal.tsx

# 測試編譯
cd /data2/lili_hotel/frontend && npm run build

# 如果成功，繼續刪除剩餘 40 個檔案
# ...
```

### 階段 4: 文檔整理（可選）

```bash
# 移動優化文檔到專門目錄
mkdir -p /data2/lili_hotel/docs/optimization
mv /data2/lili_hotel/frontend/src/*OPTIMIZATION*.md docs/optimization/
mv /data2/lili_hotel/frontend/src/*IMPORTS*.md docs/optimization/
mv /data2/lili_hotel/frontend/src/*HOOKS*.md docs/optimization/

# 保留 QUICK_START.md, QUICK_REFERENCE.md, CONTEXT_API_REFERENCE.md
```

---

## 風險評估

| 操作 | 風險等級 | 可逆性 | 建議 |
|------|---------|-------|------|
| 刪除 Legacy Context | 🟢 低 | ✅ Git 可還原 | 立即執行 |
| 刪除 SVG 圖標 | 🟢 低 | ✅ Git 可還原 | 建議執行 |
| 刪除 React 元件 | 🟡 中 | ✅ Git 可還原 | 分批測試 |
| 移動文檔檔案 | 🟢 低 | ✅ Git 可還原 | 可選執行 |
| 刪除文檔檔案 | 🟡 中 | ✅ Git 可還原 | 需謹慎 |

---

## 預期收益

### 磁碟空間
- **Import 檔案**: ~750 KB
- **Legacy 檔案**: ~3 KB
- **文檔檔案**: ~476 KB (如果移動/刪除)
- **總計**: ~1.2 MB

### 維護性提升
- ✅ 減少混淆：移除未使用的程式碼
- ✅ 加快搜尋：更少的檔案要搜尋
- ✅ 清晰的結構：只保留實際使用的程式碼
- ✅ 減少編譯時間：更少的檔案要處理

### 開發體驗
- ✅ IDE 自動完成更精確
- ✅ 減少誤導性的程式碼提示
- ✅ 更清晰的專案結構

---

## 執行清單

- [ ] 刪除 DataContext.legacy.tsx
- [ ] 測試編譯是否成功
- [ ] 刪除 61 個 SVG 圖標檔案
- [ ] 測試編譯是否成功
- [ ] 分批刪除 50 個 React 元件（每批 10 個）
- [ ] 每批都測試編譯
- [ ] 整理/移動文檔檔案（可選）
- [ ] 提交 Git commit
- [ ] 進行完整的功能測試

---

## 腳本工具

### 自動刪除腳本（使用前請備份）

```bash
#!/bin/bash
# cleanup_dead_code.sh

set -e  # 遇到錯誤立即停止

echo "=== Dead Code Cleanup Script ==="
echo ""

# 備份
echo "Creating backup..."
git add -A
git stash push -m "Backup before cleanup"

# 階段 1: Legacy
echo "Phase 1: Removing legacy files..."
rm /data2/lili_hotel/frontend/src/contexts/DataContext.legacy.tsx

# 測試
cd /data2/lili_hotel/frontend
npm run build || { echo "Build failed!"; git stash pop; exit 1; }

# 階段 2: SVG
echo "Phase 2: Removing unused SVG files..."
cd /data2/lili_hotel/frontend/src/imports
# (SVG 檔案列表)

npm run build || { echo "Build failed!"; git stash pop; exit 1; }

# 階段 3: Components
echo "Phase 3: Removing unused components..."
# (元件檔案列表)

npm run build || { echo "Build failed!"; git stash pop; exit 1; }

echo "✅ All cleanup completed successfully!"
echo "Please run full functional tests before committing."
```

---

**報告結束**

建議：先從最安全的操作開始（Legacy Context + SVG 圖標），確認無誤後再進行元件清理。
