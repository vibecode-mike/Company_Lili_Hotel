import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';

// 主题类型
export type Theme = 'light' | 'dark';

// 用户信息类型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
}

// UI 状态类型
interface AppStateContextType {
  // 侧边栏状态
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // 主题
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // 当前用户
  user: User | null;
  setUser: (user: User | null) => void;
  
  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 模态框状态
  modals: {
    [key: string]: boolean;
  };
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  
  // 全局搜索
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // 选中的项目（用于批量操作）
  selectedItems: Set<string>;
  toggleItemSelection: (id: string) => void;
  selectAllItems: (ids: string[]) => void;
  clearSelection: () => void;
  
  // 重置所有状态
  resetAppState: () => void;
}

// 创建 Context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider Props
interface AppStateProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
  initialUser?: User | null;
}

// Provider 组件
export function AppStateProvider({ 
  children, 
  initialTheme = 'light',
  initialUser = null 
}: AppStateProviderProps) {
  // 侧边栏状态
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // 主题状态（从 localStorage 读取）
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      return (stored as Theme) || initialTheme;
    }
    return initialTheme;
  });
  
  // 用户状态
  const [user, setUser] = useState<User | null>(initialUser);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  
  // 模态框状态
  const [modals, setModals] = useState<{ [key: string]: boolean }>({});
  
  // 搜索查询
  const [searchQuery, setSearchQuery] = useState('');
  
  // 选中的项目
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // 保存主题到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      // 更新 document 的 class
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // 侧边栏方法
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  // 主题方法
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  // 模态框方法
  const openModal = useCallback((modalId: string) => {
    setModals(prev => ({ ...prev, [modalId]: true }));
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setModals(prev => ({ ...prev, [modalId]: false }));
  }, []);

  const toggleModal = useCallback((modalId: string) => {
    setModals(prev => ({ ...prev, [modalId]: !prev[modalId] }));
  }, []);

  // 选择方法
  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllItems = useCallback((ids: string[]) => {
    setSelectedItems(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // 重置状态
  const resetAppState = useCallback(() => {
    setSidebarOpen(true);
    setTheme(initialTheme);
    setUser(initialUser);
    setIsLoading(false);
    setModals({});
    setSearchQuery('');
    setSelectedItems(new Set());
  }, [initialTheme, initialUser, setTheme]);

  const value = useMemo<AppStateContextType>(() => ({
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    theme,
    setTheme,
    toggleTheme,
    user,
    setUser,
    isLoading,
    setIsLoading,
    modals,
    openModal,
    closeModal,
    toggleModal,
    searchQuery,
    setSearchQuery,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    resetAppState,
  }), [
    sidebarOpen,
    toggleSidebar,
    theme,
    setTheme,
    toggleTheme,
    user,
    isLoading,
    modals,
    openModal,
    closeModal,
    toggleModal,
    searchQuery,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    resetAppState,
  ]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// Hook
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// 便捷的单一功能 Hooks
export function useSidebar() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAppState();
  return { sidebarOpen, setSidebarOpen, toggleSidebar };
}

export function useTheme() {
  const { theme, setTheme, toggleTheme } = useAppState();
  return { theme, setTheme, toggleTheme };
}

export function useUser() {
  const { user, setUser } = useAppState();
  return { user, setUser };
}

export function useModal(modalId: string) {
  const { modals, openModal, closeModal, toggleModal } = useAppState();
  return {
    isOpen: modals[modalId] || false,
    open: () => openModal(modalId),
    close: () => closeModal(modalId),
    toggle: () => toggleModal(modalId),
  };
}

export function useSelection() {
  const { selectedItems, toggleItemSelection, selectAllItems, clearSelection } = useAppState();
  return {
    selectedItems,
    toggleSelection: toggleItemSelection,
    selectAll: selectAllItems,
    clearSelection,
    selectedCount: selectedItems.size,
    isSelected: (id: string) => selectedItems.has(id),
  };
}