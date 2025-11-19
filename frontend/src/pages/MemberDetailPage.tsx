import { useEffect, useState } from 'react';
import MainContainer from '../imports/MemberDetailContainer';
import MainLayout from '../components/layouts/MainLayout';
import { useNavigation } from '../contexts/NavigationContext';
import { useMembers } from '../contexts/MembersContext';
import { Member } from '../types/member';

/**
 * 會員詳情頁面
 */
export default function MemberDetailPage() {
  const { params, navigate, goBack } = useNavigation();
  const { getMemberById, fetchMemberById } = useMembers();
  const [member, setMember] = useState<Member | undefined>(
    params.memberId ? getMemberById(params.memberId) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  // 獲取完整會員詳情
  useEffect(() => {
    if (!params.memberId) return;

    const loadMemberDetail = async () => {
      setIsLoading(true);
      const fullMember = await fetchMemberById(params.memberId!);
      if (fullMember) {
        setMember(fullMember);
      }
      setIsLoading(false);
    };

    loadMemberDetail();
  }, [params.memberId, fetchMemberById]);
  
  // 轉換為 MemberData 格式（如果需要）
  const memberData = member ? {
    id: member.id,
    username: member.username,
    realName: member.realName,
    tags: member.tags,
    memberTags: member.memberTags,           // ✅ 添加會員標籤
    interactionTags: member.interactionTags, // ✅ 添加互動標籤
    phone: member.phone,
    email: member.email,
    gender: member.gender,                   // ✅ 添加性別
    createTime: member.createTime,
    lastChatTime: member.lastChatTime,
    lineUid: member.lineUid,                 // ✅ 添加 LINE UID
    lineAvatar: member.lineAvatar,           // ✅ 添加 LINE 頭像
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
        onBack={goBack}
        onNavigate={navigate}
      />
    </MainLayout>
  );
}