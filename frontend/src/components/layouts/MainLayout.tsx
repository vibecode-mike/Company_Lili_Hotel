import { ReactNode, useState } from 'react';
import Sidebar from '../Sidebar';
import { useNavigation } from '../../contexts/NavigationContext';
import { useLineChannelStatus } from '../../contexts/LineChannelStatusContext';

interface MainLayoutProps {
  children: ReactNode;
  currentPage?: 'messages' | 'auto-reply' | 'members' | 'settings';
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
}

/**
 * 主佈局組件
 * 包含側邊欄和主內容區域
 */
export default function MainLayout({ 
  children, 
  currentPage = 'members',
  sidebarOpen: controlledSidebarOpen,
  onToggleSidebar: controlledOnToggleSidebar
}: MainLayoutProps) {
  const { navigate } = useNavigation();
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(true);
  const { isConfigured } = useLineChannelStatus();
  const navigationLocked = !isConfigured;

  // 使用受控或非受控的 sidebar 狀態
  const sidebarOpen = controlledSidebarOpen !== undefined ? controlledSidebarOpen : internalSidebarOpen;
  const setSidebarOpen = controlledOnToggleSidebar || setInternalSidebarOpen;

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage}
        onNavigateToMessages={() => navigate('message-list')}
        onNavigateToAutoReply={() => navigate('auto-reply')}
        onNavigateToMembers={() => navigate('member-management')}
        onNavigateToSettings={() => navigate('line-api-settings')}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
        navigationLocked={navigationLocked}
        lockedTooltip="請先完成基本設定"
      />

      {/* Main Content Area - offset by sidebar width */}
      <main className={`flex-1 bg-slate-50 transition-all duration-300 overflow-x-hidden overflow-y-auto ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
        {children}
      </main>
    </div>
  );
}
