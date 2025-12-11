Feature: 自動回應
  作為一位使用者
  我希望設定歡迎訊息，當用戶加入本帳號好友時自動觸發
  以利在第一時間與用戶互動不疏漏，且可蒐集用戶資訊支持 CRM（會員資料整合）

  # ============================================
  # 實作狀態（2025-11-20）
  # ============================================
  # v1.0 已實作被動回應模式
  # - ✅ 歡迎訊息（FollowEvent 觸發）
  # - ✅ 關鍵字觸發（最多 20 個關鍵字）
  # - ✅ 時間範圍觸發（被動模式）
  # - ✅ 多訊息回應（1-5 則訊息）
  # - ✅ 實作位置：backend/app/models/auto_response.py + line_app/app.py
  #
  # v2.0 規劃主動推播模式
  # - ⏳ 定時主動推播訊息
  # - ⏳ 星期篩選功能
  # - ⏳ 24小時去重邏輯
  # 詳見：../roadmap.md, ../todo.md
  # ============================================

  Rule: 支援事先設定訊息回應內容，觸發方式：歡迎訊息

    Example: 設定歡迎訊息
      Given 使用者正在建立自動回應
      When 使用者選擇觸發方式「歡迎訊息」
      Then 系統設定觸發類型為「歡迎訊息」

    Example: 歡迎訊息自動觸發
      Given 系統中存在自動回應「新會員歡迎」，觸發類型為「歡迎訊息」
      And 回應內容為「歡迎加入我們的飯店！」
      When 新會員「張小明」加入 LINE 官方帳號
      Then 系統自動發送訊息「歡迎加入我們的飯店！」給會員「張小明」

    Example: 歡迎訊息停用時不觸發
      Given 系統中存在自動回應「新會員歡迎」，觸發類型為「歡迎訊息」
      And 該自動回應狀態為「停用」
      When 新會員「李小華」加入 LINE 官方帳號
      Then 系統不發送歡迎訊息

  Rule: 歡迎訊息可設定觸發訊息內容

    Example: 設定歡迎訊息內容
      Given 使用者正在設定歡迎訊息
      When 使用者輸入訊息內容「歡迎加入我們的飯店，期待為您服務！」
      Then 系統記錄訊息內容「歡迎加入我們的飯店，期待為您服務！」

    Example: 設定歡迎訊息多筆內容
      Given 使用者正在設定歡迎訊息
      When 使用者輸入第 1 筆訊息「歡迎加入我們的飯店！」
      And 使用者輸入第 2 筆訊息「很高興認識您～」
      And 使用者輸入第 3 筆訊息「有任何問題隨時詢問」
      Then 系統記錄 3 筆訊息內容
      And 系統將依序發送這 3 筆訊息

    Example: 歡迎訊息內容超過長度限制
      Given 使用者正在設定歡迎訊息
      When 使用者輸入超過 5000 字的訊息內容
      Then 系統顯示錯誤訊息「訊息內容不可超過 5000 字」
      And 拒絕儲存該訊息

  Rule: 支援事先設定訊息回應內容，觸發方式：輸入關鍵字觸發

    Example: 設定關鍵字觸發訊息
      Given 使用者正在建立自動回應
      When 使用者選擇觸發方式「關鍵字觸發」
      Then 系統設定觸發類型為「關鍵字觸發」

    Example: 關鍵字觸發訊息自動回應
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」
      And 回應內容為「請撥打訂房專線 02-12345678」
      When 會員發送訊息「訂房」
      Then 系統自動回覆「請撥打訂房專線 02-12345678」

    Example: 關鍵字觸發訊息停用時不回應
      Given 系統中存在關鍵字觸發訊息，關鍵字為「價格」
      And 該自動回應狀態為「停用」
      When 會員發送訊息「價格」
      Then 系統不自動回覆

  Rule: 關鍵字觸發訊息可輸入多組關鍵字（最多 20 組）

    Example: 輸入多組關鍵字
      Given 使用者正在設定關鍵字觸發訊息
      When 使用者輸入關鍵字「訂房」「預約」「價格」
      Then 系統記錄關鍵字「訂房」「預約」「價格」

    Example: 輸入 20 組關鍵字達上限
      Given 使用者正在設定關鍵字觸發訊息
      When 使用者輸入 20 組關鍵字「訂房」「預約」「價格」...「退房」
      Then 系統記錄全部 20 組關鍵字
      And 系統顯示「已達關鍵字上限 20 組」

    Example: 超過 20 組關鍵字拒絕新增
      Given 使用者已輸入 20 組關鍵字
      When 使用者嘗試輸入第 21 組關鍵字「住宿」
      Then 系統顯示錯誤訊息「關鍵字數量已達上限 20 組」
      And 拒絕新增第 21 組關鍵字

  Rule: 關鍵字比對邏輯：完全匹配，不區分大小寫
    Example: 拒絕純空白關鍵字
      Given 使用者正在設定關鍵字觸發訊息
      When 使用者僅輸入空白字元（例如「   」）
      Then 系統顯示錯誤訊息「關鍵字不可為空白」
      And 拒絕儲存該關鍵字

    Example: 特殊字元需完全匹配
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房@vip」
      When 會員發送訊息「訂房@vip」
      Then 系統自動回覆該關鍵字對應的訊息
      But 當會員發送訊息「訂房」時
      Then 系統不觸發自動回應（因未完整包含 @vip）

    Example: 完全匹配 - 會員訊息與關鍵字完全一致才觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」
      And 回應內容為「請撥打訂房專線 02-12345678」
      When 會員發送訊息「訂房」
      Then 系統自動回覆「請撥打訂房專線 02-12345678」

    Example: 不區分大小寫 - 大小寫不影響完全匹配
      Given 系統中存在關鍵字觸發訊息，關鍵字為「Price」
      When 會員發送訊息「price」
      Then 系統自動回覆價格相關訊息

    Example: 部分匹配不會觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」
      When 會員發送訊息「我想訂房」
      Then 系統不回覆訂房相關訊息

    Example: 不包含關鍵字則不觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」
      When 會員發送訊息「你好」
      Then 系統不回覆訂房相關訊息

  Rule: 多組關鍵字為 OR 邏輯，任一匹配即觸發

    Example: 多組關鍵字任一匹配觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」「預約」「價格」
      And 回應內容為「請撥打訂房專線 02-12345678」
      When 會員發送訊息「價格」
      Then 系統自動回覆「請撥打訂房專線 02-12345678」

    Example: 多組關鍵字不同關鍵字都能觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」「預約」「booking」
      And 回應內容為「請撥打訂房專線 02-12345678」
      When 會員發送訊息「booking」
      Then 系統自動回覆「請撥打訂房專線 02-12345678」

    Example: 多組關鍵字皆未匹配則不觸發
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」「預約」「價格」
      When 會員發送訊息「你好」
      Then 系統不自動回覆該訊息

  Rule: 觸發的關鍵字會記錄於後台

    Example: 記錄觸發的關鍵字
      Given 系統中存在關鍵字觸發訊息，關鍵字為「優惠」
      When 會員發送訊息「優惠」
      Then 系統記錄觸發關鍵字「優惠」

    Example: 記錄觸發關鍵字時包含觸發時間
      Given 系統中存在關鍵字觸發訊息，關鍵字為「訂房」
      When 會員於「2025-11-19 14:30」發送訊息「訂房」
      Then 系統記錄觸發關鍵字「訂房」
      And 系統記錄觸發時間為「2025-11-19 14:30」

    Example: 記錄觸發關鍵字時包含會員資訊
      Given 系統中存在關鍵字觸發訊息，關鍵字為「價格」
      When 會員「張小明」發送訊息「價格」
      Then 系統記錄觸發關鍵字「價格」
      And 系統記錄觸發會員為「張小明」

  Rule: 關鍵字透過關聯表管理（AutoResponseKeyword）

    Example: 新增關鍵字建立關聯記錄
      Given 使用者正在建立自動回應「訂房諮詢」
      When 使用者輸入關鍵字「訂房」「預約」「價格」
      Then 系統為自動回應「訂房諮詢」建立 3 筆關鍵字關聯記錄
        | keyword_text | match_type | is_enabled |
        | 訂房         | 完全匹配   | true       |
        | 預約         | 完全匹配   | true       |
        | 價格         | 完全匹配   | true       |

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
      When 會員發送訊息「訂房」觸發關鍵字「訂房」
      Then 系統將關鍵字「訂房」的 trigger_count 更新為 6
      And 更新 last_triggered_at 為當前時間

    Example: 僅更新實際觸發的關鍵字統計
      Given 自動回應「訂房諮詢」存在關鍵字「訂房」「預約」「價格」
      When 會員發送訊息「價格」觸發關鍵字「價格」
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

  Rule: 支援自動回應訊息的啟用/停用

    Example: 停用自動回應訊息的關鍵字不參與比對
      Given 自動回應「訂房諮詢」存在關鍵字「訂房」（is_enabled = true）
      When 使用者停用自動回應訊息的關鍵字「訂房」
      Then 系統將關鍵字「訂房」的 is_enabled 更新為 false
      When 會員發送訊息「訂房」
      Then 系統不觸發自動回應「訂房諮詢」

    Example: 停用自動回應的訊息，則關鍵字不刪除記錄
      Given 自動回應的訊息「訂房諮詢」存在關鍵字「訂房」
      And 關鍵字「訂房」的 trigger_count 為 15 次
      When 使用者停用自動回應的該則訊息「訂房諮詢」
      Then 關鍵字「訂房」的關聯記錄仍保留在資料庫
      And 觸發統計資訊（trigger_count = 15）不變

    Example: 重新啟用關鍵字恢復比對
      Given 自動回應「訂房諮詢」存在關鍵字「訂房」（is_enabled = false）
      When 使用者重新啟用關鍵字「訂房」
      Then 系統將關鍵字「訂房」的 is_enabled 更新為 true
      When 會員發送訊息「訂房」
      Then 系統觸發自動回應「訂房諮詢」

  Rule: 會員 GPT 自動回應開關（Member.gpt_enabled）

    Example: 關閉後不觸發 GPT，自動回應 (keyword/welcome/time) 照常
      Given 會員「王小明」的 gpt_enabled = false
      And 會員發送訊息「訂房」
      And 系統中存在 GPT 自動回應流程與關鍵字自動回應規則
      When 系統處理訊息
      Then 系統跳過 GPT 自動回應（不呼叫 GPT 模型）
      And 系統仍可觸發關鍵字/歡迎/指定時間等其他自動回應
      And 聊天室訊息來源標註正常（若有觸發其他自動回應）

  Rule: 支援事先設定訊息回應內容，觸發方式：選擇指定時間觸發

    Example: 設定指定時間觸發訊息
      Given 使用者正在建立自動回應
      When 使用者選擇觸發方式「指定時間觸發」
      Then 系統設定觸發類型為「指定時間觸發」

    Example: 指定時間觸發訊息自動回應
      Given 系統中存在指定時間觸發訊息，時間區間為「18:00」到「09:00」
      And 回應內容為「目前為非營業時間，請於 09:00 後來電」
      When 會員於「20:30」發送訊息「還有房間嗎？」
      Then 系統自動回覆「目前為非營業時間，請於 09:00 後來電」

    Example: 指定時間觸發訊息停用時不回應
      Given 系統中存在指定時間觸發訊息，時間區間為「18:00」到「09:00」
      And 該自動回應狀態為「停用」
      When 會員於「20:30」發送訊息「還有房間嗎？」
      Then 系統不自動回覆

  Rule: 指定時間觸發可選擇指定日期區間

    Example: 設定指定日期區間
      Given 使用者正在設定指定時間觸發訊息
      When 使用者設定日期區間「2025/02/01」到「2025/02/28」
      Then 系統記錄日期區間「2025/02/01」到「2025/02/28」

    Example: 設定指定日期區間（活動期間）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者設定日期區間「2025/01/25」到「2025/01/31」
      And 使用者設定回應內容「春節特價活動進行中！」
      Then 系統記錄日期區間「2025/01/25」到「2025/01/31」
      And 會員在此期間發送訊息時觸發自動回應

    Example: 日期區間外不觸發
      Given 系統中存在指定時間觸發訊息，日期區間為「2025/02/01」到「2025/02/28」
      When 會員於「2025/03/01」發送訊息
      Then 系統不觸發該指定時間自動回應

  Rule: 指定時間觸發可選擇指定時間區間

    Example: 設定指定時間區間（非營業時間段）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者設定時間區間「18:00」到「09:00」
      Then 系統記錄 time_range_start 為「18:00」
      And 系統記錄 time_range_end 為「09:00」

    Example: 設定指定時間區間（營業時間段）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者設定時間區間「09:00」到「18:00」
      Then 系統記錄 time_range_start 為「09:00」
      And 系統記錄 time_range_end 為「18:00」
      And 系統判斷為非跨日時間區間

    Example: 設定指定時間區間（午休時段）
      Given 使用者正在設定指定時間觸發訊息
      When 使用者設定時間區間「12:00」到「13:30」
      And 使用者設定回應內容「目前為午休時間，13:30 後恢復服務」
      Then 系統記錄 time_range_start 為「12:00」
      And 系統記錄 time_range_end 為「13:30」

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

  Rule: 觸發衝突優先順序（單一事件僅回覆一條規則）

    Example: 關鍵字優先於指定時間
      Given 系統中存在關鍵字觸發訊息「訂房」，回應內容為「請撥打 02-12345678」
      And 系統中存在指定時間觸發訊息（18:00-09:00），回應內容為「目前為非營業時間」
      When 會員於「20:00」發送訊息「訂房」
      Then 系統僅回覆關鍵字訊息「請撥打 02-12345678」
      And 指定時間觸發記錄為「已忽略（同事件已有高優先回應）」

    Example: 指定時間優先於歡迎訊息
      Given 會員「王小明」在「20:00」加入好友並立刻發送訊息「哈囉」
      And 系統存在指定時間觸發訊息（18:00-09:00），回應內容為「目前非營業時間」
      Then 系統回覆指定時間訊息
      And 不再發送歡迎訊息，僅紀錄歡迎訊息被略過

    Example: 同一層多筆時取建立最早的規則
      Given 系統存在兩條關鍵字觸發訊息，皆關鍵字「訂房」
        | 名稱         | 建立時間          | 回應內容             |
        | 訂房諮詢 A   | 2025/01/10 10:00 | 請撥打 02-12345678   |
        | 訂房諮詢 B   | 2025/01/12 09:00 | 歡迎於網站預約       |
      When 會員發送訊息「訂房」
      Then 系統回覆「訂房諮詢 A」的內容
      And 「訂房諮詢 B」標記為「同層既有較早規則，未觸發」

    Example: 優先順序固定
      Given 系統定義優先順序：關鍵字 > 指定時間 > 歡迎訊息
      When 會員事件同時符合多個類型
      Then 系統僅回覆優先序最高的一條訊息
      And 其餘符合條件的規則記錄於後台日誌供營運檢視


  Rule: 被動回應模式：會員發送訊息時，系統判斷當前時間是否在設定範圍內，符合則回應

    Example: 非營業時間自動回覆
      Given 系統中存在自動回應，觸發類型為「指定時間觸發」
      And 時間區間為「18:00」到「09:00」
      And 回應內容為「目前為非營業時間，請於 09:00 後來電，謝謝！」
      When 會員於「20:00」發送訊息「還有房間嗎？」
      Then 系統自動回覆「目前為非營業時間，請於 09:00 後來電，謝謝！」

    Example: 時間範圍外不回應
      Given 系統中存在自動回應，觸發類型為「指定時間觸發」
      And 時間區間為「18:00」到「09:00」
      When 會員於「10:00」發送訊息「還有房間嗎？」
      Then 系統不自動回覆該訊息

    Example: 多個會員在時間範圍內發訊息都回應
      Given 系統中存在自動回應，觸發類型為「指定時間觸發」
      And 時間區間為「18:00」到「09:00」
      And 回應內容為「目前為非營業時間，請於 09:00 後來電」
      When 會員「張小明」於「20:00」發送訊息「你好」
      And 會員「李小華」於「21:00」發送訊息「請問」
      Then 系統分別回覆兩位會員「目前為非營業時間，請於 09:00 後來電」

  Rule: 訊息回應格式以純文字為主

    Example: 設定純文字回應內容
      Given 使用者正在設定自動回應訊息
      When 使用者輸入純文字「感謝您的詢問，我們將盡快回覆」
      Then 系統記錄回應內容「感謝您的詢問，我們將盡快回覆」

    Example: 設定包含換行的純文字回應
      Given 使用者正在設定自動回應訊息
      When 使用者輸入純文字回應內容
        """
        感謝您的詢問！

        營業時間：09:00-18:00
        訂房專線：02-12345678
        """
      Then 系統記錄包含換行格式的回應內容

    Example: 設定純文字回應長度限制
      Given 使用者正在設定自動回應訊息
      When 使用者輸入超過 5000 字的純文字
      Then 系統顯示錯誤訊息「訊息內容不可超過 5000 字」
      And 拒絕儲存

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

    Example: 刪除訊息後 response_count 更新
      Given 使用者已新增 3 筆訊息
      And AutoResponse.response_count 為 3
      When 使用者刪除第 2 筆訊息
      Then 系統刪除對應的 AutoResponseMessage 記錄
      And 系統更新 AutoResponse.response_count 為 2

  Rule: 自動回應訊息數量限制（至少 1 筆，最多 5 筆）

    Example: UI 互動方式為逐筆新增
      Given 使用者正在建立自動回應
      When 使用者查看訊息設定區
      Then 系統顯示「+ 新增訊息」按鈕
      And 每筆訊息可獨立編輯、刪除
      And 訊息數量顯示為「已新增 X / 最多 5 筆」

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
      And 「+ 新增訊息」按鈕變為不可點擊狀態

    Example: 使用「+ 新增訊息」按鈕新增訊息
      Given 使用者已新增 2 筆訊息
      When 使用者點擊「+ 新增訊息」按鈕
      Then 系統新增一個空白訊息欄位
      And sequence_order 自動設定為 3
      And 訊息數量更新為「已新增 3 / 最多 5 筆」

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

    Example: 編輯第三筆訊息內容不影響順序
      Given 使用者已新增 3 筆訊息
      When 使用者編輯第 3 筆訊息內容為「期待為您服務！」
      Then 系統更新該訊息的 message_content
      And sequence_order 保持為 3
      And 其他訊息順序不變

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

    Example: 拖曳第一筆訊息至最後
      Given 使用者已新增 4 筆訊息（順序: A, B, C, D）
      When 使用者將「訊息 A」拖曳至第 4 位
      Then 系統更新 sequence_order 為（順序: B, C, D, A）
      And 新順序為 1=B, 2=C, 3=D, 4=A

    Example: 拖曳中間訊息至中間位置
      Given 使用者已新增 5 筆訊息（順序: A, B, C, D, E）
      When 使用者將「訊息 C」拖曳至第 2 位
      Then 系統更新 sequence_order 為（順序: A, C, B, D, E）
      And 新順序為 1=A, 2=C, 3=B, 4=D, 5=E

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

    Example: 僅一筆訊息時立即發送
      Given 自動回應設定包含 1 筆訊息「感謝您的詢問」
      When 觸發條件滿足
      Then 系統立即發送訊息「感謝您的詢問」
      And 不延遲

    Example: 發送過程中若某筆失敗則記錄錯誤
      Given 自動回應設定包含 3 筆訊息
      When 觸發條件滿足並開始依序發送
      And 第 2 筆訊息發送失敗（LINE API 錯誤）
      Then 系統記錄第 2 筆訊息發送失敗
      And 系統繼續嘗試發送第 3 筆訊息

  Rule: 支援新增自動回應訊息

    Example: 新增自動回應訊息
      Given 使用者已設定 2 筆自動回應訊息
      When 使用者新增第 3 筆自動回應訊息「價格查詢請訪問官網」
      Then 系統新增自動回應訊息「價格查詢請訪問官網」

    Example: 新增自動回應訊息包含關鍵字
      Given 使用者正在建立新的自動回應訊息
      When 使用者選擇觸發方式「關鍵字觸發」
      And 使用者輸入關鍵字「優惠」「折扣」
      And 使用者輸入回應內容「目前春節優惠 8 折！」
      Then 系統新增自動回應訊息「春節優惠」
      And 系統建立 2 筆關鍵字關聯記錄

    Example: 新增自動回應訊息包含時間區間
      Given 使用者正在建立新的自動回應訊息
      When 使用者選擇觸發方式「指定時間觸發」
      And 使用者設定時間區間「18:00-09:00」
      And 使用者輸入回應內容「目前為非營業時間」
      Then 系統新增自動回應訊息「非營業時間回覆」
      And 系統記錄時間區間設定

  Rule: 支援刪除自動回應訊息

    Example: 刪除自動回應訊息
      Given 系統中存在自動回應訊息「測試訊息」
      When 使用者刪除自動回應訊息「測試訊息」
      Then 系統移除自動回應訊息「測試訊息」

    Example: 刪除自動回應訊息同時刪除關聯資料
      Given 系統中存在自動回應訊息「訂房諮詢」
      And 該訊息有 3 筆關鍵字關聯記錄
      And 該訊息有 2 筆訊息內容記錄
      When 使用者刪除自動回應訊息「訂房諮詢」
      Then 系統同時刪除該訊息的所有關鍵字關聯記錄
      And 系統同時刪除該訊息的所有訊息內容記錄

    Example: 刪除自動回應訊息前確認
      Given 系統中存在自動回應訊息「歡迎訊息」
      When 使用者點擊刪除按鈕
      Then 系統顯示確認對話框「確定要刪除此自動回應訊息嗎？刪除後無法復原」
      When 使用者確認刪除
      Then 系統移除該自動回應訊息

  Rule: 支援發送前的效果即時預覽

    Example: 前端模擬即時預覽自動回應訊息
      Given 使用者正在建立自動回應訊息
      When 使用者輸入訊息文字「歡迎加入，{好友的顯示名稱}！」
      Then 系統使用 LINE Simulator 在網頁上即時渲染預覽
      And 預覽區顯示訊息內容，變數標籤以特殊格式突出顯示

    Example: 即時預覽多筆訊息
      Given 使用者正在建立自動回應訊息
      And 使用者已新增 3 筆訊息
      When 使用者點擊「預覽」按鈕
      Then 系統依序顯示 3 筆訊息的預覽效果
      And 模擬訊息發送的時間間隔（1-2 秒）

    Example: 即時預覽顯示實際效果
      Given 使用者正在建立自動回應訊息
      When 使用者輸入訊息「感謝您的詢問！\n\n營業時間：09:00-18:00」
      Then 系統預覽區顯示包含換行的訊息效果
      And 預覽樣式與 LINE 實際顯示一致

  Rule: 設定完成後，可選擇停用該訊息

    Example: 停用自動回應訊息
      Given 系統中存在自動回應訊息「歡迎訊息」，狀態為「啟用」
      When 使用者停用訊息「歡迎訊息」
      Then 系統設定訊息「歡迎訊息」狀態為「停用」

    Example: 批次停用多筆自動回應訊息
      Given 系統中存在以下自動回應訊息
        | message_name | is_enabled |
        | 歡迎訊息     | true       |
        | 訂房諮詢     | true       |
        | 營業時間     | true       |
      When 使用者選擇「歡迎訊息」「訂房諮詢」並批次停用
      Then 系統將這 2 筆訊息狀態設定為「停用」
      And 「營業時間」訊息狀態保持「啟用」

  Rule: 停用則不啟動觸發

    Example: 停用的訊息不觸發
      Given 系統中存在關鍵字觸發訊息「訂房回覆」，關鍵字為「訂房」，狀態為「停用」
      When 會員發送訊息「我想訂房」
      Then 系統不觸發自動回應

    Example: 停用歡迎訊息不觸發
      Given 系統中存在歡迎訊息「新會員歡迎」，狀態為「停用」
      When 新會員加入 LINE 官方帳號
      Then 系統不觸發歡迎訊息

  Rule: 設定完成後，可選擇刪除該訊息

    Example: 刪除自動回應訊息
      Given 系統中存在自動回應訊息「舊活動」
      When 使用者刪除訊息「舊活動」
      Then 系統移除訊息「舊活動」

    Example: 刪除自動回應訊息更新清單
      Given 系統中存在 5 筆自動回應訊息
      When 使用者刪除其中 2 筆訊息
      Then 系統顯示剩餘 3 筆自動回應訊息
      And 清單即時更新

  Rule: 刪除則無法復原需重新設定

    Example: 刪除後無法復原
      Given 系統中存在自動回應訊息「過期優惠」
      When 使用者刪除訊息「過期優惠」
      Then 系統中不存在訊息「過期優惠」

    Example: 誤刪後需重新建立
      Given 使用者誤刪自動回應訊息「重要通知」
      When 使用者嘗試復原該訊息
      Then 系統無法復原已刪除訊息
      And 使用者需重新建立相同內容的自動回應

    Example: 刪除前系統顯示警告訊息
      Given 系統中存在自動回應訊息「春節活動」
      When 使用者點擊刪除按鈕
      Then 系統顯示警告訊息「確定要刪除此自動回應訊息嗎？刪除後無法復原」
      And 提供「取消」與「確定刪除」選項

  Rule: 設定完成後，可編輯該訊息內容

    Example: 編輯自動回應訊息內容
      Given 系統中存在自動回應訊息「營業時間回覆」，內容為「營業時間：09:00-18:00」
      When 使用者編輯訊息內容為「營業時間：10:00-20:00」
      Then 系統更新訊息內容為「營業時間：10:00-20:00」

    Example: 編輯自動回應訊息關鍵字
      Given 系統中存在關鍵字觸發訊息「訂房諮詢」，關鍵字為「訂房」「預約」
      When 使用者編輯關鍵字，新增「booking」
      Then 系統將關鍵字更新為「訂房」「預約」「booking」

    Example: 編輯自動回應訊息時間區間
      Given 系統中存在指定時間觸發訊息，時間區間為「18:00-09:00」
      When 使用者編輯時間區間為「20:00-08:00」
      Then 系統更新時間區間為「20:00-08:00」

  Rule: 用戶下次觸發時啟用更新後的內容

    Example: 觸發時使用更新後的內容
      Given 系統中存在關鍵字觸發訊息，關鍵字為「營業時間」
      And 訊息內容已更新為「營業時間：10:00-20:00」
      When 會員發送訊息「請問營業時間」
      Then 系統回覆「營業時間：10:00-20:00」

    Example: 編輯後立即生效
      Given 系統中存在關鍵字觸發訊息，回應內容為「舊內容」
      When 使用者編輯回應內容為「新內容」
      And 使用者儲存變更
      And 會員立即發送觸發關鍵字
      Then 系統回覆「新內容」（非「舊內容」）

    Example: 編輯未儲存時使用原內容
      Given 系統中存在關鍵字觸發訊息，回應內容為「原始內容」
      When 使用者開始編輯回應內容為「修改內容」
      And 使用者未儲存變更
      And 會員發送觸發關鍵字
      Then 系統回覆「原始內容」（編輯未生效）

  Rule: 於訊息外部可查看訊息的停用/啟用狀態

    Example: 查看訊息啟用狀態
      Given 系統中存在自動回應訊息「歡迎訊息」，狀態為「啟用」
      When 使用者查看自動回應訊息清單
      Then 系統顯示訊息「歡迎訊息」的狀態為「啟用」

    Example: 查看訊息清單顯示混合狀態
      Given 系統中存在以下自動回應訊息
        | message_name     | is_enabled |
        | 歡迎訊息         | true       |
        | 訂房諮詢         | false      |
        | 非營業時間回覆   | true       |
        | 春節優惠         | false      |
      When 使用者查看自動回應訊息清單
      Then 系統顯示「歡迎訊息」狀態為「啟用」
      And 系統顯示「訂房諮詢」狀態為「停用」
      And 系統顯示「非營業時間回覆」狀態為「啟用」
      And 系統顯示「春節優惠」狀態為「停用」

    Example: 快速切換訊息狀態
      Given 系統中存在自動回應訊息「訂房諮詢」，狀態為「啟用」
      When 使用者在清單中點擊狀態切換按鈕
      Then 系統將訊息狀態切換為「停用」
      And 清單即時更新顯示「停用」狀態

  Rule: 於訊息外部可查看回應類型：歡迎訊息

    Example: 查看回應類型為歡迎訊息
      Given 系統中存在自動回應訊息「新會員歡迎」，回應類型為「歡迎訊息」
      When 使用者查看自動回應訊息清單
      Then 系統顯示訊息「新會員歡迎」的回應類型為「歡迎訊息」

    Example: 查看回應類型顯示圖示
      Given 系統中存在自動回應訊息「新會員歡迎」，回應類型為「歡迎訊息」
      When 使用者查看自動回應訊息清單
      Then 系統顯示該訊息的回應類型圖示「歡迎訊息」
      And 圖示顏色為藍色，區別其他類型

    Example: 歡迎訊息類型僅顯示一個
      Given 系統中存在 2 筆歡迎訊息「新會員歡迎 A」和「新會員歡迎 B」
      When 使用者查看自動回應訊息清單
      Then 系統顯示 2 筆歡迎訊息
      And 每筆訊息的回應類型都標示為「歡迎訊息」

  Rule: 於訊息外部可查看回應類型：關鍵字

    Example: 查看回應類型為關鍵字
      Given 系統中存在自動回應訊息「訂房諮詢」，回應類型為「關鍵字」
      When 使用者查看自動回應訊息清單
      Then 系統顯示訊息「訂房諮詢」的回應類型為「關鍵字」

    Example: 查看關鍵字類型顯示關鍵字數量
      Given 系統中存在自動回應訊息「訂房諮詢」，回應類型為「關鍵字」
      And 該訊息有 5 組關鍵字
      When 使用者查看自動回應訊息清單
      Then 系統顯示該訊息的回應類型為「關鍵字 (5)」

    Example: 查看關鍵字類型顯示前三個關鍵字預覽
      Given 系統中存在自動回應訊息「訂房諮詢」，回應類型為「關鍵字」
      And 該訊息關鍵字為「訂房」「預約」「booking」「價格」「房型」
      When 使用者查看自動回應訊息清單
      Then 系統顯示關鍵字預覽「訂房, 預約, booking...」
      And 顯示總數「(5)」

  Rule: 於訊息外部可查看回應類型：指定時間

    Example: 查看回應類型為指定時間
      Given 系統中存在自動回應訊息「非營業時間回覆」，回應類型為「指定時間」
      When 使用者查看自動回應訊息清單
      Then 系統顯示訊息「非營業時間回覆」的回應類型為「指定時間」

    Example: 查看指定時間類型顯示時間區間
      Given 系統中存在自動回應訊息「非營業時間回覆」，回應類型為「指定時間」
      And 時間區間為「18:00-09:00」
      When 使用者查看自動回應訊息清單
      Then 系統顯示該訊息的回應類型為「指定時間 (18:00-09:00)」

    Example: 查看指定時間類型顯示日期區間
      Given 系統中存在自動回應訊息「春節活動」，回應類型為「指定時間」
      And 日期區間為「2025-02-01 至 2025-02-28」
      When 使用者查看自動回應訊息清單
      Then 系統顯示該訊息的回應類型為「指定時間」
      And 顯示日期區間「2025-02-01 至 2025-02-28」

  Rule: 觸發類型支援動態擴充（可透過設定檔管理）

    Example: 初始觸發類型清單
      Given 系統初始化時載入觸發類型設定
      When 管理員查看可用的觸發類型選項
      Then 系統顯示以下初始觸發類型
        | trigger_code        | trigger_name       | description                            |
        | welcome_message     | 歡迎訊息     | 會員加入好友時自動觸發歡迎訊息         |
        | keyword_trigger     | 關鍵字觸發         | 會員訊息包含關鍵字時自動回應           |
        | scheduled_trigger   | 指定時間觸發       | 特定時間或日期區間內觸發訊息           |

    Example: 新增自定義觸發類型
      Given 系統管理員需要新增「會員生日觸發」類型
      When 管理員在設定檔中新增觸發類型
        | trigger_code     | trigger_name   | description                  |
        | birthday_trigger | 會員生日觸發   | 會員生日當天自動發送祝福訊息 |
      And 系統重新載入設定
      Then 使用者可選擇「會員生日觸發」作為觸發方式

    Example: 停用特定觸發類型
      Given 系統中存在「指定時間觸發」類型
      When 管理員在設定檔中將該觸發類型標記為停用
      And 系統重新載入設定
      Then 使用者無法選擇「指定時間觸發」作為觸發方式
      And 已存在的「指定時間觸發」訊息仍可正常運作

    Example: 查看所有觸發類型配置
      Given 系統載入觸發類型設定檔
      When 管理員查看觸發類型配置
      Then 系統顯示所有觸發類型的詳細資訊
        | trigger_code        | trigger_name   | is_enabled | priority |
        | welcome_message     | 歡迎訊息       | true       | 1        |
        | keyword_trigger     | 關鍵字觸發     | true       | 2        |
        | scheduled_trigger   | 指定時間觸發   | true       | 3        |

  Rule: 多個自動回應同時觸發時的優先順序規則（方案 A：固定優先順序，僅執行第一個）

    觸發機制說明：
      - 歡迎訊息（welcome_message）：會員加入好友時立即觸發，與其他觸發類型不衝突（獨立觸發）
      - 關鍵字觸發（keyword_trigger）vs 指定時間觸發（scheduled_trigger）：會員發送訊息時同時檢查

    優先順序定義（僅適用於會員發送訊息時）：
      1. 關鍵字觸發（keyword_trigger）- 最高優先（有命中關鍵字就回）；同類型只比較 updated_at（最新者勝出）
      2. 指定時間觸發（scheduled_trigger）- 次優先（關鍵字未命中時才檢查時間）；不與關鍵字併發

    排序邏輯：
      - 第一層排序：trigger_type（關鍵字 > 時間）
      - 第二層排序（同 trigger_type 時）：updated_at DESC（同類型時，最後更新的優先）
      - 執行策略：僅執行優先順序最高的 1 則自動回應

    Example: 新好友加入並發送關鍵字 - 歡迎訊息與關鍵字都執行（不衝突）
      Given 系統中存在以下自動回應
        | trigger_type      | trigger_condition | response_content                  | created_at       |
        | welcome_message   | -                 | 歡迎加入飯店！                    | 2025/01/01 10:00 |
        | keyword_trigger   | 你好              | 您好，有什麼可以幫您的嗎？        | 2025/01/01 11:00 |
      When 新會員加入好友時
      Then 系統立即觸發「歡迎訊息」自動回應
      When 新會員發送訊息「你好」
      Then 系統檢查關鍵字觸發，命中關鍵字「你好」
      And 系統執行「關鍵字觸發」自動回應
      And 歡迎訊息與關鍵字回應皆會發送（不衝突）

    Example: 關鍵字觸發與時間觸發同時滿足 - 僅執行關鍵字觸發
      Given 系統中存在以下自動回應
        | trigger_type      | trigger_condition        | response_content                  | created_at       |
        | scheduled_trigger | 18:00-09:00              | 目前為非營業時間，請稍後再聯繫    | 2025/01/01 10:00 |
        | keyword_trigger   | 訂房                     | 請撥打訂房專線 02-12345678        | 2025/01/01 11:00 |
      When 會員於「20:00」發送訊息「訂房」
      Then 系統觸發 2 個自動回應（關鍵字 + 時間觸發）
      And 系統按優先順序排序：關鍵字（priority 1）> 時間（priority 2）
      And 系統僅執行「關鍵字觸發」自動回應（有命中關鍵字就回）
      And 系統不執行「指定時間觸發」自動回應

    Example: 關鍵字未命中但時間觸發滿足 - 執行時間觸發
      Given 系統中存在以下自動回應
        | trigger_type      | trigger_condition        | response_content                  | created_at       |
        | scheduled_trigger | 18:00-09:00              | 目前為非營業時間，請稍後再聯繫    | 2025/01/01 10:00 |
        | keyword_trigger   | 訂房                     | 請撥打訂房專線 02-12345678        | 2025/01/01 11:00 |
      When 會員於「20:00」發送訊息「還有房間嗎」
      Then 系統檢查關鍵字觸發，未命中任何關鍵字
      And 系統檢查時間觸發，當前時間「20:00」在區間「18:00-09:00」內
      And 系統執行「指定時間觸發」自動回應
      And 系統回覆「目前為非營業時間，請稍後再聯繫」

    Example: 同類型多個關鍵字觸發 - 執行最後更新的
      Given 系統中存在以下自動回應
        | trigger_type      | trigger_condition | response_content      | created_at       | updated_at       | is_enabled |
        | keyword_trigger   | 訂房              | 回應 A：訂房資訊 A    | 2025/01/01 10:00 | 2025/01/02 09:00 | true       |
        | keyword_trigger   | 訂房              | 回應 B：訂房資訊 B    | 2025/01/01 11:00 | 2025/01/02 14:00 | true       |
        | keyword_trigger   | 訂房              | 回應 C：訂房資訊 C    | 2025/01/01 12:00 | 2025/01/02 12:00 | true       |
      When 會員發送訊息「訂房」
      Then 系統觸發 3 個關鍵字自動回應
      And 系統按 updated_at DESC 排序：回應 B（最新）> 回應 C > 回應 A
      And 系統僅執行「回應 B：訂房資訊 B」（最新更新）
      And 系統不執行其他關鍵字回應

    Example: 僅一個自動回應觸發 - 正常執行
      Given 系統中存在以下自動回應
        | trigger_type      | trigger_condition | response_content              | created_at       |
        | keyword_trigger   | 優惠              | 目前優惠活動：春節特價 8 折    | 2025/01/01 10:00 |
      When 會員發送訊息「請問有優惠嗎」
      Then 系統觸發 1 個自動回應（關鍵字）
      And 系統執行「關鍵字觸發」自動回應
      And 系統回覆「目前優惠活動：春節特價 8 折」

    Example: 所有自動回應皆停用 - 不執行任何回應
      Given 系統中存在以下自動回應
        | trigger_type      | trigger_condition | response_content      | is_enabled |
        | welcome_message   | -                 | 歡迎訊息              | false      |
        | keyword_trigger   | 你好              | 關鍵字回應            | false      |
      When 新會員加入好友並發送訊息「你好」
      Then 系統檢查所有自動回應的 is_enabled 狀態
      And 系統不執行任何自動回應（所有回應皆已停用）

  Rule: 指定時間觸發的主動推播模式（scheduled_mode = 'active'）採用週期性執行 + 每日單次推播策略

    設計決策：
      - v0 階段採用簡化設計：每日於 time_range_start 時間點執行一次主動推播
      - 僅在符合 weekdays 條件的星期執行（週期性執行）
      - 目標對象為所有追蹤中的好友（LineFriend.is_following = true）
      - 實作去重機制：24 小時內已推播過的會員跳過，避免重複騷擾
      - 推播執行依賴排程任務（Cron Job）於指定時間觸發

    Example: 每日單次推播 - 週一至週五早上 09:00 推播早安訊息
      Given 自動回應設定如下
        | trigger_type      | scheduled_mode | time_range_start | weekdays      | response_content | is_enabled |
        | scheduled_trigger | active         | 09:00            | 1,2,3,4,5     | 早安！祝您有美好的一天 | true |
      And 當前日期為 2025-11-17（星期一）
      When 系統於 09:00 執行排程任務
      Then 系統檢查 weekdays 包含「1」（星期一）
      And 系統查詢所有 is_following = true 的 LINE 好友
      And 系統檢查 24 小時內未推播過的好友（去重機制）
      And 系統主動推播訊息「早安！祝您有美好的一天」給所有符合條件的好友
      And 系統記錄最後推播時間（用於去重）

    Example: 週期性執行 - 週六日跳過推播
      Given 自動回應設定如下
        | trigger_type      | scheduled_mode | time_range_start | weekdays      | response_content | is_enabled |
        | scheduled_trigger | active         | 09:00            | 1,2,3,4,5     | 早安！祝您有美好的一天 | true |
      And 當前日期為 2025-11-16（星期日）
      When 系統於 09:00 執行排程任務
      Then 系統檢查 weekdays 不包含「0」（星期日）
      And 系統跳過推播
      And 系統記錄日誌「Skipped: weekday not matched (Sunday)」

    Example: 去重機制 - 24 小時內已推播過的會員跳過
      Given 自動回應「每日早安訊息」於昨日 09:00 已推播給會員「王小明」
      And last_pushed_at 為「2025-11-16 09:00:00」
      And 當前時間為「2025-11-17 09:00:00」（24 小時後）
      When 系統執行今日推播任務
      Then 系統檢查會員「王小明」的 last_pushed_at 距今已超過 24 小時
      And 系統正常推播給會員「王小明」
      And 系統更新 last_pushed_at 為「2025-11-17 09:00:00」

    Example: 去重機制 - 24 小時內已推播過則跳過
      Given 自動回應「每日早安訊息」於今日 09:00 已推播給會員「李小華」
      And last_pushed_at 為「2025-11-17 09:00:00」
      And 系統因異常於 10:00 重新執行推播任務
      When 系統執行推播任務
      Then 系統檢查會員「李小華」的 last_pushed_at 距今未滿 24 小時
      And 系統跳過推播給會員「李小華」
      And 系統記錄日誌「Skipped: already pushed within 24 hours」

    Example: 目標對象 - 僅推播給追蹤中的好友
      Given line_friends 表中存在以下記錄
        | line_uid | is_following |
        | U111     | true         |
        | U222     | false        |
        | U333     | true         |
      When 系統執行主動推播任務
      Then 系統查詢 is_following = true 的好友
      And 系統推播給 U111 和 U333
      And 系統不推播給 U222（已取消追蹤）

    Example: 日期範圍限制 - 僅在 date_range 內執行
      Given 自動回應設定如下
        | scheduled_mode | time_range_start | date_range_start | date_range_end | is_enabled |
        | active         | 09:00            | 2025-11-01       | 2025-11-30     | true       |
      And 當前日期為 2025-11-17
      When 系統於 09:00 執行排程任務
      Then 系統檢查當前日期在 date_range 內（2025-11-01 至 2025-11-30）
      And 系統正常執行推播

    Example: 日期範圍限制 - 超出 date_range 跳過推播
      Given 自動回應設定如下
        | scheduled_mode | time_range_start | date_range_start | date_range_end | is_enabled |
        | active         | 09:00            | 2025-11-01       | 2025-11-30     | true       |
      And 當前日期為 2025-12-01
      When 系統於 09:00 執行排程任務
      Then 系統檢查當前日期超出 date_range（已過期）
      And 系統跳過推播
      And 系統記錄日誌「Skipped: date out of range」

    Example: API 配額不足時的錯誤處理
      Given 自動回應主動推播目標對象有 1000 人
      And LINE API 可用配額僅剩 500 則
      When 系統執行推播任務
      And 已成功推播 500 人
      And LINE API 回傳「配額不足（quota exhausted）」
      Then 系統立即停止推播
      And 系統記錄錯誤日誌「Auto-response push failed: quota exhausted, sent 500/1000」
      And 已推播的 500 人記錄保留
      And 未推播的 500 人不記錄 last_pushed_at（下次可重試）

  Rule: 被動回應模式（scheduled_mode = 'passive'）會員發訊息時判斷時間範圍

    Example: 被動模式 - 會員發訊息時判斷時間是否在範圍內
      Given 自動回應設定如下
        | trigger_type      | scheduled_mode | time_range_start | time_range_end | response_content | is_enabled |
        | scheduled_trigger | passive        | 18:00            | 09:00          | 目前為非營業時間 | true       |
      And 當前時間為 20:00
      When 會員發送訊息「你好」
      Then 系統檢查當前時間「20:00」在時間範圍「18:00-09:00」內
      And 系統回覆「目前為非營業時間」

    Example: 被動模式 - 會員發訊息時不在時間範圍內則不回應
      Given 自動回應設定如下
        | trigger_type      | scheduled_mode | time_range_start | time_range_end | response_content | is_enabled |
        | scheduled_trigger | passive        | 18:00            | 09:00          | 目前為非營業時間 | true       |
      And 當前時間為 10:00
      When 會員發送訊息「你好」
      Then 系統檢查當前時間「10:00」不在時間範圍「18:00-09:00」內
      And 系統不回應（營業時間內不觸發）

    Example: 被動模式 - 跨日時間區間的邊界測試
      Given 自動回應設定如下
        | trigger_type      | scheduled_mode | time_range_start | time_range_end | response_content | is_enabled |
        | scheduled_trigger | passive        | 18:00            | 09:00          | 目前為非營業時間 | true       |
      When 會員於「18:00」整點發送訊息「你好」
      Then 系統檢查當前時間「18:00」恰好等於 time_range_start
      And 系統觸發自動回應（包含邊界）
      When 會員於「09:00」整點發送訊息「早安」
      Then 系統檢查當前時間「09:00」恰好等於 time_range_end
      And 系統觸發自動回應（包含邊界）
