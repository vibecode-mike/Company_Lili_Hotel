import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Member, TagInfo, ChannelType, DisplayMember } from '../types/member';
import type { BackendMember, BackendTag } from '../types/api';
import { useAuth } from '../components/auth/AuthContext';

/**
 * 會員數據 Context
 * 專門處理會員相關的數據和操作
 */

// FB 訊息列表成員資訊（來自外部 API）
interface FbMemberInfo {
  message_id: string;
  customer_id: number;
  customer_name: string;
  customer_tag: string[];
  channel: string;
  email?: string;
  create_time: string;
  last_message_time: string;
  unread: boolean;
  unread_time: number;
  unread_time_string: string;
}

// Context 類型定義
interface MembersContextType {
  members: Member[];
  displayMembers: DisplayMember[];
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  getDisplayMemberById: (id: string) => DisplayMember | undefined;
  fetchMemberById: (id: string) => Promise<Member | null>;
  totalMembers: number;
  totalDisplayMembers: number;
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
  const [members, setMembers] = useState<Member[]>([]);
  const [displayMembers, setDisplayMembers] = useState<DisplayMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const hasFetchedRef = useRef(false);

  const fetchMembers = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('未登入，無法獲取會員列表');
      return;
    }

    setIsLoading(true);
    setError(null);

    const jwtToken = localStorage.getItem('jwt_token') || '';
    const displayRows: DisplayMember[] = [];

    try {
      // 1. 並行取得 LINE 會員 + FB 會員（先顯示，再同步）
      const [lineMembersRes, fbMembersRes] = await Promise.all([
        fetch('/api/v1/members?channel=line&page=1&page_size=200', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        jwtToken
          ? fetch(`/api/v1/fb_channels/message-list?jwt_token=${encodeURIComponent(jwtToken)}`)
          : Promise.resolve({ ok: false } as Response),
      ]);

      // 2. LINE 會員 → 直接加入顯示列表
      if (lineMembersRes.ok) {
        const lineData = await lineMembersRes.json();
        const lineItems = lineData.data?.items || [];
        for (const member of lineItems) {
          displayRows.push({
            id: `line-${member.id}`,
            odooMemberId: member.id,
            channel: 'LINE',
            channelUid: member.line_uid || '',
            displayName: member.line_display_name || member.name || '未知',
            realName: member.name || null,
            avatar: member.line_avatar || null,
            email: member.email || null,
            phone: member.phone || null,
            createTime: member.created_at || null,
            lastChatTime: member.last_interaction_at || null,
            tags: (member.tags || []).map((t: BackendTag) => t.name),
            // 未回覆狀態
            isUnanswered: member.is_unanswered || false,
            unansweredSince: member.unanswered_since || null,
            // 渠道名稱
            channelName: member.channel_name || null,
          });
        }
        console.log('LINE 會員載入:', lineItems.length, '筆');
      }

      // 3. FB 會員 → 直接加入顯示列表
      if (fbMembersRes.ok) {
        const fbData = await fbMembersRes.json();
        const fbItems: FbMemberInfo[] = fbData.data || [];
        for (const fb of fbItems) {
          displayRows.push({
            id: `fb-${fb.customer_id}`,
            odooMemberId: null,  // FB 會員可能沒有本地 ID
            channel: 'Facebook',
            channelUid: String(fb.customer_id),
            displayName: fb.customer_name || 'Facebook 用戶',
            realName: null,  // FB 無真實姓名資料
            avatar: null,
            email: fb.email || null,
            phone: null,
            createTime: fb.create_time || null,
            lastChatTime: fb.last_message_time || null,
            tags: fb.customer_tag || [],
            // 未回覆狀態（FB API 提供 unread 欄位）
            isUnanswered: fb.unread || false,
            unansweredSince: fb.unread ? fb.last_message_time : null,
            // 渠道名稱（FB API 提供 channel 欄位）
            channelName: fb.channel || null,
          });
        }
        console.log('FB 會員載入:', fbItems.length, '筆');
      }

      // 設定顯示用列表
      setDisplayMembers(displayRows);

      // 4. 背景同步到 DB（email 合併）- 不阻塞顯示
      if (jwtToken) {
        fetch('/api/v1/fb_channels/sync-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt_token: jwtToken }),
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => data && console.log('FB 背景同步完成:', data.data))
          .catch(err => console.warn('FB 背景同步失敗:', err));
      }

      // 向後相容：維持舊的 members 更新（用於詳情頁等場景）
      const allMembersRes = await fetch('/api/v1/members?page=1&page_size=200', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (allMembersRes.ok) {
        const allData = await allMembersRes.json();
        const backendMembers = allData.data?.items || [];
        const transformedMembers = backendMembers.map(transformBackendMember);
        setMembers(transformedMembers);
      }

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
      setDisplayMembers([]);
      setError(null);
    }
  }, [isAuthenticated, fetchMembers]);

  const addMember = useCallback((member: Member) => {
    setMembers(prev => [...prev, member]);
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const getMemberById = useCallback((id: string) => {
    return members.find(m => m.id === id);
  }, [members]);

  const getDisplayMemberById = useCallback((id: string) => {
    return displayMembers.find(m => m.id === id);
  }, [displayMembers]);

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

      const transformedMember = transformBackendMember(memberData);

      // Update the member in the members array if it exists
      setMembers(prev => {
        const index = prev.findIndex(m => m.id === id);
        if (index !== -1) {
          const newMembers = [...prev];
          newMembers[index] = transformedMember;
          return newMembers;
        }
        return [...prev, transformedMember];
      });

      return transformedMember;
    } catch (err) {
      console.error('獲取會員詳情失敗:', err);
      return null;
    }
  }, []);

  const totalMembers = useMemo(() => members.length, [members]);
  const totalDisplayMembers = useMemo(() => displayMembers.length, [displayMembers]);

  const value = useMemo<MembersContextType>(() => ({
    members,
    displayMembers,
    setMembers,
    addMember,
    updateMember,
    deleteMember,
    getMemberById,
    getDisplayMemberById,
    fetchMemberById,
    totalMembers,
    totalDisplayMembers,
    isLoading,
    error,
    fetchMembers,
  }), [members, displayMembers, addMember, updateMember, deleteMember, getMemberById, getDisplayMemberById, fetchMemberById, totalMembers, totalDisplayMembers, isLoading, error, fetchMembers]);

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
