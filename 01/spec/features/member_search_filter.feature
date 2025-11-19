Feature: 會員搜尋與篩選
  作為一位使用者
  我希望能夠以搜尋或篩選，找到目標會員來進行單一溝通、或批量傳送訊息等操作
  節省管理時間並提升執行效率

  Rule: 支援搜尋字段：LINE 名稱（模糊搜尋）

    Example: 以 LINE 名稱模糊搜尋會員
      Given 系統中存在以下會員
        | member_id | line_name |
        | M001      | 張小明    |
        | M002      | 李小華    |
        | M003      | 王大明    |
      When 使用者搜尋 LINE 名稱「小明」
      Then 系統使用模糊搜尋（LIKE %小明%）
      And 系統顯示以下會員
        | member_id | line_name |
        | M001      | 張小明    |
        | M003      | 王大明    |

    Example: LINE 名稱模糊搜尋支援部分匹配
      Given 系統中存在以下會員
        | member_id | line_name      |
        | M001      | 星巴克愛好者   |
        | M002      | 咖啡控         |
        | M003      | 星巴克常客     |
      When 使用者搜尋 LINE 名稱「星巴克」
      Then 系統顯示以下會員
        | member_id | line_name      |
        | M001      | 星巴克愛好者   |
        | M003      | 星巴克常客     |

  Rule: 支援搜尋字段：姓名（模糊搜尋）

    Example: 以姓名模糊搜尋會員
      Given 系統中存在以下會員
        | member_id | name   |
        | M001      | 張三   |
        | M002      | 李四   |
        | M003      | 張小明 |
      When 使用者搜尋姓名「張」
      Then 系統使用模糊搜尋（LIKE %張%）
      And 系統顯示以下會員
        | member_id | name   |
        | M001      | 張三   |
        | M003      | 張小明 |

    Example: 姓名模糊搜尋支援部分匹配
      Given 系統中存在以下會員
        | member_id | name   |
        | M001      | 王小明 |
        | M002      | 陳大明 |
        | M003      | 李明華 |
      When 使用者搜尋姓名「明」
      Then 系統顯示以下會員
        | member_id | name   |
        | M001      | 王小明 |
        | M002      | 陳大明 |
        | M003      | 李明華 |

  Rule: 支援搜尋字段：電子信箱（模糊搜尋）

  Example: 以電子信箱模糊搜尋會員
      Given 系統中存在以下會員
        | member_id | email              |
        | M001      | zhang@example.com  |
        | M002      | li@example.com     |
        | M003      | wang@example.com   |
      When 使用者搜尋電子信箱「zhang@example.com」
      Then 系統使用模糊搜尋（LIKE '%zhang@example.com%'）
      And 系統顯示以下會員
        | member_id | email              |
        | M001      | zhang@example.com  |

    Example: 電子信箱模糊搜尋支援部分匹配
      Given 系統中存在以下會員
        | member_id | email               |
        | M001      | user@gmail.com      |
        | M002      | user123@gmail.com   |
        | M003      | testuser@gmail.com  |
      When 使用者搜尋電子信箱「user」
      Then 系統使用模糊搜尋（LIKE '%user%'）
      And 系統顯示以下會員
        | member_id | email               |
        | M001      | user@gmail.com      |
        | M002      | user123@gmail.com   |
        | M003      | testuser@gmail.com  |


  Rule: 支援搜尋字段：手機號碼（精確搜尋）

    Example: 以手機號碼精確搜尋會員
      Given 系統中存在以下會員
        | member_id | phone      |
        | M001      | 0912345678 |
        | M002      | 0923456789 |
        | M003      | 0934567890 |
      When 使用者搜尋手機號碼「0912345678」
      Then 系統使用精確搜尋（= '0912345678'）
      And 系統顯示以下會員
        | member_id | phone      |
        | M001      | 0912345678 |

    Example: 手機號碼精確搜尋不支援部分匹配
      Given 系統中存在以下會員
        | member_id | phone      |
        | M001      | 0912345678 |
        | M002      | 0912345679 |
        | M003      | 0912345680 |
      When 使用者搜尋手機號碼「091234567」
      Then 系統找不到任何會員
      And 系統提示「請輸入完整的手機號碼」

  Rule: 支援篩選條件：會員標籤

    Example: 以會員標籤篩選會員
      Given 系統中存在以下會員及標籤
        | member_id | name | tags        |
        | M001      | 張三 | VIP         |
        | M002      | 李四 | 一般會員    |
        | M003      | 王五 | VIP         |
      When 使用者篩選會員標籤「VIP」
      Then 系統顯示以下會員
        | member_id | name | tags |
        | M001      | 張三 | VIP  |
        | M003      | 王五 | VIP  |

  Rule: 支援篩選條件：性別

    Example: 以性別篩選會員
      Given 系統中存在以下會員
        | member_id | name | gender |
        | M001      | 張三 | 男     |
        | M002      | 李四 | 女     |
        | M003      | 王五 | 男     |
      When 使用者篩選性別「男」
      Then 系統顯示以下會員
        | member_id | name | gender |
        | M001      | 張三 | 男     |
        | M003      | 王五 | 男     |

  Rule: 支援篩選條件：建立來源（LINE官方帳號）

    Example: 以建立來源篩選會員（LINE官方帳號）
      Given 系統中存在以下會員
        | member_id | name | join_source |
        | M001      | 張三 | LINE        |
        | M002      | 李四 | CRM         |
        | M003      | 王五 | LINE        |
      When 使用者篩選建立來源「LINE」
      Then 系統顯示以下會員
        | member_id | name | join_source |
        | M001      | 張三 | LINE        |
        | M003      | 王五 | LINE        |

  Rule: 支援篩選條件：建立來源（CRM）

    Example: 以建立來源篩選會員（CRM）
      Given 系統中存在以下會員
        | member_id | name | join_source |
        | M001      | 張三 | LINE        |
        | M002      | 李四 | CRM         |
        | M003      | 王五 | 後台系統    |
      When 使用者篩選建立來源「CRM」
      Then 系統顯示以下會員
        | member_id | name | join_source |
        | M002      | 李四 | CRM         |


  Rule: 加入來源支援動態擴充（可透過設定檔管理）

    Example: 初始加入來源清單
      Given 系統初始化時載入加入來源設定
      When 管理員查看可用的加入來源選項
      Then 系統顯示以下初始來源
        | source_code | source_name          | description                  |
        | LINE        | LINE 官方帳號        | 透過 LINE 官方帳號加入       |
        | CRM         | CRM 系統             | 從 CRM 系統匯入              |
        | PMS         | PMS 系統             | 從德安 PMS 系統整合          |
        | ERP         | ERP 系統             | 從 ERP 系統整合              |
 
    Example: 動態新增加入來源
      Given 系統需要支援新的會員來源「問券」
      When 管理員透過設定檔或管理後台新增來源「問券」
      Then 系統新增來源選項「問券」至加入來源清單
      And 篩選條件中可選擇「問券」作為篩選條件
      And 無需修改程式碼或重新部署

    Example: 篩選動態新增的來源
      Given 系統已新增來源「問券」
      And 系統中存在以下會員
        | member_id | name | join_source |
        | M001      | 張三 | LINE        |
        | M002      | 李四 | 問券        |
        | M003      | 王五 | 系統        |
      When 使用者篩選建立來源「問券」
      Then 系統顯示以下會員
        | member_id | name | join_source |
        | M002      | 李四 | 問券        |

  Rule: 錯誤處理：篩選結果為零時提示放寬條件

    Example: 多條件篩選無符合結果
      Given 系統中存在以下會員
        | member_id | name | gender | tags        | city  |
        | M001      | 張三 | 男     | VIP         | 台北  |
        | M002      | 李四 | 女     | 一般會員    | 台中  |
        | M003      | 王五 | 男     | 黑名單      | 高雄  |
      When 使用者同時設定性別「女」且標籤「VIP」且城市「高雄」
      Then 系統找不到任何會員
      And 系統提示「找不到符合條件的會員，請放寬篩選條件」

  Rule: 支援排序方式：按最近回覆日期排序

    Example: 按最近回覆日期排序會員
      Given 系統中存在以下會員
        | member_id | name | last_interaction_at |
        | M001      | 張三 | 2025/01/15 10:00    |
        | M002      | 李四 | 2025/01/20 14:30    |
        | M003      | 王五 | 2025/01/10 08:00    |
      When 使用者選擇按最近回覆日期排序
      Then 系統顯示以下排序後的會員
        | member_id | name | last_interaction_at |
        | M002      | 李四 | 2025/01/20 14:30    |
        | M001      | 張三 | 2025/01/15 10:00    |
        | M003      | 王五 | 2025/01/10 08:00    |
