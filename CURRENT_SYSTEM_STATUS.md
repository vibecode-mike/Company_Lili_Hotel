# 系统状态 - FB 消息处理机制

## ✅ 已实施改动（NEW）

**FB 已发送消息不保存到数据库，只在前端显示！**

详细部署指南：`FB_SENT_NO_SAVE_GUIDE.md`

---

## 🎯 改动前的原始状态（参考）

**改动前系统对 FB 消息的处理：**

### 1️⃣ 后端发送逻辑
**文件：** `backend/app/services/message_service.py` (969-984行)

```python
# 更新消息狀態
if result.get("ok"):
    # ✅ FB 发送成功
    message.send_status = "已發送"
    message.send_time = datetime.now()
    message.send_count = sent_count  # 写入统计数据
else:
    # ❌ FB 发送失败
    message.send_status = "發送失敗"
    message.failure_reason = result.get("error", "未知錯誤")

await db.commit()  # 提交到数据库
```

**关键点：**
- ✅ FB 发送成功 → **写入数据库**（状态="已發送"，统计数据）
- ✅ FB 发送失败 → **写入数据库**（状态="發送失敗"，失败原因）
- ⚠️ 写入的统计数据**只在发送时更新一次，后续不再同步**

---

### 2️⃣ 前端数据获取逻辑
**文件：** `frontend/src/contexts/MessagesContext.tsx` (147-178行)

```typescript
// 并行获取两个数据源
const fetchPromises = [
  apiGet('/api/v1/messages?page=1&page_size=100'),  // 本地 DB
];

if (jwtToken && fbApiBaseUrl) {
  fetchPromises.push(
    fetch(`${fbApiBaseUrl}/api/v1/admin/meta_page/message/gourp_list`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })  // 外部 FB API
  );
}

const [lineResponse, fbResponse] = await Promise.all(fetchPromises);

// 处理 LINE 消息（从本地 DB）
const lineMessages = transformBackendMessage(lineResult);

// 处理 FB 消息（从外部 API）
const fbMessages = transformFbBroadcastMessage(fbResult);

// 合并显示
allMessages.push(...lineMessages, ...fbMessages);
```

**关键点：**
- 本地 DB API (`/api/v1/messages`) 返回：**LINE 全部 + FB 全部**
- 外部 FB API 返回：**FB 全部（最新统计数据）**
- 前端合并两个数据源显示

---

## 📊 数据流图

### FB 消息生命周期

```
[创建草稿]
    ↓
保存到 DB (status = "草稿")
    ↓
[用户点击发送]
    ↓
调用外部 FB API 发送
    ↓
┌─────────────┬─────────────┐
│  发送成功    │   发送失败   │
└─────────────┴─────────────┘
      ↓               ↓
 更新 DB          更新 DB
 status="已發送"  status="發送失敗"
 send_count=N    failure_reason="..."
      ↓               ↓
   提交 DB         提交 DB
```

### 前端列表显示流程

```
用户访问列表页
    ↓
并行请求两个 API
    ├─→ 本地 API: /api/v1/messages
    │   返回: LINE 全部 + FB 全部
    │
    └─→ 外部 API: /meta_page/message/gourp_list
        返回: FB 全部（最新数据）
    ↓
前端合并数据
    ↓
显示列表
```

---

## ⚠️ 当前问题

### 问题 1: 数据重复
**现象：**
- 本地 DB 有 FB 消息（所有状态）
- 外部 API 也返回 FB 消息（所有状态）
- 前端合并后，**FB 消息显示两次**

**影响：**
- 列表中同一个 FB 消息出现两次
- 用户体验差

---

### 问题 2: 本地 DB 的 FB 数据过时
**现象：**
- FB 消息发送成功后，写入 `send_count`
- 之后统计数据在外部 FB 系统变化（用户点击、开启等）
- 本地 DB 的数据**永远是发送时的快照，不再更新**

**影响：**
- 如果前端使用本地 DB 数据，统计不准确
- 必须依赖外部 API 获取最新数据

---

### 问题 3: 存储浪费
**现象：**
- 本地 DB 存储了 FB 已发送消息
- 这些数据从不使用（前端用外部 API 的数据）
- 占用数据库空间

**影响：**
- 数据库容量浪费
- 查询性能可能受影响

