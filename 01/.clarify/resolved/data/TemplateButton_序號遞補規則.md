# 釐清問題

TemplateButton 的 sequence_order 在刪除按鈕後可能出現缺號（例如 1,2,4），未定義是否需要自動遞補或重新排序。

# 定位

ERM: `spec/erm.dbml` → Table `TemplateButton`（sequence_order）  
Feature: `spec/features/message_template.feature` → 多按鈕設定與排序規則

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 刪除後自動遞補，保持從 1 開始連續 |
| B | 刪除後保留原序號，允許缺號 |
| C | 保留序號但發送時依 created_at 重新排序 |
| D | 不允許刪除，僅能覆寫內容 |
| Short | 其他 (<=5 字) |

# 影響範圍

1. TemplateButton 序號管理與資料表約束  
2. MessageTemplate.button_count 與 TemplateButton 筆數同步  
3. 前端拖曳排序／刪除按鈕體驗  
4. 發送時的按鈕顯示順序

# 優先級

Medium

理由：
- 須維持按鈕順序一致性，避免 UI 顯示錯亂  
- 刪除／新增行為常見，需明確規則以減少錯誤

---

# 解決記錄

- **回答**：選擇 A。刪除任一按鈕後，系統自動調整其餘按鈕序號，確保從 1 開始連續。
- **更新的規格檔**：`spec/erm.dbml`, `spec/features/message_template.feature`
- **變更內容**：
  1. 在 TemplateButton Note 新增「刪除與序號遞補規則」，說明刪除後自動重排、新增時依 button_count 決定下一序號。
  2. 在 message_template.feature 新增 Rule 與 Example，描述刪除按鈕後序號如何重排並更新 button_count。
- **業務影響**：
  - 前端刪除/新增按鈕時可以依規則更新 UI，不會出現缺號。
  - 後端確保 (template_id, sequence_order) 唯一性且連續，發送順序穩定。
