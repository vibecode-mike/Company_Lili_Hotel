import React, { ReactNode } from 'react';
import { NavigationProvider } from './NavigationContext';
import { AppStateProvider } from './AppStateContext';
import { DataProvider } from './DataContext';
import { ToastProvider } from '../components/ToastProvider';

/**
 * 统一的应用 Provider 组合
 * 
 * 提供完整的应用状态管理：
 * - NavigationProvider: 路由和导航状态
 * - AppStateProvider: UI 状态（侧边栏、主题、用户等）
 * - DataProvider: 应用数据（会员、消息、自动回复）
 * - ToastProvider: Toast 通知系统
 */

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NavigationProvider>
      <AppStateProvider>
        <DataProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </DataProvider>
      </AppStateProvider>
    </NavigationProvider>
  );
}

/**
 * 使用示例：
 * 
 * // 在 App.tsx 中包裹整个应用
 * import { AppProviders } from './contexts/AppProviders';
 * 
 * function App() {
 *   return (
 *     <AppProviders>
 *       <YourApp />
 *     </AppProviders>
 *   );
 * }
 * 
 * // 在任何组件中使用 Context
 * import { useNavigation } from './contexts/NavigationContext';
 * import { useAppState } from './contexts/AppStateContext';
 * import { useData } from './contexts/DataContext';
 * 
 * function MyComponent() {
 *   const { currentPage, navigate } = useNavigation();
 *   const { sidebarOpen, toggleSidebar } = useAppState();
 *   const { members, addMember } = useData();
 *   
 *   // 使用状态...
 * }
 */
