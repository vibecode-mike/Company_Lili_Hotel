/**
 * 聊天室布局容器
 * - 左側：會員資料卡（完全可編輯的表單 + 標籤 + 備註）
 * - 右側：聊天區域（藍色背景 + 對話氣泡 + 輸入框）
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ChatRoomLayoutProps, ChatMessage, ChatPlatform } from './types';
import type { Member } from '../../types/member';
import { useWebSocket } from '../../hooks/useWebSocket';
import MemberAvatar from './MemberAvatar';
import MemberInfoPanelComplete from './MemberInfoPanelComplete';
import MemberTagEditModal from '../MemberTagEditModal';
import ButtonEditAvatar from '../../imports/ButtonEdit-8025-230';
import svgPathsInfo from '../../imports/svg-k0rlkn3s4y';
import svgPaths from '../../imports/svg-bzzivawqvx';
import { useToast } from '../ToastProvider';
import { useAuth } from '../auth/AuthContext';
import MemberNoteEditor from '../shared/MemberNoteEditor';
import { useMembers } from '../../contexts/MembersContext';
import Container from '../../imports/Container-8548-103';
// 新組件導入 (Figma v1087)
import { ChatBubble } from './ChatBubble';
import { ResponseModeIndicator } from './ResponseModeIndicator';
import { PlatformSwitcher } from './PlatformSwitcher';

// Chat messages constants
const PAGE_SIZE = 6;  // 每次載入 6 條訊息（3 對問答）

// 格式化日期為中文格式（2025/11/27（四））
const formatDateWithWeekday = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = weekdays[date.getDay()];
  return `${year}/${month}/${day}（${weekday}）`;
};

// Removed mock messages - will load from API
const mockMessages_REMOVED: ChatMessage[] = [
  { id: 1, type: 'user', text: '文字訊息', time: '下午 03:30', isRead: false },
  { id: 2, type: 'official', text: '官方文字訊息', time: '下午 03:40', isRead: true },
  { id: 3, type: 'user', text: '文字訊息', time: '下午 04:30', isRead: false },
  { id: 4, type: 'official', text: '官方文字訊息', time: '下午 04:50', isRead: true },
  { id: 5, type: 'user', text: '文字訊息', time: '下午 05:30', isRead: false },
  { id: 6, type: 'official', text: '官方文字訊息', time: '下午 05:40', isRead: true },
];

const extractMessageTimestamp = (message: ChatMessage): string | undefined => {
  return (
    message.timestamp ||
    (message as any)?.created_at ||
    (message as any)?.createdAt ||
    (message as any)?.sent_at ||
    (message as any)?.sentAt ||
    (message as any)?.created_at_iso ||
    (message as any)?.createdAtIso ||
    undefined
  ) ?? undefined;
};

const findLatestMessageTimestamp = (messages: ChatMessage[]): string | undefined => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const ts = extractMessageTimestamp(messages[i]);
    if (ts) {
      return ts;
    }
  }
  return undefined;
};

// 內嵌組件已移至獨立檔案:
// - UserAvatar, OfficialAvatar, MessageBubble → ChatBubble.tsx

export default function ChatRoomLayout({ member: initialMember, memberId, chatSessionApiBase = '/api/v1', onPlatformChange }: ChatRoomLayoutProps) {
  const { fetchMemberById } = useMembers();
  const [member, setMember] = useState<Member | undefined>(initialMember);
  const [isLoadingMember, setIsLoadingMember] = useState(false);

  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [messageInput, setMessageInput] = useState('');
  const [isComposing, setIsComposing] = useState(false); // IME composition state
  const [isSending, setIsSending] = useState(false); // Sending message state
  const [visibleDate, setVisibleDate] = useState<string>(''); // 當前可見訊息的日期
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [memberTags, setMemberTags] = useState<string[]>(member?.memberTags || []); // ✅ 使用真實會員標籤
  const [interactionTags, setInteractionTags] = useState<string[]>(member?.interactionTags || []); // ✅ 使用真實互動標籤

  // 平台切換狀態 (Figma v1087)
  const [currentPlatform, setCurrentPlatform] = useState<ChatPlatform>('LINE');
  const [threadsMap, setThreadsMap] = useState<Record<string, string>>({});

  // 載入 chat-session：平台與 thread 映射
  const loadChatSession = useCallback(async () => {
    const targetId = member?.id?.toString() || memberId;
    if (!targetId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch(`${chatSessionApiBase}/members/${targetId}/chat-session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await resp.json();
      if (result.code === 200 && result.data) {
        const { available_platforms, default_platform, threads } = result.data;
        const platforms = (Array.isArray(result.data)
          ? result.data
          : Object.keys(threads || {})) as ChatPlatform[];
        const finalPlatforms = (platforms.length ? platforms : ['LINE']) as ChatPlatform[];
        setThreadsMap(threads || {});
        const nextPlatform = (default_platform as ChatPlatform) || finalPlatforms[0] || 'LINE';
        setCurrentPlatform(nextPlatform);
        onPlatformChange?.(nextPlatform);
      }
    } catch (e) {
      console.error('載入 chat-session 失敗', e);
    }
  }, [member?.id, memberId, onPlatformChange, chatSessionApiBase]);

  // GPT 計時器狀態
  const [isGptManualMode, setIsGptManualMode] = useState(false);
  const gptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const MANUAL_MODE_DURATION = 10 * 60 * 1000; // 10 分鐘
  const [note, setNote] = useState(member?.internal_note || '');

  // Avatar interaction states
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isAvatarPressed, setIsAvatarPressed] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { logout } = useAuth();

  // GPT 計時器函式：恢復自動模式（必須在 useEffect 之前定義）
  const restoreGptMode = useCallback(async () => {
    if (!member?.id) return;

    console.log('🔄 [GPT Timer] 恢復自動模式, member_id:', member.id);

    try {
      // 呼叫 API 設置 gpt_enabled = true
      const token = localStorage.getItem('auth_token');
      console.log('📡 [GPT Timer] 發送 API 請求 (恢復):', {
        url: `/api/v1/members/${member.id}`,
        method: 'PUT',
        body: { gpt_enabled: true },
        hasToken: !!token
      });

      const response = await fetch(`/api/v1/members/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gpt_enabled: true })
      });

      console.log('📥 [GPT Timer] API 回應狀態 (恢復):', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [GPT Timer] API 錯誤 (恢復):', errorData);
        throw new Error(`API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [GPT Timer] API 成功 (恢復):', data);

      // 清除 localStorage 狀態
      localStorage.removeItem(`gpt_timer_${member.id}`);

      // 更新 UI 狀態
      setIsGptManualMode(false);

      // 清除計時器
      if (gptTimerRef.current) {
        clearTimeout(gptTimerRef.current);
        gptTimerRef.current = null;
      }

      console.log('✅ [GPT Timer] GPT 自動模式已恢復');

    } catch (error) {
      console.error('❌ [GPT Timer] 恢復 GPT 自動模式失敗:', error);
    }
  }, [member?.id]);

  // GPT 計時器函式：啟動手動模式
  const startGptTimer = useCallback(async () => {
    if (!member?.id) return;

    console.log('🔄 [GPT Timer] 啟動手動模式, member_id:', member.id);

    // 清除現有計時器
    if (gptTimerRef.current) {
      clearTimeout(gptTimerRef.current);
    }

    try {
      // 呼叫 API 設置 gpt_enabled = false
      const token = localStorage.getItem('auth_token');
      console.log('📡 [GPT Timer] 發送 API 請求:', {
        url: `/api/v1/members/${member.id}`,
        method: 'PUT',
        body: { gpt_enabled: false },
        hasToken: !!token
      });

      const response = await fetch(`/api/v1/members/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gpt_enabled: false })
      });

      console.log('📥 [GPT Timer] API 回應狀態:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [GPT Timer] API 錯誤:', errorData);
        throw new Error(`API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [GPT Timer] API 成功:', data);

      // 儲存狀態到 localStorage（用於多分頁同步）
      localStorage.setItem(`gpt_timer_${member.id}`, JSON.stringify({
        memberId: member.id,
        isManualMode: true,
        startTime: Date.now()
      }));

      // 更新 UI 狀態
      setIsGptManualMode(true);

      // 啟動 10 分鐘計時器
      gptTimerRef.current = setTimeout(() => {
        restoreGptMode();
      }, MANUAL_MODE_DURATION);

      console.log('⏱️  [GPT Timer] 計時器已啟動, 將在', MANUAL_MODE_DURATION / 1000, '秒後恢復');

    } catch (error) {
      console.error('❌ [GPT Timer] 啟動 GPT 手動模式失敗:', error);
      showToast?.('操作失敗,請重試', 'error');
    }
  }, [member?.id, MANUAL_MODE_DURATION, restoreGptMode, showToast]);

  const memberLastInteractionRaw = member ? (member as any).last_interaction_at : null;

  const latestChatTimestamp = useMemo(() => {
    const messageTimestamp = findLatestMessageTimestamp(messages);
    if (messageTimestamp) return messageTimestamp;
    return member?.lastChatTime || memberLastInteractionRaw || null;
  }, [messages, member?.lastChatTime, memberLastInteractionRaw]);

  const displayMember = useMemo(() => {
    if (!member) return undefined;
    const overrides: Partial<Member> = {};
    if (currentPlatform === 'LINE') {
      overrides.avatar = member.lineAvatar || member.line_avatar;
      overrides.username = member.line_display_name || member.username;
    } else if (currentPlatform === 'Facebook') {
      overrides.avatar = (member as any).fb_avatar;
      overrides.username = (member as any).fb_customer_name || member.username;
    } else if (currentPlatform === 'Webchat') {
      overrides.avatar = (member as any).webchat_avatar;
      overrides.username = (member as any).webchat_name || member.username;
    }
    return { ...member, ...overrides };
  }, [member, currentPlatform]);

  const panelMember = useMemo(() => {
    if (!displayMember) return undefined;
    if (!latestChatTimestamp || latestChatTimestamp === displayMember.lastChatTime) {
      return displayMember;
    }
    return { ...displayMember, lastChatTime: latestChatTimestamp };
  }, [displayMember, latestChatTimestamp]);

  // Fetch full member details when component mounts
  useEffect(() => {
    const targetId = initialMember?.id || memberId;
    if (!targetId) return;

    const loadMemberDetail = async () => {
      setIsLoadingMember(true);
      const fullMember = await fetchMemberById(targetId);
      if (fullMember) {
        setMember(fullMember);
      }
      setIsLoadingMember(false);
    };

    loadMemberDetail();
  }, [initialMember?.id, memberId, fetchMemberById]);

  // 初始載入 chat session (platforms, threads)
  useEffect(() => {
    loadChatSession();
  }, [loadChatSession]);

  useEffect(() => {
    if (onPlatformChange) {
      onPlatformChange(currentPlatform);
    }
  }, [currentPlatform, onPlatformChange]);

  // Sync member data for related UI pieces when member changes
  useEffect(() => {
    if (member) {
      setNote(member.internal_note || '');
      setMemberTags(member.memberTags || []);
      setInteractionTags(member.interactionTags || []);
    }
  }, [member]);

  // 先計算 threadId，再用於 WS 與推播過濾
  const currentThreadId = threadsMap[currentPlatform];

  // WebSocket 監聽新訊息（thread 維度）
  const handleNewMessage = useCallback((wsMessage: any) => {
    if (wsMessage.type === 'new_message' && wsMessage.data) {
      const incomingThread = wsMessage.data.thread_id || wsMessage.data.threadId;
      if (currentThreadId && incomingThread && incomingThread !== currentThreadId) {
        // 忽略非當前 thread 的推播
        return;
      }

      // 將新訊息添加到列表末尾（messages 維持「舊 → 新」排序）
      setMessages(prev => {
        // 避免重複添加 (檢查 message_id)
        const exists = prev.some(msg => msg.id === wsMessage.data.id);
        if (exists) {
          return prev;
        }
        return [...prev, wsMessage.data];
      });

      // 同步更新會員的最後聊天時間
      if (member) {
        setMember({
          ...member,
          lastChatTime: wsMessage.data.timestamp || new Date().toISOString()
        });
      }

      // 收到新訊息時不自動滾動，保持當前位置
    }
  }, [member, currentThreadId]);

  // Load chat messages from API
  // 支援兩種情況：1) member?.id 存在  2) 只有 memberId
  const loadChatMessages = useCallback(
    async (
      pageNum: number = 1,
      append: boolean = false,
      options?: { silent?: boolean },
    ) => {
      const targetId = member?.id?.toString() || memberId;
      if (!targetId) return;

      const silent = options?.silent ?? false;
      if (!silent) {
        setIsLoading(true);
      }
      try {
        const token = localStorage.getItem('auth_token');

        // 建立 URL 參數
        let url = `/api/v1/members/${targetId}/chat-messages?page=${pageNum}&page_size=${PAGE_SIZE}&platform=${currentPlatform}`;

        // FB 渠道需要傳送 jwt_token
        if (currentPlatform === 'Facebook') {
          const jwtToken = localStorage.getItem('jwt_token');
          if (jwtToken) {
            url += `&jwt_token=${encodeURIComponent(jwtToken)}`;
          }
        }

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.code === 200 && result.data) {
          const { messages: newMessages, has_more } = result.data;

          if (append) {
            // append=true 表示載入更早訊息（往上翻頁），需「前插」以維持舊→新排序
            // 去重：過濾掉已存在的訊息
            setMessages(prev => {
              const existingIds = new Set(prev.map(msg => msg.id));
              const uniqueNewMessages = newMessages.filter((msg: ChatMessage) => !existingIds.has(msg.id));
              return [...uniqueNewMessages, ...prev];
            });
          } else {
            // API 已回傳舊→新排序，不需要反轉
            setMessages(newMessages);
          }

          setHasMore(has_more);
          setPage(pageNum);
        } else {
          console.error('API 回應格式錯誤:', result);
        }
      } catch (error) {
        console.error('載入聊天訊息失敗:', error);
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [member?.id, memberId, currentPlatform]
  );

  // 建立 WebSocket 連線（依當前平台 thread_id）
  const { isConnected: isRealtimeConnected } = useWebSocket(currentThreadId, handleNewMessage);

  // 平台切換時重置訊息狀態並重新載入
  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setVisibleDate('');
    loadChatMessages(1, false);
  }, [currentPlatform, loadChatMessages]);

  // 初始載入訊息後設定 visibleDate（顯示最新訊息的日期）
  useEffect(() => {
    const container = chatContainerRef.current;
    const isNearBottom =
      !container || container.scrollHeight - container.scrollTop - container.clientHeight < 24;

    if (messages.length > 0) {
      // 停在底部時，visibleDate 應隨最新訊息更新；不在底部則交給 scroll handler 決定顯示哪一天
      if (!visibleDate || isNearBottom) {
        const lastMessage = messages[messages.length - 1];
        const timestampFromMessage = extractMessageTimestamp(lastMessage);
        if (timestampFromMessage) {
          const next = formatDateWithWeekday(timestampFromMessage);
          if (next && next !== visibleDate) {
            setVisibleDate(next);
          }
          return;
        }
      }
    }

    if (!visibleDate && latestChatTimestamp) {
      const next = formatDateWithWeekday(latestChatTimestamp);
      if (next && next !== visibleDate) {
        setVisibleDate(next);
      }
    }
  }, [messages, latestChatTimestamp, visibleDate]);

  // Handle scroll for infinite scrolling and visible date update
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;

    // 更新當前可見訊息的日期（找最後一個可見訊息）
    const messageElements = container.querySelectorAll('[data-timestamp]');
    const containerRect = container.getBoundingClientRect();
    const dateHeaderHeight = 60; // 日期標籤高度 + padding

    let lastVisibleTimestamp: string | null = null;

    for (const el of messageElements) {
      const rect = el.getBoundingClientRect();
      // 訊息在可見區域內（底部高於頂部 + header，頂部低於底部）
      if (rect.bottom > containerRect.top + dateHeaderHeight && rect.top < containerRect.bottom) {
        const timestamp = el.getAttribute('data-timestamp');
        if (timestamp) {
          lastVisibleTimestamp = timestamp;
        }
      }
    }

    if (lastVisibleTimestamp) {
      const newDate = formatDateWithWeekday(lastVisibleTimestamp);
      if (newDate && newDate !== visibleDate) {
        setVisibleDate(newDate);
      }
    }

    // 接近頂部（< 50px）+ 還有更多訊息 + 不在載入中
    if (container.scrollTop < 50 && hasMore && !isLoading) {
      const prevScrollHeight = container.scrollHeight;

      const loadMore = async () => {
        await loadChatMessages(page + 1, true);
        // 保持滾動位置（避免跳動）
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      };

      loadMore();
    }
  }, [hasMore, isLoading, page, loadChatMessages, visibleDate]);

  // Load initial messages when member changes or memberId is available
  useEffect(() => {
    const targetId = member?.id?.toString() || memberId;
    if (targetId) {
      loadChatMessages(1, false);
    }
  }, [member?.id, memberId, loadChatMessages, currentPlatform]);

  // Fallback polling when WebSocket 無法建立，仍定期刷新訊息
  useEffect(() => {
    const targetId = member?.id?.toString() || memberId;
    if (!targetId || isRealtimeConnected) {
      return;
    }

    const interval = setInterval(() => {
      loadChatMessages(1, false, { silent: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealtimeConnected, member?.id, memberId, loadChatMessages]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && chatContainerRef.current && page === 1) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages, page]);

  // 當內容不夠滾動但還有更多訊息時，自動載入更多
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !hasMore || isLoading) return;

    // 檢查是否可以滾動（內容高度 > 容器高度）
    const canScroll = container.scrollHeight > container.clientHeight;

    if (!canScroll && messages.length > 0) {
      loadChatMessages(page + 1, true);
    }
  }, [messages, hasMore, isLoading, page, loadChatMessages]);

  // Note: 不要在 messages 每次變動就強制滾到底部，否則會破壞「向上載入更早訊息」的滾動位置保持。

  // GPT 計時器 useEffect：多分頁同步
  useEffect(() => {
    if (!member?.id) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `gpt_timer_${member.id}`) {
        if (event.newValue) {
          // 其他分頁啟動了計時器
          setIsGptManualMode(true);
        } else {
          // 其他分頁清除了計時器
          setIsGptManualMode(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [member?.id]);

  // GPT 計時器 useEffect：頁面重新整理時清除手動模式狀態
  useEffect(() => {
    if (!member?.id) return;

    // 頁面載入時，檢查是否有殘留的計時器狀態
    const timerKey = `gpt_timer_${member.id}`;
    const storedTimer = localStorage.getItem(timerKey);

    if (storedTimer) {
      console.log('🔄 [GPT Timer] 偵測到頁面重新整理，清除手動模式狀態');
      // 清除 localStorage 中的計時器資料
      localStorage.removeItem(timerKey);
      // 確保狀態為自動模式（已經是 false，但明確設置）
      setIsGptManualMode(false);
      // 清除任何可能殘留的計時器
      if (gptTimerRef.current) {
        clearTimeout(gptTimerRef.current);
        gptTimerRef.current = null;
      }
    }
  }, [member?.id]);

  // GPT 計時器 useEffect：頁面載入時從資料庫同步 GPT 模式狀態
  useEffect(() => {
    if (!member?.id) return;

    // 從資料庫載入的 gpt_enabled 值來設定初始狀態
    if (member.gpt_enabled !== undefined) {
      // gpt_enabled = true → 自動模式 → isGptManualMode = false
      // gpt_enabled = false → 手動模式 → isGptManualMode = true
      const shouldBeManualMode = !member.gpt_enabled;

      if (shouldBeManualMode !== isGptManualMode) {
        console.log(`🔄 [GPT Timer] 頁面載入：從資料庫同步 GPT 模式 (gpt_enabled=${member.gpt_enabled})`);
        setIsGptManualMode(shouldBeManualMode);

        // 如果是手動模式，需要啟動計時器
        if (shouldBeManualMode) {
          startGptTimer();
        }
      }
    }
  }, [member?.id, member?.gpt_enabled]);

  // GPT 計時器 useEffect：會員切換時清理
  useEffect(() => {
    // 當會員變更時，恢復上一個會員的 GPT 模式
    return () => {
      if (member?.id && isGptManualMode) {
        restoreGptMode();
      }
    };
  }, [member?.id, isGptManualMode, restoreGptMode]);

  // GPT 計時器 useEffect：組件卸載時清理
  useEffect(() => {
    return () => {
      // 組件卸載時清除計時器
      if (gptTimerRef.current) {
        clearTimeout(gptTimerRef.current);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    const trimmedText = messageInput.trim();
    if (!trimmedText || !member?.id || isSending) return;
    const platform = currentPlatform || 'LINE';

    setIsSending(true);

    try {
      const token = localStorage.getItem('auth_token');

      // 建立請求 body
      const requestBody: { text: string; platform: string; jwt_token?: string } = {
        text: trimmedText,
        platform
      };

      // 對於 Facebook 渠道，從 localStorage 取得 jwt_token
      if (platform === 'Facebook') {
        const jwtToken = localStorage.getItem('jwt_token');
        if (!jwtToken) {
          alert('請先完成 Facebook 授權');
          setIsSending(false);
          return;
        }
        requestBody.jwt_token = jwtToken;
      }

      const response = await fetch(
        `/api/v1/members/${member.id}/chat/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '發送失敗');
      }

      const result = await response.json();

      if (result.success) {
        // 清空輸入框
        setMessageInput('');

        // ⭐ 根據輸入框焦點狀態決定 GPT 模式
        // - 如果仍聚焦（用戶還在輸入框內）→ 重置計時器，繼續手動模式
        // - 如果已失焦（用戶離開輸入框）→ 立即恢復自動模式
        if (isGptManualMode) {
          const isStillFocused = messageTextareaRef.current === document.activeElement;
          if (isStillFocused) {
            startGptTimer();  // 仍聚焦 → 重置 10 分鐘計時器
          } else {
            restoreGptMode();  // 已失焦 → 恢復自動模式
          }
        }

        // 新訊息會透過 WebSocket handleNewMessage 推送，不需要重新載入

        // 滾動到底部
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      } else {
        throw new Error(result.message || '發送失敗');
      }
    } catch (error) {
      console.error('發送訊息失敗:', error);
      showToast?.('發送訊息失敗，請重試', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleEditTags = () => {
    setIsTagModalOpen(true);
  };

  const handleSaveTags = async (newMemberTags: string[], newInteractionTags: string[]): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('請先登入', 'error');
        return false;
      }

      // 調用後端 batch-update API
      const response = await fetch(`/api/v1/members/${member.id}/tags/batch-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          member_tags: newMemberTags,
          interaction_tags: newInteractionTags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('標籤更新失敗:', errorData);
        showToast(errorData.detail || '標籤更新失敗', 'error');
        return false;
      }

      // API 成功後更新本地狀態
      setMemberTags(newMemberTags);
      setInteractionTags(newInteractionTags);
      return true;
    } catch (error) {
      console.error('標籤更新錯誤:', error);
      showToast('標籤更新失敗，請稍後再試', 'error');
      return false;
    }
  };

  // Avatar upload handlers
  const handleAvatarClick = () => {
    avatarFileInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast('圖片大小不能超過 5MB', 'error');
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showToast('請選擇圖片檔案', 'error');
          return;
        }

        // Simulate backend API call
        // await uploadAvatar(file);
        showToast('儲存成功', 'success');
      } catch (error) {
        showToast('儲存失敗', 'error');
      }
    }
  };

  return (
    <>
      {/* Main Layout: Two Columns (Figma 3.png: 左大右小) */}
      <div className="content-stretch flex gap-[24px] items-start relative w-full h-full">
        {/* Left Column: Member Info Card (完整資料 + 標籤 + 備註) */}
        <div className="content-stretch flex flex-col gap-[24px] items-center relative self-stretch flex-1">
          {/* Avatar + Username */}
          <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
            {/* Avatar */}
            <div 
              className="relative flex items-center justify-center size-[180px] rounded-full bg-[#EDF2F8] cursor-pointer overflow-hidden transition-all duration-300 ease-in-out"
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => {
                setIsAvatarHovered(false);
                setIsAvatarPressed(false);
              }}
              onMouseDown={() => setIsAvatarPressed(true)}
              onMouseUp={() => setIsAvatarPressed(false)}
              onClick={handleAvatarClick}
            >
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />

              {/* Channel-specific Avatar or Default User Icon */}
              {displayMember?.avatar ? (
                <img
                  src={displayMember.avatar}
                  alt="會員頭像"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute bg-[#f6f9fd] content-stretch flex flex-col items-center left-1/2 overflow-clip rounded-[158.824px] size-[158.824px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
                  <div className="basis-0 bg-[#edf0f8] content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full">
                    <div className="relative shrink-0 size-[74.118px]">
                      <div className="absolute left-[calc(50%-0.06px)] size-[49.412px] top-[calc(50%-0.06px)] translate-x-[-50%] translate-y-[-50%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                          <g>
                            <path d={svgPaths.pd9dc180} fill="#383838" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hover/Pressed Overlay */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
                  isAvatarHovered ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  backgroundColor: isAvatarPressed
                    ? 'rgba(56, 56, 56, 0.5)'
                    : 'rgba(56, 56, 56, 0.3)',
                }}
              >
                <div
                  className={`flex items-center justify-center size-[60px] transition-transform duration-150 ease-in-out ${
                    isAvatarPressed ? 'scale-95' : isAvatarHovered ? 'scale-[2]' : 'scale-100'
                  }`}
                >
                  <ButtonEditAvatar className="w-[60px] h-[60px]" />
                </div>
              </div>
            </div>
            {/* Username - Channel-specific */}
            <div className="content-stretch flex items-center justify-center relative shrink-0">
              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
                <p className="leading-[1.5] whitespace-pre">{displayMember?.username || 'User Name'}</p>
              </div>
            </div>
          </div>
          
          {/* Member Info Panel */}
          <div className="relative rounded-[20px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
            <div className="size-full">
          <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[28px] relative w-full">
            {panelMember ? (
              <MemberInfoPanelComplete
                member={panelMember}
                memberTags={memberTags}
                interactionTags={interactionTags}
                    onEditTags={handleEditTags}
                  />
                ) : (
                  <div className="w-full text-center text-[#6e6e6e] text-[16px]">
                    載入會員資料中...
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* User Note Section */}
          <div className="content-stretch flex gap-[32px] items-start relative rounded-[20px] shrink-0 w-full">
            <MemberNoteEditor
              initialValue={note}
              onSave={async (newNote) => {
                if (!member?.id) {
                  showToast('找不到會員資料', 'error');
                  throw new Error('找不到會員資料');
                }

                const token = localStorage.getItem('auth_token');
                const headers: Record<string, string> = {
                  'Content-Type': 'application/json',
                };
                if (token) {
                  headers.Authorization = `Bearer ${token}`;
                }

                const response = await fetch(`/api/v1/members/${member.id}/notes`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify({ internal_note: newNote }),
                });

                if (response.status === 401) {
                  showToast('登入已過期，請重新登入', 'error');
                  logout();
                  throw new Error('登入已過期');
                }

                if (!response.ok) {
                  let errorMessage = '儲存失敗';
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                  } catch {
                    // ignore json parse errors
                  }
                  showToast(errorMessage, 'error');
                  throw new Error(errorMessage);
                }

                // Update local state only after successful API call
                setNote(newNote);

                // Update member object with new note
                if (member) {
                  setMember({
                    ...member,
                    internal_note: newNote,
                  });
                }
              }}
              containerClassName="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[20px] shrink-0"
              innerClassName="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] pb-[72px] relative w-full"
              editButtonPosition="absolute bottom-[28px] right-[28px]"
              saveButtonPosition="absolute bottom-[20px] right-[20px]"
            />
          </div>
        </div>

        {/* Right Column: Chat Area - Figma 3.png 布局 */}
        <div className="content-stretch flex flex-col gap-0 items-start relative self-stretch flex-1 rounded-[20px] overflow-hidden" style={{ height: '900px' }}>
          {/* 頂部白色工具列 - 平台選擇器（左）+ 日期（中） */}
          <div className="w-full px-[16px] py-[12px] flex items-center justify-between rounded-t-[20px] bg-white">
            {/* 平台選擇器（左側） */}
            <PlatformSwitcher
              value={currentPlatform}
              onChange={(platform) => {
                setCurrentPlatform(platform);
              }}
            />

            {/* 日期（中間） */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              {visibleDate && (
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[14px] text-center whitespace-nowrap">
                  {visibleDate}
                </p>
              )}
            </div>

            {/* 右側留空保持平衡 */}
            <div className="w-[100px]"></div>
          </div>

          {/* 聊天訊息區域 - 淺藍色背景 */}
          <div
            className="content-stretch flex flex-col gap-0 items-start relative w-full rounded-b-[20px] overflow-hidden"
            style={{
              backgroundColor: '#CDEAFD',
              height: 'calc(100% - 48px)',
              minHeight: '400px'
            }}
          >
            {/* Messages Scroll Container - 可滾動區域 */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="box-border content-stretch flex flex-col gap-[12px] items-start overflow-y-auto p-[16px] relative w-full"
              style={{ height: 'calc(100% - 180px)' }}
            >
              {/* Loading more messages indicator (top) */}
              {isLoading && page > 1 && (
                <div className="w-full text-center py-2 text-gray-400 text-sm">
                  載入更早訊息...
                </div>
              )}

              {/* No more messages indicator */}
              {!hasMore && messages.length > 0 && (
                <div className="w-full text-center py-2 text-gray-400 text-sm">
                  ─── 沒有更多訊息了 ───
                </div>
              )}

              {/* Initial loading indicator */}
              {isLoading && page === 1 && (
                <div className="w-full text-center py-4 text-gray-500">
                  載入中...
                </div>
              )}

              {/* Empty state */}
              {messages.length === 0 && !isLoading && (
                <div className="w-full text-center py-4 text-gray-500">
                  暫無對話記錄
                </div>
              )}

              {/* Messages list (使用 ChatBubble - Figma v1087) */}
              {messages.map((message) => (
                <div key={message.id} data-timestamp={extractMessageTimestamp(message) || ''} className="w-full">
                  <ChatBubble
                    message={message}
                    memberAvatar={
                      currentPlatform === 'LINE'
                        ? panelMember?.lineAvatar || (panelMember as any)?.avatar
                        : currentPlatform === 'Facebook'
                        ? (panelMember as any)?.fb_avatar
                        : (panelMember as any)?.webchat_avatar
                    }
                    platform={currentPlatform}
                  />
                </div>
              ))}
            </div>

            {/* Input Area (Fixed at Bottom) */}
            <div className="relative rounded-[20px] shrink-0 w-full px-[24px] pb-[24px]">
              <div className="bg-white relative rounded-[20px] shrink-0">
                <div className="flex flex-row justify-end min-h-inherit size-full">
                  <div className="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] relative w-full">
                    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-[96px] min-w-px relative shrink-0">
                      {/* Text Input */}
                      <div className="basis-0 content-stretch flex flex-wrap gap-[10px] grow items-center justify-center min-h-[108px] min-w-px relative shrink-0 w-full">
                        <textarea
                          ref={messageTextareaRef}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onFocus={startGptTimer}
                          onBlur={restoreGptMode}
                          onKeyDown={(e) => {
                            // Prevent sending message during IME composition (Chinese, Japanese, Korean input)
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !isComposing) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          onCompositionStart={() => setIsComposing(true)}
                          onCompositionEnd={() => setIsComposing(false)}
                          placeholder="輸入訊息文字"
                          className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow h-full leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none resize-none [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/60 [&::-webkit-scrollbar-thumb]:rounded-full"
                        />
                      </div>

                      {/* 底部列：回覆模式指示 + 傳送按鈕 (同一列) - Figma v1087 */}
                      <div className="content-stretch flex gap-[12px] items-center justify-between relative shrink-0 w-full">
                        {/* 回覆模式指示 (左側) - 保留原有 GPT 計時器邏輯 */}
                        <ResponseModeIndicator
                          mode={isGptManualMode ? 'manual' : 'ai_auto'}
                        />

                        {/* 傳送按鈕 (右側) */}
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || isSending}
                          className="bg-[#242424] disabled:opacity-50 relative rounded-[16px] min-h-[48px] min-w-[72px] shrink-0 transition-opacity disabled:cursor-not-allowed"
                        >
                          <div className="flex flex-row items-center justify-center min-h-inherit min-w-inherit size-full">
                            <div className="box-border content-stretch flex items-center justify-center min-h-inherit min-w-inherit px-[12px] py-[8px] relative size-full">
                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">
                                {isSending ? '發送中...' : '傳送'}
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Edit Modal */}
      <MemberTagEditModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        initialMemberTags={memberTags}
        initialInteractionTags={interactionTags}
        onSave={handleSaveTags}
      />
    </>
  );
}
