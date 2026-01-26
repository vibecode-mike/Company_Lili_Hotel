/**
 * FB API Token 管理器
 * 處理 FB JWT Token 的過期檢查和自動刷新
 */

import {
  getJwtToken,
  isFbJwtTokenExpired,
  isFbJwtTokenExpiringSoon,
  clearAllAuthData,
} from './token';

// 刷新 token 的 Promise，用於防止併發刷新
let refreshPromise: Promise<string | null> | null = null;

// 刷新回調，由 AuthContext 設定（performFirmLogin）
let onRefresh: (() => Promise<string | null>) | null = null;

// 登出回調，由 AuthContext 設定
let onLogout: (() => void) | null = null;

/**
 * 設定 FB Token 刷新回調
 */
export function setFbRefreshCallback(callback: () => Promise<string | null>): void {
  onRefresh = callback;
}

/**
 * 設定登出回調
 */
export function setFbLogoutCallback(callback: () => void): void {
  onLogout = callback;
}

/**
 * 執行登出
 */
function handleLogout(): void {
  clearAllAuthData();
  if (onLogout) {
    onLogout();
  }
}

/**
 * 刷新 FB JWT Token
 * 使用 Promise 去重，避免併發刷新
 */
async function refreshFbToken(): Promise<string | null> {
  // 如果已經有刷新請求在進行中，直接返回該 Promise
  if (refreshPromise) {
    return refreshPromise;
  }

  if (!onRefresh) {
    console.error('[FbApiClient] 未設定刷新回調');
    return null;
  }

  refreshPromise = (async () => {
    try {
      console.log('[FbApiClient] 開始刷新 FB JWT Token...');
      const token = await onRefresh!();

      if (token) {
        console.log('[FbApiClient] FB JWT Token 刷新成功');
        return token;
      }

      console.error('[FbApiClient] FB JWT Token 刷新失敗');
      return null;
    } catch (error) {
      console.error('[FbApiClient] FB JWT Token 刷新錯誤:', error);
      return null;
    } finally {
      // 清除 Promise，允許下次刷新
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 確保 FB JWT Token 有效
 *
 * - 若 token 已過期：返回 null（呼叫方應處理登出）
 * - 若 token 即將過期：自動刷新後返回新 token
 * - 若 token 有效：直接返回現有 token
 *
 * @returns 有效的 token，或 null（需要重新登入）
 */
export async function ensureValidFbToken(): Promise<string | null> {
  // 1. 若已過期，不嘗試刷新，返回 null 讓呼叫方處理
  if (isFbJwtTokenExpired()) {
    console.log('[FbApiClient] FB JWT Token 已過期，需要重新登入');
    handleLogout();
    return null;
  }

  // 2. 若即將過期（5 分鐘內），主動刷新
  if (isFbJwtTokenExpiringSoon(5)) {
    console.log('[FbApiClient] FB JWT Token 即將過期，主動刷新...');
    const newToken = await refreshFbToken();

    if (!newToken) {
      // 刷新失敗，強制登出
      console.error('[FbApiClient] FB JWT Token 刷新失敗，執行登出');
      handleLogout();
      return null;
    }

    return newToken;
  }

  // 3. Token 有效，直接返回
  return getJwtToken();
}
