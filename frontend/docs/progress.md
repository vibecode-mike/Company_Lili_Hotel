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
- [~] **C. 圓角 Radius**：把元件內 `rounded-[Npx]` 收斂到 token 名。對照 `token-migration-map.md` §2（⚠️ 數字真相以 `globals.css @theme` 為準，見 §2a）。**進行中 — 進度見下方「C 圓角進度（2026-06-19 收工封存）」**。

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
1. **C 設定頁 14→16 ×19** —— `LineApiSettingsContent.tsx`，`rounded-[14px]`/`rounded-t-[14px]`/`rounded-tl/tr-[14px]` 全 → `rounded-2xl`(16)，+2px。量最大、視覺變化明顯。驗收 `/settings`。
2. **A 共用卡片 10→16 ⭐高風險** —— `FlexMessageCardPreview`（在 `CarouselMessageEditor.tsx`）。**要把 Carousel 的 `rounded-[10px]`×14 分兩類：卡片角→16（設計值）vs 其他容器→12（歸位）**，不可一律轉。動到三處渲染：**聊天室 `/members/chat`、訊息詳情抽屜（`/messages` 點列）、訊息預覽（`/flex-editor`）**，三處都要驗。
3. **B Carousel/FB 其餘 ⚠️風險最高放最後** —— CarouselMessageEditor 其餘 10px→12、`rounded-[6px]`→8；`FBConfigPanel.tsx` `6px`→8。**捲軸 C1 第二組擱置中、動圓角別碰捲軸結構；FB 需 crmpoc 有粉專才驗得到**。
4. **Part C 全站純換名 sweep** —— 圓角值全定案後，把全站剩餘 on-ladder arbitrary（`8/12/16/20/4/2px` 及 directional）一次按頁換成 token 名，**零變化**。含晶片/modal/內層那些還是 `rounded-[8px]` 的。sweep 完 → `token-migration-map.md` 退場。
5. **dead code 刪除（獨立 commit）** —— `imports/` 裡的 Figma 死碼（含一堆 8.4px/28px/80px/e+07 垃圾值，改了也驗不到）；參考 §C 計畫排除清單。**單獨一刀，不混圓角值改動**。
- [ ] **D. 間距 Spacing**：`px/py/p/gap/m*-[Npx]` 收斂到 Tailwind 數字工具類。對照 §3。
  - §3.1 是零變化（4 倍數）可安心批次；§3.2 是需眼睛確認（`gap-[10px]`→8 等 ±1~2px）。
  - §3.3 大版面位移（`ml-[330/280/250/72px]`）**不納入** spacing，另案處理。
- [ ] **E. 表格 UI 統一**：AI Chatbot 頁表格的灰色外框 + 表頭 hover 變色，是切廚房後恢復的樣式；連同其他頁表格一起在這批統一處理（目前刻意先不碰）。
  - ⬜ 待修小 bug（2026-06-19 做 B2a 時順手發現，與圓角無關）：`/messages`「已排程(0)」分頁的**空狀態（「尚無此資料」）外圍有奇怪的灰框、框線不對**。屬表格 UI 問題，留待本批一起修，**先不動**。
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

### 待辦（明天繼續）

- [ ] **C1 第二組**（⏸ **待處理（非跳過）—— 暫維持方案 B，2026-06-19 擱置**）：
  - 兩個雙軸容器（縱向自繪 + 同層橫向 tab 並存）：
    - `CarouselMessageEditor.tsx`（line 534 縱向 / line 570 橫向 tab strip）
    - `FacebookMessageEditor.tsx`（line 332 縱向 / line 372 橫向；⚠️ 需 crmpoc 有 **FB 粉專**才切得到、測得到）
  - 入口：群發訊息 → 活動與訊息推播 → 建立/編輯訊息 → 渠道選 LINE OA（Carousel）或 FB 粉專（FB 編輯器）
  - **擱置原因**：CarouselMessageEditor 縱向換 `<Scrollable>` 後，**橫向 tab strip 出現「輪播 9 卡在邊緣/被切掉」異常**（明明沒碰橫向）。
    - 靜態分析推不出根因：換 Scrollable 後 tab 寬度基準沒變、`no-native-scrollbar` 比原本 4px gutter 還**少佔 4px（內容反而變寬）**、新 thumb track 在 `right-0` 但內容有 `p-[40px]`、離 tab 右緣 36px 不會蓋到 → 三項都不該讓 tab 變窄。typecheck 過、無 reparent。
    - 唯一方向性差異是那 4px（且是變寬），疑為雙軸臨界狀態的版位位移，但**需 Chrome 現場量 computed layout 才能確認機制**，當下 session 無瀏覽器檢查工具。
  - **已 revert** CarouselMessageEditor 回原本 `overflow-y-auto scrollbar-transparent`（方案 B、可正常操作）；FacebookMessageEditor 同結構、本次一併不做。
  - **待日後**有 Chrome 檢查工具 / 更多現場截圖細節時再回來攻 C。
- [ ] **C1 Sidebar**：side menu 導覽清單（全站高可見度，放 C1 **最後**做）
- [ ] **C2 聊天室**（最高風險：SSE 自動捲到底 + 無限往上捲）：`ChatMessageList` / `ChatRoomLayout`，須保留 ref/onScroll，單獨謹慎做
- [ ] **C3** 表格橫向+巢狀 ／ **C4** 各頁 `<main>`（9 個頁殼主捲動）／ **C5** 其餘橫向（tab／輪播／chip）
- [ ] **雙軸表格批**：會員表格（雙軸 + 幽靈橫捲軸 + 表頭 4px 對不齊）→ 細節見下方
- [ ] **維持方案 B（不自繪）**：textarea、下拉 popover、shadcn UI 庫元件 —— 不納入 C 計畫
- [ ] **【Windows 跨系統檢查點】** 用 Windows 開 crmpoc 確認 C 捲軸是 **4px 灰圓角**、沒變回 Windows 預設醜樣式（選 C 而非 A 的核心理由，需實測；若不一致→檢討 thumb 繪製，不退回 A）
- [ ] **FilterModal 雙捲軸**：單獨小批，**保留 `showScrollbar` 的 `pr-2` 邏輯**
- [x] **字體（`71b92bbd` 全站收斂 Noto）已 push staging（已部署、CI 綠燈）、已告知同事**

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
