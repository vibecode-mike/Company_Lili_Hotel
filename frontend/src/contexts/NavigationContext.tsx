import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';

// 路由页面类型
export type Page = 
  | 'message-list'        // 活動與訊息推播
  | 'auto-reply'          // 自動回應
  | 'member-management'   // 會員管理
  | 'member-detail'       // 會員詳情
  | 'chat-room'           // 聊天室
  | 'flex-editor'         // LINE Flex Message 編輯器
  | 'line-api-settings';  // LINE API 基本設定

// 导航参数类型
export interface NavigationParams {
  memberId?: string;
  messageId?: string;
  replyId?: string;
  fromPage?: Page;  // 記錄來源頁面，用於返回
  [key: string]: string | undefined;
}

// 导航上下文类型
interface NavigationContextType {
  // 当前页面
  currentPage: Page;
  
  // 导航参数
  params: NavigationParams;
  
  // 历史记录（用于返回按钮）
  history: Array<{ page: Page; params: NavigationParams }>;
  
  // 导航到指定页面
  navigate: (page: Page, params?: NavigationParams) => void;
  
  // 返回上一页
  goBack: () => void;
  
  // 检查是否可以返回
  canGoBack: boolean;
  
  // 重置导航状态
  reset: () => void;
}

// 创建 Context
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Provider Props
interface NavigationProviderProps {
  children: ReactNode;
  initialPage?: Page;
  initialParams?: NavigationParams;
}

// 從 localStorage 恢復導航狀態
const getInitialNavigationState = () => {
  try {
    const saved = localStorage.getItem('navigation_state');
    if (saved) {
      const state = JSON.parse(saved);
      // 驗證資料格式
      if (state.page && state.params !== undefined) {
        return {
          page: state.page as Page,
          params: state.params as NavigationParams,
          history: state.history as Array<{ page: Page; params: NavigationParams }> || []
        };
      }
    }
  } catch (error) {
    console.error('Failed to restore navigation state:', error);
  }
  // 返回預設值
  return null;
};

// Provider 组件
export function NavigationProvider({
  children,
  initialPage = 'member-management',
  initialParams = {}
}: NavigationProviderProps) {
  // 嘗試從 localStorage 恢復狀態
  const savedState = getInitialNavigationState();
  const startPage = savedState?.page || initialPage;
  const startParams = savedState?.params || initialParams;
  const startHistory = savedState?.history && savedState.history.length > 0
    ? savedState.history
    : [{ page: startPage, params: startParams }];

  const [currentPage, setCurrentPage] = useState<Page>(startPage);
  const [params, setParams] = useState<NavigationParams>(startParams);
  const [history, setHistory] = useState<Array<{ page: Page; params: NavigationParams }>>(startHistory);

  const navigate = useCallback((page: Page, newParams: NavigationParams = {}) => {
    // 構建新的 history（添加當前頁到歷史記錄）
    const newHistory = [...history, { page: currentPage, params }];

    // 先更新 localStorage 狀態，以便刷新後恢復到正確頁面
    try {
      localStorage.setItem('navigation_state', JSON.stringify({
        page,
        params: newParams,
        history: newHistory
      }));
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }

    // 觸發整頁刷新，清空所有 React 狀態
    window.location.href = window.location.origin + window.location.pathname;

    // 以下代碼在刷新後不會執行，但保留以防萬一
    setHistory(newHistory);
    setCurrentPage(page);
    setParams(newParams);
  }, [currentPage, params, history]);

  const goBack = useCallback(() => {
    // 優先使用 fromPage 參數來決定返回位置
    if (params.fromPage) {
      const targetPage = params.fromPage;
      const targetParams: NavigationParams = {};

      // 根據目標頁面決定是否需要傳遞參數
      if (targetPage === 'member-detail' && params.memberId) {
        targetParams.memberId = params.memberId;
      }

      // 儲存目標頁面狀態到 localStorage
      try {
        localStorage.setItem('navigation_state', JSON.stringify({
          page: targetPage,
          params: targetParams,
          history: [{ page: targetPage, params: targetParams }]
        }));
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }

      // 觸發整頁刷新返回目標頁面
      window.location.href = window.location.origin + window.location.pathname;
      return;
    }

    // 如果沒有 fromPage，則使用 history
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousState = newHistory[newHistory.length - 1];

      try {
        localStorage.setItem('navigation_state', JSON.stringify({
          page: previousState.page,
          params: previousState.params,
          history: newHistory
        }));
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }

      window.location.href = window.location.origin + window.location.pathname;
    }
  }, [params, history]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setParams(initialParams);
    setHistory([{ page: initialPage, params: initialParams }]);
  }, [initialPage, initialParams]);

  // 當路由狀態變化時,儲存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('navigation_state', JSON.stringify({
        page: currentPage,
        params
      }));
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }, [currentPage, params]);

  const value: NavigationContextType = useMemo(() => ({
    currentPage,
    params,
    history,
    navigate,
    goBack,
    canGoBack: history.length > 1,
    reset,
  }), [currentPage, params, history, navigate, goBack, reset]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// 便捷的导航 Hooks
export function useCurrentPage() {
  const { currentPage } = useNavigation();
  return currentPage;
}

export function useNavigate() {
  const { navigate } = useNavigation();
  return navigate;
}

export function useGoBack() {
  const { goBack, canGoBack } = useNavigation();
  return { goBack, canGoBack };
}