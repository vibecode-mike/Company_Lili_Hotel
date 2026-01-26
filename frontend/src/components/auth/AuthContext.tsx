import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getAuthToken,
  setAuthToken,
  getUserEmail,
  setUserEmail,
  setLoginMethod,
  setJwtToken,
  clearAllAuthData,
  isTokenExpired,
  isTokenExpiringSoon,
  isFbJwtTokenExpired,
  isFbJwtTokenExpiringSoon,
  getJwtToken,
} from '../../utils/token';
import { setLogoutCallback } from '../../utils/apiClient';
import { setFbRefreshCallback, setFbLogoutCallback } from '../../utils/fbApiClient';
import { tokenManager, type ExternalService } from '../../utils/tokenManager';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 同步檢查初始認證狀態（避免重新整理時的狀態閃爍）
const getInitialAuthState = () => {
  const token = getAuthToken();
  const userEmail = getUserEmail();

  if (token && userEmail) {
    return {
      isAuthenticated: true,
      user: {
        email: userEmail,
        name: userEmail.split('@')[0],
      }
    };
  }
  return { isAuthenticated: false, user: null };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // 使用同步初始化，避免重新整理時的狀態不一致
  const initialState = getInitialAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialState.isAuthenticated);
  const [user, setUser] = useState<User | null>(initialState.user);

  // FB API configuration
  const fbApiBaseUrl = (import.meta.env.VITE_FB_API_URL?.trim() || 'https://api-youth-tycg.star-bit.io').replace(/\/+$/, '');
  const fbFirmAccount = import.meta.env.VITE_FB_FIRM_ACCOUNT?.trim() || 'tycg-admin';
  const fbFirmPassword = import.meta.env.VITE_FB_FIRM_PASSWORD?.trim() || '123456';

  // Logout 函式（先定義，供 apiClient 使用）
  const logout = useCallback(() => {
    clearAllAuthData();
    setIsAuthenticated(false);
    setUser(null);
    toast.success('已登出');
  }, []);

  // 設定所有登出回調
  useEffect(() => {
    setLogoutCallback(logout);
    setFbLogoutCallback(logout);
    tokenManager.setLogoutCallback(logout);
  }, [logout]);

  const performFirmLogin = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(`${fbApiBaseUrl}/api/v1/admin/firm_login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: fbFirmAccount, password: fbFirmPassword }),
      });

      const payload = await response.json().catch(() => null);
      const token = payload?.data?.access_token;

      if (response.ok && token) {
        setJwtToken(token);
        return token;
      }

      const errorMsg = payload?.msg || 'FB 服務登入失敗，請稍後再試';
      console.warn('firm_login 失敗，後續 FB API 可能無法使用', payload);
      toast.warning(errorMsg);
      return null;
    } catch (error) {
      console.error('firm_login 發生錯誤:', error);
      toast.warning('FB 服務登入失敗，請稍後再試');
      return null;
    }
  }, [fbApiBaseUrl, fbFirmAccount, fbFirmPassword]);

  // 設定 fbApiClient 的刷新回調（向後兼容）
  useEffect(() => {
    setFbRefreshCallback(performFirmLogin);
  }, [performFirmLogin]);

  // 註冊外部服務到 TokenManager
  useEffect(() => {
    // 註冊 Facebook 服務
    const fbService: ExternalService = {
      name: 'facebook',
      isExpired: isFbJwtTokenExpired,
      isExpiringSoon: isFbJwtTokenExpiringSoon,
      refresh: performFirmLogin,
      getToken: getJwtToken,
    };
    tokenManager.register(fbService);

    return () => {
      tokenManager.unregister('facebook');
    };
  }, [performFirmLogin]);

  // 初始化時檢查所有外部服務 Token，任一過期則強制重新登入
  useEffect(() => {
    if (isAuthenticated) {
      tokenManager.checkAllServices().then((allValid) => {
        if (!allValid) {
          console.log('[AuthContext] 外部服務 Token 已過期，需要重新登入');
          // logout 已由 tokenManager 內部觸發
        }
      });
    }
  }, [isAuthenticated]);

  // Email/Password login
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // 使用 FormData 格式發送登入請求（符合 OAuth2PasswordRequestForm）
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '登入失敗' }));
        toast.error(errorData.detail || '帳號或密碼錯誤，請重試');
        return false;
      }

      const data = await response.json();

      // 儲存 token 和用戶信息
      setAuthToken(data.access_token);
      setUserEmail(data.user.email);
      setLoginMethod('email');

      // 連動外部 FB 服務的 firm_login，取得 JWT 作為後續 Authorization
      await performFirmLogin();

      setIsAuthenticated(true);
      setUser({
        email: data.user.email,
        name: data.user.username || data.user.email.split('@')[0],
      });

      toast.success('登入成功！');
      return true;
    } catch (error) {
      console.error('登入錯誤:', error);
      toast.error('登入失敗，請檢查網絡連接');
      return false;
    }
  }, [performFirmLogin]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
