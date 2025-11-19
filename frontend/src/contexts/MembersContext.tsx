import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import type { Member } from '../types/member';

/**
 * 會員數據 Context
 * 
 * 專門處理會員相關的數據和操作
 * 獨立於其他數據類型，避免不必要的重新渲染
 */

// Context 類型定義
interface MembersContextType {
  members: Member[];
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  fetchMemberById: (id: string) => Promise<Member | null>;
  totalMembers: number;
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

const transformBackendMember = (item: any): Member => {
  const memberTags = (item.tags || [])
    .filter((tag: any) => tag.type === 'member')
    .map((tag: any) => tag.name);
  const interactionTags = (item.tags || [])
    .filter((tag: any) => tag.type === 'interaction')
    .map((tag: any) => tag.name);
  const combinedTags = Array.from(new Set([...(memberTags || []), ...(interactionTags || [])]));

  return {
    id: item.id?.toString() ?? '',
    username: item.line_name || item.name || '未命名會員',
    realName: item.name || '',
    tags: combinedTags,
    memberTags,
    interactionTags,
    phone: item.phone || '',
    email: item.email || '',
    gender: item.gender || '',
    birthday: item.birthday || '',
    createTime: formatDateTime(item.created_at),
    lastChatTime: formatDateTime(item.last_interaction_at),
    lineUid: item.line_uid || '',
    lineAvatar: item.line_avatar || '',
    join_source: item.join_source || '',
    id_number: item.id_number || '',
    residence: item.residence || '',
    passport_number: item.passport_number || '',
    internal_note: item.internal_note || '',
  };
};

// Provider Props
interface MembersProviderProps {
  children: ReactNode;
}

// Provider 組件
export function MembersProvider({ children }: MembersProviderProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('未登入，無法獲取會員列表');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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
      const transformedMembers = backendMembers.map(transformBackendMember);
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
    fetchMembers();
  }, [fetchMembers]);

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

  const value = useMemo<MembersContextType>(() => ({
    members,
    setMembers,
    addMember,
    updateMember,
    deleteMember,
    getMemberById,
    fetchMemberById,
    totalMembers,
    isLoading,
    error,
    fetchMembers,
  }), [members, addMember, updateMember, deleteMember, getMemberById, fetchMemberById, totalMembers, isLoading, error, fetchMembers]);

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
