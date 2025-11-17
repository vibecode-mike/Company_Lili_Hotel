# 釐清問題

檢查管理員是否已完成 LINE OA 基本設定與官方帳號綁定的具體邏輯為何？檢查哪些欄位或狀態？

# 定位

Feature：spec/features/卡控流程.feature Rule 標記為 #TODO（約第7-13行）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 檢查 LineOAConfig 表是否有該管理員的設定記錄 |
| B | 檢查 Admin.line_oa_configured 布林欄位（需新增） |
| C | 檢查 Messaging API 設定完整性（Channel ID、Secret、Token 都已填寫） |
| Short | 其他邏輯（<=5字）|

# 影響範圍

影響卡控流程判斷邏輯、使用者導航體驗、資料庫 schema 設計，以及功能模組存取權限管理。

# 優先級

High

---

# 用戶決策

**決策日期：** 2025-11-12

**決策內容：** C - 檢查 Messaging API 設定完整性（Channel ID、Secret、Token 都已填寫）

**用戶原話：** "C"

# 規格整合

## 新增內容

### spec/features/卡控流程.feature

#### 更新 Rule：檢查管理員是否已完成 LINE OA 基本設定（第 7-37 行）

將原本的 `#TODO` 替換為以下完整規格：

```gherkin
Rule: 檢查管理員是否已完成 LINE OA 基本設定

  Example: 檢查 Messaging API 設定完整性
    Given 系統需要驗證管理員「張經理」的 LINE OA 設定狀態
    When 系統檢查該管理員的 Messaging API 設定
    Then 系統檢查以下必要欄位是否都已填寫
      | 欄位名稱              | 欄位說明                   |
      | channel_id            | LINE Channel ID            |
      | channel_secret        | LINE Channel Secret        |
      | channel_access_token  | LINE Channel Access Token  |
    And 所有欄位都不為空值時，判定為「已完成設定」
    And 任一欄位為空值時，判定為「未完成設定」

  Example: 管理員已完成 LINE OA 基本設定
    Given 管理員「李經理」的 Messaging API 設定如下
      | channel_id       | channel_secret      | channel_access_token     |
      | 1234567890       | abcdef1234567890    | xyz9876543210abcdefghijk |
    When 系統檢查該管理員的 LINE OA 設定狀態
    Then 系統判定為「已完成設定」

  Example: 管理員未完成 LINE OA 基本設定（缺少 Token）
    Given 管理員「王經理」的 Messaging API 設定如下
      | channel_id       | channel_secret      | channel_access_token |
      | 1234567890       | abcdef1234567890    | (空值)               |
    When 系統檢查該管理員的 LINE OA 設定狀態
    Then 系統判定為「未完成設定」

  Example: 管理員未完成 LINE OA 基本設定（所有欄位為空）
    Given 管理員「陳經理」尚未填寫任何 Messaging API 設定
    When 系統檢查該管理員的 LINE OA 設定狀態
    Then 系統判定為「未完成設定」
```

## 資料模型驗證

### spec/erm.dbml - LineOAConfig 表（第 260-276 行）

現有資料模型已包含所需欄位：

```dbml
Table LineOAConfig {
  id int [pk, increment, note: '主鍵，自動遞增']
  admin_id int [ref: > Admin.id, note: '關聯到 Admin 表的主鍵']
  channel_id string [note: 'Messaging API Channel ID，支援英文、數字、特殊符號']
  channel_secret string [note: 'Messaging API Channel Secret，支援英文、數字、特殊符號']
  channel_access_token string [note: 'Messaging API Channel Access Token，支援英文、數字、特殊符號']
  webhook_url string [note: 'Webhook URL，支援 HTTPS 協定']
  line_official_account_id string [note: 'LINE Official Account ID（Basic ID 或 Premium ID）']
  created_at datetime [note: '記錄建立時間']
  updated_at datetime [note: '記錄最後更新時間']

  索引：admin_id (unique)

  驗證條件：channel_id, channel_secret, channel_access_token 三項必填且格式正確

  關係：LineOAConfig N:1 Admin
}
```

**確認：** 資料模型已包含檢查所需的三個必要欄位，且已標註為必填驗證條件。

## 實作說明

### 檢查邏輯

#### SQL 查詢範例
```sql
-- 檢查管理員的 LINE OA 設定是否完整
SELECT
  CASE
    WHEN channel_id IS NOT NULL
      AND channel_id != ''
      AND channel_secret IS NOT NULL
      AND channel_secret != ''
      AND channel_access_token IS NOT NULL
      AND channel_access_token != ''
    THEN true
    ELSE false
  END AS is_configured
FROM LineOAConfig
WHERE admin_id = ?;

-- 如果查詢無結果（沒有記錄），也視為未完成設定
```

#### 應用程式邏輯（偽代碼）
```python
def check_line_oa_configured(admin_id: int) -> bool:
    """
    檢查管理員是否已完成 LINE OA 基本設定

    Returns:
        True: 已完成設定（所有必要欄位都已填寫）
        False: 未完成設定（任一必要欄位為空或無設定記錄）
    """
    config = LineOAConfig.query.filter_by(admin_id=admin_id).first()

    # 沒有設定記錄
    if not config:
        return False

    # 檢查三個必要欄位是否都已填寫
    required_fields = [
        config.channel_id,
        config.channel_secret,
        config.channel_access_token
    ]

    # 所有欄位都不為空且不為空字串
    return all(field and field.strip() for field in required_fields)
```

