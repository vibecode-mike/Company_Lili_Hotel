# 外部服務 Token 管理架構

## 概述

本系統採用通用化的 Token 管理架構，統一管理多個外部服務（Facebook、LINE、WhatsApp 等）的認證狀態。

## 架構設計

```
┌─────────────────────────────────────────────────────────────┐
│                      AuthContext                             │
│  - 統一登出回調註冊                                            │
│  - 外部服務註冊/註銷                                           │
│  - 初始化時統一檢查所有服務                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     TokenManager                             │
│  - 服務註冊管理 (register/unregister)                         │
│  - 統一過期檢查 (checkAllServices)                            │
│  - 單服務 Token 確保有效 (ensureValidToken)                   │
│  - Promise 去重防止併發刷新                                    │
│  - 刷新失敗自動登出                                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Facebook │   │   LINE   │   │ WhatsApp │
        │ Service  │   │ Service  │   │ Service  │
        └──────────┘   └──────────┘   └──────────┘
```

## 核心介面

### ExternalService

```typescript
interface ExternalService {
  /** 服務名稱（用於日誌和識別） */
  name: string;
  /** 檢查 token 是否已過期 */
  isExpired: () => boolean;
  /** 檢查 token 是否即將過期 */
  isExpiringSoon: (thresholdMinutes: number) => boolean;
  /** 刷新 token，返回新 token 或 null（失敗） */
  refresh: () => Promise<string | null>;
  /** 取得目前的 token */
  getToken: () => string | null;
}
```

## 雙模式 Token 管理

| 狀態 | 判斷方式 | 行為 |
|------|---------|------|
| **沒在使用** | 打開網頁時 token 已過期 | 強制重新登入 |
| **使用中** | 呼叫 API 時 token 即將過期 | 背景自動刷新 |

### 邏輯流程

```
用戶打開網頁（沒在使用）
├── AuthContext useEffect 檢查
├── tokenManager.checkAllServices()
│   └── 任一服務 isExpired() = true
└── logout() → 跳轉登入頁 ✅

用戶操作中（使用中）
├── 呼叫外部 API 前
├── tokenManager.ensureValidToken('facebook')
│   ├── isExpiringSoon(5) = true?
│   │   ├── 是 → service.refresh() 刷新
│   │   │   ├── 成功 → 返回新 token
│   │   │   └── 失敗 → logout()
│   │   └── 否 → 直接返回現有 token
└── 繼續 API 呼叫 ✅
```

## 檔案結構

```
src/utils/
├── token.ts           # Token 存取和解析工具
├── tokenManager.ts    # 通用外部服務 Token 管理器
├── apiClient.ts       # 內部 API Client (auth_token)
└── fbApiClient.ts     # FB API Client (向後兼容)

src/components/auth/
└── AuthContext.tsx    # 認證上下文，註冊外部服務
```

## 使用方式

### 1. 註冊新的外部服務

```typescript
// 在 AuthContext.tsx 中註冊
useEffect(() => {
  const lineService: ExternalService = {
    name: 'line',
    isExpired: isLineTokenExpired,
    isExpiringSoon: isLineTokenExpiringSoon,
    refresh: performLineLogin,
    getToken: getLineToken,
  };
  tokenManager.register(lineService);

  return () => {
    tokenManager.unregister('line');
  };
}, [performLineLogin]);
```

### 2. 在 API 呼叫前確保 Token 有效

```typescript
// 方式一：使用 TokenManager
const token = await tokenManager.ensureValidToken('facebook');
if (!token) {
  // 已自動登出，不需額外處理
  return;
}

// 方式二：使用 fbApiClient（向後兼容）
const token = await ensureValidFbToken();
if (!token) return;
```

### 3. 批量檢查所有服務

```typescript
const allValid = await tokenManager.checkAllServices();
if (!allValid) {
  // 已自動登出
}
```

## 關鍵特性

### Promise 去重

同一服務的併發刷新請求會自動去重，避免重複刷新：

```typescript
// 多個併發請求只會觸發一次刷新
const [token1, token2, token3] = await Promise.all([
  tokenManager.ensureValidToken('facebook'),
  tokenManager.ensureValidToken('facebook'),
  tokenManager.ensureValidToken('facebook'),
]);
// 三個請求返回同一個 token
```

### 統一登出

任一外部服務 Token 過期或刷新失敗，都會觸發統一登出：

```typescript
tokenManager.setLogoutCallback(() => {
  clearAllAuthData();
  setIsAuthenticated(false);
  setUser(null);
  toast.success('已登出');
});
```

## 擴展指南

### 新增外部服務 Checklist

1. [ ] 在 `token.ts` 新增 token 存取函數（`getXxxToken`, `setXxxToken`）
2. [ ] 在 `token.ts` 新增過期檢查函數（`isXxxTokenExpired`, `isXxxTokenExpiringSoon`）
3. [ ] 在 `AuthContext.tsx` 新增 refresh 函數
4. [ ] 在 `AuthContext.tsx` 註冊服務到 `tokenManager`
5. [ ] （可選）建立獨立的 `xxxApiClient.ts` 便捷函數
