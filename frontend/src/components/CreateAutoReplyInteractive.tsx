import { toast } from 'sonner@2.0.3';
import Sidebar from './Sidebar';
import { useState, useRef } from 'react';
import svgPathsModal from "../imports/svg-9n0wtrekj3";
import KeywordTagsInput from './KeywordTagsInput';
import TriggerTimeOptions, { TriggerTimeType } from './TriggerTimeOptions';

interface CreateAutoReplyProps {
  onBack: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToMembers?: () => void;
}

type ReplyType = 'welcome' | 'keyword' | 'follow';

interface MessageItem {
  id: number;
  text: string;
}

export default function CreateAutoReplyInteractive({ onBack, onNavigateToMessages, onNavigateToMembers }: CreateAutoReplyProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [replyType, setReplyType] = useState<ReplyType>('welcome');
  const [isEnabled, setIsEnabled] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>([{ id: 1, text: '' }]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [keywordTags, setKeywordTags] = useState<string[]>([]);
  const [triggerTime, setTriggerTime] = useState<TriggerTimeType>('immediate');
  const [scheduledDateTime, setScheduledDateTime] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });
  const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({});

  const replyTypeOptions: { value: ReplyType; label: string }[] = [
    { value: 'welcome', label: '歡迎訊息' },
    { value: 'keyword', label: '觸發關鍵字' },
    { value: 'follow', label: '一律回應' }
  ];

  const getReplyTypeLabel = (type: ReplyType) => {
    return replyTypeOptions.find(opt => opt.value === type)?.label || '';
  };

  const handleInsertVariable = (index: number) => {
    const textarea = textareaRefs.current[messages[index].id];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messages[index].text;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + '{好友的顯示名稱}' + after;

    if (newText.length <= 100) {
      const newMessages = [...messages];
      newMessages[index].text = newText;
      setMessages(newMessages);

      // 設置光標位置到插入變數之後
      setTimeout(() => {
        if (textarea) {
          const newCursorPos = start + '{好友的顯示名稱}'.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }
      }, 0);
    }
  };

  // 解析文字並渲染帶有標籤的內容
  const renderMessagePreview = (text: string, index: number) => {
    if (!text) return `訊息 ${index + 1}`;
    
    const parts = text.split(/(\{好友的顯示名稱\})/g);
    
    return (
      <span className="flex flex-wrap items-center gap-[4px]">
        {parts.map((part, i) => {
          if (part === '{好友的顯示名稱}') {
            return (
              <span key={i} className="bg-[#FFFAF0] text-[#EBA20F] px-[4px] py-[2px] rounded-[8px] inline-block">
                好友的顯示名稱
              </span>
            );
          }
          return part ? <span key={i}>{part}</span> : null;
        })}
      </span>
    );
  };

  const handleCreate = () => {
    const hasEmptyMessage = messages.some(msg => !msg.text.trim());
    if (hasEmptyMessage) {
      toast.error('請輸入訊息文字');
      return;
    }
    
    // 验证关键字标签（只有当回应类型为"触发关键字"时才需要验证）
    if (replyType === 'keyword' && keywordTags.length === 0) {
      toast.error('請至少新增一個關鍵字標籤');
      return;
    }
    
    toast.success('自動回應已儲存');
    setTimeout(() => onBack(), 1500);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMessages = [...messages];
    [newMessages[index - 1], newMessages[index]] = 
      [newMessages[index], newMessages[index - 1]];
    setMessages(newMessages);
    toast.info('訊息已上移');
  };

  const handleMoveDown = (index: number) => {
    if (index === messages.length - 1) return;
    const newMessages = [...messages];
    [newMessages[index], newMessages[index + 1]] = 
      [newMessages[index + 1], newMessages[index]];
    setMessages(newMessages);
    toast.info('訊息已下移');
  };

  const handleDeleteMessage = (index: number) => {
    if (messages.length === 1) return;
    const newMessages = messages.filter((_, i) => i !== index);
    setMessages(newMessages);
    toast.success('訊息已刪除');
  };

  const handleAddMessage = () => {
    if (messages.length >= 5) return;
    const newId = Math.max(...messages.map(m => m.id)) + 1;
    setMessages([...messages, { id: newId, text: '' }]);
    toast.success('已新增訊息');
  };

  const handleDeleteAutoReply = () => {
    toast.success('自動回應已刪除');
    setTimeout(() => onBack(), 1000);
  };

  return (
    <div className="bg-slate-50 min-h-screen flex">
      <Sidebar 
        currentPage="auto-reply"
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToAutoReply={onBack}
        onNavigateToMembers={onNavigateToMembers}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
      />

      <main className={`flex-1 overflow-auto bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
        <div className="bg-slate-50 content-stretch flex flex-col items-start relative size-full">
          {/* Breadcrumb */}
          <div className="relative shrink-0 w-full">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
                <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0">
                  <div className="content-stretch flex items-center justify-center relative shrink-0 cursor-pointer hover:opacity-70" onClick={onBack}>
                    <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[14px] text-nowrap whitespace-pre">自動回應</p>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[12px]">
                    <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.9510564804077148)+(var(--transform-inner-height)*0.30901697278022766)))] items-center justify-center left-[calc(50%-0.313px)] top-[calc(50%+0.542px)] translate-x-[-50%] translate-y-[-50%] w-[calc(1px*((var(--transform-inner-height)*0.9510564804077148)+(var(--transform-inner-width)*0.30901697278022766)))]" style={{ "--transform-inner-width": "8.5", "--transform-inner-height": "0" } as React.CSSProperties}>
                      <div className="flex-none rotate-[108deg]">
                        <div className="h-0 relative w-[8.5px]">
                          <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 1">
                              <line stroke="var(--stroke-0, #6E6E6E)" strokeLinecap="round" x1="0.5" x2="8" y1="0.5" y2="0.5" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0">
                    <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">編輯自動回應</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Header */}
          <div className="relative shrink-0 w-full">
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
                <div className="content-stretch flex items-start relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                    <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
                      <p className="leading-[1.5] whitespace-pre">編輯自動回應</p>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0">
                    <div className="box-border content-stretch flex gap-[10px] items-center p-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#ffebee] active:bg-[#ffebee] transition-colors group" onClick={handleDeleteAutoReply}>
                      <div className="relative shrink-0 size-[32px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                          <g clipPath="url(#clip0_delete_main)">
                            <path d={svgPathsModal.pcbf700} fill="var(--fill-0, #6E6E6E)" className="group-hover:fill-[#F44336] group-active:fill-[#F44336] transition-colors" />
                          </g>
                          <defs>
                            <clipPath id="clip0_delete_main"><rect fill="white" height="32" width="32" /></clipPath>
                          </defs>
                        </svg>
                      </div>
                    </div>
                    <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] active:bg-[#4a4a4a] transition-colors" onClick={handleCreate}>
                      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">儲存</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative shrink-0 w-full">
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
                {/* Switch Container */}
                <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
                  <div className="bg-slate-50 box-border content-stretch flex gap-[4px] items-center p-[4px] relative rounded-[12px] shrink-0">
                    <div className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                      <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">訊息排序</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Container */}
                <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full">
                  {/* Preview Container */}
                  <div className="bg-gradient-to-b box-border content-stretch flex from-[#a5d8ff] gap-[20px] items-start overflow-clip p-[24px] relative rounded-[20px] self-stretch shrink-0 to-[#d0ebff] w-[460px]">
                    <div className="bg-white relative rounded-[3.35544e+07px] shrink-0 size-[45px]">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[45px]">
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[18px] text-[#383838] text-[12px] text-nowrap">OA</p>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-[288px]">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip relative rounded-[inherit] w-[288px]">
                        {messages.map((msg, index) => (
                          <div key={msg.id} className="bg-[#383838] max-w-[288px] relative rounded-[15px] shrink-0 w-[288px]">
                            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-center max-w-inherit overflow-clip relative rounded-[inherit] w-[288px]">
                              <div className="relative shrink-0 w-full">
                                <div className="flex flex-row items-center size-full">
                                  <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
                                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-white">
                                      {renderMessagePreview(msg.text, index)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="basis-0 content-stretch flex flex-col gap-[24px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="content-stretch flex flex-col gap-[40px] items-end min-h-[200px] relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col gap-[32px] items-end relative shrink-0 w-full">
                        {/* 回應類型 */}
                        <div className="content-stretch flex items-start relative shrink-0 w-full flex-col xl:flex-row gap-[8px] xl:gap-0">
                          <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0 w-full xl:w-auto">
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] whitespace-nowrap">回應類型</p>
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#f44336] text-[16px] whitespace-nowrap">*</p>
                          </div>
                          <div className="basis-0 bg-white grow min-h-[48px] relative rounded-[8px] shrink-0 w-full xl:w-auto">
                            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                            <div className="flex flex-col justify-center min-h-inherit size-full">
                              <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[8px] relative w-full cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
                                  <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] whitespace-nowrap overflow-hidden text-ellipsis">{getReplyTypeLabel(replyType)}</p>
                                  <div className="relative shrink-0 size-[24px]">
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                      <path d={svgPathsModal.p2b927b00} fill="var(--fill-0, #6E6E6E)" />
                                    </svg>
                                  </div>
                                </div>
                                {isDropdownOpen && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-100 rounded-[8px] shadow-lg z-10">
                                    {replyTypeOptions.map(opt => (
                                      <div key={opt.value} className="py-[12px] px-[8px] hover:bg-slate-50 cursor-pointer flex items-center" onClick={(e) => { e.stopPropagation(); setReplyType(opt.value); setIsDropdownOpen(false); }}>
                                        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5] whitespace-nowrap">{opt.label}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 啟用狀態 */}
                        <div className="content-stretch flex items-center relative shrink-0 w-full flex-col xl:flex-row xl:items-center items-start gap-[8px] xl:gap-0">
                          <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0 w-full xl:w-auto">
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] whitespace-nowrap">啟用狀態</p>
                          </div>
                          <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start relative shrink-0 w-full xl:w-auto">
                            <div className="relative shrink-0 size-[40px] cursor-pointer" onClick={() => setIsEnabled(!isEnabled)}>
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
                                <g clipPath="url(#clip0_toggle)">
                                  <path 
                                    d={isEnabled 
                                      ? svgPathsModal.p13e42a00 
                                      : "M28.3333 11.6667H11.6667C7.06667 11.6667 3.33333 15.4 3.33333 20C3.33333 24.6 7.06667 28.3333 11.6667 28.3333H28.3333C32.9333 28.3333 36.6667 24.6 36.6667 20C36.6667 15.4 32.9333 11.6667 28.3333 11.6667ZM11.6667 25C8.9 25 6.66667 22.7667 6.66667 20C6.66667 17.2333 8.9 15 11.6667 15C14.4333 15 16.6667 17.2333 16.6667 20C16.6667 22.7667 14.4333 25 11.6667 25Z"
                                    }
                                    fill={isEnabled ? '#0F6BEB' : '#E5E7EB'}
                                    className="transition-all duration-300 ease-in-out"
                                  />
                                </g>
                                <defs>
                                  <clipPath id="clip0_toggle"><rect fill="white" height="40" width="40" /></clipPath>
                                </defs>
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* 觸發時間 - 所有回應類型都顯示 */}
                        <div className="content-stretch flex items-start relative shrink-0 w-full flex-col xl:flex-row gap-[8px] xl:gap-0">
                          <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0 w-full xl:w-auto">
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] whitespace-nowrap">觸發時間</p>
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#f44336] text-[16px] whitespace-nowrap">*</p>
                          </div>
                          <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start relative shrink-0 w-full xl:w-auto">
                            <TriggerTimeOptions
                              triggerTime={triggerTime}
                              setTriggerTime={setTriggerTime}
                              scheduledDateTime={scheduledDateTime}
                              setScheduledDateTime={setScheduledDateTime}
                              showScheduledOption={replyType === 'follow'} // 只有"一律回應"才顯示"指定日期或時間"
                            />
                          </div>
                        </div>

                        {/* 關鍵字標籤 - 只在選擇「觸發關鍵字」時顯示 */}
                        {replyType === 'keyword' && (
                          <KeywordTagsInput
                            tags={keywordTags}
                            onChange={setKeywordTags}
                            maxTags={20}
                            maxTagLength={20}
                            required={true}
                          />
                        )}

                        {/* Divider */}
                        <div className="h-0 relative shrink-0 w-full">
                          <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1018 1">
                              <line stroke="var(--stroke-0, #E1EBF9)" strokeLinecap="round" x1="0.5" x2="1017.5" y1="0.5" y2="0.5" />
                            </svg>
                          </div>
                        </div>

                        {/* 訊息文字區域 */}
                        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                          {messages.map((msg, index) => (
                            <div key={msg.id} className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                              {/* 標題行：訊息文字標籤 + 上下移動和刪除按鈕 */}
                              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                                {/* 左側：訊息文字標籤 */}
                                <div className="content-stretch flex flex-row gap-[2px] items-center relative shrink-0">
                                  <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] whitespace-nowrap shrink-0">訊息文字</p>
                                  <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#f44336] text-[16px] whitespace-nowrap shrink-0">*</p>
                                </div>

                                {/* 右側：上下移動和刪除按鈕 */}
                                <div className="flex items-center shrink-0">
                                  <button onClick={() => handleMoveUp(index)} disabled={index === 0} className={`box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0 transition-colors ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'}`}>
                                    <div className="flex items-center justify-center relative shrink-0 rotate-180">
                                      <svg className="size-[24px]" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                        <path d={svgPathsModal.p2b927b00} fill="var(--fill-0, #6E6E6E)" />
                                      </svg>
                                    </div>
                                  </button>
                                  <button onClick={() => handleMoveDown(index)} disabled={index === messages.length - 1} className={`box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0 transition-colors ${index === messages.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'}`}>
                                    <svg className="size-[24px]" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                      <path d={svgPathsModal.p2b927b00} fill="var(--fill-0, #6E6E6E)" />
                                    </svg>
                                  </button>
                                  <button onClick={() => handleDeleteMessage(index)} disabled={messages.length === 1} className={`box-border content-stretch flex gap-[10px] items-center p-[8px] relative rounded-[16px] shrink-0 transition-colors group ${messages.length === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#ffebee] active:bg-[#ffebee] cursor-pointer'}`}>
                                    <svg className="size-[32px]" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                      <g clipPath="url(#clip0_msg_delete)">
                                        <path d={svgPathsModal.pcbf700} fill="var(--fill-0, #6E6E6E)" className={messages.length === 1 ? '' : 'group-hover:fill-[#F44336] group-active:fill-[#F44336] transition-colors'} />
                                      </g>
                                      <defs>
                                        <clipPath id="clip0_msg_delete"><rect fill="white" height="32" width="32" /></clipPath>
                                      </defs>
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* 輸入區域 */}
                              <div className="content-stretch flex items-start relative shrink-0 w-full">
                                <div className="content-stretch flex flex-col gap-[2px] items-start min-h-px min-w-px relative shrink-0 w-full">
                                  <div className="bg-white min-h-[48px] relative rounded-[8px] shrink-0 w-full">
                                    <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                                    <div className="flex flex-col justify-center min-h-inherit size-full">
                                      <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[16px] relative w-full">
                                        {/* 顯示層：帶樣式的文本渲染 */}
                                        <div className="w-full min-h-[84px] relative">
                                          {/* 實際的 textarea（用於輸入） */}
                                          <textarea 
                                            ref={el => textareaRefs.current[msg.id] = el} 
                                            value={msg.text} 
                                            onChange={(e) => setMessages(messages.map((m, i) => i === index ? { ...m, text: e.target.value.slice(0, 100) } : m))} 
                                            placeholder="輸入訊息文字" 
                                            className={`w-full min-h-[84px] font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] border-none outline-none resize-none bg-transparent ${msg.text ? 'text-transparent caret-[#383838]' : 'placeholder:text-[#a8a8a8]'}`}
                                            rows={3} 
                                          />
                                          
                                          {/* 覆蓋層：顯示帶樣式的文本 */}
                                          {msg.text && (
                                            <div className="absolute inset-0 pointer-events-none font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] whitespace-pre-wrap break-words flex flex-wrap items-start content-start gap-[4px]">
                                              {msg.text.split(/(\{好友的顯示名稱\})/g).map((part, i) => {
                                                if (part === '{好友的顯示名稱}') {
                                                  return (
                                                    <span key={i} className="bg-[#FFFAF0] text-[#EBA20F] px-[4px] py-[2px] rounded-[8px] inline-block">
                                                      好友的顯示名稱
                                                    </span>
                                                  );
                                                }
                                                return part ? <span key={i}>{part}</span> : null;
                                              })}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-neutral-200 transition-colors" onClick={() => handleInsertVariable(index)}>
                                          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] text-center">好友的顯示名稱</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-[18px] relative w-full">
                                    <p className="absolute right-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#6e6e6e] text-[12px]">
                                      {msg.text.length}<span className="text-[#383838]">/100</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* 新增按鈕 */}
                          <div className="flex w-full">
                            <button onClick={handleAddMessage} disabled={messages.length >= 5} className={`bg-[#f0f6ff] box-border content-stretch flex gap-[4px] items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 transition-colors ${messages.length >= 5 ? 'opacity-50 cursor-not-allowed bg-neutral-100' : 'cursor-pointer hover:bg-[#e0eeff]'}`}>
                              <svg className="size-[16px]" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                <g clipPath="url(#clip0_add)">
                                  <path d={svgPathsModal.p3a3793c0} fill={messages.length >= 5 ? '#A0A0A0' : '#0F6BEB'} />
                                </g>
                                <defs>
                                  <clipPath id="clip0_add"><rect fill="white" height="16" width="16" /></clipPath>
                                </defs>
                              </svg>
                              <p className={`font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[16px] text-center ${messages.length >= 5 ? 'text-[#A0A0A0]' : 'text-[#0f6beb]'}`}>新增</p>
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
        </div>
      </main>
    </div>
  );
}