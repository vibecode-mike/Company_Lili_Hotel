# 前端 Design Token 遷移 — 進度與接續指南

> 最後更新：2026-06-17（晚）
> 用途：明天打開就能照著接續。本檔 = 唯一進度真相來源。
> 對照表（舊硬寫值 → 新 token）：**`docs/token-migration-map.md`**
> 元件盤點：`docs/component-audit.md`

---

## 0. 一句話現況

「切廚房」已完成並上線到 staging —— 前端已改用 **live Tailwind v4 即時編譯**（不再用預編譯靜態 CSS）。
接下來是「逐類 token 遷移」，**一次只動一個變數**。下一個變數＝**字體 Inter→Noto**（明天開始）。

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

- [ ] **A. docs 納管**（小，隨手可做）
  - `docs/token-migration-map.md`、`docs/component-audit.md`、**本檔 `docs/progress.md`** 目前都還是 untracked。
  - `globals.css` 註解有引用 token-migration-map，建議 `git add docs/*.md` 一起納管。
- [ ] **B. 字體 Inter→Noto**（下一個變數，明天開始）→ 見 §3
- [ ] **C. 圓角 Radius**：把元件內 `rounded-[Npx]` 收斂到 `rounded-xs…3xl`。對照 `token-migration-map.md` §2。
  - 注意 §6b 眼睛確認：`rounded-[14px]`→12（−2px，集中在 LineApiSettingsContent）、`rounded-[15px]`→16（+1px）、`rounded-[2px]`→4（+2px）、`rounded-[32/80px]`→`rounded-full`、Figma 垃圾值（`158.824px`/`3.35544e+07px`）→`rounded-full`。
- [ ] **D. 間距 Spacing**：`px/py/p/gap/m*-[Npx]` 收斂到 Tailwind 數字工具類。對照 §3。
  - §3.1 是零變化（4 倍數）可安心批次；§3.2 是需眼睛確認（`gap-[10px]`→8 等 ±1~2px）。
  - §3.3 大版面位移（`ml-[330/280/250/72px]`）**不納入** spacing，另案處理。
- [ ] **E. 表格 UI 統一**：AI Chatbot 頁表格的灰色外框 + 表頭 hover 變色，是切廚房後恢復的樣式；連同其他頁表格一起在這批統一處理（目前刻意先不碰）。
- [ ] **F. 寫 `docs/design.md`**：把最終定案的 design system（字體 / 字級 / 行高 / 圓角 / 間距 / 顏色 token）整理成單一說明文件。
- [ ] **G. 更新 `CLAUDE.md`**：現有專案說明＋記憶 `project_frontend_precompiled_tailwind`（「build 不跑 Tailwind / 用靜態 index.css」）**已過時** —— 切廚房後是 live Tailwind。需更新成新事實，避免日後誤導。

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

## 5. 明天的第一個動作（建議）

> 「字體 Inter→Noto」開工：
> 1. 先 `git add docs/*.md` 把文件納管（待辦 A，順手）。
> 2. 產出 `docs/font-inter-to-noto.md`（§3 的清單）。
> 3. 依清單逐檔把 Inter/PingFang 收斂到 Noto，build + dev 自我驗證。
> 4. push main → 等 CI 綠 → staging 逐頁看字體 → OK。
