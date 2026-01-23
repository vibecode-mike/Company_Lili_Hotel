# FB 已发送不保存 - 改动摘要

## 🎯 核心改动（1句话）

**FB 发送成功后删除数据库记录，前端从外部 API 实时显示已发送消息。**

---

## 📊 改动对比表

| 平台 | 状态 | 改动前 | 改动后 | 变化 |
|------|------|--------|--------|------|
| FB | 草稿 | ✅ 保存 DB | ✅ 保存 DB | ⚪ 无变化 |
| FB | 已排程 | ✅ 保存 DB | ✅ 保存 DB | ⚪ 无变化 |
| **FB** | **已发送** | **✅ 保存 DB（过时）** | **❌ 删除 DB** | **🔴 核心变化** |
| FB | 发送失败 | ✅ 保存 DB | ✅ 保存 DB | ⚪ 无变化 |
| LINE | 所有 | ✅ 保存 DB | ✅ 保存 DB | ⚪ 无变化 |

---

## 📦 修改文件清单

### 后端（1个）
- `backend/app/services/message_service.py` (969-986行)

### 前端（1个）
- `frontend/src/contexts/MessagesContext.tsx` (147-180行)

### 脚本（2个）
- `backend/scripts/cleanup_fb_sent_only.sql`
- `backend/scripts/verify_fb_sent_removal.sql`

### 文档（3个）
- `FB_SENT_NO_SAVE_GUIDE.md` - 部署指南 ⭐
- `FB_SENT_CHANGES_SUMMARY.md` - 本文档
- `CURRENT_SYSTEM_STATUS.md` - 更新

---

## 🔄 数据流变化

### 改动前 ❌
```
创建草稿 → 保存 DB
    ↓
发送成功 → 更新 DB (status="已發送", send_count=N)
    ↓
前端显示 → 本地 DB（过时数据） + 外部 API（最新数据）
问题：重复显示、数据过时
```

### 改动后 ✅
```
创建草稿 → 保存 DB
    ↓
发送成功 → 删除 DB 记录
    ↓
前端显示 → 本地 DB（草稿/排程/失败） + 外部 API（已发送）
优势：无重复、数据最新
```

---

## 🚀 快速部署（20分钟）

```bash
# 1. 部署代码
systemctl restart backend-service
npm run build

# 2. 测试功能（发送 FB 消息，确认删除）
# 创建 FB 消息 → 发送成功 → 查数据库应无记录

# 3. 验证
mysql -u user -p db < backend/scripts/verify_fb_sent_removal.sql

# 4. 清理历史（可选）
mysql -u user -p db < backend/scripts/cleanup_fb_sent_only.sql
```

详细步骤：`FB_SENT_NO_SAVE_GUIDE.md`

---

## ✅ 验收标准

### 数据库
```sql
-- FB 已发送应为 0
SELECT COUNT(*) FROM messages
WHERE platform='Facebook' AND send_status='已發送';
-- 结果：0 ✅
```

### 前端
- ✅ FB 草稿/排程/失败显示（来自本地 DB）
- ✅ FB 已发送显示（来自外部 API）
- ✅ LINE 所有状态正常
- ✅ 无重复消息

---

## 💡 解决的问题

### 问题 1: 数据重复 ✅
**改动前：** FB 消息在本地 DB 和外部 API 都有，前端合并后重复显示
**改动后：** 已发送只在外部 API，草稿/排程/失败只在本地 DB，清晰分离

### 问题 2: 数据过时 ✅
**改动前：** 本地 DB 的 send_count 是发送时快照，永不更新
**改动后：** 已发送数据直接从外部 API 获取，永远最新

### 问题 3: 存储浪费 ✅
**改动前：** 本地 DB 存储大量不使用的过时 FB 数据
**改动后：** 本地 DB 只存必要数据（草稿/排程/失败）

---

## ⚠️ 注意事项

### 外部 API 依赖
- FB 已发送消息依赖外部 API
- 外部 API 故障时，已发送消息不显示
- 前端已添加错误处理（超时、降级）

### 性能影响
- 列表加载仍需等待外部 API（2-5秒）
- 建议：优化外部 API 响应速度或添加前端缓存

### 搜索限制
- 无法在 SQL 层面搜索 FB 已发送消息
- 只能在前端客户端过滤

---

## 🔙 回滚方案

如需回滚：

```bash
# 1. 回滚代码
git checkout HEAD~1 backend/app/services/message_service.py
git checkout HEAD~1 frontend/src/contexts/MessagesContext.tsx
systemctl restart backend-service && npm run build

# 2. 恢复数据（如已清理）
mysql -u user -p db
> INSERT INTO messages SELECT * FROM messages_fb_sent_backup;
```

---

## 📊 改动统计

- **代码修改：** 2 个文件（后端 1 + 前端 1）
- **新增脚本：** 2 个（清理 + 验证）
- **新增文档：** 3 个
- **预计部署时间：** 20 分钟
- **影响范围：** 仅 FB 已发送消息，其他无影响

---

## 🎯 关键代码

### 后端：发送成功删除记录
```python
# backend/app/services/message_service.py:969-986
if result.get("ok"):
    # 发送成功 → 删除记录
    await db.delete(message)
    await db.commit()
else:
    # 发送失败 → 保存状态
    message.send_status = "發送失敗"
    await db.commit()
```

### 前端：只取已发送
```typescript
// frontend/src/contexts/MessagesContext.tsx:173-180
const fbMessages = (fbResult.data || [])
  .filter((item: FbBroadcastMessage) => item.status === 1) // 只要已发送
  .map(transformFbBroadcastMessage);
```

---

## 📞 相关文档

- **部署指南：** `FB_SENT_NO_SAVE_GUIDE.md` ⭐ 必读
- **系统状态：** `CURRENT_SYSTEM_STATUS.md`
- **清理脚本：** `backend/scripts/cleanup_fb_sent_only.sql`
- **验证脚本：** `backend/scripts/verify_fb_sent_removal.sql`

---

**改动完成！FB 已发送消息不再保存到本地数据库！** 🎉
