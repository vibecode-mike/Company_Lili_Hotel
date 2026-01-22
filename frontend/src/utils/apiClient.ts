/**
 * 統一 API Client
 * 自動處理認證 token 注入、過期檢查、401 重試
 */

import {
  getAuthToken,
  setAuthToken,
  isTokenExpiringSoon,
  clearAllAuthData,
} from './token';

// 刷新 token 的 Promise，用於防止併發刷新
let refreshPromise: Promise<boolean> | null = null;

// 登出回調，由 AuthContext 設定
let onLogout: (() => void) | null = null;

/**
 * 設定登出回調
 */
export function setLogoutCallback(callback: () => void): void {
  onLogout = callback;
}

/**
 * 刷新 Token
 * 使用 Promise 去重，避免併發刷新
 */
async function refreshToken(): Promise<boolean> {
  // 如果已經有刷新請求在進行中，直接返回該 Promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const currentToken = getAuthToken();
      if (!currentToken) {
        console.warn('[ApiClient] 無 token 可刷新');
        return false;
      }

      console.log('[ApiClient] 開始刷新 token...');

      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[ApiClient] Token 刷新失敗:', response.status);
        return false;
      }

      const data = await response.json();
      if (data.access_token) {
        setAuthToken(data.access_token);
        console.log('[ApiClient] Token 刷新成功');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ApiClient] Token 刷新錯誤:', error);
      return false;
    } finally {
      // 清除 Promise，允許下次刷新
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 處理登出
 */
function handleLogout(): void {
  clearAllAuthData();
  if (onLogout) {
    onLogout();
  }
}

export interface ApiClientOptions extends RequestInit {
  /**
   * 是否跳過認證（用於登入等不需要 token 的請求）
   */
  skipAuth?: boolean;
  /**
   * 是否跳過自動刷新檢查
   */
  skipRefresh?: boolean;
  /**
   * 是否跳過 401 重試
   */
  skipRetry?: boolean;
}

/**
 * API Client - 統一的 fetch wrapper
 *
 * 功能：
 * 1. 自動注入 Authorization header
 * 2. 請求前檢查 token 過期，即將過期時先刷新
 * 3. 遇到 401 自動刷新 token 並重試一次
 * 4. 刷新失敗自動登出
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  const {
    skipAuth = false,
    skipRefresh = false,
    skipRetry = false,
    ...fetchOptions
  } = options;

  // 1. 檢查並主動刷新即將過期的 token
  if (!skipAuth && !skipRefresh) {
    const token = getAuthToken();
    if (token && isTokenExpiringSoon(5)) {
      console.log('[ApiClient] Token 即將過期，主動刷新...');
      const refreshed = await refreshToken();
      if (!refreshed) {
        console.warn('[ApiClient] 主動刷新失敗，繼續使用原 token');
      }
    }
  }

  // 2. 準備 headers
  const headers = new Headers(fetchOptions.headers);

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // 3. 發送請求
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // 4. 處理 401 錯誤
  if (response.status === 401 && !skipAuth && !skipRetry) {
    console.log('[ApiClient] 收到 401，嘗試刷新 token 並重試...');

    const refreshed = await refreshToken();
    if (refreshed) {
      // 重試原請求
      const retryHeaders = new Headers(fetchOptions.headers);
      const newToken = getAuthToken();
      if (newToken) {
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
      }

      const retryResponse = await fetch(url, {
        ...fetchOptions,
        headers: retryHeaders,
      });

      if (retryResponse.status === 401) {
        // 重試後仍然 401，登出
        console.error('[ApiClient] 重試後仍然 401，執行登出');
        handleLogout();
      }

      return retryResponse;
    } else {
      // 刷新失敗，登出
      console.error('[ApiClient] Token 刷新失敗，執行登出');
      handleLogout();
    }
  }

  return response;
}

/**
 * GET 請求
 */
export async function apiGet<T = unknown>(
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  return apiFetch<T>(url, {
    ...options,
    method: 'GET',
  });
}

// Helper for methods with body
const createBodyRequest = (method: string) =>
  async <T = unknown>(
    url: string,
    body?: unknown,
    options: ApiClientOptions = {}
  ): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return apiFetch<T>(url, {
      ...options,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

export const apiPost = createBodyRequest('POST');
export const apiPut = createBodyRequest('PUT');
export const apiPatch = createBodyRequest('PATCH');

export async function apiDelete<T = unknown>(
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' });
}

// 預設導出 apiFetch
export default apiFetch;
