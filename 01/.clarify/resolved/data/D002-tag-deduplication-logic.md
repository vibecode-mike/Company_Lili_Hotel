# D002: 會員標籤與互動標籤去重邏輯

## 問題描述
MemberTag 與 InteractionTag 是否允許同名標籤存在？若會員同時擁有兩個來源的同名標籤，如何處理？

## 相關規格
- ERM: `MemberTag` 表 - 會員標籤定義
- ERM: `InteractionTag` 表 - 互動標籤定義
- ERM: `MemberInteractionTag` 關聯表
- Feature: member_tag_management.feature, interaction_tag_setup.feature

## 影響範圍
- 標籤篩選邏輯
- 標籤統計分析
- 前端顯示

## 選項
- [ ] A. 全局唯一 - MemberTag 與 InteractionTag 名稱不可重複
- [ ] B. 各自唯一 - 兩種標籤可同名，前端以類型區分
- [ ] C. 合併顯示 - 同名標籤合併為一個，來源顯示多個
- [ ] D. 命名前綴 - 系統自動為不同來源標籤加前綴

## 優先級
**Medium** - 影響標籤管理與篩選功能

---
# 解決記錄

- **回答**：B - 類型區分；MemberTag 與 InteractionTag 可同名，顯示/統計按 tag_name 去重合併來源
- **更新的規格檔**：01/spec/erm.dbml
- **變更內容**：移除全域唯一限制，明確同名允許；會員詳情與查詢邏輯按 tag_name 去重並合併來源，前端以標籤類型樣式區分
