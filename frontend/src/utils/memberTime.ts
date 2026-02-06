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

/**
 * 格式化未回覆時間為相對時間
 * 規則：
 * - ≤10 分鐘：顯示「剛剛」
 * - 10-60 分鐘：顯示「{x}分鐘前」
 * - 1-24 小時：顯示「{x}小時前」
 * - 1-30 天：顯示「{x}天前」
 * - ≥30 天：顯示「yyyy/mm/dd 前」
 */
export const formatUnansweredTime = (timestamp: string | null | undefined): string | null => {
  if (!timestamp) return null;

  try {
    const normalized = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes <= 10) {
      return '剛剛';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours}小時前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day} 前`;
    }
  } catch {
    return null;
  }
};
