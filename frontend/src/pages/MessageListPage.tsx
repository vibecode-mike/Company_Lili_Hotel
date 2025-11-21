import MessageList from '../components/MessageList';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * 活動與訊息推播頁面
 */
export default function MessageListPage() {
  const { navigate } = useNavigation();

  return (
    <MessageList
      onCreateMessage={() => navigate('flex-editor', { fromPage: 'message-list' })}
      onEditMessage={(messageId) => navigate('flex-editor', { messageId, fromPage: 'message-list' })}
      onNavigateToAutoReply={() => navigate('auto-reply')}
      onNavigateToSettings={() => navigate('line-api-settings')}
    />
  );
}
