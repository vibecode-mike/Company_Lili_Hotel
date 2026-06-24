# 設計系統遷移 — Playbook 素材庫（草稿）

> ⚠️ 這是**素材庫**，不是成稿。趁記憶新鮮邊做邊記，結構鬆散無妨。
> 目標：力麗飯店這次「設計系統遷移」（圓角 / 捲軸 / 間距 / 顏色）踩過的坑與有效流程，
> 之後整理成可重用的 **skill / agent**，讓未來類似遷移直接套用、不重踩坑。
>
> 狀態：**收集中**。圓角未完，捲軸/間距/顏色尚未開工。每做完一批回來補充。
>
> 相關文件：`progress.md`（進度）、`token-migration-map.md`（token 對照）、
> `font-inter-to-noto.md`、`external-token-management.md`、`component-audit.md`。

---

## 1. 有效的流程紀律

> 「怎麼動手」的紀律。這些是讓遷移不出包、可回溯、可交接的工作習慣。

- **一次一變數 / 一批一主題**：圓角就只動圓角，不順手改間距或顏色。一個 PR/一輪只攜帶一個變數，
  出事時責任邊界清楚、好回滾。
- **動手前先給範圍 diff**：開工一批前，先把「這批會碰哪些檔案 / 哪些值」攤出來給人看，
  確認範圍對了再動手，而不是改完才解釋。
- **驗收才 commit，不用 auto mode**：每一步都人工確認過再 commit。不開自動模式讓它連續跑、
  避免一次堆一大坨無法逐項驗收的改動。
- **細顆粒 commit（拉 A 只有 A）**：一個 commit 只裝一件事。要拉出 A 功能時，那個 commit 裡
  只有 A，沒有夾帶 B。方便 cherry-pick、revert、code review。
- **commit 是本地安全動作，push 才上 staging**：commit 只動本地，是隨時可整理的安全網；
  `push origin main` 會觸發 CI 部署到 staging。心裡要分清楚這兩個動作的後果不同。
- **「零變化」要證明（移除值 = 新增值 1:1）**：宣稱「這次改動視覺零退化」時，要拿得出證據——
  移除的舊值與新增的新值一一對應、數量相等。不能只是「感覺一樣」。
- **高風險區：單線進行 + 精神好時做**：容易連鎖出包的地方（live Tailwind 切換、結構搬移）
  不要併行多線，挑精神好、不趕的時段單獨做。
- **動工前先確認自己漏沒漏 commit**：每次開工第一件事——`git status` + `git fetch` 比對，
  確認工作區乾淨、沒有自己上次忘了存的東西。
- **分清「自己工作區」vs「同事動向」**：本地未 commit 改動是自己的事；origin 落後是同事 push 了。
  兩者混在一起判斷會誤事，要先拆開看（本地 dirty? / 落後 origin?）。
- **跨 session 用的計畫/清單，當場寫進檔案（不可只留對話）**：任何要隔 session 接續的東西
  ——分包清單、待辦排序、定案理由——一產出就寫進 `progress.md`（或對應 docs）。
  實例（2026-06-22）：圓角 sweep 的分包清單只在上個 session 對話裡產出、沒落檔，
  context 一摘要就遺失，下個 session 只能從 source 重新清點重建。
  教訓：**對話會被摘要壓縮 = 會遺失；檔案才是跨 session 真相。** 同「文件指向真相」一脈
  ——計畫本身也得有個檔案承載，不能靠記憶或對話歷史。

---

## 2. 踩過的坑 + 解法

> 「實際撞到的牆」與當時怎麼繞過。每一條都是真實事故的縮影。

- **文件會過時 → 真相在程式碼本身**
  - token-map 文件曾**錯 3 次**，最後真相是去看 `globals.css` 才對。
  - 教訓：遷移文件（對照表、map）是輔助，**最終真相以實際 CSS / source 為準**。
    照文件改之前先回源頭核對。
- **「文件指向、不複製」+「施工完退場」**
  - 文件應該**指向**真相來源，而不是把值複製一份進來（複製就會分叉、過時）。
  - 一次性的施工說明文件，做完就該**退場/封存**，別留著誤導後人。
