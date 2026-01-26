import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import svgPathsModal from "../imports/svg-9n0wtrekj3";
import KeywordTagsInput from './KeywordTagsInput';
import TriggerTimeOptions, { TriggerTimeType, ScheduleModeType } from './TriggerTimeOptions';
import { SimpleBreadcrumb, DeleteButton } from './common';
import { ChannelIcon } from './common/icons/ChannelIcon';
import { useAutoReplies, type AutoReply as AutoReplyRecord, type AutoReplyPayload, type AutoReplyConflict, type FbKeywordPayload, type FbMessagePayload } from '../contexts/AutoRepliesContext';

// 渠道選項介面（與群發訊息頁面一致）
interface ChannelOption {
  value: string;              // "LINE_xxx" 或 "FB_xxx"
  platform: 'LINE' | 'Facebook';
  channelId: string;          // LINE channel_id 或 FB page_id
  label: string;              // 渠道名稱
}

interface CreateAutoReplyProps {
  onBack: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  autoReplyId?: string | null;
  onSaved?: () => void;
  onDeleted?: () => void;
}

type ReplyType = 'welcome' | 'keyword' | 'follow';
type ChannelType = 'LINE' | 'Facebook';

interface MessageItem {
  id: number;       // 本地 UI 用的 id（用於 React key）
  text: string;
  fbId?: number;    // FB API 的 text id（用於編輯時區分編輯 vs 新增）
}

const INITIAL_SCHEDULE = {
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
};

const formatDateForInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
};

const normalizeDateForApi = (value?: string) => {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [yyyy, mm, dd] = parts;
  if (!yyyy || !mm || !dd) return null;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
};

