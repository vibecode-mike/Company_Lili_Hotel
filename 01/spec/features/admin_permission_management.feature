Feature: 管理員權限管理
  作為一位超級管理員
  我希望能夠管理管理員的角色與權限，控制不同管理員對系統功能的存取
  以便確保系統安全性，並根據職責分配適當的操作權限

  Rule: 系統初始化時載入預設角色

    Example: 系統啟動時建立預設角色
      Given 系統首次啟動或資料庫為空
      When 系統執行初始化程序
      Then 系統自動建立以下預設角色
        | role_code   | role_name    | is_system_role | description                    |
        | superadmin  | 超級管理員   | true           | 擁有所有權限，可管理所有功能   |
        | admin       | 管理員       | true           | 擁有大部分權限，可管理日常運營 |
        | staff       | 一般員工     | true           | 擁有基本權限，可執行基本操作   |

  Rule: 系統初始化時載入預設權限

    Example: 系統啟動時建立預設權限清單
      Given 系統首次啟動或資料庫為空
      When 系統執行初始化程序
      Then 系統自動建立以下預設權限
        | permission_code | permission_name | resource | action | description          |
        | member.view     | 查看會員資料    | member   | view   | 查看會員清單與詳細資料 |
        | member.create   | 建立會員        | member   | create | 手動建立新會員       |
        | member.update   | 編輯會員        | member   | update | 編輯會員基本資料     |
        | member.delete   | 刪除會員        | member   | delete | 刪除會員帳號         |
        | message.view    | 查看訊息        | message  | view   | 查看訊息清單與內容   |
        | message.send    | 發送訊息        | message  | send   | 發送群發訊息         |
        | tag.view        | 查看標籤        | tag      | view   | 查看標籤清單         |
        | tag.manage      | 管理標籤        | tag      | manage | 建立、編輯、刪除標籤 |
        | admin.manage    | 管理管理員      | admin    | manage | 管理管理員角色與權限 |
        | system.config   | 系統設定        | system   | config | 設定系統參數         |

    Example: superadmin 角色預設擁有所有權限
      Given 系統已建立預設角色「superadmin」
      And 系統已建立所有預設權限
      When 系統執行初始化程序
      Then 系統自動為「superadmin」角色授予所有預設權限

  Rule: 超級管理員指派角色給管理員

    Example: 超級管理員為新管理員指派角色
      Given 超級管理員「admin001」已登入系統
      And 系統中存在管理員「admin002」
      And 管理員「admin002」目前無任何角色
      When 超級管理員「admin001」為管理員「admin002」指派角色「staff」
      Then 系統建立管理員「admin002」與角色「staff」的關聯記錄
      And 關聯記錄包含指派時間與指派人「admin001」
      And 管理員「admin002」獲得角色「staff」的所有權限

    Example: 管理員可擁有多個角色
      Given 超級管理員「admin001」已登入系統
      And 管理員「admin002」已擁有角色「staff」
      When 超級管理員「admin001」為管理員「admin002」額外指派角色「admin」
      Then 管理員「admin002」同時擁有角色「staff」與「admin」
      And 管理員「admin002」的最終權限為兩個角色的權限聯集

  Rule: 超級管理員配置角色權限

    Example: 為角色新增權限
      Given 超級管理員「admin001」已登入系統
      And 系統中存在角色「staff」
      And 角色「staff」目前不擁有權限「message.send」
      When 超級管理員「admin001」為角色「staff」授予權限「message.send」
      Then 系統建立角色「staff」與權限「message.send」的關聯記錄
      And 關聯記錄包含授予時間與授予人「admin001」
      And 所有擁有角色「staff」的管理員立即獲得權限「message.send」

    Example: 從角色移除權限
      Given 超級管理員「admin001」已登入系統
      And 角色「staff」目前擁有權限「member.delete」
      And 管理員「admin002」擁有角色「staff」
      When 超級管理員「admin001」從角色「staff」移除權限「member.delete」
      Then 系統刪除角色「staff」與權限「member.delete」的關聯記錄
      And 管理員「admin002」立即失去權限「member.delete」

  Rule: 管理員權限計算（多角色權限聯集）

    Example: 管理員擁有多個角色時計算權限聯集
      Given 系統中存在以下角色與權限配置
        | role_code | permissions               |
        | staff     | member.view, tag.view     |
        | marketer  | message.view, message.send|
      And 管理員「admin002」擁有角色「staff」與「marketer」
      When 系統計算管理員「admin002」的最終權限
      Then 管理員「admin002」的權限清單為
        | permission_code |
        | member.view     |
        | tag.view        |
        | message.view    |
        | message.send    |

  Rule: 功能存取控制（權限檢查）

    Example: 管理員存取功能時檢查權限
      Given 管理員「admin002」已登入系統
      And 管理員「admin002」擁有權限「member.view」
      And 管理員「admin002」不擁有權限「member.delete」
      When 管理員「admin002」嘗試查看會員清單
      Then 系統允許存取，顯示會員清單
      When 管理員「admin002」嘗試刪除會員「M001」
      Then 系統拒絕存取，顯示錯誤訊息「您沒有權限執行此操作」

    Example: 未擁有任何角色的管理員無法存取功能
      Given 管理員「admin003」已登入系統
      And 管理員「admin003」未被指派任何角色
      When 管理員「admin003」嘗試查看會員清單
      Then 系統拒絕存取，顯示錯誤訊息「您沒有權限執行此操作」

  Rule: 超級管理員管理自訂角色

    Example: 超級管理員新增自訂角色
      Given 超級管理員「admin001」已登入系統
      When 超級管理員「admin001」建立新角色
        | role_code | role_name | description                  |
        | marketer  | 行銷人員  | 負責會員行銷與訊息推播       |
      Then 系統建立角色「marketer」
      And 角色「marketer」的 is_system_role 欄位為 false
      And 超級管理員可為角色「marketer」配置權限

    Example: 超級管理員刪除自訂角色
      Given 超級管理員「admin001」已登入系統
      And 系統中存在自訂角色「marketer」（is_system_role = false）
      And 角色「marketer」目前無管理員使用
      When 超級管理員「admin001」刪除角色「marketer」
      Then 系統刪除角色「marketer」及其所有權限關聯記錄

    Example: 自訂角色被使用時無法刪除
      Given 超級管理員「admin001」已登入系統
      And 系統中存在自訂角色「marketer」
      And 管理員「admin002」擁有角色「marketer」
      When 超級管理員「admin001」嘗試刪除角色「marketer」
      Then 系統拒絕刪除，顯示錯誤訊息「該角色目前有管理員使用，無法刪除」

    Example: 系統預設角色無法刪除
      Given 超級管理員「admin001」已登入系統
      And 系統中存在預設角色「admin」（is_system_role = true）
      When 超級管理員「admin001」嘗試刪除角色「admin」
      Then 系統拒絕刪除，顯示錯誤訊息「系統預設角色無法刪除」

  Rule: 僅擁有 admin.manage 權限的管理員可管理角色與權限

    Example: 一般管理員無法指派角色
      Given 管理員「admin002」已登入系統
      And 管理員「admin002」不擁有權限「admin.manage」
      When 管理員「admin002」嘗試為管理員「admin003」指派角色「staff」
      Then 系統拒絕操作，顯示錯誤訊息「您沒有權限執行此操作」

    Example: 擁有 admin.manage 權限的管理員可管理角色
      Given 管理員「admin002」已登入系統
      And 管理員「admin002」擁有權限「admin.manage」
      When 管理員「admin002」為管理員「admin003」指派角色「staff」
      Then 系統允許操作，建立角色指派記錄
      And 記錄指派人為「admin002」

  Rule: 動態權限配置即時生效

    Example: 角色權限變更後管理員權限立即更新
      Given 管理員「admin002」已登入系統
      And 管理員「admin002」擁有角色「staff」
      And 角色「staff」目前不擁有權限「message.send」
      And 管理員「admin002」目前無法發送訊息
      When 超級管理員「admin001」為角色「staff」授予權限「message.send」
      Then 管理員「admin002」無需重新登入即可立即獲得權限「message.send」
      And 管理員「admin002」可以發送訊息