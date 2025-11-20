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
import CarouselMessageEditor from './CarouselMessageEditor';
import { TriggerImagePreview, TriggerTextPreview, GradientPreviewContainer } from './common/PreviewContainers';
import ActionTriggerTextMessage from '../imports/ActionTriggerTextMessage';
import ActionTriggerImageMessage from '../imports/ActionTriggerImageMessage';
import Sidebar from './Sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { ScheduleSettings, TargetAudienceSelector, PreviewPanel } from './message-creation';
import type { Tag } from './message-creation';
import { useMessages } from '../contexts/MessagesContext';

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
  onNavigateToSettings?: () => void;
  editMessageId?: string | null;
  editMessageData?: {
    title: string;
    notificationMsg: string;
    previewMsg: string;
    scheduleType: string;
    targetType: string;
    templateType: string;
    flexMessageJson?: any;
    selectedFilterTags?: Array<{ id: string; name: string }>;
    filterCondition?: 'include' | 'exclude';
    scheduledDate?: Date;
    scheduledTime?: { hours: string; minutes: string };
  };
}

export default function MessageCreation({ onBack, onNavigate, onNavigateToSettings, editMessageId, editMessageData }: MessageCreationProps = {}) {
  // Get quota status from MessagesContext
  const { quotaStatus } = useMessages();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [templateType, setTemplateType] = useState(editMessageData?.templateType || 'select');
  const [title, setTitle] = useState(editMessageData?.title || '');
  const [notificationMsg, setNotificationMsg] = useState(editMessageData?.notificationMsg || '');
  const [previewMsg, setPreviewMsg] = useState(editMessageData?.previewMsg || '');
  const [scheduleType, setScheduleType] = useState(editMessageData?.scheduleType || 'immediate');
  const [targetType, setTargetType] = useState(editMessageData?.targetType || 'all');
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [flexMessageJson, setFlexMessageJson] = useState<any>(editMessageData?.flexMessageJson || null);
  const [selectedFilterTags, setSelectedFilterTags] = useState<Array<{ id: string; name: string }>>(editMessageData?.selectedFilterTags || []);
  const [filterCondition, setFilterCondition] = useState<'include' | 'exclude'>(editMessageData?.filterCondition || 'include');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(editMessageData?.scheduledDate);
  const [scheduledTime, setScheduledTime] = useState(editMessageData?.scheduledTime || { hours: '12', minutes: '00' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false); // 追蹤是否有未儲存的變更
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false); // 顯示未儲存確認對話框
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null); // 待執行的導航
  const [estimatedRecipientCount, setEstimatedRecipientCount] = useState<number | null>(null); // 預計發送人數
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Monitor flexMessageJson changes
  useEffect(() => {
    // Flex Message JSON is ready for use
  }, [flexMessageJson]);

  // Fetch estimated recipient count when target settings change
  useEffect(() => {
    const fetchEstimatedRecipientCount = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        // Prepare request body for quota API (same endpoint gives us recipient count)
        const requestBody: any = {
          target_type: targetType === 'all' ? 'all_friends' : 'filtered'
        };

        // Add filter conditions for filtered audience
        if (targetType === 'filtered' && selectedFilterTags.length > 0) {
          requestBody.target_filter = {
            [filterCondition]: selectedFilterTags.map(t => t.name)
          };
        }

        const response = await fetch('/api/v1/messages/quota', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const result = await response.json();
          // The quota API returns estimated_send_count
          setEstimatedRecipientCount(result.estimated_send_count || 0);
        }
      } catch (error) {
        console.error('獲取預計發送人數錯誤:', error);
        // Don't show error to user, just keep showing loading state
      }
    };

    fetchEstimatedRecipientCount();
  }, [targetType, selectedFilterTags, filterCondition]);

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
      button1TriggerImageUrl: '',
      button1Mode: 'primary' as 'primary' | 'secondary' | 'link',
      button2Action: 'select',
      button2Url: '',
      button2Tag: '',
      button2Text: '',
      button2TriggerImage: null as File | null,
      button2TriggerImageUrl: '',
      button2Mode: 'secondary' as 'primary' | 'secondary' | 'link',
      button3Action: 'select',
      button3Url: '',
      button3Tag: '',
      button3Text: '',
      button3TriggerImage: null as File | null,
      button3TriggerImageUrl: '',
      button3Mode: 'secondary' as 'primary' | 'secondary' | 'link',
      button4Action: 'select',
      button4Url: '',
      button4Tag: '',
      button4Text: '',
      button4TriggerImage: null as File | null,
      button4TriggerImageUrl: '',
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
  }, [title, notificationMsg, previewMsg, messageText, targetType, scheduleType, selectedFilterTags, cards]);

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

  const handleSaveDraft = () => {
    setIsDirty(false); // 儲存後清除未儲存標記
    toast.success('草稿已儲存');
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Check basic required fields
    if (!title) errors.push('訊息標題');
    if (!notificationMsg) errors.push('通知推播');
    if (!previewMsg) errors.push('通知預覽');
    // 訊息文字不再是必填欄位（已移除模板之分）

    // Check enabled buttons
    cards.forEach((card, index) => {
      const cardLabel = cards.length > 1 ? `輪播 ${index + 1} - ` : '';
      
      // Check card title for each card
      if (!card.cardTitle) {
        errors.push(`${cardLabel}標題文字`);
      }
      
      // Check Button 1
      if (card.enableButton1) {
        if (!card.button1) {
          errors.push(`${cardLabel}動作按鈕一 - 按鈕文字`);
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

      // Check Button 2
      if (card.enableButton2) {
        if (!card.button2) {
          errors.push(`${cardLabel}動作按鈕二 - 按鈕文字`);
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

  // Image upload handler - uploads to backend and returns URL
  const handleImageUpload = async (file: File): Promise<string | null> => {
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

      const formData = new FormData();
      formData.append('file', file);

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
        return result.data.url;
      } else {
        throw new Error(result.message || '圖片上傳失敗');
      }
    } catch (error) {
      console.error('圖片上傳錯誤:', error);
      toast.error('圖片上傳失敗，請重試');
      return null;
    }
  };

  // Generate LINE Flex Message JSON from cards
  const generateFlexMessage = (cardsToUse = cards) => {
    const bubbles = cardsToUse.map(card => {
      const bubble: any = {
        type: "bubble",
        size: "mega"
      };

      // Hero image
      if (card.enableImage && card.image) {
        bubble.hero = {
          type: "image",
          url: card.image,
          size: "full",
          aspectRatio: "1.92:1",
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
        const actionKey = `button${buttonNum}Action` as keyof typeof card;
        const urlKey = `button${buttonNum}Url` as keyof typeof card;
        const textKey = `button${buttonNum}Text` as keyof typeof card;
        const modeKey = `button${buttonNum}Mode` as keyof typeof card;
        const triggerImageUrlKey = `button${buttonNum}TriggerImageUrl` as keyof typeof card;

        if (!card[enableKey]) return;

        const buttonText = card[buttonKey] as string;
        const action = card[actionKey] as string;
        const mode = card[modeKey] as string;

        const button: any = {
          type: "button",
          action: { type: "message", text: buttonText },
          style: mode === 'primary' ? 'primary' : (mode === 'link' ? 'link' : 'secondary'),
          height: "sm"
        };

        // Set button action based on type
        if (action === 'url') {
          const url = card[urlKey] as string;
          if (url) {
            button.action = {
              type: "uri",
              label: buttonText,
              uri: url
            };
          }
        } else if (action === 'text') {
          const text = card[textKey] as string;
          if (text) {
            button.action = {
              type: "message",
              label: buttonText,
              text: text
            };
          }
        } else if (action === 'image') {
          // Handle trigger image action
          const imageUrl = card[triggerImageUrlKey] as string;
          if (imageUrl) {
            button.action = {
              type: "uri",
              label: buttonText,
              uri: imageUrl
            };
          } else {
            // Fallback if image URL is not available
            button.action = {
              type: "message",
              label: buttonText,
              text: buttonText
            };
          }
        } else {
          // Default message action
          button.action = {
            type: "message",
            label: buttonText,
            text: buttonText
          };
        }

        footerContents.push(button);
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

  const handlePublish = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationDialogOpen(true);
      return;
    }

    try {
      // Upload trigger images first
      const cardsWithUploadedImages = await Promise.all(cards.map(async (card) => {
        const updates: any = {};

        // Upload button1 trigger image
        if (card.button1Action === 'image' && card.button1TriggerImage && !card.button1TriggerImageUrl) {
          const url = await handleImageUpload(card.button1TriggerImage);
          if (url) updates.button1TriggerImageUrl = url;
        }

        // Upload button2 trigger image
        if (card.button2Action === 'image' && card.button2TriggerImage && !card.button2TriggerImageUrl) {
          const url = await handleImageUpload(card.button2TriggerImage);
          if (url) updates.button2TriggerImageUrl = url;
        }

        // Upload button3 trigger image
        if (card.button3Action === 'image' && card.button3TriggerImage && !card.button3TriggerImageUrl) {
          const url = await handleImageUpload(card.button3TriggerImage);
          if (url) updates.button3TriggerImageUrl = url;
        }

        // Upload button4 trigger image
        if (card.button4Action === 'image' && card.button4TriggerImage && !card.button4TriggerImageUrl) {
          const url = await handleImageUpload(card.button4TriggerImage);
          if (url) updates.button4TriggerImageUrl = url;
        }

        return { ...card, ...updates };
      }));

      // Generate flex message JSON using cards with uploaded image URLs
      const flexMessage = generateFlexMessage(cardsWithUploadedImages);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('請先登入');
        return;
      }

      // Prepare request body
      const requestBody: any = {
        flex_message_json: JSON.stringify(flexMessage),
        target_type: targetType === 'all' ? 'all_friends' : 'filtered',
        schedule_type: scheduleType,
        notification_message: notificationMsg,
        preview_message: previewMsg || notificationMsg,
        message_content: title || notificationMsg || '未命名訊息',
        thumbnail: cards[0]?.image || null
      };

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

      // Create broadcast message
      const createResponse = await fetch('/api/v1/messages', {
        method: 'POST',
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
      const messageId = createResult.data?.id || createResult.id;

      if (!messageId) {
        toast.error('無法取得訊息 ID');
        return;
      }

      // Send immediately if schedule type is "immediate"
      if (scheduleType === 'immediate') {
        const sendResponse = await fetch(`/api/v1/messages/${messageId}/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!sendResponse.ok) {
          const errorData = await sendResponse.json().catch(() => ({ detail: '發送訊息失敗' }));
          toast.error(errorData.detail || '發送訊息失敗');
          return;
        }

        const sendResult = await sendResponse.json();
        const sentCount = sendResult.data?.sent_count || sendResult.sent_count || 0;

        toast.success(`發佈成功！已發送 ${sentCount} 則訊息`);
      } else {
        toast.success('草稿已儲存，將於排程時間發送');
      }

      setIsDirty(false); // 發佈後清除未儲存標記

      // Navigate back to message list after 1.5 seconds
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('message-list');
        }
      }, 1500);

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
                      <p>使用者接收通知時，顯於裝置通知列的訊息文字</p>
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
                    {estimatedRecipientCount !== null
                      ? `${estimatedRecipientCount.toLocaleString()} 人`
                      : '計算中...'}
                  </p>
                  <p className="text-[16px] text-[#383838] mt-[10px]">
                    可用訊息則數：
                    {quotaStatus
                      ? `${quotaStatus.availableQuota.toLocaleString()} 則`
                      : '載入中...'}
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
                onImageUpload={handleImageUpload}
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
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-[14px] text-[#383838]">{error}</li>
              ))}
            </ul>
            <div className="flex justify-end">
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