export default function CreateAutoReplyInteractive({
  onBack,
  onNavigateToMessages,
  onNavigateToMembers,
  onNavigateToSettings,
  autoReplyId,
  onSaved,
  onDeleted,
}: CreateAutoReplyProps) {
  const { saveAutoReply, removeAutoReply, getAutoReplyById, fetchAutoReplyById } = useAutoReplies();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHydrating, setIsHydrating] = useState<boolean>(Boolean(autoReplyId));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [replyType, setReplyType] = useState<ReplyType>('welcome');
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('LINE');
  const [isEnabled, setIsEnabled] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>([{ id: 1, text: '' }]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [keywordTags, setKeywordTags] = useState<string[]>([]);
  const [triggerTime, setTriggerTime] = useState<TriggerTimeType>('immediate');
  const [scheduledDateTime, setScheduledDateTime] = useState(() => ({ ...INITIAL_SCHEDULE }));
  const [scheduleMode, setScheduleMode] = useState<ScheduleModeType>('time'); // 新增：日期或時間模式
  const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({});
  const isEditing = Boolean(autoReplyId);

  // 衝突對話框狀態
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState<AutoReplyConflict | null>(null);
  const [pendingPayload, setPendingPayload] = useState<AutoReplyPayload | null>(null);

  // 渠道選項狀態（動態從 API 獲取）
  const [channelOptions, setChannelOptions] = useState<ChannelOption[]>([]);
  const [selectedChannelValue, setSelectedChannelValue] = useState<string>('');

  const resetForm = useCallback(() => {
    setReplyType('welcome');
    setIsEnabled(true);
    setMessages([{ id: 1, text: '' }]);
    setKeywordTags([]);
    setTriggerTime('immediate');
    setScheduledDateTime({ ...INITIAL_SCHEDULE });
    setScheduleMode('time');
  }, []);

  // 獲取渠道列表（動態構建選項，與群發訊息頁面一致）
  useEffect(() => {
    const fetchChannels = async () => {
      const options: ChannelOption[] = [];
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      try {
        const [lineRes, fbRes] = await Promise.all([
          fetch('/api/v1/line_channels/current', { headers }),
          fetch('/api/v1/fb_channels', { headers })
        ]);

        if (lineRes.ok) {
          const lineChannel = await lineRes.json();
          if (lineChannel?.channel_id) {
            options.push({
              value: `LINE_${lineChannel.channel_id}`,
              platform: 'LINE',
              channelId: lineChannel.channel_id,
              label: lineChannel.channel_name || 'LINE 官方帳號',
            });
          }
        }

        if (fbRes.ok) {
          const fbChannels = await fbRes.json();
          if (Array.isArray(fbChannels)) {
            fbChannels.forEach((fb: { page_id: string; channel_name: string }) => {
              if (fb.page_id) {
                options.push({
                  value: `FB_${fb.page_id}`,
                  platform: 'Facebook',
                  channelId: fb.page_id,
                  label: fb.channel_name || 'Facebook 粉專',
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('渠道獲取失敗', e);
      }

      setChannelOptions(options);

      // 只有在非編輯模式且無已選擇值時，才自動選擇第一個選項
      // 編輯模式下由 hydrateFromRecord 設定正確的渠道
      if (options.length > 0 && !selectedChannelValue && !isEditing) {
        setSelectedChannelValue(options[0].value);
        setSelectedChannel(options[0].platform);
      }
    };

    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // 處理日期/時間模式切換，清空另一模式的值
  const handleScheduleModeChange = useCallback((mode: ScheduleModeType) => {
    setScheduleMode(mode);
    if (mode === 'date') {
      // 切換到日期模式，清空時間
      setScheduledDateTime(prev => ({
        ...prev,
        startTime: '',
        endTime: '',
      }));
    } else {
      // 切換到時間模式，清空日期
      setScheduledDateTime(prev => ({
        ...prev,
        startDate: '',
        endDate: '',
      }));
    }
  }, []);

  const hydrateFromRecord = useCallback((record: AutoReplyRecord) => {
    const normalizedType: ReplyType =
      record.triggerType === 'time' ? 'follow' : (record.triggerType as ReplyType);

    setReplyType(normalizedType);
    setIsEnabled(record.isActive);

    // 優先使用 messageObjects（包含 FB id），否則使用純字串
    const hydratedMessages = record.messageObjects?.length
      ? record.messageObjects.map((msg, index) => ({
          id: index + 1,
          text: msg.content,
          fbId: msg.id,  // 保留 FB API 的 text id
        }))
      : (record.messages.length ? record.messages : ['']).map((text, index) => ({
          id: index + 1,
          text,
        }));
    setMessages(hydratedMessages);
    setKeywordTags(record.keywords);

    // 設定渠道（如果記錄中有渠道信息，使用第一個；否則預設為 LINE）
    if (record.channels && record.channels.length > 0) {
      const channel = record.channels[0] as ChannelType;
      setSelectedChannel(channel);
      // 同時設定 selectedChannelValue，避免 fetchChannels 覆蓋
      // 使用 channelId 或 channel 構建 value（會在 fetchChannels 完成後同步）
      if (record.channelId) {
        const prefix = channel === 'Facebook' ? 'FB_' : 'LINE_';
        setSelectedChannelValue(`${prefix}${record.channelId}`);
      }
    } else {
      setSelectedChannel('LINE');
    }

    const hasSchedule =
      normalizedType === 'follow' &&
      (record.triggerTimeStart || record.triggerTimeEnd || record.dateRangeStart || record.dateRangeEnd);

    setTriggerTime(hasSchedule ? 'scheduled' : 'immediate');
    setScheduledDateTime({
      startDate: formatDateForInput(record.dateRangeStart),
      endDate: formatDateForInput(record.dateRangeEnd),
      startTime: record.triggerTimeStart ?? '',
      endTime: record.triggerTimeEnd ?? '',
    });

    // 根據現有資料決定 scheduleMode
    if (record.dateRangeStart || record.dateRangeEnd) {
      setScheduleMode('date');
    } else {
      setScheduleMode('time');
    }
  }, []);

  useEffect(() => {
    if (!isEditing || !autoReplyId) {
      resetForm();
      setIsHydrating(false);
      return;
    }

    const existing = getAutoReplyById(autoReplyId);
    if (existing) {
      hydrateFromRecord(existing);
      setIsHydrating(false);
      return;
    }

    setIsHydrating(true);
    fetchAutoReplyById(autoReplyId)
      .then((record) => {
        if (record) {
          hydrateFromRecord(record);
        }
      })
      .catch(() => null)
      .finally(() => setIsHydrating(false));
  }, [autoReplyId, isEditing, getAutoReplyById, fetchAutoReplyById, hydrateFromRecord, resetForm]);

  const replyTypeOptions: { value: ReplyType; label: string }[] = [
    { value: 'welcome', label: '歡迎訊息' },
    { value: 'keyword', label: '觸發關鍵字' },
    { value: 'follow', label: '一律回應' }
  ];

  const getReplyTypeLabel = (type: ReplyType) => {
    return replyTypeOptions.find(opt => opt.value === type)?.label || '';
  };

  const getChannelLabel = (channel: ChannelType) =>
    channelOptions.find(opt => opt.platform === channel)?.label || channel;

  const handleInsertVariable = (index: number) => {
    const target = messages[index];
    if (!target) return;
    const textarea = textareaRefs.current[target.id];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = target.text;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + '{好友的顯示名稱}' + after;

    if (newText.length <= 100) {
      setMessages(prev =>
        prev.map((msg, idx) => (idx === index ? { ...msg, text: newText } : msg))
      );

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
              <span key={i} className="bg-[#f0f6ff] text-[#0f6beb] px-[4px] py-[2px] rounded-[8px] inline-block">
                好友的顯示名稱
              </span>
            );
          }
          return part ? <span key={i}>{part}</span> : null;
        })}
      </span>
    );
  };

  // 檢查結果是否為衝突
  const isConflict = (result: unknown): result is AutoReplyConflict => {
    return typeof result === 'object' && result !== null && 'conflict' in result && (result as AutoReplyConflict).conflict === true;
  };

  const handleSave = async (forceActivate = false) => {
    if (isSaving) return;
    const trimmedMessages = messages
      .map((msg) => msg.text.trim())
      .filter((text) => text.length > 0);
    if (!trimmedMessages.length) {
      toast.error('請輸入訊息文字');
      return;
    }

    if (replyType === 'keyword' && keywordTags.length === 0) {
      toast.error('請至少新增一個關鍵字標籤');
      return;
    }

    const shouldSendSchedule = replyType === 'follow' && triggerTime === 'scheduled';
    if (shouldSendSchedule) {
      if (scheduleMode === 'date') {
        if (!scheduledDateTime.startDate || !scheduledDateTime.endDate) {
          toast.error('請設定完整的日期區間');
          return;
        }
      } else {
        if (!scheduledDateTime.startTime || !scheduledDateTime.endTime) {
          toast.error('請設定完整的時間區間');
          return;
        }
      }
    }

    const sendDateFields = shouldSendSchedule && scheduleMode === 'date';
    const sendTimeFields = shouldSendSchedule && scheduleMode === 'time';
    const channelId = channelOptions.find(opt => opt.value === selectedChannelValue)?.channelId;

    // 構建 FB 專用的帶 id 對象（用於編輯時區分編輯 vs 新增）
    const isFbEditing = isEditing && autoReplyId?.startsWith('fb-') && selectedChannel === 'Facebook';

    // 從 messages state 構建帶 fbId 的訊息對象
    const fbMessagesPayload: FbMessagePayload[] | undefined = isFbEditing
      ? messages
          .filter(m => m.text.trim())
          .map(m => ({
            ...(m.fbId ? { id: m.fbId } : {}),  // 有 fbId 才帶 id（編輯），無則不帶（新增）
            text: m.text.trim(),
            enabled: true,
          }))
      : undefined;

    // 從現有記錄的 keywordObjects 構建帶 id 的關鍵字對象
    const existingRecord = autoReplyId ? getAutoReplyById(autoReplyId) : null;
    const fbKeywordsPayload: FbKeywordPayload[] | undefined = isFbEditing && replyType === 'keyword'
      ? keywordTags.map(kw => {
          // 嘗試從現有記錄找到對應的 keyword id
          const existing = existingRecord?.keywordObjects?.find(ko => ko.keyword === kw);
          return existing?.id
            ? { id: existing.id, name: kw }  // 有 id = 編輯
            : { name: kw };                   // 無 id = 新增
        })
      : undefined;

    const payload: AutoReplyPayload = {
      name: `${getReplyTypeLabel(replyType)} - ${trimmedMessages[0].slice(0, 12) || '訊息'}`,
      triggerType: replyType,
      messages: trimmedMessages,
      keywords: replyType === 'keyword' ? keywordTags : [],
      isActive: isEnabled,
      triggerTimeStart: sendTimeFields ? scheduledDateTime.startTime || null : null,
      triggerTimeEnd: sendTimeFields ? scheduledDateTime.endTime || null : null,
      dateRangeStart: sendDateFields ? normalizeDateForApi(scheduledDateTime.startDate) : null,
      dateRangeEnd: sendDateFields ? normalizeDateForApi(scheduledDateTime.endDate) : null,
      channels: [selectedChannel],
      channelId: channelId,
      forceActivate,
      // FB 專用：帶 id 的對象陣列
      fbKeywords: fbKeywordsPayload,
      fbMessages: fbMessagesPayload,
    };

    setIsSaving(true);
    try {
      const result = await saveAutoReply(payload, autoReplyId ?? undefined);

      // 檢查是否有衝突
      if (isConflict(result)) {
        setConflictData(result);
        setPendingPayload(payload);
        setShowConflictDialog(true);
        setIsSaving(false);
        return;
      }

      onSaved?.();
      onBack();
    } catch {
      // 錯誤提示已由 context 處理
    } finally {
      setIsSaving(false);
    }
  };

  // 確認切換：停用舊的，啟用新的
  const handleConfirmSwitch = async () => {
    if (!pendingPayload) return;
    setShowConflictDialog(false);
    await handleSave(true);
  };

  // 保存但不啟用
  const handleSaveInactive = async () => {
    if (!pendingPayload) return;
    setShowConflictDialog(false);
    const inactivePayload = { ...pendingPayload, isActive: false };
    setIsSaving(true);
    try {
      await saveAutoReply(inactivePayload, autoReplyId ?? undefined);
      toast.success('自動回應已保存（停用狀態）');
      onSaved?.();
      onBack();
    } catch {
      // 錯誤提示已由 context 處理
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    let moved = false;
    setMessages(prev => {
      if (index >= prev.length) return prev;
      moved = true;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    if (moved) {
      toast.info('訊息已上移');
    }
  };

  const handleMoveDown = (index: number) => {
    let moved = false;
    setMessages(prev => {
      if (index >= prev.length - 1) return prev;
      moved = true;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    if (moved) {
      toast.info('訊息已下移');
    }
  };

  const handleDeleteMessage = (index: number) => {
    setMessages(prev => {
      if (prev.length === 1) {
        toast.error('至少需保留一則訊息');
        return prev;
      }
      const next = prev.filter((_, i) => i !== index);
      toast.success('訊息已刪除');
      return next;
    });
  };

  const handleAddMessage = () => {
    setMessages(prev => {
      if (prev.length >= 5) {
        toast.error('最多新增 5 則訊息');
        return prev;
      }
      const nextId = prev.length ? Math.max(...prev.map(m => m.id)) + 1 : 1;
      toast.success('已新增訊息');
      return [...prev, { id: nextId, text: '' }];
    });
  };

  // 刪除自動回應的實際操作（由 DeleteButton 調用）
  const handleDeleteAutoReply = async () => {
    if (!autoReplyId) return;

    setIsDeleting(true);
    try {
      await removeAutoReply(autoReplyId);
      onDeleted?.();
      onBack();
    } catch {
      // 錯誤已於 context 中處理
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex">
      <Sidebar 
        currentPage="auto-reply"
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToAutoReply={onBack}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToSettings={onNavigateToSettings}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
      />

      <main className={`flex-1 overflow-auto bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
        <div className="bg-slate-50 content-stretch flex flex-col items-start relative size-full">
          {isHydrating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <div className="flex flex-col items-center gap-2 text-sm text-[#383838]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0f6beb] border-r-transparent" />
                <span>載入自動回應...</span>
              </div>
            </div>
          )}
          {/* Breadcrumb */}
          <div className="relative shrink-0 w-full">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
                <SimpleBreadcrumb
                  items={[
                    { label: '自動回應', onClick: onBack },
                    { label: isEditing ? '編輯自動回應' : '建立自動回應', active: true },
                  ]}
                />
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
                      <p className="leading-[1.5] whitespace-pre">{isEditing ? '編輯自動回應' : '建立自動回應'}</p>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0">
                    {isEditing && autoReplyId && (
                      <DeleteButton
                        onDelete={handleDeleteAutoReply}
                        itemName="此自動回應"
                        title="確認刪除自動回應"
                        description="確定要刪除此自動回應嗎？刪除後將無法復原。"
                        disabled={isDeleting || isHydrating}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleSave()}
                      disabled={isSaving || isHydrating}
                      className={`bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 transition-colors ${
                        isSaving || isHydrating ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[#383838] active:bg-[#4a4a4a]'
                      }`}
                    >
                      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">
                        {isSaving ? '儲存中…' : '儲存'}
                      </p>
                    </button>
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
                        {/* 選擇回應平台 */}
                        <div className="content-stretch flex items-start relative shrink-0 w-full flex-col xl:flex-row gap-[8px] xl:gap-0">
                          <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0 w-full xl:w-auto">
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] whitespace-nowrap">選擇回應平台</p>
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#f44336] text-[16px] whitespace-nowrap">*</p>
                          </div>
                          <div className="basis-0 bg-white grow min-h-[48px] relative rounded-[8px] shrink-0 w-full xl:w-auto">
                            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                            <div className="flex flex-col justify-center min-h-inherit size-full">
                              <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[8px] relative w-full cursor-pointer" onClick={() => setIsChannelDropdownOpen(!isChannelDropdownOpen)}>
                                <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                                  {/* 顯示選中渠道的圖標和名稱 */}
                                  {channelOptions.length > 0 && selectedChannel ? (
                                    <>
                                      <ChannelIcon channel={selectedChannel} size={20} />
                                      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] whitespace-nowrap overflow-hidden text-ellipsis">{getChannelLabel(selectedChannel)}</p>
                                    </>
                                  ) : (
                                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] text-[#9e9e9e] text-[16px]">請先至基本設定連結渠道</p>
                                  )}
                                  <div className="relative shrink-0 size-[24px]">
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                      <path d={svgPathsModal.p2b927b00} fill="var(--fill-0, #6E6E6E)" />
                                    </svg>
                                  </div>
                                </div>
                                {isChannelDropdownOpen && channelOptions.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-100 rounded-[8px] shadow-lg z-10">
                                    {channelOptions.map(opt => (
                                      <div
                                        key={opt.value}
                                        className="py-[12px] px-[8px] hover:bg-slate-50 cursor-pointer flex items-center gap-[8px]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedChannelValue(opt.value);
                                          setSelectedChannel(opt.platform);
                                          if (opt.platform === 'Facebook' && replyType !== 'keyword') {
                                            setReplyType('keyword');
                                          }
                                          setIsChannelDropdownOpen(false);
                                        }}
                                      >
                                        <ChannelIcon channel={opt.platform} size={20} />
                                        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5] whitespace-nowrap">{opt.label}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

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
                                    {replyTypeOptions
                                      .filter(opt => selectedChannel !== 'Facebook' || opt.value === 'keyword')
                                      .map(opt => (
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
                              scheduleMode={scheduleMode}
                              onScheduleModeChange={handleScheduleModeChange}
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
                              {/* 標題行：訊息文字標籤 + 上下移動和刪按鈕 */}
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
                                        {/* 純文字輸入框 */}
                                        <textarea
                                          ref={el => (textareaRefs.current[msg.id] = el)}
                                          value={msg.text}
                                          onChange={(e) =>
                                            setMessages(prev =>
                                              prev.map((m, i) =>
                                                i === index ? { ...m, text: e.target.value.slice(0, 100) } : m
                                              )
                                            )
                                          }
                                          placeholder="輸入訊息文字"
                                          className="w-full min-h-[84px] font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] border-none outline-none resize-none bg-transparent placeholder:text-[#a8a8a8]"
                                          rows={3}
                                        />

                                        {selectedChannel !== 'Facebook' && (
                                          <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-neutral-200 transition-colors" onClick={() => handleInsertVariable(index)}>
                                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] text-center">好友的顯示名稱</p>
                                          </div>
                                        )}
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

      {/* 衝突對話框 */}
      {showConflictDialog && conflictData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[16px] p-[24px] max-w-[480px] w-full mx-4 shadow-xl">
            <h2 className="font-['Noto_Sans_TC:Regular',sans-serif] text-[20px] text-[#383838] mb-[16px]">
              {conflictData.conflictType === 'welcome'
                ? '系統目前已啟用中的歡迎訊息'
                : '日期區間衝突'}
            </h2>
            <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#6e6e6e] mb-[8px]">
              {conflictData.conflictType === 'welcome'
                ? `目前啟用的歡迎訊息：「${conflictData.existingName}」`
                : `與現有一律回應「${conflictData.existingName}」的日期區間重疊`}
            </p>
            {conflictData.existingDateRange && (
              <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[14px] text-[#a8a8a8] mb-[24px]">
                日期區間：{conflictData.existingDateRange}
              </p>
            )}
            <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#383838] mb-[24px]">
              是否切換至新的設定？
            </p>
            <div className="flex gap-[12px] justify-end">
              <button
                type="button"
                onClick={handleSaveInactive}
                className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[16px] py-[8px] rounded-[16px] cursor-pointer hover:bg-neutral-200 transition-colors"
              >
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[16px] text-[#383838]">
                  保存
                </p>
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                className="bg-[#0f6beb] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[16px] py-[8px] rounded-[16px] cursor-pointer hover:bg-[#0d5bc9] transition-colors"
              >
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[16px] text-white">
                  確認切換
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
