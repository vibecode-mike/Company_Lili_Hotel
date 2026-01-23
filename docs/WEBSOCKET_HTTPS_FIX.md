# WebSocket HTTPS 连接问题修复指南

## 🔍 错误信息

```
SecurityError: Failed to construct 'WebSocket': An insecure WebSocket connection
may not be initiated from a page loaded over HTTPS.
```

## 📊 问题分析

### 当前状况
- ✅ 页面通过 **HTTPS** 加载
- ❌ WebSocket 尝试使用 **ws://** (不安全)

### 浏览器安全策略
| 页面协议 | 允许的 WebSocket | 禁止的 WebSocket |
|---------|-----------------|------------------|
| HTTPS | wss:// ✅ | ws:// ❌ |
| HTTP | ws:// ✅ | wss:// 可以但不推荐 |

---

## 🔧 解决方案（3选1）

### 方案 1: Nginx 反向代理（推荐）✅

让 WebSocket 也走 nginx，自动使用 HTTPS/WSS。

#### 1. 修改前端配置

**文件：** `frontend/.env.development` 和 `.env.production`

```bash
# 改动前
VITE_WS_PORT=8700

# 改动后（走 nginx，不指定端口）
VITE_WS_PORT=
```

#### 2. 配置 Nginx

**文件：** `/etc/nginx/sites-available/your-site`

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ✅ WebSocket 代理（关键！）
    location /api/v1/ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 超时配置
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

#### 3. 重启服务

```bash
# 重新加载 nginx
sudo nginx -t
sudo systemctl reload nginx

# 重启前端
cd /data2/lili_hotel/frontend
npm run build
```

---

### 方案 2: WebSocket 端口也配置 SSL

如果不想走 nginx 代理，直接让 8700 端口支持 SSL。

#### 1. 后端配置 SSL

**需要修改后端代码，让 8700 端口支持 HTTPS/WSS。**

**文件：** `backend/app/main.py`

```python
import ssl

# 创建 SSL 上下文
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain('/path/to/cert.pem', '/path/to/key.pem')

# 启动时使用 SSL
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8700,
        ssl_keyfile="/path/to/key.pem",
        ssl_certfile="/path/to/cert.pem",
    )
```

#### 2. 前端配置不变

```bash
VITE_WS_PORT=8700
```

---

### 方案 3: 开发环境临时方案（不推荐）

**仅用于本地开发，生产环境禁止使用！**

#### 1. 使用 HTTP 而不是 HTTPS

访问页面时使用：
```
http://localhost:5173  ✅
而不是
https://localhost:5173  ❌
```

#### 2. 或者禁用浏览器安全检查（仅开发）

**Chrome:**
```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"

# Windows
chrome.exe --disable-web-security --user-data-dir="C:\tmp\chrome_dev"

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
```

⚠️ **警告：** 此方法会禁用所有安全检查，仅用于本地开发！

---

## 🎯 推荐实施步骤

### 第一步：诊断当前状况

打开浏览器控制台，运行：

```javascript
console.log('页面协议:', window.location.protocol);
console.log('WebSocket URL:', config.ws.getUrl('/api/v1/ws/test'));
```

**预期输出：**
```
页面协议: https:
WebSocket URL: wss://yourdomain.com/api/v1/ws/test  ✅
```

**实际输出（有问题）：**
```
页面协议: https:
WebSocket URL: ws://yourdomain.com:8700/api/v1/ws/test  ❌
```

### 第二步：实施方案 1（Nginx 代理）

1. 修改 `.env` 文件：
```bash
VITE_WS_PORT=
```

2. 配置 nginx（参考上面的配置）

3. 重启服务

4. 测试：
```javascript
// 应该输出
WebSocket URL: wss://yourdomain.com/api/v1/ws/test  ✅
```

---

## 🔍 调试技巧

### 1. 检查 WebSocket 连接

```javascript
// 浏览器控制台
const ws = new WebSocket('wss://yourdomain.com/api/v1/ws/test');
ws.onopen = () => console.log('✅ 连接成功');
ws.onerror = (e) => console.error('❌ 连接失败', e);
```

### 2. 检查 Nginx 配置

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

### 3. 检查后端 WebSocket

```bash
# 测试后端 WebSocket 是否运行
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:8000/api/v1/ws/test
```

---

## 📝 常见错误

### 错误 1: nginx 没有 Upgrade 头
```nginx
# ❌ 错误配置
location /api/v1/ws/ {
    proxy_pass http://localhost:8000;
}

# ✅ 正确配置
location /api/v1/ws/ {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 错误 2: WebSocket 超时断开
```nginx
# 添加超时配置
proxy_connect_timeout 7d;
proxy_send_timeout 7d;
proxy_read_timeout 7d;
```

### 错误 3: VITE_WS_PORT 配置错误
```bash
# ❌ 错误（直连 8700 端口）
VITE_WS_PORT=8700

# ✅ 正确（走 nginx）
VITE_WS_PORT=
```

---

## ✅ 验证成功

### 1. 浏览器控制台无错误
```
✅ WebSocket 连接成功
✅ 无 SecurityError
```

### 2. Network 标签显示
```
Protocol: wss  ✅
Status: 101 Switching Protocols  ✅
```

### 3. 聊天功能正常
```
✅ 能发送消息
✅ 能接收实时消息
✅ 连接稳定不断开
```

---

## 🔗 相关资源

- [Nginx WebSocket 代理官方文档](http://nginx.org/en/docs/http/websocket.html)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [浏览器混合内容安全策略](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

---

**推荐：使用方案 1（Nginx 反向代理）！** 🎯
