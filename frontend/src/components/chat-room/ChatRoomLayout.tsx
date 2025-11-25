/**
 * 聊天室布局容器
 * - 左側：會員資料卡（完全可編輯的表單 + 標籤 + 備註）
 * - 右側：聊天區域（藍色背景 + 對話氣泡 + 輸入框）
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatRoomLayoutProps, ChatMessage } from './types';
import type { Member } from '../../types/member';
import MemberAvatar from './MemberAvatar';
import MemberInfoPanelComplete from './MemberInfoPanelComplete';
import MemberTagEditModal from '../MemberTagEditModal';
import ButtonEdit from '../../imports/ButtonEdit';
import ButtonEditAvatar from '../../imports/ButtonEdit-8025-230';
import svgPathsInfo from '../../imports/svg-k0rlkn3s4y';
import svgPaths from '../../imports/svg-bzzivawqvx';
import svgPathsForm from '../../imports/svg-htq1l2704k';
import { useToast } from '../ToastProvider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import MemberNoteEditor from '../shared/MemberNoteEditor';
import { useMembers } from '../../contexts/MembersContext';
import Container from '../../imports/Container-8548-103';

// Chat messages constants
const PAGE_SIZE = 6;  // 每次載入 6 條訊息（3 對問答）

// Removed mock messages - will load from API
const mockMessages_REMOVED: ChatMessage[] = [
  { id: 1, type: 'user', text: '文字訊息', time: '下午 03:30', isRead: false },
  { id: 2, type: 'official', text: '官方文字訊息', time: '下午 03:40', isRead: true },
  { id: 3, type: 'user', text: '文字訊息', time: '下午 04:30', isRead: false },
  { id: 4, type: 'official', text: '官方文字訊息', time: '���午 04:50', isRead: true },
  { id: 5, type: 'user', text: '文字訊息', time: '下午 05:30', isRead: false },
  { id: 6, type: 'official', text: '官方文字訊息', time: '下午 05:40', isRead: true },
];

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

// 標籤組件
function TagBadge({ text }: { text: string }) {
  return (
    <div className="bg-[#FDF5DB] box-border content-stretch flex items-center px-[12px] py-[4px] relative rounded-[32px] shrink-0">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#7F6C00] text-[14px] text-nowrap whitespace-pre">
        {text}
      </p>
    </div>
  );
}

// Figma Tag Component (Blue theme to match spec)
function FigmaTag({ text }: { text: string }) {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">
        {text}
      </p>
    </div>
  );
}

// Member Info Field Component
function MemberInfoField({ label, required, value, onChange, onFocus }: { label: string; required?: boolean; value: string; onChange: (val: string) => void; onFocus?: () => void }) {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full">
      <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
        <div className="content-stretch flex items-center relative shrink-0">
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
            <p className="leading-[1.5] whitespace-pre">{label}</p>
          </div>
        </div>
        {required && (
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">*</p>
            </div>
          </div>
        )}
      </div>
      <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
        <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full">
          <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
          <div className="flex flex-col justify-center min-h-inherit size-full">
            <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
              <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onFocus={onFocus}
                  className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] bg-transparent border-0 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Gender Radio Button Component
function GenderRadio({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer" onClick={onClick}>
      <div className="relative shrink-0 size-[24px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g clipPath="url(#clip0_gender)">
            <path d={svgPaths.p26f9ce00} fill={selected ? "#0F6BEB" : "#383838"} />
            {selected && <path d={svgPaths.pee04100} fill="#0F6BEB" />}
          </g>
          <defs>
            <clipPath id="clip0_gender">
              <rect fill="white" height="24" width="24" />
            </clipPath>
          </defs>
        </svg>
      </div>
      <div className="content-stretch flex items-center relative shrink-0">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Read-only Info Component
function ReadOnlyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">{label}</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function ChatRoomLayout({ member: initialMember }: ChatRoomLayoutProps) {
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
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [memberTags, setMemberTags] = useState<string[]>(member?.memberTags || []); // ✅ 使用真實會員標籤
  const [interactionTags, setInteractionTags] = useState<string[]>(member?.interactionTags || []); // ✅ 使用真實互動標籤
  const [note, setNote] = useState(member?.internal_note || '');

  // Form field states
  const [formData, setFormData] = useState({
    realName: member?.realName || '',
    birthday: member?.birthday || '',
    gender: member?.gender || '0',
    residence: member?.residence || '',
    phone: member?.phone || '',
    email: member?.email || '',
    id_number: member?.id_number || '',
    passport_number: member?.passport_number || ''
  });
  
  // Editing state for form
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(formData);
  const [birthdayPopoverOpen, setBirthdayPopoverOpen] = useState(false);
  
  // Avatar interaction states
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isAvatarPressed, setIsAvatarPressed] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Convert backend gender format to frontend format
  const convertGenderToFrontend = (backendGender?: string): 'male' | 'female' | 'other' => {
    if (backendGender === '1') return 'male';
    if (backendGender === '2') return 'female';
    return 'other'; // '0' or undefined
  };

  // Convert frontend gender format to backend format
  const convertGenderToBackend = (frontendGender: string): string => {
    if (frontendGender === 'male') return '1';
    if (frontendGender === 'female') return '2';
    return '0'; // 'other'
  };

  // Fetch full member details when component mounts
  useEffect(() => {
    if (!initialMember?.id) return;

    const loadMemberDetail = async () => {
      setIsLoadingMember(true);
      const fullMember = await fetchMemberById(initialMember.id);
      if (fullMember) {
        setMember(fullMember);
      }
      setIsLoadingMember(false);
    };

    loadMemberDetail();
  }, [initialMember?.id, fetchMemberById]);

  // Sync member data to formData when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        realName: member.realName || '',
        birthday: member.birthday || '',
        gender: convertGenderToFrontend(member.gender),
        residence: member.residence || '',
        phone: member.phone || '',
        email: member.email || '',
        id_number: member.id_number || '',
        passport_number: member.passport_number || ''
      });
      setNote(member.internal_note || '');
      setMemberTags(member.memberTags || []);
      setInteractionTags(member.interactionTags || []);
    }
  }, [member]);

  // Load chat messages from API
  const loadChatMessages = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!member?.id) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `/api/v1/members/${member.id}/chat-messages?page=${pageNum}&page_size=${PAGE_SIZE}`,
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
      setIsLoading(false);
    }
  }, [member?.id]);

  // Handle scroll for infinite scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;

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
  }, [hasMore, isLoading, page, loadChatMessages]);

  // Load initial messages when member changes
  useEffect(() => {
    if (member?.id) {
      loadChatMessages(1, false);
    }
  }, [member?.id, loadChatMessages]);

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

        console.log('訊息已發送:', result.message_id);
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
      setMemberTags(newMemberTags);
      setInteractionTags(newInteractionTags);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleEditForm = () => {
    setIsFormEditing(true);
    setOriginalFormData(formData);
  };

  const handleSaveForm = async () => {
    try {
      // Simulate save operation (90% success rate for demo)
      const saveSuccess = Math.random() > 0.1;
      
      if (saveSuccess) {
        setIsFormEditing(false);
        showToast('儲存成功', 'success');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      showToast('儲存失敗', 'error');
    }
  };

  const handleCancelForm = () => {
    setIsFormEditing(false);
    setFormData(originalFormData);
    setBirthdayPopoverOpen(false);
  };

  const handleBirthdaySelect = (date: Date | undefined) => {
    if (date) {
      handleEditForm();
      // 使用本地時區格式化日期，避免時區轉換問題
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFormData({ ...formData, birthday: formattedDate });
      setBirthdayPopoverOpen(false);
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
          
          {/* Member Info Form - White Card */}
          <div className="relative rounded-[20px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[28px] relative w-full">
                <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
                  {/* Editable Fields Container */}
                  <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
                    {/* Name Field */}
                    <MemberInfoField
                      label="姓名"
                      required
                      value={formData.realName}
                      onChange={(val) => setFormData({ ...formData, realName: val })}
                      onFocus={handleEditForm}
                    />
                    
                    {/* Birthday Field */}
                    <div className="content-start flex flex-wrap gap-[40px] items-start relative shrink-0 w-full">
                      <div className="basis-0 content-stretch flex grow items-start min-h-px min-w-px relative shrink-0">
                        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                              <p className="leading-[1.5] whitespace-pre">生日</p>
                            </div>
                          </div>
                        </div>
                        <div className="basis-0 bg-white grow min-h-px min-w-[298px] relative rounded-[8px] shrink-0">
                          <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                          <div className="flex flex-col justify-center min-w-inherit size-full">
                            <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-w-inherit p-[8px] relative w-full">
                              <Popover open={birthdayPopoverOpen} onOpenChange={setBirthdayPopoverOpen}>
                                <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
                                  <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
                                    <input
                                      type="text"
                                      value={formData.birthday}
                                      readOnly
                                      onFocus={handleEditForm}
                                      className="w-full font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-nowrap whitespace-pre bg-transparent border-0 outline-none cursor-pointer"
                                    />
                                  </div>
                                  <PopoverTrigger asChild>
                                    <div 
                                      className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] relative rounded-[8px] shrink-0 size-[28px] cursor-pointer"
                                      onClick={handleEditForm}
                                    >
                                      <div className="relative shrink-0 size-[24px]">
                                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                          <path d={svgPathsForm.p22990f00} fill="#0F6BEB" />
                                        </svg>
                                      </div>
                                    </div>
                                  </PopoverTrigger>
                                </div>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <Calendar
                                    mode="single"
                                    selected={formData.birthday ? (() => {
                                      const [year, month, day] = formData.birthday.split('-').map(Number);
                                      return new Date(year, month - 1, day);
                                    })() : undefined}
                                    onSelect={handleBirthdaySelect}
                                    disabled={(date) => {
                                      const today = new Date();
                                      today.setHours(23, 59, 59, 999);
                                      return date > today;
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Gender Field */}
                    <div className="content-stretch flex gap-[20px] h-[44px] items-center relative shrink-0 w-full">
                      <div className="basis-0 content-stretch flex grow items-start min-h-px min-w-px relative shrink-0">
                        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                              <p className="leading-[1.5] whitespace-pre">生理性別</p>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                          <GenderRadio label="男性" selected={formData.gender === 'male'} onClick={() => { handleEditForm(); setFormData({ ...formData, gender: 'male' }); }} />
                          <GenderRadio label="女性" selected={formData.gender === 'female'} onClick={() => { handleEditForm(); setFormData({ ...formData, gender: 'female' }); }} />
                          <GenderRadio label="不透露" selected={formData.gender === 'other'} onClick={() => { handleEditForm(); setFormData({ ...formData, gender: 'other' }); }} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Location Field */}
                    <MemberInfoField
                      label="居住地"
                      value={formData.residence}
                      onChange={(val) => setFormData({ ...formData, residence: val })}
                      onFocus={handleEditForm}
                    />
                    
                    {/* Phone Field */}
                    <MemberInfoField 
                      label="手機號碼" 
                      required 
                      value={formData.phone} 
                      onChange={(val) => setFormData({ ...formData, phone: val })}
                      onFocus={handleEditForm}
                    />
                    
                    {/* Email Field */}
                    <MemberInfoField 
                      label="Email" 
                      required 
                      value={formData.email} 
                      onChange={(val) => setFormData({ ...formData, email: val })}
                      onFocus={handleEditForm}
                    />
                    
                    {/* ID Number Field */}
                    <MemberInfoField
                      label="身分證字號"
                      value={formData.id_number}
                      onChange={(val) => setFormData({ ...formData, id_number: val })}
                      onFocus={handleEditForm}
                    />

                    {/* Passport Field */}
                    <MemberInfoField
                      label="護照號碼"
                      value={formData.passport_number}
                      onChange={(val) => setFormData({ ...formData, passport_number: val })}
                      onFocus={handleEditForm}
                    />
                  </div>
                  
                  {/* Cancel and Save Buttons - Show when editing */}
                  {isFormEditing && (
                    <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-full">
                      <button
                        onClick={handleCancelForm}
                        className="bg-[#f0f6ff] hover:bg-[#e3f0ff] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 transition-colors cursor-pointer"
                      >
                        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">取消</p>
                      </button>
                      <button
                        onClick={handleSaveForm}
                        className="bg-[#242424] hover:bg-[#383838] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 transition-colors cursor-pointer"
                      >
                        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">儲存變更</p>
                      </button>
                    </div>
                  )}
                  
                  {/* Divider */}
                  <div className="h-0 relative shrink-0 w-full">
                    <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 502 1">
                        <line stroke="#E1EBF9" strokeLinecap="round" x1="0.5" x2="501.5" y1="0.5" y2="0.5" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Read-only Info Container */}
                  <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                    <ReadOnlyInfo
                      label="加入來源"
                      value={member?.join_source || 'LINE'}
                    />
                    <ReadOnlyInfo label="建立時間" value={member?.createTime || '未提供'} />
                    <ReadOnlyInfo label="最近聊天時間" value={member?.lastChatTime || '未提供'} />
                    <ReadOnlyInfo label="會員 ID" value={member?.id || '未提供'} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Member Tags & Interaction Tags Section */}
          <div className="relative rounded-[20px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
            <div className="size-full">
              <div className="box-border content-stretch flex items-start p-[28px] relative w-full">
                <div className="basis-0 content-stretch flex flex-col gap-[20px] grow items-start min-h-px min-w-px relative shrink-0">
                  {/* Member Tags */}
                  <div className="content-stretch flex items-start relative shrink-0 w-full">
                    <div className="content-stretch flex gap-[2px] items-start min-w-[120px] relative self-stretch shrink-0">
                      <div className="content-stretch flex items-center relative shrink-0">
                        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                          <p className="leading-[1.5] whitespace-pre">會員標籤</p>
                        </div>
                      </div>
                    </div>
                    <div className="basis-0 content-center flex flex-wrap gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                      {memberTags.map((tag, index) => (
                        <FigmaTag key={index} text={tag} />
                      ))}
                    </div>
                  </div>
                  
                  {/* Interaction Tags */}
                  <div className="content-stretch flex items-start relative shrink-0 w-full">
                    <div className="content-stretch flex gap-[2px] items-start min-w-[120px] relative self-stretch shrink-0">
                      <div className="content-stretch flex items-center relative shrink-0">
                        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                          <p className="leading-[1.5] whitespace-pre">互動標籤</p>
                        </div>
                      </div>
                    </div>
                    <div className="basis-0 content-center flex flex-wrap gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                      {interactionTags.map((tag, index) => (
                        <FigmaTag key={index} text={tag} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="content-end flex flex-wrap gap-[10px] items-end relative self-stretch shrink-0">
                  <div 
                    onClick={handleEditTags}
                    className="relative shrink-0 size-[28px] cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <ButtonEdit />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* User Note Section */}
          <div className="content-stretch flex gap-[32px] items-start relative rounded-[20px] shrink-0 w-full">
            <MemberNoteEditor 
              initialValue={note}
              onSave={async (newNote) => {
                setNote(newNote);
                // API call would go here
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
              minHeight: '700px'
            }}
          >
            {/* Date Label (Positioned Absolutely at Top) */}
            <div className="absolute bg-[rgba(246,249,253,0.7)] left-[calc(50%+0.5px)] rounded-[28px] top-[16px] translate-x-[-50%] z-10">
              <div aria-hidden="true" className="absolute border-[#e8e8e8] border-[0.4px] border-solid inset-0 pointer-events-none rounded-[28px]" />
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[2px] relative">
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap whitespace-pre">2025/10/08（三）</p>
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
                <MessageBubble
                  key={message.id}
                  message={message}
                  memberAvatar={member?.lineAvatar}
                />
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
