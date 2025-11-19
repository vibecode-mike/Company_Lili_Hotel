# 釐清問題

LineFriend 表與 Member 表採用「雙表獨立維護設計」，兩表的 LINE Profile 資訊（line_display_name, line_picture_url, line_avatar, line_name）不互相同步。當 LINE 用戶更新個人資料時，應如何維護兩表資料的一致性？是否允許兩表出現不一致的情況？

# 定位

ERM：LineFriend 實體（line_display_name, line_picture_url）與 Member 實體（line_avatar, line_name）
檢查項：A4. 跨屬性不變條件

相關說明（erm.dbml line 94-98）：
```
與 Member 表的關係（雙表獨立維護設計）：
  - 僅加好友未填問卷：LineFriend 有記錄，Member 無記錄，LineFriend.member_id = NULL
  - 填寫問卷成為會員：建立 Member 記錄，LineFriend.member_id 關聯至 Member.member_id
  - 非 LINE 會員（CRM/PMS 來源）：Member 有記錄，LineFriend 無記錄
  - 兩表資料獨立維護，不互相同步 LINE profile 資訊
```

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 獨立維護無同步：兩表完全獨立更新 LINE Profile，允許資料不一致（LineFriend.line_display_name 可能與 Member.line_name 不同） |
| B | 單向同步：LineFriend 為主要資料來源，定期同步更新 Member 的 LINE Profile 欄位（line_avatar, line_name），確保 Member 資料為最新 |
| C | 雙向同步：Member 與 LineFriend 互相同步 LINE Profile，任一方更新時觸發同步機制，保持兩表資料一致 |
| D | 按需同步：僅在會員登入或特定操作時（如查看個人資料頁），即時從 LineFriend 同步最新 LINE Profile 至 Member，平時允許不一致 |
| Short | 提供其他簡短答案（<=5 字） |

註：同步策略將影響資料一致性保證、系統複雜度與 API 調用成本。

# 影響範圍

- **LineFriend 表**：Profile 更新邏輯（line_display_name, line_picture_url），智能更新策略的同步觸發條件
- **Member 表**：LINE Profile 欄位（line_avatar, line_name）的更新時機與資料來源
- **Profile 同步邏輯**：
  - LineFriend 的智能更新策略（距離上次更新超過 N 天才重新呼叫 API）
  - Member 的資料更新時機（問卷填寫時、登入時、定期同步）
- **資料一致性保證**：前端顯示時應使用哪個表的資料作為權威來源（LineFriend 或 Member）
- **API 調用成本**：同步頻率與 LINE Profile API 調用次數的平衡

影響功能：
- 會員管理介面：顯示會員頭像與名稱時，資料來源選擇（LineFriend 或 Member）
- 聊天室介面：顯示 LINE 好友資訊時，資料來源選擇
- 群發訊息：目標對象篩選時，顯示會員資訊的資料來源

# 優先級

**High**（影響資料一致性與前端顯示邏輯）

理由：
1. 資料一致性風險：兩表維護不同版本的 LINE Profile，可能導致前端顯示混亂
2. 業務邏輯不明確：缺少明確的資料權威來源定義，開發人員無法判斷應使用哪個表的資料
3. API 成本影響：同步策略直接影響 LINE Profile API 的調用頻率與成本
4. 用戶體驗：資料不一致可能導致用戶看到過時的個人資訊（如舊頭像、舊名稱）

建議行動：明確定義同步策略（建議「按需同步」或「單向同步」），並在 ERM 註記中補充同步邏輯與觸發時機。
