# FB 已发送不保存 - 部署指南

## 🎯 改动目标

**FB 已发送消息不保存到数据库，只在前端显示（从外部 API 获取）**

---

## 📊 改动对比

| 平台 | 状态 | 改动前 | 改动后 |
|------|------|--------|--------|
| FB | 草稿 | ✅ 保存 DB | ✅ 保存 DB（不变） |
| FB | 已排程 | ✅ 保存 DB | ✅ 保存 DB（不变） |
| FB | **已发送** | ✅ 保存 DB（过时） | ❌ **删除** |
| FB | 发送失败 | ✅ 保存 DB | ✅ 保存 DB（不变） |
| LINE | 所有 | ✅ 保存 DB | ✅ 保存 DB（不变） |

---

## 📦 修改的文件

### 后端（1个文件）
- `backend/app/services/message_service.py` (969-986行)
  - 发送成功 → 删除 DB 记录
  - 发送失败 → 保存失败状态

### 前端（1个文件）
- `frontend/src/contexts/MessagesContext.tsx` (147-180行)
  - 只从外部 API 获取已发送（status === 1）
  - 避免与本地 DB 的草稿/排程/失败重复

### 脚本（2个文件）
- `backend/scripts/cleanup_fb_sent_only.sql` - 清理历史已发送消息
- `backend/scripts/verify_fb_sent_removal.sql` - 验证实施结果

---

## 🚀 部署步骤（20分钟）

### 步骤 1: 部署代码（10分钟）

```bash
# 1. 后端
cd /data2/lili_hotel/backend
# 部署你的方式（git pull / 复制文件等）
systemctl restart your-backend-service

# 2. 前端
cd /data2/lili_hotel/frontend
npm run build
# 部署构建文件
```

---

### 步骤 2: 功能测试（5分钟）

#### 测试 1: FB 草稿（应保存）
```
1. 创建 FB 草稿
2. 查数据库：SELECT * FROM messages WHERE platform='Facebook' AND send_status='草稿';
3. ✅ 应该有记录
```

#### 测试 2: FB 发送成功（应删除）
```
1. 发送 FB 消息（确保成功）
2. 查数据库：SELECT * FROM messages WHERE id=<刚发送的ID>;
3. ✅ 应该无记录（已删除）
4. 查前端列表：✅ 能看到该消息（来自外部 API）
```

#### 测试 3: FB 发送失败（应保存）
```
1. 发送 FB 消息（模拟失败）
2. 查数据库：SELECT * FROM messages WHERE platform='Facebook' AND send_status='發送失敗';
3. ✅ 应该有记录
```

#### 测试 4: LINE 消息（不受影响）
```
1. 创建并发送 LINE 消息
2. 查数据库：SELECT * FROM messages WHERE platform='LINE';
3. ✅ 所有状态正常
```

---

### 步骤 3: 验证（2分钟）

```bash
mysql -u your_user -p your_database < backend/scripts/verify_fb_sent_removal.sql
```

**检查输出：**
- ✅ FB 已发送 count = 0
- ✅ FB 其他状态有数据
- ✅ LINE 所有状态正常

---

### 步骤 4: 清理历史数据（3分钟，可选）

**⚠️ 重要：测试通过后再执行！**

```bash
mysql -u your_user -p your_database < backend/scripts/cleanup_fb_sent_only.sql
```

**效果：**
- 删除历史已发送的 FB 消息
- 自动创建备份表 `messages_fb_sent_backup`
- 不影响草稿/排程/失败/LINE

---

## ✅ 验收标准

### 数据库检查
```sql
-- FB 已发送应为 0
SELECT COUNT(*) FROM messages
WHERE platform='Facebook' AND send_status='已發送';
-- 结果：0

-- FB 其他状态正常
SELECT send_status, COUNT(*) FROM messages
WHERE platform='Facebook'
GROUP BY send_status;
-- 结果：只有草稿/已排程/發送失敗

-- LINE 不受影响
SELECT COUNT(*) FROM messages WHERE platform='LINE';
-- 结果：与改动前一致
```

### 前端检查
- ✅ FB 草稿显示正常
- ✅ FB 已发送显示正常（来自外部 API）
- ✅ FB 发送失败显示正常
- ✅ LINE 所有状态显示正常
- ✅ 无重复消息

---

## 🔄 数据流变化

### 改动前
```
FB 发送 → 写入 DB (status="已發送", send_count=N)
前端显示 → 本地 DB（过时） + 外部 API（最新） ← 重复
```

### 改动后
```
FB 发送 → 删除 DB 记录
前端显示 → 本地 DB（草稿/排程/失败） + 外部 API（已发送） ← 无重复
```

---

## ⚠️ 注意事项

### 1. 外部 API 依赖
- FB 已发送消息完全依赖外部 API
- 外部 API 故障时，已发送消息不显示
- 前端已添加错误处理和降级

### 2. 性能
- 列表加载仍需等待外部 API（2-5秒）
- 多用户并发访问增加外部 API 调用

### 3. 搜索限制
- 无法在 SQL 层面搜索 FB 已发送消息
- 只能前端客户端过滤

---

## 🔙 回滚步骤

如果出现问题需要回滚：

### 1. 回滚代码
```bash
cd /data2/lili_hotel/backend
git checkout HEAD~1 app/services/message_service.py
systemctl restart backend-service

cd /data2/lili_hotel/frontend
git checkout HEAD~1 src/contexts/MessagesContext.tsx
npm run build
```

### 2. 恢复数据（如已清理）
```sql
INSERT INTO messages
    (id, template_id, message_title, send_status, send_time, send_count,
     platform, channel_id, fb_message_json, created_at)
SELECT
    id, template_id, message_title, send_status, send_time, send_count,
    platform, channel_id, fb_message_json, created_at
FROM messages_fb_sent_backup;
```

---

## 📝 快速命令参考

```bash
# 验证实施
mysql -u user -p db < backend/scripts/verify_fb_sent_removal.sql

# 清理历史数据
mysql -u user -p db < backend/scripts/cleanup_fb_sent_only.sql

# 查看 FB 消息状态
mysql -u user -p db -e "SELECT send_status, COUNT(*) FROM messages WHERE platform='Facebook' GROUP BY send_status;"
```

---

## ✅ 完成检查清单

- [ ] 后端代码已部署
- [ ] 前端代码已部署
- [ ] 测试 1：FB 草稿保存正常
- [ ] 测试 2：FB 发送成功后记录删除
- [ ] 测试 3：FB 发送失败记录保留
- [ ] 测试 4：LINE 消息正常
- [ ] 运行验证脚本通过
- [ ] 前端列表显示正常
- [ ] 执行清理历史数据（可选）

---

**部署完成！FB 已发送消息不再保存到数据库，只在前端显示！** 🎉
