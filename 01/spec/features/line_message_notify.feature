# language: zh-TW
Feature: LINE 訊息通知
  作為系統內部服務
  LINE App 在收到用戶訊息後透過此 API 通知 Backend
  以便 Backend 透過 WebSocket 即時推送訊息給前端聊天室

  Background:
    Given LINE App 服務運行中
    And Backend 服務運行中

  # ============================================================================
  # 第一部分：用戶訊息通知
  # ============================================================================

  Rule: LINE App 收到用戶訊息後通知 Backend 並推送 WebSocket

    Example: 成功接收用戶訊息通知並推送至前端
      Given 系統中存在 LINE UID 為「U1234567890abcdef」的會員
      And 前端有客服人員正在查看該會員的聊天室
      When LINE App 透過 POST /line/message-notify 發送通知
        | 欄位         | 值                   |
        | line_uid     | U1234567890abcdef    |
        | message_text | 請問還有空房嗎？     |
        | timestamp    | 1706500000000        |
        | message_id   | msg_001              |
        | direction    | incoming             |
      Then 系統回傳 status 為「ok」
      And 回傳 member_id 與 thread_id
      And 回傳 notified 為 true（表示有前端連線接收）
      And 系統透過 WebSocket 推送訊息至前端
      And 訊息 type 為「user」

    Example: 接收用戶訊息但會員不存在時跳過
      Given 系統中不存在 LINE UID 為「U_unknown」的會員
      When LINE App 透過 POST /line/message-notify 發送通知
        | 欄位         | 值              |
        | line_uid     | U_unknown       |
        | message_text | 你好            |
        | timestamp    | 1706500000000   |
        | message_id   | msg_002         |
      Then 系統回傳 status 為「ok」
      And 回傳 message 為「Member not found, skipped」
      And 系統不推送 WebSocket 訊息

  # ============================================================================
  # 第二部分：自動回應訊息通知
  # ============================================================================

  Rule: 系統自動回應訊息（GPT、關鍵字、一律回應）也透過此 API 通知

    Example: 接收 GPT 自動回應通知
      Given 系統中存在 LINE UID 為「U1234567890abcdef」的會員
      When LINE App 透過 POST /line/message-notify 發送通知
        | 欄位         | 值                       |
        | line_uid     | U1234567890abcdef        |
        | message_text | 感謝您的詢問，目前有空房 |
        | timestamp    | 1706500001000            |
        | message_id   | msg_003                  |
        | direction    | outgoing                 |
        | source       | gpt                      |
      Then 系統回傳 status 為「ok」
      And 訊息 type 為「official」
      And 系統透過 WebSocket 推送訊息至前端
      And 訊息 source 為「gpt」

    Example: 接收關鍵字自動回應通知
      Given 系統中存在 LINE UID 為「U1234567890abcdef」的會員
      When LINE App 透過 POST /line/message-notify 發送通知
        | 欄位         | 值                        |
        | line_uid     | U1234567890abcdef         |
        | message_text | 請撥打訂房專線 02-1234567 |
        | timestamp    | 1706500002000             |
        | message_id   | msg_004                   |
        | direction    | outgoing                  |
        | source       | keyword                   |
      Then 系統回傳 status 為「ok」
      And 訊息 source 為「keyword」

  # ============================================================================
  # 第三部分：手動訊息通知
  # ============================================================================

  Rule: 手動發送的訊息不透過此 API 推送 WebSocket（由 members.py 處理）

    Example: 手動發送訊息跳過 WebSocket 推送
      Given 系統中存在 LINE UID 為「U1234567890abcdef」的會員
      When LINE App 透過 POST /line/message-notify 發送通知
        | 欄位         | 值                   |
        | line_uid     | U1234567890abcdef    |
        | message_text | 您好，客服為您服務   |
        | timestamp    | 1706500003000        |
        | message_id   | msg_005              |
        | direction    | outgoing             |
        | source       | manual               |
      Then 系統回傳 status 為「ok」
      And 系統跳過 WebSocket 推送（避免與 members.py 重複推送）
      And 訊息仍會寫入 conversation_messages 資料表

  # ============================================================================
  # 第四部分：時間格式與訊息儲存
  # ============================================================================

  Rule: 系統將 Unix timestamp 轉換為中文時段格式

    Example: 下午時段的時間轉換
      Given 訊息 timestamp 對應台北時間為 14:30
      When 系統處理訊息通知
      Then 訊息的 time 欄位格式為「下午 02:30」

    Example: 凌晨時段的時間轉換
      Given 訊息 timestamp 對應台北時間為 03:15
      When 系統處理訊息通知
      Then 訊息的 time 欄位格式為「凌晨 03:15」

  Rule: 訊息透過 Upsert 機制避免重複寫入

    Example: 訊息 ID 已存在時更新而非新增
      Given 系統中已存在 message_id 為「msg_001」的訊息記錄
      When LINE App 再次透過 POST /line/message-notify 發送相同 message_id 的通知
      Then 系統更新該訊息的 thread_id、platform、role 等欄位
      And 不會新增重複的訊息記錄

    Example: 訊息 ID 不存在時新增記錄
      Given 系統中不存在 message_id 為「msg_new」的訊息記錄
      When LINE App 透過 POST /line/message-notify 發送通知
      Then 系統新增一筆 ConversationMessage 記錄
      And 設定 platform 為「LINE」
      And 更新對應 thread 的 last_message_at
