# 故障排查：没画面问题修复记录

## 🔍 问题描述

**症状：** 前端页面打不开，显示"没画面"

**时间：** 2026-01-23 19:00

---

## 📊 问题诊断

### 1. 检查后端状态
```bash
tail -f /tmp/backend.log
```

**发现问题：**
```python
ModuleNotFoundError: No module named 'app.core.config'
```

### 2. 根本原因
在实施方案 B 时，修改 `message_service.py` 时导入路径写错：

```python
# ❌ 错误（导致后端启动失败）
from app.core.config import settings

# ✅ 正确
from app.config import settings
```

---

## 🔧 修复步骤

### 步骤 1: 修正导入路径

**文件：** `backend/app/services/message_service.py`

```python
# 修改第 24 行
from app.config import settings  # ✅ 正确
```

### 步骤 2: 重启后端

```bash
# 杀掉占用端口的进程
fuser -k 8700/tcp

# 重新启动后端
source /data2/lili_hotel/venv/bin/activate
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8700 > /tmp/backend.log 2>&1 &

# 等待启动
sleep 5

# 验证启动成功
curl http://localhost:8700/api/v1/messages
```

### 步骤 3: 重启前端

```bash
cd /data2/lili_hotel/frontend
npm run dev
```

**访问：** http://localhost:5174/

---

## ✅ 验证成功

### 1. 后端验证
```bash
# 检查后端进程
ps aux | grep uvicorn

# 检查启动日志
grep "Application startup complete" /tmp/backend.log

# 测试 API
curl http://localhost:8700/api/v1/messages | jq '.code'
# 应返回：200
```

### 2. 前端验证
```bash
# 检查前端进程
ps aux | grep vite

# 访问前端
# http://localhost:5174/
```

### 3. 浏览器验证
- ✅ 页面正常显示
- ✅ 消息列表正常加载
- ✅ 控制台无错误

---

## 🚨 相关问题：WebSocket HTTPS 错误

在修复"没画面"问题的同时，也发现了 WebSocket HTTPS 错误：

```
SecurityError: Failed to construct 'WebSocket':
An insecure WebSocket connection may not be initiated from a page loaded over HTTPS.
```

**修复方法：** 参见 `docs/WEBSOCKET_HTTPS_FIX.md`

---

## 📝 常见后端启动失败原因

### 1. 导入错误
```python
ModuleNotFoundError: No module named 'xxx'
```
**解决：** 检查导入路径是否正确

### 2. 端口被占用
```
ERROR: [Errno 98] Address already in use
```
**解决：** `fuser -k 8700/tcp`

### 3. 数据库连接失败
```
sqlalchemy.exc.OperationalError
```
**解决：** 检查数据库配置和连接

### 4. 环境变量缺失
```
KeyError: 'SECRET_KEY'
```
**解决：** 检查 `.env` 文件

### 5. 依赖包缺失
```
ImportError: No module named 'xxx'
```
**解决：** `pip install -r requirements.txt`

---

## 🔍 调试技巧

### 1. 实时查看后端日志
```bash
tail -f /tmp/backend.log
```

### 2. 搜索错误信息
```bash
grep -i "error" /tmp/backend.log | tail -20
```

### 3. 检查启动信息
```bash
grep -E "Uvicorn running|Application startup|Started server" /tmp/backend.log
```

### 4. 测试特定 API
```bash
# 测试是否响应
curl -s -o /dev/null -w "%{http_code}" http://localhost:8700/api/v1/messages

# 查看完整响应
curl http://localhost:8700/api/v1/messages | jq .
```

### 5. 检查端口占用
```bash
# 查看端口占用
lsof -i :8700

# 或
netstat -tulpn | grep 8700
```

---

## 📋 快速修复清单

遇到"没画面"问题时，按顺序检查：

- [ ] 后端是否运行？`ps aux | grep uvicorn`
- [ ] 前端是否运行？`ps aux | grep vite`
- [ ] 后端日志有无错误？`tail /tmp/backend.log`
- [ ] 前端日志有无错误？浏览器 F12 控制台
- [ ] API 是否响应？`curl http://localhost:8700/api/v1/messages`
- [ ] 端口是否被占用？`lsof -i :8700`
- [ ] 环境变量是否正确？`cat .env`
- [ ] 导入路径是否正确？检查修改的文件
- [ ] 数据库是否连接？检查 `DATABASE_URL`

---

## 🎯 预防措施

### 1. 修改代码后立即测试
```bash
# 修改后立即重启后端测试
systemctl restart backend-service
sleep 5
curl http://localhost:8700/api/v1/messages
```

### 2. 使用导入检查工具
```bash
# 检查 Python 导入
python -c "from app.config import settings; print('✅ OK')"
```

### 3. 监控日志
```bash
# 开启实时日志监控
tmux new-session -d 'tail -f /tmp/backend.log'
```

### 4. 版本控制
```bash
# 提交前测试
git stash
# 测试原始版本是否正常
git stash pop
# 测试修改后是否正常
```

---

## 🔗 相关文档

- **方案 B 实施：** `docs/SOLUTION_B_IMPLEMENTATION.md`
- **WebSocket 修复：** `docs/WEBSOCKET_HTTPS_FIX.md`
- **架构对比：** `docs/ARCHITECTURE_COMPARISON.md`

---

**记录时间：** 2026-01-23 19:10
**修复人员：** Claude
**状态：** ✅ 已修复
