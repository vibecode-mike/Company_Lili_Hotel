# 釐清問題

MessageTemplate 表的 notification_message 與 preview_message 欄位目前僅標示為選填文字，實際用途與顯示位置不明，無法判斷是否需要驗證或顯示。

# 定位

ERM：spec/erm.dbml → Table MessageTemplate → 欄位 notification_message / preview_message  
Feature：spec/features/message_template.feature → Rule「支援設定通知訊息」「支援設定訊息預覽」

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 通知訊息顯示在 LINE 推播通知橫幅（粉絲看到的第一行），訊息預覽顯示在後台訊息列表給營運人員 |
| B | 通知訊息為內部管理提醒，訊息預覽為粉絲聊天摘要 |
| C | 通知訊息用於系統 Email，訊息預覽僅出現在 API payload |
| D | 兩者目前僅為備註欄位，系統未使用 |
| Short | 其他 (<=5 字) |

# 影響範圍

1. MessageTemplate 欄位定義與必填驗證  
2. message_template.feature 規則與錯誤處理範例  
3. 發送流程需確認是否需傳遞兩段文字給 LINE 推播 API

# 優先級

Medium

理由：
- 欄位用途需明確才能決定必填與驗證策略
- 與前端輸入欄位、後端 API payload 直接相關

---

# 解決記錄

- **回答**：通知訊息與訊息預覽皆為必填，兩者內容都會跟隨 LINE 推播送給粉絲在手機端顯示；系統僅負責儲存並於發送時傳給 LINE，不需額外處理。
- **更新的規格檔**：`spec/erm.dbml`, `spec/features/message_template.feature`
- **變更內容**：
  1. 將 notification_message、preview_message 欄位 note 改為必填，並在 MessageTemplate Note 補充其傳遞給 LINE 的用途。
  2. 在 message_template.feature 新增兩個驗證範例，規定缺少任一欄位時不得儲存或發送。
- **業務影響**：
  - 前端必須提供兩段文字，後端得實作必填驗證，確保 LINE 推播顯示正確。
  - 系統流程簡化為「儲存 → 發送時帶入」，不需設計額外顯示或備註邏輯。