- **「零變化」可能其實 +2px → 驗明正身**
  - 自以為等價的替換，實際差了 2px（例：某圓角從一個值換到「等價」token 卻偏移）。
  - 教訓：替換前後**實際量過 px**，別信「應該一樣」。
- **HMR 快取殘影 ≠ 真退化 → 強重整再判**
  - dev server（live Tailwind）換 class 名（`rounded-[8px]`→`rounded-md`）的瞬間，HMR 更新 CSS 那一刻
    瀏覽器可能短暫渲染舊/中間狀態，看起來像「圓角變了」。實例（2026-06-22，圓角 sweep P3）：
    訊息文字框看起來變不圓 → 查 prod build CSS + **直接拉 dev server :5173 live CSS** 兩個獨立來源，
    證實 `rounded-md=calc(var(--radius)-2px)`、`--radius=0.625rem`、`html font-size=16px` → 鐵定 8px=8px、零變化。
    使用者 **Ctrl+Shift+R 強重整後圓角恢復一致** → 確認是 HMR 快取殘影。
  - 教訓：crmpoc 驗收看到「換名後好像變了」，**先強重整**；仍不一致才查機制。
    查機制時 ground truth = ①prod build CSS ②`curl localhost:5173/src/styles/globals.css` 的 live module
    ③`--radius`/`html font-size` 是否唯一定義（rem token 的 px 值吃 root font-size，要連 font-size 一起驗）。
- **死碼陷阱 → 列清單先驗 render，別只 grep**
  - grep 找到的元件不代表真的會被 render。曾經把 2 個死碼元件誤列進工作清單。
  - 教訓：列容器/元件批次清單前，先確認元件真的會 render（查 import / 路由），死碼一律排除。
- **工作區不明改動 → 查身世再動**
  - 看到未 commit 的改動先別急著 revert 或 commit，先查它的來歷——**很可能是自己之前做的工作**。
  - 用 git（blame / log / diff / stash list）查清楚再決定。
- **協調點：改結構後改值要知道改哪一層**
  - 例：表格圓角**搬到外層 wrapper** 之後，再要調圓角就得改 wrapper 那層，不是原本內層。
  - 教訓：結構搬移會改變「值該掛在哪」，搬完要更新自己對「改哪層」的認知。
- **純 CSS hover 捲軸 → Chrome 不可靠**
  - 想用純 CSS（hover 才顯示 scrollbar）在 Chrome 上行為不穩。需要別的方案（待補：實際採用法）。
- **雙軸表格幽靈捲軸**
  - 同時可橫向 + 縱向捲動的表格會冒出「幽靈捲軸」。（待補：成因與解法細節）
- **textarea 捲軸：能 CSS 美化但「框塞自身」會讓捲軸偏外**
  - 認知修正（2026-06-24）：textarea **不能**套 JS 自繪 Scrollable（replaced element、包不到內捲＝紅線），
    但**能**用 CSS `::-webkit-scrollbar`（如全站 `.scrollbar-transparent`）染成 4px 細灰，消滅粗原生捲軸。
    （活證：`chat-widget-textarea`、`MemberNoteEditor` 都是 textarea 卻細灰。）
  - 但**捲軸位置**受結構影響：把框（`bg`/`rounded`/`padding`）塞在 **textarea 自身**時，
    Chrome 把 `::-webkit-scrollbar` 畫進內距帶 → 4px thumb 浮在欄位框右側、**不貼內緣**（看起來像掉在框外）。
    對比正確 pattern（`MemberNoteEditor`）：框放**外層 wrapper**、textarea 本體**裸透明 + 零自身 padding** → 捲軸貼內容右緣。
  - 修法方向：框搬到 wrapper、textarea 裸透明。**但別憑幾何硬推**——
    `MemberNoteEditor` wrapper padding(20px) 比偏外的(8px)**還大**卻正常 → 關鍵是「框在誰身上 / textarea 是否裸透明」結構因素、非 padding 數字。
    確切捲軸繪製位置**需 `claude-in-chrome` 量 computed layout 證實**；**沒工具別硬改 restructure**（會白工/誤修）。
    先接受「細灰但偏外」（主目標消滅粗原生已達成），位置當獨立優化、工具到位再做。
