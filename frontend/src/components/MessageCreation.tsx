import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Menu, X, Copy, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogTrigger, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from './ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog@1.1.6';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import svgPaths from '../imports/svg-jb10q6lg6b';
import { imgGroup, imgGroup1, imgGroup2, imgGroup3, imgGroup4, imgGroup5, imgGroup6 } from "../imports/svg-zrjx6";
import imgBackgroundImage from "figma:asset/d1c10d8dbfc2ae5783543c9f0b76cd2635713297.png";
import FilterModal from './FilterModal';
import closeIconPaths from '../imports/svg-b62f9l13m2';
import uploadIconPaths from '../imports/svg-wb8nmg8j6i';
import FlexMessageEditorNew from './flex-message/FlexMessageEditorNew';
import CarouselMessageEditor from './CarouselMessageEditor';
import { TriggerImagePreview, TriggerTextPreview, GradientPreviewContainer } from './common/PreviewContainers';
import ActionTriggerTextMessage from '../imports/ActionTriggerTextMessage';
import ActionTriggerImageMessage from '../imports/ActionTriggerImageMessage';
import Sidebar from './Sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { ScheduleSettings, TargetAudienceSelector, PreviewPanel } from './message-creation';
import type { Tag } from './message-creation';
// API 集成
import messageService from '../services/messageService';
import { transformToBackendFormat, validateMessageForm } from '../utils/messageDataTransform';
import type { QuotaStatusResponse } from '../types/message';

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
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

