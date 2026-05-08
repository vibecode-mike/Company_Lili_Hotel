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
  const { navigate, params } = useNavigation();
  const { fetchMembers } = useMembers();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // 由其他頁面（例如數據洞察的互動旅程 stacked bar）帶入的初始篩選
  // tagFilter 以 JSON 序列化字串傳遞，這裡解回陣列
  // 用 useState 鎖定首次 mount 的值，後續 URL 被清掉也不會被覆寫
  const [initialTagFilter] = useState<string[] | undefined>(() => {
    if (!params.tagFilter) return undefined;
    try {
      const parsed = JSON.parse(params.tagFilter);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : undefined;
    } catch {
      return undefined;
    }
  });
  const [initialPlatformChannel] = useState<string | undefined>(() => params.platformChannel);

  // mount 後立刻清掉 URL 上的篩選參數，確保「重整頁面」回到預設
  // （初始值已被上方 useState 鎖定，清掉 URL 不影響當下顯示）
  useEffect(() => {
    if (params.tagFilter || params.platformChannel) {
      navigate('member-management', {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout
      currentPage="members"
      sidebarOpen={sidebarOpen}
      onToggleSidebar={setSidebarOpen}
    >
      <MemberManagement
        initialTagFilter={initialTagFilter}
        initialPlatformChannel={initialPlatformChannel}
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
