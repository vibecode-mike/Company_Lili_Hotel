# 安全最佳實踐指南

## 概述

本文檔說明 Lili Hotel CRM 後端系統的安全實踐和防護措施。

---

## 🔒 SQL 注入防護

### 當前防護措施

#### 1. **參數化查詢**（主要防護）
所有數據庫查詢使用 SQLAlchemy ORM，自動進行參數化處理：

```python
# ✅ 安全：使用 SQLAlchemy 參數化查詢
query = select(Member).where(Member.id == member_id)
```

```python
# ❌ 危險：絕不要使用字符串拼接
query = f"SELECT * FROM members WHERE id = {member_id}"  # 禁止！
```

#### 2. **輸入驗證**（多層防護）
使用 `app.utils.validators.InputValidator` 進行輸入驗證：

```python
from app.utils.validators import InputValidator

# Schema 層驗證（第一層）
class MemberSearchParams(BaseModel):
    search: Optional[str] = Field(None, max_length=100)

    @field_validator('search')
    @classmethod
    def validate_search(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return InputValidator.sanitize_search_input(v)

# API 層驗證（第二層）
if params.search:
    escaped_search = InputValidator.escape_like_pattern(params.search)
    search_pattern = f"%{escaped_search}%"
    query = query.where(Member.name.like(search_pattern, escape='\\'))
```

#### 3. **LIKE 模式轉義**
防止 LIKE 通配符注入攻擊：

```python
# ✅ 安全：轉義特殊字符
escaped = InputValidator.escape_like_pattern(user_input)  # % → \%, _ → \_
query = query.where(Model.field.like(f"%{escaped}%", escape='\\'))
```

```python
# ❌ 危險：未轉義的 LIKE
query = query.where(Model.field.like(f"%{user_input}%"))  # 可被 % 和 _ 注入
```

### 禁止的模式

```python
# ❌ 字符串拼接 SQL
query = f"SELECT * FROM users WHERE name = '{name}'"

# ❌ 直接執行原始 SQL（除非絕對必要）
db.execute(f"DELETE FROM users WHERE id = {user_id}")

# ❌ 未驗證的用戶輸入
search_pattern = f"%{request.query_params['search']}%"
```

---

## 🔐 認證與授權

### JWT Token 管理

```python
# 創建 Token
from app.core.security import create_access_token

token = create_access_token({"sub": str(user.id)})
```

### 密碼處理

```python
# ✅ 使用 bcrypt 加密
from app.core.security import get_password_hash, verify_password

hashed = get_password_hash(password)
is_valid = verify_password(plain_password, hashed_password)
```

```python
# ❌ 絕不要明文存儲密碼
user.password = password  # 禁止！
```

---

## 📋 輸入驗證規則

### 搜索關鍵字
- **最大長度**: 100 字符
- **允許字符**: 字母、數字、中文、空格、基本符號（`@.-+()`）
- **禁止模式**: SQL 關鍵字（`--`, `;`, `/*`, `*/`, `union`, `select` 等）

### 標籤名稱
- **最大長度**: 50 字符
- **允許字符**: 字母、數字、中文、空格、連字符
- **數量限制**: 每次請求最多 20 個標籤

### 備註內容
- **最大長度**: 1000 字符
- **無特殊字符限制**（已進行 HTML 轉義）

### 分頁參數
- **頁碼**: 1 - 10000
- **每頁數量**: 1 - 100

---

## 🛡️ XSS 防護

### 前端顯示
所有用戶輸入在前端顯示前必須進行 HTML 轉義：

```typescript
// ✅ React 自動轉義
<div>{userInput}</div>

// ❌ 危險：使用 dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

### API 響應
後端不對輸出進行 HTML 轉義（由前端處理）：

```python
# ✅ 返回原始數據
return {"note": member.internal_note}

# ❌ 不要在後端進行 HTML 轉義
return {"note": html.escape(member.internal_note)}
```

---

## 🔑 敏感信息管理

### 環境變量
所有敏感配置使用環境變量：

```python
# ✅ 從環境變量讀取
class Settings(BaseSettings):
    SECRET_KEY: str  # 必須從 .env 讀取
    DATABASE_URL: str  # 必須從 .env 讀取
```

```python
# ❌ 硬編碼敏感信息
SECRET_KEY = "my-secret-key-123"  # 禁止！
DATABASE_URL = "mysql://root:password@localhost/db"  # 禁止！
```

### 日誌記錄
禁止在日誌中記錄敏感信息：

```python
# ✅ 安全日誌
logger.info(f"User {user.id} logged in")

# ❌ 洩漏敏感信息
logger.info(f"User logged in with password: {password}")  # 禁止！
logger.debug(f"Token: {access_token}")  # 禁止！
```

---

## 🌐 CORS 安全

### 配置建議

```python
# 開發環境
ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:3000"

# 生產環境
ALLOWED_ORIGINS = "https://yourdomain.com"

# ❌ 避免在生產環境使用
ALLOWED_ORIGINS = "*"  # 僅限開發！
```

---

## 🔍 錯誤處理

### 錯誤訊息規範

```python
# ✅ 用戶友好的錯誤訊息
raise HTTPException(status_code=400, detail="搜索關鍵字包含非法字符")

# ❌ 洩漏系統信息
raise HTTPException(
    status_code=500,
    detail=f"Database error: {str(e)}"  # 可能洩漏數據庫結構
)
```

### 異常處理層級

1. **Schema 層**: 驗證輸入格式和範圍
2. **Service 層**: 業務邏輯錯誤
3. **Database 層**: 數據庫操作錯誤（具體分類）
4. **API 層**: 統一錯誤響應格式

---

## 📊 安全檢查清單

### 代碼審查檢查項

- [ ] 所有用戶輸入都經過驗證和清理
- [ ] 使用參數化查詢，無字符串拼接 SQL
- [ ] LIKE 查詢使用 escape 參數
- [ ] 敏感信息使用環境變量
- [ ] 密碼使用 bcrypt 加密
- [ ] 日誌不包含敏感信息
- [ ] 錯誤訊息不洩漏系統細節
- [ ] API 有適當的速率限制（TODO）
- [ ] HTTPS 強制啟用（生產環境）

### 定期安全掃描

```bash
# 依賴漏洞掃描
pip install safety
safety check

# 代碼安全掃描
pip install bandit
bandit -r app/
```

---

## 📚 參考資源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SQLAlchemy Security](https://docs.sqlalchemy.org/en/20/faq/security.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Pydantic Validation](https://docs.pydantic.dev/latest/concepts/validators/)

---

## 📝 更新記錄

### 2025-11-27
- ✅ 添加 SQL 注入防護（輸入驗證 + LIKE 轉義）
- ✅ 創建 `InputValidator` 工具類
- ✅ 更新 `MemberSearchParams` Schema 驗證
- ✅ 修復 `members.py` 和 `tags.py` API 端點
- ✅ 改進數據庫異常處理

### TODO
- [ ] 添加 API 速率限制（防止暴力攻擊）
- [ ] 實施 CSRF 防護
- [ ] 添加 API 請求簽名驗證
- [ ] 定期安全審計和漏洞掃描
