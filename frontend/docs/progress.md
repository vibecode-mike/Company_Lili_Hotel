# 前端 Design Token 遷移 — 進度與接續指南

> 最後更新：2026-06-19
> 用途：明天打開就能照著接續。本檔 = 唯一進度真相來源。
> 對照表（舊硬寫值 → 新 token）：**`docs/token-migration-map.md`**
> 元件盤點：`docs/component-audit.md`

---

## ✅ 已釐清並落地：工作區既存 WIP（捲軸表格圓角裁切，非圓角批次）

> 記錄時間：2026-06-19。**狀態：已查證 = 自己 6/18 下午做的「捲軸表格圓角裁切」延續工作、100% 純前端、與圓角批次零衝突。已 reflow 內層縮排後 commit 成獨立一包 `97eb29ae`（單一主題；3 個 `.serena/project.yml` 工具設定檔未包入）。尚未 push，待 crmpoc 驗收。**

開始今天圓角批次時，`git status` 已有 **14 個 modified 檔**（早於本 session 就存在），經查**不是圓角**，而是一批做到一半的**捲軸 scrollbar 收斂 + 表格圓角裁切**工程（風格同 §4.5 的 `2a7b07c6` scrollbar 批 / 捲軸 C3 雙軸表格）。三個主題：

**主題 1：`<main>` 捲動區補 `scrollbar-transparent`**（各 1 行）
- `CreateAutoReplyInteractive.tsx`、`InsightsPanel.tsx`、`MessageCreation.tsx`、`MessageList.tsx`、`Sidebar.tsx`、`layouts/MainLayout.tsx`、`AIChatbotOverview.tsx`(main 那行)

**主題 2：表格「圓角裁切層」重構**（外加 `<div rounded-[16px] overflow-hidden>` 包裹 + 內層 `overflow-x-auto scrollbar-transparent`，並把 `table-scroll` 換成 `scrollbar-transparent`；註解「讓水平捲軸收在圓角內、不凸出」）
- `AutoReplyTableStyled.tsx`、`InteractiveMessageTable.tsx`、`FacilitiesContent.tsx`、`PMSIntegration.tsx`、`AIChatbotOverview.tsx`(表格部分)

**主題 3：雜項 scrollbar 收斂**
- `common/styles.ts`（`scrollable`/`scrollContainer` 加 `scrollbar-transparent`）
- `flex-message/PreviewPanel.tsx`（`scrollbar-hide` → `scrollbar-transparent`）
- `imports/MainContainer-6001-1415.tsx`（`table-scroll` → `scrollbar-transparent`；注意此為 Figma 匯出檔卻被改）

### 🚩 與圓角批次的檔案重疊（**必須先釐清這批 WIP 才能繼續這些圓角批次**）
| 圓角批次 | 重疊到的 WIP 檔 |
|---|---|
| **群發訊息群（B2 下一批）** | `MessageCreation.tsx`、`AutoReplyTableStyled.tsx` |
| **B4（15→16）** | `CreateAutoReplyInteractive.tsx` |
| **B5（32/80→full）** | `AIChatbotOverview.tsx`、`MessageList.tsx` |
| **B（2px→2xs）** | `InsightsPanel.tsx` |
| **B6（Figma 垃圾值→full）** | `CreateAutoReplyInteractive.tsx` |
| **Part C 零像素 sweep** | `FacilitiesContent.tsx`、`PMSIntegration.tsx`、`InteractiveMessageTable.tsx`（含 `rounded-[16px]`）等多檔 |

> 在這些檔上動圓角，會和上述 WIP 混在同一工作區、無法乾淨切分（不像 `LineApiSettings.tsx` 只有 1 行可輕鬆分開）。處理順序：**先釐清/落地這批 WIP（commit 成它自己的包，或 stash）→ 工作區乾淨 → 再繼續重疊到的圓角批次**。沒重疊的（如 `CarouselMessageEditor`、`AutoReply`）可先做。

### ⚠️ 協調點：圓角值批次的執行順序與位置（WIP 已 commit `97eb29ae` 後新增）

這批 WIP 已落地，工作區乾淨，重疊不再是阻塞。但**圓角值批次接手時必須注意**：

1. **順序固定**：**這批 WIP 先（已 commit `97eb29ae`）→ 圓角值批次後**。圓角值批次（尤其「群發訊息群 B2」、「Part C 零像素 sweep」）會去編輯這批剛動過位置的表格 `rounded-[16px]`，必須疊在 WIP 之上做，不可反序、不可另開分支平行改同一行（會文字衝突）。
2. **圓角現在掛在「外層 wrapper」的 div 上**：B 類 5 表格（`AutoReplyTableStyled` / `InteractiveMessageTable` / `AIChatbotOverview` / `FacilitiesContent` / `PMSIntegration`）的 `rounded-[16px]` 已從原本的捲動容器**搬到新加的 `overflow-hidden` 外層 wrapper**。圓角值批次要改表格圓角值時，**改那個外層 wrapper 的 `rounded-[16px]`，不是內層 `overflow-x-auto` 那層**（內層已不帶圓角）。
3. WIP 只動「結構位置 + overflow-hidden 裁切」、**沒動圓角數值**（仍是 16）；數值統一仍由圓角值批次負責。兩者是互補、非衝突。

---

## 0. 一句話現況

「切廚房」已完成並上線到 staging —— 前端已改用 **live Tailwind v4 即時編譯**（不再用預編譯靜態 CSS）。
「逐類 token 遷移」**一次只動一個變數**。**字體 Inter→Noto 已於 dev 完成（待 staging 驗收）**。下一個變數＝**圓角 Radius**（待辦 C）。

---

## 1. ✅ 已完成（已 push 到 `main`，staging 已部署、CI 綠燈）

三筆 commit，建議用 `git log --oneline -5` 對照：

| # | commit | 內容 |
|---|--------|------|
| 1 | `d1c328aa` | **build(切廚房)**：前端改用 live Tailwind v4 編譯，停用預編譯靜態 index.css |
| 2 | `261ed4c8` | 暫時隱藏聊天室連線狀態點與刷新鈕（保留程式碼，待後續決定） |
| 3 | `8817a30b` | 移除已停用的預編譯 index.css（切廚房後不再使用，−5501 行死檔） |

**切廚房（#1）具體做了什麼**
- 裝 `tailwindcss@4.1.3` + `@tailwindcss/vite@4.1.3` + `tw-animate-css@1.4.0`（後者補回 shadcn/Radix 的 animate-in/fade/slide/zoom 開關動畫，core Tailwind 沒有）
- `vite.config.ts` → **改名 `vite.config.mts`**（@tailwindcss/vite 是 ESM-only），並加 `tailwindcss()` plugin
- `src/styles/globals.css` 頂部加 `@import "tailwindcss";` + `@import "tw-animate-css";`
- `src/main.tsx` 移除 `import "./index.css"`
- 把 index.css 唯一沒被 globals.css 涵蓋的手寫規則 `.row-divider > td`（表格列分隔線）搬進 globals.css
- **唯一刻意的視覺變化**：`--radius-xl` 14px → 12px（影響既有 `rounded-xl` ×5）
- 已驗證：新 build 2026 條 selector vs 舊 1024 → 舊靜態檔嚴重過時、漏掉約 1000 個元件實際在用的 class，現在 live 編譯一次補齊；零真實退化。

**#2 隱藏元件的暫掛狀態（待後續決定恢復 or 移除）**
- 位置：`src/components/chat-room/ChatRoomLayout.tsx` 約 1227（連線狀態點）/ 1237（刷新鈕）
- 作法：以 `false &&` 不渲染；功能邏輯（`isRealtimeConnected` / `loadChatMessages`）完整保留
- **恢復方式**：把那兩處 `false` 改回 `true` 即可

---

## 2. ⏳ 待辦清單（依建議順序）

> 原則：每一項 = 一個獨立變數 = 獨立一筆（或一小批）commit，做完先在 staging 驗收，OK 再下一項。

