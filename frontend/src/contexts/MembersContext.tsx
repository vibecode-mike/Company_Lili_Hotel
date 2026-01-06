import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Member, TagInfo, ExpandedMember, ChannelType } from '../types/member';
import type { BackendMember, BackendTag } from '../types/api';
import { useAuth } from '../components/auth/AuthContext';

/**
 * 會員數據 Context
 *
 * 專門處理會員相關的數據和操作
 * 獨立於其他數據類型，避免不必要的重新渲染
 */

// FB 訊息列表成員資訊（來自外部 API）
interface FbMemberInfo {
  message_id: string;
  customer_id: number;
  customer_name: string;
  customer_tag: string[];
  channel: string;
  email?: string;  // 用於匹配
  create_time: string;
  last_message_time: string;
  unread: boolean;
  unread_time: number;
  unread_time_string: string;
}

/**
 * 展開會員列表（每個渠道獨立一行）
 * 用於會員管理頁表格顯示
 */
const expandMembersByChannel = (members: Member[]): ExpandedMember[] => {
  const expanded: ExpandedMember[] = [];

  for (const member of members) {
    // LINE 渠道
    if (member.lineUid) {
      expanded.push({
        ...member,
        id: `${member.id}-line`,  // 唯一 key
        channel: 'LINE' as ChannelType,
        channelUid: member.lineUid,
        channelDisplayName: member.line_display_name || member.realName || '未知',
        channelAvatar: member.lineAvatar || '',
        originalMemberId: member.id,
      });
    }

    // Facebook 渠道
    if (member.fb_customer_id) {
      expanded.push({
        ...member,
        id: `${member.id}-facebook`,
        channel: 'Facebook' as ChannelType,
        channelUid: member.fb_customer_id,
        channelDisplayName: member.fb_customer_name || member.realName || '未知',
        channelAvatar: member.fb_avatar || '',
        originalMemberId: member.id,
      });
    }

    // Webchat 渠道
    if (member.webchat_uid) {
      expanded.push({
        ...member,
        id: `${member.id}-webchat`,
        channel: 'Webchat' as ChannelType,
        channelUid: member.webchat_uid,
        channelDisplayName: member.webchat_name || member.realName || '訪客',
        channelAvatar: member.webchat_avatar || '',
        originalMemberId: member.id,
      });
    }
    // 注意：不處理無渠道會員（系統中不存在）
  }

  return expanded;
};

/**
 * 合併 FB 資料到會員列表（以 email 匹配）
 */
const mergeFbDataWithMembers = (members: Member[], fbMembers: FbMemberInfo[]): Member[] => {
  // 建立 FB 資料的 Map（以 email 匹配）
  const fbMap = new Map<string, FbMemberInfo>();
  fbMembers.forEach(fb => {
    if (fb.email) {
      fbMap.set(fb.email.toLowerCase(), fb);
    }
  });

  // 合併資料（僅更新 lastChatTime，fb_customer_id/name 已由後端 sync-members 處理）
  return members.map(member => {
    const fbInfo = member.email ? fbMap.get(member.email.toLowerCase()) : null;
    if (fbInfo) {
      return {
        ...member,
        lastChatTime: fbInfo.last_message_time || member.lastChatTime,
      };
    }
    return member;
  });
};

// Context 類型定義
interface MembersContextType {
  members: Member[];
  expandedMembers: ExpandedMember[];  // 展開後的會員列表（每渠道一行）
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  getExpandedMemberById: (id: string) => ExpandedMember | undefined;  // 查詢展開後的會員
  fetchMemberById: (id: string) => Promise<Member | null>;
  totalMembers: number;
  totalExpandedMembers: number;  // 展開後的總數
  isLoading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
}

// 創建 Context
const MembersContext = createContext<MembersContextType | undefined>(undefined);

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const transformBackendMember = (item: BackendMember): Member => {
  // 保留完整標籤資訊（包含 source）
  const tagDetails: (TagInfo & { source?: string })[] = (item.tags || []).map((tag: BackendTag & { source?: string }) => ({
    id: tag.id || 0,
    name: tag.name,
    type: tag.type,
    source: tag.source,
  }));

  const memberTags = (item.tags || [])
    .filter((tag: BackendTag) => tag.type === 'member')
    .map((tag: BackendTag) => tag.name);
  const interactionTags = (item.tags || [])
    .filter((tag: BackendTag) => tag.type === 'interaction')
    .map((tag: BackendTag) => tag.name);
  const combinedTags = Array.from(new Set([...(memberTags || []), ...(interactionTags || [])]));

  const displayName = item.line_display_name || '';

  return {
    id: item.id?.toString() ?? '',
    username: displayName || item.name || '未命名會員',
    realName: item.name || '',
    tags: combinedTags,
    memberTags,
    interactionTags,
    tagDetails,  // 新增完整標籤資訊
    phone: item.phone || '',
    email: item.email || '',
    gender: item.gender || '',
    birthday: item.birthday || '',
    createTime: formatDateTime(item.created_at),
    lastChatTime: formatDateTime(item.last_interaction_at),
    // LINE 渠道
    lineUid: item.line_uid || '',
    lineAvatar: item.line_avatar || '',
    line_display_name: item.line_display_name || '',
    channel_id: item.channel_id || '',
    // Facebook 渠道
    fb_customer_id: item.fb_customer_id || '',
    fb_customer_name: item.fb_customer_name || '',
    fb_avatar: item.fb_avatar || '',
    // Webchat 渠道
    webchat_uid: item.webchat_uid || '',
    webchat_name: item.webchat_name || '',
    webchat_avatar: item.webchat_avatar || '',
    // 其他
    join_source: item.join_source || '',
    id_number: item.id_number || '',
    residence: item.residence || '',
    passport_number: item.passport_number || '',
    internal_note: item.internal_note || '',
    gpt_enabled: item.gpt_enabled ?? true,  // 預設為 true (自動模式)
  };
};