#### FastAPI 路由範例
```python
@router.get("/check-line-oa-status")
async def check_line_oa_status(
    current_admin: Admin = Depends(get_current_admin)
):
    """檢查當前管理員的 LINE OA 設定狀態"""
    is_configured = check_line_oa_configured(current_admin.id)

    return {
        "is_configured": is_configured,
        "message": "已完成設定" if is_configured else "請完成 LINE OA 基本設定"
    }
```

### 卡控流程整合

#### 前端路由守衛（React Router 範例）
```typescript
// 檢查 LINE OA 設定的路由守衛
const LineOAConfigGuard: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { data: configStatus } = useQuery('lineOAStatus', checkLineOAStatus);

  if (!configStatus?.is_configured) {
    // 顯示提示訊息
    toast.error('請先完成基本設定，才可使用功能模組');

    // 重定向到設定頁面
    return <Navigate to="/settings/line-oa" />;
  }

  return <>{children}</>;
};

// 應用到需要保護的路由
<Route
  path="/campaigns/*"
  element={
    <LineOAConfigGuard>
      <CampaignModule />
    </LineOAConfigGuard>
  }
/>
```

#### 後端 API 中間件（FastAPI 範例）
```python
async def require_line_oa_configured(
    current_admin: Admin = Depends(get_current_admin)
):
    """
    API 端點的依賴注入，確保管理員已完成 LINE OA 設定
    """
    if not check_line_oa_configured(current_admin.id):
        raise HTTPException(
            status_code=403,
            detail="請先完成 LINE OA 基本設定，才可使用此功能"
        )
    return current_admin

# 應用到需要保護的 API 端點
@router.post("/campaigns")
async def create_campaign(
    campaign_data: CampaignCreate,
    admin: Admin = Depends(require_line_oa_configured)
):
    # 只有完成設定的管理員才能執行
    ...
```

### 需要保護的功能模組

根據卡控流程需求，以下功能模組需要檢查 LINE OA 設定：

1. **群發訊息** (`/campaigns`)
2. **自動回應** (`/auto-responses`)
3. **會員管理** (`/members`)
4. **訊息紀錄** (`/message-history`)
5. **訊息模板** (`/templates`)
6. **標籤管理** (`/tags`)

### 設定引導流程

#### 使用者體驗設計
1. **首次登入檢測：** 系統檢測到管理員未完成設定，自動引導到設定頁面
2. **設定提示：** 在導航列或儀表板顯示醒目的設定提示
3. **逐步引導：** 設定頁面提供逐步填寫的引導介面
4. **即時驗證：** 填寫時即時驗證欄位格式（Channel ID 為數字、Token 長度等）
5. **設定測試：** 提供「測試連線」按鈕，驗證填寫的憑證是否有效

### 優點
- **準確性：** 確保設定完整，避免功能使用時才發現設定不完整
- **明確性：** 清楚知道需要填寫哪些欄位
- **可靠性：** 基於實際的設定資料判斷，不需額外維護狀態欄位
- **可擴充：** 未來可加入 token 有效性驗證等進階檢查

### 缺點
- **查詢複雜度：** 需要檢查多個欄位，比單一布林欄位複雜
- **效能考量：** 每次檢查都需要查詢資料庫（建議使用快取機制）

### 進階功能（未來擴充）

#### Token 有效性驗證
```python
async def verify_line_token(channel_access_token: str) -> bool:
    """
    呼叫 LINE API 驗證 token 是否有效
    """
    try:
        response = await httpx.get(
            "https://api.line.me/v2/bot/info",
            headers={"Authorization": f"Bearer {channel_access_token}"}
        )
        return response.status_code == 200
    except:
        return False
```

#### 設定狀態快取
```python
from functools import lru_cache
from datetime import datetime, timedelta

# 快取設定狀態 5 分鐘
@lru_cache(maxsize=128)
def get_cached_config_status(admin_id: int, cache_time: datetime) -> bool:
    return check_line_oa_configured(admin_id)

def check_config_with_cache(admin_id: int) -> bool:
    # 使用當前時間的分鐘數作為快取鍵的一部分
    cache_key = datetime.now().replace(second=0, microsecond=0)
    return get_cached_config_status(admin_id, cache_key)
```

### 測試要點
1. **完整設定測試：** 驗證所有欄位都填寫時判定為已完成
2. **部分設定測試：** 驗證缺少任一欄位時判定為未完成
3. **無設定測試：** 驗證沒有設定記錄時判定為未完成
4. **空值測試：** 驗證欄位為空字串或 null 時判定為未完成
5. **卡控測試：** 驗證未完成設定時無法存取受保護的功能模組
6. **提示訊息測試：** 驗證未完成設定時顯示正確的提示訊息
7. **引導流程測試：** 驗證使用者能被正確引導到設定頁面

# 歸檔資訊

- **歸檔時間：** 2025-11-12
- **處理狀態：** 已整合至規格
- **處理者：** Claude (SuperClaude Framework)
