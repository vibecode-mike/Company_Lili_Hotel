# 外部服務 Token 自動維護機制

## 功能描述

系統應能管理多個外部服務的認證狀態。當用戶進入系統時，自動檢查所有已註冊的外部服務 Token，若過期則自動刷新，確保用戶無需手動操作即可使用所有功能。

---

## 設計模型

```
┌─────────────────────────────────────────────────┐
│            ExternalTokenManager                 │
├─────────────────────────────────────────────────┤
│ register(service: ExternalService)              │
│ checkAndRefreshAll(): Promise<void>             │
│ getToken(serviceName: string): string | null    │
└─────────────────────────────────────────────────┘
                      │
                      │ 管理多個
                      ▼
┌─────────────────────────────────────────────────┐
│            ExternalService（介面）               │
├─────────────────────────────────────────────────┤
│ name: string              // 服務名稱            │
│ isExpired(): boolean      // 檢查是否過期        │
│ refresh(): Promise<void>  // 刷新 Token         │
│ getToken(): string | null // 取得目前 Token      │
└─────────────────────────────────────────────────┘
                      │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Facebook │ │   LINE   │ │ WhatsApp │
    │ Service  │ │ Service  │ │ Service  │
    └──────────┘ └──────────┘ └──────────┘
```

---

## 雙模式管理邏輯

| 狀態 | 判斷方式 | 行為 |
|------|---------|------|
| **沒在使用** | 打開網頁時 token 已過期 | 強制重新登入 |
| **使用中** | 呼叫 API 時 token 即將過期 | 背景自動刷新 |

### 流程圖

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

---

## 使用方式

### 註冊外部服務

```typescript
// 註冊 Facebook 服務
tokenManager.register({
  name: 'facebook',
  isExpired: () => isFbJwtTokenExpired(),
  isExpiringSoon: (minutes) => isFbJwtTokenExpiringSoon(minutes),
  refresh: () => performFirmLogin(),
  getToken: () => getJwtToken(),
});

// 註冊 LINE 服務
tokenManager.register({
  name: 'line',
  isExpired: () => isLineTokenExpired(),
  isExpiringSoon: (minutes) => isLineTokenExpiringSoon(minutes),
  refresh: () => refreshLineToken(),
  getToken: () => getLineToken(),
});
```

### App 初始化時統一檢查

```typescript
useEffect(() => {
  if (isAuthenticated) {
    tokenManager.checkAllServices();
  }
}, [isAuthenticated]);
```

### 呼叫 API 前確保 Token 有效

```typescript
const token = await tokenManager.ensureValidToken('facebook');
if (!token) {
  // 已自動登出，不需額外處理
  return;
}
// 繼續 API 呼叫
```

---

## 場景覆蓋

```
┌───────────────────────────────────┬──────────┐
│               場景                │ 是否覆蓋 │
├───────────────────────────────────┼──────────┤
│ Facebook API Token 過期           │ ✅       │
├───────────────────────────────────┼──────────┤
│ LINE 官方帳號 Token 過期          │ ✅       │
├───────────────────────────────────┼──────────┤
│ WhatsApp Business API Token 過期  │ ✅       │
├───────────────────────────────────┼──────────┤
│ 第三方支付服務 Token              │ ✅       │
├───────────────────────────────────┼──────────┤
│ 任何需要「檢查 + 刷新」的外部認證 │ ✅       │
└───────────────────────────────────┴──────────┘
```

---

## 複雜度比較

```
┌──────────────────┬──────────────────┬────────────────────────┐
│       面向       │     當前方案     │        通用方案        │
├──────────────────┼──────────────────┼────────────────────────┤
│ 程式碼量         │ ~20 行           │ ~60 行（含介面定義）   │
├──────────────────┼──────────────────┼────────────────────────┤
│ 新增一個外部服務 │ 複製貼上 + 修改  │ 實作介面 + 註冊        │
├──────────────────┼──────────────────┼────────────────────────┤
│ 維護成本         │ 每個服務獨立維護 │ 統一入口管理           │
├──────────────────┼──────────────────┼────────────────────────┤
│ 學習成本         │ 低               │ 稍高（需理解註冊機制） │
└──────────────────┴──────────────────┴────────────────────────┘
```

**結論**：複雜度增加約 3 倍，但如果預期會接入 **2 個以上** 的外部服務，通用方案的投資回報率更高。

---

## 核心特性

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

---

## 檔案結構

```
src/utils/
├── token.ts           # Token 存取和解析工具
├── tokenManager.ts    # 通用外部服務 Token 管理器
├── apiClient.ts       # 內部 API Client (auth_token)
└── fbApiClient.ts     # FB API Client（向後兼容層）

src/components/auth/
└── AuthContext.tsx    # 認證上下文，註冊外部服務
```

---

## 擴展指南：新增外部服務 Checklist

1. [ ] 在 `token.ts` 新增 token 存取函數（`getXxxToken`, `setXxxToken`）
2. [ ] 在 `token.ts` 新增過期檢查函數（`isXxxTokenExpired`, `isXxxTokenExpiringSoon`）
3. [ ] 在 `AuthContext.tsx` 新增 refresh 函數
4. [ ] 在 `AuthContext.tsx` 註冊服務到 `tokenManager`
5. [ ] （可選）建立獨立的 `xxxApiClient.ts` 便捷函數
