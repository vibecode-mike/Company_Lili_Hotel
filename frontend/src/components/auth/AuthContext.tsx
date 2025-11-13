import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';

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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check credentials
    if (email === 'admin@starbit.com' && password === 'admin123') {
      const token = `token_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_email', email);
      localStorage.setItem('login_method', 'email');

      setIsAuthenticated(true);
      setUser({
        email: email,
        name: email.split('@')[0],
        loginMethod: 'email'
      });

      toast.success('登入成功！');
      return true;
    } else {
      toast.error('帳號或密碼錯誤，請重試');
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
