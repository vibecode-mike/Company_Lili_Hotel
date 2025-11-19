# 釐清問題

標籤來源（tag_source）在不同地方使用不一致的值，如「CRM / PMS / 問券 / 後台自訂」vs「Interaction」等

# 定位

ERM: MemberTag 表 → tag_source string(20) [note: '標籤來源：CRM / PMS / 問券 / 後台自訂']
與 InteractionTag、ComponentInteractionLog 等表的來源定義不一致

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 統一使用英文值（CRM, PMS, Survey, Manual, Interaction）確保資料庫一致性 |
| B | 資料庫使用英文值，前端顯示時翻譯為中文（CRM→CRM、Survey→問券） |
| C | 建立標籤來源對照表（Enum 或設定檔）統一管理所有可能的來源值 |
| D | tag_source 允許動態擴充，但需維護標準值清單與驗證規則 |
| Short | 提供其他簡短答案(<=5 字) |

# 影響範圍

影響範圍：
1. MemberTag 表的 tag_source 欄位值域定義
2. 所有建立標籤的 API 需統一來源值
3. 前端顯示需統一翻譯邏輯
4. 資料庫遷移腳本（若需修改現有資料）

# 優先級

Medium

理由：
- 資料一致性：來源值不一致會導致查詢與統計錯誤
- 可維護性：統一值域便於後續擴充與管理
- 國際化支援：英文值更適合作為資料庫儲存格式
