功能說明:
建立可同時支援 LINE Flex Message 與 Meta Templates 的訊息推播編輯器。可依照勾選欄位動態組成素材卡片，並能跨渠道切換且保留編輯資料，避免使用者重複設定。

Feature: 跨渠道編輯訊息內容共用與重新計算發送對象
作為客服人員，
我希望客戶在 LINE 和 Facebook 的訊息編輯可以跨平台適用，
以便我可以在同個系統介面中共用 LINE 與 Facebooke 的訊息模板做發送。

說明:
於 LINE 或 Facebook 建立訊息時
當用戶在發佈渠道 LINE 上設定好所有圖片、輪播、內容、按鈕等訊息設定時，若轉換渠道至 Facebook，系統會取得該渠道訊息資訊，與 Facebook 訊息欄位 Table 進行關聯。
LINE / Facebook 的訊息紀錄仍然存在各自表中（line_message / fb_message）。
客服在系統介面看到的訊息編輯，是依二個渠道訊息表做暫存，可選擇將訊息發出或存成模板。

模板需至少包含「圖片／標題／內文」任一欄位
Rule：模板必須至少填寫「圖片、標題、內文」其中一項，否則不可儲存
Example:
  Given 使用者建立 Facebook 訊息模板
  And 未填寫「選擇圖片、標題文字、內文文字說明」任一欄位
  When 使用者點擊「儲存草稿」
  Then 系統禁止儲存成功

LINE 圖片比例會依欄位是否存在自動變換
Rule：若 LINE 模板含其他欄位 → 圖片比例為 1.91:1  
      若僅有圖片無其他欄位 → 自動切換為 1:1

Example #1: 含其他欄位設定變換圖片比例為 1.91:1
  Given 使用者於 LINE 編輯 Template 
  And 使用者於後台勾選欄位「選擇圖片」
  When 勾選其他欄位如「標題」
  Then 圖片比例自動變換從 1:1 轉為 1.91:1

Example #2: 僅有圖片欄位自動變換圖片比例為 1:1
  Given 使用者於 LINE 編輯 Template
  And 使用者於後台勾選欄位「選擇圖片」
  And 使用者於後台勾選欄位「標題」
  When 取消勾選欄位如「標題」
  Then 圖片比例自動變換從 1.91:1 轉為 1:1

Facebook 圖片比例固定為 1.91:1
Rule：Facebook Template 圖片比例一律固定為 1.91:1，不因欄位變化切換 
Example:模板從含其他欄位到僅有圖片
  Given 使用者於 Facebook 編輯 Template
  And 無論是否填寫標題或內文
  When 使用者點擊「儲存草稿」
  Then 圖片比例皆固定為 1.91:1

各平台圖片比例切換與平台互動行為
Rule：從 LINE 切換至 Facebook → 比例強制調整為 1.91:1 
Example #1: 從 LINE 僅圖片切換至 Facebook Template
  Given 使用者於 LINE 編輯 Template
  And 僅勾選「圖片」欄位
  And 圖片比例目前為 1:1
  When 使用者切換發佈平台至 Facebook
  Then 圖片比例應自動切換為 1.91:1

Rule：從 Facebook 切回 LINE → 依 LINE 欄位決定比例 (1:1 / 1.91:1)
Example #2: 從 Facebook 僅圖片切換至 LINE Template
  Given 使用者於 Facebook 編輯 Template
  And 僅勾選「圖片」欄位
  And 圖片比例目前為 1.91:1
  When 使用者切換發佈平台至 LINE
  Then 圖片比例應自動切換為 1:1
切換渠道後需切換至該平台對應 Template UI
Rule：當使用者切換發佈渠道為 LINE 或 Facebook，系統必須顯示該平台專屬的模板前台 UI，並套用該平台的欄位 / 規格 / 圖片比例
Example #1：從 LINE 切換至 Facebook 後 Template UI 需立即變更
  Given 使用者目前位於「發佈渠道：LINE」
  And UI 目前呈現 LINE Flex Message 編輯畫面
  When 使用者將發佈渠道切換為「Facebook」
  Then UI 應立即切換為 Facebook Template 編輯畫面
  And Template 套用 Facebook 預設欄位顯示格式
  And 圖片比例應呈現為固定 1.91:1
  And 若某欄位不適用於 Facebook，需於 UI 進行隱藏或格式轉換

Example #2: 切回 LINE 時 UI 需呈現 LINE Template 設計規則

  Given 使用者目前位於「發佈渠道：Facebook」
  And UI 目前呈現 Facebook Template 編輯畫面
  When 使用者將發佈渠道切換回「LINE」
  Then UI 應切換為 LINE Flex Message 編輯畫面
  And 圖片比例需依欄位狀態自動顯示為 1:1 或 1.91:1
  And Facebook 隱藏欄位（如觸發文字訊息）若 LINE 支援則需重新顯示欄位與數值

Example #3: 切換後預覽需反映當前平台 UI
  Given 使用者在 LINE UI 編輯完成後切換為 Facebook
  When 使用者點擊「預覽訊息」
  Then 預覽畫面需呈現 Facebook 消息模板樣式均為 FB 規格
  And 不得仍以 LINE Flex Message 格式顯示

