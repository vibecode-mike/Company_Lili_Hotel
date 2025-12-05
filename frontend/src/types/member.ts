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
  lineUid?: string;
  lineAvatar?: string;
  join_source?: string;       // 加入來源：LINE/CRM/PMS/ERP/系統
  id_number?: string;         // 身分證字號
  residence?: string;         // 居住地
  passport_number?: string;   // 護照號碼
  internal_note?: string;     // 會員備註
  gpt_enabled?: boolean;      // GPT 自動回覆模式 (true=自動, false=手動)
}

/**
 * 扩展会员信息
 * 包含额外的状态和标签字段
 * 用于会员详情页面
 */
export interface MemberData extends Member {
  status?: "active" | "inactive";
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
 * 类型守卫：检查是否为有效的会员数据对象
 */
export function isMemberData(obj: any): obj is MemberData {
  return isMember(obj);
}

/**
 * 工具函数：将 MemberData 转换为 Member
 * 用于需要基础会员信息的场景
 */
export function memberDataToMember(memberData: MemberData): Member {
  return {
    id: memberData.id,
    username: memberData.username,
    realName: memberData.realName,
    tags: memberData.tags,
    phone: memberData.phone,
    email: memberData.email,
    createTime: memberData.createTime,
    lastChatTime: memberData.lastChatTime,
  };
}

/**
 * 工具函数：将 Member 转换为 MemberData
 * 用于需要扩展信息的场景
 */
export function memberToMemberData(member: Member, additionalData?: Partial<MemberData>): MemberData {
  return {
    ...member,
    status: additionalData?.status,
    note: additionalData?.note,
  };
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

/**
 * 工具函数：创建空的会员数据对象
 * 用于初始化表单或测试
 */
export function createEmptyMemberData(): MemberData {
  return {
    ...createEmptyMember(),
    status: 'active',
    note: '',
  };
}
