import LineApiSettings from '../components/LineApiSettings';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * LINE API 基本設定頁面
 */
export default function LineApiSettingsPage() {
  const { navigate, goBack } = useNavigation();

  return (
    <LineApiSettings
      onBack={goBack}
      onNavigateToMessages={() => navigate('message-list')}
      onNavigateToAutoReply={() => navigate('auto-reply')}
      onNavigateToMembers={() => navigate('member-management')}
    />
  );
}
