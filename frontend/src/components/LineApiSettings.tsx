import { useState } from 'react';
import Sidebar from './Sidebar';
import BasicSettings from './BasicSettings';
import { useLineChannelStatus } from '../contexts/LineChannelStatusContext';

interface LineApiSettingsProps {
  onBack?: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
}

export default function LineApiSettings({
  onBack,
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers
}: LineApiSettingsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isConfigured } = useLineChannelStatus();

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar 
        currentPage="settings"
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToAutoReply={onNavigateToAutoReply}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToSettings={() => {}} // Already on settings page
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
        navigationLocked={!isConfigured}
        lockedTooltip="請先完成基本設定"
      />

      {/* Main Content Area - offset by sidebar width */}
      <main className={`flex-1 overflow-auto bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
        <BasicSettings />
      </main>
    </div>
  );
}
