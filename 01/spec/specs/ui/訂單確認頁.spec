# 訂單確認頁（聊天視窗 inline 確認卡）

; ✓ 聊天視窗 inline（選項 A）：reply_type=booking_confirm 在聊天氣泡內呈現，無需獨立頁面或路由

## 描述
民眾點擊「立即預訂」前看到的最後確認畫面，匯總已選房型、入住資訊與會員資料。

## 顯示內容
- 已選房型清單（selected_rooms[]，含房型名稱、間數）
- 入住日期 / 退房日期
- 總人數
- 會員姓名、電話、Email
- 「立即預訂」按鈕（跳轉至 PMS cart URL）
- 按鈕下方小字：「房價與房況以跳轉後之訂房系統顯示為準」

## 關鍵屬性
- reply_type = "booking_confirm"
- 資料來源：session booking_context + selected_rooms + member profile