---

## 📋 各状态数据存储位置

| 平台 | 状态 | 本地 DB | 外部 API | 前端使用 | 是否重复 |
|------|------|---------|---------|---------|---------|
| LINE | 草稿 | ✅ 有 | ❌ 无 | 本地 DB | ⚪ 不重复 |
| LINE | 已排程 | ✅ 有 | ❌ 无 | 本地 DB | ⚪ 不重复 |
| LINE | 已发送 | ✅ 有 | ❌ 无 | 本地 DB | ⚪ 不重复 |
| LINE | 发送失败 | ✅ 有 | ❌ 无 | 本地 DB | ⚪ 不重复 |
| FB | 草稿 | ✅ 有 | ✅ 有 | **两者都有** | 🔴 **重复** |
| FB | 已排程 | ✅ 有 | ✅ 有 | **两者都有** | 🔴 **重复** |
| FB | 已发送 | ✅ 有（过时） | ✅ 有（最新） | **两者都有** | 🔴 **重复+过时** |
| FB | 发送失败 | ✅ 有 | ✅ 有 | **两者都有** | 🔴 **重复** |

---

## 🎯 理想状态（建议改进）

### 方案 A: FB 已发送不保存（之前讨论的方案）
- ✅ LINE 全部状态：保存 DB
- ✅ FB 草稿/已排程/发送失败：保存 DB
- ❌ FB 已发送：**不保存 DB**，发送成功立即删除
- 📊 前端：本地 DB（LINE + FB 未发送） + 外部 API（FB 已发送）

**优点：** 无重复、无过时数据
**缺点：** 依赖外部 API

---

### 方案 B: 定期同步 FB 统计数据
- ✅ 所有消息都保存 DB
- 🔄 后台定时任务：每 5 分钟同步 FB 已发送消息的统计数据
- 📊 前端：只用本地 DB

**优点：** 数据准确、无外部 API 依赖
**缺点：** 有延迟、需要后台任务

---

### 方案 C: 前端去重（最简单）
- ✅ 后端不改
- 🔧 前端：检测到重复的 FB 消息，只保留外部 API 的数据

**优点：** 改动最小
**缺点：** 本地 DB 仍有过时数据

---

## 📊 数据库实际存储示例

### messages 表中的 FB 消息

| id | platform | send_status | send_count | created_at | 数据来源 | 是否最新 |
|----|----------|-------------|-----------|-----------|---------|---------|
| 1001 | Facebook | 草稿 | 0 | 2026-01-20 | 本地创建 | ✅ 最新 |
| 1002 | Facebook | 已排程 | 0 | 2026-01-21 | 本地创建 | ✅ 最新 |
| 1003 | Facebook | 已發送 | 150 | 2026-01-22 | 发送时写入 | ❌ **过时**（实际可能已变化） |
| 1004 | Facebook | 發送失敗 | 0 | 2026-01-23 | 发送失败 | ✅ 最新 |

**说明：**
- ID 1003 的 `send_count=150` 是发送时的快照
- 实际统计可能已变为 200（有人点击了）
- 前端必须从外部 API 获取最新数据

---

## 🔍 如何验证当前状态

### 1. 查看数据库
```sql
-- 查看 FB 消息
SELECT id, send_status, send_count, send_time, created_at
FROM messages
WHERE platform = 'Facebook'
ORDER BY created_at DESC
LIMIT 10;
```

### 2. 查看前端网络请求
打开浏览器开发者工具 → Network 标签

访问消息列表页，会看到两个请求：
1. `/api/v1/messages` → 本地 DB（LINE + FB）
2. `/api/v1/admin/meta_page/message/gourp_list` → 外部 API（FB）

### 3. 查看前端控制台
```
訊息載入完成: LINE 5 筆, FB 10 筆
```

如果 FB 实际只有 5 条，但显示 10 条，说明有重复。

---

## 📝 总结

**当前原始状态：**
1. ✅ FB 所有状态都保存到本地数据库
2. ✅ 前端从本地 DB + 外部 API 获取 FB 数据
3. ⚠️ 存在数据重复问题
4. ⚠️ 本地 DB 的 FB 已发送数据过时

**这就是系统当前的"原始状态"。** 🎯
