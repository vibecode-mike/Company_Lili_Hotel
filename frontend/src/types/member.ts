/**
 * 基础会员信息
 * 包含所有会员的核心字段
 */
export interface Member {
  id: string;
  username: string;  // LINE user name
  realName: string;
  tags: string[];
  memberTags?: string[];      // 會員標籤
  interactionTags?: string[]; // 互動標籤
  phone: string;
  email: string;
  createTime: string;
  lastChatTime: string;
}

/**
 * 扩展会员信息
 * 包含额外的状态和标签字段
 * 用于会员详情页面
 */
export interface MemberData extends Member {
  status?: "active" | "inactive";
  note?: string;
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