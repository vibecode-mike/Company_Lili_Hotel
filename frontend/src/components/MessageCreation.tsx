import { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, X, Copy, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group'; 
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogTrigger, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from './ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import svgPaths from '../imports/svg-jb10q6lg6b';
import { imgGroup, imgGroup1, imgGroup2, imgGroup3, imgGroup4, imgGroup5, imgGroup6 } from "../imports/StarbitLogoAssets";
import imgBackgroundImage from "figma:asset/d1c10d8dbfc2ae5783543c9f0b76cd2635713297.png";
import FilterModal from './FilterModal';
import closeIconPaths from '../imports/svg-b62f9l13m2';
import uploadIconPaths from '../imports/svg-wb8nmg8j6i';
import messageTextSvgPaths from '../imports/svg-hbkooryl5v';
import FlexMessageEditorNew from './flex-message/FlexMessageEditorNew';
import CarouselMessageEditor, { type CarouselCard } from './CarouselMessageEditor';
import { FacebookMessageEditor, FlexMessage as FBFlexMessage } from './facebook-message';
import { TriggerImagePreview, TriggerTextPreview, GradientPreviewContainer, DeleteButton } from './common';
import ActionTriggerTextMessage from '../imports/ActionTriggerTextMessage';
import ActionTriggerImageMessage from '../imports/ActionTriggerImageMessage';
import Sidebar from './Sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { ScheduleSettings, TargetAudienceSelector, PreviewPanel } from './message-creation';
import type { Tag } from './message-creation';
import { useMessages } from '../contexts/MessagesContext';
import { CAROUSEL_STRUCTURE_FIELDS } from './carouselStructure';
import type { FlexMessage, FlexBubble } from '../types/api';
import type { MessagePlatform } from '../types/channel';
import { ChannelIcon } from './common/icons/ChannelIcon';

// FB 預設圖片佔位符
const FB_PLACEHOLDER_IMAGE = "/images/fb-placeholder.png";

// FB 群發單次發送人數上限
const FB_BROADCAST_MAX_RECIPIENTS = 1000;

// Custom DialogContent without close button
function DialogContentNoClose({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const cn = (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ');
  };
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow-lg duration-200",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

// 渠道選項型別（用於平台選擇下拉選單）
interface ChannelOption {
  value: string;           // 唯一識別碼 (e.g., "LINE_123" or "FB_456")
  platform: 'LINE' | 'Facebook';
  channelId: string;       // LINE channel_id 或 FB page_id
  label: string;           // 顯示名稱
  disabled: boolean;
}

interface MessageCreationProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onNavigateToSettings?: () => void;
  editMessageId?: string | null;
  editMessageData?: {
    title: string;
    notificationMsg: string;
    scheduleType: string;
    targetType: string;
    templateType: string;
    platform?: MessagePlatform;
    channelId?: string | null; // LINE channel_id 或 FB page_id
    flexMessageJson?: FlexMessage;
    selectedFilterTags?: Array<{ id: string; name: string }>;
    filterCondition?: 'include' | 'exclude';
    scheduledDate?: Date;
    scheduledTime?: { hours: string; minutes: string };
  };
  /** 刪除訊息回調（僅在編輯已排程或草稿時顯示刪除按鈕） */
  onDelete?: () => Promise<void> | void;
}

export default function MessageCreation({ onBack, onNavigate, onNavigateToSettings, editMessageId, editMessageData, onDelete }: MessageCreationProps = {}) {
  // Get quota status and refreshAll from MessagesContext
  const { quotaStatus, quotaLoading, quotaError, refreshAll } = useMessages();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [templateType, setTemplateType] = useState('select');
  const [title, setTitle] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [targetType, setTargetType] = useState('all');
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [flexMessageJson, setFlexMessageJson] = useState<FlexMessage | null>(null);
  const [fbMessageJson, setFbMessageJson] = useState<FBFlexMessage | null>(null);
  const [selectedFilterTags, setSelectedFilterTags] = useState<Array<{ id: string; name: string }>>([]);
  const [filterCondition, setFilterCondition] = useState<'include' | 'exclude'>('include');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState({ hours: '12', minutes: '00' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<MessagePlatform>('LINE');
  // 渠道選項狀態（動態從 API 獲取）
  const [channelOptions, setChannelOptions] = useState<ChannelOption[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  // 個別欄位錯誤狀態
  const [titleError, setTitleError] = useState('');
  const [notificationMsgError, setNotificationMsgError] = useState('');

  // 卡片欄位錯誤狀態 - 使用 Map 以卡片 ID 為 key
  const [cardErrors, setCardErrors] = useState<Map<number, {
    image?: string;
    cardTitle?: string;
    content?: string;
    price?: string;
    button1?: string;
    button1Url?: string;
    button2?: string;
    button2Url?: string;
    button3?: string;
    button3Url?: string;
    button4?: string;
    button4Url?: string;
  }>>(new Map());
  const [isDirty, setIsDirty] = useState(false); // 追蹤是否有未儲存的變更
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false); // 顯示未儲存確認對話框
  const [showFbLimitDialog, setShowFbLimitDialog] = useState(false); // 顯示 FB 發送人數上限提示
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null); // 待執行的導航
  const [estimatedRecipientCount, setEstimatedRecipientCount] = useState<number | null>(null); // 預計發送人數
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // 獲取可用渠道列表
  useEffect(() => {
    const fetchChannels = async () => {
      const options: ChannelOption[] = [];
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // 獲取 LINE 頻道
      try {
        const lineRes = await fetch('/api/v1/line_channels/current', { headers });
        if (lineRes.ok) {
          const lineChannel = await lineRes.json();
          if (lineChannel?.channel_id) {
            options.push({
              value: `LINE_${lineChannel.channel_id}`,
              platform: 'LINE',
              channelId: lineChannel.channel_id,
              label: lineChannel.channel_name || 'LINE 官方帳號',
              disabled: false
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch LINE channel:', error);
      }

      // 獲取 Facebook 粉專
      try {
        const fbRes = await fetch('/api/v1/fb_channels', { headers });
        if (fbRes.ok) {
          const fbChannels = await fbRes.json();
          fbChannels.forEach((fb: { page_id: string; channel_name: string; is_active: boolean }) => {
            if (fb.page_id) {
              options.push({
                value: `FB_${fb.page_id}`,
                platform: 'Facebook',
                channelId: fb.page_id,
                label: fb.channel_name || 'Facebook 粉專',
                disabled: false
              });
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch FB channels:', error);
      }

      setChannelOptions(options);

      // 預設選中第一個渠道（僅在新建時，非編輯模式）
      // 編輯模式會由渠道還原 useEffect 處理
      if (options.length > 0 && !selectedChannel && !editMessageData?.channelId) {
        setSelectedChannel(options[0].value);
        setSelectedPlatform(options[0].platform);
      }
    };

    fetchChannels();
  }, [editMessageData?.channelId]);

  // Monitor flexMessageJson changes
  useEffect(() => {
    // Flex Message JSON is ready for use
  }, [flexMessageJson]);

  // Fetch estimated recipient count when target settings or platform change
  // Triggers on: initial mount (LINE default), page refresh, or platform selection change
  useEffect(() => {
    let isActive = true;

    const fetchCount = async () => {
      // LINE 渠道 - 使用 Python backend quota API
      if (selectedPlatform === 'LINE') {
        try {
          const requestBody: Record<string, unknown> = {
            target_type: targetType === 'all' ? 'all_friends' : 'filtered'
          };

          if (targetType === 'filtered' && selectedFilterTags.length > 0) {
            requestBody.target_filter = {
              [filterCondition]: selectedFilterTags.map(t => t.name)
            };
          }

          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          const token = localStorage.getItem('auth_token');
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch('/api/v1/messages/quota', {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
          });

          if (!isActive) return;

          if (response.ok) {
            const result = await response.json();
            setEstimatedRecipientCount(result.estimated_send_count ?? 0);
          } else {
            setEstimatedRecipientCount(0);
          }
        } catch {
          if (isActive) {
            setEstimatedRecipientCount(0);
          }
        }
      }
      // Facebook 渠道 - 使用外部 API (tags/amount)
      else if (selectedPlatform === 'Facebook') {
        try {
          const fbApiBaseUrl = (import.meta.env.VITE_FB_API_URL?.trim() || 'https://api-youth-tycg.star-bit.io').replace(/\/+$/, '');
          const jwtToken = localStorage.getItem('jwt_token');

          // 取得當前選中的 FB 渠道的 page_id
          const selectedOption = channelOptions.find(opt => opt.value === selectedChannel);
          const pageId = selectedOption?.channelId;

          // 構建查詢參數
          const params = new URLSearchParams();

          // 加入 page_id 參數
          if (pageId) {
            params.set('page_id', pageId);
          }

          if (targetType === 'filtered' && selectedFilterTags.length > 0) {
            const tagNames = selectedFilterTags.map(t => t.name).join(',');
            if (filterCondition === 'include') {
              params.set('tag_include', tagNames);
            } else {
              params.set('tag_exclude', tagNames);
            }
          }

          const queryString = params.toString();
          const url = `${fbApiBaseUrl}/api/v1/admin/meta_page/tags/amount${queryString ? '?' + queryString : ''}`;

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
            },
          });

          if (!isActive) return;

          if (response.ok) {
            const result = await response.json();
            setEstimatedRecipientCount(result.data ?? 0);
          } else {
            setEstimatedRecipientCount(0);
          }
        } catch {
          if (isActive) {
            setEstimatedRecipientCount(0);
          }
        }
      }
      // 其他渠道 (Webchat 等) - 暫不支援
      else {
        setEstimatedRecipientCount(0);
      }
    };

    fetchCount();

    return () => {
      isActive = false;
    };
  }, [selectedPlatform, targetType, selectedFilterTags, filterCondition, selectedChannel, channelOptions]);

  const button1TriggerImageInputRef = useRef<HTMLInputElement>(null);
  const button2TriggerImageInputRef = useRef<HTMLInputElement>(null);
  
  // Card states
  const [cards, setCards] = useState<CarouselCard[]>([
    {
      id: 1,
      enableImage: true,
      enableTitle: true,
      enableContent: true,
      enablePrice: false,
      enableButton1: false,
      enableButton2: false,
      enableButton3: false,
      enableButton4: false,
      image: '',
      cardTitle: '',
      content: '',
      price: '',
      currency: 'ntd',
      button1: '',
      button2: '',
      button3: '',
      button4: '',
      button1Action: 'uri',
      button1Url: '',
      button1Tag: '',
      button1Text: '',
      button1TriggerImage: null,
      button1TriggerImageUrl: '',
      button1Mode: 'primary',
      button2Action: 'uri',
      button2Url: '',
      button2Tag: '',
      button2Text: '',
      button2TriggerImage: null,
      button2TriggerImageUrl: '',
      button2Mode: 'secondary',
      button3Action: 'uri',
      button3Url: '',
      button3Tag: '',
      button3Text: '',
      button3TriggerImage: null,
      button3TriggerImageUrl: '',
      button3Mode: 'secondary',
      button4Action: 'uri',
      button4Url: '',
      button4Tag: '',
      button4Text: '',
      button4TriggerImage: null,
      button4TriggerImageUrl: '',
      button4Mode: 'secondary',
      enableImageUrl: false,
      imageUrl: '',
      imageTag: ''
    }
  ]);

  const currentCard = cards.find(c => c.id === activeTab) || cards[0];

  // Handle platform change with content conversion
  const handlePlatformChange = (newPlatform: MessagePlatform) => {
    if (selectedPlatform === newPlatform) return;
    if (newPlatform === 'Facebook') {
      // Facebook 不支援排程發送，強制設為立即發送
      setScheduleType('immediate');
    }
    setSelectedPlatform(newPlatform);
  };

  // Handle channel selection change
  const handleChannelChange = (value: string) => {
    const selected = channelOptions.find(opt => opt.value === value);
    if (selected) {
      setSelectedChannel(value);
      handlePlatformChange(selected.platform);
    }
  };

  const updateCard = (updates: Partial<CarouselCard>) => {
    setCards(prevCards => {
      if (prevCards.length === 0) {
        return prevCards;
      }

      const masterCardId = prevCards[0].id;

      const nextCards = prevCards.map(card =>
        card.id === activeTab ? { ...card, ...updates } : card
      );

      if (activeTab === masterCardId) {
        const masterCard = nextCards.find(card => card.id === masterCardId);
        if (!masterCard) {
          return nextCards;
        }

        return nextCards.map(card => {
          if (card.id === masterCardId) {
            return card;
          }

          const updatedCard: CarouselCard = { ...card };
          CAROUSEL_STRUCTURE_FIELDS.forEach((field) => {
            (updatedCard as any)[field] = (masterCard as any)[field];
          });
          return updatedCard;
        });
      }

      return nextCards;
    });
  };

  // Load edit message data when editMessageData changes
  useEffect(() => {
    if (!editMessageData) return;

    // ========== 步驟 1：始終還原基本欄位（不依賴 flexMessageJson）==========
    setTitle(editMessageData.title || '');
    setNotificationMsg(editMessageData.notificationMsg || '');
    setScheduleType(editMessageData.scheduleType || 'immediate');
    setTargetType(editMessageData.targetType || 'all');
    setSelectedFilterTags(editMessageData.selectedFilterTags || []);
    setFilterCondition(editMessageData.filterCondition || 'include');
    setTemplateType(editMessageData.templateType || 'carousel');

    // ✅ 還原平台（渠道由獨立 useEffect 處理，等待 channelOptions 載入）
    const platform = (editMessageData.platform as MessagePlatform) || 'LINE';
    setSelectedPlatform(platform);

    if (editMessageData.scheduledDate) {
      setScheduledDate(editMessageData.scheduledDate);
    }
    if (editMessageData.scheduledTime) {
      setScheduledTime(editMessageData.scheduledTime);
    }

    // ========== 步驟 2：只有當 flexMessageJson 存在時才還原卡片 ==========
    if (editMessageData.flexMessageJson) {
      try {
        const flexJson = editMessageData.flexMessageJson;

        // Parse flexMessageJson to extract card data
        const parseFlexMessageToCards = (flexData: any) => {
          const newCards: typeof cards = [];

          if (flexData.type === 'carousel' && flexData.contents) {
            // Multiple cards (carousel)
            flexData.contents.forEach((bubble: any, index: number) => {
              const card = parseBubbleToCard(bubble, index + 1);
              newCards.push(card);
            });
          } else if (flexData.type === 'bubble') {
            // Single card
            const card = parseBubbleToCard(flexData, 1);
            newCards.push(card);
          }

          return newCards.length > 0 ? newCards : cards;
        };

        const parseBubbleToCard = (bubble: any, id: number) => {
          const card: any = {
            id,
            enableImage: false,
            enableTitle: false,
            enableContent: false,
            enablePrice: false,
            enableButton1: false,
            enableButton2: false,
            enableButton3: false,
            enableButton4: false,
            image: '',
            cardTitle: '',
            content: '',
            price: '',
            currency: 'ntd',
            button1: '',
            button2: '',
            button3: '',
            button4: '',
            button1Action: 'uri',
            button1Url: '',
            button1Tag: '',
            button1Text: '',
            button1TriggerImage: null,
            button1TriggerImageUrl: '',
            button1Mode: 'primary' as const,
            button2Action: 'uri',
            button2Url: '',
            button2Tag: '',
            button2Text: '',
            button2TriggerImage: null,
            button2TriggerImageUrl: '',
            button2Mode: 'secondary' as const,
            button3Action: 'uri',
            button3Url: '',
            button3Tag: '',
            button3Text: '',
            button3TriggerImage: null,
            button3TriggerImageUrl: '',
            button3Mode: 'secondary' as const,
            button4Action: 'uri',
            button4Url: '',
            button4Tag: '',
            button4Text: '',
            button4TriggerImage: null,
            button4TriggerImageUrl: '',
            button4Mode: 'secondary' as const,
            enableImageUrl: false,
            imageUrl: '',
            imageTag: ''
          };

          // Parse hero image
          if (bubble.hero && bubble.hero.url) {
            card.enableImage = true;
            card.image = bubble.hero.url;

            if (bubble.hero.action && bubble.hero.action.type === 'uri' && bubble.hero.action.uri) {
              card.enableImageUrl = true;
              card.imageUrl = bubble.hero.action.uri;
            }
          }

          // Parse body contents
          if (bubble.body && bubble.body.contents) {
            bubble.body.contents.forEach((item: any) => {
              if (item.type === 'text') {
                if (item.weight === 'bold' || item.size === 'xl' || item.size === 'lg') {
                  // Title
                  card.enableTitle = true;
                  card.cardTitle = item.text;
                } else if (item.text && item.text.includes('NT$')) {
                  // Price
                  card.enablePrice = true;
                  card.price = item.text.replace(/[^0-9]/g, '');
                  card.currency = 'ntd';
                } else {
                  // Content
                  card.enableContent = true;
                  card.content = item.text;
                }
              }
            });
          }

          // Parse footer buttons
          if (bubble.footer && bubble.footer.contents) {
            bubble.footer.contents.forEach((item: any, btnIndex: number) => {
              if (item.type === 'button' && btnIndex < 4) {
                const buttonNum = btnIndex + 1;
                card[`enableButton${buttonNum}`] = true;

                // ✅ 修復：同時賦值給 button{N} 和 button{N}Text
                const buttonLabel = item.action.label || '';
                card[`button${buttonNum}`] = buttonLabel;
                card[`button${buttonNum}Text`] = buttonLabel;

                // ✅ 修復：正確映射 action 類型
                if (item.action.type === 'uri') {
                  card[`button${buttonNum}Action`] = 'uri';
                  card[`button${buttonNum}Url`] = item.action.uri || '';
                } else if (item.action.type === 'message') {
                  card[`button${buttonNum}Action`] = 'message';
                  card[`button${buttonNum}Text`] = item.action.text || buttonLabel;
                } else if (item.action.type === 'postback') {
                  card[`button${buttonNum}Action`] = 'postback';
                  card[`button${buttonNum}Url`] = item.action.data || '';
                }

                // ✅ 修復：完整解析 button mode (支持 primary/secondary/link)
                card[`button${buttonNum}Mode`] =
                  item.style === 'primary' ? 'primary' :
                  item.style === 'link' ? 'link' :
                  'secondary';
              }
            });
          }

          const interactionMeta = bubble._metadata?.interactionTags || (bubble._metadata as any)?.interaction_tags;
          if (interactionMeta) {
            if (interactionMeta.heroTag) {
              card.imageTag = interactionMeta.heroTag;
            }
            if (Array.isArray(interactionMeta.buttonTags)) {
              interactionMeta.buttonTags.forEach((tag: string | null | undefined, index: number) => {
                const buttonIndex = index + 1;
                if (buttonIndex >= 1 && buttonIndex <= 4) {
                  const tagKey = `button${buttonIndex}Tag` as keyof typeof card;
                  card[tagKey] = tag || '';
                }
              });
            }
          }

          return card;
        };

        const parsedCards = parseFlexMessageToCards(flexJson);
        setCards(parsedCards);
        setFlexMessageJson(flexJson);

      } catch (error) {
        console.error('❌ Error parsing flex message:', error);
        // 即使解析失敗，基本欄位也已經還原了
      }
    }
  }, [editMessageData]);

  // ✅ 獨立處理渠道還原（等待 channelOptions 載入後）
  useEffect(() => {
    if (!editMessageData?.channelId || channelOptions.length === 0) return;

    const platform = (editMessageData.platform as MessagePlatform) || 'LINE';
    const prefix = platform === 'Facebook' ? 'FB' : 'LINE';
    const restoredChannel = `${prefix}_${editMessageData.channelId}`;

    // 確認該渠道存在於選項中
    const matchedOption = channelOptions.find(opt => opt.value === restoredChannel);
    if (matchedOption) {
      setSelectedChannel(restoredChannel);
      setSelectedPlatform(matchedOption.platform);
    }
  }, [editMessageData, channelOptions]);

  // 監聽表單變更，標記為未儲存
  useEffect(() => {
    if (
      title ||
      notificationMsg ||
      messageText ||
      targetType !== 'all' ||
      scheduleType !== 'immediate' ||
      selectedFilterTags.length > 0 ||
      cards.some(card =>
        card.enableImage ||
        card.enableTitle ||
        card.enableContent ||
        card.enablePrice ||
        card.enableButton1 ||
        card.enableButton2 ||
        card.enableButton3 ||
        card.enableButton4 ||
        card.image ||
        card.cardTitle ||
        card.content ||
        card.price ||
        card.button1 ||
        card.button2 ||
        card.button3 ||
        card.button4
      )
    ) {
      setIsDirty(true);
    }
  }, [title, notificationMsg, messageText, targetType, scheduleType, selectedFilterTags, cards]);

  // Note: Trigger images removed - buttons now only support URI action type

  const addCarousel = () => {
    if (cards.length < 10) {
      const newId = Math.max(...cards.map(c => c.id)) + 1;
      // Copy the enabled state from the first card to maintain consistent structure
      const firstCard = cards[0];
      setCards([...cards, { 
        id: newId, 
        enableImage: firstCard.enableImage,
        enableTitle: firstCard.enableTitle,
        enableContent: firstCard.enableContent,
        enablePrice: firstCard.enablePrice,
        enableButton1: firstCard.enableButton1,
        enableButton2: firstCard.enableButton2,
        enableButton3: firstCard.enableButton3,
        enableButton4: firstCard.enableButton4,
        image: '', 
        cardTitle: '', 
        content: '', 
        price: '', 
        currency: firstCard.currency,
        button1: '', 
        button2: '',
        button3: '',
        button4: '',
        button1Action: firstCard.button1Action, 
        button1Url: '', 
        button1Tag: '', 
        button1Text: '',
        button1TriggerImage: null as File | null,
        button1Mode: firstCard.button1Mode,
        button2Action: firstCard.button2Action,
        button2Url: '',
        button2Tag: '',
        button2Text: '',
        button2TriggerImage: null as File | null,
        button2Mode: firstCard.button2Mode,
        button3Action: firstCard.button3Action,
        button3Url: '',
        button3Tag: '',
        button3Text: '',
        button3TriggerImage: null as File | null,
        button3Mode: firstCard.button3Mode,
        button4Action: firstCard.button4Action,
        button4Url: '',
        button4Tag: '',
        button4Text: '',
        button4TriggerImage: null as File | null,
        button4Mode: firstCard.button4Mode,
        enableImageUrl: false,
        imageUrl: '',
        imageTag: ''
      }]);
      setActiveTab(newId);
      toast.success('已新增輪播');
    } else {
      toast.error('最多可新增10個輪播');
    }
  };

  const deleteCard = () => {
    if (cards.length > 1) {
      const currentIndex = cards.findIndex(c => c.id === activeTab);
      const newCards = cards.filter(c => c.id !== activeTab);

      // 智能切換邏輯
      let newActiveTab: number;
      if (currentIndex < newCards.length) {
        // 如果有下一張，切換到下一張（索引位置相同）
        newActiveTab = newCards[currentIndex].id;
      } else if (currentIndex > 0) {
        // 如果沒有下一張，切換到前一張
        newActiveTab = newCards[currentIndex - 1].id;
      } else {
        // 保護：切換到第一張
        newActiveTab = newCards[0].id;
      }

      setCards(newCards);
      setActiveTab(newActiveTab);
      toast.success('已刪除輪播');
    } else {
      toast.error('至少需保留一個輪播');
    }
  };

  const scrollToCard = (cardId: number) => {
    const cardElement = cardRefs.current[cardId];
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleButton1TriggerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('檔案格式錯誤，請上傳 JPG、JPEG 或 PNG 格式的圖片');
        return;
      }
      
      // Validate file size (1MB = 1048576 bytes)
      if (file.size > 1048576) {
        toast.error('圖片大小超過 1 MB，請選擇較小的圖片');
        return;
      }
      
      updateCard({ button1TriggerImage: file });
      toast.success('已選擇觸發圖片');
    }
  };

  const handleButton2TriggerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('檔案格式錯誤，請上傳 JPG、JPEG 或 PNG 格式的圖片');
        return;
      }
      
      // Validate file size (1MB = 1048576 bytes)
      if (file.size > 1048576) {
        toast.error('圖片大小超過 1 MB，請選擇較小的圖');
        return;
      }
      
      updateCard({ button2TriggerImage: file });
      toast.success('已選擇觸發圖片');
    }
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    // Find which card is closest to the center
    let closestCard = cards[0].id;
    let closestDistance = Infinity;

    cards.forEach((card) => {
      const cardElement = cardRefs.current[card.id];
      if (cardElement) {
        const cardRect = cardElement.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(cardCenter - containerCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestCard = card.id;
        }
      }
    });

    // Only update if the closest card has changed
    if (closestCard !== activeTab) {
      setActiveTab(closestCard);
    }
  };

  const handleSaveDraft = async () => {
    // 使用與發布相同的完整驗證邏輯
    const isValid = validateForm();
    if (!isValid) {
      toast.error('請修正表單錯誤後再儲存草稿');
      return;
    }

    try {
      // LINE 平台需要上傳圖片，Facebook 平台跳過
      let flexMessage = null;
      if (selectedPlatform === 'LINE') {
        // 批量上傳裁切後的圖片
        const uploadSuccess = await uploadCroppedImages();
        if (!uploadSuccess) {
          return; // 上傳失敗，已經顯示錯誤訊息
        }
        // Generate flex message JSON from cards (使用 uploadedImageUrl)
        flexMessage = generateFlexMessage(cards);
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('請先登入');
        return;
      }

      // 取得選中渠道的 ID
      const selectedChannelOption = channelOptions.find(opt => opt.value === selectedChannel);
      const channelId = selectedChannelOption?.channelId || null;

      console.log('[handleSaveDraft] 保存草稿:', {
        selectedChannel,
        selectedChannelOption,
        channelId,
        selectedPlatform
      });

      // Prepare request body for draft
      const requestBody: any = {
        target_type: targetType === 'all' ? 'all_friends' : 'filtered',
        schedule_type: 'draft',  // ✅ 必填欄位：固定為 draft
        notification_message: notificationMsg,
        message_title: title || notificationMsg || '未命名訊息',
        platform: selectedPlatform,
        channel_id: channelId,  // LINE channel_id 或 FB page_id
        thumbnail: cards[0]?.uploadedImageUrl || cards[0]?.image || null,
        interaction_tags: collectInteractionTags(),
      };

      // 根據平台設置對應的 JSON 欄位
      if (selectedPlatform === 'Facebook') {
        if (!fbMessageJson) {
          toast.error('請先編輯 Facebook 訊息內容');
          return;
        }
        requestBody.fb_message_json = JSON.stringify(fbMessageJson);
        // Facebook 平台也需要 flex_message_json（後端 required）
        requestBody.flex_message_json = JSON.stringify({ type: 'bubble', body: { type: 'box', layout: 'vertical', contents: [] } });
      } else {
        requestBody.flex_message_json = JSON.stringify(flexMessage);
      }

      // Add target filter for filtered audience
      if (targetType === 'filtered' && selectedFilterTags.length > 0) {
        requestBody.target_filter = {
          [filterCondition]: selectedFilterTags.map(t => t.name)
        };
      }

      // ✅ 添加排程時間邏輯
      if (scheduleType === 'scheduled' && scheduledDate) {
        const year = scheduledDate.getFullYear();
        const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
        const day = String(scheduledDate.getDate()).padStart(2, '0');
        const scheduledDateTimeString = `${year}-${month}-${day} ${scheduledTime.hours}:${scheduledTime.minutes}:00`;
        requestBody.scheduled_at = scheduledDateTimeString;
      } else if (scheduleType === 'immediate') {
        // 立即發送模式，清空排程時間
        requestBody.scheduled_at = null;
      }

      // Determine if this is a new draft or updating existing draft
      const isUpdate = !!editMessageId;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate ? `/api/v1/messages/${editMessageId}` : '/api/v1/messages';

      console.log('[handleSaveDraft] 發送到後端:', { method, url, requestBody });

      // Create or update draft message
      const saveResponse = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({ detail: '儲存草稿失敗' }));
        console.error('❌ [Save Draft] API Error:', {
          status: saveResponse.status,
          statusText: saveResponse.statusText,
          errorData
        });
        toast.error(errorData.detail || '儲存草稿失敗');
        return;
      }

      const responseData = await saveResponse.json();

      // Show appropriate success message
      toast.success(isUpdate ? '草稿已更新' : '草稿已儲存');
      setIsDirty(false); // 儲存後清除未儲存標記

      // Refresh all data (messages list + quota status)
      await refreshAll();

      // Navigate back to message list immediately
      if (onNavigate) {
        onNavigate('message-list');
      }

    } catch (error) {
      console.error('❌ [Save Draft] Exception:', error);
      toast.error('儲存草稿失敗，請檢查網絡連接');
    }
  };

  const validateForm = (): boolean => {
    // 清除所有錯誤
    setTitleError('');
    setNotificationMsgError('');
    setCardErrors(new Map());

    let hasError = false;

    // ✅ 群發訊息類型：title 為必填欄位
    // ✅ notificationMsg 只對 LINE 平台必填（Facebook 沒有此功能）
    // ✅ UI 已經有即時錯誤提示（紅色邊框 + 錯誤文字），不需要在這裡重複設置錯誤訊息
    if (!title || title.trim() === '') {
      hasError = true;
    }

    // 只有 LINE 平台才驗證 notificationMsg
    if (selectedPlatform === 'LINE' && (!notificationMsg || notificationMsg.trim() === '')) {
      hasError = true;
    }

    // Facebook 平台跳過卡片驗證（使用獨立編輯器）
    if (selectedPlatform === 'Facebook') {
      // Facebook 只需要有 fbMessageJson (Flex 格式)
      if (!fbMessageJson) {
        toast.error('請先編輯 Facebook 訊息內容');
        return false;
      }

      // 取得 bubbles 列表 (Flex 格式：carousel 有 contents，bubble 本身就是單一卡片)
      let bubbles: any[] = [];
      if (fbMessageJson.type === 'carousel' && fbMessageJson.contents) {
        bubbles = fbMessageJson.contents;
      } else if (fbMessageJson.type === 'bubble') {
        bubbles = [fbMessageJson];
      }

      if (bubbles.length === 0) {
        toast.error('請先編輯 Facebook 訊息內容');
        return false;
      }

      // 驗證每個 bubble 是否有標題 (body 中 size="xl" 或 weight="bold" 的文字)
      const invalidIndex = bubbles.findIndex((bubble: any) => {
        const bodyContents = bubble?.body?.contents || [];
        const titleItem = bodyContents.find((item: any) =>
          item?.type === 'text' && (item?.size === 'xl' || item?.weight === 'bold')
        );
        const title = String(titleItem?.text ?? '').trim();
        return title === '';
      });
      if (invalidIndex !== -1) {
        toast.error(`Facebook 模板第 ${invalidIndex + 1} 個卡片：標題文字為必填`);
        return false;
      }

      // 驗證內文文字說明（若勾選但未填寫）
      const invalidSubtitleIndex = bubbles.findIndex((bubble: any) => {
        const bodyContents = bubble?.body?.contents || [];
        // 找到 subtitle 元素（size="sm" 且 color="#666666"）
        const subtitleItem = bodyContents.find((item: any) =>
          item?.type === 'text' && item?.size === 'sm' && item?.color === '#666666'
        );
        // 如果有 subtitle 元素，檢查內容是否為空或為預設值
        if (subtitleItem) {
          const subtitleText = String(subtitleItem?.text ?? '').split('\n')[0].trim();
          return subtitleText === '' || subtitleText === '內文文字說明';
        }
        return false;
      });
      if (invalidSubtitleIndex !== -1) {
        toast.error(`Facebook 模板第 ${invalidSubtitleIndex + 1} 個卡片：請輸入內文文字說明`);
        return false;
      }

      // 驗證每個 bubble 的欄位（圖片、按鈕等）
      for (let bubbleIndex = 0; bubbleIndex < bubbles.length; bubbleIndex++) {
        const bubble = bubbles[bubbleIndex];
        const cardNum = bubbleIndex + 1;

        // 1. 驗證圖片：若啟用但未上傳
        if (bubble.hero) {
          const heroUrl = bubble.hero.url || '';
          if (heroUrl.startsWith('figma:') || !heroUrl) {
            toast.error(`Facebook 模板第 ${cardNum} 個卡片：已勾選圖片但尚未上傳`);
            return false;
          }

          // 2. 驗證圖片點擊動作：若啟用 URL 類型但未填寫
          if (bubble.hero.action) {
            const actionType = bubble._metadata?.heroActionType || 'url';
            const actionUrl = bubble.hero.action.uri || '';

            if (actionType === 'url' && (!actionUrl || actionUrl === 'https://example.com')) {
              toast.error(`Facebook 模板第 ${cardNum} 個卡片：已勾選點擊圖片觸發 URL 但尚未填寫網址`);
              return false;
            }
          }
        }

        // 3. 驗證按鈕：若有按鈕但相關欄位未填寫
        const buttons = bubble.footer?.contents?.filter((c: any) => c.type === 'button') || [];
        for (let btnIndex = 0; btnIndex < buttons.length; btnIndex++) {
          const button = buttons[btnIndex];
          const buttonType = bubble._metadata?.buttonTypes?.[btnIndex] || 'url';
          const buttonLabel = button.action?.label || '';

          if (!buttonLabel.trim()) {
            toast.error(`Facebook 模板第 ${cardNum} 個卡片：按鈕 ${btnIndex + 1} 請輸入按鈕文字`);
            return false;
          }

          if (buttonType === 'url') {
            const buttonUrl = button.action?.uri || '';
            if (!buttonUrl || buttonUrl === 'https://example.com') {
              toast.error(`Facebook 模板第 ${cardNum} 個卡片：按鈕 ${btnIndex + 1} 請輸入連結網址`);
              return false;
            }
          }

          if (buttonType === 'postback') {
            const payload = bubble._metadata?.buttonPayloads?.[btnIndex] || '';
            if (!payload.trim()) {
              toast.error(`Facebook 模板第 ${cardNum} 個卡片：按鈕 ${btnIndex + 1} 請輸入觸發訊息回覆`);
              return false;
            }
          }
        }
      }

      return !hasError;
    }

    // LINE 平台：驗證卡片欄位
    const newCardErrors = new Map();

    cards.forEach((card) => {
      const errors: any = {};

      // 驗證圖片（只有啟用時才驗證）
      if (card.enableImage && !(card.uploadedImageUrl || card.image)) {
        errors.image = '請選擇圖片';
      }

      // 驗證點擊圖片觸發 URL（只有啟用時才驗證）
      if (card.enableImageUrl && (!card.imageUrl || card.imageUrl.trim() === '')) {
        errors.imageUrl = '請輸入點擊後跳轉網址';
      }

      // 驗證標題文字（只有啟用時才驗證）
      if (card.enableTitle && (!card.cardTitle || card.cardTitle.trim() === '')) {
        errors.cardTitle = '請輸入標題文字';
      }

      // 驗證內文（只有啟用時才驗證）
      if (card.enableContent && (!card.content || card.content.trim() === '')) {
        errors.content = '請輸入內文';
      }

      // 驗證金額（只有啟用時才驗證）
      if (card.enablePrice && (!card.price || card.price.trim() === '')) {
        errors.price = '請輸入金額';
      }

      // 驗證動作按鈕 1
      if (card.enableButton1) {
        if (!card.button1 || card.button1.trim() === '') {
          errors.button1 = '請輸入按鈕文字';
        }

        // Facebook specific validation
        if (selectedPlatform === 'Facebook') {
          if (card.button1ActionType === 'url') {
            if (!card.button1Url || card.button1Url.trim() === '') {
              errors.button1Url = '請輸入連結網址';
            }
          } else if (card.button1ActionType === 'tag') {
            if (!card.button1Tag || card.button1Tag.trim() === '') {
              errors.button1Tag = '請選擇互動標籤';
            }
            // Trigger message is optional, no validation needed
          }
        } else {
          // LINE validation (existing logic)
          if (!card.button1Url || card.button1Url.trim() === '') {
            errors.button1Url = '請輸入連結網址';
          }
        }
      }

      // 驗證動作按鈕 2
      if (card.enableButton2) {
        if (!card.button2 || card.button2.trim() === '') {
          errors.button2 = '請輸入按鈕文字';
        }

        // Facebook specific validation
        if (selectedPlatform === 'Facebook') {
          if (card.button2ActionType === 'url') {
            if (!card.button2Url || card.button2Url.trim() === '') {
              errors.button2Url = '請輸入連結網址';
            }
          } else if (card.button2ActionType === 'tag') {
            if (!card.button2Tag || card.button2Tag.trim() === '') {
              errors.button2Tag = '請選擇互動標籤';
            }
          }
        } else {
          // LINE validation
          if (!card.button2Url || card.button2Url.trim() === '') {
            errors.button2Url = '請輸入連結網址';
          }
        }
      }

      // 驗證動作按鈕 3
      if (card.enableButton3) {
        if (!card.button3 || card.button3.trim() === '') {
          errors.button3 = '請輸入按鈕文字';
        }

        // Facebook specific validation
        if (selectedPlatform === 'Facebook') {
          if (card.button3ActionType === 'url') {
            if (!card.button3Url || card.button3Url.trim() === '') {
              errors.button3Url = '請輸入連結網址';
            }
          } else if (card.button3ActionType === 'tag') {
            if (!card.button3Tag || card.button3Tag.trim() === '') {
              errors.button3Tag = '請選擇互動標籤';
            }
          }
        } else {
          // LINE validation
          if (!card.button3Url || card.button3Url.trim() === '') {
            errors.button3Url = '請輸入連結網址';
          }
        }
      }

      // 如果該卡片有錯誤，記錄到 Map 中
      if (Object.keys(errors).length > 0) {
        newCardErrors.set(card.id, errors);
        hasError = true;
      }
    });

    setCardErrors(newCardErrors);

    // 驗證至少有一張卡片包含有效內容
    const hasValidContent = cards.some(card => {
      return (
        (card.enableImage && card.image) ||
        (card.enableTitle && card.cardTitle && card.cardTitle.trim() !== '') ||
        (card.enableContent && card.content && card.content.trim() !== '') ||
        (card.enablePrice && card.price && card.price.trim() !== '')
      );
    });

    if (!hasValidContent) {
      toast.error('請至少填寫一項卡片內容（圖片、標題、內文或價格）');
      hasError = true;
    }

    // 驗證排程時間必須在未來（僅 LINE 平台需要驗證，Facebook 只能立即發送）
    if (selectedPlatform === 'LINE' && scheduleType === 'scheduled') {
      if (!scheduledDate) {
        // 已由現有的 UI 驗證處理（第 1591-1595 行）
        hasError = true;
      } else {
        // 構建完整的排程日期時間
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(parseInt(scheduledTime.hours));
        scheduledDateTime.setMinutes(parseInt(scheduledTime.minutes));
        scheduledDateTime.setSeconds(0);

        const now = new Date();

        if (scheduledDateTime <= now) {
          toast.error('排程發送時間不可早於目前時間');
          hasError = true;
        }
      }
    }

    return !hasError;
  };

  // Calculate aspect ratio based on card content
  const calculateAspectRatio = (card: any): "1:1" | "1.91:1" => {
    // 檢查是否有勾選其他欄位（標題、內容、金額、按鈕）
    const hasContent = card.enableTitle || card.enableContent || card.enablePrice ||
                       card.enableButton1 || card.enableButton2 ||
                       card.enableButton3;

    // 如果有內容，使用 1.91:1，否則使用 1:1
    return hasContent ? "1.91:1" : "1:1";
  };

  // Image upload handler - uploads to backend and returns URL
  const handleImageUpload = async (file: File, card?: any): Promise<{ url: string; originalUrl: string; originalFilename: string } | null> => {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('檔案格式錯誤，請上傳 JPG、JPEG 或 PNG 格式的圖片');
        return null;
      }

      // Validate file size (5MB = 5242880 bytes)
      if (file.size > 5242880) {
        toast.error('圖片大小超過 5 MB，請選擇較小的圖片');
        return null;
      }

      // 計算裁切比例
      const aspectRatio = card ? calculateAspectRatio(card) : "1.91:1";

      const formData = new FormData();
      formData.append('file', file);
      formData.append('aspect_ratio', aspectRatio);  // 傳遞裁切比例

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('圖片上傳失敗');
      }

      const result = await response.json();

      if (result.code === 200 && result.data?.url) {
        toast.success('圖片上傳成功');
        return {
          url: result.data.url,
          originalUrl: result.data.original_url,
          originalFilename: result.data.original_filename
        };
      } else {
        throw new Error(result.message || '圖片上傳失敗');
      }
    } catch (error) {
      console.error('圖片上傳錯誤:', error);
      toast.error('圖片上傳失敗，請重試');
      return null;
    }
  };

  // 批量上傳裁切後的圖片（在保存訊息前調用）
  const uploadCroppedImages = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');

      // 遍歷所有卡片，上傳有 originalFile 的圖片
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];

        // 如果卡片有 originalFile，需要重新裁切並上傳
        if (card.originalFile) {
          const aspectRatio = calculateAspectRatio(card);

          // 前端重新裁切（確保使用最新的 ratio）
          const { cropImage } = await import('../utils/imageCropper');
          const croppedBlob = await cropImage(card.originalFile, aspectRatio);

          // 轉換為 File 對象
          const croppedFile = new File(
            [croppedBlob],
            `carousel_${i + 1}.jpg`,
            { type: 'image/jpeg' }
          );

          // 上傳到後端
          const formData = new FormData();
          formData.append('file', croppedFile);

          const response = await fetch('/api/v1/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`卡片 ${i + 1} 圖片上傳失敗`);
          }

          const result = await response.json();

          if (result.code === 200 && result.data?.url) {
            // 更新卡片的上傳URL（用於保存到數據庫）
            cards[i].uploadedImageUrl = result.data.url;
          } else {
            throw new Error(result.message || `卡片 ${i + 1} 圖片上傳失敗`);
          }
        } else if (card.uploadedImageUrl) {
          // 已經有上傳的 URL，跳過
          continue;
        } else if (card.image && !card.image.startsWith('blob:')) {
          // 使用現有的 URL（非 blob）
          cards[i].uploadedImageUrl = card.image;
        }
      }

      return true;
    } catch (error) {
      console.error('批量上傳圖片錯誤:', error);
      toast.error(error instanceof Error ? error.message : '圖片上傳失敗');
      return false;
    }
  };

  // Generate LINE Flex Message JSON from cards
  const generateFlexMessage = (cardsToUse = cards) => {
    const bubbles = cardsToUse.map(card => {
      const bubble: any = {
        type: "bubble",
        size: "mega"
      };
      const buttonTagsMeta: Array<string | null> = [];

      // Hero image
      const imageUrl = card.uploadedImageUrl || card.image; // 優先使用已上傳的 URL
      if (card.enableImage && imageUrl) {
        const aspectRatio = calculateAspectRatio(card);
        bubble.hero = {
          type: "image",
          url: imageUrl,
          size: "full",
          aspectRatio: aspectRatio,
          aspectMode: "cover"
        };

        // Add image click action if enabled
        if (card.enableImageUrl && card.imageUrl) {
          bubble.hero.action = {
            type: "uri",
            uri: card.imageUrl
          };
        }
      }

      // Body
      const bodyContents: any[] = [];

      if (card.enableTitle && card.cardTitle) {
        bodyContents.push({
          type: "text",
          text: card.cardTitle,
          weight: "bold",
          size: "xl",
          wrap: true
        });
      }

      if (card.enableContent && card.content) {
        bodyContents.push({
          type: "text",
          text: card.content,
          size: "sm",
          color: "#666666",
          wrap: true,
          margin: card.enableTitle ? "md" : "none"
        });
      }

      if (card.enablePrice && card.price) {
        bodyContents.push({
          type: "text",
          text: `${card.currency === 'ntd' ? 'NT$' : '$'} ${card.price}`,
          weight: "bold",
          size: "md",
          color: "#0f6beb",
          align: "end",
          margin: (card.enableTitle || card.enableContent) ? "md" : "none"
        });
      }

      if (bodyContents.length > 0) {
        bubble.body = {
          type: "box",
          layout: "vertical",
          contents: bodyContents
        };
      }

      // Footer - Buttons
      const footerContents: any[] = [];

      const addButton = (buttonNum: 1 | 2 | 3 | 4) => {
        const enableKey = `enableButton${buttonNum}` as keyof typeof card;
        const buttonKey = `button${buttonNum}` as keyof typeof card;
        const actionTypeKey = `button${buttonNum}ActionType` as keyof typeof card;
        const urlKey = `button${buttonNum}Url` as keyof typeof card;
        const modeKey = `button${buttonNum}Mode` as keyof typeof card;
        const tagKey = `button${buttonNum}Tag` as keyof typeof card;
        const triggerMessageKey = `button${buttonNum}TriggerMessage` as keyof typeof card;

        if (!card[enableKey]) return;

        const buttonText = card[buttonKey] as string;
        const actionType = card[actionTypeKey] as string;
        const mode = card[modeKey] as string;
        const url = card[urlKey] as string;
        const tag = card[tagKey] as string;
        const triggerMessage = card[triggerMessageKey] as string;

        // Validate button has required fields
        if (!buttonText) return;

        // Facebook Tag mode: use postback action
        if (selectedPlatform === 'Facebook' && actionType === 'tag') {
          if (!tag) return; // Tag is required for Facebook tag mode

          const buttonAction: any = {
            type: "postback",
            label: buttonText,
            data: JSON.stringify({
              action: 'add_tag',
              tag: tag,
              trigger_message: triggerMessage || null
            })
          };

          const button: any = {
            type: "button",
            action: buttonAction,
            style: mode === 'primary' ? 'primary' : (mode === 'link' ? 'link' : 'secondary'),
            height: "sm"
          };

          footerContents.push(button);
          buttonTagsMeta[buttonNum - 1] = tag || null;
        }
        // LINE mode or Facebook URL mode: use URI action
        else {
          if (!url) return; // URL is required for URI action

          const buttonAction: any = {
            type: "uri",
            label: buttonText,
            uri: url
          };

          const button: any = {
            type: "button",
            action: buttonAction,
            style: mode === 'primary' ? 'primary' : (mode === 'link' ? 'link' : 'secondary'),
            height: "sm"
          };

          footerContents.push(button);

          // For LINE mode, still store tag metadata for backend tracking
          const tagValue = typeof card[tagKey] === 'string' ? (card[tagKey] as string).trim() : '';
          buttonTagsMeta[buttonNum - 1] = tagValue || null;
        }
      };

      addButton(1);
      addButton(2);
      addButton(3);
      addButton(4);

      if (footerContents.length > 0) {
        bubble.footer = {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: footerContents,
          flex: 0
        };
      }

      // ✅ 构建完整的 metadata（包含 buttonTypes 和 buttonPayloads）
      const buttonTypes: Record<number, string> = {};
      const buttonPayloads: Record<number, string> = {};

      // 收集按钮类型和 payload（FB 最多 3 个按钮）
      [1, 2, 3].forEach((num) => {
        const enableKey = `enableButton${num}` as keyof typeof card;
        const actionTypeKey = `button${num}ActionType` as keyof typeof card;
        const tagKey = `button${num}Tag` as keyof typeof card;

        if (card[enableKey]) {
          const actionType = card[actionTypeKey] as string || 'url';
          const tag = card[tagKey] as string || '';

          const buttonIndex = num - 1;

          if (selectedPlatform === 'Facebook' && actionType === 'tag' && tag) {
            buttonTypes[buttonIndex] = 'postback';
            buttonPayloads[buttonIndex] = tag;
          } else {
            buttonTypes[buttonIndex] = 'url';
          }
        }
      });

      // 处理图片动作（如果需要支持图片点击打标签）
      const heroActionType = card.heroActionType as string || 'url';
      const heroActionPayload = card.heroTag as string || '';

      const interactionMetadata: { heroTag?: string | null; buttonTags?: Array<string | null> } = {};
      const normalizedImageTag = typeof card.imageTag === 'string' ? card.imageTag.trim() : '';
      if (normalizedImageTag) {
        interactionMetadata.heroTag = normalizedImageTag;
      }
      const hasButtonTags = buttonTagsMeta.some(tag => typeof tag === 'string' && tag.trim().length > 0);
      if (hasButtonTags) {
        interactionMetadata.buttonTags = buttonTagsMeta.map(tag => {
          if (typeof tag === 'string') {
            const trimmed = tag.trim();
            return trimmed || null;
          }
          return tag ?? null;
        });
      }

      // 构建完整的 _metadata
      const metadata: any = {
        ...(bubble._metadata || {}),
      };

      // 添加按钮 metadata（FB postback 所需）
      if (Object.keys(buttonTypes).length > 0) {
        metadata.buttonTypes = buttonTypes;
        if (Object.keys(buttonPayloads).length > 0) {
          metadata.buttonPayloads = buttonPayloads;
        }
      }

      // 添加图片动作 metadata（如果图片设置了标签动作）
      if (selectedPlatform === 'Facebook' && heroActionType === 'tag' && heroActionPayload) {
        metadata.heroActionType = 'postback';
        metadata.heroActionPayload = heroActionPayload;
      }

      // 保留 interactionTags（用于统计）
      if (interactionMetadata.heroTag || (interactionMetadata.buttonTags && interactionMetadata.buttonTags.some(Boolean))) {
        metadata.interactionTags = interactionMetadata;
      }

      // 只在有 metadata 时设置
      if (Object.keys(metadata).length > 0) {
        bubble._metadata = metadata;
      }

      return bubble;
    });

    // Return carousel if multiple cards, otherwise single bubble
    if (bubbles.length > 1) {
      return {
        type: "carousel",
        contents: bubbles
      };
    } else {
      return bubbles[0];
    }
  };

  // Collect unique interaction tags from all carousel cards/components
  const collectInteractionTags = (cardsToScan = cards) => {
    const tagSet = new Set<string>();

    cardsToScan.forEach(card => {
      [
        card.imageTag,
        card.button1Tag,
        card.button2Tag,
        card.button3Tag,
        card.button4Tag,
      ].forEach(tag => {
        const normalized = typeof tag === 'string' ? tag.trim() : '';
        if (normalized) {
          tagSet.add(normalized);
        }
      });
    });

    return Array.from(tagSet);
  };

  const handlePublish = async () => {
    // 驗證表單，如果有錯誤則停止發佈
    const isValid = validateForm();
    if (!isValid) {
      toast.error('請修正表單錯誤後再發佈');
      return;
    }

    // FB 平台檢查發送人數是否超過上限
    if (selectedPlatform === 'Facebook' && estimatedRecipientCount && estimatedRecipientCount > FB_BROADCAST_MAX_RECIPIENTS) {
      setShowFbLimitDialog(true);
      return;
    }

    try {
      // LINE 平台需要上傳圖片，Facebook 平台跳過
      let flexMessage = null;
      if (selectedPlatform === 'LINE') {
        // ✅ 先上傳所有圖片到後端
        const uploadSuccess = await uploadCroppedImages();
        if (!uploadSuccess) {
          toast.error('圖片上傳失敗，請重試');
          return;
        }
        // Generate flex message JSON from cards (使用 uploadedImageUrl)
        flexMessage = generateFlexMessage(cards);
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('請先登入');
        return;
      }

      // 取得選中渠道的 ID（LINE channel_id 或 FB page_id）
      const selectedChannelOption = channelOptions.find(opt => opt.value === selectedChannel);
      const channelId = selectedChannelOption?.channelId || null;

      // Prepare request body
      const requestBody: any = {
        target_type: targetType === 'all' ? 'all_friends' : 'filtered',
        schedule_type: scheduleType,
        notification_message: notificationMsg,
        message_title: title || notificationMsg || '未命名訊息',
        platform: selectedPlatform,
        channel_id: channelId,  // LINE channel_id 或 FB page_id
        thumbnail: cards[0]?.uploadedImageUrl || cards[0]?.image || null,
        interaction_tags: collectInteractionTags(),
        estimated_send_count: estimatedRecipientCount || 0,  // 預計發送人數（FB 渠道由前端計算）
      };

      // 根據平台設置對應的 JSON 欄位
      if (selectedPlatform === 'Facebook') {
        if (!fbMessageJson) {
          toast.error('請先編輯 Facebook 訊息內容');
          return;
        }
        requestBody.fb_message_json = JSON.stringify(fbMessageJson);
        // Facebook 平台也需要 flex_message_json（後端 required）
        requestBody.flex_message_json = JSON.stringify({ type: 'bubble', body: { type: 'box', layout: 'vertical', contents: [] } });
      } else {
        requestBody.flex_message_json = JSON.stringify(flexMessage);
      }

      // Add target filter for filtered audience
      if (targetType === 'filtered' && selectedFilterTags.length > 0) {
        requestBody.target_filter = {
          [filterCondition]: selectedFilterTags.map(t => t.name)
        };
      }

      // Add scheduled time if applicable
      if (scheduleType === 'scheduled' && scheduledDate) {
        const year = scheduledDate.getFullYear();
        const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
        const day = String(scheduledDate.getDate()).padStart(2, '0');
        const scheduledDateTimeString = `${year}-${month}-${day} ${scheduledTime.hours}:${scheduledTime.minutes}:00`;
        requestBody.scheduled_at = scheduledDateTimeString;
      }

      // 判斷是否從草稿發布（編輯草稿 + 非草稿模式 = 從草稿發布）
      const isEditingDraft = Boolean(editMessageId);
      const isPublishingFromDraft = isEditingDraft && scheduleType !== 'draft';

      let method: string;
      let url: string;

      if (isPublishingFromDraft) {
        // 從草稿發布：POST + draft_id（複製成新記錄，原草稿保留）
        method = 'POST';
        url = '/api/v1/messages';
        requestBody.draft_id = parseInt(editMessageId, 10);
      } else if (isEditingDraft) {
        // 編輯草稿並儲存為草稿：PUT 更新同一筆
        method = 'PUT';
        url = `/api/v1/messages/${editMessageId}`;
      } else {
        // 新建訊息
        method = 'POST';
        url = '/api/v1/messages';
      }

      const createResponse = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ detail: '建立訊息失敗' }));
        toast.error(errorData.detail || '建立訊息失敗');
        return;
      }

      const createResult = await createResponse.json();
      const messageId = createResult.data?.id || createResult.id || editMessageId;

      if (!messageId) {
        toast.error('無法取得訊息 ID');
        return;
      }

      if (scheduleType === 'immediate') {
        // 準備發送請求的 body
        const sendBody: Record<string, string> = {};

        // 取得選中渠道的 channelId
        const selectedChannelOption = channelOptions.find(opt => opt.value === selectedChannel);
        const channelId = selectedChannelOption?.channelId || null;

        // FB 平台需要帶入 jwt_token 和 page_id
        if (selectedPlatform === 'Facebook') {
          const jwtToken = localStorage.getItem('jwt_token');
          if (!jwtToken) {
            toast.error('請先登入 Facebook 帳號');
            return;
          }
          sendBody.jwt_token = jwtToken;
          if (channelId) {
            sendBody.page_id = channelId;  // FB 使用 page_id
          }
        } else if (selectedPlatform === 'LINE' && channelId) {
          sendBody.channel_id = channelId;  // LINE 使用 channel_id
        }

        const sendResponse = await fetch(`/api/v1/messages/${messageId}/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: Object.keys(sendBody).length > 0 ? JSON.stringify(sendBody) : undefined
        });

        if (!sendResponse.ok) {
          const errorData = await sendResponse.json().catch(() => ({ detail: '發送訊息失敗' }));
          toast.error(errorData.detail || '發送訊息失敗');
          return;
        }

        const sendResult = await sendResponse.json();
        const sentCount = sendResult.data?.sent_count || sendResult.sent_count || 0;

        if (isPublishingFromDraft) {
          toast.success(`發佈成功！已發送 ${sentCount} 則訊息（原草稿已保留）`);
        } else {
          toast.success(`發佈成功！已發送 ${sentCount} 則訊息`);
        }
      } else if (scheduleType === 'scheduled') {
        if (isPublishingFromDraft) {
          toast.success('已排程，將於指定時間發送（原草稿已保留）');
        } else {
          toast.success('已排程，將於指定時間發送');
        }
      } else {
        toast.success('草稿已儲存');
      }

      setIsDirty(false); // 發佈後清除未儲存標記

      // Refresh all data (messages list + quota status)
      await refreshAll();

      // Navigate back to message list immediately
      if (onNavigate) {
        onNavigate('message-list');
      }

    } catch (error) {
      console.error('發佈錯誤:', error);
      toast.error('發佈失敗，請檢查網絡連接');
    }
  };



  const handleFilterConfirm = (tags: Array<{ id: string; name: string }>, isInclude: boolean) => {
    setSelectedFilterTags(tags);
    setFilterCondition(isInclude ? 'include' : 'exclude');
    setTargetType('filtered');
    setModalOpen(false);
    toast.success(`已設定標籤篩選條件：${isInclude ? '包含' : '不包含'} ${tags.map(t => t.name).join(', ')}`);
  };

  const handleScheduleTypeChange = (value: string) => {
    setScheduleType(value);
    if (value === 'immediate') {
      // Clear scheduled date and time when switching to immediate
      setScheduledDate(undefined);
      setScheduledTime({ hours: '12', minutes: '00' });
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '年/月/日';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // 檢查是否為今天
  const isToday = (date: Date | undefined): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // 檢查小時是否應該禁用（僅限今天）
  const isHourDisabled = (hour: string): boolean => {
    if (!scheduledDate || !isToday(scheduledDate)) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const selectedHour = parseInt(hour);

    return selectedHour < currentHour;
  };

  // 檢查分鐘是否應該禁用（僅限今天且當前小時）
  const isMinuteDisabled = (minute: string): boolean => {
    if (!scheduledDate || !isToday(scheduledDate)) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const selectedHour = parseInt(scheduledTime.hours);
    const selectedMinute = parseInt(minute);

    // 只有在當前小時才禁用分鐘
    if (selectedHour !== currentHour) return false;

    return selectedMinute < currentMinute;
  };

  // 實時驗證排程日期時間
  const validateScheduledDateTime = (date: Date | undefined, time: { hours: string; minutes: string }): boolean => {
    if (!date) return true;

    const scheduledDateTime = new Date(date);
    scheduledDateTime.setHours(parseInt(time.hours));
    scheduledDateTime.setMinutes(parseInt(time.minutes));
    scheduledDateTime.setSeconds(0);

    const now = new Date();

    if (scheduledDateTime <= now) {
      toast.error('排程發送時間不可早於目前時間');
      return false;
    }

    return true;
  };

  // 當日期變更為今天且選定時間已過去時自動調整時間
  useEffect(() => {
    if (scheduledDate && isToday(scheduledDate)) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const selectedHour = parseInt(scheduledTime.hours);
      const selectedMinute = parseInt(scheduledTime.minutes);

      let needsUpdate = false;
      let newTime = { ...scheduledTime };

      // 如果選定的小時已過去，更新為當前小時
      if (selectedHour < currentHour) {
        newTime.hours = String(currentHour).padStart(2, '0');
        needsUpdate = true;
      }

      // 如果是同一小時但分鐘已過去，更新為當前分鐘+1
      if (selectedHour === currentHour && selectedMinute <= currentMinute) {
        newTime.minutes = String(currentMinute + 1).padStart(2, '0');
        needsUpdate = true;
      }

      if (needsUpdate) {
        setScheduledTime(newTime);
        toast.info('時間已自動調整為最近的可選時間');
      }
    }
  }, [scheduledDate]);

  const handleDateTimeConfirm = () => {
    // 確認前先驗證
    if (scheduledDate && !validateScheduledDateTime(scheduledDate, scheduledTime)) {
      return; // 驗證失敗時不關閉彈窗
    }

    setDatePickerOpen(false);
    if (scheduledDate) {
      toast.success(`已設定排程時間：${formatDate(scheduledDate)} ${scheduledTime.hours}:${scheduledTime.minutes}`);
    }
  };

  // 處理導航攔截
  const handleNavigationAttempt = (destination: string) => {
    if (isDirty) {
      setPendingNavigation(destination);
      setShowUnsavedDialog(true);
    } else {
      onNavigate && onNavigate(destination);
    }
  };

  // 確認離開（放棄未儲存的變更）
  const handleConfirmLeave = () => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    if (pendingNavigation && onNavigate) {
      onNavigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  // 取消離開
  const handleCancelLeave = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  return (
    <TooltipProvider>
      <div className="bg-slate-50 min-h-screen flex">
        {/* Sidebar */}
        <Sidebar 
          currentPage="messages"
          onNavigateToMessages={() => handleNavigationAttempt('message-list')}
          onNavigateToAutoReply={() => handleNavigationAttempt('auto-reply')}
          onNavigateToMembers={() => handleNavigationAttempt('member-management')}
          onNavigateToSettings={() => handleNavigationAttempt('line-api-settings')}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={setSidebarOpen}
        />

        {/* Main Content */}
        <main className={`flex-1 overflow-auto bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
          {/* Breadcrumb */}
          <div className="box-border flex items-center pb-0 pt-[48px] px-[40px]">
            <div className="box-border flex gap-1 items-center p-1">
              <p 
                className="text-[14px] text-[#6e6e6e] cursor-pointer hover:text-[#0f6beb] active:text-[#0f6beb] transition-colors"
                onClick={() => handleNavigationAttempt('message-list')}
              >
                活動與訊息推播
              </p>
              <svg className="size-[12px]" fill="none" viewBox="0 0 12 12">
                <line stroke="#6E6E6E" strokeLinecap="round" x1="7.32102" x2="5.00339" y1="3.13004" y2="10.263" />
              </svg>
              <p className="text-[14px] text-[#383838]">{title || '未命名的群發訊息'}</p>
            </div>
          </div>

          {/* Page Header */}
          <div className="box-border flex flex-col gap-[32px] items-start p-[40px]">
            <div className="flex items-start w-full justify-between">
              <div className="flex gap-1 grow items-center">
                <p className="text-[32px] text-[#383838]">群發訊息類型</p>
              </div>
              <div className="flex gap-[8px] items-center">
                {/* 刪除按鈕：僅在編輯已排程或草稿時顯示 */}
                {editMessageId && onDelete && (
                  <DeleteButton
                    onDelete={onDelete}
                    itemName={title || '此訊息'}
                    title="確認刪除訊息"
                    description={`確定要刪除「${title || '此訊息'}」嗎？刪除後將無法復原。`}
                  />
                )}
                <Button
                  onClick={handleSaveDraft}
                  className="bg-[#f0f6ff] text-[#0f6beb] hover:bg-[#e0ecff] h-[48px] px-3 min-w-[72px] rounded-[16px]"
                >
                  儲存草稿
                </Button>
                <Button
                  onClick={handlePublish}
                  className="bg-[#242424] hover:bg-[#383838] text-white h-[48px] px-3 min-w-[72px] rounded-[16px]"
                >
                  發佈
                </Button>
              </div>
            </div>

            {/* Form Fields Row 0 - Platform Selector */}
            <div className="flex flex-col xl:flex-row gap-[32px] xl:gap-[120px] items-start w-full">
              <div className="flex-1 flex flex-col sm:flex-row items-start gap-4 w-full">
                <Label className="min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] pt-3 flex items-center gap-1">
                  <span className="text-[16px] text-[#383838]">選擇發佈平台</span>
                  <span className="text-[16px] text-[#f44336]">*</span>
                </Label>
                <div className="flex-1 flex flex-col gap-[2px]">
                  {channelOptions.length === 0 ? (
                    <div className="text-[14px] text-[#999] p-3 bg-gray-50 rounded-[8px] border border-neutral-100">
                      請先至「基本設定」連結 LINE 或 Facebook 渠道
                    </div>
                  ) : (
                    <Select value={selectedChannel} onValueChange={handleChannelChange}>
                      <SelectTrigger className="w-full h-[48px] rounded-[8px] bg-white border border-neutral-100">
                        {selectedChannel ? (
                          <div className="flex items-center gap-2">
                            <ChannelIcon
                              channel={channelOptions.find(opt => opt.value === selectedChannel)?.platform || 'LINE'}
                              size={24}
                            />
                            <span className="truncate">
                              {channelOptions.find(opt => opt.value === selectedChannel)?.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#a8a8a8]">請選擇發佈平台</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {channelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                            <div className="flex items-center gap-2">
                              <ChannelIcon channel={option.platform} size={24} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields Row 1 */}
            <div className="flex flex-col xl:flex-row gap-[32px] xl:gap-[120px] items-start w-full">
              <div className="flex-1 flex flex-col sm:flex-row items-start gap-4 w-full">
                <Label className="min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] pt-3 flex items-center gap-1">
                  <span className="text-[16px] text-[#383838]">訊息標題</span>
                  <span className="text-[16px] text-[#f44336]">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                        <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>供內部辨識使用，僅顯示於後台介面</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex-1 flex flex-col gap-[2px]">
                  <Input
                    aria-invalid={!title}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (titleError) setTitleError(''); // 清除錯誤
                    }}
                    placeholder="輸入訊息"
                    maxLength={32}
                    className={`w-full h-[48px] rounded-[8px] bg-white border ${
                      title
                        ? 'border-neutral-100 focus-visible:border-neutral-300 focus-visible:ring-[#0f6beb]/20'
                        : 'border-[#f44336] focus-visible:border-[#f44336] focus-visible:ring-[#f44336]/30'
                    }`}
                  />
                  <div className="flex items-start mt-2 gap-2">
                    {!title && (
                      <p className="text-[12px] leading-[16px] text-[#f44336]">訊息標題為必填</p>
                    )}
                    <p className="text-[12px] leading-[1.5] ml-auto text-right">
                      <span className="text-[#6e6e6e]">{title.length}</span>
                      <span className="text-[#383838]">/32</span>
                    </p>
                  </div>
                  {titleError && (
                    <p className="text-[12px] leading-[16px] text-red-500 mt-2">
                      {titleError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields Row 2 - 通知推播 (僅 LINE 顯示) */}
            {selectedPlatform === 'LINE' && (
            <div className="flex flex-col xl:flex-row gap-[32px] xl:gap-[120px] items-start w-full">
              <div className="flex-1 flex flex-col sm:flex-row items-start gap-4 w-full">
                <Label className="min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] pt-3 flex items-center gap-1">
                  <span className="text-[16px] text-[#383838]">通知推播</span>
                  <span className="text-[16px] text-[#f44336]">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                        <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>使用者接收通知時，顯於裝置通知列的訊息文字</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex-1 flex flex-col gap-[2px] w-full">
                  <Input
                    aria-invalid={!notificationMsg}
                    value={notificationMsg}
                    onChange={(e) => {
                      setNotificationMsg(e.target.value);
                      if (notificationMsgError) setNotificationMsgError(''); // 清除錯誤
                    }}
                    placeholder="顯示於裝置通知列的訊息內容"
                    maxLength={100}
                    className={`h-[48px] rounded-[8px] bg-white border ${
                      notificationMsg
                        ? 'border-neutral-100 focus-visible:border-neutral-300 focus-visible:ring-[#0f6beb]/20'
                        : 'border-[#f44336] focus-visible:border-[#f44336] focus-visible:ring-[#f44336]/30'
                    }`}
                  />
                  <div className="flex items-start mt-2 gap-2">
                    {!notificationMsg && (
                      <p className="text-[12px] leading-[16px] text-[#f44336]">設定裝置列通知使用者的訊息</p>
                    )}
                    <p className="text-[12px] leading-[1.5] ml-auto text-right">
                      <span className="text-[#6e6e6e]">{notificationMsg.length}</span>
                      <span className="text-[#383838]">/100</span>
                    </p>
                  </div>
                  {notificationMsgError && (
                    <p className="text-[12px] leading-[16px] text-red-500 mt-2">
                      {notificationMsgError}
                    </p>
                  )}
                </div>
              </div>

            </div>
            )}

            {/* Schedule Section - 僅 LINE 顯示 */}
            {selectedPlatform === 'LINE' && (
            <div className="flex items-start gap-4 w-full">
              <Label className="min-w-[160px] pt-1 flex items-center gap-1">
                <span className="text-[16px] text-[#383838]">自訂時間</span>
                <span className="text-[16px] text-[#f44336]">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                      <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                    </svg>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>選擇發送時間</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex-1 flex flex-col">
                <RadioGroup value={scheduleType} onValueChange={handleScheduleTypeChange} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="cursor-pointer text-[16px] text-[#383838]">立即發送</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled" className="cursor-pointer text-[16px] text-[#383838]">自訂時間</Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild disabled={scheduleType === 'immediate'}>
                        <div className={`bg-white border border-neutral-100 rounded-[8px] px-[8px] py-[8px] w-[298px] flex items-center gap-6 transition-colors ${scheduleType === 'immediate' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-neutral-200'}`}>
                          <span className={`text-[16px] ${scheduledDate ? 'text-[#383838]' : 'text-[#a8a8a8]'}`}>
                            {formatDate(scheduledDate)}
                          </span>
                          <span className={`text-[16px] ${scheduledDate ? 'text-[#383838]' : 'text-[#a8a8a8]'}`}>
                            {scheduledDate ? `${scheduledTime.hours}:${scheduledTime.minutes}` : '時：分'}
                          </span>
                          <button className="ml-auto" disabled={scheduleType === 'immediate'}>
                            <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                              <path d={svgPaths.p22990f00} fill="#0F6BEB" />
                            </svg>
                          </button>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col gap-4 p-4">
                          <div className="space-y-2">
                            <Label className="text-[14px] text-[#383838]">選擇日期</Label>
                            <Calendar
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[14px] text-[#383838]">選擇時間</Label>
                            <div className="flex items-center gap-2">
                              <Select value={scheduledTime.hours} onValueChange={(value) => {
                                const newTime = { ...scheduledTime, hours: value };
                                setScheduledTime(newTime);
                                setTimeout(() => validateScheduledDateTime(scheduledDate, newTime), 0);
                              }}>
                                <SelectTrigger className="w-[80px] h-[40px] rounded-[8px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(hour => (
                                    <SelectItem
                                      key={hour}
                                      value={hour}
                                      disabled={isHourDisabled(hour)}
                                    >
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-[16px] text-[#383838]">:</span>
                              <Select value={scheduledTime.minutes} onValueChange={(value) => {
                                const newTime = { ...scheduledTime, minutes: value };
                                setScheduledTime(newTime);
                                setTimeout(() => validateScheduledDateTime(scheduledDate, newTime), 0);
                              }}>
                                <SelectTrigger className="w-[80px] h-[40px] rounded-[8px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(minute => (
                                    <SelectItem
                                      key={minute}
                                      value={minute}
                                      disabled={isMinuteDisabled(minute)}
                                    >
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <Button
                              variant="outline"
                              onClick={() => setDatePickerOpen(false)}
                              className="h-[40px] rounded-[8px]"
                            >
                              取消
                            </Button>
                            <Button
                              onClick={handleDateTimeConfirm}
                              className="h-[40px] rounded-[8px] bg-[#242424] hover:bg-[#383838]"
                            >
                              確認
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </RadioGroup>
                {/* Error message when scheduled is selected but date/time not set */}
                {scheduleType === 'scheduled' && !scheduledDate && (
                  <p className="text-[12px] leading-[16px] text-red-500 mt-2">
                    自訂時間為必填
                  </p>
                )}
              </div>
            </div>
            )}

            {/* Target Audience Section */}
            <div className="flex items-start gap-4 w-full">
              <Label className="min-w-[160px] pt-1 flex items-center gap-1">
                <span className="text-[16px] text-[#383838]">篩選目標對象</span>
                <span className="text-[16px] text-[#f44336]">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                      <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                    </svg>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>選擇接收訊息的對象</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex-1 flex items-start gap-[52px]">
                <RadioGroup value={targetType} onValueChange={setTargetType} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer text-[16px] text-[#383838]">所有好友</Label>
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start">
                    <div className="content-stretch flex gap-[12px] items-center shrink-0">
                      <div className="content-stretch flex gap-[8px] items-center shrink-0">
                        <RadioGroupItem value="filtered" id="filtered" />
                        <Label htmlFor="filtered" className="cursor-pointer flex flex-col font-normal justify-center leading-[0] shrink-0 text-[#383838] text-[16px] text-nowrap">
                          <p className="leading-[1.5] whitespace-pre">篩選目標對象</p>
                        </Label>
                      </div>
                    </div>
                    <div className="bg-white max-w-[600px] min-w-[300px] rounded-[8px] shrink-0 w-full border border-neutral-100">
                      <div className="flex flex-col justify-center max-w-inherit min-w-inherit size-full">
                        <div className="box-border content-stretch flex flex-row flex-wrap gap-[4px] items-start justify-start max-w-inherit min-w-inherit p-[8px] w-full">
                          {selectedFilterTags.length > 0 && (
                            <>
                              {selectedFilterTags.map(tag => (
                                <div key={tag.id} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0">
                                  <p className="basis-0 font-normal grow leading-[1.5] min-h-px min-w-px shrink-0 text-[#0f6beb] text-[16px]">{tag.name}</p>
                                  <button 
                                    onClick={() => setSelectedFilterTags(selectedFilterTags.filter(t => t.id !== tag.id))}
                                    className="shrink-0 size-[16px] hover:opacity-70 transition-opacity"
                                  >
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                      <g clipPath="url(#clip0_23_1462)">
                                        <path d={closeIconPaths.p1f281200} fill="#A8A8A8" />
                                      </g>
                                      <defs>
                                        <clipPath id="clip0_23_1462">
                                          <rect fill="white" height="16" width="16" />
                                        </clipPath>
                                      </defs>
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </>
                          )}
                          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                            <DialogTrigger asChild>
                              <button className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0 hover:bg-neutral-50 transition-colors">
                                <p className="basis-0 font-normal grow leading-[1.5] min-h-px min-w-px shrink-0 text-[#a8a8a8] text-[16px] text-center">＋ 新增標籤</p>
                              </button>
                            </DialogTrigger>
                            <DialogContentNoClose className="p-0 bg-transparent border-0 !w-auto !max-w-none !h-auto">
                              <DialogTitle className="sr-only">篩選目標對象</DialogTitle>
                              <DialogDescription className="sr-only">選擇或建立標籤來篩選目標對象</DialogDescription>
                              <FilterModal 
                                onClose={() => setModalOpen(false)}
                                onConfirm={handleFilterConfirm}
                                initialSelectedTags={selectedFilterTags}
                                initialIsInclude={filterCondition === 'include'}
                              />
                            </DialogContentNoClose>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                    {/* Error message when filtered is selected but no tags chosen */}
                    {targetType === 'filtered' && selectedFilterTags.length === 0 && (
                      <p className="text-[12px] leading-[16px] text-red-500 mt-2">
                        請至少選擇一個標籤
                      </p>
                    )}
                  </div>
                </RadioGroup>
                <div className="mt-[30px] -ml-[20px]">
                  <p className="text-[16px] text-[#383838]">
                    預計發送好友人數：
                    {estimatedRecipientCount !== null
                      ? `${estimatedRecipientCount.toLocaleString()} 人`
                      : '計算中...'}
                  </p>
                  {/* LINE 才顯示可用訊息則數，Facebook 只有速率限制不顯示 */}
                  {selectedPlatform === 'LINE' && (
                    <p className="text-[16px] text-[#383838] mt-[10px]">
                      可用訊息則數：
                      {quotaLoading
                        ? '載入中...'
                        : quotaError
                          ? quotaError === '請先登入'
                            ? '請先登入'
                            : '無法取得'
                          : quotaStatus
                            ? `${quotaStatus.availableQuota.toLocaleString()} 則`
                            : '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Message Editor Section - Full Width */}
          <div className="border-t-2 border-[#E5E5E5]">
            {/* Editor - conditionally render LINE or Facebook editor */}
            <div className="h-[calc(100vh-300px)] min-h-[600px]">
              {selectedPlatform === 'LINE' ? (
                <CarouselMessageEditor
                  cards={cards}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onAddCarousel={addCarousel}
                  onUpdateCard={updateCard}
                  onImageUpload={(file) => handleImageUpload(file, currentCard)}
                  errors={cardErrors.get(currentCard.id)}
                  onDeleteCarousel={deleteCard}
                  selectedPlatform={selectedPlatform}
                  onCopyCard={() => {
                    // 檢查是否已達到上限
                    if (cards.length >= 10) {
                      toast.error('最多可新增10個輪播');
                      return;
                    }

                    // Copy current card functionality
                    const newId = Math.max(...cards.map(c => c.id)) + 1;
                    const copiedCard = { ...currentCard, id: newId };
                    setCards([...cards, copiedCard]);
                    setActiveTab(newId);
                    toast.success('已複製圖卡');
                  }}
                />
              ) : (
                <FacebookMessageEditor
                  onJsonChange={setFbMessageJson}
                  initialJson={fbMessageJson}
                />
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Hidden file inputs for trigger images */}
      <input
        ref={button1TriggerImageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleButton1TriggerImageUpload}
      />
      <input
        ref={button2TriggerImageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleButton2TriggerImageUpload}
      />

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>內容未儲存</AlertDialogTitle>
            <AlertDialogDescription>
              您有尚未儲存的變更，是否確認離開？離開後未儲存的內容將會遺失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave} className="bg-[#f44336] hover:bg-[#d32f2f]">
              確認離開
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FB 發送人數上限提示 Dialog */}
      <AlertDialog open={showFbLimitDialog} onOpenChange={setShowFbLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>單次發送訊息數量已達上限</AlertDialogTitle>
            <AlertDialogDescription>
              當前已超過 Facebook 群發 1,000 則訊息的數量上限，請調整發送對象或分批進行發送。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>確定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </TooltipProvider>
  );
}
