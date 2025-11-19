import AutoReply from '../components/AutoReply';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * 自動回應頁面
 */
export default function AutoReplyPage() {
  const { navigate, goBack } = useNavigation();

  return (
    <AutoReply
      onBack={goBack}
      onNavigateToMessages={() => navigate('message-list')}
      onNavigateToMembers={() => navigate('member-management')}
      onNavigateToSettings={() => navigate('line-api-settings')}
    />
  );
}