// Provider Props
interface MembersProviderProps {
  children: ReactNode;
}

// Provider 組件
export function MembersProvider({ children }: MembersProviderProps) {
  const [members, setMembersState] = useState<Member[]>([]);
  const [expandedMembers, setExpandedMembers] = useState<ExpandedMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const hasFetchedRef = useRef(false);

  // 封裝 setMembers，同時更新展開後的列表
  const setMembers = useCallback((newMembers: Member[]) => {
    setMembersState(newMembers);
    setExpandedMembers(expandMembersByChannel(newMembers));
  }, []);

  const fetchMembers = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('未登入，無法獲取會員列表');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 同步 FB 會員（若有 jwt_token）
      const jwtToken = localStorage.getItem('jwt_token');
      if (jwtToken) {
        try {
          const syncResponse = await fetch('/api/v1/fb_channels/sync-members', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jwt_token: jwtToken }),
          });
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log('FB 會員同步完成:', syncResult.data);
          }
        } catch (syncError) {
          console.warn('FB 會員同步失敗，繼續獲取會員列表:', syncError);
        }
      }

      // 獲取會員列表
      const response = await fetch('/api/v1/members?page=1&page_size=200', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取會員列表失敗');
      }

      const result = await response.json();
      const backendMembers = result.data?.items || [];
      let transformedMembers = backendMembers.map(transformBackendMember);

      // 取得 FB 訊息列表並合併（若有 jwt_token）
      if (jwtToken) {
        try {
          const fbListResponse = await fetch(
            `/api/v1/fb_channels/message-list?jwt_token=${encodeURIComponent(jwtToken)}`
          );
          if (fbListResponse.ok) {
            const fbListResult = await fbListResponse.json();
            const fbMembers: FbMemberInfo[] = fbListResult.data || [];
            if (fbMembers.length > 0) {
              transformedMembers = mergeFbDataWithMembers(transformedMembers, fbMembers);
              console.log('FB 訊息列表合併完成:', fbMembers.length, '筆');
            }
          }
        } catch (fbListError) {
          console.warn('FB 訊息列表取得失敗，不影響主流程:', fbListError);
        }
      }

      setMembers(transformedMembers);
    } catch (err) {
      console.error('獲取會員列表錯誤:', err);
      const message = '獲取會員列表失敗';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchMembers();
    }
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
      setMembers([]);
      setError(null);
    }
  }, [isAuthenticated, fetchMembers]);

  const addMember = useCallback((member: Member) => {
    setMembersState(prev => {
      const newMembers = [...prev, member];
      setExpandedMembers(expandMembersByChannel(newMembers));
      return newMembers;
    });
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    setMembersState(prev => {
      const newMembers = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      setExpandedMembers(expandMembersByChannel(newMembers));
      return newMembers;
    });
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembersState(prev => {
      const newMembers = prev.filter(m => m.id !== id);
      setExpandedMembers(expandMembersByChannel(newMembers));
      return newMembers;
    });
  }, []);

  const getMemberById = useCallback((id: string) => {
    return members.find(m => m.id === id);
  }, [members]);

  const getExpandedMemberById = useCallback((id: string) => {
    return expandedMembers.find(m => m.id === id);
  }, [expandedMembers]);

  const fetchMemberById = useCallback(async (id: string): Promise<Member | null> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('未登入，無法獲取會員詳情');
      return null;
    }

    try {
      const response = await fetch(`/api/v1/members/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取會員詳情失敗');
      }

      const result = await response.json();
      const memberData = result.data;

      // Transform backend data to frontend format
      const transformedMember = transformBackendMember(memberData);

      // Update the member in the members array if it exists
      setMembersState(prev => {
        const index = prev.findIndex(m => m.id === id);
        let newMembers: Member[];
        if (index !== -1) {
          newMembers = [...prev];
          newMembers[index] = transformedMember;
        } else {
          newMembers = [...prev, transformedMember];
        }
        setExpandedMembers(expandMembersByChannel(newMembers));
        return newMembers;
      });

      return transformedMember;
    } catch (err) {
      console.error('獲取會員詳情失敗:', err);
      return null;
    }
  }, []);

  const totalMembers = useMemo(() => members.length, [members]);
  const totalExpandedMembers = useMemo(() => expandedMembers.length, [expandedMembers]);

  const value = useMemo<MembersContextType>(() => ({
    members,
    expandedMembers,
    setMembers,
    addMember,
    updateMember,
    deleteMember,
    getMemberById,
    getExpandedMemberById,
    fetchMemberById,
    totalMembers,
    totalExpandedMembers,
    isLoading,
    error,
    fetchMembers,
  }), [members, expandedMembers, setMembers, addMember, updateMember, deleteMember, getMemberById, getExpandedMemberById, fetchMemberById, totalMembers, totalExpandedMembers, isLoading, error, fetchMembers]);

  return (
    <MembersContext.Provider value={value}>
      {children}
    </MembersContext.Provider>
  );
}

// Hook
export function useMembers() {
  const context = useContext(MembersContext);
  if (context === undefined) {
    throw new Error('useMembers must be used within a MembersProvider');
  }
  return context;
}