LINE 輪播卡片自動重新裁切（沿用 carousel_auto_recrop.feature 的前端規格）
Rule：多渠道推播頁面在 LINE 渠道使用 Flex Carousel 時，前端依勾選欄位自動重裁圖片（1:1 ↔ 1.91:1），並僅在最終儲存時才上傳裁切後圖片；Canvas 重裁邏輯同 carousel_auto_recrop.feature
Example #1：多渠道頁面 LINE Tab 勾選欄位觸發 1:1 → 1.91:1 重裁
  Given 使用者於多渠道推播頁面選擇「發佈渠道：LINE」並建立 Flex Carousel
  And 僅勾選卡片欄位「選擇圖片」，預覽顯示 1:1 正方形
  And 原始圖片 File 存在 originalFile 狀態欄位
  When 使用者勾選卡片欄位「標題」或「內文」
  Then 前端依 Canvas 規則從 originalFile 重新裁切為 1.91:1（1920x1005）
  And 預覽立即更新為橫向比例
  And 過程不呼叫後端 API，僅更新前端 Blob URL

Example #2：切換至 Facebook 不重新裁切但鎖定為 1.91:1 預覽
  Given 使用者於 LINE Tab 已完成圖片重裁並切換發佈渠道為 Facebook
  When 系統轉換至 Facebook Template UI
  Then 預覽比例固定顯示為 1.91:1
  And 不對原始圖片進行額外裁切或上傳
  And LINE 暫存的 originalFile 與裁切結果需保留（切回 LINE 時可復原）

Example #3：切回 LINE 依勾選狀態再次重裁或保留現有裁切
  Given 使用者從 Facebook 切回「發佈渠道：LINE」
  And 卡片仍有 originalFile 暫存
  When 勾選欄位數量為 1（僅圖片）
  Then 前端自 originalFile 重新裁切為 1:1 並更新預覽
  And 若 originalFile 已不存在（例如重新開啟已儲存訊息），則預覽保持上次裁切結果，不自動重裁

Example #4：多卡片批次保存時沿用前端最後裁切結果
  Given 使用者建立 3 張輪播卡片並於 LINE Tab 完成各自的自動裁切
  When 點擊「儲存草稿」
  Then 前端使用每張卡片的 originalFile 依當前比例再次裁切
  And 將裁切後的 Blob 轉為 File 後一次上傳，任一失敗則阻擋儲存

多平台 Carousel 支援方式
Rule：LINE Flex Carousel 切換至 Facebook 時，Facebook 也支援 Carousel，保留卡片數與每卡最多 3 顆按鈕，套用 Facebook 規格格式
Example：LINE Carousel 切換至 Facebook 保留多卡片
  Given 使用者於 LINE Tab 建立 Carousel，含 3 張卡片且每卡最多 3 顆按鈕
  When 切換發佈渠道為 Facebook
  Then Facebook Template 以 Carousel 形式呈現 3 張卡片
  And 依 Facebook 規格渲染卡片與按鈕（按鈕仍以每卡最多 3 顆為上限）
  And 不刪除卡片或按鈕，僅套用 Facebook 样式與欄位規格

Facebook 圖片裁切方式
Rule：Facebook 模板上傳圖片時，前端使用 Canvas 自動裁切/縮放為 1.91:1，再進行預覽與上傳；不接受任意比例直接上傳
Example：Facebook 上傳圖片自動裁切
  Given 發佈渠道為 Facebook，使用者上傳圖片（任意原始比例）
  Then 前端以 Canvas 自動裁切/縮放為 1.91:1 後預覽
  And 將裁切後檔案上傳並儲存
  And 不接受未裁切的任意比例圖片直接上傳

Carousel 按鈕上限規則
Rule：LINE 與 Facebook 的 Carousel 皆採「每張卡片最多 3 顆按鈕」，不共用總額度
Example：3 張卡片各自上限
  Given 發佈渠道為 LINE 或 Facebook
  And Carousel 共有 3 張卡片
  When 每張卡片皆已新增 3 顆按鈕
  Then 系統於該卡片隱藏「新增按鈕」，但不影響其他卡片的按鈕新增


跨渠道切換時內容與發送對象需被正確處理
Rule：由 LINE 切換至 Facebook 時，可映射欄位需完整保留；無對應欄位則不帶入並提示
Rule：切換發佈渠道時，發送對象自動重新計算為「綁定新渠道」的會員；未綁定者直接剔除並提示剔除數量

