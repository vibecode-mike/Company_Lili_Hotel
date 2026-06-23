# 基本設定 — 三平台統一帳號狀態設計

> 日期：2026-06-23
> 範圍：基本設定（BasicSettings）列表，把「官網彈窗（Webchat）」納入，與 LINE / Facebook 共用一套狀態詞彙與欄位。

## 背景與問題

目前基本設定列表只完整支援 LINE / Facebook：

- 列表欄位：帳號、狀態（connected/expired）、Channel ID / Page ID、最後驗證時間、操作。
- 資料來源：LINE 走 `GET /api/v1/line_channels/list`、FB 走 `GET /api/v1/fb_channels`。
- Webchat 存在獨立表 `webchat_site_channels`，**沒有顯示在列表上**。

Webchat 與 LINE/FB 本質不同：

| | LINE / Facebook | 官網彈窗 (Webchat) |
|---|---|---|
| 識別碼 | Channel ID / Page ID | `site_id`（例 `starbit-ryan`） |
| 憑證 | access token、secret | **無**（純前端 widget 嵌入） |
| 連線狀態 | 對外部 API 驗證 token 是否有效 | 無「驗證」概念，裝上 JS 即啟用 |
| 資料表 | `line_channels` / `fb_channels` | `webchat_site_channels`（綁 tenant，選配綁 LINE OA） |

因此不能把 LINE/FB 的「狀態 + Channel ID + 最後驗證時間」直接套到 Webchat（會出現永遠假綠燈、空白驗證時間、無 Channel ID）。

## 決策

1. **狀態詞彙統一用「已開通 / 待開通」**，避開「已連結」造成的「持續連線」誤會。Webchat 是「一次性開通」語意。
2. **Webchat 的 ID 欄顯示 `site_id`（官網代號）**，欄位標題改為 `Channel ID / Page ID / 官網代號`。
3. **Webchat 用 beacon 偵測「已開通」**：widget 載入時主動回報，後端記最後載入時間。
4. **「已開通」採一次性語意**：收到第一個 beacon 後永久顯示已開通（不因短期無流量退回）。
5. **LINE/FB 保留憑證過期警示**：平常顯示「已開通」，偵測到過期翻成「需重新授權」。

## 狀態詞彙（三平台通用）

| 徽章 | 顏色 | Webchat 判定 | LINE/FB 判定 |
|---|---|---|---|
| **已開通** | 綠 | 曾收到過 beacon（`last_seen_at` 有值） | 憑證有效 |
| **待開通** | 灰 | 從未收到 beacon（`last_seen_at` 為空） | 尚未設定憑證 |
| **需重新授權** | 橘/紅 | （不出現，無 token） | 憑證過期（沿用現有 connection_status 偵測） |

## 列表欄位

| 欄位 | LINE | Facebook | 官網彈窗 |
|---|---|---|---|
| 帳號 | 圖示＋channel_name | 圖示＋page 名 | 💬＋site_name |
| 狀態 | 上表徽章 | 上表徽章 | 上表徽章 |
| ID 欄（標題：Channel ID / Page ID / 官網代號） | channel_id | page_id | site_id |
| 時間 | last_verified_at（最後驗證） | last_verified_at | last_seen_at（最後載入） |
| 操作 | 編輯/刪除/重新授權 | 重新授權 | （視需要，先留空） |

## Beacon 偵測機制（官網彈窗）

### 流程

1. widget `widget/lili-chatbot.js` 載入時，用 `navigator.sendBeacon` 送一個輕量請求：
   `POST /api/v1/webchat_sites/{site_id}/seen?url=<location.href>`（**無 body、url 走 query**）。

   > ⚠️ 跨網域 CORS 重要結論：客戶官網是跨網域，若用 `application/json` body 的 fetch，
   > 瀏覽器會先送 CORS 預檢(OPTIONS)。**經 crmpoc 的 nginx 會自己回 OPTIONS，但回應未帶
   > `Access-Control-Allow-Origin`** → 瀏覽器判定預檢失敗、直接擋掉請求（curl 因不走預檢而測不出來）。
   > 故 beacon 刻意做成「簡單請求」（sendBeacon / 無 body / url 走 query），完全略過預檢，
   > 不依賴 nginx CORS。為何聊天本身沒事：聊天 UI 跑在 crmpoc 的 iframe（同網域），beacon 卻跑在
   > 外層客戶頁（跨網域）。
