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
          // Determine scheduleType based on scheduled_at
          let scheduleType = 'immediate';
          if (message.scheduled_at) {
            scheduleType = 'scheduled';
          }

          // Determine filterCondition from target_filter
          let filterCondition: 'include' | 'exclude' = 'include';
          if (message.target_filter) {
            if (message.target_filter.exclude) {
              filterCondition = 'exclude';
            }
          }

          // ✅ Improved: Dynamically detect templateType from flex_message_json
          let templateType = 'carousel'; // Default
          if (message.flex_message_json) {
            try {
              const flexJson = typeof message.flex_message_json === 'string' ?
                JSON.parse(message.flex_message_json) :
                message.flex_message_json;

              if (flexJson.type === 'carousel') {
                templateType = 'carousel';
              } else if (flexJson.type === 'bubble') {
                templateType = 'bubble';
              }
            } catch (error) {
              console.error('Error parsing flex_message_json for templateType detection:', error);
            }
          }

          // ✅ Improved: Generate stable tag IDs using hash of tag name
          const generateStableTagId = (tagName: string): string => {
            // Simple hash function for stable ID generation
            let hash = 0;
            for (let i = 0; i < tagName.length; i++) {
              const char = tagName.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash; // Convert to 32bit integer
            }
            return `tag_${Math.abs(hash)}`;
          };

          const transformedData = {
            id: message.id,
            title: message.message_title,
            notificationMsg: message.notification_message ?? '',
            scheduleType,
            targetType: message.target_type === 'all_friends' ? 'all' : 'filtered',
            templateType, // ✅ Now dynamically detected
            selectedFilterTags: message.target_filter ?
              Object.values(message.target_filter).flat().map((name: any) => ({
                id: generateStableTagId(String(name)), // ✅ Stable ID generation
                name: String(name)
              })) : [],
            filterCondition,
            scheduledDate: message.scheduled_at ?
              new Date(message.scheduled_at) : undefined,
            scheduledTime: message.scheduled_at ? {
              hours: new Date(message.scheduled_at).getHours().toString().padStart(2, '0'),
              minutes: new Date(message.scheduled_at).getMinutes().toString().padStart(2, '0')
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
