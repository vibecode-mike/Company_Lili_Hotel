/**
 * 聊天室布局容器
 * - 左側：會員資料卡（完全可編輯的表單 + 標籤 + 備註）
 * - 右側：聊天區域（藍色背景 + 對話氣泡 + 輸入框）
 */

import { useState, useEffect, useRef } from 'react';
import type { ChatRoomLayoutProps, ChatMessage } from './types';
import MemberAvatar from './MemberAvatar';
import MemberInfoPanelComplete from './MemberInfoPanelComplete';
import MemberTagEditModal from '../MemberTagEditModal';
import ButtonEdit from '../../imports/ButtonEdit';
import svgPathsInfo from '../../imports/svg-k0rlkn3s4y';
import svgPaths from '../../imports/svg-bzzivawqvx';
import svgPathsForm from '../../imports/svg-htq1l2704k';
import { useToast } from '../ToastProvider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import MemberNoteEditor from '../shared/MemberNoteEditor';

// Mock messages data
const mockMessages: ChatMessage[] = [
  { id: 1, type: 'user', text: '文字訊息', time: '下午 03:30', isRead: false },
  { id: 2, type: 'official', text: '官方文字訊息', time: '下午 03:40', isRead: true },
  { id: 3, type: 'user', text: '文字訊息', time: '下午 04:30', isRead: false },
  { id: 4, type: 'official', text: '官方文字訊息', time: '下午 04:50', isRead: true },
  { id: 5, type: 'user', text: '文字訊息', time: '下午 05:30', isRead: false },
  { id: 6, type: 'official', text: '官方文字訊息', time: '下午 05:40', isRead: true },
];

// OA 頭像組件
function OAAvatar() {
  return (
    <div className="bg-white content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[45px]">
      <div className="h-[18px] relative shrink-0 w-[16.938px]">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[18px] text-[#383838] text-[12px] text-nowrap">OA</p>
      </div>
    </div>
  );
}

// 消息氣泡組件
function MessageBubble({ message }: { message: ChatMessage }) {
  const isOfficial = message.type === 'official';

  return (
    <div className={`content-stretch flex gap-[20px] items-start ${isOfficial ? 'justify-end' : 'justify-start'} relative shrink-0 w-full`}>
      {!isOfficial && <OAAvatar />}
      
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

      {isOfficial && <OAAvatar />}
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

// Figma Tag Component (Orange/Yellow theme)
function FigmaTag({ text }: { text: string }) {
  return (
    <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">{text}</p>
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

export default function ChatRoomLayout({ member }: ChatRoomLayoutProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [messageInput, setMessageInput] = useState('');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [memberTags, setMemberTags] = useState<string[]>(member?.tags || ['消費力高', 'VIP', '會員專屬優惠']);
  const [interactionTags, setInteractionTags] = useState<string[]>(['優惠活動', '限時折扣', '滿額贈品', '會員專屬優惠', '手工芝', 'BeautyBlogger']);
  const [note, setNote] = useState(member?.note || '');
  
  // Form field states
  const [formData, setFormData] = useState({
    name: member?.name || 'Real Name',
    birthday: '2000-12-12',
    gender: 'female' as 'male' | 'female' | 'other',
    location: '台北市',
    phone: '0909000000',
    email: 'info@mail.com',
    idNumber: 'IDDDDD090909',
    passport: '399999999'
  });
  
  // Editing state for form
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(formData);
  const [birthdayPopoverOpen, setBirthdayPopoverOpen] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: ChatMessage = {
        id: messages.length + 1,
        type: 'official',
        text: messageInput,
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true }),
        isRead: false
      };
      
      setMessages([...messages, newMessage]);
      setMessageInput('');
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

  return (
    <>
      {/* Main Layout: Two Columns */}
      <div className="content-stretch flex gap-[32px] items-start relative w-full">
        {/* Left Column: Member Info Card (完整資料 + 標籤 + 備註) */}
        <div className="content-stretch flex flex-col gap-[24px] items-center relative self-stretch shrink-0" style={{ width: '460px' }}>
          {/* Avatar + Username */}
          <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
            {/* Avatar */}
            <div className="overflow-clip relative shrink-0 size-[180px]">
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
            </div>
            {/* Username */}
            <div className="content-stretch flex items-center justify-center relative shrink-0">
              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
                <p className="leading-[1.5] whitespace-pre">{member?.name || 'User Name'}</p>
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
                      value={formData.name} 
                      onChange={(val) => setFormData({ ...formData, name: val })}
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
                      value={formData.location} 
                      onChange={(val) => setFormData({ ...formData, location: val })}
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
                      value={formData.idNumber} 
                      onChange={(val) => setFormData({ ...formData, idNumber: val })}
                      onFocus={handleEditForm}
                    />
                    
                    {/* Passport Field */}
                    <MemberInfoField 
                      label="護照號碼" 
                      value={formData.passport} 
                      onChange={(val) => setFormData({ ...formData, passport: val })}
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
                    <ReadOnlyInfo label="加入來源" value="LINE (LINE UID: 000000000)" />
                    <ReadOnlyInfo label="建立時間" value="2025-01-01" />
                    <ReadOnlyInfo label="最近聊天時間" value="2025-08-08" />
                    <ReadOnlyInfo label="會員 ID" value="000000001" />
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
              className="box-border content-stretch flex flex-col gap-[20px] items-start overflow-y-auto p-[24px] pt-[60px] relative w-full flex-1"
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>

            {/* Input Area (Fixed at Bottom) */}
            <div className="relative rounded-[20px] shrink-0 w-full px-[24px] pb-[24px]">
              <div className="bg-white relative rounded-[20px] shrink-0">
                <div className="flex flex-row justify-end min-h-inherit size-full">
                  <div className="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] relative w-full">
                    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow min-h-[96px] items-start min-w-px relative shrink-0">
                      {/* Text Input */}
                      <div className="basis-0 content-stretch flex flex-wrap gap-[10px] grow items-center justify-center min-h-[108px] min-w-px relative shrink-0 w-full">
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="輸入訊息文字"
                          className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow h-full leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none resize-none [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/60 [&::-webkit-scrollbar-thumb]:rounded-full"
                        />
                      </div>
                      
                      {/* Buttons */}
                      <div className="content-stretch flex gap-[4px] items-start justify-end relative shrink-0 w-full">
                        <button
                          className="bg-neutral-100 hover:bg-neutral-200 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 transition-colors"
                          onClick={() => {}}
                        >
                          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">排程傳送</p>
                        </button>
                        
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                          className="bg-[#242424] disabled:opacity-50 relative rounded-[16px] min-h-[48px] min-w-[72px] shrink-0 transition-opacity disabled:cursor-not-allowed"
                        >
                          <div className="flex flex-row items-center justify-center min-h-inherit min-w-inherit size-full">
                            <div className="box-border content-stretch flex items-center justify-center min-h-inherit min-w-inherit px-[12px] py-[8px] relative size-full">
                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">
                                傳送
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