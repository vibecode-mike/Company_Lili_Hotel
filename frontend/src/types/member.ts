import type { MemberSourceType } from './channel';

/**
 * 標籤資訊
 * 包含標籤的完整資訊
 */
export interface TagInfo {
  id: number;
  name: string;
  type: 'member' | 'interaction';
}

/**
 * 基础会员信息
 * 包含所有会员的核心字段
 */
export interface Member {
  id: string;
  username: string;  // LINE user name
  realName: string;
  tags: string[];
  memberTags?: string[];      // 會員標籤（字串陣列，向後相容）
  interactionTags?: string[]; // 互動標籤（字串陣列，向後相容）
  tagDetails?: TagInfo[];     // 標籤詳細資訊
  phone: string;
  email: string;
  gender?: string;            // 性別：0=不透露/1=男/2=女 或 undisclosed/male/female
  birthday?: string;          // 生日 (ISO 日期格式 YYYY-MM-DD)
  createTime: string;
  lastChatTime: string;
  // LINE 渠道
  lineUid?: string;
  lineAvatar?: string;
  line_display_name?: string;
  channel_id?: string;        // LINE channel ID
  // Facebook 渠道
  fb_customer_id?: string;
  fb_customer_name?: string;
  fb_avatar?: string;
  // Webchat 渠道
  webchat_uid?: string;
  webchat_name?: string;
  webchat_avatar?: string;
  // 其他
  join_source?: MemberSourceType; // 加入來源：LINE/CRM/PMS/ERP/系統 - 使用統一類型
  id_number?: string;         // 身分證字號
  residence?: string;         // 居住地
  passport_number?: string;   // 護照號碼
  internal_note?: string;     // 會員備註
  gpt_enabled?: boolean;      // GPT 自動回覆模式 (true=自動, false=手動)
}

/**
 * 渠道類型
 */
export type ChannelType = 'LINE' | 'Facebook' | 'Webchat';

/**
 * 會員管理頁表格顯示用型別
 * LINE 和 FB 分開取、直接顯示
 */
export interface DisplayMember {
  id: string;                    // 唯一 ID (如 "line-123", "fb-456")
  odooMemberId: number | null;   // 本地 DB 的 member.id（FB 可能為 null）
  channel: ChannelType;          // 渠道類型
  channelUid: string;            // 渠道 UID (line_uid 或 customer_id)
  displayName: string;           // 顯示名稱（渠道名稱，如 LINE 暱稱）
  realName: string | null;       // 真實姓名（從會員資料）
  avatar: string | null;         // 頭像 URL
  email: string | null;          // Email
  phone: string | null;          // 電話
  createTime: string | null;     // 建立時間
  lastChatTime: string | null;   // 最後聊天時間
  tags: string[];                // 標籤列表
  // 未回覆狀態
  isUnanswered: boolean;         // 是否有未回覆的訊息
  unansweredSince: string | null; // 未回覆訊息的時間戳
  // 渠道帳號名稱
  channelName: string | null;    // 渠道帳號名稱 (e.g., "下班解憂所")
}

/**
 * 会员列表项（用于显示）
 * 可以根据需要添加额外的 UI 状态
 */
export interface MemberListItem extends Member {
  selected?: boolean;
  expanded?: boolean;
}

/**
 * 会员表单数据
 * 用于创建或编辑会员
 */
export interface MemberFormData {
  username?: string;
  realName?: string;
  tags?: string[];
  phone?: string;
  email?: string;
  note?: string;
}

/**
 * 类型守卫：检查是否为有效的会员对象
 */
export function isMember(obj: any): obj is Member {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.realName === 'string' &&
    Array.isArray(obj.tags) &&
    typeof obj.phone === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.createTime === 'string' &&
    typeof obj.lastChatTime === 'string'
  );
}

/**
 * 工具函数：创建空的会员对象
 * 用于初始化表单或测试
 */
export function createEmptyMember(): Member {
  return {
    id: '',
    username: '',
    realName: '',
    tags: [],
    phone: '',
    email: '',
    createTime: new Date().toISOString(),
    lastChatTime: new Date().toISOString(),
    lineUid: '',
    lineAvatar: '',
  };
}
