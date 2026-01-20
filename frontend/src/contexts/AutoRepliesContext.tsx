import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { BackendAutoReply, BackendKeyword, BackendReplyMessage, FbAutoReply } from '../types/api';
import { useAuth } from '../components/auth/AuthContext';
import type { AutoReplyChannel } from '../types/channel';

/**
 * 自動回覆數據 Context
 *
 * 與後端 /api/v1/auto_responses API 接軌，提供 CRUD + 快速查詢功能
 */

export type AutoReplyTriggerType = 'welcome' | 'keyword' | 'follow' | 'time';

/**
 * 渠道類型別名（向後兼容）
 * 實際定義在 ../types/channel.ts
 */
export type ChannelType = AutoReplyChannel;

// 關鍵字對象，包含是否重複的標記
export interface AutoReplyKeyword {
  id?: number;  // 關鍵字 ID，用於激活重複關鍵字
  keyword: string;
  isDuplicate: boolean;
}

export interface AutoReply {
  id: string;
  name: string;
  triggerType: AutoReplyTriggerType;
  keywords: string[];
  keywordObjects: AutoReplyKeyword[]; // 包含重複標記的關鍵字對象
  tags: string[];
  messages: string[];
  isActive: boolean;
  triggerCount: number;
  successRate: number;
  createdAt: string;
  updatedAt?: string | null;
  triggerTimeStart?: string | null;
  triggerTimeEnd?: string | null;
  dateRangeStart?: string | null;
  dateRangeEnd?: string | null;
  channels?: AutoReplyChannel[]; // 新增：支持的回應渠道
}

export interface AutoReplyPayload {
  name: string;
  triggerType: AutoReplyTriggerType;
  messages: string[];
  keywords?: string[];
  isActive: boolean;
  triggerTimeStart?: string | null;
  triggerTimeEnd?: string | null;
  dateRangeStart?: string | null;
  dateRangeEnd?: string | null;
  channels?: AutoReplyChannel[]; // 新增：支持的回應渠道
  channelId?: string | null; // 渠道ID（LINE channel ID 或 FB page ID）
  forceActivate?: boolean; // 強制啟用（確認切換時使用）
}

export interface AutoReplyConflict {
  conflict: true;
  conflictType: 'welcome' | 'always_date_overlap';
  existingId: number;
  existingName: string;
  existingDateRange?: string;
}

export type SaveAutoReplyResult = AutoReply | AutoReplyConflict | null;

// Toggle 操作的結果類型
export interface ToggleAutoReplySuccess {
  success: true;
}

export type ToggleAutoReplyResult = ToggleAutoReplySuccess | AutoReplyConflict | null;

interface AutoRepliesContextType {
  autoReplies: AutoReply[];
  setAutoReplies: (replies: AutoReply[]) => void;
  addAutoReply: (reply: AutoReply) => void;
  updateAutoReply: (id: string, updates: Partial<AutoReply>) => void;
  deleteAutoReply: (id: string) => void;
  getAutoReplyById: (id: string) => AutoReply | undefined;
  toggleAutoReply: (id: string, nextState?: boolean, forceActivate?: boolean) => Promise<ToggleAutoReplyResult>;
  totalAutoReplies: number;
  activeAutoReplies: number;
  isLoading: boolean;
  error: string | null;
  fetchAutoReplies: () => Promise<void>;
  fetchAutoReplyById: (id: string) => Promise<AutoReply | undefined>;
  saveAutoReply: (payload: AutoReplyPayload, id?: string) => Promise<SaveAutoReplyResult>;
  removeAutoReply: (id: string) => Promise<void>;
  activateDuplicateKeyword: (keywordId: number) => Promise<void>;
}

const AutoRepliesContext = createContext<AutoRepliesContextType | undefined>(undefined);

interface AutoRepliesProviderProps {
  children: ReactNode;
}

