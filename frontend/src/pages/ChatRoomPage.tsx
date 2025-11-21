import ChatRoom from '../components/ChatRoom';
import MainLayout from '../components/layouts/MainLayout';
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/MembersContext';

/**
 * 聊天室頁面
 */
export default function ChatRoomPage() {
  const { params, navigate } = useNavigation();
  const { getMemberById } = useMembers();

  // 從 Context 獲取會員數據
  const member = params.memberId ? getMemberById(params.memberId) : undefined;

  return (
    <MainLayout currentPage="members">
      <ChatRoom
        member={member}
        onBack={() => navigate('member-management')}
      />
    </MainLayout>
  );
}
