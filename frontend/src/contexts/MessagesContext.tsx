import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../components/auth/AuthContext';
import { normalizeInteractionTags } from '../utils/interactionTags';
import type { BackendMessage, FlexMessage, FbBroadcastMessage } from '../types/api';
import type { MessagePlatform } from '../types/channel';
import { isMessagePlatform } from '../types/channel';
import { apiGet, apiPost } from '../utils/apiClient';
import { getAuthToken, getJwtToken } from '../utils/token';

// FB 狀態映射（0=草稿, 1=已發送, 2=已排程）
const FB_STATUS_MAP: Record<number, Message['status']> = {
  0: '草稿',
  1: '已發送',
  2: '已排程',
};

/**
 * 訊息數據 Context
 *
 * 專門處理訊息推播相關的數據和操作
 * 獨立於其他數據類型，避免不必要的重新渲染
 */

// 消息類型
export interface Message {
  id: string;
  title: string;
  tags: string[];
  platform: MessagePlatform;
  channelId?: string; // 渠道ID（LINE channel_id 或 FB page_id）
  channelName?: string; // 渠道名稱（頻道名/粉專名）
  status: '已排程' | '草稿' | '已發送' | '發送失敗';
  recipientCount: number;
  openCount: number;
  clickCount: number;
  sendTime: string;
  createdAt: string;
  updatedAt: string;
  content?: FlexMessage;
  thumbnail?: string;
  sender: string;  // 發送人員（創建者名稱）
}

// 配額狀態類型
interface QuotaStatus {
  used: number;
  monthlyLimit: number;
  availableQuota: number;
  quotaType: string;
}

// Context 類型定義
interface MessagesContextType {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  getMessageById: (id: string) => Message | undefined;
  totalMessages: number;
  isLoading: boolean;
  fetchMessages: () => Promise<void>;
  statusCounts: { sent: number; scheduled: number; draft: number };
  quotaStatus: QuotaStatus | null;
  quotaLoading: boolean;
  quotaError: string | null;
  fetchQuota: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

// 創建 Context
const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

// Provider Props
interface MessagesProviderProps {
  children: ReactNode;
}

// 轉換後端數據為前端格式 (LINE 本地 DB)
const transformBackendMessage = (item: BackendMessage): Message => ({
  id: item.id.toString(),
  title: item.message_title || item.template?.name || '未命名訊息',
  tags: normalizeInteractionTags(item.interaction_tags ?? item.interactionTags ?? item.tags),
  platform: isMessagePlatform(item.platform) ? item.platform : 'LINE',
  channelId: item.channel_id,
  channelName: item.channel_name,
  status: item.send_status,
  recipientCount: item.send_count || 0,
  openCount: item.open_count || 0,
  clickCount: item.click_count || 0,
  sendTime: item.send_time || item.scheduled_at || '-',
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  thumbnail: item.thumbnail,
  sender: item.created_by
    ? (item.created_by.username || '-')
    : '-',
});

// 轉換 FB 外部 API 數據為前端格式
const transformFbBroadcastMessage = (item: FbBroadcastMessage): Message => {
  const timestamp = item.create_time ? new Date(item.create_time * 1000).toISOString() : '-';

  return {
    id: `fb-${item.id}`,
    title: item.title || '未命名訊息',
    tags: item.keywords?.map(k => k.name) || [],
    platform: 'Facebook',
    channelId: undefined,
    channelName: item.channel_name,
    status: FB_STATUS_MAP[item.status] ?? '已發送',
    recipientCount: item.amount || 0,
    openCount: 0,
    clickCount: item.click_amount || 0,
    sendTime: timestamp,
    createdAt: timestamp,
    updatedAt: '-',
    thumbnail: undefined,
    sender: '-',
  };
};

// Provider 組件
export function MessagesProvider({ children }: MessagesProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const hasFetchedRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      console.warn('未登入，無法獲取訊息列表');
      return;
    }

