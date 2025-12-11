# F002: 自動回應優先順序衝突處理

## 問題描述
auto_response.feature 定義優先順序為「keyword > scheduled time > welcome」，但未說明同一優先級內多筆規則命中時的處理邏輯。

## 相關規格
- Feature: auto_response.feature - Priority order
- ERM: `AutoResponse`, `AutoResponseKeyword`, `AutoResponseMessage`

## 情境範例
- 會員發送「優惠」，同時命中兩個關鍵字規則
- 當前時間同時落在兩個排程時間範圍內

## 影響範圍
- 自動回應準確性
- 使用者體驗
- 規則管理複雜度

## 選項
- [ ] A. 最早建立 - 使用最早建立的規則
- [ ] B. 最新更新 - 使用最後更新的規則
- [ ] C. 顯式優先級 - 增加 priority 欄位讓管理員設定
- [ ] D. 全部觸發 - 所有命中規則都發送（限制最大數量）

## 優先級
**High** - 影響核心自動回應功能

---
# 解決記錄

- **回答**：B - 最新更新優先；且僅關鍵字觸發會有同層級衝突
- **更新的規格檔**：01/spec/features/auto_response.feature
- **變更內容**：
  - 同層級排序改為 updated_at DESC（最新更新的關鍵字規則優先）
  - 補充示例：多個關鍵字同時命中時，僅回覆 updated_at 最新的一筆；時間觸發不與關鍵字併發