- **隔天 / 隔多天回來 → 先確認狀態，不靠記憶**
  - 休息後回來第一件事是用 git 確認真實狀態（工作區 / 同步 / 上次收工點），
    不靠「我印象中應該是…」。記憶會騙人。
- **頁殼 main 是 window 捲，不是有界內捲 → 排除出自繪 Scrollable 計畫**
  - 發現（2026-06-23，C4 驗證第一頁時）：頁殼最外層是 `min-h-screen flex` + Sidebar `position:fixed`（脫離流排）
    → flex 列高由 main 內容驅動 → main 拉伸到自己內容高 → **永不溢出**。所以頁殼 `<main overflow-y-auto scrollbar-transparent>`
    是 **inert 死樣式**，實際是**瀏覽器原生 window 捲軸**在捲，main 不是捲動容器。
  - 對比：Sidebar 的 `<aside>` 是 `h-screen`（有界高）→ nav `flex-1 min-h-0` 才是真內捲，套 Scrollable 成立。
  - 判斷法：套 Scrollable 前先看祖先有沒有**有界高度**（`h-screen` / `max-h-[]` / 固定 `h-[]`）。只有 `min-h-screen` = 整頁捲，沒有可套的有界區。
  - 決策：**自繪 4px Scrollable 只給「有界內層容器」**（清單 / 面板 / 表格 body / 下拉 / 抽屜）；頁面層級的整頁捲，**原生 window 捲軸是正解**，不為了視覺一致硬把頁殼改 `h-screen` 內捲（大 UX 改動、性價比差）。
  - 連帶：9 個頁殼 main（MessageList/PMS/Insights/AIChatbot/Facilities/CreateAutoReply/MessageCreation/LineApiSettings/MainLayout）全部**排除出 C 計畫**。
- **⭐ 共用機器/帳號：外部自動程序會搶 git → commit 前查索引、push 前 fetch**
  - 事故（2026-06-24）：有外部自動程序在跑 `git add -A && git commit`（甚至 push），把我**未 commit 的工作**（MemberTagEditModal+progress）**掃進它的 commit**（`75a8b94e`，訊息掛 timezone），且**branch 跟 origin 分歧**（雙方各自在同一 base 上長新 commit）。
  - 後果：**程式碼不丟**（已被 commit、grep 驗 Scrollable 都在），但**commit 訊息掛錯主題**、**push 被 non-fast-forward 擋**、**我的 commit 跟同事的交錯無法乾淨拆**。
  - 教訓：① **commit 前先 `git status` / `git diff --cached --name-only` 看索引被誰 stage 了**（我曾以為只 stage 2 個檔，實際索引早被掃進一堆別人的後端檔）。② 共用機器/帳號上工先確認**有沒有自動 commit 程序在跑**。③ 被掃走時別慌——程式碼在 commit 裡沒丟，先 `git cat-file -e`/`git grep token HEAD` 逐一驗在不在。④ **push 前一定 `git fetch` 看分歧**（`git rev-list --left-right --count origin/main...HEAD`）。⑤ 動 git 修歷史前，先確認自動程序**停了**，否則邊修邊被攪。⑥ 真出狀況時「接受現狀（程式碼沒事）」往往比「硬拆歷史」省事且安全。
- **⭐ 橫向 Scrollable 首戰：先驗 render（死碼）+ 先驗「真會捲」（真溢出）**
  - 原訂橫向首戰 `flex-message/PreviewPanel:64` → 查證是**死碼**（零 importer、無 barrel、無 build chunk；渲染者 `FlexMessageEditorNew` 已刪 → 孤兒）→ 改用 `InsightsPanel:1272`（heatmap）。教訓重申：**列容器清單前先驗 render**，§2c 清單會因死碼清除而過時。
  - 「有 `overflow-x` class」≠「真的會橫捲」：要驗**內容真的會溢出**（如 heatmap `min-w-[720px]` → 窄視窗才溢出）。使用者**縮窄視窗截圖**確認 tab strip + heatmap 都真橫捲，才確定不是 inert 死樣式。
  - `Scrollable orientation="horizontal"` 首次實戰要像「2xs 首用」眼見為憑：hThumb 在**底部**、4px、hover 才現、拖得動、不破版。確立後同模式可批次套純橫向 table（5 個一次）。