function sortByCreatedAt(list: AutoReply[]) {
  return [...list].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function mapAutoResponse(item: BackendAutoReply & { content?: string; messages?: BackendReplyMessage[] }): AutoReply {
  const keywords = Array.isArray(item?.keywords)
    ? item.keywords
        .map((kw: BackendKeyword) => kw?.keyword ?? kw?.name ?? '')
        .filter((kw: string) => kw)
    : [];

  // 建立包含重複標記的關鍵字對象
  const keywordObjects: AutoReplyKeyword[] = Array.isArray(item?.keywords)
    ? item.keywords
        .filter((kw: BackendKeyword) => kw?.keyword || kw?.name)
        .map((kw: BackendKeyword) => ({
          id: kw?.id,
          keyword: kw?.keyword ?? kw?.name ?? '',
          isDuplicate: Boolean(kw?.is_duplicate),
        }))
    : [];

  const messages = Array.isArray(item?.messages) && item.messages.length > 0
    ? item.messages
        .sort((a: BackendReplyMessage, b: BackendReplyMessage) => (a?.sequence_order ?? 0) - (b?.sequence_order ?? 0))
        .map((msg: BackendReplyMessage) => msg?.content ?? '')
        .filter((msg: string) => msg)
    : (item?.content ? [item.content] : []);

  return {
    id: item?.id?.toString() ?? generateTempId(),
    name: item?.name ?? '未命名自動回應',
    triggerType: (item?.trigger_type ?? 'keyword') as AutoReplyTriggerType,
    keywords,
    keywordObjects,  // 新增：包含重複標記的關鍵字對象
    tags: keywords,
    messages: messages.length > 0 ? messages : [''],
    isActive: Boolean(item?.is_active),
    triggerCount: Number(item?.trigger_count ?? 0),
    successRate: Number(item?.success_rate ?? 0),
    createdAt: item?.created_at ?? '',
    updatedAt: item?.updated_at ?? null,
    triggerTimeStart: item?.trigger_time_start ?? null,
    triggerTimeEnd: item?.trigger_time_end ?? null,
    dateRangeStart: item?.date_range_start ?? null,
    dateRangeEnd: item?.date_range_end ?? null,
    channels: item?.channels || undefined,  // 新增：渠道列表映射
  };
}

function mapFbAutoResponse(item: FbAutoReply): AutoReply {
  const fbKeywords = item?.keywords ?? [];
  const keywords = fbKeywords.map(kw => kw.name).filter(Boolean);
  const keywordObjects: AutoReplyKeyword[] = fbKeywords.map(kw => ({
    id: kw.id,
    keyword: kw.name,
    isDuplicate: !kw.enabled,  // FB API 的 enabled=false 表示重複
  }));

  // FB API 的 reply_type: 2=keyword, 3=follow
  const triggerType: AutoReplyTriggerType = item.reply_type === 2 ? 'keyword' : 'follow';

  return {
    id: `fb-${item.id}`,  // 加上 fb- 前綴避免與 LINE 的 ID 衝突
    name: item.text || '未命名自動回應',
    triggerType,
    keywords,
    keywordObjects,
    tags: keywords,
    messages: item.text ? [item.text] : [''],
    isActive: item.enabled,
    triggerCount: item.count || 0,
    successRate: 0,
    createdAt: new Date(item.create_time * 1000).toISOString(),
    updatedAt: null,
    triggerTimeStart: null,
    triggerTimeEnd: null,
    dateRangeStart: null,
    dateRangeEnd: null,
    channels: ['Facebook'],
  };
}

function getAuthTokenOrThrow() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('尚未登入，請重新登入後再試一次');
  }
  return token;
}

