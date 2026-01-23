-- ========================================
-- 清理 FB 已發送消息（只刪除已發送，保留其他狀態）
-- ========================================
-- 執行時機：代碼部署並測試通過後執行
-- 目的：刪除本地 DB 中已發送的 FB 消息（這些數據從外部 API 實時獲取）

-- 1. 查看需要清理的數據
SELECT
    '=== 待清理的 FB 已發送消息 ===' as section,
    COUNT(*) as count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM messages
WHERE platform = 'Facebook'
  AND send_status = '已發送';

-- 2. 備份（可選但強烈推薦）
CREATE TABLE IF NOT EXISTS messages_fb_sent_backup (
    id BIGINT PRIMARY KEY,
    template_id BIGINT,
    message_title TEXT,
    send_status VARCHAR(20),
    send_time DATETIME,
    send_count INT,
    platform VARCHAR(20),
    channel_id VARCHAR(100),
    fb_message_json MEDIUMTEXT,
    created_at DATETIME,
    backup_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入備份
INSERT INTO messages_fb_sent_backup
    (id, template_id, message_title, send_status, send_time, send_count,
     platform, channel_id, fb_message_json, created_at)
SELECT
    id, template_id, message_title, send_status, send_time, send_count,
    platform, channel_id, fb_message_json, created_at
FROM messages
WHERE platform = 'Facebook'
  AND send_status = '已發送';

-- 確認備份
SELECT
    '=== 備份確認 ===' as section,
    COUNT(*) as backup_count
FROM messages_fb_sent_backup;

-- 3. 刪除已發送的 FB 消息
DELETE FROM messages
WHERE platform = 'Facebook'
  AND send_status = '已發送';

-- 4. 驗證刪除結果
SELECT
    '=== FB 消息狀態分布（刪除後）===' as section,
    send_status,
    COUNT(*) as count
FROM messages
WHERE platform = 'Facebook'
GROUP BY send_status
ORDER BY send_status;

-- 預期結果：應該只有 '草稿'、'已排程'、'發送失敗'，沒有 '已發送'

-- 5. 驗證 LINE 消息未受影響
SELECT
    '=== LINE 消息確認 ===' as section,
    send_status,
    COUNT(*) as count
FROM messages
WHERE platform = 'LINE'
GROUP BY send_status;

-- ========================================
-- 回滾步驟（如需恢復）
-- ========================================
-- 從備份恢復數據：
-- INSERT INTO messages
--     (id, template_id, message_title, send_status, send_time, send_count,
--      platform, channel_id, fb_message_json, created_at)
-- SELECT
--     id, template_id, message_title, send_status, send_time, send_count,
--     platform, channel_id, fb_message_json, created_at
-- FROM messages_fb_sent_backup;
