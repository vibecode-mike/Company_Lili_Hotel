# FB 配置架构改进方案

## 🎯 问题

当前前端需要在 `.env` 文件中单独配置 FB API 相关变量：
```bash
VITE_FB_API_URL=https://api-youth-tycg.star-bit.io
VITE_FB_FIRM_ACCOUNT=tycg-admin
VITE_FB_FIRM_PASSWORD=123456
```

**缺点：**
- 配置重复（后端 config.py 也有 FB_API_URL）
- 维护困难（两边都要改）
- 安全风险（密码暴露在前端构建文件中）

---

## ✅ 方案 A：后端提供配置 API（推荐）

### 架构图
```
浏览器
  │
  ├─→ ① GET /api/v1/config/fb
  │     返回: { apiUrl, firmAccount }
  │
  ├─→ ② POST /api/v1/auth/fb-login
  │     返回: { jwtToken }
  │
  ├─→ ③ 使用 jwtToken 调用外部 FB API
  │     https://api-youth-tycg.star-bit.io/...
  │
  └─→ ④ GET /api/v1/messages
        返回: 本地 DB 消息
```

### 实现步骤

#### 1. 后端：添加配置 API

**文件：** `backend/app/api/v1/config.py`（新建）

```python
from fastapi import APIRouter
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter()

class FbConfig(BaseModel):
    """FB 配置响应"""
    api_url: str
    firm_account: str
    # 注意：不返回密码

@router.get("/config/fb", response_model=FbConfig)
async def get_fb_config():
    """获取 FB 外部 API 配置"""
    return FbConfig(
        api_url=settings.FB_API_URL,
        firm_account=settings.FB_FIRM_ACCOUNT,
    )
```

**文件：** `backend/app/config.py`（修改）

```python
class Settings(BaseSettings):
    # ... 现有配置 ...

    # FB 外部 API 配置
    FB_API_URL: str = "https://api-youth-tycg.star-bit.io"
    FB_FIRM_ACCOUNT: str = "tycg-admin"
    FB_FIRM_PASSWORD: str  # 从 .env 读取，不暴露给前端
```

**文件：** `backend/app/api/v1/__init__.py`（修改）

```python
from .config import router as config_router

api_router.include_router(config_router, tags=["config"])
```

#### 2. 后端：添加 FB 登录代理

**文件：** `backend/app/api/v1/auth.py`（新建或修改）

```python
from fastapi import APIRouter, HTTPException
import httpx
from app.core.config import settings

router = APIRouter()

@router.post("/auth/fb-login")
async def fb_login():
    """代理 FB firm_login，避免前端暴露密码"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.FB_API_URL}/api/v1/admin/firm_login",
            json={
                "account": settings.FB_FIRM_ACCOUNT,
                "password": settings.FB_FIRM_PASSWORD,
            },
            timeout=10.0,
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="FB 登录失败"
            )

        data = response.json()
        return {"jwt_token": data.get("data", {}).get("access_token")}
```

#### 3. 前端：修改配置获取逻辑

**文件：** `frontend/src/components/auth/AuthContext.tsx`（修改）

```typescript
// 从后端获取配置（替代环境变量）
const [fbConfig, setFbConfig] = useState<{apiUrl: string, firmAccount: string} | null>(null);

useEffect(() => {
  // 获取 FB 配置
  const fetchFbConfig = async () => {
    try {
      const response = await fetch('/api/v1/config/fb');
      const config = await response.json();
      setFbConfig(config);
    } catch (error) {
      console.error('获取 FB 配置失败:', error);
    }
  };

  fetchFbConfig();
}, []);

// 通过后端代理登录（替代直接调用）
const loginToFbApi = useCallback(async () => {
  try {
    const response = await fetch('/api/v1/auth/fb-login', {
      method: 'POST',
    });

    const data = await response.json();
    const token = data.jwt_token;

    if (token) {
      setJwtToken(token);
      return token;
    }
  } catch (error) {
    console.error('FB API 登录失败:', error);
  }

  return null;
}, []);
```

**文件：** `frontend/src/contexts/MessagesContext.tsx`（修改）

```typescript
// 使用从后端获取的配置
const { fbConfig } = useAuth(); // 从 AuthContext 获取
const fbApiBaseUrl = fbConfig?.api_url || '';
```

#### 4. 前端：移除环境变量

