import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { BackendAutoReply, BackendKeyword, BackendReplyMessage, FbAutoReply } from '../types/api';
import { useAuth } from '../components/auth/AuthContext';
import type { AutoReplyChannel } from '../types/channel';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../utils/apiClient';
import { getAuthToken, getJwtToken } from '../utils/token';

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

// 訊息對象，包含 FB API 的 id（用於區分編輯 vs 新增）
export interface AutoReplyMessage {
  id?: number;  // FB API 的 text id（有 id = 編輯，無 id = 新增）
  basicId?: number;  // FB API 的父自動回應 ID
  content: string;
  count?: number;  // FB API 的觸發計數
  enabled?: boolean;
}

export interface AutoReply {
  id: string;
  name: string;
  channelName?: string | null; // 頻道名稱（LINE 頻道名 / FB 粉專名）
  channelId?: string | null; // 渠道 ID（LINE channel_id 或 FB page_id）
  triggerType: AutoReplyTriggerType;
  keywords: string[];
  keywordObjects: AutoReplyKeyword[]; // 包含重複標記的關鍵字對象
  tags: string[];
  messages: string[];
  messageObjects: AutoReplyMessage[]; // 包含 FB id 的訊息對象（用於編輯時保留 id）
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

// FB API 專用的關鍵字/訊息對象（帶 id 為編輯，無 id 為新增）
export interface FbKeywordPayload {
  id?: number;
  name: string;
}

export interface FbMessagePayload {
  id?: number;
  basic_id?: number;  // FB API 的父自動回應 ID
  text: string;
  count?: number;  // FB API 的觸發計數
  enabled?: boolean;
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
  // FB 專用：帶 id 的對象陣列（用於編輯時區分編輯 vs 新增）
  fbKeywords?: FbKeywordPayload[];
  fbMessages?: FbMessagePayload[];
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

  // 排序後的訊息陣列
  const sortedMessages = Array.isArray(item?.messages) && item.messages.length > 0
    ? [...item.messages].sort((a: BackendReplyMessage, b: BackendReplyMessage) => (a?.sequence_order ?? 0) - (b?.sequence_order ?? 0))
    : [];

  const messages = sortedMessages.length > 0
    ? sortedMessages.map((msg: BackendReplyMessage) => msg?.content ?? '').filter((msg: string) => msg)
    : (item?.content ? [item.content] : []);

  // 建立包含 FB id、basic_id、count 的訊息對象（用於編輯時保留完整資訊）
  const messageObjects: AutoReplyMessage[] = sortedMessages.length > 0
    ? sortedMessages
        .filter((msg: BackendReplyMessage) => msg?.content)
        .map((msg: BackendReplyMessage) => ({
          id: msg?.id,  // FB API 的 text id
          basicId: msg?.basic_id,  // FB API 的父自動回應 ID
          content: msg?.content ?? '',
          count: msg?.count ?? 0,  // FB API 的觸發計數
          enabled: true,
        }))
    : (item?.content ? [{ content: item.content, enabled: true }] : []);

  return {
    id: item?.id?.toString() ?? generateTempId(),
    name: item?.name ?? '未命名自動回應',
    channelName: (item as any)?.channel_name ?? null,  // 頻道名稱
    channelId: (item as any)?.channel_id ?? null,  // 渠道 ID
    triggerType: (item?.trigger_type ?? 'keyword') as AutoReplyTriggerType,
    keywords,
    keywordObjects,  // 包含重複標記的關鍵字對象
    tags: keywords,
    messages: messages.length > 0 ? messages : [''],
    messageObjects: messageObjects.length > 0 ? messageObjects : [{ content: '', enabled: true }],
    isActive: Boolean(item?.is_active),
    triggerCount: Number(item?.trigger_count ?? 0),
    successRate: Number(item?.success_rate ?? 0),
    createdAt: item?.created_at ?? '',
    updatedAt: item?.updated_at ?? null,
    triggerTimeStart: item?.trigger_time_start ?? null,
    triggerTimeEnd: item?.trigger_time_end ?? null,
    dateRangeStart: item?.date_range_start ?? null,
    dateRangeEnd: item?.date_range_end ?? null,
    channels: item?.channels || undefined,  // 渠道列表映射
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

  // FB API 的 response_type: 2=keyword, 3=follow
  const triggerType: AutoReplyTriggerType = item.response_type === 2 ? 'keyword' : 'follow';

  // 正確提取訊息（text 是陣列）
  const enabledTexts = Array.isArray(item?.text)
    ? item.text.filter(t => t?.enabled !== false)
    : [];

  const messages = enabledTexts.map(t => t?.text ?? '').filter(Boolean);

  // 建立包含 FB id、basic_id、count 的訊息對象（用於編輯時保留完整資訊）
  const messageObjects: AutoReplyMessage[] = enabledTexts
    .filter(t => t?.text)
    .map(t => ({
      id: t?.id,  // FB API 的 text id
      basicId: t?.basic_id,  // FB API 的父自動回應 ID
      content: t?.text ?? '',
      count: t?.count ?? 0,  // FB API 的觸發計數
      enabled: true,
    }));

  return {
    id: `fb-${item.id}`,  // 加上 fb- 前綴避免與 LINE 的 ID 衝突
    name: item.channel_name || `FB 自動回應 #${item.id}`,  // 使用粉專名稱
    triggerType,
    keywords,
    keywordObjects,
    tags: keywords,
    messages: messages.length > 0 ? messages : [''],
    messageObjects: messageObjects.length > 0 ? messageObjects : [{ content: '', enabled: true }],
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

const getAuthTokenOrThrow = () => {
  const token = getAuthToken();
  if (!token) throw new Error('尚未登入，請重新登入後再試一次');
  return token;
};

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
    const token = getAuthToken();
    if (!token) {
      setAutoReplies([]);
      setError('尚未登入，請先登入以載入自動回應');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // ✅ 新架構：一次 API 調用，後端已合併 LINE DB + FB API 數據
      const jwtToken = getJwtToken();
      const url = jwtToken
        ? `/api/v1/auto_responses?jwt_token=${encodeURIComponent(jwtToken)}`
        : '/api/v1/auto_responses';

      const response = await apiGet(url);

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || '獲取自動回應失敗');
      }

      const result = await response.json();
      const allReplies = Array.isArray(result?.data)
        ? result.data.map(mapAutoResponse)
        : [];

      setAutoReplies(sortByCreatedAt(allReplies));

      console.log('[AutoReplies] ✅ 獲取成功:', {
        total: allReplies.length,
        line: allReplies.filter(r => r.channels?.includes('LINE')).length,
        fb: allReplies.filter(r => r.channels?.includes('Facebook')).length,
      });
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
      getAuthTokenOrThrow();
      const response = await apiGet(`/api/v1/auto_responses/${id}`);

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || '取得自動回應詳情失敗');
      }

