# 基本設定（Basic Settings）

## 目的
支援各飯店專案使用 LINE 官方帳號進行 API 串接，串接後可使用功能包含推播訊息（Push Message）、自動回覆訊息（Reply Message）、讀取用戶資料（Member Profile）、回傳互動標籤（Webhook）等。

## 核心功能
| 功能 | 描述 |
|------|------|
| 1. 登入登出 | 能夠登入帳號密碼，且能夠登出 |
| 2. 卡控流程 | 在尚未設定任何串接之前，無法使用系統任一功能，給予 Toast 提示 |
| 3. Setting LINE OA | 於 Messaging API 輸入 Channel ID, Channel Secret, Channel access token 並完成驗證 |
| 4. Setting Login | 於 Login 輸入 Channel ID, Channel Secret 並完成驗證 |

## Stories
| 編號 | 名稱 | Story |
|------|------|-------|
| S_BS_001 | 登入登出 | 作為一位管理員，我希望登入後台系統以便開始服務。 |
| S_BS_002 | 卡控流程 | 作為一位系統服務商，我希望客戶在未付款前無法使用此系統任一功能，以便維護服務權益。 |
| S_BS_003 | Setting Messaging API | 作為一位 Admin，我希望在後台綁定品牌官方帳號，完成 LINE OA 串接後，以便啟用訊息與會員功能。 |
| S_BS_004 | Setting Login | 作為一位 Admin，我希望盡可能蒐集完整的會員資料，以便 LINE Login 授權才可與既有的會員資料整併。 |

## AC（Acceptance Criteria）

### Story: S_BS_001+002 登入登出、卡控流程
1. 帳號登入採「信箱」作為識別帳號。
2. 帳號、密碼支援英文、數字、特殊符號組成。
3. 使用者完成登入後，須檢查該帳號的 LINE 官方帳號OA設定狀態，用以判斷登入成功後頁面顯示內容。
4. 登入成功後，若該帳號已設定 LINE OA基本設定，則導向系統首頁，顯示文字提示：「登入成功」。
5. 登入成功後，若該帳號尚未設定 LINE OA基本設定，則導向系統首頁基本設定頁面。
6. 須檢查該帳號的 LINE OA 權限，尚未完成 LINE OA基本設定時，點選其他功能模組頁面，則系統顯示文字提示「請先完成基本設定，才可使用功能模組」。
7. 登入失敗時，停留於登入畫面，顯示錯誤訊息「帳號或密碼錯誤，請重新確認」。
8. 支援快速登入：Google、LINE 兩種方式。
9. 快速登入時，驗證此信箱已獲得可使用系統授權，則導向基本設定頁面。
10. 快速登入時，驗證此信箱尚未獲得系統授權，顯示錯誤訊息「此信箱尚未註冊」。
11. 帳號於授權有效期內可支援不同裝置登入同一帳號使用。
12. 帳號登入後 24HR內保持自動登入，於當日零時00:00自動登出。
13. v0.3 於授權到期前 7 日內，每次重新登入給予彈窗提示「授權即將到期」，期限使用至 yyyy/mm/dd 須展延授權才能繼續使用，按鈕「聯絡我們」點擊後帶入公司聯絡信箱。

### Story: S_BS_003+004 Setting Messaging API, Setting Login
1. 須輸入憑證（Channel ID, Channel Secret, Channel access token）共三項，並完成 LINE 原生後台的設定，於系統「勾選」我已完成，並點擊按鈕「建立攔截」完成官方帳號綁定。
2. 若其一欄位判斷有誤，對應欄位 Channel ID, Channel Secret, Channel access token，顯示錯誤訊息「格式錯誤，請重新確認」。
3. Channel ID, Channel Secret, Channel access token 欄位支援英文、數字、特殊符號。
4. 須確認 LINE 原生後台與 Developer 開啟對應 webhook 服務，若無則顯示錯誤訊息「請確認 LINE Official Account 設定已開啟」。
5. 系統向 LINE 驗證成功，則顯示文字提示「連結成功」。
6. 須檢查該帳號的 LINE OA 權限，尚未綁定 LINE 時，點選其他功能模組頁面，則系統顯示文字提示「請先設定官方帳號，才可使用功能模組」。
7. 當 LINE OA 綁定成功，e.g. 顯示 LINE 帳號 ID [@262qaash]。
8. 點擊按鈕「重新設定」，二次彈窗提示「確認是否要重新設定？」，若確認解除則導向基本設定頁。小字：[確定要解除與 @LINE 的連結嗎？解除後需要重新設定所有資料。]