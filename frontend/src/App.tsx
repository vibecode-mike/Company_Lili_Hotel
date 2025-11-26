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
 * 頁面標題映射
 * 用於動態更新瀏覽器標籤標題
 */
const pageTitles: Record<Page, string> = {
  'message-list': '活動與訊息推播',
  'flex-editor': 'Flex Message 編輯器',
  'auto-reply': '自動回應',
  'member-management': '會員管理',
  'member-detail': '會員詳情',
  'chat-room': '聊天室',
  'line-api-settings': 'LINE API 設定',
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
    console.log('[App.tsx] useEffect triggered', {
      isAuthenticated,
      isStatusLoading,
      hasFetchedOnce,
      isConfigured,
      currentPage,
      hasLockedStateRef: hasLockedStateRef.current,
      hasRoutedAfterUnlockRef: hasRoutedAfterUnlockRef.current
    });

    if (!isAuthenticated) {
      console.log('[App.tsx] Not authenticated, resetting refs');
      hasRoutedAfterUnlockRef.current = false;
      hasLockedStateRef.current = true;
      return;
    }

    if (!hasFetchedOnce || isStatusLoading) {
      console.log('[App.tsx] Still loading channel status');
      return;
    }

    if (!isConfigured) {
      console.log('[App.tsx] LINE not configured, navigating to settings');
      hasRoutedAfterUnlockRef.current = false;
      hasLockedStateRef.current = true;
      if (currentPage !== 'line-api-settings') {
        navigate('line-api-settings');
      }
      return;
    }

    // LINE 已配置，解鎖導航
    // NavigationContext 已經從 localStorage 恢復了正確的頁面狀態
    // 這裡不需要再做任何導航操作，讓用戶保持在當前頁面
    if (hasLockedStateRef.current) {
      console.log('[App.tsx] LINE configured, unlocking navigation. Current page:', currentPage);
      hasLockedStateRef.current = false;
      hasRoutedAfterUnlockRef.current = true;
    }
  }, [isAuthenticated, isStatusLoading, hasFetchedOnce, isConfigured, currentPage, navigate]);

  // 動態更新頁面標題
  useEffect(() => {
    const pageTitle = pageTitles[currentPage] || '會員管理';
    document.title = `${pageTitle} | Lili Hotel`;
  }, [currentPage]);

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
