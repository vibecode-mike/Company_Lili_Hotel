# D001: Member 與 LineFriend 同步策略

## 問題描述
當 LineFriend 資料更新時（如頭像、名稱變更），Member 表的對應欄位何時同步更新？

## 相關規格
- ERM: `Member` 表有 `line_name`, `line_avatar_url` 欄位
- ERM: `LineFriend` 表有 `display_name`, `picture_url` 欄位
- Feature: line_friends_management.feature 提到 "Profile sync strategy (smart update)"

## 影響範圍
- 會員資料一致性
- 前端顯示邏輯
- API 回傳資料

## 選項
- [ ] A. 即時同步 - LineFriend 更新時立即同步至 Member
- [ ] B. 延遲同步 - 定時任務批次同步（如每小時）
- [ ] C. 按需同步 - 查詢會員資料時檢查並同步
- [ ] D. 不自動同步 - 僅保留各自獨立資料

## 優先級
**High** - 影響資料一致性與使用者體驗

---
# 解決記錄

- **回答**：A - 立即同步：LineFriend 有更新就立刻寫回 Member
- **更新的規格檔**：01/spec/erm.dbml
- **變更內容**：在 LineFriend 同步策略中明確要求雙向更新時立即於同一交易同步，確保 Member 與 LineFriend 的 line_name/line_avatar 始終一致