interface MessageCreationProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export default function MessageCreation({ onBack, onNavigate }: MessageCreationProps = {}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [title, setTitle] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');
  const [previewMsg, setPreviewMsg] = useState('');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [targetType, setTargetType] = useState('all');
  const [activeTab, setActiveTab] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [flexMessageJson, setFlexMessageJson] = useState<any>(null);
  const [selectedFilterTags, setSelectedFilterTags] = useState<Array<{ id: string; name: string }>>([]);
  const [filterCondition, setFilterCondition] = useState<'include' | 'exclude'>('include');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState({ hours: '12', minutes: '00' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false); // 追蹤是否有未儲存的變更
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false); // 顯示未儲存確認對話框
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null); // 待執行的導航
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // API 集成：配額相關狀態
  const [quotaData, setQuotaData] = useState<QuotaStatusResponse | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const button1TriggerImageInputRef = useRef<HTMLInputElement>(null);
  const button2TriggerImageInputRef = useRef<HTMLInputElement>(null);
  
  // Card states
  const [cards, setCards] = useState([
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
      button1Action: 'select', 
      button1Url: '', 
      button1Tag: '', 
      button1Text: '',
      button1TriggerImage: null as File | null,
      button1Mode: 'primary' as 'primary' | 'secondary' | 'link',
      button2Action: 'select',
      button2Url: '',
      button2Tag: '',
      button2Text: '',
      button2TriggerImage: null as File | null,
      button2Mode: 'secondary' as 'primary' | 'secondary' | 'link',
      button3Action: 'select',
      button3Url: '',
      button3Tag: '',
      button3Text: '',
      button3TriggerImage: null as File | null,
      button3Mode: 'secondary' as 'primary' | 'secondary' | 'link',
      button4Action: 'select',
      button4Url: '',
      button4Tag: '',
      button4Text: '',
      button4TriggerImage: null as File | null,
      button4Mode: 'secondary' as 'primary' | 'secondary' | 'link',
      enableImageUrl: false,
      imageUrl: '',
      imageTag: ''
    }
  ]);

  const currentCard = cards.find(c => c.id === activeTab) || cards[0];

  const updateCard = (updates: Partial<typeof currentCard>) => {
    setCards(cards.map(card => 
      card.id === activeTab ? { ...card, ...updates } : card
    ));
  };

  // 監聽表單變更，標記為未儲存
  useEffect(() => {
    if (
      title ||
      notificationMsg ||
      previewMsg ||
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
  }, [title, notificationMsg, previewMsg, targetType, scheduleType, selectedFilterTags, cards]);

  // Create stable URLs for trigger images
  const triggerImageUrl = useMemo(() => {
    if (currentCard.button1Action === 'image' && currentCard.button1TriggerImage) {
      return URL.createObjectURL(currentCard.button1TriggerImage);
    }
    if (currentCard.button2Action === 'image' && currentCard.button2TriggerImage) {
      return URL.createObjectURL(currentCard.button2TriggerImage);
    }
    return undefined;
  }, [currentCard.button1Action, currentCard.button1TriggerImage, currentCard.button2Action, currentCard.button2TriggerImage]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (triggerImageUrl) {
        URL.revokeObjectURL(triggerImageUrl);
      }
    };
  }, [triggerImageUrl]);

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
      const newCards = cards.filter(c => c.id !== activeTab);
      setCards(newCards);
      setActiveTab(newCards[0].id);
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
        toast.error('圖片大小超過 1 MB，請選擇較小的圖���');
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

  // API 集成：配額查詢函數
  const fetchQuota = useCallback(async () => {
    try {
      setQuotaLoading(true);

      // 構建後端格式的篩選條件
      let targetTypeBackend: 'all_friends' | 'filtered';
      let targetFilter: { include?: string[]; exclude?: string[] } | undefined;

      if (targetType === 'all') {
        targetTypeBackend = 'all_friends';
        targetFilter = undefined;
      } else {
        targetTypeBackend = 'filtered';
        const tagNames = selectedFilterTags.map((tag) => tag.name);

        if (filterCondition === 'include') {
          targetFilter = { include: tagNames };
        } else {
          targetFilter = { exclude: tagNames };
        }
      }

      // 調用 API 查詢配額
      const result = await messageService.getQuota({
        target_type: targetTypeBackend,
        target_filter: targetFilter,
      });

      setQuotaData(result);
    } catch (error) {
      console.error('獲取配額失敗:', error);
      // 錯誤已在 api.ts 中通過 toast 顯示，這裡不重複提示
    } finally {
      setQuotaLoading(false);
    }
  }, [targetType, selectedFilterTags, filterCondition]);

  // API 集成：當發送對象改變時，自動查詢配額（帶防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuota();
    }, 500); // 500ms 防抖

    return () => clearTimeout(timer);
  }, [fetchQuota]);

  const copyCard = () => {
    if (cards.length < 4) {
      const cardToCopy = cards.find(c => c.id === activeTab);
      if (cardToCopy) {
        const newId = Math.max(...cards.map(c => c.id)) + 1;
        setCards([...cards, { ...cardToCopy, id: newId }]);
        setActiveTab(newId);
        toast.success('已複製輪播');
      }
    } else {
      toast.error('最多只能有 4 個輪播');
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);

      // 檢查是否已自動產生 Flex Message JSON
      if (!autoGeneratedFlexJson) {
        toast.error('請先完成訊息內容設定');
        return;
      }

      // 構建前端表單數據（使用自動產生的 JSON）
      const formData = {
        title,
        notificationMsg,
        flexMessageJson: autoGeneratedFlexJson,
        targetType: targetType as 'all' | 'include' | 'exclude',
        selectedFilterTags: selectedFilterTags.map((tag) => ({
          id: parseInt(tag.id),
          name: tag.name,
        })),
        scheduleType: 'draft' as const,
        cards,
        thumbnail: cards.length > 0 ? cards[0].imageUrl : undefined,
      };

      // 轉換為後端格式
      const backendData = transformToBackendFormat(formData, 1);

      // 調用 API 創建草稿
      await messageService.createMessage(backendData);

      setIsDirty(false);
      toast.success('草稿已儲存');
    } catch (error) {
      console.error('儲存草稿失敗:', error);
      // 錯誤已在 api.ts 中通過 toast 顯示
    } finally {
      setIsSavingDraft(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Check basic required fields
    if (!title) errors.push('訊息標題');
    if (!notificationMsg) errors.push('通知推播');
    if (!previewMsg) errors.push('通知預覽');

    // Check card configurations (動態驗證勾選項)
    cards.forEach((card, index) => {
      const cardLabel = cards.length > 1 ? `輪播 ${index + 1} - ` : '';

      // Check card title (always required)
      if (!card.cardTitle) {
        errors.push(`${cardLabel}標題文字`);
      }

      // Check image if enabled
      if (card.enableImage && !card.image) {
        errors.push(`${cardLabel}圖片`);
      }

      // Check content if enabled
      if (card.enableContent && !card.content) {
        errors.push(`${cardLabel}內文文字`);
      }

      // Check price if enabled
      if (card.enablePrice && (!card.price || card.price === '0')) {
        errors.push(`${cardLabel}價格`);
      }

      // Check Button 1 if enabled
      if (card.enableButton1) {
        if (!card.button1) {
          errors.push(`${cardLabel}動作按鈕一 - 按鈕文字`);
        }
        if (card.button1Action === 'select') {
          errors.push(`${cardLabel}動作按鈕一 - 互動類型`);
        }
        if (card.button1Action === 'url' && !card.button1Url) {
          errors.push(`${cardLabel}動作按鈕一 - URL`);
        }
        if (card.button1Action === 'text' && !card.button1Text) {
          errors.push(`${cardLabel}動作按鈕一 - 觸發文字`);
        }
        if (card.button1Action === 'image' && !card.button1TriggerImage) {
          errors.push(`${cardLabel}動作按鈕一 - 觸發圖片`);
        }
      }

      // Check Button 2 if enabled
      if (card.enableButton2) {
        if (!card.button2) {
          errors.push(`${cardLabel}動作按鈕二 - 按鈕文字`);
        }
        if (card.button2Action === 'select') {
          errors.push(`${cardLabel}動作按鈕二 - 互動類型`);
        }
        if (card.button2Action === 'url' && !card.button2Url) {
          errors.push(`${cardLabel}動作按鈕二 - URL`);
        }
        if (card.button2Action === 'text' && !card.button2Text) {
          errors.push(`${cardLabel}動作按鈕二 - 觸發文字`);
        }
        if (card.button2Action === 'image' && !card.button2TriggerImage) {
          errors.push(`${cardLabel}動作按鈕二 - 觸發圖片`);
        }
      }
    });

    return errors;
  };

  // 自動根據 cards 生成 LINE Flex Message JSON（即時更新）
  const autoGeneratedFlexJson = useMemo(() => {
    if (!cards || cards.length === 0) {
      return null;
    }

    const bubbles = cards.map((card) => {
      const bubble: any = {
        type: 'bubble',
        size: 'mega',
      };

      // Hero (圖片區域)
      if (card.enableImage && card.image) {
        bubble.hero = {
          type: 'image',
          url: card.image,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
        };
      }

      // Body (內容區域)
      const bodyContents: any[] = [];

      // 標題
      if (card.cardTitle) {
        bodyContents.push({
          type: 'text',
          text: card.cardTitle,
          weight: 'bold',
          size: 'xl',
        });
      }

      // 內文
      if (card.enableContent && card.content) {
        bodyContents.push({
          type: 'text',
          text: card.content,
          size: 'sm',
          color: '#666666',
          wrap: true,
        });
      }

      // 價格
      if (card.enablePrice && card.price) {
        bodyContents.push({
          type: 'text',
          text: `${card.currency === 'ntd' ? 'NT$' : '$'}${card.price}`,
          size: 'xxl',
          weight: 'bold',
          color: '#EA5550',
        });
      }

      if (bodyContents.length > 0) {
        bubble.body = {
          type: 'box',
          layout: 'vertical',
          contents: bodyContents,
          spacing: 'md',
        };
      }

      // Footer (按鈕區域)
      const footerButtons: any[] = [];

      if (card.enableButton1 && card.button1) {
        const action: any = { type: 'uri', label: card.button1, uri: card.button1Url || 'https://example.com' };
        if (card.button1Action === 'text') {
          action.type = 'message';
          action.text = card.button1Text || card.button1;
          delete action.uri;
        }
        footerButtons.push({
          type: 'button',
          style: 'primary',
          action,
        });
      }

      if (card.enableButton2 && card.button2) {
        const action: any = { type: 'uri', label: card.button2, uri: card.button2Url || 'https://example.com' };
        if (card.button2Action === 'text') {
          action.type = 'message';
          action.text = card.button2Text || card.button2;
          delete action.uri;
        }
        footerButtons.push({
          type: 'button',
          style: 'secondary',
          action,
        });
      }

      if (footerButtons.length > 0) {
        bubble.footer = {
          type: 'box',
          layout: 'vertical',
          contents: footerButtons,
          spacing: 'sm',
        };
      }

      return bubble;
    });

    // 如果只有一張卡片，返回單一 bubble；多張卡片返回 carousel
    if (bubbles.length === 1) {
      return bubbles[0];
    } else {
      return {
        type: 'carousel',
        contents: bubbles,
      };
    }
  }, [cards]); // 當 cards 改變時自動重新生成

  // 監控自動產生的 JSON（用於調試）
  useEffect(() => {
    if (autoGeneratedFlexJson) {
      console.log('✅ Flex Message JSON 已自動產生:', autoGeneratedFlexJson);
    }
  }, [autoGeneratedFlexJson]);

  const handlePublish = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationDialogOpen(true);
      return;
    }

    // 檢查是否已自動產生 Flex Message JSON
    if (!autoGeneratedFlexJson) {
      toast.error('請先完成訊息內容設定');
      return;
    }

    // 檢查配額是否充足
    if (quotaData && !quotaData.is_sufficient && scheduleType === 'immediate') {
      toast.error('配額不足，無法立即發送', {
        description: `需要 ${quotaData.estimated_send_count} 則，可用 ${quotaData.available_quota} 則`,
      });
      return;
    }

    try {
      setIsPublishing(true);

      // 構建前端表單數據（使用自動產生的 JSON）
      const formData = {
        title,
        notificationMsg,
        flexMessageJson: autoGeneratedFlexJson,
        targetType: targetType as 'all' | 'include' | 'exclude',
        selectedFilterTags: selectedFilterTags.map((tag) => ({
          id: parseInt(tag.id),
          name: tag.name,
        })),
        scheduleType: scheduleType as 'immediate' | 'scheduled' | 'draft',
        scheduledDate: scheduledDate
          ? `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate.getDate()).padStart(2, '0')}`
          : undefined,
        scheduledTime: scheduleType === 'scheduled' ? `${scheduledTime.hours}:${scheduledTime.minutes}` : undefined,
        cards,
        thumbnail: cards.length > 0 ? cards[0].imageUrl : undefined,
      };

      // 轉換為後端格式
      const backendData = transformToBackendFormat(formData, 1);

      // 1. 創建訊息
      const createdMessage = await messageService.createMessage(backendData);

      // 2. 如果是立即發送，調用發送 API
      if (scheduleType === 'immediate') {
        const sendResult = await messageService.sendMessage(createdMessage.id);
        toast.success('發送成功', {
          description: `成功發送 ${sendResult.sent_count} 則訊息`,
        });
      } else if (scheduleType === 'scheduled') {
        toast.success('排程發送設定成功', {
          description: `將於 ${formData.scheduledDate} ${formData.scheduledTime} 發送`,
        });
      } else {
        toast.success('發佈成功');
      }

      setIsDirty(false);
    } catch (error) {
      console.error('發佈失敗:', error);
      // 錯誤已在 api.ts 中通過 toast 顯示
    } finally {
      setIsPublishing(false);
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

  const handleDateTimeConfirm = () => {
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
                <Button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isPublishing}
                  className="bg-[#f0f6ff] text-[#0f6beb] hover:bg-[#e0ecff] h-[48px] px-3 min-w-[72px] rounded-[16px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingDraft ? '儲存中...' : '儲存草稿'}
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing || isSavingDraft || quotaLoading}
                  className="bg-[#242424] hover:bg-[#383838] text-white h-[48px] px-3 min-w-[72px] rounded-[16px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? '發佈中...' : '發佈'}
                </Button>
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="輸入訊息"
                    maxLength={32}
                    className="w-full h-[48px] rounded-[8px] border-neutral-100 bg-white"
                  />
                  <div className="flex justify-end">
                    <p className="text-[12px] leading-[1.5]">
                      <span className="text-[#6e6e6e]">{title.length}</span>
                      <span className="text-[#383838]">/32</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields Row 2 */}
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
                      <p>使用者接收通知時，顯���於裝置通知列的訊息文字</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex-1 flex flex-col gap-[2px] w-full">
                  <Input 
                    value={notificationMsg}
                    onChange={(e) => setNotificationMsg(e.target.value)}
                    placeholder="顯示於裝置通知列的訊息內容"
                    maxLength={100}
                    className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                  />
                  <div className="flex justify-end">
                    <p className="text-[12px] leading-[1.5]">
                      <span className="text-[#6e6e6e]">{notificationMsg.length}</span>
                      <span className="text-[#383838]">/100</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row items-start gap-4 w-full">
                <Label className="min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] pt-3 flex items-center gap-1">
                  <span className="text-[16px] text-[#383838]">通知預覽</span>
                  <span className="text-[16px] text-[#f44336]">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                        <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>使用者接收通知時，顯示於聊天室訊息列表的預覽文字</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex-1 flex flex-col gap-[2px]">
                  <Input 
                    value={previewMsg}
                    onChange={(e) => setPreviewMsg(e.target.value)}
                    placeholder="顯示於聊天室過通知列的訊息內容"
                    maxLength={100}
                    className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                  />
                  <div className="flex justify-end text-[12px] leading-[1.5]">
                    <span className="text-[#6e6e6e]">{previewMsg.length}</span>
                    <span className="text-[#383838]">/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="flex items-start gap-4 w-full">
              <Label className="min-w-[160px] pt-1 flex items-center gap-1">
                <span className="text-[16px] text-[#383838]">排程發送</span>
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
                            <Select value={scheduledTime.hours} onValueChange={(value) => setScheduledTime(prev => ({ ...prev, hours: value }))}>
                              <SelectTrigger className="w-[80px] h-[40px] rounded-[8px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(hour => (
                                  <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-[16px] text-[#383838]">:</span>
                            <Select value={scheduledTime.minutes} onValueChange={(value) => setScheduledTime(prev => ({ ...prev, minutes: value }))}>
                              <SelectTrigger className="w-[80px] h-[40px] rounded-[8px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(minute => (
                                  <SelectItem key={minute} value={minute}>{minute}</SelectItem>
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
            </div>

            {/* Target Audience Section */}
            <div className="flex items-start gap-4 w-full">
              <Label className="min-w-[160px] pt-1 flex items-center gap-1">
                <span className="text-[16px] text-[#383838]">發送對象</span>
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
                            <DialogContentNoClose className="max-w-[800px] max-h-[90vh] p-0 bg-transparent border-0">
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
                  </div>
                </RadioGroup>
                <div className="mt-[30px] -ml-[20px]">
                  <p className="text-[16px] text-[#383838]">
                    預計發送好友人數：
                    {quotaLoading ? (
                      <span className="ml-1">載入中...</span>
                    ) : quotaData ? (
                      <span className="ml-1">{quotaData.estimated_send_count} 人</span>
                    ) : (
                      <span className="ml-1">-- 人</span>
                    )}
                  </p>
                  <p className="text-[16px] text-[#383838] mt-[10px]">
                    可用訊息則數：
                    {quotaLoading ? (
                      <span className="ml-1">載入中...</span>
                    ) : quotaData ? (
                      <>
                        <span className={`ml-1 ${!quotaData.is_sufficient ? 'text-red-500 font-semibold' : ''}`}>
                          {quotaData.available_quota.toLocaleString()} 則
                        </span>
                        {!quotaData.is_sufficient && (
                          <span className="ml-2 text-red-500 text-sm">（配額不足）</span>
                        )}
                      </>
                    ) : (
                      <span className="ml-1">-- 則</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Message Editor Section - Full Width */}
          <div className="border-t-2 border-[#E5E5E5]">
            {/* Carousel Message Editor - Full Height */}
            <div className="h-[calc(100vh-300px)] min-h-[600px]">
              <CarouselMessageEditor
                cards={cards}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddCarousel={addCarousel}
                onUpdateCard={updateCard}
                onCopyCard={() => {
                  // Copy current card functionality
                  const newId = Math.max(...cards.map(c => c.id)) + 1;
                  const copiedCard = { ...currentCard, id: newId };
                  setCards([...cards, copiedCard]);
                  setActiveTab(newId);
                  toast.success('已複製圖卡');
                }}
              />
            </div>
          </div>
        </main>
      </div>
      
      {/* Keep the original structure hidden for now */}
      <div className="hidden">
            <div className="flex flex-col lg:flex-row gap-[32px] items-start w-full">
              {/* Preview */}
              {currentCard.button1Action === 'text' || currentCard.button2Action === 'text' ? (
                <div className="overflow-hidden relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[460px] rounded-[20px]" style={{
                  background: 'linear-gradient(180deg, #a5d8ff 0%, #d0ebff 100%)'
                }}>
                  <div className="box-border flex gap-[20px] items-start pt-[24px] px-[24px] pb-[24px]">
                    <div className="bg-white rounded-full w-[45px] h-[45px] flex items-center justify-center shrink-0">
                      <p className="text-[12px] text-[#383838]">OA</p>
                    </div>
                    <div className="w-[288px]">
                      <TriggerTextPreview 
                        cardData={{
                          cardTitle: currentCard.cardTitle,
                          content: currentCard.content,
                          price: currentCard.price,
                          currency: currentCard.currency,
                          button1: currentCard.button1,
                          button2: currentCard.button2,
                          imageUrl: currentCard.image
                        }}
                        triggerText={
                          currentCard.button1Action === 'text' ? currentCard.button1Text : 
                          currentCard.button2Action === 'text' ? currentCard.button2Text : 
                          undefined
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : currentCard.button1Action === 'image' || currentCard.button2Action === 'image' ? (
                <div className="overflow-hidden relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[460px] rounded-[20px]">
                  <TriggerImagePreview 
                    cardData={{
                      cardTitle: currentCard.cardTitle,
                      content: currentCard.content,
                      price: currentCard.price,
                      currency: currentCard.currency,
                      button1: currentCard.button1,
                      button2: currentCard.button2,
                      imageUrl: currentCard.image
                    }}
                    triggerImageUrl={triggerImageUrl}
                  />
                </div>
              ) : (
                <div 
                  className="overflow-hidden relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[460px] rounded-[20px]"
                  style={{
                    background: 'linear-gradient(180deg, #a5d8ff 0%, #d0ebff 100%)'
                  }}
                >
                  <div className="box-border flex gap-[20px] items-start pt-[24px] px-[24px] pb-[24px]">
                    <div className="bg-white rounded-full w-[45px] h-[45px] flex items-center justify-center shrink-0">
                      <p className="text-[12px] text-[#383838]">OA</p>
                    </div>
                    
                    {/* Carousel Cards Preview */}
                    <div
                      className="flex gap-[15px] overflow-x-auto scroll-smooth snap-x snap-mandatory"
                      onScroll={handlePreviewScroll}
                      style={{ scrollbarWidth: 'thin' }}
                    >
                        {cards.map((card) => (
                          <div 
                            key={card.id} 
                            ref={(el) => cardRefs.current[card.id] = el}
                            className="bg-white rounded-[12px] overflow-hidden w-[168px] sm:w-[216px] md:w-[252px] lg:w-[288px] shrink-0 snap-center"
                          >
                            {/* Image Area */}
                            <div className="bg-[#edf0f8] content-stretch flex items-center justify-center relative h-[192px] overflow-hidden">
                              {card.image ? (
                                <img src={card.image} alt="預覽圖片" className="w-full h-full object-cover" />
                              ) : (
                                <p className="font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[19px] text-center text-nowrap whitespace-pre">選擇圖片</p>
                              )}
                            </div>
                            
                            {/* Title */}
                            <div className="p-[16px]">
                              <p className="text-[19px] text-[#383838] truncate">
                                {card.cardTitle || '標題文字'}
                              </p>
                            </div>
                            
                            {/* Content - only show if enabled */}
                            {card.enableContent && (
                              <div className="px-[16px] pb-[16px]">
                                <p className="text-[12px] text-[#383838] truncate">
                                  {card.content || '內文文字'}
                                </p>
                              </div>
                            )}
                            
                            {/* Price - only show if enabled */}
                            {card.enablePrice && (
                              <div className="px-[16px] pb-[16px] text-right">
                                <p className="text-[24px] text-[#383838]">
                                  {card.currency === 'ntd' ? 'NT $' : '$'} {card.price || '0'}
                                </p>
                              </div>
                            )}
                            
                            {/* Buttons - only show if enabled */}
                            {(card.enableButton1 || card.enableButton2) && (
                              <div className="box-border flex flex-col gap-[5px] items-start px-[16px] pt-[7px] pb-[16px]">
                                {card.enableButton1 && (
                                  <div className="bg-white rounded-[12px] w-full p-[12px] text-center border border-gray-200">
                                    <p className="text-[14px] text-[#383838] truncate">
                                      {card.button1 || '動作按鈕一'}
                                    </p>
                                  </div>
                                )}
                                {card.enableButton2 && (
                                  <div className="bg-white rounded-[12px] w-full p-[12px] text-center border border-gray-200">
                                    <p className="text-[14px] text-[#383838] truncate">
                                      {card.button2 || '動作按鈕二'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Form */}
              <div className="flex-1 space-y-[32px] w-full">
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={copyCard}
                    variant="ghost" 
                    size="icon" 
                    className="h-[48px] w-[48px] hover:bg-slate-100"
                  >
                    <svg className="size-[22px]" fill="none" viewBox="0 0 22 22">
                      <path d={svgPaths.p20b8bb00} fill="#6E6E6E" />
                    </svg>
                  </Button>
                  <Button 
                    onClick={deleteCard}
                    variant="ghost" 
                    size="icon" 
                    className="h-[48px] w-[48px] hover:bg-slate-100"
                    disabled={cards.length === 1}
                  >
                    <svg className="size-[32px]" fill="none" viewBox="0 0 32 32">
                      <path d={svgPaths.pcbf700} fill="#6E6E6E" />
                    </svg>
                  </Button>
                </div>

                {/* Title */}
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                  <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                    <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                      <Checkbox />
                    </div>
                    <Label className="flex items-center">
                      <span className="text-[16px] text-[#383838]">標題文字</span>
                      <span className="text-[16px] text-[#f44336]">*</span>
                    </Label>
                  </div>
                  <div className="flex-1 space-y-[2px]">
                    <Input 
                      value={currentCard.cardTitle}
                      onChange={(e) => updateCard({ cardTitle: e.target.value })}
                      placeholder="輸入標題文字"
                      className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                      maxLength={20}
                    />
                    <p className="text-[12px] text-right text-[#6e6e6e]">
                      {currentCard.cardTitle.length}<span className="text-[#383838]">/20</span>
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                  <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                    <div className="flex gap-[10px] items-center justify-center size-[24px]">
                      <Checkbox 
                        checked={currentCard.enableContent}
                        onCheckedChange={(checked) => updateCard({ enableContent: checked as boolean })}
                      />
                    </div>
                    <Label className="flex items-center">
                      <span className="text-[16px] text-[#383838]">內文文字說明</span>
                    </Label>
                  </div>
                  <div className="flex-1 space-y-[2px]">
                    <Input 
                      value={currentCard.content}
                      onChange={(e) => updateCard({ content: e.target.value })}
                      placeholder="輸入內文文字說明"
                      className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                      disabled={!currentCard.enableContent}
                      maxLength={60}
                    />
                    <p className="text-[12px] text-right text-[#6e6e6e]">
                      {currentCard.content.length}<span className="text-[#383838]">/60</span>
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                  <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                    <div className="flex gap-[10px] items-center justify-center size-[24px]">
                      <Checkbox 
                        id="enable-price"
                        checked={currentCard.enablePrice}
                        onCheckedChange={(checked) => {
                          updateCard({ enablePrice: checked as boolean });
                        }}
                      />
                    </div>
                    <Label htmlFor="enable-price" className="flex items-center cursor-pointer">
                      <span className="text-[16px] text-[#383838]">金額</span>
                    </Label>
                  </div>
                  <div className="flex-1 space-y-[2px]">
                    <Input 
                      value={currentCard.price ? `NT$ ${currentCard.price}` : 'NT$ 0'}
                      onChange={(e) => {
                        const value = e.target.value.replace(/NT\$\s*/g, '').replace(/\D/g, '');
                        if (value.length <= 15) {
                          updateCard({ price: value });
                        }
                      }}
                      placeholder="NT$ 0"
                      className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                      disabled={!currentCard.enablePrice}
                    />
                    <p className="text-[12px] text-right text-[#6e6e6e]">
                      {currentCard.price.length}<span className="text-[#383838]">/15</span>
                    </p>
                  </div>
                </div>

                {/* Button 1 */}
                {!currentCard.enableButton1 ? (
                  <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                    <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                      <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                        <Checkbox />
                      </div>
                      <button
                        onClick={() => updateCard({ enableButton1: true })}
                        className="text-[16px] text-[#0f6beb] hover:underline"
                      >
                        ＋ 新增按鈕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                      <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                        <div className="flex gap-[10px] items-center justify-center size-[24px]">
                          <button
                            onClick={() => {
                              // If button2 is enabled, move button2 data to button1
                              if (currentCard.enableButton2) {
                                updateCard({
                                  enableButton1: true,
                                  button1: currentCard.button2,
                                  button1Tag: currentCard.button2Tag,
                                  button1Action: currentCard.button2Action,
                                  button1Url: currentCard.button2Url,
                                  button1Text: currentCard.button2Text,
                                  button1TriggerImage: currentCard.button2TriggerImage,
                                  enableButton2: false,
                                  button2: '',
                                  button2Tag: '',
                                  button2Action: 'select',
                                  button2Url: '',
                                  button2Text: '',
                                  button2TriggerImage: null,
                                });
                              } else {
                                updateCard({ 
                                  enableButton1: false,
                                  button1: '',
                                  button1Tag: '',
                                  button1Action: 'select',
                                  button1Url: '',
                                  button1Text: '',
                                  button1TriggerImage: null,
                                });
                              }
                            }}
                            className="text-[#f44336] hover:text-[#d32f2f]"
                          >
                            <Trash2 className="size-[20px]" />
                          </button>
                        </div>
                        <Label className="flex items-center gap-[2px]">
                          <span className="text-[16px] text-[#383838]">動作按鈕一</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                                <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                              </svg>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>設定按鈕文字與觸發後的互動類型</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                      </div>
                      <div className="flex-1 space-y-[2px]">
                        <Input 
                          value={currentCard.button1}
                          onChange={(e) => updateCard({ button1: e.target.value })}
                          placeholder="輸入動作按鈕"
                          className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                          maxLength={12}
                        />
                        <p className="text-[12px] text-right text-[#6e6e6e]">
                          {currentCard.button1.length}<span className="text-[#383838]">/12</span>
                        </p>
                      </div>
                    </div>

                    {/* Button 1 Interactive Type - 互動類型 */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                      <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                        <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                          <Checkbox />
                        </div>
                        <Label className="flex items-center">
                          <span className="text-[16px] text-[#383838]">互動類型</span>
                          <span className="text-[16px] text-[#f44336]">*</span>
                        </Label>
                      </div>
                      <Select value={currentCard.button1Action} onValueChange={(value) => updateCard({ button1Action: value })}>
                        <SelectTrigger className={`flex-1 h-[48px] py-1 rounded-[8px] border-neutral-100 bg-white ${currentCard.button1Action === 'select' ? 'text-[#717182]' : ''}`}>
                          <SelectValue placeholder="選擇互動類型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select" className="text-[#717182]">選擇互動類型</SelectItem>
                          <SelectItem value="url">開啟網址</SelectItem>
                          <SelectItem value="text">觸發文字</SelectItem>
                          <SelectItem value="image">觸發圖片</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Button 1 Interactive Tag */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                      <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                        <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                          <Checkbox />
                        </div>
                        <Label className="flex items-center gap-[2px]">
                          <span className="text-[16px] text-[#383838]">互動標籤</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                                <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                              </svg>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>建立按鈕互動標籤，了解顧客偏好與輪廓</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                      </div>
                      <div className="flex-1 space-y-[2px]">
                        <Input 
                          value={currentCard.button1Tag}
                          onChange={(e) => updateCard({ button1Tag: e.target.value })}
                          placeholder="點擊 Enter 即可新增互動標籤"
                          className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                          maxLength={20}
                        />
                        <p className="text-[12px] text-right text-[#6e6e6e]">
                          {currentCard.button1Tag.length}<span className="text-[#383838]">/20</span>
                        </p>
                      </div>
                    </div>

                    {currentCard.button1Action === 'text' && (
                      <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                        <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                          <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                            <Checkbox />
                          </div>
                          <Label className="flex items-center gap-[2px]">
                            <span className="text-[16px] text-[#383838]">觸發文字</span>
                            <span className="text-[16px] text-[#f44336]">*</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                                  <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                                </svg>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>輸入觸發文字</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        </div>
                        <div className="flex-1 space-y-[2px]">
                          <div className="relative group">
                            <input
                              type="text"
                              value={currentCard.button1Text || ''}
                              onChange={(e) => {
                                if (e.target.value.length <= 100) {
                                  updateCard({ button1Text: e.target.value });
                                }
                              }}
                              placeholder="輸入訊息文字"
                              className="flex h-[48px] w-full rounded-[8px] border border-neutral-100 bg-white px-3 py-1 text-base transition-[color,box-shadow] placeholder:text-[#717182] focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                            />
                          </div>
                          <p className="text-[12px] text-right text-[#6e6e6e]">
                            {currentCard.button1Text?.length || 0}<span className="text-[#383838]">/100</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {currentCard.button1Action === 'image' && (
                      <div className="flex flex-col sm:flex-row items-start gap-4 w-full" onClick={() => button1TriggerImageInputRef.current?.click()}>
                        <ActionTriggerImageMessage />
                      </div>
                    )}

                    {currentCard.button1Action === 'url' && (
                      <>
                        <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                          <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                            <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                              <Checkbox />
                            </div>
                            <Label className="flex items-center gap-[2px]">
                              <span className="text-[16px] text-[#383838]">URL</span>
                              <span className="text-[16px] text-[#f44336]">*</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                                    <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                                  </svg>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>輸入完整網址</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                          </div>
                          <div className="flex-1">
                            <Input 
                              value={currentCard.button1Url}
                              onChange={(e) => updateCard({ button1Url: e.target.value })}
                              placeholder="輸入網址"
                              className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Button 2 */}
                {!currentCard.enableButton2 ? (
                  <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                    <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                      <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                        <Checkbox />
                      </div>
                      <button
                        onClick={() => updateCard({ enableButton2: true })}
                        className="text-[16px] text-[#0f6beb] hover:underline"
                        disabled={!currentCard.enableButton1}
                      >
                        ＋ 新增按鈕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                      <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                        <div className="flex gap-[10px] items-center justify-center size-[24px]">
                          <button
                            onClick={() => {
                              updateCard({ 
                                enableButton2: false,
                                button2: '',
                                button2Tag: '',
                                button2Action: 'select',
                                button2Url: '',
                                button2Text: '',
                                button2TriggerImage: null,
                              });
                            }}
                            className="text-[#f44336] hover:text-[#d32f2f]"
                          >
                            <Trash2 className="size-[20px]" />
                          </button>
                        </div>
                        <Label className="flex items-center gap-[2px]">
                          <span className="text-[16px] text-[#383838]">動作按鈕二</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                                <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                              </svg>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>設定按鈕文字與觸發後的互動類型</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                      </div>
                      <div className="flex-1 space-y-[2px]">
                        <Input 
                          value={currentCard.button2}
                          onChange={(e) => updateCard({ button2: e.target.value })}
                          placeholder="輸入動作按鈕"
                          className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                          maxLength={12}
                        />
                        <p className="text-[12px] text-right text-[#6e6e6e]">
                          {currentCard.button2.length}<span className="text-[#383838]">/12</span>
                        </p>
                      </div>
                    </div>

                    {/* Button 2 Interactive Type - 互動類型 */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                      <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                        <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                          <Checkbox />
                        </div>
                        <Label className="flex items-center">
                          <span className="text-[16px] text-[#383838]">互動類型</span>
                          <span className="text-[16px] text-[#f44336]">*</span>
                        </Label>
                      </div>
                      <Select value={currentCard.button2Action} onValueChange={(value) => updateCard({ button2Action: value })}>
                        <SelectTrigger className={`flex-1 h-[48px] py-1 rounded-[8px] border-neutral-100 bg-white ${currentCard.button2Action === 'select' ? 'text-[#717182]' : ''}`}>
                          <SelectValue placeholder="選擇互動類型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select" className="text-[#717182]">選擇互動類型</SelectItem>
                          <SelectItem value="url">開啟網址</SelectItem>
                          <SelectItem value="text">觸發文字</SelectItem>
                          <SelectItem value="image">觸發圖片</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Button 2 Interactive Tag */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                      <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                        <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                          <Checkbox />
                        </div>
                        <Label className="flex items-center gap-[2px]">
                          <span className="text-[16px] text-[#383838]">互動標籤</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                                <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                              </svg>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>建立按鈕互動標籤，了解顧客偏好與輪廓</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                      </div>
                      <div className="flex-1 space-y-[2px]">
                        <Input 
                          value={currentCard.button2Tag}
                          onChange={(e) => updateCard({ button2Tag: e.target.value })}
                          placeholder="點擊 Enter 即可新增互動標籤"
                          className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                          maxLength={20}
                        />
                        <p className="text-[12px] text-right text-[#6e6e6e]">
                          {currentCard.button2Tag.length}<span className="text-[#383838]">/20</span>
                        </p>
                      </div>
                    </div>

                    {currentCard.button2Action === 'url' && (
                      <>
                        <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                          <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                            <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                              <Checkbox />
                            </div>
                            <Label className="flex items-center gap-[2px]">
                              <span className="text-[16px] text-[#383838]">URL</span>
                              <span className="text-[16px] text-[#f44336]">*</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                                    <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                                  </svg>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>輸入完整網址</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                          </div>
                          <div className="flex-1">
                            <Input 
                              value={currentCard.button2Url}
                              onChange={(e) => updateCard({ button2Url: e.target.value })}
                              placeholder="輸入網址"
                              className="h-[48px] rounded-[8px] border-neutral-100 bg-white"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {currentCard.button2Action === 'text' && (
                      <>
                        <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                          <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                            <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                              <Checkbox />
                            </div>
                            <Label className="flex items-center gap-[2px]">
                              <span className="text-[16px] text-[#383838]">觸發文字</span>
                              <span className="text-[16px] text-[#f44336]">*</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                                    <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
                                  </svg>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>輸入觸發文字</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                          </div>
                          <div className="flex-1 space-y-[2px]">
                            <div className="relative group">
                              <input
                                type="text"
                                value={currentCard.button2Text || ''}
                                onChange={(e) => {
                                  if (e.target.value.length <= 100) {
                                    updateCard({ button2Text: e.target.value });
                                  }
                                }}
                                placeholder="輸入訊息文字"
                                className="flex h-[48px] w-full rounded-[8px] border border-neutral-100 bg-white px-3 py-1 text-base transition-[color,box-shadow] placeholder:text-[#717182] focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                              />
                            </div>
                            <p className="text-[12px] text-right text-[#6e6e6e]">
                              {currentCard.button2Text?.length || 0}<span className="text-[#383838]">/100</span>
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {currentCard.button2Action === 'image' && (
                      <div className="flex flex-col sm:flex-row items-start gap-4 w-full" onClick={() => button2TriggerImageInputRef.current?.click()}>
                        <ActionTriggerImageMessage />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
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

      {/* Validation Dialog */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContentNoClose className="max-w-[480px]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <DialogTitle className="text-[20px] text-[#383838]">
                請填寫必填欄位
              </DialogTitle>
              <DialogDescription className="text-[14px] text-[#6e6e6e]">
                以下欄位為必填，請完成填寫後再發佈：
              </DialogDescription>
            </div>
            
            <div className="bg-[#fff5f5] border border-[#ffdddd] rounded-[8px] p-4 max-h-[300px] overflow-y-auto">
              <ul className="space-y-2">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2 text-[14px] text-[#f44336]">
                    <span className="shrink-0 mt-[2px]">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setValidationDialogOpen(false)}
                className="bg-[#0f6beb] hover:bg-[#0d5bc9] text-white h-[48px] px-6 rounded-[16px]"
              >
                知道了
              </Button>
            </div>
          </div>
        </DialogContentNoClose>
      </Dialog>
    </TooltipProvider>
  );
}
