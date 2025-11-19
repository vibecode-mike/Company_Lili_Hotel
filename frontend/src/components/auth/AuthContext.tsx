import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userEmail = localStorage.getItem('user_email');
    const loginMethod = localStorage.getItem('login_method') as 'email' | 'google' | 'line' || 'email';

    if (token && userEmail) {
      setIsAuthenticated(true);
      setUser({
        email: userEmail,
        name: userEmail.split('@')[0],
        loginMethod: loginMethod
      });
    }
  }, []);

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