- [x] **A. docs 納管** —— 已 commit（`aa6a5911`：token-migration-map / component-audit / progress 三份）。
- [x] **B. 字體 Inter→Noto** —— dev 已完成（清單見 `docs/font-inter-to-noto.md`，9 元件檔 ×29 處 + `styles.ts` 死常數 + `globals.css .booking-url-text`；移除 `font-['Inter…']` 改繼承全域 Noto）。`build` 通過、scope 內零殘留。**待 staging 眼睛確認**（尤其訊息預覽 JP 示意字）。注意：PingFang 只在 `src/imports/` 死碼、不在範圍。
- [x] **C. 圓角 Radius**：把元件內 `rounded-[Npx]` 收斂到 token 名。對照 `token-migration-map.md` §2（⚠️ 數字真相以 `globals.css @theme` 為準，見 §2a）。**✅ 已完成（2026-06-23）：值會變的批次（A/B/C/D/E/F/G）+ 純換名 sweep P1–P9 全部 push 上線、CI 綠、crmpoc 驗收 OK。唯 FB 待粉專 5 處擱置。** 進度見下方「C 圓角進度」。

### 📌 C 圓角進度（2026-06-19 收工封存）

> 真相來源 = `globals.css @theme`。策略（選 B）：**先做「值會變」的，純換名 sweep 留到最後**。逐頁 commit、crmpoc 驗收、push staging 綠燈才下一批。今晚全部已上 staging。

**🔑 三個定案（明天直接照做，勿再議）**
1. **共用卡片 = 選項 1：全域 16**（`FlexMessageCardPreview` 卡片角 `10→16`，**接受聊天室卡片變圓**）。
2. **設定頁 target = 16**（`rounded-[14px]→16`，+2px，設計裁示「大面板配大圓角更服貼」；token map 已更正）。
3. **`token-migration-map.md` 今天修了 3 個錯**（① 階梯 sm/lg 退役 ② 80px 是 8px 進度條非膠囊鈕 ③ 14px→16 非 12）→ **它是施工期暫用對照表，Part C sweep 完成後退場**（見 §2a）。

**✅ 今晚完成（全已 push、staging 綠燈、prod 未碰）**
- 會員表止血（`4f620f2c`，幽靈橫捲軸消，雙軸完整修留雙軸表格批）+ docs 文件治理（`3457f7ec`）
- 群發訊息群：B2a 零變化（`447ef790`）+ B2b 15→16 預覽框/80px→full 進度條（`9869af13`）
- 數據洞察（`393102a3`，含 2xs 首用）
- AI Chatbot / PMS / 設施 三頁零變化（`e5727c1f`）
- 第一梯值會變：D 關鍵字回應 15→16+垃圾→full（`56fcaeb3`）、E 帳號管理 6→8（`ae970a96`）、F 聊天室頭像 158.824→full（`bafef36d`）、G ErrorBoundary 10→12（`28b85bcc`，信 diff 未目視）

**⬜ 圓角剩餘待辦（明天，按此順序）**
1. ~~**C 設定頁 14→16 ×19**~~ ✅ **完成（`65ab3fd8`，push staging 綠燈）** —— `LineApiSettingsContent.tsx`，`rounded-[14px]`×10 + `rounded-t-[14px]`×9 → `rounded-2xl`/`rounded-t-2xl`(16)，+2px。
2. ~~**A 共用卡片 10→16 ⭐高風險**~~ ✅ **完成（`01e58fc1`，push staging 綠燈）** —— `FlexMessageCardPreview`（在 `CarouselMessageEditor.tsx`）。實際分類：**131 卡片根（函式體內唯一 10px）→16（`rounded-2xl`，設計值，三處渲染同步變圓）**；**編輯器容器 ×13 →12（`rounded-xl`，歸位）**；**標籤 chip 6→8（`rounded-md`）**。三處渲染（聊天室 `chat-room/FlexMessageRenderer.tsx:52`、詳情抽屜 `MessageDetailDrawer.tsx:123`、編輯器預覽 `CarouselMessageEditor.tsx:539`）皆已驗收 OK。
   - **padding 同心決策（2026-06-22）**：三處卡片都 `justify-center/items-center` **置中浮在框內**（預覽框左右浮 ~80px/上下 24px、抽屜再 scale 0.6），**卡片角與框角不相鄰、四邊內縮不等 → 不存在同心約束**。卡片角 10→16 是自洽變化，**padding 不動**。當初定案「pad24→4 / pad12→4」假設了「卡片貼框需同心」，讀結構發現前提不成立 → **移交間距批次（待辦 D）評估「卡片貼滿框（pad→4）」要不要做**，不混進圓角批。
3. **B FB chip ⏸ 擱置（待粉專，2026-06-22）** —— **CarouselMessageEditor 的 10px/6px 已全在 A 處理完**；B 只剩 **`FBConfigPanel.tsx:60` 標籤 chip `rounded-[6px]`→`rounded-md`(8)**（1 處，與 A 已驗收的 Carousel chip:321 byte 級同款）。改動極小且不碰捲軸結構，但 **chip 只在 FB 渠道編輯器（群發→建立訊息→渠道選 FB 粉專→FBConfigPanel 標籤區）出現，crmpoc 未綁 FB 粉專就驗不到** → 已 revert 回 `rounded-[6px]`、**擱置待有粉專再做**。render chain 已確認活的：`MessageCreation:2625`→`FacebookMessageEditor:407`→`FBConfigPanel`。
4. **Part C 全站純換名 sweep** —— 圓角值全定案後，把全站剩餘 on-ladder arbitrary（`8/12/16/20/4/2px` 及 directional）一次按頁換成 token 名，**零變化**。含晶片/modal/內層那些還是 `rounded-[8px]` 的。sweep 完 → `token-migration-map.md` 退場。
5. ~~**dead code 刪除（獨立 commit）**~~ ✅ **完成（2026-06-23，A `8d152087` / B `1cd21127`，獨立 commit 不混圓角；待 push）** ——
   - **Group A**：5 個未掛載元件死檔（`flex-message/ConfigPanel`、`flex-message/FlexMessageEditorNew`、連帶 `message-creation/PreviewPanel`、`chat-room/MemberInfoPanel`、`chat-room/MemberNoteEditor`）+ barrel 清理（`chat-room/index.ts`、`message-creation/index.ts`、`chat-room/types.ts` 孤兒介面、`MessageCreation.tsx` 兩條死 import）。−1898 行。render-chain 逐一驗證（import≠render）。
   - **Group B**：`imports/` 141 個零 importer Figma 死碼（具名元件 51 + svg 圖示 90）。`imports/` **192 檔 → 51 活檔**。判定法＝quote-anchored importer 掃描，**T2=0（無死碼叢集）**。
   - **保留的帶 id 活版**：`MainContainer-6001-1415`（會員表）、`Container-8548-103`（聊天室）、`MemberDetailContainer`、`MemberListContainer`、`StarbitLogoAssets`、`ButtonEdit` —— build 產物 chunk 確認在。
   - **驗證**：A、B 刪完各 `npm run build` 雙綠（刪錯會因 import 不存在而爆）。crmpoc 主頁抽查（/members 會員表、聊天室、訊息建立頁）確認元件都在。
### 📦 Part C 純換名 sweep — 分包（2026-06-22 重建，source ground truth）

> ⚠️ 教訓：上一版分包只在對話裡產出、沒落檔 → context 摘要後遺失。本表為**從 source 重新清點重建**
> （`grep rounded-[2/4/8/12/16/20px]` 全方向變體，排除 `imports/`/`.bak`/死碼），並寫進此檔＝跨 session 真相。
>
> **範圍鐵律**：只動 **on-ladder 零變化**——`2→2xs｜4→xs｜8→md｜12→xl｜16→2xl｜20→3xl`。
> **off-ladder（6/10/14/15px）絕不碰**（多已在前面 A/B/C/D/E/F 批處理或擱置）。逐檔 `replace_all`、build 過、
> git diff 審「只有 class 名換、值 1:1」、每包抽查 1–2 代表頁 crmpoc、逐包獨立 commit+push 驗 CI。
>
> **死碼已剔除（import≠render，已驗）**：`chat-room/MemberInfoPanel`(11，無人 render)、
> `chat-room/MemberNoteEditor`(5，barrel 有匯出但唯一 `<MemberNoteEditor>` render＝`ChatRoomLayout:1158` 用的是 `shared/MemberNoteEditor`)。
>
> **總計活的 on-ladder ≈ 261 處**：256 可驗收（9 包）+ FB 待粉專 5 處（獨立）。含 `SecondaryButton` `rounded-[32px]→rounded-full`（32px 高、圓角已夾成膠囊，零變化、語意對；併入 P9）。