export function AutoRepliesProvider({ children }: AutoRepliesProviderProps) {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const hasFetchedRef = useRef(false);

  const addAutoReply = useCallback((reply: AutoReply) => {
    setAutoReplies(prev => sortByCreatedAt([...prev, reply]));
  }, []);

  const updateAutoReply = useCallback((id: string, updates: Partial<AutoReply>) => {
    setAutoReplies(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const deleteAutoReply = useCallback((id: string) => {
    setAutoReplies(prev => prev.filter(r => r.id !== id));
  }, []);

  const getAutoReplyById = useCallback(
    (id: string) => autoReplies.find(r => r.id === id),
    [autoReplies]
  );

  const fetchAutoReplies = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAutoReplies([]);
      setError('尚未登入，請先登入以載入自動回應');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch LINE auto-responses (existing)
      const lineResponse = await fetch('/api/v1/auto_responses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!lineResponse.ok) {
        const errData = await lineResponse.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || '獲取自動回應失敗');
      }

      const lineResult = await lineResponse.json();
      const lineReplies = Array.isArray(lineResult?.data) ? lineResult.data.map(mapAutoResponse) : [];

      // 2. Fetch FB auto-responses (new)
      let fbReplies: AutoReply[] = [];
      const jwtToken = localStorage.getItem('jwt_token');
      if (jwtToken) {
        try {
          const fbResponse = await fetch(`/api/v1/auto_responses/fb?jwt_token=${encodeURIComponent(jwtToken)}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (fbResponse.ok) {
            const fbResult = await fbResponse.json();
            fbReplies = Array.isArray(fbResult?.data) ? fbResult.data.map(mapFbAutoResponse) : [];
          }
        } catch (fbErr) {
          console.warn('獲取 FB 自動回應失敗（非致命）:', fbErr);
          // FB 獲取失敗不阻斷整個流程
        }
      }

      // 3. Combine and sort
      const allReplies = [...lineReplies, ...fbReplies];
      setAutoReplies(sortByCreatedAt(allReplies));
    } catch (err) {
      console.error('獲取自動回應錯誤:', err);
      setError(err instanceof Error ? err.message : '獲取自動回應失敗');
      toast.error(err instanceof Error ? err.message : '獲取自動回應失敗');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAutoReplyById = useCallback(async (id: string) => {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api/v1/auto_responses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || '取得自動回應詳情失敗');
      }

      const result = await response.json();
      const mapped = mapAutoResponse(result.data);
      setAutoReplies(prev => {
        const filtered = prev.filter(r => r.id !== mapped.id);
        return sortByCreatedAt([...filtered, mapped]);
      });
      return mapped;
    } catch (err) {
      console.error('取得自動回應詳情錯誤:', err);
      toast.error(err instanceof Error ? err.message : '取得自動回應詳情失敗');
      throw err;
    }
  }, []);

  const saveAutoReply = useCallback(
    async (payload: AutoReplyPayload, id?: string): Promise<SaveAutoReplyResult> => {
      try {
        const token = getAuthTokenOrThrow();
        const jwtToken = localStorage.getItem('jwt_token');

        // 檢測是否為 FB 自動回應編輯
        if (id?.startsWith('fb-')) {
          const fbId = id.replace('fb-', '');
          const url = `/api/v1/auto_responses/fb/${fbId}?jwt_token=${encodeURIComponent(jwtToken || '')}`;

          const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              keywords: payload.keywords ?? [],
              messages: payload.messages,
              is_active: payload.isActive,
              trigger_type: payload.triggerType,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.detail || '更新 FB 自動回應失敗');
          }

          await fetchAutoReplies();
          toast.success('FB 自動回應已更新');
          return getAutoReplyById(id) || null;
        }

        // 原有的 LINE 自動回應邏輯 (POST/PUT)
        let url = id ? `/api/v1/auto_responses/${id}` : '/api/v1/auto_responses';
        if (payload.channels?.includes('Facebook')) {
          if (jwtToken) {
            url += `?jwt_token=${encodeURIComponent(jwtToken)}`;
          }
        }

        const response = await fetch(url, {
          method: id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: payload.name,
            trigger_type: payload.triggerType,
            keywords: payload.keywords ?? [],
            is_active: payload.isActive,
            messages: payload.messages,
            trigger_time_start: payload.triggerTimeStart ?? null,
            trigger_time_end: payload.triggerTimeEnd ?? null,
            date_range_start: payload.dateRangeStart ?? null,
            date_range_end: payload.dateRangeEnd ?? null,
            channels: payload.channels ?? undefined,
            channel_id: payload.channelId ?? null,
            force_activate: payload.forceActivate ?? false,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.detail || errData?.message || '儲存自動回應失敗');
        }

        const result = await response.json();

        // 檢查是否有衝突
        if (result?.data?.conflict) {
          const conflictData: AutoReplyConflict = {
            conflict: true,
            conflictType: result.data.conflict_type,
            existingId: result.data.existing_id,
            existingName: result.data.existing_name,
            existingDateRange: result.data.existing_date_range,
          };
          return conflictData;
        }

        const targetId = id ?? result?.data?.id?.toString();
        const fresh = targetId ? await fetchAutoReplyById(targetId) : null;
        toast.success(id ? '自動回應已更新' : '自動回應已建立');
        return fresh;
      } catch (err) {
        console.error('儲存自動回應錯誤:', err);
        toast.error(err instanceof Error ? err.message : '儲存自動回應失敗');
        throw err;
      }
    },
    [fetchAutoReplyById, fetchAutoReplies, getAutoReplyById]
  );

  const removeAutoReply = useCallback(async (id: string) => {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api/v1/auto_responses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || '刪除自動回應失敗');
      }

      setAutoReplies(prev => prev.filter(reply => reply.id !== id));
      toast.success('自動回應已刪除');
    } catch (err) {
      console.error('刪除自動回應錯誤:', err);
      toast.error(err instanceof Error ? err.message : '刪除自動回應失敗');
      throw err;
    }
  }, []);

  const toggleAutoReply = useCallback(
    async (id: string, nextState?: boolean, forceActivate = false): Promise<ToggleAutoReplyResult> => {
      const existing = autoReplies.find(reply => reply.id === id);
      const targetState = typeof nextState === 'boolean' ? nextState : !existing?.isActive;

      try {
        const token = getAuthTokenOrThrow();

        // 構建 URL，若渠道包含 Facebook 則加上 jwt_token
        let url = `/api/v1/auto_responses/${id}/toggle?is_active=${targetState}&force_activate=${forceActivate}`;
        if (existing?.channels?.includes('Facebook')) {
          const jwtToken = localStorage.getItem('jwt_token');
          if (jwtToken) {
            url += `&jwt_token=${encodeURIComponent(jwtToken)}`;
          }
        }

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.detail || errData?.message || '更新狀態失敗');
        }

        const result = await response.json();

        // 檢查是否有衝突
        if (result?.data?.conflict) {
          const conflictData: AutoReplyConflict = {
            conflict: true,
            conflictType: result.data.conflict_type,
            existingId: result.data.existing_id,
            existingName: result.data.existing_name,
            existingDateRange: result.data.existing_date_range,
          };
          return conflictData;
        }

        setAutoReplies(prev =>
          prev.map(reply =>
            reply.id === id ? { ...reply, isActive: targetState } : reply
          )
        );

        return { success: true };
      } catch (err) {
        console.error('切換自動回應狀態錯誤:', err);
        toast.error(err instanceof Error ? err.message : '更新狀態失敗');
        throw err;
      }
    },
    [autoReplies]
  );

  const activateDuplicateKeyword = useCallback(async (keywordId: number) => {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api/v1/auto_responses/keywords/${keywordId}/activate`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || '操作失敗，請稍後再試');
      }

      // 刷新列表以獲取最新狀態
      await fetchAutoReplies();
      toast.success('標籤已更新');
    } catch (err) {
      console.error('激活重複關鍵字錯誤:', err);
      toast.error(err instanceof Error ? err.message : '操作失敗，請稍後再試');
      throw err;
    }
  }, [fetchAutoReplies]);

  const totalAutoReplies = useMemo(() => autoReplies.length, [autoReplies]);
  const activeAutoReplies = useMemo(
    () => autoReplies.filter(reply => reply.isActive).length,
    [autoReplies]
  );

  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchAutoReplies();
    }
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
      setAutoReplies([]);
      setError(null);
    }
  }, [isAuthenticated, fetchAutoReplies]);

  const value = useMemo<AutoRepliesContextType>(() => ({
    autoReplies,
    setAutoReplies,
    addAutoReply,
    updateAutoReply,
    deleteAutoReply,
    getAutoReplyById,
    toggleAutoReply,
    totalAutoReplies,
    activeAutoReplies,
    isLoading,
    error,
    fetchAutoReplies,
    fetchAutoReplyById,
    saveAutoReply,
    removeAutoReply,
    activateDuplicateKeyword,
  }), [
    autoReplies,
    addAutoReply,
    updateAutoReply,
    deleteAutoReply,
    getAutoReplyById,
    toggleAutoReply,
    totalAutoReplies,
    activeAutoReplies,
    isLoading,
    error,
    fetchAutoReplies,
    fetchAutoReplyById,
    saveAutoReply,
    removeAutoReply,
    activateDuplicateKeyword,
  ]);

  return (
    <AutoRepliesContext.Provider value={value}>
      {children}
    </AutoRepliesContext.Provider>
  );
}

export function useAutoReplies() {
  const context = useContext(AutoRepliesContext);
  if (context === undefined) {
    throw new Error('useAutoReplies must be used within an AutoRepliesProvider');
  }
  return context;
}
