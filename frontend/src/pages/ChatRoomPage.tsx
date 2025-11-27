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

  // 從 params 獲取會員名稱（優先使用傳入的 memberName）
  const memberName = params.memberName || member?.username || member?.realName;

  // 導航到會員管理列表（第一層麵包屑點擊）
  const handleNavigateToMemberManagement = () => {
    navigate('member-management');
  };

  // 導航到會員詳情頁（第二層麵包屑點擊）
  const handleNavigateToMemberDetail = () => {
    if (params.memberId) {
      navigate('member-detail', { memberId: params.memberId });
    }
  };

  return (
    <MainLayout currentPage="members">
      <ChatRoom
        member={member}
        memberId={params.memberId}
        memberName={memberName}
        onBack={handleNavigateToMemberManagement}
        onNavigateToMemberDetail={handleNavigateToMemberDetail}
      />
    </MainLayout>
  );
}
