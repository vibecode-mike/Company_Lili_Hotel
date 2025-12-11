# 釐清問題

SurveyResponse.answers 欄位的 JSON Schema 為何？

# 定位

ERM：SurveyResponse 實體的 answers 欄位（JSON 格式）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 簡單 key-value：`{"question_id": "answer_value"}` |
| B | 結構化答案：`{"question_id": {"type": "...", "value": "...", "timestamp": "..."}}` |
| C | 陣列格式：`[{"question_id": "...", "answer": "..."}]` |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- SurveyResponse 資料儲存格式
- 前端問卷填答邏輯
- 後端資料驗證與解析
- 會員資料自動更新邏輯（NAME、PHONE 等題型）

# 優先級

Medium
- Medium：影響問卷系統的資料結構設計

---
# 解決記錄

- **回答**：A - 簡單 key-value：{"question_id": "answer_value"}
- **更新的規格檔**：01/spec/erm.dbml
- **變更內容**：確認沿用 ERM 既有格式（key-value），無需增加複雜結構
