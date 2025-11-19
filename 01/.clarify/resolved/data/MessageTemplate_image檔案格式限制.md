# 釐清問題

MessageTemplate.image_url 支援的圖片檔案格式有哪些？

# 定位

ERM：MessageTemplate 實體的 image_url 屬性
Feature：建立訊息推播 - 圖片上傳功能

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 僅支援 JPG/JPEG 格式 |
| B | 支援 JPG、PNG 兩種格式 |
| C | 支援 JPG、PNG、GIF 三種格式 |
| D | 支援 JPG、PNG、GIF、WEBP 四種格式 |
| E | 支援所有常見圖片格式（包含 BMP、TIFF 等） |
| Short | 提供其他簡短答案（<=5 字） |

# 影響範圍

影響前端圖片上傳欄位的檔案類型驗證、後端 API 檔案格式檢查、圖片處理程式庫選型、以及 LINE Messaging API 的相容性

# 優先級

High - 阻礙圖片上傳功能的實作規格定義

---

# 解決記錄

- **回答**：A - 僅支援 JPG/JPEG 格式
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：更新 MessageTemplate 實體的 image_url 屬性 Note 說明，新增「圖片格式限制：僅支援 JPG/JPEG 格式（副檔名 .jpg 或 .jpeg），驗證邏輯：前端上傳時檢查檔案 MIME type 為 image/jpeg，後端 API 驗證檔案副檔名與 Content-Type」
- **解決時間**：2025-11-14
