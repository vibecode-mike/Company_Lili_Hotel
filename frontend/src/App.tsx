import { lazy, Suspense, useEffect, useRef } from "react";
import { AppProviders } from "./contexts/AppProviders";
import { useNavigation, type Page } from "./contexts/NavigationContext";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import Login from "./components/auth/Login";
import { Toaster } from "./components/ui/sonner";
import { useLineChannelStatus } from "./contexts/LineChannelStatusContext";

// 頁面組件懶加載導入 - 優化首屏加載性能
const MessageListPage = lazy(() => import("./pages/MessageListPage"));
const FlexEditorPage = lazy(() => import("./pages/FlexEditorPage"));
const AutoReplyPage = lazy(() => import("./pages/AutoReplyPage"));
const MemberManagementPage = lazy(() => import("./pages/MemberManagementPage"));
const MemberDetailPage = lazy(() => import("./pages/MemberDetailPage"));
const ChatRoomPage = lazy(() => import("./pages/ChatRoomPage"));
const LineApiSettingsPage = lazy(() => import("./pages/LineApiSettingsPage"));

/**
 * 路由配置對象
 * 將頁面名稱映射到對應的組件
 */
const routes: Record<Page, React.ComponentType> = {
  'message-list': MessageListPage,
  'flex-editor': FlexEditorPage,
  'auto-reply': AutoReplyPage,
  'member-management': MemberManagementPage,
  'member-detail': MemberDetailPage,
  'chat-room': ChatRoomPage,
  'line-api-settings': LineApiSettingsPage,
};

/**
 * 主應用內容組件
 * 使用 Context 來管理路由和狀態，避免 prop drilling
 */
function AppContent() {
  const { currentPage, navigate } = useNavigation();
  const { isAuthenticated } = useAuth();
  const { isLoading: isStatusLoading, isConfigured, hasFetchedOnce } = useLineChannelStatus();
  const hasRoutedAfterUnlockRef = useRef(false);
  const hasLockedStateRef = useRef(true);

  useEffect(() => {
    if (!isAuthenticated) {
      hasRoutedAfterUnlockRef.current = false;
      hasLockedStateRef.current = true;
      return;
    }

    if (!hasFetchedOnce || isStatusLoading) {
      return;
    }

    if (!isConfigured) {
      hasRoutedAfterUnlockRef.current = false;
      hasLockedStateRef.current = true;
      if (currentPage !== 'line-api-settings') {
        navigate('line-api-settings');
      }
      return;
    }

    // Unlock navigation once when設定完成
    if (hasLockedStateRef.current || !hasRoutedAfterUnlockRef.current) {
      // 檢查是否有儲存的路由狀態 (重新整理的情況)
      const savedNavigationState = localStorage.getItem('navigation_state');

      // 只在真正的首次登入時導航到會員管理頁
      // 如果有儲存的路由狀態,表示是重新整理,不應該強制導航
      if (!savedNavigationState) {
        navigate('member-management');
      }

      hasLockedStateRef.current = false;
      hasRoutedAfterUnlockRef.current = true;
    }
  }, [isAuthenticated, isStatusLoading, hasFetchedOnce, isConfigured, currentPage, navigate]);

  // Check authentication status
  if (!isAuthenticated) {
    return <Login />;
  }

  if (!hasFetchedOnce) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-sm text-muted-foreground">檢查 LINE 基本設定...</p>
        </div>
      </div>
    );
  }

  // 根據當前頁面渲染對應的組件
  const PageComponent = routes[currentPage] || routes['member-management'];

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">載入中...</p>
        </div>
      </div>
    }>
      <PageComponent />
    </Suspense>
  );
}

/**
 * 主應用組件
 * 用 AppProviders 包裹所有內容，提供全局狀態管理
 */
export default function App() {
  return (
    <AuthProvider>
      <AppProviders>
        <AppContent />
        <Toaster />
      </AppProviders>
    </AuthProvider>
  );
}
