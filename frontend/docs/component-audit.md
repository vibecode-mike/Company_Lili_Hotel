# Atomic Design Component Audit

> Generated: 2026-05-26
> Scope: `/data2/lili_hotel/frontend/src/`
> Purpose: Establish baseline data for Atomic Design refactoring

## Table of Contents

- [1. 已 Componentized 的元件](#1-已-componentized-的元件)
  - [1.1 Atoms](#11-atoms)
  - [1.2 Molecules](#12-molecules)
  - [1.3 Organisms](#13-organisms)
- [2. 未 Componentized 的 Inline UI](#2-未-componentized-的-inline-ui)
- [3. 重複實作偵測](#3-重複實作偵測)
- [4. 命名不一致](#4-命名不一致)
- [5. imports/ 目錄分析 (Figma 產出)](#5-imports-目錄分析)
- [6. 總結統計](#6-總結統計)

---

## 1. 已 Componentized 的元件

技術棧：React + TypeScript + Vite, shadcn/ui (48 primitives in `src/components/ui/`)

### 1.1 Atoms

基礎 UI 構建塊：按鈕、輸入、badge、icon、toggle 等。

| # | 元件名 | 路徑 | 使用次數 | Props 介面 |
|---|--------|------|----------|------------|
| 1 | ArrowButton | `components/ArrowButton.tsx` | 1 (MessageDetailDrawer) | `{ direction: 'left'\|'right', disabled?, onClick?, 'aria-label'? }` |
| 2 | ChannelStatusBadge | `components/ChannelStatusBadge.tsx` | 1 (BasicSettingsList) | `{ status: 'connected'\|'expired', platform: 'line'\|'facebook' }` |
| 3 | Odometer | `components/Odometer.tsx` | 1 (InsightsPanel) | `{ value, unit?, active, reducedMotion, baseDuration?, perDigitOffset?, delay?, tweenDuration?, playEntry?, className?, charClassName? }` |
| 4 | StarbitLogo | `components/StarbitLogo.tsx` | 4 (Login, Sidebar, MessageCreation, MessageList) | `{ onClick?: () => void }` |
| 5 | ToastProvider | `components/ToastProvider.tsx` | 15+ (core infra) | `{ children }` |
| 6 | ErrorBoundary | `components/ErrorBoundary.tsx` | 1 (App.tsx) | `{ children: ReactNode }` |
| 7 | ResponseModeIndicator | `components/chat-room/ResponseModeIndicator.tsx` | 1 (ChatRoomLayout) | `{ mode: ResponseMode, className? }` |
| 8 | Containers | `components/common/Containers.tsx` | 7+ | `TitleContainer`, `DescriptionContainer`, etc. (layout wrappers) |
| 9 | RadioOption | `components/common/RadioOption.tsx` | 2 (MemberInfoPanelComplete, MemberDetailContainer) | `{ selected, onClick?, label, disabled? }` |
| 10 | SecondaryButton | `components/common/SecondaryButton.tsx` | 1 (MessageDetailDrawer) | `{ text, onClick, className?, disabled? }` |
| 11 | CancelButton | `components/common/buttons/CancelButton.tsx` | 3 (MemberInfoPanelComplete, MemberNoteEditor, MemberDetailContainer) | `{ onClick?, label?, className?, disabled? }` |
| 12 | TextIconButton | `components/common/buttons/TextIconButton.tsx` | 2 (InteractiveMessageTable, MainContainer-6001-1415) | `{ text, icon?, iconPosition?, onClick?, className?, variant?, disabled?, textSize? }` |
| 13 | Tag | `components/common/Tag.tsx` | 14+ (core) | `{ children, variant?, onRemove?, className?, onClick? }` |
| 14 | TagItem | `components/common/TagItem.tsx` | indirect via re-exports | `{ tag: Tag, selected?, onClick?, onRemove?, className?, variant? }` |
| 15 | TestEnvHeaderLabel | `components/common/TestEnvHeaderLabel.tsx` | 3 (AIChatbotOverview, FacilitiesContent, PMSIntegration) | no explicit props |
| 16 | ArrowIcon | `components/common/icons/ArrowIcon.tsx` | 2 (InteractiveMessageTable, TextIconButton) | `{ direction?, color?, size?, className? }` |
| 17 | ChannelIcon | `components/common/icons/ChannelIcon.tsx` | 8+ | `{ channel: ChannelPlatform, size?, className? }` |
| 18 | MemberSourceIcon | `components/common/icons/MemberSourceIcon.tsx` | 6+ | `{ source: MemberSourceType, size?, className? }` |
| 19 | PlatformIcon | `components/common/icons/PlatformIcon.tsx` | 2 (ChatBubble, PlatformSwitcher) | `{ platform: ChatPlatform, size?, className? }` |
| 20 | ImageWithFallback | `components/figma/ImageWithFallback.tsx` | 6+ | standard `<img>` attrs + fallback |
| 21 | AuthContext | `components/auth/AuthContext.tsx` | 13+ (core infra) | `{ children }` |

### 1.2 Molecules

由 atoms 組合而成的 UI 群組：搜尋列、表單欄位、卡片標題等。

| # | 元件名 | 路徑 | 使用次數 | Props 介面 | 備註 |
|---|--------|------|----------|------------|------|
| 1 | BasicSettingsEmpty | `components/BasicSettingsEmpty.tsx` | 1 (BasicSettings) | `{ onLineClick, onFacebookClick }` | 平台選擇卡片 |
| 2 | SidebarChannelSwitcher | `components/SidebarChannelSwitcher.tsx` | 1 (Sidebar) | `{ isOpen: boolean }` | 頻道下拉選擇器 |
| 3 | DateTimePicker | `components/DateTimePicker.tsx` | 1 (TriggerTimeOptions) | `DatePicker: { value, onChange, minDate?, maxDate?, placeholder?, onClose? }` / `TimePicker: { value, onChange, placeholder?, onClose? }` | 日期+時間選擇器 |
| 4 | KeywordTagsInput | `components/KeywordTagsInput.tsx` | 1 (CreateAutoReplyInteractive) | `{ tags: string[], onChange, maxTags?, maxTagLength?, required? }` | 關鍵字標籤輸入 |
| 5 | TriggerTimeOptions | `components/TriggerTimeOptions.tsx` | 1 (CreateAutoReplyInteractive) | `{ triggerTime, setTriggerTime, scheduledDateTime, setScheduledDateTime, showScheduledOption?, scheduleMode?, onScheduleModeChange? }` | 排程觸發選項 |
| 6 | ChatBubble | `components/chat-room/ChatBubble.tsx` | 1 (ChatRoomLayout) | `{ message: ChatMessage, memberAvatar?, platform }` | 聊天氣泡 |
| 7 | ChatInput | `components/chat-room/ChatInput.tsx` | 1 (ChatRoomLayout) | `{ onSendMessage, onFocus?, placeholder?, maxLength? }` | 聊天輸入框 |
| 8 | ChatMessageList | `components/chat-room/ChatMessageList.tsx` | 1 (ChatRoomLayout) | `{ messages: ChatMessage[], memberName?, memberAvatar? }` | 訊息列表 |
| 9 | MemberAvatar | `components/chat-room/MemberAvatar.tsx` | 1 (ChatRoomLayout) | `{ member: MemberAvatarProps }` | 頭像+上傳 |
| 10 | MemberTagSection | `components/chat-room/MemberTagSection.tsx` | 1 (via index) | `{ memberTags?, interactionTags?, onUpdateMemberTags?, onUpdateInteractionTags? }` | 標籤區段 |
| 11 | PlatformSwitcher | `components/chat-room/PlatformSwitcher.tsx` | 1 (ChatRoomLayout) | `{ value: ChatPlatform, onChange }` | 平台切換下拉 |
| 12 | MemberNoteEditor (chat-room) | `components/chat-room/MemberNoteEditor.tsx` | 1 (via index) | `{ initialNote?, onSave? }` | 備註編輯（版本 A） |
| 13 | MemberNoteEditor (shared) | `components/shared/MemberNoteEditor.tsx` | 1 (ChatRoomLayout) | `{ initialValue?, onSave?, containerClassName?, innerClassName?, editButtonPosition?, saveButtonPosition? }` | 備註編輯（版本 B） |
| 14 | BlankStateCard | `components/common/BlankStateCard.tsx` | 3 (FacilitiesContent, MessageList, PMSIntegration) | `BlankStateCard: { label, actions }` / `BlankStateContainer` | 空白狀態 |
| 15 | Breadcrumb | `components/common/Breadcrumb.tsx` | 13+ (core) | `{ items: BreadcrumbItem[], className? }` + `PageHeaderWithBreadcrumb`, `SimpleBreadcrumb` | 導覽列 |
| 16 | CategoryTitleDropdown | `components/common/CategoryTitleDropdown.tsx` | 2 (FacilitiesContent, PMSIntegration) | `{ onImport?, onExport?, onDownloadTemplate? }` | 匯入匯出下拉 |
| 17 | ChannelSwitcher | `components/common/ChannelSwitcher.tsx` | 1 (MessageList via slot) | portal-based dropdown | 頻道篩選 |
| 18 | DeleteButton | `components/common/DeleteButton.tsx` | 2 (CreateAutoReplyInteractive, MessageCreation) | `{ onDelete, itemName?, title?, description?, buttonText?, className?, disabled? }` | 刪除+確認 |
| 19 | DeleteConfirmationModal | `components/common/DeleteConfirmationModal.tsx` | 1 (DeleteButton) | `{ open, onOpenChange, onConfirm, title, description, isLoading? }` | 刪除確認對話框 |
| 20 | ImageUploadField | `components/common/ImageUploadField.tsx` | 1 (AIChatbotEditModal) | `{ value, onChange, disabled?, label, aspectRatio?, placeholder? }` | 圖片上傳欄位 |
| 21 | PreviewContainers | `components/common/PreviewContainers.tsx` | 2 (MessageCreation, PreviewPanel) | `TriggerImagePreview`, `TriggerTextPreview`, `GradientPreviewContainer` etc. | 訊息預覽 |
| 22 | SearchContainers | `components/common/SearchContainers.tsx` | 1 (MainContainer-6001-1415) | `{ value, onChange, onSearch, onClear, onClearAll?, placeholder?, className? }` | 搜尋列 |
| 23 | TagList | `components/common/TagList.tsx` | 2+ (MemberInfoPanelComplete, MemberDetailContainer) | `{ tags: string[], variant?, className? }` | 標籤列表 |
| 24 | FBConfigPanel | `components/facebook-message/FBConfigPanel.tsx` | 1 (FacebookMessageEditor) | bubble config form | FB 訊息設定 |
| 25 | FBPreviewPanel | `components/facebook-message/FBPreviewPanel.tsx` | 1 (FacebookMessageEditor) | preview display | FB 訊息預覽 |
| 26 | ConfigPanel (flex) | `components/flex-message/ConfigPanel.tsx` | 1 (FBConfigPanel) | bubble config form | Flex 訊息設定 |
| 27 | PreviewPanel (flex) | `components/flex-message/PreviewPanel.tsx` | 1 (FacebookMessageEditor) | preview display | Flex 訊息預覽 |
| 28 | PreviewPanel (msg-creation) | `components/message-creation/PreviewPanel.tsx` | 1 (MessageCreation) | `CardData` interface | 訊息預覽面板 |
| 29 | ScheduleSettings | `components/message-creation/ScheduleSettings.tsx` | 1 (MessageCreation) | `{ scheduleType, scheduledDate?, scheduledTime, onScheduleTypeChange, onDateChange, onTimeChange, onConfirm? }` | 排程設定 |
| 30 | TargetAudienceSelector | `components/message-creation/TargetAudienceSelector.tsx` | 1 (MessageCreation) | `{ targetType, selectedTags, filterCondition, onTargetTypeChange, onFilterConditionChange, onRemoveTag, onOpenFilterModal }` | 受眾選擇 |

### 1.3 Organisms

由 molecules/atoms 組合而成的複雜 UI 區段：sidebar、聊天室、表格等。

| # | 元件名 | 路徑 | 使用次數 | Props 介面 | 備註 |
|---|--------|------|----------|------------|------|
| 1 | AIChatbotOverview | `components/AIChatbotOverview.tsx` | 1 (AIChatbotPage) | `{ onNavigateTo*... }` | AI 聊天機器人總覽頁 |
| 2 | AutoReply | `components/AutoReply.tsx` | 2 (AutoReplyPage, App) | `{ onBack, onNavigateTo*... }` | 自動回覆主頁 |
| 3 | AutoReplyTableStyled | `components/AutoReplyTableStyled.tsx` | 1 (AutoReply) | `{ data: AutoReplyData[], onRowClick?, onToggleStatus?, onDuplicateKeywordClick? }` | 自動回覆表格 |
| 4 | BasicSettings | `components/BasicSettings.tsx` | 1 (LineApiSettings) | `{ onSetupComplete? }` | 基本設定控制器 |
| 5 | BasicSettingsList | `components/BasicSettingsList.tsx` | 1 (BasicSettings) | `{ accounts: ChannelAccount[], onAddAccount, onReauthorize?, onEdit?, onDelete? }` | 帳號列表表格 |
| 6 | CarouselMessageEditor | `components/CarouselMessageEditor.tsx` | 3 (MessageCreation, MessageDetailDrawer, useMessageForm) | `{ cards, activeTab, onTabChange, onAddCarousel, onUpdateCard, onCopyCard?, onDeleteCarousel?, errors?, selectedPlatform? }` | 輪播訊息編輯器 |
| 7 | ChatFAB | `components/ChatFAB.tsx` | 1 (App) | no props | 浮動聊天按鈕 |
| 8 | ChatRoom | `components/ChatRoom.tsx` | 2 (MessageList, ChatRoomPage) | `{ member, memberId?, memberName?, initialPlatform?, onBack, onNavigateToMemberDetail? }` | 聊天室包裝 |
| 9 | ChatRoomLayout | `components/chat-room/ChatRoomLayout.tsx` | 1 (ChatRoom) | complex ChatRoomLayoutProps | 聊天室主佈局 |
| 10 | CreateAutoReplyInteractive | `components/CreateAutoReplyInteractive.tsx` | 1 (AutoReply) | `{ onBack, onNavigateTo*..., autoReplyId?, onSaved?, onDeleted?, initialReplyType? }` | 自動回覆編輯器 |
| 11 | DownloadConversationsModal | `components/DownloadConversationsModal.tsx` | 1 (MainContainer-6001-1415) | `{ open, onClose, members, boundChannels, initialPlatformFilter? }` | 對話下載 Modal |
| 12 | FacilitiesContent | `components/FacilitiesContent.tsx` | 1 (FacilitiesPage) | `{ onNavigateTo*... }` | 設施管理頁 |
| 13 | FacebookMessageEditor | `components/facebook-message/FacebookMessageEditor.tsx` | 1 (MessageCreation) | `{ onJsonChange?, initialJson? }` | FB 訊息編輯器 |
| 14 | FilterModal | `components/FilterModal.tsx` | 2 (MessageCreation, TargetAudienceSelector) | `{ onClose?, onConfirm?, initialSelectedTags?, initialIsInclude?, channelId? }` | 標籤篩選 Modal |
| 15 | FlexMessageEditorNew | `components/flex-message/FlexMessageEditorNew.tsx` | 2 (MessageCreation, PreviewPanel) | `{ onFlexMessageChange? }` | Flex 訊息編輯器 |
| 16 | InsightsPanel | `components/InsightsPanel.tsx` | 1 (InsightsPage) | no explicit props (uses context) | 數據分析面板 |
| 17 | InteractiveMessageTable | `components/InteractiveMessageTable.tsx` | 1 (MessageList) | `{ messages, onEdit, onViewDetails, statusFilter, channelHeaderSlot? }` | 訊息列表表格 |
| 18 | LineApiSettings | `components/LineApiSettings.tsx` | 2 (App, LineApiSettingsPage) | `{ onBack?, onNavigateTo*... }` | LINE API 設定頁 |
| 19 | LineApiSettingsContent | `components/LineApiSettingsContent.tsx` | 1 (BasicSettings) | `{ onComplete?, onBack?, editingChannelId? }` | LINE API 設定精靈 |
| 20 | Login | `components/auth/Login.tsx` | 1 (App) | no explicit props | 登入頁 |
| 21 | MainLayout | `components/layouts/MainLayout.tsx` | 3 (ChatRoomPage, MemberDetailPage, MemberManagementPage) | `{ children, currentPage?, sidebarOpen?, onToggleSidebar? }` | 頁面佈局殼 |
| 22 | MemberInfoPanel | `components/chat-room/MemberInfoPanel.tsx` | 1 (via index) | `{ member: Member }` | 會員資訊表單 |
| 23 | MemberInfoPanelComplete | `components/chat-room/MemberInfoPanelComplete.tsx` | 2 (ChatRoomLayout, MemberDetailContainer) | `{ member, memberTags?, interactionTags?, conversionTags?, onEditTags?, channelName? }` | 完整會員資訊 |
| 24 | MemberTagEditModal | `components/MemberTagEditModal.tsx` | 4+ (ChatRoomLayout, MemberTagSection, MainContainer-6001-1415, MemberDetailContainer) | complex: scrollRef, tags, search, selection, save callbacks | 標籤編輯 Modal |
| 25 | MessageCreation | `components/MessageCreation.tsx` | 1 (FlexEditorPage) | complex navigation + message context | 訊息建立頁 |
| 26 | MessageDetailDrawer | `components/MessageDetailDrawer.tsx` | 1 (MessageList) | `{ open, onClose, messageId, onEdit? }` | 訊息詳情抽屜 |
| 27 | MessageList | `components/MessageList.tsx` | 2 (App, MessageListPage) | `{ onCreateMessage, onEditMessage?, onNavigateTo*... }` | 訊息列表頁 |
| 28 | PMSIntegration | `components/PMSIntegration.tsx` | 1 (PMSPage) | `{ onNavigateTo*... }` | PMS 整合管理頁 |
| 29 | Sidebar | `components/Sidebar.tsx` | 13+ (core) | `{ currentPage?, onNavigateTo*..., sidebarOpen?, onToggleSidebar?, navigationLocked?, lockedTooltip? }` | 應用側邊欄 |
| 30 | StaffUsersManagement | `components/StaffUsersManagement.tsx` | 1 (StaffUsersPage) | uses PageWithSidebar wrapper | 員工管理頁 |
| 31 | AIChatbotEditModal | `components/chatbot/AIChatbotEditModal.tsx` | 2 (FacilitiesContent, PMSIntegration) | complex: RoomEditModal, FacilityEditModal exports | 聊天機器人編輯 Modal |

**未使用 (Dead Code):**
- `AccountLimitModal` — `components/AccountLimitModal.tsx` (0 imports)
- `ChannelSelector` — `components/ChannelSelector.tsx` (0 imports)

---

## 2. 未 Componentized 的 Inline UI

掃描所有 `src/pages/` 和 `src/App.tsx` 中應被抽取為元件的 inline UI pattern。

### 2.1 FullPageSpinner

| 項目 | 內容 |
|------|------|
| **位置** | `App.tsx:129-137`, `App.tsx:160-166`, `pages/FlexEditorPage.tsx:172-179` |
| **出現次數** | 3 次，跨 2 個檔案 |
| **Pattern** | 全螢幕置中 spinner + 文字訊息（`flex items-center justify-center` + animated border spinner + `<p>` 狀態文字） |
| **差異** | App.tsx 用 `border-4 border-current border-r-transparent`，FlexEditorPage 用 `h-12 w-12 border-b-2 border-gray-900` |
| **建議名稱** | `FullPageSpinner` |
| **建議 level** | atom |
| **優先級** | **高** — 出現 3+ 次，且 components/ 內可能還有更多 |

### 2.2 NavigationCallbackProps (架構模式)

| 項目 | 內容 |
|------|------|
| **位置** | `pages/AIChatbotPage.tsx:11-17`, `pages/AutoReplyPage.tsx:11-15`, `pages/FacilitiesPage.tsx:11-16`, `pages/InsightsPage.tsx:11-14`, `pages/LineApiSettingsPage.tsx:11-14`, `pages/MessageListPage.tsx:17-19`, `pages/PMSPage.tsx:11-15`, `pages/StaffUsersPage.tsx:8-12` |
| **出現次數** | 8 個 pages |
| **Pattern** | 每個 page 傳遞近乎相同的 `onNavigateToMessages`, `onNavigateToAutoReply`, `onNavigateToMembers`, `onNavigateToSettings` callback props |
| **建議名稱** | `usePageNavigation` hook（已有 `NavigationContext`，子元件應直接使用） |
| **建議 level** | hook (非視覺元件) |
| **優先級** | **高** — 8/12 頁面重複此模式，消除後可大幅簡化 props 介面 |

### 2.3 AlertBanner (警告橫幅)

| 項目 | 內容 |
|------|------|
| **位置** | `App.tsx:153-156` |
| **出現次數** | 1 次 |
| **Pattern** | `fixed top-0 left-0 right-0 z-[120] bg-amber-50 border-b border-amber-300` 警告橫幅，顯示未指派 LINE channel 訊息 |
| **建議名稱** | `AlertBanner` |
| **建議 level** | atom |
| **優先級** | **低** — 單次出現，但為可複用 pattern |

### 2.4 Inline API Call Pattern

| 項目 | 內容 |
|------|------|
| **位置** | `pages/FlexEditorPage.tsx:25-50` (DELETE), `pages/FlexEditorPage.tsx:54-168` (GET) |
| **出現次數** | 2 次在此檔案，components/ 中預估 20+ 次 |
| **Pattern** | `localStorage.getItem('auth_token')` → `fetch()` with `Authorization: Bearer` → `response.ok` check → JSON parse → `toast.error()` |
| **建議名稱** | `useApiClient` hook 或 extend 既有 `utils/apiClient.ts` |
| **建議 level** | hook/utility (非視覺元件) |
| **優先級** | **高** — 全 codebase 大量重複 |

### 2.5 MemberDisplayData (資料轉換)

| 項目 | 內容 |
|------|------|
| **位置** | `pages/MemberDetailPage.tsx:43-68` (`getChannelSpecificData` useMemo), `pages/MemberDetailPage.tsx:95-118` (`memberData` transformation) |
| **出現次數** | 1 次在 pages（components/ 可能有更多） |
| **Pattern** | 根據 `platform` (LINE/Facebook/Webchat) 提取正確的 avatar URL 和 display name，大量 `(member as any)` 強制轉型 |
| **建議名稱** | `useMemberDisplayData` hook |
| **建議 level** | hook/utility |
| **優先級** | **中** — 單點出現，但 type safety 問題值得修正 |

---

## 3. 重複實作偵測

### 3.1 Primary Button (深色填充按鈕) — 20+ 實作

**嚴重程度：🔴 最高**

同一個 `bg-[#242424] rounded-[16px] min-h-[48px]` 深色按鈕 pattern 在超過 20 個檔案中被 inline 重複實作。

| 實作 | 檔案 | 特徵 |
|------|------|------|
| shadcn Button | `components/ui/button.tsx` | ✅ 正確的可複用元件，CVA variants |
| Figma import A | `imports/Button-8027-97.tsx` | ❌ 硬編碼 "聊天" 文字，用 `<div>` 非 `<button>` |
| Figma import B | `imports/ButtonFilledButton.tsx` | ❌ 硬編碼 "傳送"，無 onClick |
| Figma import C | `imports/ModalButton.tsx` | ❌ 硬編碼 "儲存"，無 onClick |
| Inline | `FilterModal.tsx:508` | ❌ inline `<div>` dark button |
| Inline | `MemberTagEditModal.tsx:481` | ❌ inline `<div>` dark button |
| Inline | `AccountLimitModal.tsx:43` | ❌ inline `<button>` dark button |
| Inline | `DownloadConversationsModal.tsx:252` | ❌ inline `<div>` dark button |
| Inline | `shared/MemberNoteEditor.tsx:106` | ❌ inline `<div>` dark button |
| Inline | `AutoReply.tsx:303`, `ChatRoom.tsx:74`, `StaffUsersManagement.tsx:293`, `FacilitiesContent.tsx:860`, `PMSIntegration.tsx:1143`, `MessageList.tsx:176`, `BasicSettingsList.tsx:141`, `CreateAutoReplyInteractive.tsx:693` | ❌ 各自 inline |

**差異點：**
- 有的用 `<div>`，有的用 `<button>`
- hover 效果不一致（有/無）
- `cursor-pointer` 不一定都有
- Figma imports 的文字是硬編碼的

**建議：** 統一使用 `components/ui/button.tsx`，新增專案專用 variant 匹配 Figma 設計規格。

---

### 3.2 Cancel/Secondary Button (淺色按鈕) — 12+ 實作

**嚴重程度：🟠 高**

| 實作 | 檔案 | 特徵 |
|------|------|------|
| CancelButton | `common/buttons/CancelButton.tsx` | `<div role="button">`，支援 disabled/label |
| SecondaryButton | `common/SecondaryButton.tsx` | pill-shaped `rounded-[32px]` `bg-[#f0f6ff]`，手動 hover state |
| TextIconButton | `common/buttons/TextIconButton.tsx` | text+icon combo，有 variant 系統 |
| Inline (6+) | ModalBlank, ModalNormal, FilterModal, MemberTagEditModal, DownloadConversationsModal 等 | 各自 inline |

**差異點：** CancelButton 是方形圓角，SecondaryButton 是膠囊形，造型完全不同。

**建議：** 整合進 shadcn `button.tsx` 的自定 variants (`cancel`, `secondary-pill`, `text-icon`)。

---

### 3.3 Modal Overlay (Modal 背景遮罩) — 6+ 實作

**嚴重程度：🟠 高**

| 實作 | 檔案 | z-index | 背景色 |
|------|------|---------|--------|
| 手動 | `AccountLimitModal.tsx` | `z-50` | `bg-black/50` |
| 手動 | `MemberTagEditModal.tsx` | `z-[9998]` + `z-[9999]` | `bg-black/50` |
| 手動 | `DownloadConversationsModal.tsx` | `z-50` | `bg-black/50` |
| 手動 | `AIChatbotEditModal.tsx` | `fixed inset-0` | 手動 overlay |
| 無 overlay | `FilterModal.tsx` | — | 預期外部提供 |
| shadcn | `components/ui/dialog.tsx` | Radix-based | ✅ 正確方式 |
| shadcn | `components/ui/alert-dialog.tsx` | Radix-based | ✅ 正確方式 |

**差異點：** z-index 嚴重不一致（`z-50` vs `z-[9998]`），背景色不一致。

**建議：** 所有 modal 統一使用 shadcn `Dialog` 或 `AlertDialog`。

---

### 3.4 Modal Footer (Cancel + Confirm 按鈕對) — 8+ 實作

**嚴重程度：🟠 高**

每個 modal 都自己 inline 重做一對 cancel/confirm 按鈕：
- `imports/ModalBlank.tsx:160-173`
- `imports/ModalNormal.tsx:306-319`
- `FilterModal.tsx:504-509`
- `MemberTagEditModal.tsx:471-488`
- `DownloadConversationsModal.tsx:241-259`
- `AccountLimitModal.tsx:42-49`
- `CreateAutoReplyInteractive.tsx:693`
- `AIChatbotEditModal.tsx`

**建議：** 抽取 `ModalFooter` molecule，標準 cancel/confirm slots。

---

### 3.5 Tag/Badge — 5 個不同實作

**嚴重程度：🟡 中**

| 實作 | 檔案 | API |
|------|------|-----|
| Tag ✅ | `common/Tag.tsx` | `{ children, variant?, onRemove?, onClick? }` |
| TagItem | `common/TagItem.tsx` | `{ tag: {id, name}, selected?, onClick?, onRemove? }` |
| TagList | `common/TagList.tsx` | `{ tags: string[], variant? }` |
| Badge (shadcn) | `ui/badge.tsx` | CVA variants，未被專案使用 |
| Tag (Figma) | `imports/Tag.tsx` | 靜態，無互動 |

**差異點：** `Tag` 用 `children`，`TagItem` 用 `{id, name}` 物件。兩者都支援 removable 但 API 不同。

**建議：** 保留 `common/Tag.tsx` 為 canonical，將 `TagItem` 的 `selected`/`available` variants 合併進去，刪除 `imports/Tag.tsx`。

---

### 3.6 MemberNoteEditor — 2 個不同實作

**嚴重程度：🟡 中**

| 版本 | 檔案 | 風格 |
|------|------|------|
| A (shared) | `shared/MemberNoteEditor.tsx` | 鉛筆圖標 + dark save button，支援 className 自定 |
| B (chat-room) | `chat-room/MemberNoteEditor.tsx` | 藍色文字按鈕，`hasChanges` disabled 邏輯，內建 "備註" 標題 |

**差異點：** 完全不同的視覺風格和 prop 介面（`initialValue` vs `initialNote`）。

**建議：** 合併至 `shared/MemberNoteEditor.tsx`，加入 B 版的 `hasChanges` 邏輯。

---

### 3.7 Channel/Platform Switcher — 4 個類似元件

**嚴重程度：🟡 中**

| 實作 | 檔案 | 模式 |
|------|------|------|
| ChannelSelector | `ChannelSelector.tsx` | multi-select checkboxes（已死碼） |
| PlatformSwitcher | `chat-room/PlatformSwitcher.tsx` | single-select dropdown |
| ChannelSwitcher | `common/ChannelSwitcher.tsx` | portal-based dropdown |
| SidebarChannelSwitcher | `SidebarChannelSwitcher.tsx` | sidebar dropdown |

**差異點：** 概念相同（讓使用者選擇 channel），但 single/multi select 不同，dropdown 渲染邏輯各異。

**建議：** 建立統一的 `ChannelPicker` molecule 支援 single/multi 模式。

---

### 3.8 Custom Scrollbar — 2 個實作

**嚴重程度：🟡 中**

| 版本 | 檔案 | 品質 |
|------|------|------|
| A | `MemberTagEditModal.tsx:13-112` | ✅ 優化版：RAF + ResizeObserver + MutationObserver |
| B | `FilterModal.tsx:188-268` | ❌ naive 版：useState only，無 RAF |

**建議：** 抽取 A 版至 `common/CustomScrollbar.tsx`，刪除 B 版 inline 實作。

---

### 3.9 Toggle/Switch — 4 個實作

**嚴重程度：🟢 低**

| 實作 | 檔案 | 狀態 |
|------|------|------|
| shadcn Switch ✅ | `ui/switch.tsx` | Radix-based，proper accessible |
| Figma Toggle | `imports/Toggle.tsx` | 靜態 SVG，無互動 |
| Figma SwitchButton | `imports/SwitchButtonActive.tsx` | 靜態 |
| Inline SVG | `FilterModal.tsx:361-376` | 手動 SVG path swap |

**建議：** 全部使用 shadcn `Switch`，刪除靜態 imports。

---

### 3.10 ButtonEdit — 2 個 variants

**嚴重程度：🟢 低**

| 版本 | 檔案 | 差異 |
|------|------|------|
| A | `imports/ButtonEdit.tsx` | 28x28, blue (#0F6BEB)，有 onClick/hidden props |
| B | `imports/ButtonEdit-8025-230.tsx` | 24px, white icon，只有 className prop |

**建議：** 保留 A，以 props 控制顏色/大小。刪除 B。

---

## 4. 命名不一致

### 4.1 imports/ vs components/ 名稱衝突

| imports/ 檔案 | components/ 對應 | 問題 |
|---------------|-----------------|------|
| `imports/Tag.tsx` | `common/Tag.tsx` | **同名不同物**：imports 是靜態按鈕，common 是 proper Tag 元件 |
| `imports/Drawer.tsx` | `ui/drawer.tsx` | **同概念不同實作**：imports 靜態 Figma，ui 是 shadcn |
| `imports/Toast.tsx` | `ToastProvider.tsx` + sonner | imports 靜態，components 用 sonner 庫 |
| `imports/Tooltip.tsx` | `ui/tooltip.tsx` | imports 靜態，ui 是 shadcn |
| `imports/Toggle.tsx` | `ui/toggle.tsx` | imports 靜態 SVG，ui 是 shadcn |
| `imports/RadioButton.tsx` | `ui/radio-group.tsx` + `common/RadioOption.tsx` | imports 靜態，components 有兩個工作版本 |
| `imports/TextArea.tsx` | `ui/textarea.tsx` | imports 靜態，ui 是 shadcn |
| `imports/Card.tsx` | `ui/card.tsx` | imports 是 LINE API organism，ui 是 shadcn generic Card |
| `imports/IconButton.tsx` | `common/buttons/TextIconButton.tsx` | 不同的 icon button 實作 |
| `imports/Container.tsx` | `common/Containers.tsx` | 泛用名稱衝突 |
| `imports/HeaderContainer.tsx` | `common/Containers.tsx` 中的 export | imports 靜態，shared 可配置 |

### 4.2 Figma Node ID 命名

以下檔案保留了 Figma node ID，無法從名稱理解用途：
- `Button-8027-97.tsx` — 實際是 "聊天" 按鈕
- `ButtonEdit-8025-230.tsx` — 實際是白色 edit icon
- `Container-8548-103.tsx` — 實際是圓形會員頭像 placeholder
- `MainContainer-6001-1415.tsx` — 實際是**完整的會員列表頁面**（1463 行）
- `PrimitiveDiv-8496-462.tsx` — 實際是 date picker
- `DescriptionContainer-8423-31.tsx` — 實際是 LINE 訊息用量進度條
- `LineApi基本設定-8492-292.tsx` — Figma node ID + 中文

### 4.3 中文檔名

- `imports/LineApi基本設定.tsx` (773 行)
- `imports/LineApi基本設定-8492-292.tsx` (330 行)

可能造成工具鏈問題（CI/CD, git, IDE autocomplete）。

### 4.4 功能重疊命名

| 名稱 A | 名稱 B | 重疊 |
|--------|--------|------|
| `MemberNoteEditor` (shared/) | `MemberNoteEditor` (chat-room/) | **完全同名**，不同實作、不同目錄 |
| `PreviewPanel` (flex-message/) | `PreviewPanel` (message-creation/) | **完全同名**，不同功能 |
| `ConfigPanel` (flex-message/) | `FBConfigPanel` (facebook-message/) | 類似名稱，類似功能 |
| `Tag` (common/) | `TagItem` (common/) | 語義重疊 |
| `CancelButton` | `SecondaryButton` | 語義重疊 |
| `ChannelSwitcher` | `SidebarChannelSwitcher` | 語義相似 |
| `ChannelIcon` | `PlatformIcon` | PlatformIcon 實際只是 ChannelIcon 的 wrapper |

### 4.5 Casing 不一致

整體專案使用 **PascalCase** 的 `.tsx` 檔案，一致性尚可。唯一例外：
- `components/ui/*.tsx` 使用 **kebab-case**（shadcn 慣例，可接受）
- `svg-*.ts` 使用 **kebab-case with random IDs**（自動產生，可接受）

---

## 5. imports/ 目錄分析

### 概況

`src/imports/` 包含 **67 個 .tsx 元件檔案**，絕大多數是 **Figma 自動匯出**的靜態 mockup。

### 實際被使用的（僅 5 個）

| 檔案 | 用途 | 使用處 |
|------|------|--------|
| `ButtonEdit.tsx` | 編輯圖標按鈕 | 8+ 個 components |
| `ButtonEdit-8025-230.tsx` | 白色編輯圖標 | 3 個 chat-room components |
| `Container-8548-103.tsx` | 會員頭像 placeholder | ChatRoomLayout |
| `MainContainer-6001-1415.tsx` (1463 行) | **完整會員列表頁面** | MemberManagementPage |
| `MemberDetailContainer.tsx` (2434 行) | **完整會員詳情頁面** | MemberDetailPage |

### 已被取代的靜態 mockup（~45 個）

應被清理的靜態 Figma 匯出：
- Modal 相關：`ModalBlank.tsx`, `ModalNormal.tsx`, `ModalContent.tsx`, `MemberTagModalNormal.tsx`, `MemberTagModalFuzzySearchCreation.tsx`
- 表單相關：`Toggle.tsx`, `RadioButton.tsx`, `TextArea.tsx`, `SwitchButtonActive.tsx`
- 按鈕相關：`ButtonFilledButton.tsx`, `ModalButton.tsx`, `SplitButton.tsx`, `IconButton.tsx`
- Layout：`Container.tsx`, `HeaderContainer.tsx`, `ContentContainer.tsx`, `Drawer.tsx`, `Mask.tsx`
- 其他：`Toast.tsx`, `Tooltip.tsx`, `Tag.tsx`, `Card.tsx`, 所有 `SelectTargetAudience*.tsx`, `LineApi基本設定*.tsx`, `LineFlexMessageBuilder.tsx`, `Table8Columns3Actions.tsx` (1834 行), `PrimitiveDiv.tsx` (2094 行)

### 需要遷移的

`MainContainer-6001-1415.tsx` 和 `MemberDetailContainer.tsx` 是功能完整的頁面元件（共 ~4000 行），不應該放在 `imports/`。應遷移至 `components/` 或 `pages/`。

---

## 6. 總結統計

### 現有元件分類

| Level | 數量 | 佔比 |
|-------|------|------|
| **Atoms** | 21 | 27% |
| **Molecules** | 30 | 39% |
| **Organisms** | 31 | 40% |
| **Dead Code** | 2 | — |
| **shadcn/ui Atoms** | 48 | (third-party, 未計入) |

> 含 shadcn/ui 共計 **132** 個元件。

### 建議新增的元件/Hook

| # | 名稱 | Level | 優先級 | 原因 |
|---|------|-------|--------|------|
| 1 | `FullPageSpinner` | atom | 高 | 3+ 處 inline 重複 |
| 2 | `ModalFooter` | molecule | 高 | 8+ 處 inline 重複 |
| 3 | `CustomScrollbar` | atom | 中 | 2 處重複實作（抽取既有最佳版本） |
| 4 | `ChannelPicker` | molecule | 中 | 統一 4 個相似 channel switcher |
| 5 | `AlertBanner` | atom | 低 | 1 處 inline，可複用 pattern |
| 6 | `usePageNavigation` | hook | 高 | 消除 8 頁面的 prop-drilling |
| 7 | `useApiClient` | hook | 高 | 統一 20+ 處 fetch+auth pattern |
| 8 | `useMemberDisplayData` | hook | 中 | 統一 member 資料正規化 |

### 建議整合/刪除

| 動作 | 目標 | 優先級 |
|------|------|--------|
| 統一至 shadcn `Button` | 20+ inline dark buttons | 高 |
| 統一至 shadcn `Dialog` | 6+ 手動 modal overlay | 高 |
| 合併 `TagItem` → `Tag` | 2 個類似 tag 元件 | 中 |
| 合併 `MemberNoteEditor` | 2 個不同版本 | 中 |
| 統一至 shadcn `Switch` | 4 個 toggle 實作 | 低 |
| 刪除 `ButtonEdit-8025-230` | 與 `ButtonEdit` 重複 | 低 |
| 刪除 `ChannelSelector` | dead code | 低 |
| 刪除 `AccountLimitModal` | dead code | 低 |
| 清理 ~45 個靜態 Figma imports | dead mockups | 中 |
| 遷移 `MainContainer-6001-1415` + `MemberDetailContainer` 出 imports/ | 放錯位置 | 高 |

### 最終計數

| 類別 | 數量 |
|------|------|
| 現有 Atoms | **21** |
| 現有 Molecules | **30** |
| 現有 Organisms | **31** |
| 建議新增元件 | **5** (atoms: 3, molecules: 2) |
| 建議新增 Hooks | **3** |
| 可刪除的重複/Dead Code | **~49** 個檔案 |
| 需要整合的重複實作 | **6** 組 |
