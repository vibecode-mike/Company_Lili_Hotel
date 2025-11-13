import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import sidebarPaths from '../imports/svg-jb10q6lg6b';
import StarbitLogo from './StarbitLogo';

interface SidebarProps {
  currentPage?: 'messages' | 'auto-reply' | 'members' | 'settings';
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
}

export default function Sidebar({ 
  currentPage = 'messages',
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings,
  sidebarOpen = true,
  onToggleSidebar
}: SidebarProps) {
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(true);
  const { logout, user } = useAuth();
  
  // Use controlled or uncontrolled state
  const isOpen = onToggleSidebar !== undefined ? sidebarOpen : internalSidebarOpen;
  const toggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar(!isOpen);
    } else {
      setInternalSidebarOpen(!isOpen);
    }
  };

  return (
    <aside className={`bg-slate-100 content-stretch flex flex-col h-screen items-start fixed top-0 left-0 shrink-0 z-50 ${isOpen ? 'w-[330px] lg:w-[280px] md:w-[250px]' : 'w-[72px]'} transition-all duration-300`}>
      {/* Logo & Toggle */}
      <div className="box-border flex items-center justify-between p-4 w-full">
        {isOpen && (
          <div className="content-stretch flex flex-col h-[56px] items-start justify-center overflow-clip relative shrink-0 w-[148px]">
            <StarbitLogo onClick={onNavigateToMembers} />
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="overflow-clip relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
        >
          <svg className="block size-full" fill="none" viewBox="0 0 27 24">
            <rect height="22" rx="7" stroke="#B6C8F1" strokeWidth="2" width="24.6667" x="1" y="1" />
            <path d="M9.99992 0L9.99992 24" stroke="#B6C8F1" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 w-full overflow-y-auto">
        {isOpen && (
          <>
            {/* 會員 Section */}
            <div className="box-border flex flex-col gap-1 px-4">
              <div className="box-border flex gap-1 h-[29px] items-center p-1">
                <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 14 14">
                  <path d={sidebarPaths.pa54d00} fill="#6E6E6E" />
                </svg>
                <p className="text-[14px] text-[#6e6e6e]">會員</p>
              </div>
              <button 
                onClick={onNavigateToMembers}
                className={`box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full transition-colors ${
                  currentPage === 'members' ? 'bg-[#e1ebf9] hover:bg-[#d0e0f5]' : 'hover:bg-slate-200'
                }`}
              >
                <p className={`text-[16px] ${currentPage === 'members' ? 'text-[#0f6beb]' : 'text-[#383838]'}`}>會員管理</p>
              </button>
            </div>

            {/* 群發訊息 Section */}
            <div className="box-border flex flex-col gap-1 px-4 mt-5">
              <div className="box-border flex gap-1 h-[29px] items-center p-1">
                <svg className="shrink-0 size-[18px]" fill="none" viewBox="0 0 14 13">
                  <path d={sidebarPaths.p25432100} fill="#6E6E6E" />
                </svg>
                <p className="text-[14px] text-[#6e6e6e]">群發訊息</p>
              </div>
              <button 
                onClick={onNavigateToMessages}
                className={`box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full transition-colors ${
                  currentPage === 'messages' ? 'bg-[#e1ebf9] hover:bg-[#d0e0f5]' : 'hover:bg-slate-200'
                }`}
              >
                <p className={`text-[16px] ${currentPage === 'messages' ? 'text-[#0f6beb]' : 'text-[#383838]'}`}>活動與訊息推播</p>
              </button>
              <button 
                onClick={onNavigateToAutoReply}
                className={`box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full transition-colors ${
                  currentPage === 'auto-reply' ? 'bg-[#e1ebf9] hover:bg-[#d0e0f5]' : 'hover:bg-slate-200'
                }`}
              >
                <p className={`text-[16px] ${currentPage === 'auto-reply' ? 'text-[#0f6beb]' : 'text-[#383838]'}`}>自動回應</p>
              </button>
            </div>

            {/* 設定 Section */}
            <div className="box-border flex flex-col gap-1 px-4 mt-5">
              <div className="box-border flex gap-1 h-[29px] items-center p-1">
                <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 20 20">
                  <path d={sidebarPaths.p16734900} fill="#6E6E6E" />
                </svg>
                <p className="text-[14px] text-[#6e6e6e]">設定</p>
              </div>
              <button 
                onClick={onNavigateToSettings}
                className={`box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full transition-colors ${
                  currentPage === 'settings' ? 'bg-[#e1ebf9] hover:bg-[#d0e0f5]' : 'hover:bg-slate-200'
                }`}
              >
                <p className={`text-[16px] ${currentPage === 'settings' ? 'text-[#0f6beb]' : 'text-[#383838]'}`}>基本設定</p>
              </button>
              <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors" hidden>
                <p className="text-[16px] text-[#383838]">標籤管理</p>
              </button>
            </div>
          </>
        )}
      </div>

      {/* User Profile */}
      <div className="bg-slate-100 box-border border-t border-[#b6c8f1] flex flex-col items-start pb-[44px] pt-[12px] px-4 w-full">
        <div className="flex items-center gap-2 w-full">
          <div className="bg-white relative rounded-full shrink-0 size-[32px] flex items-center justify-center">
            <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
              <path d={sidebarPaths.p1c72d580} fill="#7A9FFF" />
            </svg>
          </div>
          {isOpen && (
            <>
              <p className="flex-1 text-[16px] text-[#383838]">{user?.name || 'User' || 'Daisy Yang'}</p>
              <button
                onClick={logout}
                className="text-[16px] text-[#0f6beb] hover:underline"
              >
                登出
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

/**
 * Hook to get the margin-left value based on sidebar state
 * Use this in the main content area to offset it properly
 */
export function useSidebarMargin(sidebarOpen: boolean = true): string {
  return sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]';
}

/**
 * Wrapper component for pages with sidebar
 */
interface PageWithSidebarProps {
  children: React.ReactNode;
  currentPage?: 'messages' | 'auto-reply' | 'members' | 'settings';
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
}

export function PageWithSidebar({
  children,
  currentPage,
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings
}: PageWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="bg-slate-50 min-h-screen flex">
      <Sidebar
        currentPage={currentPage}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToAutoReply={onNavigateToAutoReply}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToSettings={onNavigateToSettings}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
      />
      <main className={`flex-1 bg-slate-50 transition-all duration-300 overflow-x-hidden overflow-y-auto ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
        {children}
      </main>
    </div>
  );
}