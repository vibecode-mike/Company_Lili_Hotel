import type { Member, MemberData } from '../types/member';

type MemberLike = Partial<Member | MemberData> & Record<string, any>;

const DISPLAY_LOCALE = 'zh-TW';

export const formatMemberDateTime = (value?: string | null): string => {
  if (!value) return '未知';
  try {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return '未知';
    return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(date)
      .replace(/\//g, '-')
      .replace('，', ' ');
  } catch {
    return '未知';
  }
};

export const getLatestMemberChatTimestamp = (member?: MemberLike): string | undefined => {
  if (!member) return undefined;
  const candidates = [
    member.lastChatTime,
    member.lastMessageTime,
    member.last_message_time,
    member.lastMessageAt,
    member.last_message_at,
    member.lastInteractionAt,
    member.last_interaction_at,
    member.latestMessageAt,
    member.latest_message_at,
    member.lastMessage?.timestamp,
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
};