2. 後端更新該 site 的 `last_seen_at = NOW()`（**台灣時間**，遵守時區慣例，禁用 utcnow）、`last_seen_url`。
3. 請求失敗一律靜默忽略，**不得影響客服 widget 正常開啟**。

### 後端改動

- **新欄位**（`webchat_site_channels`，手寫 migration，遵守 DB SOP — 不用 autogenerate）：
  - `last_seen_at` `DateTime` nullable，comment「最後一次被瀏覽器載入（台灣時間）」
  - `last_seen_url` `String(500)` nullable，comment「最後載入的頁面網址」
- **新 endpoint**：`POST /api/v1/webchat_sites/{site_id}/seen`
  - 公開、免登入（給客戶官網前端打）。
  - 只更新時間戳與 URL，找不到 site_id 就回 200 `message=ignored`（避免外部探測造成噪音）。
- **狀態規則**：`last_seen_at IS NOT NULL → 已開通`，否則 `待開通`。

### 前端（widget）改動

- `widget/lili-chatbot.js` 載入時加一段 `fetch(...).catch(()=>{})` 送 beacon。

## 列表資料來源（待實作時確認）

已新增 `GET /api/v1/webchat_sites/list`，回傳 site_id、site_name、tenant_id、line_channel_id、last_seen_at、last_seen_url、is_activated（一次性語意：last_seen_at 有值即 true）。免登入，比照 line_channels/list。

## 待確認風險（不是已確認 bug）

嵌入碼產生的是 `{public_base}/widget/loader.js`（4 處：`line_channels.py:494`、`tenants.py:123`、`chatbot.py:125`、`CreateWebchatOrgModal.tsx:27`），但：

- 實際檔名是 `widget/lili-chatbot.js`，**沒有 loader.js**。
- 後端 StaticFiles 掛在 `/api/v1/widget`，**而嵌入碼用 `/widget`（前綴不同）**。

線上 webchat 目前可正常運作，**極可能 nginx 有 rewrite**（把 `/widget/` 轉到 widget 目錄、`loader.js` 對映 `lili-chatbot.js`）。

→ **需先與 nginx / 部署負責人確認**再決定是否要動。若 nginx 確實有對映就不是 bug；若沒有則嵌入碼會 404，需修正產生的檔名或補一支 loader.js。**不在本設計直接修改 nginx。**

## 待辦（實作順序）

1. [x] model 加 `last_seen_at` / `last_seen_url` + 手寫 idempotent migration（657b81b6854d；dev upgrade + check 乾淨，零新 drift）
2. [x] 後端 `POST /api/v1/webchat_sites/{site_id}/seen` beacon endpoint（公開）
3. [x] widget `lili-chatbot.js` 載入時送 beacon（有 SITE_ID 才送、失敗靜默、keepalive）
4. [x] webchat sites 列表 `GET /api/v1/webchat_sites/list`
5. [x] 前端 BasicSettings：ID 欄標題改「Channel ID / Page ID / 官網代號」、狀態詞彙改「已開通/待開通/需重新授權」、加入 webchat 列（💬 圖示）
6. [ ] 確認 loader.js / `/widget` 路徑風險（找 nginx/部署負責人）— 與本功能無關，獨立追蹤

## 實作備註（地端已驗）

- 後端已重啟（`lili_backend.service`）。curl 驗證：`/webchat_sites/list` 回 2 站（mike、ryan）；對 ryan 打 beacon 後 `is_activated` 由 false→true、`last_seen_at`/`last_seen_url` 寫入；未知 site_id 回 `ignored`。
- 前端 `tsc --noEmit` 0 錯誤。Vite dev 熱載。
- beacon 時間用 `datetime.now()`（伺服器 Asia/Taipei，與 chatbot_service 一致）。
- 尚未 commit / push，待使用者開 crmpoc 驗收。
