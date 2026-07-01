# 時區架構翻轉盤點清單（DB 台北 → DB UTC）

> 用途：Stage 2 實作對照表 + dadova fork 參照。
> 目標架構：**DB 一律存 UTC** / 後端輸出 UTC aware ISO（`+00:00`）/ 前端依「觀看者瀏覽器時區」顯示 / 排程「設定者瀏覽器時區 → UTC」/ 報表與「日曆日」用 **OPERATING_TZ（預設 Asia/Taipei）**。
> 慣例反轉：舊「DB naive = 台北」→ 新「DB naive = UTC」。
> 標記：🟢 已親驗行號；⚪ 掃描結果（Stage 2 動手前逐檔再確認）。

---

## 0. 全局：寫入「兩套機制」必須一起翻
- Python 端：`base.py _now_taipei()`（台北 naive）、各處 `datetime.now()`（host-local）、line_app `utcnow()`（UTC）
- DB 端：`func.now()` / 原生 `NOW()`（吃連線 session tz；目前 pin `+08`）
- ⚠️ line_app 今天已是混的：`member_service.py` 用 `utcnow()`(UTC)、`conversation_service.py`/`app.py` 用 `NOW()`(+08)。連線 pin 改 `+00` 後兩者統一成 UTC（順帶修掉既有不一致）。

---

## (a) 寫入點

### A1. Python 端（改成 UTC）
| 檔案:行號 | 現況 | 動作 |
|---|---|---|
| 🟢 models/base.py:12-14 `_now_taipei()` | 台北→naive（被所有 created_at/updated_at 繼承） | →UTC（改名 `_now_utc`） |
| ⚪ api/v1/auth.py:89 last_login_at | host-local | →UTC |
| ⚪ services/linebot_service.py:126 send_time | host-local | →UTC |
| ⚪ services/faq_service.py:36/113/312/407/483/657/785 | host-local | →UTC |
| ⚪ services/tracking_service.py:78/146/187/263/275 | host-local | →UTC |
| ⚪ services/message_service.py:505/1518 | host-local | →UTC |
| ⚪ services/chatbot_service.py:1500/2518 | host-local | →UTC |
| ⚪ api/v1/webchat_sites.py:70 last_seen_at | host-local | →UTC |
| 🟢 api/v1/booking_callback.py:291 paid_at | 台北→naive（明寫 Asia/Taipei） | →UTC |
| 🟢 services/tag_trigger_service.py:61 triggered_at | 台北→naive | →UTC |
| ⚪ models/tag_trigger_log.py:81 `default=datetime.now` | host-local（Python default 非 func.now） | →UTC |
| 🟢 api/v1/members.py:1094/1220 human_override_until | host-local | →UTC（見 (e)） |

### A2. DB 端 `func.now()` / `server_default`
約 46 欄、23 model。**靠連線 pin 改 `+00` 一次覆蓋**，不逐欄改 code。

---

## (b) 輸出給前端（統一成 UTC aware `+00:00`）
1. **Pydantic schema datetime 欄位（~40，無自訂 serializer → 預設吐 naive 無標記）**：schemas/ 下 message/campaign/member/auth/tenant/pms_integration/line_channel/fb_channel/webchat_site/faq/tracking/common。→ 全域 datetime serializer 統一吐 UTC aware（逐欄 Stage 2 再確認）。
2. **手動 `.isoformat()`（naive 無標記）**：⚪ campaigns.py:115-119/162-168、faq.py:81/86/96/167/172-173/263/267-268/850/900/1029、tracking.py:63/153、admin_meta_user.py:211-212。（admin_retention.py:82/147/156 已是 `+00:00`。）
3. **聊天/SSE 雙欄位（高風險，含「後端預格式化字串」要拔）**：
   | 位置 | `time`（顯示字串，拔） | `timestamp`（ISO→UTC） |
   |---|---|---|
   | services/chatroom_service.py:206-207 | format_chat_time | +08 |
   | api/v1/members.py:1208/1211、1262/1270、1339/1347 | format_chat_time | +08 |
   | api/v1/line_notify.py:60-80/139 | 自組字串 | epoch→+08 |
   | services/chatbot_service.py:1634-1659 `_iso()` | format_chat_time | +08 |
   | services/fb_ws_proxy.py:116-117 | strftime | isoformat |

---

