import MessageList from '../components/MessageList';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * 活動與訊息推播頁面
 */
export default function MessageListPage() {
  const { navigate } = useNavigation();

  return (
    <MessageList
      onCreateMessage={() => navigate('flex-editor')}
      onEditMessage={(messageId) => navigate('flex-editor', { messageId })}
      onNavigateToAutoReply={() => navigate('auto-reply')}
      onNavigateToMembers={() => navigate('member-management')}
      onNavigateToSettings={() => navigate('line-api-settings')}
    />
  );
}
