/**
 * 聊天室布局容器
 * - 左側：會員資料卡（完全可編輯的表單 + 標籤 + 備註）
 * - 右側：聊天區域（藍色背景 + 對話氣泡 + 輸入框）
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ChatRoomLayoutProps, ChatMessage } from './types';
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

// 用戶頭像（左側，顯示使用者 LINE 頭像）
function UserAvatar({ avatar }: { avatar?: string }) {
  return (
    <div className="bg-white border-2 border-white overflow-clip relative rounded-full shrink-0 size-[45px]">
      {avatar ? (
        <img
          src={avatar}
          alt="用戶頭像"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-[16px] text-gray-500">U</span>
        </div>
      )}
    </div>
  );
}

// 官方頭像（右側，使用設計稿 Container）
function OfficialAvatar() {
  return (
    <div className="relative shrink-0 size-[45px]">
      <Container />
    </div>
  );
}

// 消息氣泡組件
function MessageBubble({ message, memberAvatar }: { message: ChatMessage; memberAvatar?: string }) {
  const isOfficial = message.type === 'official';

  return (
    <div className={`content-stretch flex gap-[20px] items-start ${isOfficial ? 'justify-end' : 'justify-start'} relative shrink-0 w-full`}>
      {!isOfficial && <UserAvatar avatar={memberAvatar} />}
      
      <div className={`content-stretch flex flex-col gap-[2px] items-${isOfficial ? 'end' : 'start'} relative shrink-0`}>
        <div className={`${isOfficial ? 'bg-[#383838]' : 'bg-[#f6f9fd]'} content-stretch flex flex-col items-center max-w-[288px] overflow-clip relative rounded-[15px] shrink-0 w-[288px]`}>
          <div className="relative shrink-0 w-full">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
                <p className={`basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] break-words ${isOfficial ? 'text-right text-white' : 'text-[#383838]'}`} style={{ overflowWrap: 'anywhere' }}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[18px] relative shrink-0 w-full">
          <p className={`absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 leading-[1.5] text-[12px] ${isOfficial ? 'text-right' : 'text-left'} text-white`}>
            {message.time}{message.isRead ? ' 已讀' : ''}
          </p>
        </div>
      </div>

      {isOfficial && <OfficialAvatar />}
    </div>
  );
}

export default function ChatRoomLayout({ member: initialMember, memberId }: ChatRoomLayoutProps) {
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
  const [note, setNote] = useState(member?.internal_note || '');

  // Avatar interaction states
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isAvatarPressed, setIsAvatarPressed] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { logout } = useAuth();

  const memberLastInteractionRaw = member ? (member as any).last_interaction_at : null;

  const latestChatTimestamp = useMemo(() => {
    const messageTimestamp = findLatestMessageTimestamp(messages);
    if (messageTimestamp) return messageTimestamp;
    return member?.lastChatTime || memberLastInteractionRaw || null;
  }, [messages, member?.lastChatTime, memberLastInteractionRaw]);

  const panelMember = useMemo(() => {
    if (!member) return undefined;
    if (!latestChatTimestamp || latestChatTimestamp === member.lastChatTime) {
      return member;
    }
    return { ...member, lastChatTime: latestChatTimestamp };
  }, [member, latestChatTimestamp]);

  // Fetch full member details when component mounts
  // 支援兩種情況：1) initialMember 存在  2) 只有 memberId
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

  // Sync member data for related UI pieces when member changes
  useEffect(() => {
    if (member) {
      setNote(member.internal_note || '');
      setMemberTags(member.memberTags || []);
      setInteractionTags(member.interactionTags || []);
    }
  }, [member]);

  // WebSocket 監聽新訊息
  const handleNewMessage = useCallback((wsMessage: any) => {
    if (wsMessage.type === 'new_message' && wsMessage.data) {
      // 將新訊息添加到列表末尾
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
          lastChatTime: new Date().toISOString()
        });
      }

      // 自動滾動到底部
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [member]);

  // 建立 WebSocket 連線（優先使用 member?.id，其次使用傳入的 memberId）
  const wsTargetId = member?.id?.toString() || memberId;
  const { isConnected: isRealtimeConnected } = useWebSocket(wsTargetId, handleNewMessage);

  // 初始載入訊息後設定 visibleDate（顯示最新訊息的日期）
  useEffect(() => {
    if (visibleDate) return;
    if (messages.length > 0) {
      // 初次載入時，顯示最後一則（最新）訊息的日期
      const lastMessage = messages[messages.length - 1];
      const timestampFromMessage = extractMessageTimestamp(lastMessage);
      if (timestampFromMessage) {
        setVisibleDate(formatDateWithWeekday(timestampFromMessage));
        return;
      }
    }
    if (latestChatTimestamp) {
      setVisibleDate(formatDateWithWeekday(latestChatTimestamp));
    }
  }, [messages, latestChatTimestamp, visibleDate]);

  // Load chat messages from API
  // 支援兩種情況：1) member?.id 存在  2) 只有 memberId
  const loadChatMessages = useCallback(async (
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
      const response = await fetch(
        `/api/v1/members/${targetId}/chat-messages?page=${pageNum}&page_size=${PAGE_SIZE}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const result = await response.json();

      // ✅ 修正：backend 使用 SuccessResponse，返回 code: 200，而非 success: true
      if (result.code === 200 && result.data) {
        const { messages: newMessages, has_more } = result.data;

        // API 返回降序（最新在前），需反轉為升序（最舊在前）
        const reversedMessages = [...newMessages].reverse();

        if (append) {
          // 向上滾動載入更早訊息 - 添加到前面
          setMessages(prev => [...reversedMessages, ...prev]);
        } else {
          // 初次載入 - 替換全部
          setMessages(reversedMessages);
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
  }, [member?.id, memberId]);

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

    // 滾動到頂部 + 還有更多訊息 + 不在載入中
    if (container.scrollTop === 0 && hasMore && !isLoading) {
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
  }, [member?.id, memberId, loadChatMessages]);

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

  // Auto-scroll to bottom when messages change (legacy - keep for new message functionality)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedText = messageInput.trim();
    if (!trimmedText || !member?.id || isSending) return;

    setIsSending(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `/api/v1/members/${member.id}/chat/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: trimmedText })
        }
      );

      if (!response.ok) {
        throw new Error('發送失敗');
      }

      const result = await response.json();

      if (result.success) {
        // 清空輸入框
        setMessageInput('');

        // 重新載入訊息列表（確保顯示最新訊息）
        await loadChatMessages(1, false);

        // 可選：滾動到底部
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
      {/* Main Layout: Two Columns */}
      <div className="content-stretch flex gap-[32px] items-start relative w-full">
        {/* Left Column: Member Info Card (完整資料 + 標籤 + 備註) */}
        <div className="content-stretch flex flex-col gap-[24px] items-center relative self-stretch shrink-0" style={{ width: '460px' }}>
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

              {/* LINE Avatar or Default User Icon */}
              {member?.lineAvatar ? (
                <img
                  src={member.lineAvatar}
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
            {/* Username */}
            <div className="content-stretch flex items-center justify-center relative shrink-0">
              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
                <p className="leading-[1.5] whitespace-pre">{member?.username || 'User Name'}</p>
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

        {/* Right Column: Chat Area (藍色背景 + 對話) */}
        <div className="content-stretch flex flex-col gap-0 items-start min-h-px relative self-stretch flex-1">
          {/* Chat Messages Area with Blue Gradient Background */}
          <div
            className="bg-gradient-to-b from-[#a5d8ff] to-[#d0ebff] content-stretch flex flex-col gap-0 items-start relative w-full rounded-[20px] overflow-hidden"
            style={{
              height: '900px',
              minHeight: '400px'
            }}
          >
            {/* Date Label (Positioned Absolutely at Top) */}
            <div className="absolute bg-[rgba(246,249,253,0.7)] left-[calc(50%+0.5px)] rounded-[28px] top-[16px] translate-x-[-50%] z-10">
              <div aria-hidden="true" className="absolute border-[#e8e8e8] border-[0.4px] border-solid inset-0 pointer-events-none rounded-[28px]" />
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[2px] relative">
                {visibleDate && <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap whitespace-pre">{visibleDate}</p>}
              </div>
            </div>

            {/* Messages Scroll Container */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="box-border content-stretch flex flex-col gap-[20px] items-start overflow-y-auto p-[24px] pt-[60px] relative w-full flex-1"
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

              {/* Messages list */}
              {messages.map((message) => (
                <div key={message.id} data-timestamp={message.timestamp || ''} className="w-full">
                  <MessageBubble
                    message={message}
                    memberAvatar={member?.lineAvatar}
                  />
                </div>
              ))}
            </div>

            {/* Input Area (Fixed at Bottom) */}
            <div className="relative rounded-[20px] shrink-0 w-full px-[24px] pb-[24px]">
              <div className="bg-white relative rounded-[20px] shrink-0">
                <div className="flex flex-row justify-end min-h-inherit size-full">
                  <div className="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] relative w-full">
                    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow h-[168px] items-start min-h-[96px] min-w-px relative shrink-0">
                      {/* Text Input */}
                      <div className="basis-0 content-stretch flex flex-wrap gap-[10px] grow items-center justify-center min-h-[108px] min-w-px relative shrink-0 w-full">
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
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
                      
                      {/* Buttons */}
                      <div className="content-stretch flex gap-[4px] items-start justify-end relative shrink-0 w-full">
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
