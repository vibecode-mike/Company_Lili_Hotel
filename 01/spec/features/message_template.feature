Feature: 訊息配置與編輯
  作為一位內容管理者
  我希望透過視覺化配置區建立 LINE 訊息
  系統自動轉換為 LINE Flex Message 格式並即時預覽

  Rule: 在配置區填寫欄位後，前端自動生成 LINE Flex Message JSON（v0 版不支援手動編輯 JSON，僅透過配置區欄位修改，簡化操作並避免格式錯誤）

    Example: 配置區填寫欄位自動生成 JSON
      Given 內容管理者在配置區填寫以下欄位
        | 欄位名稱  | 欄位值           |
        | 文字內容  | 歡迎加入我們的飯店 |
        | 標題      | 春節特惠         |
      When 系統處理欄位資料
      Then 前端自動生成對應的 LINE Flex Message JSON
      And 將 JSON 儲存至 flex_message_json 欄位
      And 前端不顯示 JSON 編輯介面（使用者僅透過配置區欄位修改）

    Example: 使用者無法直接編輯 flex_message_json
      Given 內容管理者正在編輯訊息模板
      When 內容管理者查看介面
      Then 系統不提供 flex_message_json 欄位的手動編輯功能
      And 所有訊息修改皆透過配置區欄位完成


  Rule: 支援編輯文字內容（長度限制 2000 字元，平衡 LINE API 上限與閱讀體驗）

    Example: 編輯文字內容
      Given 內容管理者在配置區
      When 內容管理者輸入文字內容「歡迎加入我們的飯店」
      Then 系統記錄 text_content 為「歡迎加入我們的飯店」
      And 預覽區顯示該文字

    Example: 文字內容超過長度限制
      Given 內容管理者正在輸入文字內容
      When 內容管理者輸入超過 2000 字元的文字
      Then 前端顯示錯誤訊息「文字內容不可超過 2000 字元」
      And 系統拒絕儲存該訊息模板

  Rule: 支援上傳圖片

    Example: 上傳圖片後顯示裁切預覽工具
      Given 內容管理者在配置區
      When 內容管理者上傳圖片「room_photo.jpg」
      Then 系統顯示裁切預覽工具
      And 使用者可拖曳調整裁切位置
      And 裁切框固定為正方形（1:1 比例）

    Example: 完成圖片裁切並儲存
      Given 內容管理者已上傳圖片並調整裁切位置
      When 內容管理者確認裁切
      Then 系統裁切為正方形圖片
      And 系統儲存裁切後圖片 URL 至 image_url
      And 預覽區顯示裁切後的圖片

    Example: 圖片檔案大小驗證
      Given 內容管理者嘗試上傳圖片
      When 圖片檔案大小超過 1 MB
      Then 系統拒絕上傳，顯示錯誤訊息「圖片檔案大小不可超過 1 MB」

  Rule: 支援編輯標題

    Example: 編輯標題
      Given 內容管理者在配置區
      When 內容管理者輸入標題「豪華雙人房」
      Then 系統記錄 title 為「豪華雙人房」
      And 預覽區顯示該標題

  Rule: 支援編輯內文描述

    Example: 編輯內文描述
      Given 內容管理者在配置區
      When 內容管理者輸入內文「含早餐與免費停車」
      Then 系統記錄 description 為「含早餐與免費停車」
      And 預覽區顯示該內文

  Rule: 支援編輯金額

    Example: 編輯金額
      Given 內容管理者在配置區
      When 內容管理者輸入金額「3999」
      Then 系統記錄 amount 為 3999
      And 預覽區顯示該金額

    Example: 金額必須為整數，不允許小數
      Given 內容管理者在配置區
      When 內容管理者嘗試輸入金額「3999.50」
      Then 系統顯示驗證錯誤「金額必須為整數」
      And 拒絕輸入

    Example: 金額必須為非負數
      Given 內容管理者在配置區
      When 內容管理者嘗試輸入金額「-100」
      Then 系統顯示驗證錯誤「金額必須大於或等於 0」
      And 拒絕輸入

  Rule: 支援新增按鈕

    Example: 新增按鈕並設定文字
      Given 內容管理者在配置區
      When 內容管理者新增按鈕，按鈕文字為「立即預訂」
      Then 系統記錄 button_text 為「立即預訂」
      And 系統記錄 button_count 增加 1
      And 預覽區顯示該按鈕

    Example: 設定按鈕互動類型預設為開啟網址
      Given 內容管理者已新增按鈕「立即預訂」
      When 預設互動類型「開啟網址」
      And 輸入 URL「https://example.com/book」
      Then 系統記錄 action_type 為「開啟網址」
      And 系統記錄 action_url 為「https://example.com/book」

  Rule: 支援設定互動標籤（用於數據追蹤）

    Example: 設定單一按鈕單一互動標籤
      Given 內容管理者標籤配置區
      When 內容管理者在按鈕一輸入互動標籤「春節促銷」
      Then 系統記錄按鈕一 interaction_tag 為「春節促銷」

    Example: 設定單ㄧ按鈕多個互動標籤
      Given 內容管理者標籤配置區
      When 內容管理者在按鈕一輸入互動標籤「雙十,檔期優惠」
      Then 系統記錄按鈕一 interaction_tag 為「雙十,檔期優惠」

    Example: 設定多個按鈕多個互動標籤
      Given 內容管理者在標籤配置區
      When 內容管理者輸入按鈕一互動標籤「雙十」
      And 內容管理者輸入按鈕二互動標籤「檔期優惠」
      Then 系統記錄按鈕一 interaction_tag 為「雙十」
      And 系統記錄按鈕二 interaction_tag 為「檔期優惠」


  Rule: 支援設定通知訊息

    Example: 設定通知訊息
      Given 內容管理者在配置區
      When 內容管理者輸入通知訊息「您有新的優惠訊息」
      Then 系統記錄 notification_message 為「您有新的優惠訊息」
    Example: 通知訊息為必填欄位
      Given 內容管理者未輸入通知訊息
      When 內容管理者嘗試儲存模板或發送訊息
      Then 系統顯示驗證錯誤「請輸入通知訊息」
      And 拒絕儲存或發送

  Rule: 支援設定訊息預覽

    Example: 設定訊息預覽
      Given 內容管理者在配置區
      When 內容管理者輸入訊息預覽「春節特惠活動開跑」
      Then 系統記錄 preview_message 為「春節特惠活動開跑」
    Example: 訊息預覽為必填欄位
      Given 內容管理者未輸入訊息預覽
      When 內容管理者嘗試儲存模板或發送訊息
      Then 系統顯示驗證錯誤「請輸入訊息預覽」
      And 拒絕儲存或發送

  Rule: 支援輪播圖卡（2-9 張）

    Example: 設定輪播圖卡數量
      Given 內容管理者在配置區
      When 內容管理者設定輪播圖卡數量為 3
      Then 系統記錄 carousel_count 為 3
      And 預覽區顯示 3 張輪播圖卡

    Example: 輪播圖卡數量驗證（至少 2 張）
      Given 內容管理者在配置區
      When 內容管理者嘗試設定輪播圖卡數量為 1
      Then 系統顯示驗證錯誤「輪播圖卡數量至少 2 張」
      And 拒絕設定

    Example: 輪播圖卡數量驗證（最多 9 張）
      Given 內容管理者在配置區
      When 內容管理者嘗試設定輪播圖卡數量為 10
      Then 系統顯示驗證錯誤「輪播圖卡數量最多 9 張」
      And 拒絕設定

    Example: 單張圖片不使用輪播功能
      Given 內容管理者在配置區上傳 1 張圖片
      When 系統處理訊息
      Then 系統不啟用輪播功能
      And carousel_count 欄位為 NULL 或 0

  Rule: 刪除輪播圖卡後序號自動遞補，保持連續

    Example: 刪除輪播圖卡後序號自動遞補
      Given 內容管理者已建立輪播訊息，包含以下圖卡
        | 序號 | 圖片名稱    |
        | 1    | card1.jpg   |
        | 2    | card2.jpg   |
        | 3    | card3.jpg   |
        | 4    | card4.jpg   |
        | 5    | card5.jpg   |
      When 內容管理者刪除序號 3 的圖卡「card3.jpg」
      Then 系統自動調整剩餘圖卡序號
      And 輪播圖卡順序更新為
        | 序號 | 圖片名稱    |
        | 1    | card1.jpg   |
        | 2    | card2.jpg   |
        | 3    | card4.jpg   |
        | 4    | card5.jpg   |
      And carousel_count 更新為 4

    Example: 刪除第一張圖卡後序號遞補
      Given 內容管理者已建立輪播訊息，包含 3 張圖卡
        | 序號 | 圖片名稱    |
        | 1    | first.jpg   |
        | 2    | second.jpg  |
        | 3    | third.jpg   |
      When 內容管理者刪除序號 1 的圖卡「first.jpg」
      Then 輪播圖卡順序更新為
        | 序號 | 圖片名稱    |
        | 1    | second.jpg  |
        | 2    | third.jpg   |
      And carousel_count 更新為 2

  Rule: 前端自動生成 LINE Flex Message JSON（v0 版不支援手動編輯 JSON，僅透過配置區修改）

    Example: 填寫完成後前端自動生成 JSON
      Given 內容管理者已填寫以下欄位
        | 欄位名稱  | 欄位值           |
        | 文字內容  | 歡迎加入我們的飯店 |
        | 標題      | 春節特惠         |
        | 圖片      | promo.jpg        |
        | 按鈕文字  | 立即預訂         |
      When 內容管理者送出儲存請求
      Then 前端根據欄位資料自動生成 LINE Flex Message JSON
      And 將 JSON 儲存至 flex_message_json 欄位
      And JSON 符合 LINE Flex Message 官方格式規範

    Example: 前端負責 JSON 生成，後端負責驗證
      Given 內容管理者在配置區填寫欄位
      When 系統處理訊息
      Then 前端負責欄位輸入、即時預覽與 JSON 生成
      And 後端負責 JSON 格式驗證與儲存
      And v0 版不提供 JSON 手動編輯功能（使用者僅透過配置區修改）

  Rule: 儲存訊息模板

    Example: 儲存訊息模板
      Given 內容管理者已完成配置區欄位填寫
      When 內容管理者點擊儲存
      Then 系統建立 MessageTemplate 記錄
      And 儲存所有欄位資料（text_content, image_url, title 等）
      And 儲存前端生成的 flex_message_json

  Rule: 按鈕互動類型固定為「開啟網址」

    Example: 按鈕默認開啟網址互動
      Given 內容管理者在訊息模板中加入按鈕
      When 系統處理按鈕配置
      Then 按鈕互動類型固定為「開啟網址」
      And 不需要選擇互動類型

  Rule: 儲存草稿時允許按鈕 URL 未填（草稿容錯）

    Example: 儲存草稿時有按鈕但 URL 未填
      Given 內容管理者已加入按鈕「立即預訂」
      And 尚未輸入 URL 網址
      When 內容管理者點擊「儲存為草稿」
      Then 系統允許儲存草稿
      And 系統記錄 action_url 為 NULL

  Rule: 發送訊息前嚴格驗證按鈕 URL

    Example: 發送訊息時有按鈕但 URL 未填
      Given 內容管理者已加入按鈕「立即預訂」
      And action_url 為 NULL
      When 內容管理者點擊「發送訊息」
      Then 系統阻擋發送
      And 系統顯示錯誤訊息「按鈕 URL 網址未填寫」

    Example: 發送訊息時按鈕 URL 已填寫
      Given 內容管理者已加入按鈕「立即預訂」
      And action_url 已填寫為「https://example.com/book」
      When 內容管理者點擊「發送訊息」
      Then 系統允許發送訊息

    Example: 發送訊息時無按鈕則不驗證 URL
      Given 內容管理者未加入按鈕
      And action_url 為 NULL
      When 內容管理者點擊「發送訊息」
      Then 系統允許發送訊息

  Rule: 按鈕刪除後序號自動遞補

    Example: 刪除按鈕後序號重排
      Given 模板中存在以下按鈕
        | 序號 | 文字       |
        | 1    | 了解更多   |
        | 2    | 立即預約   |
        | 3    | 加入會員   |
      When 使用者刪除序號 2 的按鈕「立即預約」
      Then 系統自動將剩餘按鈕序號調整為
        | 序號 | 文字       |
        | 1    | 了解更多   |
        | 2    | 加入會員   |
      And button_count 更新為 2
