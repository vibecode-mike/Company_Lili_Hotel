# 釐清問題

問卷填答後會員資料自動更新的觸發時機與覆蓋邏輯為何？

# 定位

Feature：問卷系統（Survey）
ERM：Survey、SurveyQuestion、SurveyResponse、Member

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 即時覆蓋 - 填答完成後立即更新 Member 對應欄位，覆蓋既有值 |
| B | 空值補填 - 僅當 Member 對應欄位為空時才更新 |
| C | 確認後更新 - 彈窗詢問會員是否以新資料更新個人檔案 |
| D | 獨立儲存 - 問卷答案僅存於 SurveyResponse，不自動更新 Member |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- SurveyResponse 與 Member 的關聯邏輯
- 會員資料完整性
- 資料覆蓋風險（新答案覆蓋正確舊資料）

# 優先級

High
- High：影響問卷系統與會員管理的核心整合邏輯

---
# 解決記錄

- **回答**：A - 即時覆蓋（新值覆蓋既有值，空白不覆蓋）
- **更新的規格檔**：01/spec/features/member_management.feature
- **變更內容**：新增問卷填答完成後即時覆蓋會員資料的規則與示例；同時定義空白欄位不覆蓋既有值、僅補空欄位
