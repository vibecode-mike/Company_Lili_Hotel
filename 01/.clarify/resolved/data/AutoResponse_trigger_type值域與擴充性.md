# 釐清問題

AutoResponse.trigger_type 欄位的可接受值為何？是否規劃支援更多觸發類型（如加入群組、取消追蹤等）？

# 定位

ERM：spec/erm.dbml AutoResponse 表格 trigger_type 欄位（約第64行）
Feature：spec/features/auto_response.feature 三種觸發類型（約第6、20、49行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 僅支援「新好友歡迎」「關鍵字觸發」「指定時間觸發」三種固定值 |
| B | 支援上述三種 + 預留「取消追蹤」「加入群組」等擴充選項 |
| C | 使用可擴充枚舉或設定檔，未來可動態新增觸發類型 |
| Short | 其他設計（<=5字）|

# 影響範圍

影響自動回應功能設計、trigger 判斷邏輯、未來功能擴充彈性，以及 webhook 事件處理流程。

# 優先級

Medium

---
# 解決記錄

- **回答**：C - 使用可擴充枚舉或設定檔，未來可動態新增觸發類型
- **更新的規格檔**：spec/erm.dbml, spec/features/auto_response.feature
- **變更內容**：
  - erm.dbml：明確 trigger_type 欄位採用可擴充設計，初始值域包含「新好友歡迎訊息」「關鍵字觸發」「指定時間觸發」三種類型，支援透過設定檔動態管理觸發類型清單，未來可新增其他觸發類型（如取消追蹤、加入群組、特定事件等），無需修改程式碼，必填欄位
  - auto_response.feature：新增「觸發類型支援動態擴充（可透過設定檔管理）」規則，包含 4 個 Example：(1) 初始觸發類型清單（含完整描述：trigger_code, trigger_name, description）、(2) 動態新增觸發類型（無需修改程式碼或重新部署）、(3) 使用動態新增的觸發類型建立自動回應、(4) 動態新增觸發類型支援 LINE webhook 新事件
