import { useEffect, useState } from 'react';
import MemberManagement from '../imports/MemberListContainer';
import MainLayout from '../components/layouts/MainLayout';
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/MembersContext';

/**
 * 會員管理頁面
 */
export default function MemberManagementPage() {
  const { navigate } = useNavigation();
  const { fetchMembers } = useMembers();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <MainLayout 
      currentPage="members"
      sidebarOpen={sidebarOpen}
      onToggleSidebar={setSidebarOpen}
    >
      <MemberManagement
        onAddMember={() => {
          // TODO: 打開新增會員模態框
        }}
        onOpenChat={(member) => {
          navigate('chat-room', { memberId: member.id });
        }}
        onViewDetail={(member) => {
          navigate('member-detail', { memberId: member.id });
        }}
      />
    </MainLayout>
  );
}
