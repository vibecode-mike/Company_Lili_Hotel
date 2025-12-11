# F009: 排程訊息時區顯示

## 問題描述
create_broadcast.feature 提到 UTC 時間轉換，但未說明前端時區顯示策略。

## 相關規格
- Feature: create_broadcast.feature - Scheduling with UTC time conversion
- ERM: `Message` 表 - `scheduled_datetime_utc` 欄位
- Feature: message_analytics.feature - 傳送時間顯示

## 影響範圍
- 排程設定準確性
- 跨時區使用者體驗
- 資料儲存一致性

## 選項
- [ ] A. 固定台灣時區 - 前端一律以 UTC+8 顯示
- [ ] B. 瀏覽器時區 - 依使用者瀏覽器時區顯示
- [ ] C. 可選時區 - 增加時區選擇器
- [ ] D. 雙顯示 - 同時顯示本地時間與 UTC 時間

## 優先級
**Low** - 影響跨時區使用，台灣本地使用影響較小

---
# 解決記錄

- **回答**：A - 固定台灣時區（UTC+8），不依瀏覽器時區
- **更新的規格檔**：01/spec/features/create_broadcast.feature
- **變更內容**：強化排程時間顯示規則：UI 固定以台灣時間 UTC+8 顯示並轉換；後端以 UTC 儲存；管理員在其他時區時亦不自動轉換顯示，新增示例說明