    setIsLoading(true);
    try {
      const jwtToken = getJwtToken();
      const fbApiBaseUrl = (import.meta.env.VITE_FB_API_URL || '').replace(/\/+$/, '');
      const allMessages: Message[] = [];

      // 並行獲取 LINE (本地 DB) 和 FB (外部 API) 訊息
      // 使用 apiGet 自動處理 token 和 401 重試
      const fetchPromises: Promise<Response>[] = [
        apiGet('/api/v1/messages?page=1&page_size=100'),
      ];

      // 僅在有 JWT token 和 FB API URL 時才獲取 FB 訊息
      // FB 外部 API 使用 jwtToken，不透過 apiClient
      if (jwtToken && fbApiBaseUrl) {
        fetchPromises.push(
          fetch(`${fbApiBaseUrl}/api/v1/admin/meta_page/message/gourp_list`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` },
          })
        );
      }

      const responses = await Promise.all(fetchPromises);
      const [lineResponse, fbResponse] = responses;

      // 處理 LINE 訊息
      if (lineResponse.ok) {
        const lineResult = await lineResponse.json();
        const lineMessages = (lineResult.data?.items || []).map(transformBackendMessage);
        allMessages.push(...lineMessages);
      }

      // 處理 FB 訊息（如果有請求）
      if (fbResponse?.ok) {
        const fbResult = await fbResponse.json();
        const fbMessages = (fbResult.data || []).map(transformFbBroadcastMessage);
        allMessages.push(...fbMessages);
      }

      const lineCnt = allMessages.filter(m => m.platform === 'LINE').length;
      const fbCnt = allMessages.filter(m => m.platform === 'Facebook').length;
      console.log(`訊息載入完成: LINE ${lineCnt} 筆, FB ${fbCnt} 筆`);
      setMessages(allMessages);
    } catch (error) {
      console.error('獲取訊息列表錯誤:', error);
      toast.error('獲取訊息列表失敗');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchQuota = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      console.warn('未登入，無法獲取配額狀態');
      setQuotaStatus(null);
      setQuotaError('請先登入');
      return;
    }

    setQuotaLoading(true);
    setQuotaError(null);
    try {
      // 使用 apiPost 自動處理 token 和 401 重試
      const response = await apiPost('/api/v1/messages/quota', {
        target_type: 'all_friends'
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail || '獲取配額狀態失敗');
      }

      const result = await response.json();
      setQuotaStatus({
        used: Number(result.used ?? 0),
        monthlyLimit: Number(result.monthly_limit ?? 0),
        availableQuota: Number(result.available_quota ?? 0),
        quotaType: String(result.quota_type ?? 'none'),
      });
      setQuotaError(null);
    } catch (error) {
      console.error('獲取配額狀態錯誤:', error);
      setQuotaStatus(null);
      setQuotaError(error instanceof Error ? error.message : '獲取配額狀態失敗');
    } finally {
      setQuotaLoading(false);
    }
  }, []);

  // 刷新所有數據（訊息列表 + 配額狀態）
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchMessages(),
      fetchQuota()
    ]);
  }, [fetchMessages, fetchQuota]);

  // 初始載入數據
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchMessages();
      fetchQuota();
    }
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
      setMessages([]);
      setQuotaStatus(null);
      setQuotaLoading(false);
      setQuotaError(null);
    }
  }, [isAuthenticated, fetchMessages, fetchQuota]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const getMessageById = useCallback((id: string) => {
    return messages.find(m => m.id === id);
  }, [messages]);

  const totalMessages = useMemo(() => messages.length, [messages]);

  const statusCounts = useMemo(() => {
    return {
      sent: messages.filter(m => m.status === '已發送').length,
      scheduled: messages.filter(m => m.status === '已排程').length,
      draft: messages.filter(m => m.status === '草稿').length,
    };
  }, [messages]);

  const value = useMemo<MessagesContextType>(() => ({
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    getMessageById,
    totalMessages,
    isLoading,
    fetchMessages,
    statusCounts,
    quotaStatus,
    quotaLoading,
    quotaError,
    fetchQuota,
    refreshAll,
  }), [messages, addMessage, updateMessage, deleteMessage, getMessageById, totalMessages, isLoading, fetchMessages, statusCounts, quotaStatus, quotaLoading, quotaError, fetchQuota, refreshAll]);

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

// Hook
export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}
