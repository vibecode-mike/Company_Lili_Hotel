# 日誌記錄最佳實踐指南

## 概述

本指南定義 Lili Hotel CRM 後端系統的日誌記錄標準和最佳實踐。

---

## 🎯 日誌級別使用規範

### DEBUG（調試級別）
**用途**：開發和調試時的詳細信息

**適用場景**：
- 函數調用追蹤
- 變量狀態檢查
- 循環迭代細節
- 開發時的臨時日誌

**示例**：
```python
logger.debug(f"Processing member: {member.id}")
logger.debug(f"Query parameters: {params}")
logger.debug(f"Iteration {i}/{total}: processing item {item.id}")
```

**生產環境**：默認不輸出（可通過配置啟用）

---

### INFO（信息級別）
**用途**：記錄正常的業務操作和重要事件

**適用場景**：
- 重要業務操作完成（創建、更新、刪除）
- 系統啟動/關閉
- 重要的狀態變更
- API 請求摘要（不含敏感信息）

**示例**：
```python
# ✅ 良好示例
logger.info(f"Created member ID: {member.id}")
logger.info(f"Updated campaign ID: {campaign.id}, status: {campaign.status}")
logger.info(f"Deleted tag ID: {tag.id}")
logger.info("Application started successfully")

# ❌ 過度使用
logger.info(f"✅ Created member: {member.first_name} {member.last_name} (ID: {member.id})")  # 包含個人信息
logger.info(f"Processing member {member.id}")  # 應該用 DEBUG
```

**原則**：
- 記錄 **什麼** 操作完成了
- 不包含個人隱私信息（姓名、電話、Email）
- 簡潔明確，包含關鍵 ID
- 避免過度使用表情符號

**生產環境**：正常輸出

---

### WARNING（警告級別）
**用途**：可能的問題或異常情況，但不影響系統運行

**適用場景**：
- 重複的數據提交
- 配置缺失但有默認值
- 即將達到的限制
- 棄用 API 的使用
- 性能問題預警

**示例**：
```python
logger.warning(f"Duplicate email detected: {email}")
logger.warning(f"Member {member_id} has no tags, using defaults")
logger.warning(f"API rate limit at 80% for user {user_id}")
logger.warning(f"Using deprecated function: {func_name}")
logger.warning(f"Slow query detected: {query_time}ms > threshold")
```

**原則**：
- 表示潛在問題
- 不會中斷當前操作
- 可能需要人工關注
- 應該被監控和告警

**生產環境**：正常輸出並監控

---

### ERROR（錯誤級別）
**用途**：錯誤發生，但系統可以繼續運行

**適用場景**：
- 處理請求時的錯誤
- 外部服務調用失敗
- 數據驗證失敗
- 業務邏輯錯誤
- 可恢復的數據庫錯誤

**示例**：
```python
logger.error(f"Failed to send LINE message: {e}", exc_info=True)
logger.error(f"Database query failed for member {member_id}: {e}")
logger.error(f"External API timeout: {api_url}")
logger.error(f"Validation error for field '{field}': {error_msg}")
```

**原則**：
- 使用 `exc_info=True` 記錄堆棧追蹤
- 包含足夠的上下文信息（IDs, 參數）
- 不包含敏感信息（密碼、Token）
- 應該觸發監控告警

**生產環境**：正常輸出並觸發告警

---

### CRITICAL（嚴重錯誤）
**用途**：嚴重錯誤，系統可能無法繼續運行

**適用場景**：
- 數據庫連接失敗
- 關鍵服務不可用
- 配置錯誤導致無法啟動
- 數據完整性問題
- 系統資源耗盡

**示例**：
```python
logger.critical("Database connection failed, cannot start application")
logger.critical(f"Critical service unavailable: {service_name}")
logger.critical("Out of memory, shutting down gracefully")
```

**原則**：
- 表示系統級別的嚴重問題
- 通常需要立即人工介入
- 應該觸發緊急告警（簡訊、電話）

**生產環境**：正常輸出並觸發緊急告警

---

## 📝 日誌格式規範

### 標準格式

```python
# 結構化日誌格式
logger.info(
    f"Operation: {operation}, "
    f"Resource: {resource_type}:{resource_id}, "
    f"Result: {result}"
)

# 示例
logger.info(f"Operation: CREATE, Resource: Member:{member.id}, Result: SUCCESS")
logger.warning(f"Operation: UPDATE, Resource: Campaign:{campaign_id}, Result: DUPLICATE")
logger.error(f"Operation: DELETE, Resource: Tag:{tag_id}, Result: FAILED, Error: {e}")
```

### 避免的格式

```python
# ❌ 過於簡單，缺少上下文
logger.info("Done")
logger.info("OK")

# ❌ 過於冗長，包含不必要的信息
logger.info(f"✅🎉 Successfully created new member with name {member.first_name} {member.last_name} and email {member.email} at {datetime.now()}")

# ❌ 包含敏感信息
logger.info(f"User logged in with password: {password}")
logger.debug(f"JWT Token: {token}")
logger.info(f"API Key: {api_key}")
```