#### 🚦 sweep 執行進度（2026-06-22 收工，明天接這裡）

| 包 | 狀態 | commit | 備註 |
|---|---|---|---|
| **P1** 設定頁 | ✅ push 上線、CI 綠、驗收 OK | `357462a3` | — |
| **P2** 帳號·登入 | ✅ push 上線、CI 綠、驗收 OK | `30454bd1` | StaffUsers 6px×2 確認 E 批已轉 md |
| **P3** 自動回覆編輯 | ✅ push 上線、CI 綠、驗收 OK | `7293d084` | HMR 殘影誤判一次，強重整後確認零變化 |
| **P4** 表格·觸發·時間 | ✅ push 上線、CI 綠、驗收 OK | `df156c5a` | 首次 directional（表格底 bl/br-2xl） |
| **P5** Chatbot·輪播 | ✅ push 上線、CI 綠、驗收 OK | `d38e2fda` | — |
| **P6** 聊天室面板 | ✅ push 上線、CI 綠、驗收 OK | `71601292` | — |
| **P7** 聊天室訊息列·會員 | ✅ push 上線、CI 綠、驗收 OK | `6d3b00b5` | 11 檔 |
| **P8** 共用容器·樣式·下拉 | ✅ push 上線、CI 綠、驗收 OK | `fca2b8b1` | 6/23 驗收：下拉/搜尋/空狀態卡圓角零變化、沒破版 |
| **P9** 框架·導覽·ui·雜項 | ✅ push 上線、CI 綠、驗收 OK | `f2892027` | 6/23 驗收：2xs 小圓角(chart/tooltip)有渲染、SecondaryButton 膠囊、其他元件零破版。19 檔 29 處；2xs 首用 class 生效=2px；chart `rounded-lg` 別名留待正規化 |
| **FB** 待粉專 | ⬜ 擱置 | — | crmpoc 無粉專驗不到 |

> ✅ **圓角 token sweep 全數完成**（6/23）：Part C 純換名 sweep **P1–P9 全部 push 上線、CI 綠、crmpoc 驗收 OK**。唯一未做＝ **FB 待粉專**（crmpoc 無 FB 粉專驗不到，5 處，獨立擱置）。
> P9 驗收（6/23）：2xs 小圓角（chart/tooltip）有渲染、SecondaryButton 膠囊、其他元件圓角沒破版。push 兩個 commit（P9 `f2892027` + docs `cdc90d8b`），CI staging success / prod 未碰。
> 👉 **下一步＝待辦清單第 5 項「dead code 刪除」**（imports/ Figma 死碼 + ConfigPanel/FlexMessageEditorNew/MemberInfoPanel/chat-room/MemberNoteEditor），獨立 commit、不混圓角。
>
> **同事動向存證（免明天看 log 困惑）**：P6(`71601292`) 之後、我 P7 之前，同事 vibecode-mike push 了
> `eed2568e` **fix(timezone): 連線層 +08 + SSE 台北時間**（只動後端 `members.py`/`database.py`/`line_app/db.py`，
> 與圓角 sweep **零重疊**）。我的 P7(`6d3b00b5`) 疊在它上面 fast-forward 成功、無衝突。log 看到它是同事的、不是我的。

| 包 | 主題 · crmpoc 代表頁 | 檔（數） | 小計 |
|---|---|---|---|
| **P1** | 設定頁 · `/settings`（LINE API 設定 / 基本設定） | LineApiSettingsContent 22、BasicSettingsEmpty 4、BasicSettingsList 2 | **28** |
| **P2** | 帳號·登入 · 帳號管理頁 + 登入頁 | StaffUsersManagement 19（⚠️6px×2 off-ladder 留）、CreateWebchatOrgModal 6、auth/Login 4 | **29** |
| **P3** | 自動回覆編輯 · 自動回覆→建立互動式回覆 | CreateAutoReplyInteractive 21（⚠️15px×1 off-ladder 留）、AutoReply 6、KeywordTagsInput 3 | **30** |
| **P4** | 自動回覆 表格·觸發·時間 · 自動回覆列表頁 + 觸發時間 | DateTimePicker 12、AutoReplyTableStyled 5、TriggerTimeOptions 5 | **22** |
| **P5** | AI Chatbot·輪播訊息 · AI Chatbot 編輯彈窗 + 群發→LINE OA 輪播編輯 | chatbot/AIChatbotEditModal 21、CarouselMessageEditor 12（⚠️10/6px 已於 A 處理，剩 8/12/16 零變化） | **33** |
| **P6** | 聊天室 A 面板 · 聊天室（右側會員資訊面板 + 版面） | chat-room/MemberInfoPanelComplete 18、chat-room/ChatRoomLayout 10 | **28** |
| **P7** | 聊天室 B 訊息列·會員 · 聊天室訊息區 + 會員標籤/對話下載 | ChatInput 3、ChatBubble 3、ChatMessageList 2、ResponseModeIndicator 2、PlatformSwitcher 2、MemberTagSection 1、FlexMessageRenderer 1、ChatRoom 1、shared/MemberNoteEditor 2、MemberTagEditModal 6、DownloadConversationsModal 5 | **28** |
| **P8** | 共用容器·樣式·下拉 · 散落各頁（抽查自動回覆/會員列表的下拉/搜尋/空狀態卡） | common/styles.ts 12、CategoryTitleDropdown 5、SearchContainers 3、ImageUploadField 3、DeleteConfirmationModal 3、BlankStateCard 3 | **29** |
| **P9** | 框架·導覽·ui·雜項 · 任一主頁殼 + PMS 連線彈窗 | Sidebar 2、SidebarChannelSwitcher 2、ChannelStatusBadge 2、common/ChannelSwitcher 2、ErrorBoundary 2、ToastProvider 1、figma/ImageWithFallback 1、ui/chart 2、ui/tooltip 1、ui/checkbox 1、buttons/CancelButton 2、common/Tag 1、TagList 1、TagItem 1、Scrollable 1、DeleteButton 1、TestEnvHeaderLabel 1、**SecondaryButton 32→full** 1、PmsConnectModal 4 | **29** |
| **FB** | ⏸ **待粉專**（crmpoc 無 FB 粉專驗不到，獨立、不混可驗收包） | facebook-message/FBConfigPanel 4（⚠️6px off-ladder 留）、facebook-message/FacebookMessageEditor 1 | **5** |

> ⚠️ **2xs（2px）首用風險**：P9 的 `ui/chart`(2px×2)/`ui/tooltip`/`ui/checkbox` 換 `rounded-2xs` 是 2xs token 首批廣用。
> live Tailwind 會 JIT 從 `@theme --radius-2xs` 生成，理論上 OK，但**抽查時特別確認 2xs class 有生效、沒破圖**（防「換名後 class 不生效」那種）。
> ⚠️ **P8/P9 是跨頁共用元件**，沒有單一「自己的頁」→ 抽查時挑「會掛載到它」的高流量頁（如自動回覆/會員列表/任一主頁殼）驗。

- [ ] **D. 間距 Spacing**：`px/py/p/gap/m*-[Npx]` 收斂到 Tailwind 數字工具類。對照 §3。
  - §3.1 是零變化（4 倍數）可安心批次；§3.2 是需眼睛確認（`gap-[10px]`→8 等 ±1~2px）。
  - §3.3 大版面位移（`ml-[330/280/250/72px]`）**不納入** spacing，另案處理。
  - ⬜ **「卡片貼滿框（pad→4）」評估**（2026-06-22 從圓角批 A 移交）：A 做共用卡片圓角時，曾有舊定案「編輯器預覽框 `p-[24px]`→4 / 詳情抽屜 `p-[12px]`→4」，原假設「卡片貼框需同心」。實讀結構發現三處卡片**置中浮著、無同心約束**，前提不成立 → 砍 padding 純屬「要不要讓卡片貼滿框」的間距/視覺決策，移到此批評估。位置：`CarouselMessageEditor.tsx:538`（預覽框 `p-[24px]`）、`MessageDetailDrawer.tsx:121`（抽屜 `p-[12px]`）。**目前維持原樣**。
