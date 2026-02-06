import { useEffect, useState, useMemo } from 'react';
import MainContainer from '../imports/MemberDetailContainer';
import MainLayout from '../components/layouts/MainLayout';
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/MembersContext';
import { Member } from '../types/member';
import type { ChatPlatform } from '../components/chat-room/types';

/**
 * 會員詳情頁面
 */
export default function MemberDetailPage() {
  const { params, navigate, goBack } = useNavigation();
  const { getMemberById, fetchMemberById, getDisplayMemberById } = useMembers();
  // 從 URL 參數獲取渠道（從聊天室返回時會帶入）
  const platform = (params.platform as ChatPlatform) || 'LINE';

  const [member, setMember] = useState<Member | undefined>(
    params.memberId ? getMemberById(params.memberId) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  // 獲取完整會員詳情
  useEffect(() => {
    const memberId = params.memberId;
    if (!memberId) return;

    const loadMemberDetail = async () => {
      setIsLoading(true);
      // FB 需要傳入 platform 參數以便從外部 API 獲取會員資料
      const platformParam = platform === 'Facebook' ? platform : undefined;
      const fullMember = await fetchMemberById(memberId, platformParam);
      if (fullMember) {
        setMember(fullMember);
      }
      setIsLoading(false);
    };

    loadMemberDetail();
  }, [params.memberId, platform, fetchMemberById]);

  // 根據渠道獲取對應的頭像和名稱
  const getChannelSpecificData = useMemo(() => {
    if (!member) return { avatar: undefined, name: undefined };

    switch (platform) {
      case 'LINE':
        return {
          avatar: member.lineAvatar || (member as any).line_avatar,
          name: (member as any).line_display_name || member.username
        };
      case 'Facebook':
        return {
          avatar: (member as any).fb_avatar,
          name: (member as any).fb_customer_name || member.username
        };
      case 'Webchat':
        return {
          avatar: (member as any).webchat_avatar,
          name: (member as any).webchat_name || member.username
        };
      default:
        return {
          avatar: member.lineAvatar,
          name: member.username
        };
    }
  }, [member, platform]);

  // 獲取渠道名稱（粉專名/頻道名）- 優先從 displayMembers 獲取
  const channelName = useMemo(() => {
    if (!member) return null;

    // FB 會員：使用 fb_customer_id 或 params.memberId 查找
    if (platform === 'Facebook') {
      const fbCustomerId = (member as any)?.fb_customer_id || params.memberId;
      if (fbCustomerId) {
        const displayMember = getDisplayMemberById(`fb-${fbCustomerId}`);
        if (displayMember?.channelName) {
          return displayMember.channelName;
        }
      }
    }

    // LINE 會員：使用 member.id 查找
    const displayMember = getDisplayMemberById(`line-${member.id}`);
    if (displayMember?.channelName) {
      return displayMember.channelName;
    }

    return null;
  }, [member, platform, params.memberId, getDisplayMemberById]);

  // 轉換為 MemberData 格式（如果需要）- 使用渠道特定的頭像和名稱
  const memberData = member ? {
    id: member.id,
    username: getChannelSpecificData.name || member.username,  // 渠道特定名稱
    realName: member.realName,
    tags: member.tags,
    memberTags: member.memberTags,           // ✅ 添加會員標籤
    interactionTags: member.interactionTags, // ✅ 添加互動標籤
    tagDetails: member.tagDetails,           // ✅ 添加標籤詳細資訊
    phone: member.phone,
    email: member.email,
    gender: member.gender,                   // ✅ 添加性別
    birthday: member.birthday,               // ✅ 添加生日
    createTime: member.createTime,
    lastChatTime: member.lastChatTime,
    lineUid: member.lineUid,                 // ✅ 添加 LINE UID
    lineAvatar: getChannelSpecificData.avatar || member.lineAvatar,  // 渠道特定頭像
    id_number: member.id_number,             // ✅ 添加身分證字號
    residence: member.residence,             // ✅ 添加居住地
    passport_number: member.passport_number, // ✅ 添加護照號碼
    internal_note: member.internal_note,     // ✅ 添加會員備註
    status: 'active' as const,
  } : undefined;

  return (
    <MainLayout currentPage="members">
      <MainContainer
        member={memberData}
        onBack={() => navigate('member-management')}
        onNavigate={navigate}
        platform={platform}
        autoRefresh={false}
        channelName={channelName}
      />
    </MainLayout>
  );
}