- **⭐ React 自繪捲軸（hand-rolled）能全量遷移換 Scrollable，§2b macOS 疑慮已解**
  - FilterModal（≈90 行手刻：state/effect/拖曳/寫死偏移）、MemberTagEditModal（本地 `CustomScrollbar` 元件）都**全量刪掉自繪 → 換 `<Scrollable vertical>`**，大清理（FilterModal −113/+6）。
  - §2b 原疑慮「macOS modal 內捲軸看不見」**不成立**：那些自繪本就為「不依賴原生捲軸可見性」而生，**Scrollable 用一模一樣技術**（`no-native-scrollbar`+JS thumb）→ FilterModal 換上後 modal 內 hover 才現正常 = 已證。
  - 保留要點：①有 wheel handler/onScroll 的，靠 **Scrollable forwardRef 暴露 viewport**（`<Scrollable ref={scrollRef}>` → `scrollRef.current`=viewport）接回，原 handler 不動。②`pr-2`/`pr-[8px]` 讓位改**常駐**保留（thumb 不蓋內容）。③行為改變：常駐 thumb → hover 才現（全站統一、可接受）。
- **共用元件刪除前先查 import（import≠唯一使用者）**
  - `CustomScrollbar`（定義在 MemberTagEditModal、`export`）→ 遷移 MemberTagEditModal 時**不能順手刪**，因 `imports/MainContainer-6001-1415`（會員表格）也 import 用。**待雙軸表格批遷移會員表格時一起刪**。教訓：刪 export 的東西前 `grep -rn` 全 repo 找 importer。

---

## 3. 決策模式

> 「遇到岔路怎麼選」。判斷要不要做、做到什麼程度的思考框架。

- **不確定 / 牽涉別人 → 先查證（用 git，不靠記憶）**
  - 任何牽涉協作或自己沒把握的點，用工具查事實（git status/log/fetch），不用記憶下判斷。
- **執行舊定案前，先驗證它的「前提」還成立**
  - 隔了時間（甚至只是隔一個 session）做的定案，常綁著當時的某個假設。執行前先回去讀**現在的結構**，確認那個假設今天仍然成立，別把定案的「結論」照搬而跳過它的「前提」。
  - 實例（2026-06-22，圓角批 A）：舊定案「卡片預覽框 padding 砍到 4」，**前提是「卡片貼著框角、要維持同心，所以 `外圓角 = 內圓角 + padding`」**。實際讀三處 render 結構發現卡片全是 `justify-center/items-center` **置中浮在框內**、卡片角與框角根本不相鄰 → **同心前提不成立** → 砍 padding 沒有圓角上的必要性，那是另一回事（間距/視覺決策）。若照舊定案盲做，會在圓角批裡硬塞一個無關且大幅的間距變動。
  - 一句話：**定案會過時，跟文件一樣（見第 2 節「文件會過時」）。結論要連著前提一起驗，前提倒了結論就不一定成立。**
- **避免拋棄式白工**
  - 例：會員表若現在加 wrapper，之後 Scrollable 重做時這個 wrapper 會被打掉 → **那就現在先不做**。
  - 判準：如果一個改動在已知的未來計畫裡注定被重做/丟棄，現在就別投入。
- **文件治理三原則**
  1. **單一真相**：一個事實只有一個權威來源（通常是 source code / globals.css）。
  2. **指向不複製**：文件指向真相，不把值複製進來造成分叉。
  3. **過時退場**：一次性 / 已完成的文件做完就封存退場，不留著誤導。
- **CP 值判斷：止血 vs 完整修**
  - 每個坑都先問：現在要的是**止血**（最小成本擋住問題）還是**完整修**（根治）？
  - 依當下階段、風險、剩餘工作量決定，不是每個洞都要一次補到完美。

---

## 待補 / TODO（之後每批回來填）

- [ ] 純 CSS hover 捲軸在 Chrome 的具體不可靠表現 + 最終採用方案
- [ ] 雙軸表格幽靈捲軸的成因與解法
- [ ] 捲軸批：開工後補經驗
- [ ] 間距批：開工後補經驗
- [ ] 顏色批：開工後補經驗
- [ ] 圓角批收尾：補齊剩餘坑
- [ ] 最後成稿：把以上整理成 skill / agent（設計系統遷移可重用流程）
