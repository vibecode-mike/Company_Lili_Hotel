Feature: 訊息配置與編輯
  作為一位內容管理者
  我希望透過視覺化配置區建立 LINE 訊息
  系統自動轉換為 LINE Flex Message 格式並即時預覽

  Rule: 在配置區填寫欄位後，系統自動生成 LINE Flex Message JSON

    Example: 配置區填寫欄位自動生成 JSON
      Given 內容管理者在配置區填寫以下欄位
        | 欄位名稱  | 欄位值           |
        | 文字內容  | 歡迎加入我們的飯店 |
        | 標題      | 春節特惠         |
      When 系統處理欄位資料
      Then 系統自動生成對應的 LINE Flex Message JSON
      And 將 JSON 儲存至 flex_message_json 欄位

  Rule: 支援即時預覽功能

    Example: 配置區即時預覽
      Given 內容管理者正在配置區填寫欄位
      When 內容管理者輸入文字「歡迎加入我們的飯店」
      Then 預覽區即時渲染訊息外觀
      And 顯示 LINE 訊息的實際呈現效果

  Rule: 支援編輯文字內容

    Example: 編輯文字內容
      Given 內容管理者在配置區
      When 內容管理者輸入文字內容「歡迎加入我們的飯店」
      Then 系統記錄 text_content 為「歡迎加入我們的飯店」
      And 預覽區顯示該文字

  Rule: 支援上傳圖片

    Example: 上傳並設定圖片
      Given 內容管理者在配置區
      When 內容管理者上傳圖片「room_photo.jpg」
      Then 系統記錄 image_url 為「room_photo.jpg」
      And 預覽區顯示該圖片

    Example: 圖片自動裁切為 1:1 比例
      Given 內容管理者上傳圖片「wide_photo.jpg」（非 1:1 比例）
      When 系統處理圖片
      Then 後端自動裁切為正方形（取中心區域）
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

    Example: 設定按鈕互動類型為開啟網址
      Given 內容管理者已新增按鈕「立即預訂」
      When 內容管理者選擇互動類型「開啟網址」
      And 輸入 URL「https://example.com/book」
      Then 系統記錄 action_type 為「開啟網址」
      And 系統記錄 action_url 為「https://example.com/book」

    Example: 設定按鈕互動類型為觸發文字
      Given 內容管理者已新增按鈕「聯絡客服」
      When 內容管理者選擇互動類型「觸發文字」
      And 輸入觸發文字「我要預訂房間」
      Then 系統記錄 action_type 為「觸發文字」
      And 系統記錄 action_text 為「我要預訂房間」

    Example: 設定按鈕互動類型為觸發圖片
      Given 內容管理者已新增按鈕「查看位置圖」
      When 內容管理者選擇互動類型「觸發圖片」
      And 上傳圖片「location_map.jpg」
      Then 系統記錄 action_type 為「觸發圖片」
      And 系統記錄 action_image 為「location_map.jpg」

  Rule: 支援設定互動標籤（用於數據追蹤）

    Example: 設定單一互動標籤
      Given 內容管理者在配置區
      When 內容管理者輸入互動標籤「春節促銷」
      Then 系統記錄 interaction_tag 為「春節促銷」

    Example: 設定多個互動標籤
      Given 內容管理者在配置區
      When 內容管理者輸入互動標籤「雙十,檔期優惠」
      Then 系統記錄 interaction_tag 為「雙十,檔期優惠」

    Example: 設定標籤觸發模式為全部觸發
      Given 內容管理者已設定多個互動標籤「雙十,檔期優惠」
      When 內容管理者選擇標籤觸發模式「全部觸發」
      Then 系統記錄 tag_trigger_mode 為「全部觸發」
      And 會員點擊時，所有標籤都記錄並累加 trigger_count

    Example: 設定標籤觸發模式為僅主標籤
      Given 內容管理者已設定多個互動標籤「雙十,檔期優惠」
      When 內容管理者選擇標籤觸發模式「僅主標籤」
      Then 系統記錄 tag_trigger_mode 為「僅主標籤」
      And 會員點擊時，只記錄第一個標籤「雙十」

  Rule: 支援設定通知訊息

    Example: 設定通知訊息
      Given 內容管理者在配置區
      When 內容管理者輸入通知訊息「您有新的優惠訊息」
      Then 系統記錄 notification_message 為「您有新的優惠訊息」

  Rule: 支援設定訊息預覽

    Example: 設定訊息預覽
      Given 內容管理者在配置區
      When 內容管理者輸入訊息預覽「春節特惠活動開跑」
      Then 系統記錄 preview_message 為「春節特惠活動開跑」

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

  Rule: 後端自動生成 LINE Flex Message JSON

    Example: 填寫完成後自動生成 JSON
      Given 內容管理者已填寫以下欄位
        | 欄位名稱  | 欄位值           |
        | 文字內容  | 歡迎加入我們的飯店 |
        | 標題      | 春節特惠         |
        | 圖片      | promo.jpg        |
        | 按鈕文字  | 立即預訂         |
      When 內容管理者送出儲存請求
      Then 後端根據欄位資料自動生成 LINE Flex Message JSON
      And 將 JSON 儲存至 flex_message_json 欄位
      And JSON 符合 LINE Flex Message 官方格式規範

    Example: 前端不需處理 JSON 編輯
      Given 內容管理者在配置區填寫欄位
      When 系統處理訊息
      Then 前端僅負責欄位輸入與即時預覽
      And 後端負責 JSON 生成與驗證
      And flex_message_json 欄位對前端透明

  Rule: 儲存訊息模板

    Example: 儲存訊息模板
      Given 內容管理者已完成配置區欄位填寫
      When 內容管理者點擊儲存
      Then 系統建立 MessageTemplate 記錄
      And 儲存所有欄位資料（text_content, image_url, title 等）
      And 儲存後端生成的 flex_message_json

  Rule: 儲存草稿時允許 action_type 已設定但對應欄位未填（草稿容錯）

    Example: 儲存草稿時 action_type 為「開啟網址」但 action_url 未填
      Given 內容管理者已設定按鈕互動類型為「開啟網址」
      And 尚未輸入 URL 網址
      When 內容管理者點擊「儲存為草稿」
      Then 系統允許儲存草稿
      And 系統記錄 action_type 為「開啟網址」
      And 系統記錄 action_url 為 NULL

    Example: 儲存草稿時 action_type 為「觸發文字」但 action_text 未填
      Given 內容管理者已設定按鈕互動類型為「觸發文字」
      And 尚未輸入觸發文字
      When 內容管理者點擊「儲存為草稿」
      Then 系統允許儲存草稿
      And 系統記錄 action_type 為「觸發文字」
      And 系統記錄 action_text 為 NULL

  Rule: 發送訊息前嚴格驗證 action_type 與對應欄位

    Example: 發送訊息時 action_type 為「開啟網址」但 action_url 未填
      Given 內容管理者已設定按鈕互動類型為「開啟網址」
      And action_url 為 NULL
      When 內容管理者點擊「發送訊息」
      Then 系統阻擋發送
      And 系統顯示錯誤訊息「互動類型為「開啟網址」但 URL 網址未填寫」

    Example: 發送訊息時 action_type 為「觸發文字」但 action_text 未填
      Given 內容管理者已設定按鈕互動類型為「觸發文字」
      And action_text 為 NULL
      When 內容管理者點擊「發送訊息」
      Then 系統阻擋發送
      And 系統顯示錯誤訊息「互動類型為「觸發文字」但觸發文字未填寫」

    Example: 發送訊息時 action_type 為「觸發圖片」但 action_image 未上傳
      Given 內容管理者已設定按鈕互動類型為「觸發圖片」
      And action_image 為 NULL
      When 內容管理者點擊「發送訊息」
      Then 系統阻擋發送
      And 系統顯示錯誤訊息「互動類型為「觸發圖片」但觸發圖片未上傳」

    Example: 發送訊息時所有必填欄位已填寫
      Given 內容管理者已設定按鈕互動類型為「開啟網址」
      And action_url 已填寫為「https://example.com/book」
      When 內容管理者點擊「發送訊息」
      Then 系統允許發送訊息

  Rule: 切換互動類型時保留舊值（不清空）

    Example: 從「開啟網址」切換到「觸發文字」保留 action_url
      Given 內容管理者已設定 action_type 為「開啟網址」
      And action_url 為「https://example.com/book」
      When 內容管理者切換 action_type 為「觸發文字」
      Then 系統保留 action_url 為「https://example.com/book」
      And 系統顯示 action_text 為必填欄位（紅色星號）

    Example: 從「觸發文字」切換到「開啟網址」保留 action_text
      Given 內容管理者已設定 action_type 為「觸發文字」
      And action_text 為「我要預訂房間」
      When 內容管理者切換 action_type 為「開啟網址」
      Then 系統保留 action_text 為「我要預訂房間」
      And 系統顯示 action_url 為必填欄位（紅色星號）

  Rule: action_type 本身為選填（允許按鈕不設定互動類型）

    Example: 儲存草稿時 action_type 未設定
      Given 內容管理者已新增按鈕「立即預訂」
      And 尚未選擇互動類型
      When 內容管理者點擊「儲存為草稿」
      Then 系統允許儲存草稿
      And 系統記錄 action_type 為 NULL

    Example: 發送訊息時 action_type 未設定（警告但不阻擋）
      Given 內容管理者已新增按鈕「立即預訂」
      And action_type 為 NULL
      When 內容管理者點擊「發送訊息」
      Then 系統顯示警告訊息「按鈕「立即預訂」未設定互動類型，點擊後將無反應」
      And 系統允許發送訊息（由使用者決定是否繼續）