Example #1: 從 LINE → Facebook（顯示可映射欄位 / 不支援欄位隱藏但保留值）
  Given 使用者於 LINE 已填寫以下欄位
        | 圖片       | banner01.jpg |
        | 標題文字   | 春節住房優惠 |
        | 內文文字   | 連住兩晚享85折 |
        | 金額      | 2000         |
        | 動作按鈕一  | 立即預約     |
        | 連結網址  | http://example.com |
        | 互動標籤  | 春節優惠 |
        | 按鈕樣式  | Primary（綠色實心） |
  When 使用者切換「發佈渠道」為 Facebook
  Then Facebook 模板應自動帶入相同欄位內容
        | 圖片       | banner01.jpg |
        | 標題文字   | 春節住房優惠 |
        | 內文文字   | 連住兩晚享85折 |
        | 金額      | 2000         |
        | 動作按鈕一  | 立即預約     |
        | 連結網址  | http://example.com |
  And 以下欄位因不支援 Facebook UI 而隱藏，但仍須保留暫存值：
        | 互動標籤 / 按鈕樣式 |
  And Facebook 按鈕邏輯為「連結網址、互動標籤 二擇一」
  And 預設優先保留 LINE 連結網址對應顯示於 Facebook 的 UI 欄位
  And 互動標籤 需自動隱藏但不可清除（於切回 LINE 時復原）
  And 使用者可於 Facebook 介面中進行以上欄位的微調
  And 不需重新重新上傳圖片或重新輸入欄位
  And 系統自動重新計算發送對象，僅保留已綁定 Facebook 的會員；未綁定者剔除並提示剔除數量

Example #2: 從 Facebook → 回切 LINE（保留暫存值並完整顯示）
  Given 使用者於 Facebook 已填寫以下欄位
        | 圖片       | banner01.jpg |
        | 圖片URL    | http://example.com |
        | 標題文字   | 春節住房優惠 |
        | 內文文字   | 連住兩晚享85折 |
  When 使用者切換「發佈渠道」為 LINE
  Then LINE 模板應自動帶入相同欄位內容
        | 圖片       | banner01.jpg |
        | 圖片URL    | http://example.com |
        | 標題文字   | 春節住房優惠 |
        | 內文文字   | 連住兩晚享85折 |
  And 使用者可於 LINE 基於相同內容微調
  And 不需重新重新上傳圖片或重新輸入欄位
  And 系統自動重新計算發送對象，僅保留已綁定 LINE 的會員；未綁定者剔除並提示剔除數量

Example #3: 訊息發佈後暫存欄位狀態
  Given 使用者於任一渠道完成訊息發佈
  When 訊息狀態為「已發佈」
  Then 暫存值不再需跨渠道保留
  And 後續如再切換渠道則需重新建立或載入新模板

Instagram 支援範圍
Rule：多渠道推播目前僅支援 LINE / Facebook，Instagram 不開放選取（前端隱藏或阻擋），無 Instagram 模板/發送
Example：下拉選單不含 Instagram
  Given 使用者開啟多渠道推播編輯器
  Then 發佈渠道選項僅包含「LINE」「Facebook」
  And 無 Instagram 選項，亦無 Instagram 模板/預覽/發送流程

按鈕數量上限皆為 3 顆
Rule：LINE 與 FB 模板每則最多可新增 3 個 Button
Example
  Given Template 已建立 3 顆 Button
  When 使用者於該訊息已新增至 3 顆按鈕
  Then 系統隱藏「新增按鈕」

LINE 設定動作按鈕允許同時具有 Link 與 Tag
Rule：LINE Template 的動作按鈕可同時設定 連結網址(Link)+互動標籤(Tag) 不做互斥限制
Example：使用者於發佈渠道 LINE 訊息模板 Template 設定動作按鈕
  Given 使用者於 LINE 設定動作按鈕
  And 使用者新增動作按鈕一設定文字為「立即預約」 
  And 設定連結網址 Link=”http://example.com”
  And 設定互動標籤 Tag=#促銷
  And 設定按鈕樣式 Style=綠色實心
  And 確認所有訊息必填欄位已設定
  When 點擊按鈕「發佈訊息」
  Then 系統應允許成功儲存

Facebook 設定動作按鈕 Link 與 Tag 必須則一
Rule：Facebook Template 的動作按鈕不可同時含 連結網址(Link)+互動標籤(Tag)，必須二選一
Example #1：使用者於動作按鈕設定勾選 Tag → Link 強制關閉
  Given 使用者於 Facebook 按鈕設定互動標籤
  And 設定互動標籤為「訂房行為」Tag=#訂房行為
  When 勾選連結網址
  Then 互動標籤欄位應自動清空並 disabled
  And 顯示連結網址欄位且為必填
  And 使用者可於欄位輸入 URL=”http://hotel.com”


Example #2：使用者於動作按鈕設定勾選 Link → Tag 強制關閉
  Given 使用者於 Facebook 按鈕設定連結網址
  And 設定連結網址為 URL=”http://hotel.com”
  When 勾選互動標籤
  Then 連結網址欄位 URL 應自動清空並 disabled
  And 顯示互動標籤欄位且為必填
  And 須設定額外欄位為「觸發訊息文字」

選擇互動標籤 Tag 時可填寫觸發回覆訊息
Rule：Facebook Button 選 Tag 時可額外輸入回覆訊息（可選填）
Example #1：Facebook 按鈕設定互動標籤 Tag=#訂房行為
  Given Facebook 按鈕設定 Tag=#訂房行為
  And 觸發文字設定為「快來看看吧 http://example.com」
  When 使用者觸發訊息動作按鈕時
  Then 點擊系統後會回覆「快來看看吧 http://example.com」
  And 將使用者自動貼上互動標籤 #訂房行為
