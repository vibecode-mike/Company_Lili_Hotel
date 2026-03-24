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

// 狀態映射：統一簡體/繁體
const normalizeStatus = (status: string): '已排程' | '草稿' | '已發送' | '發送失敗' => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('发送失败') || statusLower.includes('發送失敗') || statusLower.includes('失败') || statusLower.includes('失敗')) {
    return '發送失敗';
  }
  if (statusLower.includes('已发送') || statusLower.includes('已發送') || statusLower.includes('sent')) {
    return '已發送';
  }
  if (statusLower.includes('草稿') || statusLower.includes('draft')) {
    return '草稿';
  }
  if (statusLower.includes('已排程') || statusLower.includes('scheduled')) {
    return '已排程';
  }
  // 默認返回原值或草稿
  return status as any || '草稿';
};

// 轉換後端數據為前端格式 (LINE 本地 DB)
const transformBackendMessage = (item: BackendMessage): Message => ({
  id: item.id.toString(),
  title: item.message_title || item.template?.name || '未命名訊息',
  tags: normalizeInteractionTags(item.interaction_tags ?? item.interactionTags ?? item.tags),
  platform: isMessagePlatform(item.platform) ? item.platform : 'LINE',
  channelId: item.channel_id,
  channelName: item.channel_name,
  status: normalizeStatus(item.send_status),
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
  const [backendStatusCounts, setBackendStatusCounts] = useState<Record<string, number>>({});
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const hasFetchedRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    console.log('🔄 開始載入訊息...');
    console.log('🔄 API URL:', '/api/v1/messages?page=1&page_size=100');
    setIsLoading(true);
    try {
      // ✅ 方案 B：只調用一個 API，後端自動合併本地 DB + FB 外部 API 數據
      // 增加 page_size 到 500 以包含所有草稿消息
      const response = await apiGet('/api/v1/messages?page=1&page_size=500');
      console.log('✅ API Response 對象:', response);

      // ⚠️ 修復：apiGet 返回 Response 對象，需要解析 JSON
      const jsonData = await response.json();
      console.log('✅ 解析後的 JSON:', jsonData);
      console.log('✅ JSON data:', jsonData.data);

      // 直接使用返回的數據（後端已經合併好了）
      const allMessages = (jsonData.data?.items || []).map(transformBackendMessage);

      const lineCnt = allMessages.filter(m => m.platform === 'LINE').length;
      const fbCnt = allMessages.filter(m => m.platform === 'Facebook').length;
      console.log(`✅ 訊息載入完成: 總計 ${allMessages.length} 筆, LINE ${lineCnt} 筆, FB ${fbCnt} 筆`);

      // ✅ 使用後端返回的 status_counts（包含所有數據，不只是當前頁）
      const backendCounts = jsonData.data?.status_counts || {};
      console.log('📊 後端返回的狀態統計:', backendCounts);
      console.log('📊 backendCounts 類型:', typeof backendCounts, Array.isArray(backendCounts) ? '是數組' : '是對象');
      console.log('📊 backendCounts keys:', Object.keys(backendCounts));
      setBackendStatusCounts(backendCounts);
      console.log('✅ 已設置 backendStatusCounts');

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
    console.log('🔢 計算 statusCounts, backendStatusCounts:', backendStatusCounts);
    console.log('🔢 backendStatusCounts 內容:', JSON.stringify(backendStatusCounts, null, 2));

    // ✅ 直接使用後端返回的 status_counts（包含所有數據庫中的記錄，不受分頁限制）
    const sent = (backendStatusCounts['已發送'] || 0) + (backendStatusCounts['已发送'] || 0);
    const scheduled = (backendStatusCounts['已排程'] || 0) + (backendStatusCounts['已排程'] || 0);
    const draft = (backendStatusCounts['草稿'] || 0);

    console.log('✅ 前端狀態統計:', { sent, scheduled, draft, raw: backendStatusCounts });
    console.log('✅ sent 計算:', `${backendStatusCounts['已發送']} + ${backendStatusCounts['已发送']} = ${sent}`);
    console.log('✅ draft 計算:', `${backendStatusCounts['草稿']} = ${draft}`);

    return { sent, scheduled, draft };
  }, [backendStatusCounts]);

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
