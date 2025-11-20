import { useState, useEffect } from 'react';
import MessageCreation from '../components/MessageCreation';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * LINE Flex Message 編輯器頁面
 */
export default function FlexEditorPage() {
  const { params, navigate, goBack } = useNavigation();
  const [messageData, setMessageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Get message data if editing
  const editMessageId = params.messageId;

  // Fetch message data from API when editing
  useEffect(() => {
    if (editMessageId) {
      const fetchMessageData = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            console.error('No auth token found');
            return;
          }

          const response = await fetch(`/api/v1/messages/${editMessageId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch message data');
          }

          const result = await response.json();
          const message = result.data || result;

          // Transform backend data to frontend format
          // Determine scheduleType based on send_status
          let scheduleType = 'immediate';
          if (message.send_status === '草稿') {
            scheduleType = 'draft';
          } else if (message.send_status === '已排程' || message.scheduled_datetime_utc) {
            scheduleType = 'scheduled';
          }

          // Determine filterCondition from target_filter
          let filterCondition: 'include' | 'exclude' = 'include';
          if (message.target_filter) {
            if (message.target_filter.exclude) {
              filterCondition = 'exclude';
            }
          }

          const transformedData = {
            id: message.id,
            title: message.message_content,
            notificationMsg: message.notification_message || '',
            previewMsg: message.preview_message || message.notification_message || '',
            scheduleType,
            targetType: message.target_type === 'all_friends' ? 'all' : 'filtered',
            templateType: 'carousel', // Default to carousel for draft messages
            selectedFilterTags: message.target_filter ?
              Object.values(message.target_filter).flat().map((name: any, index: number) => ({
                id: String(index + 1),
                name: String(name)
              })) : [],
            filterCondition,
            scheduledDate: message.scheduled_datetime_utc ?
              new Date(message.scheduled_datetime_utc) : undefined,
            scheduledTime: message.scheduled_datetime_utc ? {
              hours: new Date(message.scheduled_datetime_utc).getHours().toString().padStart(2, '0'),
              minutes: new Date(message.scheduled_datetime_utc).getMinutes().toString().padStart(2, '0')
            } : undefined,
            flexMessageJson: message.flex_message_json ?
              (typeof message.flex_message_json === 'string' ?
                JSON.parse(message.flex_message_json) :
                message.flex_message_json) : null,
            thumbnail: message.thumbnail
          };

          setMessageData(transformedData);
        } catch (error) {
          console.error('Error fetching message data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchMessageData();
    }
  }, [editMessageId]);

  // Show loading state while fetching
  if (editMessageId && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">載入訊息資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <MessageCreation
      onBack={goBack}
      onNavigate={navigate}
      onNavigateToSettings={() => navigate('line-api-settings')}
      editMessageId={editMessageId}
      editMessageData={messageData}
    />
  );
}
