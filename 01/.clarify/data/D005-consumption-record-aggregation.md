# D005: ConsumptionRecord 聚合粒度

## 問題描述
ERM 定義 `ConsumptionRecord` 儲存消費紀錄，但未說明是否需要預計算聚合欄位（如累計消費金額）。

## 相關規格
- ERM: `ConsumptionRecord` 表
- Feature: member_tag_integration.feature - 消費金額門檻自動貼標

## 影響範圍
- 標籤規則觸發效能
- 報表查詢效能
- 資料一致性

## 選項
- [ ] A. 即時計算 - 每次查詢時計算聚合值
- [ ] B. 預計算欄位 - 在 Member 表增加 total_consumption 欄位並維護
- [ ] C. 物化視圖 - 使用資料庫物化視圖預計算
- [ ] D. 快取策略 - Redis 快取聚合結果，定期更新

## 優先級
**Medium** - 影響標籤自動貼標效能

---

## 處理狀態

- 狀態：Deferred
- 備註：使用者要求先跳過，後續再釐清聚合策略與累積範圍（今年/近 12 個月/不限）
