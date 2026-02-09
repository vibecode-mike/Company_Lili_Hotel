# language: zh-TW
Feature: 檔案上傳
  作為一位管理員
  我希望能上傳圖片檔案至系統
  以便用於訊息模板、活動圖片等用途

  Background:
    Given 管理員已登入系統

  # ============================================================================
  # 第一部分：圖片上傳
  # ============================================================================

  Rule: 支援上傳 JPG、JPEG、PNG、GIF 格式的圖片檔案

    Example: 成功上傳 JPG 圖片
      Given 管理員準備了一張 2MB 的 JPG 圖片檔案
      When 管理員透過 POST /upload 上傳該圖片
      Then 系統回傳 code 200 與訊息「上传成功」
      And 回傳資料包含圖片的公開 URL、唯一檔名與檔案大小
      And 圖片已儲存至伺服器上傳目錄

    Example: 成功上傳 PNG 圖片並自動轉換為 JPEG 格式
      Given 管理員準備了一張 PNG 格式圖片
      When 管理員透過 POST /upload 上傳該圖片
      Then 系統將圖片轉換為 JPEG 格式（quality=95）
      And 回傳的檔名副檔名為 .jpg
      And 圖片模式轉換為 RGB

  Rule: 上傳檔案大小不得超過 5MB

    Example: 上傳超過 5MB 的圖片被拒絕
      Given 管理員準備了一張 6MB 的圖片檔案
      When 管理員透過 POST /upload 上傳該圖片
      Then 系統回傳 HTTP 400 錯誤
      And 錯誤訊息為「文件大小超过限制。最大允许: 5.0MB」

    Example: 上傳空白檔案被拒絕
      Given 管理員準備了一個 0 位元組的空白檔案
      When 管理員透過 POST /upload 上傳該檔案
      Then 系統回傳 HTTP 400 錯誤
      And 錯誤訊息為「文件为空」

  Rule: 不支援的檔案格式將被拒絕

    Example: 上傳 PDF 檔案被拒絕
      Given 管理員準備了一個 PDF 檔案
      When 管理員透過 POST /upload 上傳該檔案
      Then 系統回傳 HTTP 400 錯誤
      And 錯誤訊息包含「不支持的文件格式」

    Example: 上傳 BMP 檔案被拒絕
      Given 管理員準備了一個 BMP 格式圖片
      When 管理員透過 POST /upload 上傳該圖片
      Then 系統回傳 HTTP 400 錯誤
      And 錯誤訊息包含允許的格式清單「.jpg, .jpeg, .png, .gif」

  Rule: 系統自動生成唯一檔名避免檔案衝突

    Example: 上傳檔案時生成唯一檔名
      Given 管理員上傳一張名為「banner.jpg」的圖片
      When 系統處理上傳請求
      Then 系統生成格式為「{日期時間}_{UUID}.jpg」的唯一檔名
      And 原始檔名不會被直接使用

  # ============================================================================
  # 第二部分：圖片刪除
  # ============================================================================

  Rule: 可透過檔名刪除已上傳的圖片

    Example: 成功刪除已上傳的圖片
      Given 系統中存在已上傳的圖片「20250128_abc12345.jpg」
      When 管理員透過 DELETE /upload/{filename} 刪除該圖片
      Then 系統回傳 code 200 與訊息「删除成功」
      And 該圖片檔案已從伺服器移除

    Example: 刪除不存在的圖片回傳 404
      Given 系統中不存在圖片「nonexistent.jpg」
      When 管理員透過 DELETE /upload/{filename} 嘗試刪除該圖片
      Then 系統回傳 HTTP 404 錯誤
      And 錯誤訊息為「文件不存在」