- [ ] **E. 表格 UI 統一**：AI Chatbot 頁表格的灰色外框 + 表頭 hover 變色，是切廚房後恢復的樣式；連同其他頁表格一起在這批統一處理（目前刻意先不碰）。
  - ⬜ 待修小 bug（2026-06-19 做 B2a 時順手發現，與圓角無關）：`/messages`「已排程(0)」分頁的**空狀態（「尚無此資料」）外圍有奇怪的灰框、框線不對**。屬表格 UI 問題，留待本批一起修，**先不動**。
  - ⬜ **表頭文字「平台」待改（2026-06-25 雙軸批時記下，與捲軸無關、另一件事）**：活動訊息推播表（`InteractiveMessageTable`）平台欄表頭目前透過 `channelHeaderSlot` 顯示 **OA 名稱**，應改回欄位標題「**平台**」。⚠️ 改前先評估：① `channelHeaderSlot` 的**來源**（誰傳、傳什麼）② 改了的**副作用** ③ **別誤傷別頁**（OA 名稱表頭那件事是別頁 `MessageList`、已結束，勿混淆）。**目前先不動**。
- [ ] **F. 寫 `docs/design.md`**：把最終定案的 design system（字體 / 字級 / 行高 / 圓角 / 間距 / 顏色 token）整理成單一說明文件。
- [ ] **G. 更新 `CLAUDE.md`**：現有專案說明＋記憶 `project_frontend_precompiled_tailwind`（「build 不跑 Tailwind / 用靜態 index.css」）**已過時** —— 切廚房後是 live Tailwind。需更新成新事實，避免日後誤導。

---

## 2a. 📐 文件治理：圓角 / token 數字「真相來源」

> 教訓（2026-06-19）：`token-migration-map.md` 停在舊階梯（`sm=6/lg=10`），但 `ba389a6a` 已把 sm/lg 退役併入 md/xl（`6→8`、`10→12`）。靠文件查數字差點把「+2px 歸位」誤做成「零變化」（尤其 CarouselMessageEditor 14× `rounded-[10px]`）。

1. **數字真相唯一來源 = `globals.css @theme`**（程式 live、不會過時）。所有文件只「**指向它**」，**不複製階梯數字**到文件裡另存一份（複製＝會過時＝害人踩坑）。
2. **`token-migration-map.md` = 施工期 arbitrary→token 對照表**（暫時性工具，非規範來源）。
   - [ ] **待辦：Part C「零像素 sweep」完成後**（全站 `rounded-[Npx]` 等 arbitrary 都換成 token 名、不再需要對照）→ **封存或刪除 `token-migration-map.md`**，避免它過時又害人踩坑。**現在先不刪**（sweep 還要用它的 arbitrary 對照）。
3. **最終歸宿 = `docs/design.md`**（待辦 F）：屆時圓角規範寫進 design.md，且**指向 `globals.css`**（不複製數字）。design.md 一旦完成 → `token-migration-map.md` 的規範性內容被取代 → 可正式退場。

---

## 2b. 元件層統一（之後處理）

> 捲軸 CSS 規則已收斂成單一正解 `.scrollbar-transparent`（4px、半透明灰、圓角、hover 容器才顯示、含 Firefox 支援）。
> 以下兩項屬「元件層」的捲軸實作，本批**不動**，留待日後評估：

- [ ] **1. React 自繪捲軸（`.no-native-scrollbar` 搭配的 `CustomScrollbar`）**
  - 現況：`MemberTagEditModal` 等用 `.no-native-scrollbar` 隱藏原生捲軸、改用 React 自繪，理由是避開 macOS overlay scrollbar 在 modal 內不可見的問題。
  - 待評估：能否拆掉自繪、直接改用 CSS `.scrollbar-transparent`（**需先驗證 macOS modal 不會再出現捲軸不可見的問題**）。若確認非自繪不可，則把它**元件化成共用 `<CustomScrollbar>`**，避免各處各寫一份。
- [ ] **2. `.chat-widget-textarea`（webchat 輸入框捲軸）**
  - 現況：widget 專屬，已是 4px 細灰、但為**常駐顯示**（非 hover 才出現）。
  - 待評估：日後是否也改成「hover 才顯示」，與全站 `.scrollbar-transparent` 行為一致。

---

## 2c. 捲軸方案 C 推進（C 計畫）

> 方案 C＝共用 `<Scrollable>`（`src/components/common/Scrollable.tsx`）：`.no-native-scrollbar` 隱原生捲軸 + JS 自繪 4px thumb；
> 進整區才顯示、離開消失、sticky 不震、thumb 不蓋表頭（表頭走 `header` 槽渲染在 viewport 外）。
> 選方案 C（而非純 CSS 方案 A）的核心理由：**JS 自繪理論上跨系統一致**，不會在 Windows 變回預設醜捲軸 —— 待實測確認（見下方檢查點）。

### 已完成（commit）

- [x] **方案 B 退路存檔點**：commit `28449e13`（常駐淡灰捲軸；C 失敗可整批退回此點）
- [x] **C0：共用 `<Scrollable>` 元件（支援 `header` 槽避開 sticky 表頭）+ BasicSettingsList**：commit `b831567c`（縱向；六項驗收全過：平常乾淨／進整區出現／離開消失／捲動順／sticky 不震／thumb 不蓋表頭）
- [x] **C1 第一組：3 個縱向面板**（`StaffUsersManagement` / `SidebarChannelSwitcher` / `MessageDetailDrawer`）：commit `93eab253`
- [x] **C1 Sidebar：側欄導覽 nav**（填高型 outer `flex-1 min-h-0` + viewport `h-full`；aside 是 `h-screen` 有界→真內捲）：commit `a1a256bb`（✅ 已 push origin/main，CI 綠）
- [x] **ErrorBoundary：錯誤堆疊框**（max-h-280 有界縱捲；max-h 放 viewport，rounded+bg+overflow-hidden 放 outer）：commit `aef947ed`（✅ 已 push origin/main，CI 綠）

### 🎉🚩🚩 收工狀態（2026-06-26）—— 下次上工先看這裡

> **🎉 高風險三塊全清、捲軸核心完成！** C2 聊天室（最後一塊、最高風險）今天攻下並 push origin/main（`ffd5fca9`，CI 綠、prod 沒碰）。手刻/原生捲軸全面退場，全站統一 `<Scrollable>` 方案 C。
>
> **今天完成（已 push origin/main）**：
> - `ffd5fca9` **C2 聊天室**：`ChatRoomLayout:1290` 容器換 `<Scrollable>`（縱向）。最小改動——外包一層帶 inline `height: calc(100% - 180px)` 的 div（Tailwind 預編譯靜態 css，`h-[calc]` arbitrary class 無效，calc 必須留 inline style）→ `h-full/w-full` 一路傳到 viewport（避開高度鏈崩在 Scrollable 多插的 relative wrapper）。`chatContainerRef` 接 forwardRef（=viewport DOM）、`handleScroll` 接 onScroll 槽。**4 個捲動行為的程式碼一行沒動**（全靠 ref 操作 viewport，語意一致）。不動共用 Scrollable。
>
> **🔴→✅ 高風險三塊全清**：①Carousel/FB（`65e372bd`）②雙軸表格批（步驟1-5）③**聊天室 C2（`ffd5fca9`）← 今天**。
>
> **crmpoc 驗收 4 行為全過**：①初次載入自動捲底 ✅ ②SSE 新訊息貼底捲（貼底捲下/讀舊不打斷）—— 見下方另案 ⚠️ ③無限往上捲+位置保持 ✅ ④撐不滿自動補載 ✅；4px 灰圓角 thumb 在、捲動順、沒破版。
>
> **⚠️ 另案待辦（pre-existing，非本次遷移引入）——「SSE 貼底自動捲」時序競態**：
> - 現象：貼底時新訊息來，偶爾沒自動捲下。
> - 根因：`handleNewMessage`（`ChatRoomLayout:472-498`）在 `setMessages` 後**立刻** rAF 捲底，rAF 可能早於 React 把新氣泡 commit 進 DOM → 讀到**舊 `scrollHeight`** → 捲到舊底。
> - **非遷移引入**：該段與 origin/main 逐字相同、量測值在 viewport 上等價（初次捲底 ✅ 已證高度鏈正常）；origin/main 同樣存在此競態。對比「初次捲底」在 `useEffect`（commit 後）跑 → 穩。
> - **正解**：把 SSE 捲底搬進 `useEffect`（依 messages 變動、commit 後再捲），或 double-rAF / `flushSync`。順帶可加「查看新訊息」按鈕（不貼底時提示）。**獨立小修、另案。**
>
> **📌 順手記**：`chat-room/ChatMessageList.tsx` 是**死碼**（全 repo 零 import，真正列表 inline 在 ChatRoomLayout）→ 可列入 dead code 批清掉。
> ✅ **已清（2026-06-26，`44ec2faf`，push main、CI 綠 staging success / prod 未碰）**：6/23 Group A 之後浮出的兩個漏網死碼收尾——`chat-room/ChatMessageList.tsx`（6/26 隨 C2 證實零 import）+ `flex-message/PreviewPanel.tsx`（6/24 查出 FlexMessageEditorNew 刪後成孤兒）。連帶 `chat-room/index.ts` barrel 那行、`types.ts` 兩個只被死碼用的殘留介面（`ChatMessageListProps`/`MemberInfoPanelProps`）。−339 行、build 綠、零行為變化。**注意 `flex-message/types.ts` 仍被 `fb-types` 引用＝活的，保留**；`chat-room/MemberNoteEditor.tsx` 6/23 Group A 已刪（今查證不存在）。**dead code 組件批至此全清；剩 `imports/` Group B 141 檔 Figma 死碼為獨立批（見上 §item 5 Group B）。**
>
> **⬜ 剩餘（非高風險、可後補）**：
> 1. ⬜ **步驟 6 Windows 跨系統檢查**：Windows 開 crmpoc 確認 Scrollable thumb 是 4px 灰圓角、沒變回 Windows 預設醜捲軸（選方案 C 的核心理由，需實機驗；可後補、不卡主線）。
> 2. 📝 **雜項**（見 2026-06-25 §雜項）：textarea「框塞自身」偏外×7（待 Chrome 量準 restructure）、dead code 刪除（`flex-message/PreviewPanel`+`types.ts`+`ChatMessageList`）、FB 待粉專（Carousel/FB 圓角 + FB editor 雙軸驗收）、`InsightsPanel:1246` tab strip（Carousel 同型、留）、SSE 貼底捲競態（上方另案）。

