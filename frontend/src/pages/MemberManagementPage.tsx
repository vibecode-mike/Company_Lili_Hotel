import { useEffect, useState } from 'react';
import MemberManagement from '../imports/MemberListContainer';
import MainLayout from '../components/layouts/MainLayout';
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/MembersContext';
import type { DisplayMember } from '../types/member';

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
        onOpenChat={(member: DisplayMember) => {
          // 傳遞 memberId 和 channel 給聊天室
          // LINE: 使用 odooMemberId（DB member.id）
          // FB: 使用 channelUid（customer_id），因為可能尚未同步到 DB
          const memberId = member.odooMemberId?.toString() || member.channelUid;
          navigate('chat-room', {
            memberId,
            channel: member.channel,
          });
        }}
        onViewDetail={(member: DisplayMember) => {
          // FB 優先使用 channelUid (fb_customer_id)，因為可能尚未同步到本地 DB
          // 其他渠道優先使用 odooMemberId (本地 DB ID)
          const memberId = member.channel === 'Facebook'
            ? (member.channelUid || member.odooMemberId?.toString())
            : (member.odooMemberId?.toString() || member.channelUid);
          navigate('member-detail', { memberId, platform: member.channel });
        }}
      />
    </MainLayout>
  );
}
