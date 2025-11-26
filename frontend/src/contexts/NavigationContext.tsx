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

// URL 路徑映射
const pageToPath: Record<Page, string> = {
  'message-list': '/messages',
  'auto-reply': '/auto-reply',
  'member-management': '/members',
  'member-detail': '/members/detail',
  'chat-room': '/members/chat',
  'flex-editor': '/flex-editor',
  'line-api-settings': '/settings',
};

// 路徑到頁面的反向映射
const pathToPage: Record<string, Page> = {
  '/messages': 'message-list',
  '/auto-reply': 'auto-reply',
  '/members': 'member-management',
  '/members/detail': 'member-detail',
  '/members/chat': 'chat-room',
  '/flex-editor': 'flex-editor',
  '/settings': 'line-api-settings',
};

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

  // 导航到指定页面
  navigate: (page: Page, params?: NavigationParams) => void;

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

// 從 URL 解析頁面和參數
const getPageFromUrl = (): { page: Page; params: NavigationParams } | null => {
  try {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    // 嘗試精確匹配
    let matchedPage = pathToPage[pathname];

    // 如果沒有精確匹配，嘗試前綴匹配（處理帶參數的路徑）
    if (!matchedPage) {
      for (const [path, page] of Object.entries(pathToPage)) {
        if (pathname.startsWith(path)) {
          matchedPage = page;
          break;
        }
      }
    }

    if (matchedPage) {
      // 解析 URL 參數
      const params: NavigationParams = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return { page: matchedPage, params };
    }
  } catch (error) {
    console.error('Failed to parse URL:', error);
  }
  return null;
};

// 從 localStorage 恢復導航狀態
const getInitialNavigationState = () => {
  // 優先從 URL 獲取狀態
  const urlState = getPageFromUrl();
  if (urlState) {
    console.log('[NavigationContext] Restored from URL:', urlState);
    return urlState;
  }

  // 備用：從 localStorage 恢復
  try {
    const saved = localStorage.getItem('navigation_state');
    if (saved) {
      const state = JSON.parse(saved);
      // 驗證資料格式
      if (state.page && state.params !== undefined) {
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

  console.log('[NavigationContext] Initializing with:', {
    savedState,
    startPage,
    startParams
  });

  const [currentPage, setCurrentPage] = useState<Page>(startPage);
  const [params, setParams] = useState<NavigationParams>(startParams);

  const navigate = useCallback((page: Page, newParams: NavigationParams = {}) => {
    console.log('[NavigationContext] navigate called:', page, 'params:', newParams);

    // 直接更新當前頁面和參數（不觸發整頁刷新）
    setCurrentPage(page);
    setParams(newParams);

    // 同步更新 URL（不觸發整頁刷新）
    const path = pageToPath[page];
    const searchParams = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value);
      }
    });
    const queryString = searchParams.toString();
    const newUrl = queryString ? `${path}?${queryString}` : path;
    window.history.pushState({ page, params: newParams }, '', newUrl);

    // localStorage 的儲存由 useEffect 統一處理，避免重複儲存
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setParams(initialParams);
  }, [initialPage, initialParams]);

  // 當路由狀態變化時,儲存到 localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        page: currentPage,
        params
      };
      localStorage.setItem('navigation_state', JSON.stringify(stateToSave));
      console.log('[NavigationContext] useEffect saved state:', stateToSave);
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }, [currentPage, params]);

  // 監聽瀏覽器後退/前進按鈕
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('[NavigationContext] popstate event:', event.state);
      if (event.state?.page) {
        setCurrentPage(event.state.page);
        setParams(event.state.params || {});
      } else {
        // 如果沒有 state，嘗試從 URL 解析
        const urlState = getPageFromUrl();
        if (urlState) {
          setCurrentPage(urlState.page);
          setParams(urlState.params);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 初始化時同步 URL（如果 URL 與當前狀態不符）
  useEffect(() => {
    const currentPath = window.location.pathname;
    const expectedPath = pageToPath[currentPage];
    if (currentPath !== expectedPath) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, value);
        }
      });
      const queryString = searchParams.toString();
      const newUrl = queryString ? `${expectedPath}?${queryString}` : expectedPath;
      window.history.replaceState({ page: currentPage, params }, '', newUrl);
      console.log('[NavigationContext] URL synced to:', newUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在初始化時執行一次

  const value: NavigationContextType = useMemo(() => ({
    currentPage,
    params,
    navigate,
    reset,
  }), [currentPage, params, navigate, reset]);

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