---

### 🚩🚩 收工狀態（2026-06-25）—— 歷史

> **✅ 今天大豐收：高風險第一塊（Carousel/FB）+ 第二塊（雙軸表格批）全攻下並上 staging。所有 commit 已乾淨 push origin/main、CI 全綠、prod 沒碰。工作區乾淨（只剩 serena 工具 noise，無我的未 push 內容）。**
>
> **今天完成（已 push origin/main，CI 全綠、staging 部署成功）**：
> 1. `65e372bd` **Carousel/FB**：tab strip 改 `flex-wrap` 解卡關（繞開 `min-width:0` 撐爆雙軸臨界）+ 縱向換 Scrollable（高風險第一塊；FB 同改待粉專）
> 2. `419b2f28` **雙軸步驟1 地基**：Scrollable header 槽加橫向同步（gated `showH && header`、純加法、18 呼叫點零交集）+ **步驟2 canary** `AutoReplyTableStyled` 雙軸 both
> 3. `734a24b5` **雙軸步驟3** `InteractiveMessageTable` 雙軸 both（同 pattern）
> 4. `9784b328` **雙軸步驟4** 會員表 `MainContainer` 雙軸 both（+補 `overflow-hidden` 圓角裁切 +移除 `overflow-x-hidden` 止血）
> 5. `ee61efa9` **雙軸步驟5** 標籤 popover 遷 Scrollable + **刪 `CustomScrollbar`**（手刻自繪元件全退場，−116/+9）
> + 數個 `docs(progress)` commit（進度落檔）。
>
> **🔴 高風險三塊（攻下兩塊，剩聊天室一塊）**：
> - ✅ **第一塊 Carousel/FB editor**（`65e372bd`）：flex-wrap 繞開雙軸臨界 + 縱向 Scrollable；crmpoc 步驟2 驗收 OK。**FB 同改、待粉專驗、信 diff。**
> - ✅ **第二塊 雙軸表格批 實質完成**（步驟1-5 全上 staging）：地基 + canary + 3 表（AutoReply/Interactive/會員表）+ popover 遷移 + 刪 CustomScrollbar。**三老問題（幽靈橫捲軸/表頭4px/橫捲軸圓角）三表全結構性解**，crmpoc 全驗收 OK。
> - 🔴 **第三塊（最後）C2 聊天室**（最高風險：SSE 自動捲到底 + 無限往上捲，須保留 ref/onScroll）：`ChatMessageList:111`、`ChatRoomLayout:1298`、`ChatRoom:67/85`。Scrollable 已預留 **`forwardRef`（暴露 viewport DOM 供 scrollTop/scrollIntoView）+ `onScroll` 槽**，足以接管現有捲動控制。**精神好時做、不催。**
>
> **⬜ 明天「下次接這裡」（按建議順序）**：
> 1. 🔴 **C2 聊天室**（高風險最後一塊，見上；單獨一 session、git 環境穩定再開）。
> 2. ⬜ **步驟 6 Windows 跨系統檢查**：用 Windows 開 crmpoc 確認 Scrollable thumb 是 4px 灰圓角、沒變回 Windows 預設醜捲軸（選方案 C 而非純 CSS A 的核心理由，需實機驗；**可後補、不卡主線**）。
> 3. 📝 **雜項**：① 表頭「平台」文字改（`InteractiveMessageTable` 平台欄 `channelHeaderSlot` 顯示 OA 名稱→應改回「平台」，評估來源+副作用+別誤傷別頁，詳見 §E 上方 TODO）② textarea「框塞自身」偏外×7（待 Chrome 量準 restructure）③ dead code 刪除（`flex-message/PreviewPanel`+`types.ts` 等）④ FB 待粉專（Carousel/FB 5 處圓角 + FB editor 雙軸驗收）⑤ `InsightsPanel:1246` tab strip（Carousel 同型、留）。

---

### 🚩 收工狀態（2026-06-23）—— 歷史

> **6/23 捲軸完成**：Sidebar(`a1a256bb`) + ErrorBoundary(`aef947ed`)，**✅ 已 push origin/main**（範圍 `87b6b73e..b6959ad9`，CI 綠燈）。
> **C4 頁殼 main 全排除**（window 捲，見下方 ❌ 與 playbook §2「頁殼 main 是 window 捲」）。
> **低風險井已見底**：trivial 只過 ErrorBoundary；`MemberNoteEditor:89`=textarea(排除)、C3 表格=雙軸(留雙軸批)。

### 🆕 接續（2026-06-24）

- [x] **AIChatbotEditModal**（`RoomEditModal`+`FacilityEditModal` 兩個編輯彈窗外層 overlay）✅ **完成、crmpoc 驗收 OK、未 push（攢著）** ——
  - 外層保留 `fixed inset-0 z-[99999] bg-black/45` backdrop（管定位+暗底，避免 Scrollable 硬加的 `relative` 撞 `fixed`）→ 內包 `Scrollable size-full` 管捲動 → `handleBackdrop` 移到 viewport。
  - **Scrollable 加 `onClick` passthrough**（比照 `onScroll`，forward 到 viewport；現有 5 用法零影響）——overlay backdrop 點空白關閉靠 `e.target===e.currentTarget`，必須掛在 viewport。
- [x] **🆕 全站 textarea 細捲軸統一（獨立一批）** ✅ **主批 8 個完成、未 push（攢著）** —— 驗收時發現「房型特色」textarea 顯示粗原生捲軸。**修正認知**：方案 C(JS 自繪)包不到 textarea 內捲＝紅線成立，但**方案 B(CSS `::-webkit-scrollbar`)textarea 可美化成細灰**（`chat-widget-textarea` 即活證）。→ 8 個粗原生 textarea 統一掛 `scrollbar-transparent` 變 4px 細灰、消滅粗原生。**盤點/分類/偏外待優化見下方「### 全站 textarea 統一」**。

### 全站 textarea 統一（2026-06-24）

