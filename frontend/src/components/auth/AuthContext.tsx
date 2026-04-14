import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";
import {
  getAuthToken,
  setAuthToken,
  getUserEmail,
  setUserEmail,
  getUserRole,
  setUserRole,
  getFaqPerms,
  setFaqPerms,
  setLoginMethod,
  clearAllAuthData,
  isTokenExpired,
} from "../../utils/token";
import { setLogoutCallback, apiPost, resetLogoutState } from "../../utils/apiClient";

export interface User {
  email: string;
  name: string;
  role?: string;
  faq_can_view?: boolean;
  faq_can_manage?: boolean;
  faq_can_publish?: boolean;
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
    const perms = getFaqPerms();
    return {
      isAuthenticated: true,
      user: {
        email: userEmail,
        name: userEmail.split("@")[0],
        role: getUserRole() || undefined,
        faq_can_view: perms.view ?? true,
        faq_can_manage: perms.manage ?? true,
        faq_can_publish: perms.publish ?? false,
      },
    };
  }
  return { isAuthenticated: false, user: null };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // 使用同步初始化，避免重新整理時的狀態不一致
  const initialState = getInitialAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    initialState.isAuthenticated,
  );
  const [user, setUser] = useState<User | null>(initialState.user);

  // Logout 函式（先定義，供 apiClient 使用）
  const logout = useCallback(async () => {
    try {
      await apiPost("/api/v1/auth/logout", {}, { skipRetry: true, skipRefresh: true });
    } catch {
      // API 失敗仍繼續登出（清除本地資料）
    }
    clearAllAuthData();
    setIsAuthenticated(false);
    setUser(null);
    toast.success("已登出");
  }, []);

  // 設定登出回調（apiClient 統一處理）
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  // 定時檢查 token 是否過期，過期立刻跳回登入頁（不等使用者點擊才發現）
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkToken = () => {
      if (!getAuthToken() || isTokenExpired()) {
        toast.error("登入已過期，請重新登入");
        logout();
      }
    };

    const interval = setInterval(checkToken, 10_000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // Email/Password login
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        // 使用 FormData 格式發送登入請求（符合 OAuth2PasswordRequestForm）
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "登入失敗" }));
          toast.error(errorData.detail || "帳號或密碼錯誤，請重試");
          return false;
        }

        const data = await response.json();

        // 儲存 token 和用戶信息
        setAuthToken(data.access_token);
        const role = (data.user.role || "").toLowerCase();
        setUserEmail(data.user.email);
        setUserRole(role);
        setFaqPerms({
          view: data.user.faq_can_view ?? true,
          manage: data.user.faq_can_manage ?? true,
          publish: data.user.faq_can_publish ?? false,
        });
        setLoginMethod("email");

        resetLogoutState();
        setIsAuthenticated(true);
        setUser({
          email: data.user.email,
          name: data.user.username || data.user.email.split("@")[0],
          role,
          faq_can_view: data.user.faq_can_view ?? true,
          faq_can_manage: data.user.faq_can_manage ?? true,
          faq_can_publish: data.user.faq_can_publish ?? false,
        });

        toast.success("登入成功！");
        return true;
      } catch (error) {
        console.error("登入錯誤:", error);
        toast.error("登入失敗，請檢查網絡連接");
        return false;
      }
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
