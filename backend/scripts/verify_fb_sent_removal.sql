-- ========================================
-- FB 已發送不保存 - 驗證腳本
-- ========================================

-- 1. 驗證 FB 消息狀態分布
SELECT
    '==== FB 消息狀態驗證 ====' as section,
    send_status,
    COUNT(*) as count
FROM messages
WHERE platform = 'Facebook'
GROUP BY send_status
ORDER BY send_status;

-- ✅ 預期結果：
-- send_status    | count
-- --------------|-------
-- 草稿          | X     (如有草稿)
-- 已排程        | X     (如有排程)
-- 發送失敗      | X     (如有失敗)
--
-- ❌ 不應該有：'已發送'

-- 2. 確認沒有已發送的 FB 消息
SELECT
    '==== 已發送數量檢查 ====' as section,
    COUNT(*) as sent_count
FROM messages
WHERE platform = 'Facebook'
  AND send_status = '已發送';

-- ✅ 預期結果：sent_count = 0

-- 3. 驗證 LINE 消息正常
SELECT
    '==== LINE 消息狀態分布 ====' as section,
    send_status,
    COUNT(*) as count
FROM messages
WHERE platform = 'LINE'
GROUP BY send_status
ORDER BY send_status;

-- ✅ 預期結果：LINE 消息所有狀態都存在（包括 '已發送'）

-- 4. 最近的 FB 消息（檢查數據完整性）
SELECT
    '==== 最近的 FB 消息 ====' as section,
    id,
    message_title,
    send_status,
    created_at
FROM messages
WHERE platform = 'Facebook'
ORDER BY created_at DESC
LIMIT 10;

-- 5. 總體統計
SELECT
    '==== 消息統計摘要 ====' as section,
    platform,
    COUNT(*) as total,
    SUM(CASE WHEN send_status = '草稿' THEN 1 ELSE 0 END) as draft_count,
    SUM(CASE WHEN send_status = '已排程' THEN 1 ELSE 0 END) as scheduled_count,
    SUM(CASE WHEN send_status = '已發送' THEN 1 ELSE 0 END) as sent_count,
    SUM(CASE WHEN send_status = '發送失敗' THEN 1 ELSE 0 END) as failed_count
FROM messages
GROUP BY platform;

-- ✅ 預期結果：
-- platform  | total | draft | scheduled | sent | failed
-- Facebook  | X     | X     | X         | 0    | X      ← sent 應該是 0
-- LINE      | X     | X     | X         | X    | X      ← sent 可以有值

-- ========================================
-- 驗收標準：
-- ✅ FB 消息中沒有 '已發送' 狀態 (count = 0)
-- ✅ FB 消息有 '草稿'/'已排程'/'發送失敗' (如有數據)
-- ✅ LINE 消息所有狀態正常
-- ========================================
