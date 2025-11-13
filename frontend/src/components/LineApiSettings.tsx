import { PageWithSidebar } from './Sidebar';
import LineApiSettingsContent from './LineApiSettingsContent';

interface LineApiSettingsProps {
  onBack?: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
}

export default function LineApiSettings({
  onBack,
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings
}: LineApiSettingsProps) {
  return (
    <PageWithSidebar
      currentPage="settings"
      onNavigateToMessages={onNavigateToMessages}
      onNavigateToAutoReply={onNavigateToAutoReply}
      onNavigateToMembers={onNavigateToMembers}
      onNavigateToSettings={onNavigateToSettings}
    >
      <LineApiSettingsContent />
    </PageWithSidebar>
  );
}