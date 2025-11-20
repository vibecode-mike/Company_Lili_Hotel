Feature: 輪播卡片圖片自動重新裁切（前端實現）
  作為一位行銷人員
  我希望在勾選或取消輪播卡片欄位時
  系統能自動重新裁切圖片以符合顯示比例

  # ============================================
  # 技術實作說明（2025-11-20）
  # ============================================
  # 此功能完全在前端實現，使用 Canvas API 進行圖片裁切
  # 原始圖片檔案（File 對象）存儲在組件 state 的 originalFile 欄位
  # 裁切後的圖片以 Blob URL 形式存儲在 image 欄位用於預覽
  # 比例變化時，前端從 originalFile 重新裁切，無需呼叫後端 API
  # 只有在最終保存訊息時，才將裁切後的圖片上傳到後端
  #
  # 相關文件：
  # - frontend/src/utils/imageCropper.ts (裁切工具)
  # - frontend/src/components/CarouselMessageEditor.tsx (自動重裁邏輯)
  # - FRONTEND_CROPPING_IMPLEMENTATION.md (完整技術文檔)
  # ============================================

  Background:
    Given 行銷人員已登入系統
    And 行銷人員正在建立輪播訊息模板

  Rule: 圖片裁切比例根據卡片欄位自動判定
    # 比例規則：
    # - 僅勾選「選擇圖片」→ 1:1 正方形 (900x900px)
    # - 勾選任何其他欄位（標題/內文/金額/按鈕）→ 1.92:1 橫向長方形 (1920x1000px)

    Example: 初次上傳圖片時自動裁切為正方形（僅圖片欄位）
      Given 行銷人員已勾選「選擇圖片」欄位
      And 未勾選標題、內文、金額、按鈕欄位
      When 行銷人員選擇圖片「hotel_room.jpg」（原始尺寸 2400x1600）
      Then 前端使用 Canvas API 裁切圖片為 1:1 比例
      And 裁切目標尺寸為 900x900px
      And 裁切方式為中心裁切（保留中間區域）
      And 前端將原始 File 對象存入組件 state 的 originalFile
      And 前端生成裁切後的 Blob URL 並存入 image 欄位
      And 預覽區顯示正方形圖片（1:1 比例）
      And 無任何後端 API 呼叫

    Example: 初次上傳圖片時自動裁切為橫向（已勾選其他欄位）
      Given 行銷人員已勾選「選擇圖片」和「標題」欄位
      When 行銷人員選擇圖片「hotel_room.jpg」
      Then 前端使用 Canvas API 裁切圖片為 1.92:1 比例
      And 裁切目標尺寸為 1920x1000px
      And 前端將原始 File 對象存入 originalFile
      And 前端生成裁切後的 Blob URL 並存入 image 欄位
      And 預覽區顯示橫向長方形圖片（1.92:1 比例）
      And 無任何後端 API 呼叫

  Rule: 勾選欄位導致比例改變時，前端自動重新裁切

    Example: 正方形自動改為橫向（1:1 → 1.92:1）
      Given 行銷人員已上傳圖片「hotel_room.jpg」
      And 僅勾選「選擇圖片」欄位
      And 當前預覽顯示為 1:1 正方形（900x900）
      And 原始圖片已存儲在 originalFile
      When 行銷人員新增勾選「標題」欄位
      Then 前端檢測到比例需求從 1:1 變更為 1.92:1
      And 前端從 originalFile 使用 Canvas API 重新裁切
      And 裁切目標比例為 1.92:1（1920x1000px）
      And 前端清理舊的 Blob URL（釋放內存）
      And 前端生成新的 Blob URL
      And 前端更新 image 欄位為新的 Blob URL
      And 預覽區立即更新為橫向長方形顯示
      And 整個過程無後端 API 呼叫
      And 響應時間 < 100ms（純前端處理）

    Example: 勾選內文欄位也觸發比例改變
      Given 行銷人員已上傳圖片並顯示為 1:1
      And 僅勾選「選擇圖片」
      When 行銷人員新增勾選「內文文字說明」欄位
      Then 前端自動從 originalFile 重新裁切為 1.92:1
      And 預覽區更新為橫向長方形

    Example: 勾選金額欄位也觸發比例改變
      Given 行銷人員已上傳圖片並顯示為 1:1
      And 僅勾選「選擇圖片」
      When 行銷人員新增勾選「金額」欄位
      Then 前端自動從 originalFile 重新裁切為 1.92:1
      And 預覽區更新為橫向長方形

    Example: 勾選任一按鈕也觸發比例改變
      Given 行銷人員已上傳圖片並顯示為 1:1
      And 僅勾選「選擇圖片」
      When 行銷人員新增勾選「按鈕 1」欄位
      Then 前端自動從 originalFile 重新裁切為 1.92:1
      And 預覽區更新為橫向長方形

  Rule: 取消勾選欄位導致比例改變時，前端自動重新裁切

    Example: 橫向自動改回正方形（1.92:1 → 1:1）
      Given 行銷人員已上傳圖片「hotel_room.jpg」
      And 已勾選「選擇圖片」和「標題」欄位
      And 當前預覽顯示為 1.92:1 橫向長方形（1920x1000）
      And 原始圖片已存儲在 originalFile
      When 行銷人員取消勾選「標題」欄位
      And 此時僅保留「選擇圖片」勾選
      Then 前端檢測到比例需求從 1.92:1 變更為 1:1
      And 前端從 originalFile 使用 Canvas API 重新裁切
      And 裁切目標比例為 1:1（900x900px）
      And 前端清理舊的 Blob URL
      And 前端生成新的 Blob URL
      And 前端更新 image 欄位為新的 Blob URL
      And 預覽區立即更新為正方形顯示
      And 整個過程無後端 API 呼叫
      And 響應時間 < 100ms

    Example: 取消所有其他欄位回到僅圖片
      Given 行銷人員已上傳圖片並顯示為 1.92:1
      And 已勾選「選擇圖片」、「標題」、「內文」、「按鈕 1」
      When 行銷人員逐一取消「標題」、「內文」、「按鈕 1」
      And 最終僅保留「選擇圖片」勾選
      Then 前端自動從 originalFile 重新裁切為 1:1
      And 預覽區更新為正方形

  Rule: 多次切換欄位時，前端可重複重新裁切

    Example: 反覆切換欄位導致多次自動裁切
      Given 行銷人員已上傳圖片「hotel_room.jpg」
      And 僅勾選「選擇圖片」（顯示為 1:1）
      When 行銷人員勾選「標題」（觸發裁切為 1.92:1）
      And 行銷人員取消「標題」（觸發裁切回 1:1）
      And 行銷人員勾選「內文」（觸發裁切為 1.92:1）
      And 行銷人員取消「內文」（觸發裁切回 1:1）
      Then 前端每次都能從 originalFile 成功重新裁切
      And 預覽區每次都正確更新顯示比例
      And 所有操作都在前端完成，無後端 API 呼叫
      And 原始圖片品質不因多次裁切而降低（每次都從 originalFile 裁切）

  Rule: 保存訊息時才上傳裁切後的圖片到後端

    Example: 編輯過程不上傳，保存時才上傳
      Given 行銷人員已上傳圖片並多次切換欄位
      And 前端已進行多次自動重新裁切
      And 所有裁切結果僅存在於瀏覽器內存（Blob URL）
      When 行銷人員填寫完所有必填欄位
      And 行銷人員點擊「儲存草稿」按鈕
      Then 前端從 originalFile 根據當前比例進行最終裁切
      And 前端將裁切後的 Blob 轉換為 File 對象
      And 前端呼叫 POST /api/v1/upload 上傳裁切後的圖片
      And 後端接收已裁切的圖片（JPEG, 95% 品質）
      And 後端進行 RGB 轉換並保存到 /uploads/ 目錄
      And 後端返回圖片 URL（例如：/uploads/hotel_room_123456.jpg）
      And 前端將返回的 URL 存入 uploadedImageUrl 欄位
      And 前端使用 uploadedImageUrl 生成 Flex Message JSON
      And 前端將 JSON 和訊息數據保存到數據庫
      And 後端不保存原始圖片（不創建 uploads_original/ 目錄）

  Rule: 圖片品質和效能保證

    Example: 裁切品質保證
      Given 行銷人員上傳高品質圖片（2400x1600, 2MB）
      When 前端使用 Canvas API 裁切
      Then 裁切使用 JPEG 格式，品質設為 95%
      And 1:1 輸出尺寸固定為 900x900px
      And 1.92:1 輸出尺寸固定為 1920x1000px
      And 輸出圖片清晰銳利，適合行動裝置顯示

    Example: 裁切效能保證
      Given 行銷人員上傳圖片並切換欄位
      When 前端進行自動重新裁切
      Then 裁切操作在前端 Canvas 完成
      And 處理時間 < 100ms（現代瀏覽器）
      And UI 無明顯卡頓或延遲
      And 預覽立即更新

  Rule: 原始圖片的生命週期管理

    Example: 原始圖片僅存在於組件 state（內存）
      Given 行銷人員上傳圖片
      Then 原始 File 對象存儲在組件 state 的 originalFile 欄位
      And 原始圖片僅存在於瀏覽器內存
      And 原始圖片不上傳到後端
      And 原始圖片不存儲在 localStorage
      And 原始圖片不存儲在 IndexedDB

    Example: 切換到其他卡片時保留當前卡片的 originalFile
      Given 行銷人員在卡片 1 上傳圖片「room1.jpg」
      And 切換到卡片 2 上傳圖片「room2.jpg」
      When 行銷人員切換回卡片 1
      And 行銷人員勾選「標題」欄位
      Then 前端仍能從卡片 1 的 originalFile 重新裁切
      And 卡片 1 的圖片正確更新為 1.92:1 比例

    Example: 頁面刷新後原始圖片丟失（預期行為）
      Given 行銷人員已上傳圖片並存儲在 originalFile
      And 行銷人員尚未保存訊息
      When 行銷人員刷新瀏覽器頁面
      Then originalFile 丟失（組件 state 清空）
      And 預覽圖片的 Blob URL 失效
      And 行銷人員需要重新上傳圖片
      And 這是預期行為，符合需求

    Example: 保存後再次編輯時無法重新裁切（預期行為）
      Given 行銷人員已保存訊息模板
      And 圖片已上傳到後端（uploadedImageUrl 有值）
      And originalFile 已被清空或不存在
      When 行銷人員重新開啟該訊息進行編輯
      And 行銷人員勾選或取消欄位
      Then 前端無法自動重新裁切（因為沒有 originalFile）
      And 預覽圖片保持不變（使用已保存的 uploadedImageUrl）
      And 如需更改圖片比例，需重新上傳圖片
      And 這是預期行為，符合需求

  Rule: 內存管理和資源清理

    Example: 切換圖片時清理舊的 Blob URL
      Given 行銷人員已上傳圖片 A
      And 前端已生成 Blob URL: blob:http://localhost/abc123
      When 行銷人員重新上傳圖片 B
      Then 前端先呼叫 URL.revokeObjectURL(舊 URL) 釋放內存
      And 前端再生成新圖片 B 的 Blob URL
      And 避免內存洩漏

    Example: 自動重新裁切時清理舊的 Blob URL
      Given 行銷人員圖片顯示為 1:1（Blob URL: blob:http://localhost/xyz789）
      When 行銷人員勾選「標題」觸發重新裁切
      Then 前端先清理舊的 Blob URL
      And 前端生成新的 1.92:1 裁切圖片的 Blob URL
      And 更新預覽並避免內存洩漏

  Rule: 錯誤處理

    Example: 原始圖片不存在時無法自動重新裁切
      Given 行銷人員開啟已保存的訊息模板進行編輯
      And originalFile 欄位為空（因為是從數據庫載入）
      When 行銷人員勾選「標題」欄位
      Then 前端檢測到 originalFile 不存在
      And 前端不進行自動重新裁切
      And 預覽圖片保持不變（顯示已保存的 uploadedImageUrl）
      And 不顯示錯誤訊息（這是正常情況）

    Example: 圖片裁切失敗時的錯誤處理
      Given 行銷人員上傳圖片
      When 前端 Canvas API 裁切過程中發生錯誤（例如：瀏覽器不支援）
      Then 前端 catch 錯誤並記錄到 console
      And 前端顯示錯誤提示「圖片處理失敗，請重試」
      And 不儲存任何圖片數據

  Rule: 多卡片批量處理

    Example: 保存時批量上傳所有卡片的圖片
      Given 行銷人員建立輪播訊息，包含 3 張卡片
      And 卡片 1 圖片比例為 1:1
      And 卡片 2 圖片比例為 1.92:1
      And 卡片 3 圖片比例為 1:1
      When 行銷人員點擊「儲存草稿」
      Then 前端遍歷所有卡片
      And 前端為每張卡片從 originalFile 根據當前比例裁切
      And 前端依序上傳 3 張裁切後的圖片到後端
      And 後端返回 3 個圖片 URL
      And 前端更新各卡片的 uploadedImageUrl
      And 前端生成包含 3 張卡片的 Flex Message JSON
      And 前端保存訊息到數據庫

  Rule: 瀏覽器兼容性

    Example: 現代瀏覽器完整支援
      Given 行銷人員使用 Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
      When 行銷人員使用圖片裁切功能
      Then Canvas API 完整支援
      And toBlob() 方法正常運作
      And URL.createObjectURL() / revokeObjectURL() 正常運作
      And 所有功能正常使用

    Example: 舊版瀏覽器的降級處理
      Given 行銷人員使用不支援 Canvas API 的舊瀏覽器
      When 行銷人員嘗試上傳圖片
      Then 前端 Canvas 操作失敗並 catch 錯誤
      And 前端顯示錯誤訊息「您的瀏覽器不支援此功能，請使用 Chrome、Firefox 或 Safari 最新版本」
      And 建議升級瀏覽器