> 全站活的 textarea 11 個（`imports/` 死碼 + 未使用的 shadcn `ui/textarea` 排除）。
> **主批＝8 個原本無 scrollbar 美化的 → 補 `scrollbar-transparent`**（純追加 class、只染捲軸、零 layout 屬性 → 不可能破版）。
> 特例：#1 `chat-widget-textarea`（webchat widget 自家 4px #dddddd、隔離、§2b 另議，**留著不碰**）、#2 `MemberNoteEditor`（早已 scrollbar-transparent 且貼緣正常）。
> #3 `ChatRoomLayout:1387` 聊天室回覆框 ✅ **完成（2026-06-24，未 push）**：原 `white/60` 白 thumb + 8px 在白底上隱形（壞樣式）→ 換 `scrollbar-transparent`（4px 黑灰、白底可見）。crmpoc 驗收：隱形→可見、無 padding 貼右內緣正常。
>
> ✅ **textarea 統一全收**：主批 8 個細灰 + #3 修好隱形壞樣式；#1 chat-widget 留著、#2 本就正常。唯「框塞 textarea 自身」的捲軸偏外（7 個）待 Chrome 工具到位 restructure（見下方待優化）。

**主批 8 個（已套，commit `<本批>`）**：#4 `AIChatbotEditModal:308` TextareaSection（房型+設施共用，一改修兩個）、#5 `CarouselMessageEditor:767`、#6/7/8 `CarouselMessageEditor:1007/1198/1374`、#9 `CreateWebchatOrgModal:135`、#10 `CreateAutoReplyInteractive:966`、#11 `FBConfigPanel:1128`。

**套後分類（驗收）**：
- 🟢 貼內緣正常（無 padding + `bg-transparent`，同 MemberNoteEditor pattern）：**#10**。
- 🟡 細灰但**捲軸偏外**（可接受、待優化）：**#4·#5·#6·#7·#8·#9·#11**（框 bg/rounded/padding 塞在 textarea 自身 `px-[8/12px]` → thumb 浮在內距帶、不貼框內緣）。
- 🔴 破版：**無**。

#### ⏳ 待優化：「框塞 textarea 自身」的捲軸偏外（需 Chrome 量準再做，別硬推）

