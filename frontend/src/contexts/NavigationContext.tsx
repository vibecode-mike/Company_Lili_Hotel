import React, { createContext, useContext, useState, ReactNode } from 'react';

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

// Provider 组件
export function NavigationProvider({ 
  children, 
  initialPage = 'member-management',
  initialParams = {} 
}: NavigationProviderProps) {
  const [currentPage, setCurrentPage] = useState<Page>(initialPage);
  const [params, setParams] = useState<NavigationParams>(initialParams);
  const [history, setHistory] = useState<Array<{ page: Page; params: NavigationParams }>>([
    { page: initialPage, params: initialParams }
  ]);

  const navigate = (page: Page, newParams: NavigationParams = {}) => {
    // 添加到历史记录
    setHistory(prev => [...prev, { page: currentPage, params }]);
    
    // 更新当前页面和参数
    setCurrentPage(page);
    setParams(newParams);
  };

  const goBack = () => {
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
  };

  const reset = () => {
    setCurrentPage(initialPage);
    setParams(initialParams);
    setHistory([{ page: initialPage, params: initialParams }]);
  };

  const value: NavigationContextType = {
    currentPage,
    params,
    history,
    navigate,
    goBack,
    canGoBack: history.length > 1,
    reset,
  };

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