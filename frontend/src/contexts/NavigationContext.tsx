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
      if (state.page && state.params) {
        return {
          page: state.page as Page,
          params: state.params as NavigationParams
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

  const [currentPage, setCurrentPage] = useState<Page>(startPage);
  const [params, setParams] = useState<NavigationParams>(startParams);
  const [history, setHistory] = useState<Array<{ page: Page; params: NavigationParams }>>([
    { page: startPage, params: startParams }
  ]);

  const navigate = useCallback((page: Page, newParams: NavigationParams = {}) => {
    // 添加到历史记录
    setHistory(prev => [...prev, { page: currentPage, params }]);
    
    // 更新当前页面和参数
    setCurrentPage(page);
    setParams(newParams);
  }, [currentPage, params]);

  const goBack = useCallback(() => {
    if (history.length > 1) {
      // 移除最后一项
      const newHistory = [...history];
      newHistory.pop();
      
      // 获取前一页
      const previousState = newHistory[newHistory.length - 1];
      
      // 更新状态
      setHistory(newHistory);
      setCurrentPage(previousState.page);
      setParams(previousState.params);
    }
  }, [history]);

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