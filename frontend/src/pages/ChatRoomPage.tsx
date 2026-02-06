import ChatRoom from '../components/ChatRoom';
import MainLayout from '../components/layouts/MainLayout';
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/MembersContext';
import type { ChatPlatform } from '../components/chat-room/types';

/**
 * 聊天室頁面
 */
export default function ChatRoomPage() {
  const { params, navigate } = useNavigation();
  const { getMemberById } = useMembers();

  // 從 Context 獲取會員數據
  const member = params.memberId ? getMemberById(params.memberId) : undefined;

  // 從 params 獲取會員名稱（優先使用傳入的 memberName）
  const memberName = params.memberName || member?.username || member?.realName;
  const initialPlatform = (params.channel || params.platform) as ChatPlatform | undefined;

  // 導航到會員管理列表（第一層麵包屑點擊）
  const handleNavigateToMemberManagement = () => {
    navigate('member-management');
  };

  // 導航到會員詳情頁（第二層麵包屑點擊）- 帶渠道資訊
  const handleNavigateToMemberDetail = (platform?: ChatPlatform) => {
    if (params.memberId) {
      navigate('member-detail', {
        memberId: params.memberId,
        platform: platform || 'LINE'  // 傳遞當前選擇的渠道
      });
    }
  };

  return (
    <MainLayout currentPage="members">
      <ChatRoom
        member={member}
        memberId={params.memberId}
        memberName={memberName}
        initialPlatform={initialPlatform}
        onBack={handleNavigateToMemberManagement}
        onNavigateToMemberDetail={handleNavigateToMemberDetail}
      />
    </MainLayout>
  );
}
