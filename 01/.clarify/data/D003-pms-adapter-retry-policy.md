# D003: PMS 整合重試策略參數

## 問題描述
pms_integration.feature 提到 "Retry policy with exponential backoff"，但未定義具體參數。

## 相關規格
- ERM: `PMS_Integration` 表 - `config_json` 欄位
- Feature: pms_integration.feature - Adapter Pattern

## 需要確認的參數
1. 初始重試間隔（秒）
2. 最大重試次數
3. 最大等待時間（秒）
4. 退避係數（multiplier）
5. 失敗後的通知機制

## 影響範圍
- 外部系統整合穩定性
- 錯誤處理流程
- 監控告警

## 選項
- [ ] A. 保守策略 - 初始 1s, 最大 3 次, 係數 2
- [ ] B. 標準策略 - 初始 2s, 最大 5 次, 係數 2
- [ ] C. 積極策略 - 初始 1s, 最大 10 次, 係數 1.5
- [ ] D. 自訂策略 - 由 config_json 中配置，各 PMS 可不同

## 優先級
**Medium** - 影響外部系統整合穩定性