---

## 🔒 安全規範

### 禁止記錄的信息

- ❌ 密碼（明文或哈希）
- ❌ JWT Token
- ❌ API Key / Secret Key
- ❌ 信用卡號
- ❌ 身分證號碼（完整）
- ❌ 完整的 Session ID

### 允許記錄的信息

- ✅ 用戶 ID（數字 ID）
- ✅ 會員 LINE UID（已脫敏）
- ✅ 操作類型和結果
- ✅ 資源 ID
- ✅ 錯誤訊息（不含敏感信息）
- ✅ API 端點名稱
- ✅ 執行時間和性能指標

### 敏感信息脫敏

```python
# ✅ Email 脫敏
email_masked = f"{email[:3]}***@{email.split('@')[1]}"
logger.info(f"Email verification sent to: {email_masked}")

# ✅ 手機號碼脫敏
phone_masked = f"{phone[:4]}****{phone[-2:]}"
logger.info(f"SMS sent to: {phone_masked}")

# ✅ ID Number 脫敏
id_masked = f"{id_number[:3]}***{id_number[-2:]}"
logger.warning(f"Duplicate ID number: {id_masked}")
```

---

## 📊 性能考量

### 避免過度日誌

```python
# ❌ 在循環中過度記錄
for member in members:
    logger.info(f"Processing member {member.id}")  # 可能產生數千條日誌

# ✅ 批量摘要
logger.info(f"Processing {len(members)} members")
logger.debug(f"Member IDs: {[m.id for m in members[:10]]}...")  # 僅 DEBUG 級別記錄前幾個
```

### 延遲計算

```python
# ❌ 總是計算複雜字符串
logger.debug(f"Complex calculation: {expensive_operation()}")

# ✅ 僅在 DEBUG 啟用時計算
if logger.isEnabledFor(logging.DEBUG):
    logger.debug(f"Complex calculation: {expensive_operation()}")
```

---

## 🎨 實際應用示例

### 會員創建

```python
# ❌ 修復前
logger.info(f"✅ Created member: {member.first_name} {member.last_name} (ID: {member.id})")

# ✅ 修復後
logger.info(f"Created member ID: {member.id}, source: {member.source}")
logger.debug(f"Member details - Name: {member.first_name} {member.last_name}, Email: {member.email}")
```

### 錯誤處理

```python
# ❌ 修復前
try:
    result = await some_operation()
except Exception as e:
    logger.error(f"Error: {e}")

# ✅ 修復後
try:
    result = await some_operation()
except ValueError as e:
    logger.warning(f"Validation error in operation '{operation_name}': {e}")
except DatabaseError as e:
    logger.error(f"Database error for operation '{operation_name}', entity ID: {entity_id}", exc_info=True)
except Exception as e:
    logger.exception(f"Unexpected error in operation '{operation_name}', entity ID: {entity_id}")
```

### 外部 API 調用

```python
# ✅ 良好示例
logger.info(f"Calling LINE API: {endpoint}")
try:
    response = await line_api.call(endpoint, data)
    logger.info(f"LINE API success: {endpoint}, status: {response.status}")
except Timeout as e:
    logger.warning(f"LINE API timeout: {endpoint}, retry attempt: {retry_count}")
except APIError as e:
    logger.error(f"LINE API error: {endpoint}, status: {e.status_code}, error: {e.message}")
```

---

## 🔧 配置建議

### 開發環境

```python
# config/logging_dev.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'DEBUG',  # 顯示所有級別
        },
    },
    'root': {
        'level': 'DEBUG',
        'handlers': ['console'],
    },
}
```

### 生產環境

```python
# config/logging_prod.py
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/lili_hotel/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'level': 'INFO',  # INFO 及以上
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/lili_hotel/error.log',
            'maxBytes': 10485760,
            'backupCount': 10,
            'level': 'ERROR',  # 僅 ERROR 和 CRITICAL
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['file', 'error_file'],
    },
}
```

---

## 📋 檢查清單

### 提交代碼前檢查

- [ ] 所有 logger.info() 不包含個人隱私信息
- [ ] 錯誤日誌使用 exc_info=True 或 logger.exception()
- [ ] 敏感信息已脫敏
- [ ] DEBUG 日誌僅用於開發調試
- [ ] 循環中沒有過度日誌
- [ ] 日誌訊息簡潔明確
- [ ] 包含足夠的上下文（IDs）

### Code Review 檢查

- [ ] 日誌級別使用正確
- [ ] 沒有洩漏敏感信息
- [ ] 錯誤處理完整
- [ ] 性能影響可接受
- [ ] 日誌格式一致

---

## 📚 參考資源

- [Python Logging HOWTO](https://docs.python.org/3/howto/logging.html)
- [Python Logging Cookbook](https://docs.python.org/3/howto/logging-cookbook.html)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

---

## 📝 更新記錄

### 2025-11-27
- ✅ 創建日誌最佳實踐指南
- ✅ 定義日誌級別使用規範
- ✅ 添加安全和性能規範
- ✅ 提供實際應用示例
