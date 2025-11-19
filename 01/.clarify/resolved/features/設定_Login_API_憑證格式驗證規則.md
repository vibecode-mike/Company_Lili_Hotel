# 釐清問題

Channel ID 與 Channel Secret 的「格式正確」具體驗證規則為何？長度、字元類型、格式模式？

# 定位

Feature：spec/features/設定_Login_API.feature Rule 關於格式驗證（約第6-24行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | Channel ID：10位數字；Channel Secret：32位英數字 |
| B | 使用正則表達式驗證，具體格式請參考 LINE 官方文件 |
| C | 僅驗證非空與長度限制，實際正確性由 LINE API 驗證 |
| Short | 請提供格式（<=5字）|

# 影響範圍

影響前端表單驗證、錯誤提示明確性、使用者體驗、API 呼叫成功率，以及設定流程順暢度。

# 優先級

Low