删除 `.env.development` 和 `.env.production` 中的：
```bash
# 不再需要
# VITE_FB_API_URL=...
# VITE_FB_FIRM_ACCOUNT=...
# VITE_FB_FIRM_PASSWORD=...
```

---

## ✅ 方案 B：后端完全代理 FB API（最安全）

### 架构图
```
浏览器
  │
  └─→ GET /api/v1/messages
       │
       后端内部：
       ├─→ ① 查询本地 DB（LINE + FB 草稿/排程/失败）
       ├─→ ② 调用外部 FB API（获取已发送）
       └─→ ③ 合并返回
```

### 优点
- ✅ 前端完全不知道外部 FB API
- ✅ 密码只在后端，最安全
- ✅ 可以添加缓存、限流等中间层逻辑
- ✅ 统一错误处理

### 实现步骤

#### 1. 修改后端 messages API

**文件：** `backend/app/api/v1/messages.py`（修改）

```python
from app.clients.fb_message_client import FbMessageClient

@router.get("")
async def get_messages(
    page: int = 1,
    page_size: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取消息列表（自动合并本地 DB + 外部 FB API）"""

    # 1. 查询本地 DB
    query = select(Message).where(...)
    result = await db.execute(query)
    local_messages = result.scalars().all()

    # 2. 并行获取 FB 已发送消息
    fb_client = FbMessageClient()
    fb_sent_messages = await fb_client.get_sent_messages()

    # 3. 合并返回
    all_messages = [
        *[msg.to_dict() for msg in local_messages],
        *fb_sent_messages,
    ]

    return {"data": {"items": all_messages}}
```

#### 2. 前端：简化逻辑

**文件：** `frontend/src/contexts/MessagesContext.tsx`（简化）

```typescript
// 只调用一个 API，后端自动合并
const response = await apiGet('/api/v1/messages?page=1&page_size=100');
const allMessages = response.data.items.map(transformBackendMessage);
setMessages(allMessages);

// 不再需要：
// - 并行调用两个 API
// - 过滤 FB status
// - 前端合并数据
```

---

## 📊 方案对比

| 维度 | 当前方案 | 方案 A（配置 API） | 方案 B（完全代理）|
|------|---------|------------------|------------------|
| 配置维护 | ❌ 两边都要改 | ✅ 只改后端 | ✅ 只改后端 |
| 安全性 | ⚠️ 密码在前端 | ✅ 密码在后端 | ✅ 密码在后端 |
| 前端复杂度 | ⚠️ 较复杂 | ✅ 中等 | ✅ 最简单 |
| 后端复杂度 | ✅ 最简单 | ✅ 中等 | ⚠️ 较复杂 |
| 缓存/限流 | ❌ 无法实现 | ❌ 无法实现 | ✅ 可以实现 |
| 错误处理 | ⚠️ 前端处理 | ⚠️ 前端处理 | ✅ 后端统一处理 |
| 推荐度 | ⚪ 不推荐 | ✅ 推荐 | ✅✅ 最推荐 |

---

## 🚀 迁移建议

### 短期（临时解决方案）
保持当前架构，但添加文档说明为什么需要在前端配置。

### 中期（推荐）
实施**方案 A**：
1. 后端提供 `/api/v1/config/fb` 和 `/api/v1/auth/fb-login`
2. 前端从后端获取配置
3. 移除前端 .env 中的 FB 配置

**优点：** 改动较小，快速实施

### 长期（最佳）
实施**方案 B**：
1. 所有 FB API 调用都通过后端代理
2. 前端只调用 `/api/v1/messages` 一个接口
3. 后端内部处理数据合并

**优点：** 最安全、最可维护

---

## 📝 实施优先级

```
P0（立即）- 添加文档说明当前架构
P1（本周）- 实施方案 A（配置 API）
P2（下月）- 实施方案 B（完全代理）
```

---

## ⚠️ 当前方案的风险

### 1. 密码暴露
```bash
# 构建后的前端代码中会包含明文密码
const fbFirmPassword = "123456"; // ← 可以被用户看到！
```

### 2. 配置不同步
```python
# 后端 config.py
FB_API_URL = "https://api-youth-tycg.star-bit.io"

# 前端 .env
VITE_FB_API_URL = "https://old-api.example.com"  # ← 可能过期
```

### 3. 跨域问题
前端直接调用外部 FB API，可能遇到 CORS 跨域限制。

---

**建议：** 尽快实施方案 A 或方案 B，避免安全和维护问题。
