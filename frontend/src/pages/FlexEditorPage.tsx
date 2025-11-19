import MessageCreation from '../components/MessageCreation';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * LINE Flex Message 編輯器頁面
 */
export default function FlexEditorPage() {
  const { params, navigate, goBack } = useNavigation();

  // Get message data if editing
  const editMessageId = params.messageId;
  
  // Mock message data - in real app, fetch from API or context
  const getMessageData = (id: string) => {
    const mockMessages: Record<string, any> = {
      '1': {
        title: '雙人遊行 獨家優惠',
        notificationMsg: '限時優惠！',
        previewMsg: '立即查看雙人遊行優惠',
        scheduleType: 'scheduled',
        targetType: 'filtered',
        templateType: 'carousel',
        selectedFilterTags: [
          { id: '1', name: '雙人床' },
          { id: '2', name: '送禮' },
          { id: '3', name: 'KOL' }
        ],
        filterCondition: 'include' as const,
        scheduledDate: new Date('2026-10-02'),
        scheduledTime: { hours: '22', minutes: '47' },
        flexMessageJson: {
          type: 'carousel',
          contents: []
        }
      },
      '2': {
        title: '雙人遊行 獨家優惠',
        notificationMsg: '商務房特惠',
        previewMsg: '查看商務房優惠方案',
        scheduleType: 'scheduled',
        targetType: 'filtered',
        templateType: 'carousel',
        selectedFilterTags: [
          { id: '4', name: '商務房' },
          { id: '2', name: '送禮' },
          { id: '3', name: 'KOL' }
        ],
        filterCondition: 'include' as const,
        scheduledDate: new Date('2026-10-02'),
        scheduledTime: { hours: '22', minutes: '47' },
        flexMessageJson: {
          type: 'carousel',
          contents: []
        }
      },
      '3': {
        title: '雙人遊行 獨家優惠',
        notificationMsg: '頂級商務房',
        previewMsg: '體驗頂級商務房',
        scheduleType: 'scheduled',
        targetType: 'filtered',
        templateType: 'carousel',
        selectedFilterTags: [
          { id: '4', name: '商務房' },
          { id: '3', name: 'KOL' }
        ],
        filterCondition: 'include' as const,
        scheduledDate: new Date('2026-10-02'),
        scheduledTime: { hours: '22', minutes: '47' },
        flexMessageJson: {
          type: 'carousel',
          contents: []
        }
      },
      '6': {
        title: '新品上市通知',
        notificationMsg: '新品來了',
        previewMsg: '搶先體驗新品',
        scheduleType: 'immediate',
        targetType: 'all',
        templateType: 'single',
        selectedFilterTags: [
          { id: '5', name: '新品' },
          { id: '6', name: '首發' }
        ],
        filterCondition: 'include' as const,
        flexMessageJson: {
          type: 'bubble',
          body: {}
        }
      }
    };
    return mockMessages[id];
  };

  const editMessageData = editMessageId ? getMessageData(editMessageId) : undefined;

  return (
    <MessageCreation
      onBack={goBack}
      onNavigate={navigate}
      onNavigateToSettings={() => navigate('line-api-settings')}
      editMessageId={editMessageId}
      editMessageData={editMessageData}
    />
  );
}