      const result = await response.json();
      const mapped = mapAutoResponse(result.data);

      setAutoReplies(prev =>
        sortByCreatedAt([...prev.filter(r => r.id !== mapped.id), mapped])
      );

      return mapped;
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得自動回應詳情失敗';
      console.error('取得自動回應詳情錯誤:', err);
      toast.error(message);
      throw err;
    }
  }, []);

  const saveAutoReply = useCallback(
    async (payload: AutoReplyPayload, id?: string): Promise<SaveAutoReplyResult> => {
      try {
        getAuthTokenOrThrow(); // 僅檢查登入狀態
        const jwtToken = getJwtToken();

        // 檢測是否為 FB 自動回應編輯（使用 apiPatch 自動處理 token 和 401 重試）
        if (id?.startsWith('fb-')) {
          const fbId = id.replace('fb-', '');
          const url = `/api/v1/auto_responses/fb/${fbId}?jwt_token=${encodeURIComponent(jwtToken || '')}`;

          // FB API 需要帶 id 的對象來區分編輯 vs 新增
          // 優先使用 fbKeywords/fbMessages（帶 id），否則轉換純字串陣列
          const keywordsPayload = payload.fbKeywords
            ? payload.fbKeywords
            : (payload.keywords ?? []).map(kw => ({ name: kw }));

          const messagesPayload = payload.fbMessages
            ? payload.fbMessages
            : payload.messages.map(msg => ({ text: msg, enabled: true }));

          const response = await apiPatch(url, {
            keywords: keywordsPayload,
            messages: messagesPayload,
            is_active: payload.isActive,
            trigger_type: payload.triggerType,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.detail || '更新 FB 自動回應失敗');
          }

          await fetchAutoReplies();
          toast.success('FB 自動回應已更新');
          return getAutoReplyById(id) || null;
        }

        // ✅ 新架構：統一走後端 API（後端會判斷純 FB 不保存本地 DB）
        // 移除了原先前端直接調用外部 FB API 的邏輯，統一由後端處理
        const baseUrl = id ? `/api/v1/auto_responses/${id}` : '/api/v1/auto_responses';
        const url = payload.channels?.includes('Facebook') && jwtToken
          ? `${baseUrl}?jwt_token=${encodeURIComponent(jwtToken)}`
          : baseUrl;

        const requestBody = {
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
        };

        const response = id
          ? await apiPut(url, requestBody)
          : await apiPost(url, requestBody);

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
      getAuthTokenOrThrow();
      const response = await apiDelete(`/api/v1/auto_responses/${id}`);

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || '刪除自動回應失敗');
      }

      setAutoReplies(prev => prev.filter(reply => reply.id !== id));
      toast.success('自動回應已刪除');
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除自動回應失敗';
      console.error('刪除自動回應錯誤:', err);
      toast.error(message);
      throw err;
    }
  }, []);

  const toggleAutoReply = useCallback(
    async (id: string, nextState?: boolean, forceActivate = false): Promise<ToggleAutoReplyResult> => {
      const existing = autoReplies.find(reply => reply.id === id);
      const targetState = typeof nextState === 'boolean' ? nextState : !existing?.isActive;

      try {
        getAuthTokenOrThrow(); // 僅檢查登入狀態

        // 構建 URL，若渠道包含 Facebook 則加上 jwt_token
        let url = `/api/v1/auto_responses/${id}/toggle?is_active=${targetState}&force_activate=${forceActivate}`;
        if (existing?.channels?.includes('Facebook')) {
          const jwtToken = getJwtToken();
          if (jwtToken) {
            url += `&jwt_token=${encodeURIComponent(jwtToken)}`;
          }
        }

        // 使用 apiPatch 自動處理 token 和 401 重試（無 body 傳 undefined）
        const response = await apiPatch(url, undefined);

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
      getAuthTokenOrThrow();
      const response = await apiPatch(`/api/v1/auto_responses/keywords/${keywordId}/activate`, undefined);

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || '操作失敗，請稍後再試');
      }

      await fetchAutoReplies();
      toast.success('標籤已更新');
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失敗，請稍後再試';
      console.error('激活重複關鍵字錯誤:', err);
      toast.error(message);
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
