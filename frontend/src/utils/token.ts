/**
 * Token 工具函式
 * 處理 JWT token 的存取、解析和過期檢查
 */

const AUTH_TOKEN_KEY = 'auth_token';
const JWT_TOKEN_KEY = 'jwt_token'; // FB 外部 API token
const USER_EMAIL_KEY = 'user_email';
const LOGIN_METHOD_KEY = 'login_method';

interface JwtPayload {
  sub: string;
  exp: number;
  [key: string]: unknown;
}

// Generic localStorage helpers
const getItem = (key: string) => localStorage.getItem(key);
const setItem = (key: string, value: string) => localStorage.setItem(key, value);
const removeItem = (key: string) => localStorage.removeItem(key);

export const getAuthToken = () => getItem(AUTH_TOKEN_KEY);
export const setAuthToken = (token: string) => setItem(AUTH_TOKEN_KEY, token);
export const removeAuthToken = () => removeItem(AUTH_TOKEN_KEY);

export const getJwtToken = () => getItem(JWT_TOKEN_KEY);
export const setJwtToken = (token: string) => setItem(JWT_TOKEN_KEY, token);
export const removeJwtToken = () => removeItem(JWT_TOKEN_KEY);

export const getUserEmail = () => getItem(USER_EMAIL_KEY);
export const setUserEmail = (email: string) => setItem(USER_EMAIL_KEY, email);
export const removeUserEmail = () => removeItem(USER_EMAIL_KEY);

export const getLoginMethod = () => getItem(LOGIN_METHOD_KEY);
export const setLoginMethod = (method: string) => setItem(LOGIN_METHOD_KEY, method);
export const removeLoginMethod = () => removeItem(LOGIN_METHOD_KEY);

/**
 * 清除所有認證相關資料
 */
export function clearAllAuthData(): void {
  removeAuthToken();
  removeJwtToken();
  removeUserEmail();
  removeLoginMethod();
}

/**
 * 解析 JWT Token（不驗證簽名，僅解碼 payload）
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    // JWT 格式: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Base64Url 解碼 payload
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    console.error('[Token] JWT 解析失敗');
    return null;
  }
}

/**
 * 計算 token 剩餘有效時間（秒）
 */
function calculateRemainingTime(token: string | null): number {
  if (!token) return 0;

  const payload = parseJwt(token);
  if (!payload?.exp) return 0;

  const remaining = payload.exp - Math.floor(Date.now() / 1000);
  return Math.max(0, remaining);
}

/**
 * 取得 Auth Token 剩餘有效時間（秒）
 */
export function getTokenRemainingTime(): number {
  return calculateRemainingTime(getAuthToken());
}

/**
 * 檢查 Auth Token 是否已過期
 */
export function isTokenExpired(): boolean {
  return getTokenRemainingTime() === 0;
}

/**
 * 檢查 Auth Token 是否即將過期
 * @param thresholdMinutes 過期前多少分鐘視為「即將過期」，預設 5 分鐘
 */
export function isTokenExpiringSoon(thresholdMinutes = 5): boolean {
  return getTokenRemainingTime() < thresholdMinutes * 60;
}

/**
 * 檢查 FB JWT Token 是否已過期或不存在
 */
export function isFbJwtTokenExpired(): boolean {
  return calculateRemainingTime(getJwtToken()) === 0;
}

/**
 * 檢查 FB JWT Token 是否即將過期
 * @param thresholdMinutes 過期前多少分鐘視為「即將過期」，預設 5 分鐘
 */
export function isFbJwtTokenExpiringSoon(thresholdMinutes = 5): boolean {
  return calculateRemainingTime(getJwtToken()) < thresholdMinutes * 60;
}
