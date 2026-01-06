import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

interface User {
  email: string;
  name: string;
  loginMethod: 'email' | 'google' | 'line';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithLine: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 同步檢查初始認證狀態（避免重新整理時的狀態閃爍）
const getInitialAuthState = () => {
  const token = localStorage.getItem('auth_token');
  const userEmail = localStorage.getItem('user_email');
  const loginMethod = localStorage.getItem('login_method') as 'email' | 'google' | 'line' || 'email';

  if (token && userEmail) {
    return {
      isAuthenticated: true,
      user: {
        email: userEmail,
        name: userEmail.split('@')[0],
        loginMethod: loginMethod
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
  const fbApiBaseUrl = useMemo(
    () => (import.meta.env.VITE_FB_API_URL?.trim() || 'https://api-youth-tycg.star-bit.io').replace(/\/+$/, ''),
    []
  );
  const fbFirmAccount = useMemo(() => import.meta.env.VITE_FB_FIRM_ACCOUNT?.trim() || 'tycg-admin', []);
  const fbFirmPassword = useMemo(() => import.meta.env.VITE_FB_FIRM_PASSWORD?.trim() || '123456', []);

  const performFirmLogin = useCallback(async (): Promise<string | null> => {
    try {
      const firmLoginResp = await fetch(`${fbApiBaseUrl}/api/v1/admin/firm_login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: fbFirmAccount, password: fbFirmPassword }),
      });
      const firmPayload = await firmLoginResp.json().catch(() => null);
      const firmToken = firmPayload?.data?.access_token;
      if (firmLoginResp.ok && firmToken) {
        localStorage.setItem('jwt_token', firmToken);
        return firmToken;
      }
      console.warn('firm_login 失敗，後續 FB API 可能無法使用', firmPayload);
      toast.warning(firmPayload?.msg || 'FB 服務登入失敗，請稍後再試');
      return null;
    } catch (firmLoginError) {
      console.error('firm_login 發生錯誤:', firmLoginError);
      toast.warning('FB 服務登入失敗，請稍後再試');
      return null;
    }
  }, [fbApiBaseUrl, fbFirmAccount, fbFirmPassword]);

  // Email/Password login
  const login = async (email: string, password: string): Promise<boolean> => {
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
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_email', data.user.email);
      localStorage.setItem('login_method', 'email');

      // 連動外部 FB 服務的 firm_login，取得 JWT 作為後續 Authorization
      await performFirmLogin();

      setIsAuthenticated(true);
      setUser({
        email: data.user.email,
        name: data.user.username || data.user.email.split('@')[0],
        loginMethod: 'email'
      });

      toast.success('登入成功！');
      return true;
    } catch (error) {
      console.error('登入錯誤:', error);
      toast.error('登入失敗，請檢查網絡連接');
      return false;
    }
  };

  // Google login (simulated)
  const loginWithGoogle = async (): Promise<boolean> => {
    // Simulate OAuth flow delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockEmail = 'user@gmail.com';
    const token = `google_token_${Date.now()}`;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_email', mockEmail);
    localStorage.setItem('login_method', 'google');
    await performFirmLogin();

    setIsAuthenticated(true);
    setUser({
      email: mockEmail,
      name: 'Google User',
      loginMethod: 'google'
    });

    toast.success('Google 登入成功！');
    return true;
  };

  // LINE login (simulated)
  const loginWithLine = async (): Promise<boolean> => {
    // Simulate OAuth flow delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockEmail = 'user@line.me';
    const token = `line_token_${Date.now()}`;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_email', mockEmail);
    localStorage.setItem('login_method', 'line');
    await performFirmLogin();

    setIsAuthenticated(true);
    setUser({
      email: mockEmail,
      name: 'LINE User',
      loginMethod: 'line'
    });

    toast.success('LINE 登入成功！');
    return true;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('login_method');
    localStorage.removeItem('jwt_token');
    
    setIsAuthenticated(false);
    setUser(null);
    
    toast.success('已登出');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        loginWithGoogle,
        loginWithLine,
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