- 現象：textarea 自帶 `bg+rounded+px padding` 時，Chrome 把 `::-webkit-scrollbar` 畫進內距帶 → 4px thumb 浮在欄位框右側、不貼內緣。對比 `MemberNoteEditor`(#2) 把框（`containerClassName: bg-white rounded-3xl` + `innerClassName: p-[20px]`）放**外層 wrapper**、textarea 本體**裸透明零自身 padding** → 捲軸貼內容右緣＝正常。
- **修法方向**：把 `bg/rounded/padding` 從 textarea **搬到一層外 wrapper div**、textarea 改 `bg-transparent` + 拿掉自身 padding（複製 MemberNoteEditor pattern）。改 `TextareaSection` 一處修房型+設施；其餘 #5/6/7/8/9/11 同型逐一 restructure。
- ⚠️ **別硬推**：純幾何推有矛盾（MemberNoteEditor wrapper padding 20px **比**房型特色 8px **還大**卻正常 → 真正關鍵是「框在誰身上 / textarea 是否裸透明」這個結構因素，非 padding 數字）。確切 Chrome 捲軸繪製位置**需 `claude-in-chrome` 工具現場量 computed layout 證實**，本 session 該工具未連線。**待 Chrome 工具到位 → 量準機制 → 改 1 個樣本驗證貼緣 → 再推廣**。屬獨立優化項，不卡主目標（消滅粗原生＝已達成）。

### 待辦（明天繼續）

- [x] **C1 第二組** ✅ **完成（2026-06-25，commit `1a0dd581`）** —— 卡關解法＝tab strip 改 `flex-wrap` 換行（繞開 `min-width:0` 撐爆雙軸臨界），縱向 line 534 換 `<Scrollable>`。Carousel crmpoc 步驟 2 驗收 OK（最右 tab 不被切、縱向捲動正常、沒破版）；FB 同改、待粉專驗、信 diff。原擱置紀錄保留於下供對照：
  - 兩個雙軸容器（縱向自繪 + 同層橫向 tab 並存）：
    - `CarouselMessageEditor.tsx`（line 534 縱向 / line 570 橫向 tab strip）
    - `FacebookMessageEditor.tsx`（line 332 縱向 / line 372 橫向；⚠️ 需 crmpoc 有 **FB 粉專**才切得到、測得到）
  - 入口：群發訊息 → 活動與訊息推播 → 建立/編輯訊息 → 渠道選 LINE OA（Carousel）或 FB 粉專（FB 編輯器）
  - **擱置原因**：CarouselMessageEditor 縱向換 `<Scrollable>` 後，**橫向 tab strip 出現「輪播 9 卡在邊緣/被切掉」異常**（明明沒碰橫向）。
    - 靜態分析推不出根因：換 Scrollable 後 tab 寬度基準沒變、`no-native-scrollbar` 比原本 4px gutter 還**少佔 4px（內容反而變寬）**、新 thumb track 在 `right-0` 但內容有 `p-[40px]`、離 tab 右緣 36px 不會蓋到 → 三項都不該讓 tab 變窄。typecheck 過、無 reparent。
    - 唯一方向性差異是那 4px（且是變寬），疑為雙軸臨界狀態的版位位移，但**需 Chrome 現場量 computed layout 才能確認機制**，當下 session 無瀏覽器檢查工具。
  - **已 revert** CarouselMessageEditor 回原本 `overflow-y-auto scrollbar-transparent`（方案 B、可正常操作）；FacebookMessageEditor 同結構、本次一併不做。
  - **待日後**有 Chrome 檢查工具 / 更多現場截圖細節時再回來攻 C。
  - 💡 **下次優先試的解法方向（使用者 2026-06-23 提）**：Carousel tab strip（輪播按鈕那條）改用 **`flex-wrap` 換行** 取代橫向 scrollbar
    —— 原本卡在「縱向換 Scrollable 後橫向 tab 被切」，若 tab strip 本來就不用橫向捲（改成換行）就**繞開整個雙軸臨界問題**，可能是正解。
    評估要測：① 換行後的視覺（多列 tab 整齊嗎）② 多 tab（輪播 9+ 卡）時換幾列、會不會太高 ③ 跟「新增輪播」鈕的相對位置（換行後鈕還在不在順手的地方）。
- [x] **C1 Sidebar** ✅ **完成（2026-06-23，`a1a256bb`，已 push origin/main、CI 綠）** —— 側欄 nav 換 Scrollable（填高型 outer `flex-1 min-h-0` + viewport `h-full`）。aside 是 `h-screen` 有界 → 真內捲、套得成立。驗收 OK（捲動順 / footer 固定不抖 / 展開收合正常 / thumb 正確）。
- [x] **C2 聊天室** ✅ **完成（2026-06-26，`ffd5fca9`，已 push origin/main、CI 綠）** —— `ChatRoomLayout:1290` 容器換 `<Scrollable>`（縱向）；外包 div 帶 inline calc 高度、ref/onScroll 接回；4 行為 crmpoc 驗收 OK。`ChatMessageList` 證實為死碼（零 import，併 dead code 批）。⚠️ SSE 貼底捲 pre-existing 競態另案（見 6/26 收工狀態）。**高風險三塊全清！**
- [x] ~~**C4** 各頁 `<main>`（9 個頁殼主捲動）~~ ❌ **排除出 C 計畫（2026-06-23）** —— 驗證發現頁殼是 `min-h-screen` + Sidebar `fixed` → **整頁 window 捲、main 不是有界內捲容器**（`overflow-y-auto scrollbar-transparent` 是 inert 死樣式）。自繪 Scrollable 只給有界內層容器；頁面整頁捲用原生 window 捲軸是正解，不硬改 `h-screen`。詳見 playbook §2「頁殼 main 是 window 捲」。9 頁全排除（含先前盤的乾淨批/雙軸批/min-h-screen 批）。
- [ ] **C3** 表格橫向+巢狀 ／ **C5** 其餘橫向（tab／輪播／chip）
  - ⚠️ **C3 表格是雙軸**（`AutoReplyTableStyled:443 橫 + :450 縱 max-h-600`、`InteractiveMessageTable:368+380` 同型）：縱向 thumb 落在 1160px 表格最右、只有橫捲到底才看得到 → **單套縱向＝半套、無意義**。縱軸 thumb 收可視右緣 + 表頭對齊要靠 `orientation="both"` + `header` 槽**整批解** → **併入「雙軸表格批」**，不單獨做（2026-06-23 確認）。
- [ ] **雙軸表格批**：會員表格（雙軸 + 幽靈橫捲軸 + 表頭 4px 對不齊）→ 細節見下方
  - 🔗 **連帶**：會員表格 `imports/MainContainer-6001-1415` 目前用本地 `CustomScrollbar`（從 `MemberTagEditModal` export）。此批把會員表格遷到 Scrollable 後 → **連同刪掉 `MemberTagEditModal` 內的 `CustomScrollbar` 元件定義**（MemberTagEditModal 本身已於 6/24 改用 Scrollable、不再用它）。
- [ ] **維持方案 B（不自繪）**：textarea、下拉 popover、shadcn UI 庫元件 —— 不納入 C 計畫
  - ⚠️ 例：`shared/MemberNoteEditor:89` 的捲動元素是 `<textarea>`（不是 div）→ **紅線排除**，Scrollable 包不到原生 textarea 內捲（2026-06-23 確認，別再誤列進低風險）。
- [ ] **【Windows 跨系統檢查點】** 用 Windows 開 crmpoc 確認 C 捲軸是 **4px 灰圓角**、沒變回 Windows 預設醜樣式（選 C 而非 A 的核心理由，需實測；若不一致→檢討 thumb 繪製，不退回 A）
- [x] **FilterModal** ✅ **完成（2026-06-24，未 push）＋ §2b 結案** —— 它本來就是「手刻 React 自繪捲軸」（≈90 行：`scrollbarStyles`/`handleScroll`/`updateScrollbarStyles`/2 個拖曳 useEffect/`scrollbarRef`/寫死 `225`/`showScrollbar`）→ **全刪、換 `<Scrollable orientation="vertical">`**（−113/+6）。3 個行為改變已採納：`showScrollbar`(≥6) 取消改 Scrollable 自動偵測真溢出、`pr-2` 改**常駐**保留（tag 不被 thumb 蓋）、thumb 從 `#dddddd` 常駐 → `black/30` **hover 才現**（全站統一）。crmpoc 驗收 OK：hover 才現/拖得動/pr-2 讓位/篩選功能沒傷。
- [x] **字體（`71b92bbd` 全站收斂 Noto）已 push staging（已部署、CI 綠燈）、已告知同事**

### 真正剩的有界內層容器清單（2026-06-23 盤點，落檔免遺失）

> 已套 5 處：`BasicSettingsList`(C0)·`SidebarChannelSwitcher`·`MessageDetailDrawer`·`StaffUsersManagement`(C1-1)·`Sidebar` nav(`a1a256bb`)。已做 `ErrorBoundary`(`aef947ed`)。
> 排除：9 頁殼 main(window 捲) + shadcn 紅線(`ui/*` / textarea / popover)。

**🔴 Group 1 — 已知敏感（留最後 / 卡關，先別碰）**
- ~~C2 聊天室（最高風險，SSE 自動捲）：`ChatRoomLayout:1290`~~ ✅ **完成（2026-06-26，`ffd5fca9`）**。`ChatMessageList:111` 死碼（零 import）、`ChatRoom:67/85` 是頁殼 window 捲（不在這批）。
- 雙軸表格 會員表：`imports/MainContainer-6001-1415:467(縱·自繪)/1025(橫)/1041(max-h-600)`
- C1第二組卡關：`CarouselMessageEditor:534/570`、`FacebookMessageEditor:332/372`（FB待粉專）

**🟡 Group 2 — 表格類（C3，雙軸 → 併雙軸表格批）**
- `AutoReplyTableStyled:450(max-h-600)+443(橫)`、`InteractiveMessageTable:380+368`
- ~~純橫向 table：`PMSIntegration:1329/1740`、`AIChatbotOverview:631`、`FacilitiesContent:934/1333`~~ ✅ **完成（2026-06-24，未 push）**：5 個容器同模式換 `<Scrollable orientation="horizontal">`（外層 `rounded-2xl overflow-hidden` 圓角裁切層保留、thumb 收圓角內）。crmpoc 3 頁驗收 OK：thumb 底部 4px、hover 才現、拖得動、表頭隨 body 橫捲、不破版。

**🟢 Group 3 — Modal / 面板（有界縱捲）**
- ~~`MemberTagEditModal:386`~~ ✅ **完成（2026-06-24，未 push）＋§2b 結案**：原本用本檔自定義的 `CustomScrollbar`（手刻 thumb，演算法≈Scrollable）→ scroll 容器換 `<Scrollable ref={scrollRef} vertical>`。§2b「macOS modal 可見性」疑慮不成立（CustomScrollbar/Scrollable 都用 `no-native-scrollbar`+JS thumb 同技術，FilterModal 已證 modal 可行）。保住 wheel handler（scrollRef 改接 Scrollable forwardRef，游標在清單外滾輪仍捲）+ 底部漸層 mask。thumb `#dddddd` 常駐 → `black/30` hover（統一）。⚠️ **`CustomScrollbar` 元件未刪**：`imports/MainContainer-6001-1415`（會員表格）仍 import 用 → **待雙軸表格批遷移會員表格時一起刪**。
- ~~`FilterModal:435`~~ ✅ **完成（2026-06-24，未 push）＋§2b 結案**：手刻自繪 ≈90 行 → 換 `<Scrollable vertical>`、統一 hover、pr-2 常駐保留。
- ~~`AIChatbotEditModal:626/927`~~ ✅ **完成（2026-06-24，未 push）** —— 兩彈窗外層換 Scrollable + Scrollable 加 onClick passthrough
- ~~`shared/MemberNoteEditor:89`~~ ❌ textarea，方案 B 排除

**🔵 Group 4 — 純橫向（C5）**
- ~~`InsightsPanel:1272`（heatmap 橫捲，`min-w-[720px]`）~~ ✅ **完成（2026-06-24，`4bde7349`，未 push）＝橫向 Scrollable 首戰**：換 `orientation="horizontal"`，crmpoc 驗收 OK（4px hThumb 底部、hover 才現、拖得動、不破版）。橫向 pattern 確立。
- `InsightsPanel:1246`（tab strip 橫捲）→ ⏸ **暫不碰**：有 `tabsContainerRef`、且「橫向 tab strip」＝ CarouselMessageEditor 卡關同型，留待與 Carousel 一起。
- ~~`flex-message/PreviewPanel:64`（輪播預覽 snap-x）~~ ❌ **死碼（2026-06-24 查證）**：零 importer、無 barrel、無 build chunk；其渲染者 `FlexMessageEditorNew` 已於 `8d152087` 刪除 → 它成孤兒。原訂橫向首戰作廢，改用 `InsightsPanel:1272`。`flex-message/PreviewPanel.tsx`+`types.ts` 併入「dead code 刪除」批清掉。

### 雙軸表格批細節：會員表格（`src/imports/MainContainer-6001-1415.tsx`）

- 問題（結構性、與 C0 無關，方案 B 時代就有）：
  - **雙軸**：外層 `overflow-x-auto`（包 `min-w-[1160px]`）+ 內層 `max-h-[600px] overflow-y-auto`。
  - **幽靈橫捲軸**：內層只想縱捲，但 `overflow-y:auto` 會讓 `overflow-x` 被瀏覽器自動升級成 `auto`；垂直捲軸吃掉 ~4px 寬、欄位 min-w 合計≈1160 → 溢出 → **第二條橫捲軸**（與外層那條疊在底部）。
  - **表頭差 4px 對不齊**：表頭在縱捲區外用滿 1160px、資料列在縱捲區內被捲軸吃 4px → 同一根因。
- 解法方向：遷移到 `<Scrollable orientation="both">`，用 `header` 槽固定表頭（同時解掉對不齊），或明確 `overflow-x-hidden` 擋幽靈橫捲軸。屬比 C0 複雜的雙軸+sticky 容器，單獨一批處理。

- **2026-06-19 進度：已做「路徑 1 止血」**（內層加 `overflow-x-hidden`，消掉幽靈橫捲軸 → 雙條變單條；列互動正常）。**仍有三件未解，全部留待本批（路徑 2 = 換 `<Scrollable orientation="both">`）一起解**：
  1. **橫軸難抓**（外層橫捲軸是 4px 太細，滑鼠不好抓拖）→ Scrollable 自繪可拖曳 thumb 解。
  2. **表頭差 4px 對不齊**（根因同上：表頭在縱捲區外滿 1160、資料列在縱捲區內被捲軸吃 4px）→ Scrollable `header` 槽解。
  3. **橫捲軸沒收進圓角 / 掉表格外**（外層 `overflow-x-auto` 又自帶 `rounded-[16px]` 但缺 `overflow-hidden` 裁切，瀏覽器捲軸不被圓角裁切 → 橫跨下圓角）→ Scrollable 遷移時用「自繪 viewport + 圓角 wrapper」一起解；**不要現在硬加 wrapper**（路徑 2 會整個重做，屬拋棄式白工）。

### ⚠️ C 計畫排除清單（不要再被誤列進任何批次）

> 教訓：列批次清單前，必須先確認元件「**真的會 render 出現在畫面上**」，不能只靠 grep `overflow-y`。死碼一律排除。

- **死碼（無人 import / import 了卻從不 render → 改了也驗不了）→ 永久排除**：
  - `src/components/flex-message/ConfigPanel.tsx`（孤兒，無人 import）
  - `src/components/chat-room/MemberInfoPanel.tsx`（聊天室實際用 `MemberInfoPanelComplete.tsx`，此檔無人 import）
  - `src/components/flex-message/FlexMessageEditorNew.tsx`（**import 了但從不 render**：唯一渲染它的 `message-creation/PreviewPanel.tsx` 在 `MessageCreation` 只被 import、JSX 從未掛載；live 的 LINE 訊息編輯器掛的是 `CarouselMessageEditor`）。⚠️ 教訓加強版：「有 import」不等於「會 render」，必須追 JSX 是否真的掛到頁面上。
  - `src/imports/LineFlexMessageBuilder.tsx`（Figma 死檔，整檔無人掛載；內含自己的 PreviewPanel/ConfigPanel，勿混淆）
- **活的 Flex/輪播編輯器其實是 `CarouselMessageEditor.tsx`**（雙軸：`overflow-y` 534 行 + `overflow-x` 570 行）→ 屬「第二組（同檔有橫向容器）」，不是 group 1。
- **活的但目前不是捲動容器 → 不納入捲軸統一**：
  - `src/components/chat-room/MemberInfoPanelComplete.tsx`（聊天室右側會員資訊面板）目前**沒有 `overflow-y`**，不是捲動容器；除非日後它自己變成需要捲動，否則不列入 C 計畫。

---

## 3. 字體任務（B）開工須知

**Token 對照表**：`docs/token-migration-map.md` §1（字體相關全在這）
- §1.1 font-family：Noto 四種寫法＝純冗餘可安心收斂；**Inter / PingFang 是真的換字**，列在 §6a 眼睛確認。
- §1.2 font-size、§1.3 line-height、§1.4 font-weight 也在 §1，可一併規劃。

**批次清單檔**：`docs/font-inter-to-noto.md` —— **目前尚未建立**。
- 字體任務的**第一步**＝產出這份清單檔，資料來源＝ token-migration-map §1.1 表 + §6a。
- 收斂目標：全部 `font-['Inter'…]` / `font-['PingFang_TC'…]` → `--font-family-base`（已定義於 globals.css `:root`，值＝`'Noto Sans TC', sans-serif`）。
- **實際要改的元件檔**（已排除 `src/imports/` 死碼 / Figma 匯出）：
  - `components/BasicSettingsEmpty.tsx`
  - `components/BasicSettingsList.tsx`
  - `components/chat-room/ChatMessageList.tsx`
  - `components/common/PreviewContainers.tsx`
  - `components/CreateAutoReplyInteractive.tsx`
  - `components/FacilitiesContent.tsx`
  - `components/message-creation/PreviewPanel.tsx`
  - `components/MessageDetailDrawer.tsx`
  - `components/PMSIntegration.tsx`
- 字體決策（已和使用者確認）：採「先接受、後修」；切廚房階段 staging 暫顯 Inter 沒關係，字體是**獨立的下一步**。

---

## 4. ⚠️ 重要架構約束（接續前務必記住）

1. **live Tailwind 已啟用**：`globals.css` 的 `@theme` / `@apply` / `@custom-variant` 現在是「真的生效」的（切廚房前是被忽略的死語法）。新增任何 class 都會被 live JIT 掃描生成，**不用、也不該再手動維護預編譯 CSS**。Tailwind 版本 4.1.3，config 在 `vite.config.mts`。
2. **一次只動一個變數**：字體 / 圓角 / 間距 各自獨立、各自一批 commit、各自 staging 驗收。不要混在一起。
3. **push 只到 staging，不碰 prod**：
   - `git push origin main` → CI「Deploy to GCP」自動部署 **staging（console.star-bit.io）**：`npm install → npm run build → 重啟 → health check`。
   - **prod 是獨立分支 + 獨立 VM**，需刻意 push 且**兩次確認**才動。預設一律只到 main/staging。
4. **驗收動線**：
   - 本機 dev 預覽 = **crmpoc.star-bit.io**（systemd `lili_frontend.service`，:5173，存檔自動熱重載）。
   - 同事看的共用環境 = **console.star-bit.io**（staging，push main 後才更新）。
5. **回滾錨點**：tag `before-build-rebuild` = `4d850ac5`（本次所有改動的前一個 commit）。真出事可從這裡還原。
6. **收尾驗證習慣**：每次 push 後查 `gh run list`，確認「Deploy to GCP」staging job 綠燈再收工。

---

## 4.5 ⚠️⚠️ 切廚房副作用：休眠 class 活化回歸（2026-06-18 發現，重要）

切廚房 commit 自稱「零退化」，但**不成立**。機制：舊預編譯 `index.css` 是過時快照，**漏掉約 1000 個元件實際在用的 class**（切廚房 commit 訊息自己有寫）。這些 class 在切廚房前是**死的（沒生效）**，live Tailwind 一開全部**第一次生效** → 凡是「元件寫了某 arbitrary class、但該 class 不在舊 index.css」之處，畫面會悄悄改變。

**已證實並修掉的兩處（2026-06-18）**：
- **基本設定頁變窄**（commit `d96076fb`）：`max-w-[1240px]/px-[40px]/pt-[48px]` 舊 index.css 內 = 0 次 → 以前全失效（滿版），現在生效 → 框成 1240 置中。改回 `w-full`。
- **全站捲軸變預設醜樣**（commit `2a7b07c6`）：27 個 bare overflow 容器補 `.scrollbar-transparent`。

**結論**：這是**系統性風險**，不是兩個孤例。任何頁面只要用了「不在舊 index.css 的 arbitrary class」就可能跑版。**建議排一輪有系統的逐頁 audit**（特別是 arbitrary 值的 `max-w-`/`min-w-`/`max-h-`/絕對定位/`px-/py-` 等版面類），不要只等使用者一個個回報。
- 快速判斷某 class 是否「以前是死的」：`git show 8817a30b^:frontend/src/index.css | grep -c '<class>'`，回 0 = 切廚房後才首次生效、是高風險點。

> 註：此與字體/圓角/間距的「主動 token 遷移」是兩回事 —— 這是切廚房**被動**帶出的回歸，需先止血。

---

## 5. 明天的執行計畫（並行多批次）

**背景**：捲軸這批因撞到 Chrome 自訂捲軸的技術限制（CSS 做不到 hover-only）、被迫改走 JS 自繪大工程，所以特別耗時；**這是特例**。接下來的字體／間距／圓角是純 token 替換（改 CSS 變數 + 批次套用），不撞限制，**會快很多**。

**加速原則**：一天做多個批次（並行推進），但每批維持「**單一主題、做完各自驗收再下一批**」——不要把多種改動混在一個提示詞裡（今天全站掛掉的教訓：**變數單純才好定位**）。

**明天建議順序**（每批：單一主題 → 做完 → 驗收 → commit）：

- **批次 1：捲軸 C1 第二組** —— `CarouselMessageEditor` line534 縱向、`FacebookMessageEditor` line332 縱向，**都別碰橫向 tab**；FB 需有粉專才測得到
- **批次 2：圓角批次** —— 重做之前因切廚房還原掉的圓角統一，**純 token，快**
- **批次 3：捲軸 C1 Sidebar** —— side menu 導覽，結構單純但全站可見
- **批次 4：間距批次** —— gap/padding 級距統一，**純 token，快**
- **批次 5：捲軸 C2 聊天室** —— ⚠️**最高風險**：SSE 自動捲動 + 無限捲動，**放最後、精神好時做、不催；可延後到後天，不要硬塞**

**彈性**：批次 1–4 是快批，順的話一天可全清；批次 5（聊天室）時間/精神不夠就延後。
