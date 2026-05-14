import { lazy, Suspense, useEffect, useRef } from "react";
import { AppProviders } from "./contexts/AppProviders";
import { useNavigation, type Page } from "./contexts/NavigationContext";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import Login from "./components/auth/Login";
import { Toaster } from "./components/ui/sonner";
import { useLineChannelStatus } from "./contexts/LineChannelStatusContext";
import { useChannel } from "./contexts/ChannelContext";
import ChatFAB from "./components/ChatFAB";
import ErrorBoundary from "./components/ErrorBoundary";

// 頁面組件懶加載導入 - 優化首屏加載性能
const MessageListPage = lazy(() => import("./pages/MessageListPage"));
const FlexEditorPage = lazy(() => import("./pages/FlexEditorPage"));
const AutoReplyPage = lazy(() => import("./pages/AutoReplyPage"));
const MemberManagementPage = lazy(() => import("./pages/MemberManagementPage"));
const MemberDetailPage = lazy(() => import("./pages/MemberDetailPage"));
const ChatRoomPage = lazy(() => import("./pages/ChatRoomPage"));
const LineApiSettingsPage = lazy(() => import("./pages/LineApiSettingsPage"));
const PMSPage = lazy(() => import("./pages/PMSPage"));
const FacilitiesPage = lazy(() => import("./pages/FacilitiesPage"));
const AIChatbotPage = lazy(() => import("./pages/AIChatbotPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const StaffUsersPage = lazy(() => import("./pages/StaffUsersPage"));

/**
 * 路由配置對象
 * 將頁面名稱映射到對應的組件
 */
const routes: Record<Page, React.ComponentType> = {
  "message-list": MessageListPage,
  "flex-editor": FlexEditorPage,
  "auto-reply": AutoReplyPage,
  "member-management": MemberManagementPage,
  "member-detail": MemberDetailPage,
  "chat-room": ChatRoomPage,
  "line-api-settings": LineApiSettingsPage,
  pms: PMSPage,
  facilities: FacilitiesPage,
  "ai-chatbot": AIChatbotPage,
  insights: InsightsPage,
  "staff-users": StaffUsersPage,
};

/**
 * 頁面標題映射
 * 用於動態更新瀏覽器標籤標題
 */
const pageTitles: Record<Page, string> = {
  "message-list": "活動與訊息推播",
  "flex-editor": "Flex Message 編輯器",
  "auto-reply": "關鍵字回應",
  "member-management": "會員管理",
  "member-detail": "會員詳情",
  "chat-room": "聊天室",
  "line-api-settings": "LINE API 設定",
  pms: "AI Chatbot",
  facilities: "AI Chatbot",
  "ai-chatbot": "AI Chatbot",
  insights: "數據洞察",
  "staff-users": "帳號管理",
};

/**
 * 主應用內容組件
 * 使用 Context 來管理路由和狀態，避免 prop drilling
 */
function AppContent() {
  const { currentPage, navigate } = useNavigation();
  const { isAuthenticated, user } = useAuth();
  const {
    isLoading: isStatusLoading,
    isConfigured,
    hasFetchedOnce,
  } = useLineChannelStatus();
  const { hasNoChannels: noChannelsAssigned } = useChannel();
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
      if (currentPage !== "line-api-settings") {
        navigate("line-api-settings");
      }
      return;
    }

    // LINE 已配置，解鎖導航
    // NavigationContext 已經從 localStorage 恢復了正確的頁面狀態
    // 這裡不需要再做任何導航操作，讓用戶保持在當前頁面
    if (hasLockedStateRef.current) {
      hasLockedStateRef.current = false;
      hasRoutedAfterUnlockRef.current = true;
    }
  }, [
    isAuthenticated,
    isStatusLoading,
    hasFetchedOnce,
    isConfigured,
    currentPage,
    navigate,
  ]);

  // 動態更新頁面標題
  useEffect(() => {
    const pageTitle = pageTitles[currentPage] || "會員管理";
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
          <p className="mt-4 text-sm text-muted-foreground">
            檢查 LINE 基本設定...
          </p>
        </div>
      </div>
    );
  }

  // 根據當前頁面渲染對應的組件
  const PageComponent = routes[currentPage] || routes["member-management"];

  const chatFabPages: Page[] = ["ai-chatbot", "pms", "facilities"];
  const showChatFab = chatFabPages.includes(currentPage);

  // 一般 user 沒被指派任何 LINE OA → 顯示 banner 提示去找 admin
  // admin 自己不會走到這個狀態（migration 自動指派）
  const showNoChannelsBanner =
    noChannelsAssigned && user?.role !== "admin" && currentPage !== "staff-users";

  return (
    <>
      {showNoChannelsBanner && (
        <div className="fixed top-0 left-0 right-0 z-[120] bg-amber-50 border-b border-amber-300 px-6 py-2 text-[13px] text-amber-900">
          您的帳號尚未被指派任何 LINE 館別，部分功能可能無資料。請聯絡管理員指派可用館別。
        </div>
      )}
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-4 text-sm text-muted-foreground">載入中...</p>
              </div>
            </div>
          }
        >
          <PageComponent />
        </Suspense>
      </ErrorBoundary>
      {showChatFab && <ChatFAB />}
    </>
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
