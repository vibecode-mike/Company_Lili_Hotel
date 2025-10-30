-- =====================================================
-- ryan_click_demo 診斷查詢腳本
-- =====================================================
-- 用途：診斷點擊統計數據的正確性，檢查 source_campaign_id 映射
-- 創建時間：2025-10-30
-- =====================================================

USE linebot_message;

-- =====================================================
-- 1. 檢查 source_campaign_id 分布
-- =====================================================
-- 說明：查看各活動的點擊記錄數量和唯一用戶數
SELECT
    source_campaign_id,
    COUNT(*) AS record_count,
    COUNT(DISTINCT line_id) AS unique_users,
    MIN(created_at) AS first_record,
    MAX(updated_at) AS last_record
FROM ryan_click_demo
GROUP BY source_campaign_id
ORDER BY source_campaign_id;

-- =====================================================
-- 2. 檢查 source_campaign_id = 0 的記錄
-- =====================================================
-- 說明：找出沒有正確對應活動的點擊記錄
SELECT
    id,
    line_id,
    source_campaign_id,
    line_display_name,
    total_clicks,
    created_at,
    updated_at
FROM ryan_click_demo
WHERE source_campaign_id = 0
ORDER BY updated_at DESC
LIMIT 20;

-- =====================================================
-- 3. 檢查最近的點擊記錄
-- =====================================================
-- 說明：查看最新的點擊記錄，驗證 source_campaign_id 是否正確
SELECT
    id,
    line_id,
    source_campaign_id,
    line_display_name,
    total_clicks,
    last_clicked_at,
    created_at,
    updated_at
FROM ryan_click_demo
ORDER BY updated_at DESC
LIMIT 20;

-- =====================================================
-- 4. 驗證與 campaigns 表的對應
-- =====================================================
-- 說明：檢查 ryan_click_demo 中的 source_campaign_id 是否都能對應到真實活動
SELECT
    rcd.source_campaign_id,
    c.title AS campaign_title,
    COUNT(DISTINCT rcd.line_id) AS unique_users,
    COUNT(*) AS total_records
FROM ryan_click_demo rcd
LEFT JOIN campaigns c ON rcd.source_campaign_id = c.id
GROUP BY rcd.source_campaign_id, c.title
ORDER BY rcd.source_campaign_id;

-- =====================================================
-- 5. 找出孤立的點擊記錄（活動已刪除）
-- =====================================================
-- 說明：找出對應的活動已經不存在的點擊記錄
SELECT
    rcd.id,
    rcd.source_campaign_id,
    rcd.line_id,
    rcd.line_display_name,
    rcd.created_at
FROM ryan_click_demo rcd
LEFT JOIN campaigns c ON rcd.source_campaign_id = c.id
WHERE c.id IS NULL AND rcd.source_campaign_id != 0
ORDER BY rcd.source_campaign_id;

-- =====================================================
-- 6. 比對 component_interaction_logs
-- =====================================================
-- 說明：比較兩個表的數據一致性
SELECT
    'ryan_click_demo' AS source_table,
    source_campaign_id AS campaign_id,
    COUNT(DISTINCT line_id) AS unique_users
FROM ryan_click_demo
WHERE source_campaign_id != 0
GROUP BY source_campaign_id

UNION ALL

SELECT
    'component_interaction_logs' AS source_table,
    campaign_id,
    COUNT(DISTINCT line_id) AS unique_users
FROM component_interaction_logs
WHERE campaign_id IS NOT NULL
GROUP BY campaign_id

ORDER BY campaign_id, source_table;

-- =====================================================
-- 7. 檢查重複記錄（唯一性約束測試）
-- =====================================================
-- 說明：檢查是否有違反唯一性約束的重複記錄
SELECT
    line_id,
    source_campaign_id,
    COUNT(*) AS duplicate_count
FROM ryan_click_demo
GROUP BY line_id, source_campaign_id
HAVING COUNT(*) > 1;

-- =====================================================
-- 8. 按時間段統計點擊量
-- =====================================================
-- 說明：查看不同時間段的點擊記錄數量
SELECT
    DATE(created_at) AS click_date,
    source_campaign_id,
    COUNT(*) AS clicks,
    COUNT(DISTINCT line_id) AS unique_users
FROM ryan_click_demo
WHERE source_campaign_id != 0
GROUP BY DATE(created_at), source_campaign_id
ORDER BY click_date DESC, source_campaign_id
LIMIT 50;

-- =====================================================
-- 9. 前端 API 預覽查詢
-- =====================================================
-- 說明：模擬前端 API 的查詢邏輯，檢查返回的點擊統計
SELECT
    c.id AS campaign_id,
    c.title AS campaign_title,
    c.status,
    c.created_at,
    COALESCE(click_stats.click_count, 0) AS click_count
FROM campaigns c
LEFT JOIN (
    SELECT
        source_campaign_id,
        SUM(total_clicks) AS click_count
    FROM ryan_click_demo
    GROUP BY source_campaign_id
) AS click_stats ON c.id = click_stats.source_campaign_id
ORDER BY c.id DESC
LIMIT 20;

-- =====================================================
-- 10. 診斷特定活動的點擊數據
-- =====================================================
-- 說明：替換 {CAMPAIGN_ID} 為實際的活動 ID
-- SELECT
--     rcd.id,
--     rcd.line_id,
--     rcd.line_display_name,
--     rcd.total_clicks,
--     rcd.last_clicked_at,
--     rcd.created_at,
--     c.title AS campaign_title,
--     c.status AS campaign_status
-- FROM ryan_click_demo rcd
-- LEFT JOIN campaigns c ON rcd.source_campaign_id = c.id
-- WHERE rcd.source_campaign_id = {CAMPAIGN_ID}
-- ORDER BY rcd.updated_at DESC;

-- =====================================================
-- 修復建議（僅供參考）
-- =====================================================

-- 修復 A：清理 source_campaign_id = 0 的記錄
-- DELETE FROM ryan_click_demo WHERE source_campaign_id = 0;

-- 修復 B：從 component_interaction_logs 回填（謹慎使用）
-- UPDATE ryan_click_demo rcd
-- JOIN (
--     SELECT line_id, campaign_id, MAX(triggered_at) AS last_click
--     FROM component_interaction_logs
--     WHERE campaign_id IS NOT NULL
--     GROUP BY line_id, campaign_id
-- ) AS cil ON rcd.line_id = cil.line_id
-- SET rcd.source_campaign_id = cil.campaign_id
-- WHERE rcd.source_campaign_id = 0;

-- =====================================================
-- 結束
-- =====================================================
