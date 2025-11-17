Feature: 自動回應
  作為一位使用者
  我希望設定歡迎訊息，當用戶加入本帳號好友時自動觸發
  以利在第一時間與用戶互動不疏漏，且可蒐集用戶資訊支持 CRM（會員資料整合）

  Rule: 支援事先設定訊息回應內容，觸發方式：新好友歡迎訊息

    Example: 設定新好友歡迎訊息
      Given 使用者正在建立自動回應
      When 使用者選擇觸發方式「新好友歡迎訊息」
      Then 系統設定觸發類型為「新好友歡迎訊息」

  Rule: 新好友歡迎訊息可設定觸發訊息內容

    Example: 設定歡迎訊息內容
      Given 使用者正在設定新好友歡迎訊息
      When 使用者輸入訊息內容「歡迎加入我們的飯店，期待為您服務！」
      Then 系統記錄訊息內容「歡迎加入我們的飯店，期待為您服務！」

  Rule: 支援事先設定訊息回應內容，觸發方式：輸入關鍵字觸發

    Example: 設定關鍵字觸發訊息
      Given 使用者正在建立自動回應
      When 使用者選擇觸發方式「關鍵字觸發」
      Then 系統設定觸發類型為「關鍵字觸發」

  Rule: 關鍵字觸發訊息可輸入多組關鍵字（最多 20 組）

    Example: 輸入多組關鍵字
      Given 使用者正在設定關鍵字觸發訊息
      When 使用者輸入關鍵字「訂房」「預約」「價格」
      Then 系統記錄關鍵字「訂房」「預約」「價格」

  Rule: 關鍵字比對邏輯：包含匹配，不區分大小寫

    Example: 包含匹配 - 會員訊息包含關鍵字即觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」
      And 回應內容為「請撥打訂房專線 02-12345678」
      When 會員發送訊息「我想訂房」
      Then 系統自動回覆「請撥打訂房專線 02-12345678」

    Example: 不區分大小寫 - 大小寫不影響比對
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」
      When 會員發送訊息「請問如何訂房？」
      Then 系統自動回覆訂房相關訊息

    Example: 完全匹配也會觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「價格」
      When 會員發送訊息「價格」
      Then 系統自動回覆價格相關訊息

    Example: 不包含關鍵字則不觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」
      When 會員發送訊息「你好」
      Then 系統不回覆訂房相關訊息

  Rule: 多組關鍵字為 OR 邏輯，任一匹配即觸發

    Example: 多組關鍵字任一匹配觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」「預約」「價格」
      And 回應內容為「請撥打訂房專線 02-12345678」
      When 會員發送訊息「請問價格多少」
      Then 系統自動回覆「請撥打訂房專線 02-12345678」

  Rule: 觸發的關鍵字會記錄於後台

    Example: 記錄觸發的關鍵字
      Given 系統中存在關鍵字觸發訊息，關鍵字為「優惠」
      When 會員發送訊息「有什麼優惠嗎」
      Then 系統記錄觸發關鍵字「優惠」

  Rule: 關鍵字透過關聯表管理（AutoResponseKeyword）

    Example: 新增關鍵字建立關聯記錄
      Given 使用者正在建立自動回應「訂房諮詢」
      When 使用者輸入關鍵字「訂房」「預約」「價格」
      Then 系統為自動回應「訂房諮詢」建立 3 筆關鍵字關聯記錄
        | keyword_text | match_type | is_enabled |
        | 訂房         | 包含匹配   | true       |
        | 預約         | 包含匹配   | true       |
        | 價格         | 包含匹配   | true       |

    Example: 刪除關鍵字移除關聯記錄
      Given 自動回應「訂房諮詢」存在關鍵字「訂房」「預約」「價格」
      When 使用者刪除關鍵字「價格」
      Then 系統刪除關鍵字「價格」的關聯記錄
      And 自動回應「訂房諮詢」剩餘關鍵字「訂房」「預約」

    Example: 關鍵字數量上限驗證（最多 20 組）
      Given 自動回應「訂房諮詢」已有 20 組關鍵字
      When 使用者嘗試新增第 21 組關鍵字「住宿」
      Then 系統拒絕新增，顯示錯誤訊息「關鍵字數量已達上限 20 組」

    Example: 同一自動回應不可有重複關鍵字
      Given 自動回應「訂房諮詢」已存在關鍵字「訂房」
      When 使用者嘗試新增關鍵字「訂房」
      Then 系統拒絕新增，顯示錯誤訊息「關鍵字已存在」

  Rule: 關鍵字觸發時更新統計資訊

    Example: 關鍵字觸發時累加觸發次數
      Given 自動回應「訂房諮詢」的關鍵字「訂房」目前觸發次數為 5 次
      When 會員發送訊息「我想訂房」觸發關鍵字「訂房」
      Then 系統將關鍵字「訂房」的 trigger_count 更新為 6
      And 更新 last_triggered_at 為當前時間

    Example: 僅更新實際觸發的關鍵字統計
      Given 自動回應「訂房諮詢」存在關鍵字「訂房」「預約」「價格」
      When 會員發送訊息「請問價格多少」觸發關鍵字「價格」
      Then 系統僅更新關鍵字「價格」的 trigger_count 與 last_triggered_at
      And 關鍵字「訂房」「預約」的統計資訊不變

    Example: 查看關鍵字觸發統計
      Given 自動回應「訂房諮詢」存在以下關鍵字
        | keyword_text | trigger_count | last_triggered_at |
        | 訂房         | 15            | 2025/01/20 14:30  |
        | 預約         | 8             | 2025/01/19 10:15  |
        | 價格         | 23            | 2025/01/20 16:45  |
      When 使用者查看自動回應「訂房諮詢」的關鍵字統計
      Then 系統顯示各關鍵字的觸發次數與最近觸發時間
      And 可依觸發次數排序，分析哪些關鍵字最常被使用

  Rule: 支援個別關鍵字的啟用/停用

    Example: 停用關鍵字不參與比對
      Given 自動回應「訂房諮詢」存在關鍵字「訂房」（is_enabled = true）
      When 使用者停用關鍵字「訂房」
      Then 系統將關鍵字「訂房」的 is_enabled 更新為 false
      When 會員發送訊息「我想訂房」
      Then 系統不觸發自動回應「訂房諮詢」

    Example: 停用關鍵字不刪除記錄
      Given 自動回應「訂房諮詢」存在關鍵字「訂房」
      And 關鍵字「訂房」的 trigger_count 為 15 次
      When 使用者停用關鍵字「訂房」
      Then 關鍵字「訂房」的關聯記錄仍保留在資料庫
      And 觸發統計資訊（trigger_count = 15）不變

    Example: 重新啟用關鍵字恢復比對
      Given 自動回應「訂房諮詢」存在關鍵字「訂房」（is_enabled = false）
      When 使用者重新啟用關鍵字「訂房」
      Then 系統將關鍵字「訂房」的 is_enabled 更新為 true
      When 會員發送訊息「我想訂房」
      Then 系統觸發自動回應「訂房諮詢」

  Rule: 支援事先設定訊息回應內容，觸發方式：選擇指定時間觸發

    Example: 設定指定時間觸發訊息
      Given 使用者正在建立自動回應
      When 使用者選擇觸發方式「指定時間觸發」
      Then 系統設定觸發類型為「指定時間觸發」

  Rule: 指定時間觸發可選擇指定日期區間

    Example: 設定指定日期區間
      Given 使用者正在設定指定時間觸發訊息
      When 使用者設定日期區間「2025/02/01」到「2025/02/28」
      Then 系統記錄日期區間「2025/02/01」到「2025/02/28」

  Rule: 指定時間觸發可選擇指定時間區間

    Example: 設定指定時間區間（非營業時間段）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者設定時間區間「18:00」到「09:00」
      Then 系統記錄 time_range_start 為「18:00」
      And 系統記錄 time_range_end 為「09:00」

  Rule: 時間區間採用兩欄位設計（time_range_start, time_range_end）

    Example: 時間區間格式為 HH:mm（24小時制）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者設定時間區間「18:00」到「09:00」
      Then 系統儲存 time_range_start 為「18:00」（格式：HH:mm）
      And 系統儲存 time_range_end 為「09:00」（格式：HH:mm）

    Example: 時間格式驗證（正確格式）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者輸入時間區間起始「18:00」
      Then 系統驗證格式正確（符合 ^([01]\d|2[0-3]):[0-5]\d$ 規則）
      And 系統接受輸入

    Example: 時間格式驗證（錯誤格式 - 超出範圍）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者輸入時間區間起始「25:00」
      Then 系統驗證格式錯誤
      And 系統拒絕輸入，顯示錯誤訊息「時間格式錯誤，請輸入 HH:mm 格式（00:00-23:59）」

    Example: 時間格式驗證（錯誤格式 - 缺少冒號）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者輸入時間區間起始「1800」
      Then 系統驗證格式錯誤
      And 系統拒絕輸入，顯示錯誤訊息「時間格式錯誤，請輸入 HH:mm 格式（00:00-23:59）」

  Rule: 支援跨日時間區間（time_range_end < time_range_start 表示跨日）

    Example: 跨日時間區間判斷（18:00-09:00）
      Given 使用者設定 time_range_start 為「18:00」
      And 使用者設定 time_range_end 為「09:00」
      When 系統比對 time_range_end < time_range_start
      Then 系統判斷為跨日時間區間
      And 系統記錄此為跨日情境（晚上 18:00 到隔天早上 09:00）

    Example: 非跨日時間區間判斷（09:00-18:00）
      Given 使用者設定 time_range_start 為「09:00」
      And 使用者設定 time_range_end 為「18:00」
      When 系統比對 time_range_end >= time_range_start
      Then 系統判斷為非跨日時間區間
      And 系統記錄此為同日時間區間（當日 09:00 到 18:00）

    Example: 跨日時間區間觸發判斷（會員在區間內）
      Given 自動回應設定 time_range_start 為「18:00」
      And time_range_end 為「09:00」（跨日）
      When 會員於「20:00」發送訊息
      Then 系統判斷當前時間「20:00」>= time_range_start「18:00」
      And 系統觸發自動回應

    Example: 跨日時間區間觸發判斷（會員在隔日區間內）
      Given 自動回應設定 time_range_start 為「18:00」
      And time_range_end 為「09:00」（跨日）
      When 會員於隔日「08:00」發送訊息
      Then 系統判斷當前時間「08:00」<= time_range_end「09:00」
      And 系統觸發自動回應

    Example: 跨日時間區間觸發判斷（會員在區間外）
      Given 自動回應設定 time_range_start 為「18:00」
      And time_range_end 為「09:00」（跨日）
      When 會員於「10:00」發送訊息
      Then 系統判斷當前時間「10:00」不在區間內
      And 系統不觸發自動回應

    Example: 非跨日時間區間觸發判斷（會員在區間內）
      Given 自動回應設定 time_range_start 為「09:00」
      And time_range_end 為「18:00」（非跨日）
      When 會員於「14:00」發送訊息
      Then 系統判斷當前時間「14:00」>= time_range_start「09:00」且 <=time_range_end「18:00」
      And 系統觸發自動回應

    Example: 非跨日時間區間觸發判斷（會員在區間外）
      Given 自動回應設定 time_range_start 為「09:00」
      And time_range_end 為「18:00」（非跨日）
      When 會員於「19:00」發送訊息
      Then 系統判斷當前時間「19:00」> time_range_end「18:00」
      And 系統不觸發自動回應

  Rule: 指定時間觸發支援兩種模式：被動回應模式、主動推播模式

    Example: 選擇被動回應模式
      Given 使用者正在設定指定時間觸發訊息
      When 使用者選擇觸發模式「被動回應模式」
      Then 系統設定觸發模式為「被動回應模式」

    Example: 選擇主動推播模式
      Given 使用者正在設定指定時間觸發訊息
      When 使用者選擇觸發模式「主動推播模式」
      Then 系統設定觸發模式為「主動推播模式」

  Rule: 被動回應模式：會員發送訊息時，系統判斷當前時間是否在設定範圍內，符合則回應

    Example: 被動回應模式 - 非營業時間自動回覆
      Given 系統中存在自動回應，觸發類型為「指定時間觸發」
      And 觸發模式為「被動回應模式」
      And 時間區間為「18:00」到「09:00」
      And 回應內容為「目前為非營業時間，請於 09:00 後來電，謝謝！」
      When 會員於「20:00」發送訊息「還有房間嗎？」
      Then 系統自動回覆「目前為非營業時間，請於 09:00 後來電，謝謝！」

    Example: 被動回應模式 - 時間範圍外不回應
      Given 系統中存在自動回應，觸發類型為「指定時間觸發」
      And 觸發模式為「被動回應模式」
      And 時間區間為「18:00」到「09:00」
      When 會員於「10:00」發送訊息「還有房間嗎？」
      Then 系統不自動回覆該訊息

  Rule: 主動推播模式：系統於時間範圍開始時，主動推播給所有會員

    Example: 主動推播模式 - 活動開始時推播
      Given 系統中存在自動回應，觸發類型為「指定時間觸發」
      And 觸發模式為「主動推播模式」
      And 日期區間為「2025/02/01」到「2025/02/28」
      And 時間區間為「09:00」到「23:59」
      And 回應內容為「春節優惠開跑！2月份訂房享8折優惠」
      When 系統時間到達「2025/02/01 09:00」
      Then 系統主動推播訊息給所有會員「春節優惠開跑！2月份訂房享8折優惠」

    Example: 主動推播模式 - 記錄推播時間與人數
      Given 系統執行主動推播
      And 推播對象為所有會員「1,200 人」
      When 推播完成
      Then 系統記錄推播時間「2025/02/01 09:00」
      And 系統記錄推播人數「1,200 人」

  Rule: 訊息回應格式以純文字為主

    Example: 設定純文字回應內容
      Given 使用者正在設定自動回應訊息
      When 使用者輸入純文字「感謝您的詢問，我們將盡快回覆」
      Then 系統記錄回應內容「感謝您的詢問，我們將盡快回覆」

  Rule: 自動回應訊息透過關聯表管理（AutoResponseMessage）

    Example: 新增第一筆訊息
      Given 使用者正在建立自動回應
      When 使用者新增第一筆訊息「歡迎加入我們的飯店！」
      Then 系統建立 AutoResponseMessage 記錄
      And 系統記錄 message_content 為「歡迎加入我們的飯店！」
      And 系統記錄 sequence_order 為 1
      And 系統更新 AutoResponse.response_count 為 1

    Example: 新增多筆訊息
      Given 使用者已新增第一筆訊息「歡迎加入！」
      When 使用者新增第二筆訊息「很高興認識您～」
      Then 系統建立第二筆 AutoResponseMessage 記錄
      And 系統記錄 sequence_order 為 2
      And 系統更新 AutoResponse.response_count 為 2

  Rule: 自動回應訊息數量限制（至少 1 筆，最多 5 筆）

    Example: 訊息數量至少 1 筆
      Given 使用者正在建立自動回應
      When 使用者嘗試儲存但未新增任何訊息
      Then 系統顯示驗證錯誤「至少需要新增 1 筆訊息」
      And 拒絕儲存

    Example: 訊息數量最多 5 筆
      Given 使用者已新增 5 筆自動回應訊息
      When 使用者嘗試新增第 6 筆訊息
      Then 系統顯示提示「已達訊息數量上限（最多 5 筆）」
      And 拒絕新增

  Rule: 支援個別訊息的新增、編輯、刪除操作

    Example: 編輯特定訊息內容
      Given 使用者已新增訊息「歡迎加入！」（sequence_order = 1）
      When 使用者編輯該訊息內容為「熱烈歡迎加入我們的飯店！」
      Then 系統更新對應 AutoResponseMessage 記錄的 message_content
      And sequence_order 保持不變

    Example: 刪除特定訊息
      Given 使用者已新增 3 筆訊息（sequence_order: 1, 2, 3）
      When 使用者刪除第 2 筆訊息
      Then 系統刪除對應的 AutoResponseMessage 記錄
      And 系統更新剩餘訊息的 sequence_order（原第 3 筆變為第 2 筆）
      And 系統更新 AutoResponse.response_count 為 2

  Rule: 支援訊息順序調整（拖曳排序）

    Example: 調整訊息順序
      Given 使用者已新增 3 筆訊息
        | sequence_order | message_content |
        | 1              | 訊息 A          |
        | 2              | 訊息 B          |
        | 3              | 訊息 C          |
      When 使用者將「訊息 C」拖曳至第 1 位
      Then 系統更新所有訊息的 sequence_order
        | message_content | new_sequence_order |
        | 訊息 C          | 1                  |
        | 訊息 A          | 2                  |
        | 訊息 B          | 3                  |

  Rule: 觸發時依序發送所有訊息

    Example: 依序發送多筆訊息
      Given 自動回應設定包含 3 筆訊息
        | sequence_order | message_content |
        | 1              | 歡迎加入！      |
        | 2              | 很高興認識您～  |
        | 3              | 有問題隨時詢問  |
      When 觸發條件滿足（如新好友加入）
      Then 系統依序發送第 1 筆訊息「歡迎加入！」
      And 延遲 1-2 秒後發送第 2 筆訊息「很高興認識您～」
      And 延遲 1-2 秒後發送第 3 筆訊息「有問題隨時詢問」

    Example: 發送間隔模擬真人回覆節奏
      Given 自動回應設定包含 2 筆訊息
      When 觸發條件滿足
      Then 系統發送第 1 筆訊息
      And 系統等待 1-2 秒（模擬打字時間）
      And 系統發送第 2 筆訊息
      And 避免瞬間連續發送造成洗版感

  Rule: 支援新增自動回應訊息

    Example: 新增自動回應訊息
      Given 使用者已設定 2 筆自動回應訊息
      When 使用者新增第 3 筆自動回應訊息「價格查詢請訪問官網」
      Then 系統新增自動回應訊息「價格查詢請訪問官網」

  Rule: 支援刪除自動回應訊息

    Example: 刪除自動回應訊息
      Given 系統中存在自動回應訊息「測試訊息」
      When 使用者刪除自動回應訊息「測試訊息」
      Then 系統移除自動回應訊息「測試訊息」

  Rule: 支援發送前的效果即時預覽

    Example: 前端模擬即時預覽自動回應訊息
      Given 使用者正在建立自動回應訊息
      When 使用者輸入訊息文字「歡迎加入，{好友的顯示名稱}！」
      Then 系統使用 LINE Simulator 在網頁上即時渲染預覽
      And 預覽區顯示訊息內容，變數標籤以特殊格式突出顯示

  Rule: 設定完成後，可選擇停用該訊息

    Example: 停用自動回應訊息
      Given 系統中存在自動回應訊息「歡迎訊息」，狀態為「啟用」
      When 使用者停用訊息「歡迎訊息」
      Then 系統設定訊息「歡迎訊息」狀態為「停用」

  Rule: 停用則不啟動觸發

    Example: 停用的訊息不觸發
      Given 系統中存在關鍵字觸發訊息「訂房回覆」，關鍵字為「訂房」，狀態為「停用」
      When 會員發送訊息「我想訂房」
      Then 系統不觸發自動回應

  Rule: 設定完成後，可選擇刪除該訊息

    Example: 刪除自動回應訊息
      Given 系統中存在自動回應訊息「舊活動」
      When 使用者刪除訊息「舊活動」
      Then 系統移除訊息「舊活動」

  Rule: 刪除則無法復原需重新設定

    Example: 刪除後無法復原
      Given 系統中存在自動回應訊息「過期優惠」
      When 使用者刪除訊息「過期優惠」
      Then 系統中不存在訊息「過期優惠」

  Rule: 設定完成後，可編輯該訊息內容

    Example: 編輯自動回應訊息內容
      Given 系統中存在自動回應訊息「營業時間回覆」，內容為「營業時間：09:00-18:00」
      When 使用者編輯訊息內容為「營業時間：10:00-20:00」
      Then 系統更新訊息內容為「營業時間：10:00-20:00」

  Rule: 用戶下次觸發時啟用更新後的內容

    Example: 觸發時使用更新後的內容
      Given 系統中存在關鍵字觸發訊息，關鍵字為「營業時間」
      And 訊息內容已更新為「營業時間：10:00-20:00」
      When 會員發送訊息「請問營業時間」
      Then 系統回覆「營業時間：10:00-20:00」

  Rule: 於訊息外部可查看訊息的停用/啟用狀態

    Example: 查看訊息啟用狀態
      Given 系統中存在自動回應訊息「歡迎訊息」，狀態為「啟用」
      When 使用者查看自動回應訊息清單
      Then 系統顯示訊息「歡迎訊息」的狀態為「啟用」

  Rule: 於訊息外部可查看回應類型：歡迎訊息

    Example: 查看回應類型為歡迎訊息
      Given 系統中存在自動回應訊息「新會員歡迎」，回應類型為「歡迎訊息」
      When 使用者查看自動回應訊息清單
      Then 系統顯示訊息「新會員歡迎」的回應類型為「歡迎訊息」

  Rule: 於訊息外部可查看回應類型：關鍵字

    Example: 查看回應類型為關鍵字
      Given 系統中存在自動回應訊息「訂房諮詢」，回應類型為「關鍵字」
      When 使用者查看自動回應訊息清單
      Then 系統顯示訊息「訂房諮詢」的回應類型為「關鍵字」

  Rule: 於訊息外部可查看回應類型：指定時間

    Example: 查看回應類型為指定時間
      Given 系統中存在自動回應訊息「非營業時間回覆」，回應類型為「指定時間」
      When 使用者查看自動回應訊息清單
      Then 系統顯示訊息「非營業時間回覆」的回應類型為「指定時間」

  Rule: 觸發類型支援動態擴充（可透過設定檔管理）

    Example: 初始觸發類型清單
      Given 系統初始化時載入觸發類型設定
      When 管理員查看可用的觸發類型選項
      Then 系統顯示以下初始觸發類型
        | trigger_code        | trigger_name       | description                            |
        | welcome_message     | 新好友歡迎訊息     | 會員加入好友時自動觸發歡迎訊息         |
        | keyword_trigger     | 關鍵字觸發         | 會員訊息包含關鍵字時自動回應           |
        | scheduled_trigger   | 指定時間觸發       | 特定時間或日期區間內觸發訊息           |

    Example: 動態新增觸發類型
      Given 系統需要支援新的觸發類型「取消追蹤」
      When 管理員透過設定檔或管理後台新增觸發類型「unfollow_trigger」
      Then 系統新增觸發類型選項「unfollow_trigger」至觸發類型清單
        | trigger_code     | trigger_name | description                    |
        | unfollow_trigger | 取消追蹤     | 會員取消追蹤帳號時自動觸發訊息 |
      And 建立自動回應時可選擇「取消追蹤」作為觸發類型
      And 無需修改程式碼或重新部署

    Example: 使用動態新增的觸發類型建立自動回應
      Given 系統已新增觸發類型「取消追蹤」
      And 使用者正在建立自動回應
      When 使用者選擇觸發方式「取消追蹤」
      And 使用者輸入訊息內容「感謝您曾經的支持，期待再次為您服務！」
      Then 系統建立自動回應，trigger_type 為「unfollow_trigger」
      And 當會員取消追蹤時，系統自動發送該訊息

    Example: 動態新增觸發類型支援 LINE webhook 新事件
      Given LINE 平台推出新的 webhook 事件「加入群組」
      When 管理員透過設定檔新增觸發類型「group_join」
      Then 系統新增觸發類型選項「加入群組」
        | trigger_code | trigger_name | description                      |
        | group_join   | 加入群組     | 會員將帳號加入群組時自動觸發訊息 |
      And webhook 事件處理邏輯可識別並處理「加入群組」事件
      And 無需修改核心程式碼，僅需更新設定檔與 webhook 處理對應關係
