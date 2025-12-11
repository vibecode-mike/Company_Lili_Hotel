Feature: 會員標籤串接
  作為一位行銷人員
  我希望在整合其他平台資料時，可看到該會員的消費習慣，自動整合貼標
  以便後續規劃的廣告活動能鎖定更精準的受眾

  Rule: 會員標籤來源支援外部系統平台（CRM/PMS）串接

    Example: 外部系統串接後呈現命中的會員標籤
      Given 外部系統 PMS 回傳會員「張三」的消費紀錄
        | name | id_number | consumption_amount | room_type |
        | 張三 | A123456789 | 50000             | 商務房    |
      When 系統比對會員姓名「張三」和身分證「A123456789」
      Then 系統為會員「張三」新增以下標籤
        | tag_name | tag_source |
        | 商務房   | PMS        |

    Example: CRM 系統串接後呈現命中的會員標籤
      Given 外部系統 CRM 回傳會員「林美玲」的會員等級資料
        | name   | id_number  | member_level | total_points |
        | 林美玲 | E123456789 | 白金會員     | 15000        |
      When 系統比對會員姓名「林美玲」和身分證「E123456789」
      Then 系統為會員「林美玲」新增以下標籤
        | tag_name   | tag_source |
        | 白金會員   | CRM        |

    Example: 外部系統串接時會員資料不存在系統中
      Given 外部系統 PMS 回傳新會員「陳小明」的消費紀錄
        | name   | id_number  | consumption_amount | room_type |
        | 陳小明 | F987654321 | 30000              | 標準房    |
      When 系統比對會員資料時發現會員不存在
      Then 系統自動建立新會員「陳小明」並新增以下標籤
        | tag_name | tag_source |
        | 標準房   | PMS        |

  Rule: 會員標籤來源支援問券蒐集會員資料的模組

    Example: 問券蒐集後呈現命中的特徵標籤
      Given 問券系統回傳會員「李四」的資料
        | name | gender | age | region  | birthday_month |
        | 李四 | 男     | 28  | 台北市  | 8              |
      When 系統處理問券資料
      Then 系統為會員「李四」新增以下標籤
        | tag_name    | tag_source |
        | 男          | 問券       |
        | 26-35 歲    | 問券       |
        | 台北市      | 問券       |
        | 8月         | 問券       |

    Example: 問券蒐集部分資料為空時僅貼非空欄位標籤
      Given 問券系統回傳會員「陳小華」的資料
        | name   | gender | age | region | birthday_month |
        | 陳小華 | 女     | 45  |        | 12             |
      When 系統處理問券資料
      Then 系統為會員「陳小華」新增以下標籤
        | tag_name    | tag_source |
        | 女          | 問券       |
        | 36-45 歲    | 問券       |
        | 12月        | 問券       |

    Example: 問券蒐集年齡邊界值正確分類標籤
      Given 問券系統回傳會員「劉小明」的資料
        | name   | gender | age | region  | birthday_month |
        | 劉小明 | 男     | 26  | 新竹市  | 5              |
      When 系統處理問券資料
      Then 系統為會員「劉小明」新增以下標籤
        | tag_name    | tag_source |
        | 男          | 問券       |
        | 26-35 歲    | 問券       |
        | 新竹市      | 問券       |
        | 5月         | 問券       |

  Rule: 當外部平台回傳會員消費紀錄或屬性資料時，系統自動比對會員姓名、身分證（唯一值）並命中標籤

    Example: 系統自動比對會員並命中標籤
      Given 系統中存在會員「王五」，身分證「B987654321」
      And 外部系統 CRM 回傳消費紀錄
        | name | id_number  | consumption_amount |
        | 王五 | B987654321 | 80000              |
      When 系統比對會員資料
      Then 系統為會員「王五」新增標籤「高消費客戶」

    Example: 同名會員透過身分證唯一值正確比對
      Given 系統中存在兩位名為「王五」的會員
        | name | id_number  |
        | 王五 | B987654321 |
        | 王五 | C111222333 |
      And 外部系統 CRM 回傳消費紀錄
        | name | id_number  | consumption_amount |
        | 王五 | B987654321 | 80000              |
      When 系統比對會員資料
      Then 系統僅為身分證「B987654321」的會員「王五」新增標籤「高消費客戶」

    Example: 姓名或身分證不符時無法比對會員
      Given 系統中存在會員「王五」，身分證「B987654321」
      And 外部系統 CRM 回傳消費紀錄
        | name | id_number  | consumption_amount |
        | 王五 | X999888777 | 80000              |
      When 系統比對會員資料
      Then 系統無法比對到現有會員，不新增標籤

  Rule: 支援外部串接的標籤，命中可以是複數多個

    Example: 外部串接命中多個標籤
      Given 外部系統 PMS 回傳會員「趙六」的消費紀錄
        | name | id_number  | consumption_amount | room_type | visit_count |
        | 趙六 | C111222333 | 100000             | 雙人房    | 5           |
      When 系統比對會員資料並套用標籤規則
      Then 系統為會員「趙六」新增以下標籤
        | tag_name       | tag_source |
        | 雙人房         | PMS        |
        | 高消費客戶     | PMS        |
        | 常客           | PMS        |

    Example: CRM 系統串接命中多種會員屬性標籤
      Given 外部系統 CRM 回傳會員「黃志偉」的會員資料
        | name   | id_number  | member_level | total_points | birthday_coupon |
        | 黃志偉 | G555666777 | 鑽石會員     | 25000        | true            |
      When 系統比對會員資料並套用標籤規則
      Then 系統為會員「黃志偉」新增以下標籤
        | tag_name       | tag_source |
        | 鑽石會員       | CRM        |
        | 高積分會員     | CRM        |
        | 生日優惠       | CRM        |

    Example: 外部串接僅符合單一標籤條件
      Given 外部系統 PMS 回傳會員「楊小雯」的消費紀錄
        | name   | id_number  | consumption_amount | room_type | visit_count |
        | 楊小雯 | H888999000 | 15000              | 標準房    | 1           |
      When 系統比對會員資料並套用標籤規則
      Then 系統為會員「楊小雯」新增以下標籤
        | tag_name | tag_source |
        | 標準房   | PMS        |

  Rule: 支援外部串接的標籤自動產生邏輯須支援自訂條件，如今年消費金額達指定門檻

    Example: 管理員設定消費金額門檻後自動貼標
      Given 管理員設定標籤規則「高消費客戶」，觸發條件為「累積消費 >= 50000 元」
      And 外部系統 PMS 回傳會員「張三」的消費紀錄，累積消費「80000 元」
      When 系統套用標籤規則
      Then 系統為會員「張三」新增標籤「高消費客戶」

    Example: 會員消費金額正好達到門檻邊界值
      Given 管理員設定標籤規則「高消費客戶」，觸發條件為「累積消費 >= 50000 元」
      And 外部系統 PMS 回傳會員「吳小芬」的消費紀錄，累積消費「50000 元」
      When 系統套用標籤規則
      Then 系統為會員「吳小芬」新增標籤「高消費客戶」

    Example: 會員消費金額未達門檻不自動貼標
      Given 管理員設定標籤規則「高消費客戶」，觸發條件為「累積消費 >= 50000 元」
      And 外部系統 PMS 回傳會員「蔡小華」的消費紀錄，累積消費「45000 元」
      When 系統套用標籤規則
      Then 系統不為會員「蔡小華」新增標籤「高消費客戶」

  Rule: 支援外部串接的標籤自動產生邏輯須支援自訂條件，如消費依房型分類

    Example: 管理員設定房型分類條件後自動貼標
      Given 管理員設定標籤規則「豪華套房愛好者」，觸發條件為「房型 = 豪華套房」
      And 外部系統 PMS 回傳會員「李四」的消費紀錄，房型「豪華套房」
      When 系統套用標籤規則
      Then 系統為會員「李四」新增標籤「豪華套房愛好者」

    Example: 管理員設定多個房型分類條件自動貼對應標籤
      Given 管理員設定以下標籤規則
        | tag_name         | condition         |
        | 商務房愛好者     | 房型 = 商務房     |
        | 標準房愛好者     | 房型 = 標準房     |
      And 外部系統 PMS 回傳會員「周美玲」的消費紀錄，房型「標準房」
      When 系統套用標籤規則
      Then 系統為會員「周美玲」新增標籤「標準房愛好者」

    Example: 會員房型不符合任何規則不自動貼標
      Given 管理員設定標籤規則「豪華套房愛好者」，觸發條件為「房型 = 豪華套房」
      And 外部系統 PMS 回傳會員「林志明」的消費紀錄，房型「經濟房」
      When 系統套用標籤規則
      Then 系統不為會員「林志明」新增標籤「豪華套房愛好者」

  Rule: 標籤規則於事件到達時即時計算（無批次延遲）

    Example: 消費紀錄寫入後立即貼標
      Given 管理員設定標籤規則「高消費客戶」，觸發條件為「累積消費 >= 50000 元」
      And 會員「王小明」目前累積消費為 48000 元
      When PMS 同步一筆消費紀錄「+3000 元」寫入系統
      Then 系統於同一交易即時計算累積消費 = 51000 元
      And 系統立即貼上標籤「高消費客戶」
      And 標籤統計（trigger_count / trigger_member_count / last_triggered_at）即時更新

    Example: 互動事件即時貼標
      Given 訊息模板設定互動標籤「雙十優惠」
      And 會員「李小華」點擊該訊息的追蹤連結
      When 系統接收點擊事件
      Then 系統於事件處理流程中直接新增互動標籤「雙十優惠」（不排隊、不批次）
      And 若同會員同標籤已有記錄，則依 unique 規則不重複新增


  Rule: 支援問券蒐集會員資料的模組，命中可以是複數多個

    Example: 問券蒐集命中多個標籤
      Given 問券系統回傳會員「錢七」的資料
        | name | gender | age | region  | birthday_month |
        | 錢七 | 女     | 32  | 新北市  | 10             |
      When 系統處理問券資料
      Then 系統為會員「錢七」新增以下標籤
        | tag_name    | tag_source |
        | 女          | 問券       |
        | 26-35 歲    | 問券       |
        | 新北市      | 問券       |
        | 10月        | 問券       |

    Example: 問券蒐集完整資料命中所有可能標籤
      Given 問券系統回傳會員「許志豪」的資料
        | name   | gender | age | region  | birthday_month |
        | 許志豪 | 男     | 52  | 台南市  | 3              |
      When 系統處理問券資料
      Then 系統為會員「許志豪」新增以下標籤
        | tag_name    | tag_source |
        | 男          | 問券       |
        | 46-55 歲    | 問券       |
        | 台南市      | 問券       |
        | 3月         | 問券       |

    Example: 問券蒐集最少資料僅命中單一標籤
      Given 問券系統回傳會員「謝小美」的資料
        | name   | gender | age | region | birthday_month |
        | 謝小美 | 女     |     |        |                |
      When 系統處理問券資料
      Then 系統為會員「謝小美」新增以下標籤
        | tag_name | tag_source |
        | 女       | 問券       |

  Rule: 支援問券蒐集標籤自動產生性別比對

    Example: 問券蒐集自動產生性別標籤
      Given 問券系統回傳會員性別「男」
      When 系統處理問券資料
      Then 系統為該會員新增標籤「男」

    Example: 問券蒐集自動產生女性性別標籤
      Given 問券系統回傳會員性別「女」
      When 系統處理問券資料
      Then 系統為該會員新增標籤「女」

    Example: 問券蒐集性別資料為空不產生標籤
      Given 問券系統回傳會員性別為空
      When 系統處理問券資料
      Then 系統不為該會員新增性別標籤


  Rule: 支援問券蒐集標籤自動產生地區比對

    Example: 問券蒐集自動產生地區標籤
      Given 問券系統回傳會員居住地「台北市」
      When 系統處理問券資料
      Then 系統為該會員新增標籤「台北市」

    Example: 問券蒐集自動產生不同縣市地區標籤
      Given 問券系統回傳會員居住地「高雄市」
      When 系統處理問券資料
      Then 系統為該會員新增標籤「高雄市」

    Example: 問券蒐集地區資料為空不產生標籤
      Given 問券系統回傳會員居住地為空
      When 系統處理問券資料
      Then 系統不為該會員新增地區標籤

  Rule: 支援問券蒐集標籤自動產生生日月份比對

    Example: 問券蒐集自動產生生日月份標籤
      Given 問券系統回傳會員生日月份「8」
      When 系統處理問券資料
      Then 系統為該會員新增標籤「8月」

    Example: 問券蒐集自動產生年底月份標籤
      Given 問券系統回傳會員生日月份「12」
      When 系統處理問券資料
      Then 系統為該會員新增標籤「12月」

    Example: 問券蒐集生日月份資料為空不產生標籤
      Given 問券系統回傳會員生日月份為空
      When 系統處理問券資料
      Then 系統不為該會員新增生日月份標籤

  Rule: 串接後會員資料中，顯示各來源標籤

    Example: 會員資料顯示標籤來源
      Given 會員「孫八」擁有以下標籤
        | tag_name   | tag_source |
        | VIP        | CRM        |
        | 商務房     | PMS        |
        | 雙十優惠   | LINE OA    |
      When 行銷人員查看會員「孫八」的資料
      Then 系統顯示以下標籤及來源
        | tag_name   | tag_source |
        | VIP        | CRM        |
        | 商務房     | PMS        |
        | 雙十優惠   | LINE OA    |

    Example: 會員資料顯示混合來源標籤包含問券與手動
      Given 會員「陳小英」擁有以下標籤
        | tag_name   | tag_source |
        | 女         | 問券       |
        | 台中市     | 問券       |
        | 潛在客戶   | 手動       |
        | 高消費客戶 | PMS        |
      When 行銷人員查看會員「陳小英」的資料
      Then 系統顯示以下標籤及來源
        | tag_name   | tag_source |
        | 女         | 問券       |
        | 台中市     | 問券       |
        | 潛在客戶   | 手動       |
        | 高消費客戶 | PMS        |

    Example: 會員沒有任何標籤時顯示空列表
      Given 會員「新會員張志豪」沒有任何標籤
      When 行銷人員查看會員「新會員張志豪」的資料
      Then 系統顯示標籤列表為空

  Rule: 可編輯既有的會員標籤

    Example: 編輯會員標籤
      Given 會員「周九」擁有標籤「VIP」
      When 行銷人員將標籤「VIP」編輯為「VVIP」
      Then 會員「周九」的標籤更新為「VVIP」

    Example: 編輯標籤名稱為已存在標籤時操作失敗
      Given 會員「王小華」擁有以下標籤
        | tag_name |
        | VIP      |
        | 常客     |
      When 行銷人員將標籤「VIP」編輯為「常客」
      Then 操作失敗，顯示「標籤名稱已存在」

    Example: 編輯標籤保留原標籤來源
      Given 會員「李小明」擁有標籤「商務房」，來源為「PMS」
      When 行銷人員將標籤「商務房」編輯為「商務套房」
      Then 會員「李小明」的標籤更新為「商務套房」，來源保持為「PMS」

  Rule: 刪除會員標籤時二次確認彈窗

    Example: 刪除會員標籤時彈窗確認
      Given 會員「吳十」擁有標籤「黑名單」
      When 行銷人員刪除標籤「黑名單」
      Then 系統彈窗確認是否刪除

    Example: 確認刪除後標籤成功移除
      Given 會員「劉小美」擁有標籤「測試標籤」
      When 行銷人員刪除標籤「測試標籤」並確認刪除
      Then 會員「劉小美」的標籤「測試標籤」被移除

    Example: 取消刪除後標籤保留
      Given 會員「張小強」擁有標籤「重要客戶」
      When 行銷人員刪除標籤「重要客戶」但取消確認
      Then 會員「張小強」的標籤「重要客戶」保留不變

  Rule: 於會員管理設定頁可手動輸入新標籤

    Example: 手動新增會員標籤
      Given 會員「鄭十一」不擁有任何標籤
      When 行銷人員為會員「鄭十一」手動新增標籤「潛在客戶」
      Then 會員「鄭十一」新增標籤「潛在客戶」

    Example: 手動新增多個標籤給同一會員
      Given 會員「陳小文」擁有標籤「VIP」
      When 行銷人員為會員「陳小文」手動新增標籤「常客」
      Then 會員「陳小文」擁有以下標籤
        | tag_name |
        | VIP      |
        | 常客     |

    Example: 手動新增標籤來源標記為手動
      Given 會員「黃小玲」不擁有任何標籤
      When 行銷人員為會員「黃小玲」手動新增標籤「優先通知」
      Then 會員「黃小玲」新增標籤「優先通知」，來源為「手動」

  Rule: 手動新增標籤時自動排除重複標籤

    Example: 手動新增重複標籤時操作失敗
      Given 會員「王十二」擁有標籤「VIP」
      When 行銷人員為會員「王十二」手動新增標籤「VIP」
      Then 操作失敗

    Example: 手動新增重複標籤顯示錯誤訊息
      Given 會員「林小雯」擁有標籤「常客」
      When 行銷人員為會員「林小雯」手動新增標籤「常客」
      Then 操作失敗，顯示「該會員已擁有此標籤」

    Example: 手動新增不同標籤但名稱相似時成功新增
      Given 會員「張志強」擁有標籤「VIP」
      When 行銷人員為會員「張志強」手動新增標籤「VVIP」
      Then 會員「張志強」成功新增標籤「VVIP」

  Rule: 新增標籤後即時反映於標籤管理頁

    Example: 新增會員標籤後標籤管理頁立即更新
      Given 行銷人員在會員管理設定頁為會員「鄭十一」手動新增標籤「潛在客戶」
      When 標籤新增成功
      Then 標籤管理頁立即顯示新標籤「潛在客戶」，無需手動刷新頁面

    Example: 外部系統串接新增標籤後標籤管理頁即時更新
      Given 外部系統 PMS 為會員「周小華」新增標籤「豪華套房」
      When 系統完成標籤新增
      Then 標籤管理頁立即顯示新標籤「豪華套房」，無需手動刷新頁面

    Example: 批次新增多個標籤後標籤管理頁即時顯示所有新標籤
      Given 行銷人員在會員管理設定頁為會員「林志豪」新增多個標籤「VIP」、「常客」、「優先通知」
      When 所有標籤新增成功
      Then 標籤管理頁立即顯示所有新標籤「VIP」、「常客」、「優先通知」，無需手動刷新頁面

  Rule: 單筆會員標籤不得超過 20 個字

    Example: 新增標籤名稱超過 20 個字時操作失敗
      Given 會員「張十三」不擁有任何標籤
      When 行銷人員為會員「張十三」新增標籤「超過二十個中文字元的標籤名稱測試超過二十個中文字元的標籤名稱測試」
      Then 操作失敗

    Example: 新增標籤名稱正好 20 個字時成功新增
      Given 會員「李小雯」不擁有任何標籤
      When 行銷人員為會員「李小雯」新增標籤「這是剛好二十個中文字的標籤名稱測試」
      Then 會員「李小雯」成功新增標籤「這是剛好二十個中文字的標籤名稱測試」

    Example: 新增標籤名稱超過 20 個字時顯示錯誤訊息
      Given 會員「陳志豪」不擁有任何標籤
      When 行銷人員為會員「陳志豪」新增標籤「這個標籤名稱超過二十個中文字元的長度限制」
      Then 操作失敗，顯示「標籤名稱不得超過 20 個字」

  Rule: 若同一會員重複串接的相同消費紀錄，系統僅記錄一次貼標

    Example: 重複串接相同消費紀錄僅記錄一次
      Given 會員「李十四」已從 PMS 系統獲得標籤「商務房」
      And 外部系統 PMS 再次回傳相同的消費紀錄
        | name   | id_number  | room_type |
        | 李十四 | D444555666 | 商務房    |
      When 系統處理串接資料
      Then 會員「李十四」的標籤「商務房」觸發次數不增加

    Example: 重複串接但消費紀錄不同時可新增標籤
      Given 會員「王小美」已從 PMS 系統獲得標籤「商務房」
      And 外部系統 PMS 回傳不同的消費紀錄
        | name   | id_number  | room_type | consumption_amount |
        | 王小美 | E777888999 | 豪華套房  | 80000              |
      When 系統處理串接資料
      Then 會員「王小美」新增標籤「豪華套房」並保留原有標籤「商務房」

    Example: 多次重複串接相同消費紀錄標籤不重複
      Given 會員「張志明」已從 PMS 系統獲得標籤「高消費客戶」
      And 外部系統 PMS 連續三次回傳相同的消費紀錄
        | name   | id_number  | consumption_amount |
        | 張志明 | F111222333 | 100000             |
      When 系統處理串接資料
      Then 會員「張志明」的標籤「高消費客戶」保持唯一，不重複新增
