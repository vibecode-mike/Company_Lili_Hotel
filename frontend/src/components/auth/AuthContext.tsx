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
  setLoginMethod,
  clearAllAuthData,
} from "../../utils/token";
import { setLogoutCallback } from "../../utils/apiClient";

interface User {
  email: string;
  name: string;
  role?: string;
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
        name: userEmail.split("@")[0],
        role: getUserRole() || undefined,
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
  const logout = useCallback(() => {
    clearAllAuthData();
    setIsAuthenticated(false);
    setUser(null);
    toast.success("已登出");
  }, []);

  // 設定登出回調（apiClient 統一處理）
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

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
        setLoginMethod("email");

        setIsAuthenticated(true);
        setUser({
          email: data.user.email,
          name: data.user.username || data.user.email.split("@")[0],
          role,
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