## (c) 讀取假設「naive=台北」（改成 naive=UTC）
| 檔案:行號 | 現況 |
|---|---|
| 🟢 services/chatroom_service.py:184-188 format_chat_time 標 TAIPEI | 改 naive=UTC |
| 🟢 api/v1/members.py:1270/1313/1329/1347/1359 `.replace(TAIPEI_TZ)` | 改 UTC |
| 🟢 api/v1/conversations_export.py:136-138 `.replace(TAIPEI_TZ)` | 改 UTC（顯示用 OPERATING_TZ，見 (b')） |
| 🟢 api/v1/chat_messages.py:29-33/53-57 `_ensure_utc`/`format_iso_taipei`（naive 已當 UTC） | 輸出端不轉 +08 |
| 🟢 api/v1/members.py:47-85 format_taipei_time（naive 已當 UTC） | 輸出端不轉 +08 |

---

## (b') 營運時區輸出區（無「觀看者」→ 不套 follow-viewer、不丟原始 UTC → 用 OPERATING_TZ）
| 檔案:行號 | 現況 | 動作 |
|---|---|---|
| 🟢 api/v1/conversations_export.py:139 strftime（CSV） | naive 當台北 | UTC→OPERATING_TZ 後 strftime |
| 🟢 api/v1/chatbot.py:152 strftime | naive 當台北 | UTC→OPERATING_TZ 後 strftime |

---

## (d) 前端 formatter（依觀看者瀏覽器時區；解析 UTC、不指定 timeZone）
全部 ACTIVE、已驗證 render：
- utils/memberTime.ts（formatMemberDateTime + formatUnansweredTime）
- contexts/MembersContext.tsx
- components/MessageList.tsx
- components/MessageDetailDrawer.tsx
- components/BasicSettings.tsx
- components/AutoReply.tsx
- chat-room/ChatRoomLayout.tsx（formatDateWithWeekday + transformFbMessages）
- 🟢 **components/AIChatbotOverview.tsx:74-80**（last_rule_updated_at；補列）
- 🟢 **components/DownloadConversationsModal.tsx:39-47/101-102/211/225**（todayStr 日期上限 + from/to 過濾；補列。**注意：日期上限是「日曆日」概念，用觀看者本地日，不可當 UTC 瞬間**）

**關鍵點：**
- 🟢 chat-room/ChatBubble.tsx:484-493：吃後端 `message.time` 字串 → 改自己用 `timestamp` 格式化（與 (b)3 拔字串同批）。
- 🟢 chat-room/ChatRoomLayout.tsx:157-159：`transformFbMessages` 寫死 `+8*3600*1000`→`+08:00` hack → 移除，改純 UTC。

**排程輸入/編輯：**
- 🟢 components/MessageCreation.tsx:990-999：送 naive `"YYYY-MM-DD HH:mm:ss"` → 改本地→UTC ISO。
- 🟢 pages/FlexEditorPage.tsx:145-150：`new Date(scheduled_at).getHours()` 當本地 → 改 UTC→本地填回。
- DateTimePicker.tsx / TriggerTimeOptions.tsx：本身只管字串，轉換在組裝送出層做。

---

## (e) ★業務邏輯比較/到期（錯了改行為）
| 點 | 寫入 | 比較 | 風險 |
|---|---|---|---|
| 🟢 human_override_until | members.py:1094/1220（host-local） | line_app member_service.py:316-317（host-local `> now()`） | **高**：跨 backend/line_app 兩進程，成對改 UTC |
| 🟢 **FB 自動回覆時間**（補列） | — | **members.py:1278-1281**：`sent_timestamp=int(created_at.replace(TAIPEI_TZ).timestamp())` 比 FB epoch | **高**：created_at 變 UTC 後 `.replace(TAIPEI_TZ)` 要改 utc |
| 🟢 排程觸發 | schema MessageCreate | services/scheduler.py:197-214（`scheduled_at > now`, host-local）＋ schemas/message.py:186-200（未來驗證, app tz） | **高** |

**已查證不列（相對值/外部 API/key-based，非營運日界線）：**
- token 用量：usage_monitor.py:55-88 走 LINE 外部 billing API（`monthly_limit−used`），DB `ai_token_usages` 是 counter，非 SQL 日期視窗。
- 去重：tracking_service.py:221-265 以 `message_id` 為 key；chatbot_service.py:1582/1610 `+timedelta(ms)` 僅排序。

---

## (f) DB trigger / SP 內 `NOW()`（靠 pin 變 UTC，不改 SQL）
🟢 4 migration 的 trigger/SP body 用 `NOW()`（line_friends↔members 同步）：`26d892fb5b82`、`6e2d4a0d7d1b`、`1f9c8e7c2c2a`、`fa40436b732e`；line_friends DDL 有 `DEFAULT/ON UPDATE CURRENT_TIMESTAMP`。經 app 連線觸發 → 吃 pin `+00`。`9dc77a2ba1c3`(tenant) 無時間戳。
⚠️ 邊緣風險：非經 app 連線（手動/其他腳本）觸發則 tz 不保證。

---

## (g) ★排除 UTC 換算（用 OPERATING_TZ / 維持本地）
**① DATE 型欄位（🟢 全確認 `Column(Date)`）**：consumption_record(stay_date/check_in_date/check_out_date)、chatbot_booking(checkin/checkout ×2)、campaign(campaign_date/start_date/end_date)、booking(checkin_date)、pms_integration(stay_date)、auto_response(date_range_start/end)、member(birthday)。→ 不碰。

**② 日曆日計算 / 時段判斷（用 OPERATING_TZ）**：
| 檔案:行號 | 現況 | 動作 |
|---|---|---|
| 🟢 line_app/app.py:372-376（**從 (e) 移來**）自動回應 date_range/time_range 判斷 | `datetime.now().date()/now()` host-local | 用 OPERATING_TZ（DATE 欄位+時段牆鐘，改 UTC 會錯位日界線/時段） |
| 🟢 services/faq_service.py:709-710 今天/明天 | `datetime.now()`（host-local）裸 | 改明確 OPERATING_TZ |
| 🟢 services/chatbot_service.py:915/1222/2955/3184 | 已 `datetime.now(ZoneInfo("Asia/Taipei")).date()` | 改指向 OPERATING_TZ 常數（語意已對） |

---

## (h) 外部 epoch（fromtimestamp）
| 檔案:行號 | 現況 | 結論 |
|---|---|---|
| 🟢 chat_messages.py:218、members.py:1303 | `tz=timezone.utc` | ✅ 維持；輸出端不轉 +08 |
| 🟢 line_notify.py:60/139、fb_ws_proxy.py:110 | `tz=Asia/Taipei`（瞬間正確） | 輸出改 UTC |
| 🔴 message_service.py:879-880、messages.py:354、line_notify.py:115 | 無 tz（FB/LINE epoch 是真 UTC，被當 host-local） | **確認為 UTC epoch → 補 `tz=timezone.utc`**（既有 bug，順手修） |
| ⚠️ auto_responses.py:42 `fromtimestamp(value)` | 無 tz，generic int→datetime coercion | **來源未證實**：Stage 2 查 caller 確認 epoch 來源後再決定 |

---

## 架構要求
**A. 單一 OPERATING_TZ 常數**（預設 Asia/Taipei / `+08:00`）：analytics CONVERT_TZ、faq 今天/明天、自動回應時段、CSV 匯出 全指向它。建議放 `backend/app/core/`（Python `ZoneInfo` + SQL 用 `'+08:00'` offset 字串；註：CONVERT_TZ 用具名時區需 MySQL tz 表，台北無 DST 故用 offset 安全）。line_app 端對應一份。
**B. CLAUDE.md**：改寫 Timezone Convention（DB=UTC）+ 更新/反轉「line_app 禁用 utcnow」紅線（新規則：寫入一律 UTC；NOW() 經 pin 即 UTC；Python 用 `datetime.now(timezone.utc)`）。

---

## 部署原子性
**核心翻轉是一個原子發布，不可分次 deploy 到 staging：** 連線 pin(+00) + Python 寫入 + 讀取解讀 + 輸出標記 + 前端顯示 + 聊天三件套 + line_app。中間態會全部歪 8 小時。
**可獨立後續：** analytics CONVERT_TZ、(h) epoch 補 tz、auto_responses.py:42 查證。
→ 分段寫、分段審；核心一次 push staging。

---

## Stage 2 子階段（分段審，核心同批部署）
1. OPERATING_TZ 常數 + base.py `_now_utc` + 連線 pin `+00`（backend+line_app）
2. 讀取解讀 (c) naive=UTC + 輸出標記 (b) 統一 `+00:00`
3. 聊天三件套（後端拔 `time` 字串 + 前端 ChatBubble 改吃 timestamp + 移除 +8h hack）
4. (e) 業務比較成對改 UTC（human_override 寫入+比較、FB 自動回覆、排程觸發）
5. (g) OPERATING_TZ：自動回應時段、faq 今天/明天、CSV 匯出 (b')
6. 前端 formatter 收斂 + 排程輸入/編輯 本地↔UTC
7. CLAUDE.md 改寫
— 1~6+line_app = 同一原子 staging 發布 —
8. ✅ analytics CONVERT_TZ 已完成（commit f69de83b + c66fc86f，已 push main）
9. ✅（後續）(h) epoch 補 tz + auto_responses.py:42 查證（見下方完成紀錄）

---

## 完成紀錄 / 跨界提前項（避免重做）
- **子階段 1**：✅ 完成（commit ae92c6a4）
- **子階段 2**：✅ 完成（commit d16fe298）
- **子階段 3（聊天三件套）**：✅ 完成。後端拔除所有聊天 `time` 顯示字串 + `format_chat_time` / `format_taipei_time` / `format_iso_taipei` 全刪/改 UTC；前端新增 `chat-room/timeFormat.ts:formatChatTime`（依觀看者時區）、`ChatMessage` 型別移除 `time`、`transformFbMessages` 移除 +8h hack。
  - **⚠️ 提前處理（已於子階段 3 完成，子階段 4/9 不要再碰）：**
    - `members.py` FB 自動回覆比較 `sent_timestamp`（原 (e)/子階段 4）→ 已改 `.replace(tzinfo=timezone.utc)`。**子階段 4 的 (e) 只剩 human_override（寫入 members.py + 比較 line_app member_service.py:317）與 scheduler。**
    - `line_notify.py:115` `created_at` 寫入（原 (h)/子階段 9）→ 已改 `fromtimestamp(..., tz=utc).replace(tzinfo=None)` naive UTC。**子階段 9 的 (h) 只剩 message_service.py:879-880、messages.py:354、auto_responses.py:42。**

- **子階段 3.5（散落 Python `datetime.now()` 寫入）**：✅ 大部分完成（commit 見下）。
  - 新增單一來源 `app/core/timezone.py:now_utc()`（naive UTC）；`base.py._now_utc` 改 import 它（不再兩份）。
  - 寫入點 → `now_utc()`：chatroom_service 44/51/78、auth:89、linebot_service:126、message_service 505/1518、faq_service 36/113/312/407/657/666/785、faq.py:808、tracking_service 78/146/187/263/275/418、webchat_sites:255*、members 675/782/857/985、fb_channels 142/177/280、tag_trigger_service:61、booking_callback 291/581*。
  - (g) 日曆日 → `OPERATING_TZ`：faq_service 709/710、tags:527。
  - 輸出 → `+00:00` aware：main.py 125/148/162（`datetime.now(timezone.utc).isoformat()`）；tracking_service:418 generated_at 走 `CampaignStatisticsResponse.AwareUtcDatetime` 標記。

## 🔴 原子發布前必須清零的 GATE 清單（push 前逐一勾掉，缺一就 8 小時歪）
1. **rebase `feat/tz-utc-migration` 到 origin/main**：本分支基於過時 main（b6959ad9），origin/main 已含同事 multi-OA（`4c93ccb5` channel_id、`9510aff3` 綁定組織）。push 前必須 rebase，否則帶半翻轉 + 漏同事工作。
2. **3 個 dual-touched 檔 now_utc（rebase 後在『已含 multi-OA 版本』上補）**：
   - `chatbot_service.py` 1491/1500/1516/2511/2525/3574（last_interaction_at/created_at/last_triggered_at）+ **2609 `now_dt`**（同事 tag_trigger 區塊 context 行）
   - `webchat_sites.py:255` last_seen_at
   - `booking_callback.py` 291 paid_at（DATETIME 已確認）/ 581 now_tpe（在同事 tag_trigger INSERT 區）
3. **faq_service.py:483** `now = datetime.now()` 用途待查 → 寫入則 UTC / 比較則配 (e) / 日曆則 OPERATING_TZ。
4. ✅ **(e) 子階段 4 已完成**：members 1052/1174 human_override 寫入 → `now_utc()`；line_app member_service.py:317 比較 → `utcnow()`（成對改、含 aware 正規化）；scheduler:197 → `now_utc()`；admin_retention:64 cutoff → `now_utc()`（輸出 cutoff 走 `to_utc_iso`）；schemas/message.py validate_scheduled_at_future → 改 UTC 基底比較。
5. ✅ **(h) 子階段 9 已完成**（commit 836c535b）：message_service 879-880、messages.py:354、auto_responses.py:42/396 → 補 `tz=timezone.utc` / fallback `now_utc()`。
6. ✅ **(g) 子階段 5 已完成**：chatbot_service 915/1222/2948/3177 + pms_chatbot_client:37 `ZoneInfo("Asia/Taipei")` → `OPERATING_TZ`（DRY、行為不變）；conversations_export:139 CSV + chatbot.py:152 last_synced_at 輸出 → `ensure_utc(dt).astimezone(OPERATING_TZ)`（讀 UTC→營運時區→strftime）；conversations_export:158 檔名 + 移除 TAIPEI_TZ/pytz。

## 🟡 GUARDRAIL（defer 到最後整合的補做項，因每段都在過時基底上驗）
G1. **最後 merge 後在「整合後 code」重跑完整驗證**（app.main import + 各子階段功能 + F401 比對），不只信各段在舊基底的檢查——抓 multi-OA × tz 的語意衝突。
G2. **GATE #2 寫入點用「內容」定位、不用行號**（同事 code 位移後 2609/1491… 會跑掉）：grep `now_dt = datetime.now()` / `last_interaction_at = datetime.now()` / `paid_at = ` / `now_tpe = ` / `last_seen_at = datetime.now()`。
G3. **push 前掃 migration 熱區檔在 origin/main 的 git log**，確認同事沒改到跟本遷移重疊的區段（非重疊才自動合）。
G4. **⚠️ 子階段 6 前**：`MessageList.tsx` 有同事 37 行未提交 WIP（頻道標頭重構，非時區）→ 詳見下方「子階段 6 結論」，correctness 不需動它。

## ✅ 子階段 6 已完成（精簡版，commit 見下）
**關鍵結論：display formatter 全部不用改。** 後端已送 UTC aware（`+00:00`），既有 `new Date()+toLocaleString(無 timeZone)` / `.getHours()` 就是「觀看者本地時區」、跨時區自動正確。遷移的顯示正確性是「後端送 UTC + 既有本地 formatter」達成的,formatter 本身無需改。
- **唯一改動 = 排程『送出』**：`MessageCreation.tsx` 2 處 `scheduled_at` 從 local naive 字串 → `new Date(本地).toISOString()`（UTC）。後端 parser 已接 ISO-Z、validator（子4）UTC 基底比較 → round-trip 實測正確（台北選 14:00→送 06:00Z→載回 14:00；東京送 05:00Z→載回 14:00）。排程『載入編輯』(`FlexEditorPage` `new Date().getHours()`) 已是本地 → 不用改。
- **MessageList 待補（你要的記錄）**：correctness **無待補**（它的 `formatDateTime` 已正確）。只有「把 ~11 個 formatter DRY 收斂成單一 util」這個 **cosmetic、非必要** 工作會碰到它；若日後要做,等同事的頻道標頭 WIP commit 後再碰。
- **DownloadConversationsModal 日期篩選**：用瀏覽器本地（台北營運下=正確）；海外多租戶才需改 OPERATING_TZ → 未做（YAGNI）。

## ✅ 子階段 7 已完成（CLAUDE.md 改寫）
Timezone Convention 改成「DB = UTC（naive UTC）」：連線 pin `+00:00`、寫入 `now_utc()`、輸出 `AwareUtcDatetime`/`to_utc_iso` +00:00、前端觀看者本地、營運時區用 `OPERATING_TZ`、排程輸入本地→UTC。紅線 #3 反轉：禁止寫主機/台北 naive，`utcnow()`(naive UTC) 可用。

## 🎯 核心 7 段全部完成（1✅ 2✅ 3✅ 3.5✅ 4✅ 5✅ 6✅ 7✅）
**未 push。** 剩最後整合關卡：
1. ✅ **merge origin/main 完成**（自動合、零衝突；multi-OA + 同事 commit 已帶入，my tz 保留）。
2. ✅ **GATE #2 完成 [3.5b]**：chatbot_service 7 處寫入 / webchat_sites:255 / booking_callback 291,581 → `now_utc()`（內容定位）；實證 now_utc() 回 naive UTC。
3. ✅ **GATE #3 完成**：faq_service:483 `publish_all_draft` 的 `now` → `rule.published_at` = 寫入 → `now_utc()`。
4. **GUARDRAIL G1~G4**：整合後完整重驗(進行中)、熱區掃描、MessageList 同事 WIP（已 stash，未埋進 commit）。
4. ✅ **(h) 子階段 9 已完成**（commit 836c535b，已 push main + staging 部署成功）：
   - `message_service.py:879-880` created_at/send_time → `fromtimestamp(x, tz=timezone.utc).replace(tzinfo=None)`，fallback `datetime.now()` → `now_utc()`
   - `auto_responses.py:42` epoch 分支 → `fromtimestamp(value, tz=timezone.utc).replace(tzinfo=None)`（查證：caller :396 傳 FB `create_time` = 真 UTC epoch，補 tz 正確）；`:396` fallback → `now_utc()`（補 import now_utc）
   - `messages.py:354` 輸出 → `fromtimestamp(create_time, tz=timezone.utc).isoformat()`（帶 `+00:00`）
   - 驗證：epoch 0 → `1970-01-01 00:00:00` naive UTC、輸出帶 `+00:00`，皆不看主機時區。

## ✅ 子階段 8 已完成（analytics CONVERT_TZ，commit f69de83b + c66fc86f，已 push main）
**緣由**：使用者回報「數據洞察互動時間用到 UTC」——點擊互動標籤後熱圖時段偏 8 小時（15:44 台北的點擊落到 04:00-08:00 格）。
**根因**：analytics 各日界線/時段查詢直接對 UTC 欄位用 `DATE()`/`HOUR()`，未換營運時區。
**改法**（架構要求 A：單一 `OPERATING_TZ_SQL` 常數 + `'+08:00'` offset 字串）：
- `time-slot-insights` / `time-slot-detail`：`DATE()`/`FLOOR(HOUR()/4)` 切格 + 範圍比對 + cell 4hr 視窗 → `CONVERT_TZ(triggered_at,'+00:00','+08:00')`；明細 `last_triggered_at` → `to_utc_iso()`（+00:00）。
- 每日趨勢同類一併補（避免半套）：`ai-coverage`(conversation_messages.created_at)、`completed-orders`(bookings.paid_at, DATETIME)、`new-members`(members.created_at)、「未解 top N」視窗 → 同 `CONVERT_TZ`。
- 驗證：live 端點 06-30 點擊正確落 block 3（12-16h）；cell 查詢回該 tag；`last_triggered_at` 帶 `+00:00`。
- ⚠️ 殘留（未做，YAGNI）：5 支預設視窗 `today = date.today()` 仍依主機時區；本機/staging 主機 `+08:00`=營運時區故正確，前端多帶明確 `end_date`。若部署 UTC 主機需做 operating-tz today helper。

## 📝 另案（不在本遷移範圍，已順手收）
- ✅ **`security.py:44` JWT `exp` 已修**（commit 74f5df60，已 push main + staging 部署成功）：`datetime.now()`（naive 主機本地）→ `datetime.now(timezone.utc)`。PyJWT 以 `utctimetuple()` 算 exp，naive 會被當 UTC → 非 UTC 主機 token 壽命多出主機 offset（台北 +8h，設定 60 分實測活 540 分）。改 aware UTC 後實測回 60 分。僅校正絕對基準、相對時長不變、已簽發 token 不受影響。

## 🔴 新發現的一整類 bug：`AwareUtcDatetime` 序列化器被「繞過」（sweep 已收）
**緣由**：使用者逐頁檢查，先後回報會員管理「最近聊天時間」、活動與訊息推播「發送時間」仍慢 8h。
**根因（整類）**：`AwareUtcDatetime` 的 `PlainSerializer(to_utc_iso, when_used="json")` **只有在「JSON 序列化該 typed 欄位」那刻才開火**。以下三種寫法會在那之前就把時間定型，繞過它 → 輸出裸 naive（無 `+00:00`）→ 前端 `new Date()` 當本地 → 慢 8h：
1. `.model_dump()`（python mode，非 `mode="json"`）後塞進 `SuccessResponse.data`（型別 `Any`，不會再序列化）。
2. 手組 dict 直接塞 raw datetime，或 `dt.isoformat()`／`str(dt)` 打在 naive datetime 上。
3. schema 欄位型別寫成裸 `datetime`（非 `AwareUtcDatetime`）——即使有 `response_model` 也照樣吐無標記。
**不算 bug（排除）**：端點 `response_model=<欄位是 AwareUtcDatetime 的 schema>`、回傳 Pydantic 實例（未先 dump）、`.isoformat()` 打在已 aware 的時間、date-only/time-only 欄位、只在內部用、OPERATING_TZ 給人看的字串（CSV/chatbot/verbatim label）。

**修法**：`.model_dump()` → `.model_dump(mode="json")`；raw datetime / 裸 isoformat → `to_utc_iso()`；schema 欄位 → `AwareUtcDatetime`。

**已修紀錄**：
- ✅ 會員/標籤（commit 32e3eb32）：members 列表/明細/建立/更新（`mode="json"` + `to_utc_iso`）、tags 列表/歷史（裸 isoformat→`to_utc_iso`）。
- ✅ 群發列表止血（commit 7ef43824）：`message_service.py:1065` `page_response.model_dump()`→`mode="json"`（發送/排程/建立/更新時間一次修好）。
- ✅ **全 api/v1 + services sweep（commit 17f783fe）**：4 個 triage agent 掃完，18 BROKEN 全修——auto_responses(6)、analytics(2)、admin_retention(1 cutoff)、pms_integrations(3)、consumption_records(3)、tracking_service(2)、staff `last_login_at` 型別。SUSPECT `chatbot.py:153 last_synced_at` 經查前端逐字顯示（非 `new Date`）→ 刻意台北 label，保留。
- 💡 **為何不做全域 encoder**：18 處裡 11 處已 `.isoformat()`/`strftime` 成字串（encoder 攔不到）、staff 是 typed 欄位（Pydantic 自己序列化，FastAPI encoder 也攔不到）→ 只換得 7 處卻要動全域序列化，不划算。定向修 + 這份「不算 bug」清單當日後 review 準則。

## 🔴 前端顯示層 tz bug（後端全對後才浮現的另一層，sweep 已收）
**緣由**：使用者回報 AI Chatbot → 訂房/設施 → 動作符號 → FAQ 規則「最後更新時間」仍慢 8h。**後端 faq.py 規則 `updated_at` 明明已走 `to_utc_iso`（+00:00）**——漏在前端：拿到正確 ISO 卻用**字串切割**丟掉時區。
**根因（整類，前端）**：後端送對 `+00:00` 後，前端若不用 `new Date()` 轉觀看者時區，而是：
1. 對 ISO 做 `.slice(0,16)/.slice(0,19)/.split("T")[0]/.replace("T"," ")` 拿去**顯示** → 丟掉 `+00:00`、直接印 UTC。
2. `new Date().toISOString()`（UTC）當**顯示值**（樂觀更新常見）。
3. JSX 直接插原始 ISO 字串沒過 `new Date()`。
4. `toLocaleString` 硬編 `timeZone:"Asia/Taipei"`（慣例是不指定、跟隨觀看者）。
**不算 bug**：date-only 切 `YYYY-MM-DD` 給 `<input type=date>`/比較/keys、陣列分頁 `.slice(0,N)`、`new Date(x)+toLocaleString`（無 timeZone）、`new Date(x).getHours()` 等 local getters、排程 INPUT 的 `new Date(local).toISOString()` 送後端。

**修法**：改用 `new Date(iso)+toLocaleString`（不帶 timeZone）或現成 helper `formatMemberDateTime`（utils/memberTime.ts）/ `formatChatTime`。

**sweep 結果（3 個 triage agent 掃 39 components + 9 chat-room + 12 pages + 27 utils/hooks/contexts）**：**全前端只有 PMSIntegration.tsx / FacilitiesContent.tsx 兩檔中招**，其餘全正確、無任何硬編 timeZone。
- ✅ commit de54aebe：兩檔 FAQ 規則 `rule.updated_at.slice(0,16)` → `formatMemberDateTime`。
- ✅ commit 4ea397c7：兩檔樂觀更新 `new Date().toISOString().slice(0,16)`（PMSIntegration:884、FacilitiesContent:1086/1108）→ `formatMemberDateTime`。
- 📌 **教訓**：後端 sweep 保證 API 帶 `+00:00`，但**照不到前端怎麼格式化**；顯示層要另掃「切 ISO 字串 / toISOString 當顯示 / 裸插值 / 硬編 timeZone」四種紅旗。
