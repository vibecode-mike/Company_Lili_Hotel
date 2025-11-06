import { useState, useRef, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { Menu, X, Copy, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import imgBackgroundImage from "figma:asset/d1c10d8dbfc2ae5783543c9f0b76cd2635713297.png";
import Layout from './Layout';
import FilterModal from './FilterModal';
import svgPaths from '../imports/svg-gu16o9nwcc';
import closeIconPaths from '../imports/svg-b62f9l13m2';
import uploadIconPaths from '../imports/svg-wb8nmg8j6i';
import Container7 from '../imports/Container';
import ActionTriggerTextMessage from '../imports/ActionTriggerTextMessage';
import ActionTriggerImageMessage from '../imports/ActionTriggerImageMessage';
import TriggerImagePreview from '../imports/Container-32-2033';
import TriggerTextPreview from '../imports/Container-37-43';
import { FlexMessageEditorWrapper } from './flex-message/FlexMessageEditorWrapper';
import { campaignService } from '../services/campaignService';
import { uploadService } from '../services/uploadService';
import { transformFormToCreateRequest, validateForm, validateFormWithFieldErrors, type FieldErrors } from '../utils/dataTransform';
import { TemplateTypeDisplay } from '../types/campaign';
import type { MessageCreationForm, TemplateType, TargetType } from '../types/campaign';

const TEMPLATE_TYPE_OPTIONS: TemplateType[] = ['text_button', 'image_card', 'image_click', 'text'];

export default function MessageCreation() {
  const { navigate } = useNavigation();
  const [templateType, setTemplateType] = useState<TemplateType | null>(null);
  const [title, setTitle] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');
  const [previewMsg, setPreviewMsg] = useState('');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [targetType, setTargetType] = useState('all');
  const [activeTab, setActiveTab] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFilterTags, setSelectedFilterTags] = useState<Array<{ id: string; name: string }>>([]);
  const [filterCondition, setFilterCondition] = useState<'include' | 'exclude'>('include');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState({ hours: '12', minutes: '00' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorCount, setErrorCount] = useState<number>(0);
  const [estimatedCount, setEstimatedCount] = useState<number>(0);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const carouselContainerRef = useRef<HTMLDivElement>(null);
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
      enableButton1: true,
      enableButton2: false,
      image: '',
      imageFile: null as File | null,
      cardTitle: '標題文字',
      content: '內文文字說明',
      price: '',
      currency: 'ntd',
      button1: '動作按鈕一',
      button2: '',
      button1Action: 'select',
      button1Url: '',
      button1Tag: '',
      button1Text: '',
      button1TriggerImage: null as File | string | null,
      button2Action: 'select',
      button2Url: '',
      button2Tag: '',
      button2Text: '',
      button2TriggerImage: null as File | null,
      imageUploadStatus: 'idle' as 'idle' | 'uploading' | 'success'
    }
  ]);

  const currentCard = cards.find(c => c.id === activeTab) || cards[0];

  const updateCard = (updates: Partial<typeof currentCard>) => {
    setCards(prevCards => prevCards.map(card =>
      card.id === activeTab ? { ...card, ...updates } : card
    ));
  };

  // Create stable URLs for trigger images
  const [triggerImageUrl, setTriggerImageUrl] = useState<string | undefined>();
  const [flexMessageJson, setFlexMessageJson] = useState<string>('');

  useEffect(() => {
    let objectUrl: string | undefined;

    const resolveTriggerSource = (): File | string | null => {
      if (currentCard.button1Action === 'image' && currentCard.button1TriggerImage) {
        return currentCard.button1TriggerImage;
      }
      if (currentCard.button2Action === 'image' && currentCard.button2TriggerImage) {
        return currentCard.button2TriggerImage;
      }
      return null;
    };

    const source = resolveTriggerSource();

    if (!source) {
      setTriggerImageUrl(undefined);
      return;
    }

    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      setTriggerImageUrl(objectUrl);
    } else {
      setTriggerImageUrl(source);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentCard.button1Action, currentCard.button1TriggerImage, currentCard.button2Action, currentCard.button2TriggerImage]);

  // Fetch estimated audience count when target changes
  useEffect(() => {
    const fetchEstimate = async () => {
      setLoadingEstimate(true);
      try {
        const requestData: any = {
          type: targetType === 'all' ? 'all' : 'filtered',
          condition: filterCondition,
          tags: targetType === 'filtered' && selectedFilterTags.length > 0
            ? selectedFilterTags.map(tag => parseInt(tag.id))
            : [],
        };

        const response = await campaignService.estimateAudience(requestData);

        if (response.error) {
          console.error('估算受众失败:', response.error);
          setEstimatedCount(0);
        } else if (response.data) {
          // 后端返回 { code, data: { count } } 格式
          const count = (response.data as any).data?.count || response.data.count || 0;
          setEstimatedCount(count);
        }
      } catch (error) {
        console.error('估算受众失败:', error);
        setEstimatedCount(0);
      } finally {
        setLoadingEstimate(false);
      }
    };

    fetchEstimate();
  }, [targetType, selectedFilterTags, filterCondition]);

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
        image: '',
        imageFile: null as File | null,
        cardTitle: '',
        content: '',
        price: '',
        currency: firstCard.currency,
        button1: '',
        button2: '',
        button1Action: firstCard.button1Action,
        button1Url: '',
        button1Tag: '',
        button1Text: '',
        button1TriggerImage: null as File | string | null,
        button2Action: firstCard.button2Action,
        button2Url: '',
        button2Tag: '',
        button2Text: '',
        button2TriggerImage: null as File | null,
        imageUploadStatus: 'idle' as 'idle' | 'uploading' | 'success'
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

  const handleButton1TriggerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('檔案格式錯誤，請上傳 JPG、JPEG 或 PNG 格式的圖片');
        return;
      }
      
      // Validate file size (5MB = 5242880 bytes)
      if (file.size > 5242880) {
        toast.error('圖片大小超過 5 MB，請選擇較小的圖片');
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
      
      // Validate file size (5MB = 5242880 bytes)
      if (file.size > 5242880) {
        toast.error('圖片大小超過 5 MB，請選擇較小的圖片');
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
        setCards([...cards, { ...cardToCopy, id: newId, imageUploadStatus: 'idle' as 'idle' | 'uploading' | 'success' }]);
        setActiveTab(newId);
        toast.success('已複製輪播');
      }
    } else {
      toast.error('最多只能有 4 個輪播');
    }
  };

  type CardAssetUploadResult = {
    imageUrl: string;
    button1TriggerImageUrl?: string;
  };

  const uploadCardAssets = async (): Promise<CardAssetUploadResult[]> => {
    const results: CardAssetUploadResult[] = [];
    const updatedCards = [...cards];

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      let imageUrl = '';

      if (card.imageFile instanceof File) {
        const response = await uploadService.uploadImage(card.imageFile);
        if (response.error) {
          throw new Error(
            typeof response.error.detail === 'string'
              ? response.error.detail
              : '圖片上傳失敗'
          );
        }
        imageUrl = response.data?.data.url || '';
      } else if (
        typeof card.image === 'string' &&
        card.image.trim() !== '' &&
        /^https?:\/\//.test(card.image.trim())
      ) {
        imageUrl = card.image;
      }

      let button1TriggerImageUrl: string | undefined;
      if (card.button1Action === 'image' && card.button1TriggerImage) {
        if (card.button1TriggerImage instanceof File) {
          const response = await uploadService.uploadImage(card.button1TriggerImage);
          if (response.error) {
            throw new Error(
              typeof response.error.detail === 'string'
                ? response.error.detail
                : '觸發圖片上傳失敗'
            );
          }
          button1TriggerImageUrl = response.data?.data.url || '';
        } else if (typeof card.button1TriggerImage === 'string') {
          button1TriggerImageUrl = card.button1TriggerImage;
        }
      }

      results.push({
        imageUrl,
        button1TriggerImageUrl,
      });

      updatedCards[index] = {
        ...card,
        image: imageUrl || card.image,
        imageFile: null,
        button1TriggerImage: button1TriggerImageUrl || card.button1TriggerImage,
      };
    }

    setCards(updatedCards);

    return results;
  };

  const buildFormData = (assets: CardAssetUploadResult[], selectedTemplateType: TemplateType | null): MessageCreationForm => {
    // Convert scheduled time to Date if needed
    let scheduledDateTime: Date | undefined;
    if (scheduleType === 'scheduled' && scheduledDate) {
      scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(parseInt(scheduledTime.hours));
      scheduledDateTime.setMinutes(parseInt(scheduledTime.minutes));
    }

    const resolvedTemplateType: TemplateType = selectedTemplateType ?? 'image_card';

    return {
      templateType: resolvedTemplateType,
      title,
      notificationMsg,
      previewMsg,
      scheduleType: scheduleType as 'immediate' | 'scheduled',
      scheduledTime: scheduledDateTime,
      targetType: targetType as TargetType,
      targetCondition: filterCondition,
      targetTags: selectedFilterTags.map(tag => parseInt(tag.id, 10)),
      cards: cards.map((card, index) => {
        const asset = assets[index];
        const buttonEnabled = card.enableButton1 && card.button1 && card.button1Action !== 'select';
        let buttonAction: 'url' | 'message' | 'postback' | 'image' | undefined;
        let buttonValue: string | undefined;
        let triggerImageUrl: string | undefined;

        if (buttonEnabled) {
          if (card.button1Action === 'url') {
            buttonAction = 'url';
            buttonValue = card.button1Url;
          } else if (card.button1Action === 'text') {
            buttonAction = 'message';
            buttonValue = card.button1Text;
          } else if (card.button1Action === 'image') {
            buttonAction = 'image';
            triggerImageUrl =
              asset?.button1TriggerImageUrl ||
              (typeof card.button1TriggerImage === 'string' ? card.button1TriggerImage : undefined);
          } else {
            buttonAction = 'postback';
            buttonValue = card.button1Tag;
          }
        }

        const fallbackImageUrl =
          typeof card.image === 'string' && /^https?:\/\//.test(card.image.trim())
            ? card.image
            : '';

        return {
          imageUrl: asset?.imageUrl || fallbackImageUrl,
          title: card.cardTitle,
          description: card.content,
          button1: buttonEnabled && buttonAction ? {
            text: card.button1,
            action: buttonAction,
            value: buttonValue,
            triggerImageUrl,
            tag: card.button1Tag || undefined,
          } : undefined,
          button2: card.enableButton2 && card.button2 ? {
            text: card.button2,
            action: card.button2Action === 'url' ? 'url' : (card.button2Action === 'text' ? 'message' : 'postback'),
            value: card.button2Url || card.button2Text || card.button2Tag || '',
          } : undefined,
        };
      }),
    };
  };

  const handleSaveDraft = async () => {
    setFieldErrors({});
    setErrorCount(0);
    if (submitting) return;

    setSubmitting(true);
    try {
      // Upload images first
      const assets = await uploadCardAssets();

      // Build form data
      const formData = buildFormData(assets, templateType);

      // Validate with field-level errors
      const validation = validateFormWithFieldErrors(formData);
      if (!validation.isValid) {
        setFieldErrors(validation.fieldErrors);
        setErrorCount(validation.errorCount);
        toast.error(`請修正 ${validation.errorCount} 個驗證問題`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setSubmitting(false);
        return;
      }

      // Transform and create campaign
      const requestData = transformFormToCreateRequest(formData, true);
      const response = await campaignService.createCampaign(requestData);

      if (response.error) {
        const errorMsg = typeof response.error.detail === 'string'
          ? response.error.detail
          : '儲存草稿失敗';
        toast.error(errorMsg);
      } else {
        setFieldErrors({});
        setErrorCount(0);
        toast.success('草稿已儲存');
        setTimeout(() => navigate('messages'), 1000);
      }
    } catch (error) {
      console.error('儲存草稿失敗:', error);
      const errorMsg = error instanceof Error ? error.message : '儲存失敗，請稍後再試';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    console.log('🔵 handlePublish called');
    // Clear previous validation errors
    setFieldErrors({});
    setErrorCount(0);

    if (submitting) {
      console.log('⚠️ Already submitting, returning');
      return;
    }

    // Basic validation - before setting submitting
    if (!title || !notificationMsg || !previewMsg) {
      console.log('❌ Missing required fields');
      const errors: FieldErrors = {
        title: !title ? '請輸入活動標題' : undefined,
        notificationMsg: !notificationMsg ? '請輸入通知訊息' : undefined,
        previewMsg: !previewMsg ? '請輸入通知預覽' : undefined,
      };
      const count = ((!title ? 1 : 0) + (!notificationMsg ? 1 : 0) + (!previewMsg ? 1 : 0));
      console.log('🔴 Setting fieldErrors:', errors);
      console.log('🔴 Setting errorCount:', count);
      setFieldErrors(errors);
      setErrorCount(count);
      toast.error('請填寫訊息標題、通知訊息與通知預覽');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    console.log('✅ Validation passed, setting submitting to true');
    setSubmitting(true);
    try {
      console.log('📤 Starting image upload...');
      // Upload images first
      const assets = await uploadCardAssets();
      console.log('✅ Images uploaded:', assets);

      // Build form data
      console.log('🏗️ Building form data...');
      const formData = buildFormData(assets, templateType);
      console.log('✅ Form data built:', formData);

      // Validate with field-level errors
      console.log('🔍 Validating form...');
      const validation = validateFormWithFieldErrors(formData);
      if (!validation.isValid) {
        console.log('❌ Validation failed:', validation.fieldErrors);
        setFieldErrors(validation.fieldErrors);
        setErrorCount(validation.errorCount);
        toast.error(`請修正 ${validation.errorCount} 個驗證問題`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setSubmitting(false); // Reset state on validation failure
        return;
      }
      console.log('✅ Validation passed');
      setFieldErrors({}); // Clear errors on successful validation
      setErrorCount(0);

      // Transform and create campaign (後端會自動發送)
      console.log('🔄 Transforming request data...');
      const requestData = transformFormToCreateRequest(formData, false);
      console.log('📡 Sending request to backend:', requestData);
      const response = await campaignService.createCampaign(requestData);
      console.log('📥 Response received:', response);

      if (response.error) {
        const errorMsg = typeof response.error.detail === 'string'
          ? response.error.detail
          : '發佈失敗';
        console.log('❌ Error response:', errorMsg);
        toast.error(errorMsg);
      } else {
        // 後端已自動發送，顯示發送結果
        const sentCount = response.data?.data?.sent_count || 0;
        console.log('✅ Success! Sent to', sentCount, 'users');
        if (sentCount > 0) {
          toast.success(`訊息已發送至 ${sentCount} 位用戶`);
        } else {
          toast.success('訊息已發佈');
        }
        setTimeout(() => navigate('messages'), 1000);
      }
    } catch (error) {
      console.error('❌ Exception caught:', error);
      const errorMsg = error instanceof Error ? error.message : '發佈失敗，請稍後再試';
      toast.error(errorMsg);
    } finally {
      console.log('🔚 Finally block, setting submitting to false');
      setSubmitting(false);
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
      // 清除排程時間的驗證錯誤
      if (fieldErrors.scheduledTime) {
        setFieldErrors(prev => ({ ...prev, scheduledTime: undefined }));
        setErrorCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <Layout activeSection="messages">
      <TooltipProvider>
        <div className="w-full min-h-screen">
          {/* Breadcrumb */}
          <div className="box-border flex items-center pb-0 pt-[48px] px-[40px]">
            <div className="box-border flex gap-1 items-center p-1">
              <p
                className="text-[14px] text-[#6e6e6e] cursor-pointer hover:text-[#0f6beb] transition-colors"
                onClick={() => navigate('messages')}
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
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-[8px] items-center">
                  <Button
                    onClick={handleSaveDraft}
                    disabled={submitting}
                    className="bg-[#f0f6ff] text-[#0f6beb] hover:bg-[#e0ecff] h-[48px] px-3 min-w-[72px] rounded-[16px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '儲存中...' : '儲存草稿'}
                  </Button>
                  <button
                    onClick={handlePublish}
                    disabled={submitting}
                    className="bg-[#242424] hover:bg-[#383838] transition-colors flex items-center justify-center min-h-[48px] min-w-[72px] px-[16px] py-[8px] rounded-[16px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-white text-[16px] leading-[1.5] text-center">
                      {submitting ? '發佈中...' : '發佈'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields Row 1 */}
            <div className="flex flex-col xl:flex-row gap-[32px] xl:gap-[120px] items-start w-full">
              <div className="flex-1 flex flex-col sm:flex-row items-start gap-4 w-full">
                <Label className="min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] pt-3 flex items-center gap-1">
                  <span className="text-[16px] text-[#383838]">模板類型</span>
                  <span className="text-[16px] text-[#f44336]">*</span>
                </Label>
                <div className="flex-1 flex flex-col gap-[2px]">
                  <Select
                    value={templateType ?? undefined}
                    onValueChange={(value) => {
                      console.log('🔵 Template type changed to:', value);
                      setTemplateType(value as TemplateType);
                      if (fieldErrors.templateType) {
                        console.log('🟢 Clearing templateType error');
                        setFieldErrors(prev => ({ ...prev, templateType: undefined }));
                        setErrorCount(prev => Math.max(0, prev - 1));
                      }
                    }}
                  >
                    <SelectTrigger
                      className={`flex-1 !h-[48px] rounded-[8px] bg-white ${!templateType ? 'text-[#717182]' : ''}`}
                      style={{
                        borderColor: '#e5e5e5',
                        borderWidth: '1px'
                      }}
                    >
                      <SelectValue placeholder="選擇模板類型" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {TemplateTypeDisplay[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) {
                        setFieldErrors(prev => ({ ...prev, title: undefined }));
                        setErrorCount(prev => Math.max(0, prev - 1));
                      }
                    }}
                    onFocus={() => {
                      if (fieldErrors.title) {
                        setFieldErrors(prev => ({ ...prev, title: undefined }));
                        setErrorCount(prev => Math.max(0, prev - 1));
                      }
                    }}
                    placeholder="輸入訊息"
                    maxLength={32}
                    className="w-full h-[48px] rounded-[8px] bg-white"
                    style={{
                      borderColor: '#e5e5e5',
                      borderWidth: '1px'
                    }}
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
                      <p>使用者接收通知時，顯示於裝置通知列的訊息文字</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex-1 flex flex-col gap-[2px] w-full">
                  <Input
                    value={notificationMsg}
                    onChange={(e) => {
                      setNotificationMsg(e.target.value);
                      if (fieldErrors.notificationMsg) {
                        setFieldErrors(prev => ({ ...prev, notificationMsg: undefined }));
                        setErrorCount(prev => Math.max(0, prev - 1));
                      }
                    }}
                    onFocus={() => {
                      if (fieldErrors.notificationMsg) {
                        setFieldErrors(prev => ({ ...prev, notificationMsg: undefined }));
                        setErrorCount(prev => Math.max(0, prev - 1));
                      }
                    }}
                    placeholder="顯示於裝置通知列的訊息內容"
                    maxLength={100}
                    className="h-[48px] rounded-[8px] bg-white"
                    style={{
                      borderColor: '#e5e5e5',
                      borderWidth: '1px'
                    }}
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
                    onChange={(e) => {
                      setPreviewMsg(e.target.value);
                      if (fieldErrors.previewMsg) {
                        setFieldErrors(prev => ({ ...prev, previewMsg: undefined }));
                        setErrorCount(prev => Math.max(0, prev - 1));
                      }
                    }}
                    onFocus={() => {
                      if (fieldErrors.previewMsg) {
                        setFieldErrors(prev => ({ ...prev, previewMsg: undefined }));
                        setErrorCount(prev => Math.max(0, prev - 1));
                      }
                    }}
                    placeholder="顯示於聊天室過通知列的訊息內容"
                    maxLength={100}
                    className="h-[48px] rounded-[8px] bg-white"
                    style={{
                      borderColor: '#e5e5e5',
                      borderWidth: '1px'
                    }}
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
                  <Label htmlFor="scheduled" className="cursor-pointer text-[16px] text-[#383838]">
                    自訂時間
                  </Label>
                  <div className="flex flex-col gap-1">
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild disabled={scheduleType === 'immediate'}>
                        <div
                          className={`bg-white rounded-[8px] px-[8px] py-[8px] w-[298px] flex items-center gap-6 transition-colors ${scheduleType === 'immediate' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-neutral-200'}`}
                          style={{
                            borderColor: '#e5e5e5',
                            borderWidth: '1px'
                          }}
                        >
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
                </div>
              </RadioGroup>
            </div>

            {/* Target Audience Section */}
            <div className="flex items-start gap-4 w-full">
              <Label className="min-w-[160px] pt-1 flex items-center gap-1">
                <span className="text-[16px] text-[#383838]">發送對象</span>
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
                    {targetType === 'filtered' && (
                      <div className="flex flex-col gap-1">
                        <div
                          className="bg-white max-w-[600px] min-w-[300px] rounded-[8px] shrink-0 w-full"
                          style={{
                            borderColor: '#e5e5e5',
                            borderWidth: '1px'
                          }}
                        >
                        <div className="flex flex-col justify-center max-w-inherit min-w-inherit size-full">
                          <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center max-w-inherit min-w-inherit p-[8px] w-full">
                            {selectedFilterTags.length > 0 && (
                              <>
                                {selectedFilterTags.map(tag => (
                                  <div key={tag.id} className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0">
                                    <p className="basis-0 font-normal grow leading-[1.5] min-h-px min-w-px shrink-0 text-[#eba20f] text-[16px]">{tag.name}</p>
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
                              <DialogContent className="!max-w-[700px] !w-[700px] sm:!max-w-[700px] sm:!w-[700px] h-[780px] p-0 bg-transparent border-0" style={{ width: '700px', maxWidth: '700px' }} hideClose>
                                <DialogTitle className="sr-only">篩選目標對象</DialogTitle>
                                <DialogDescription className="sr-only">選擇或建立標籤來篩選目標對象</DialogDescription>
                                <FilterModal
                                  onClose={() => setModalOpen(false)}
                                  onConfirm={handleFilterConfirm}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                </RadioGroup>
                <div className="flex items-center gap-[40px]">
                  <div className="relative w-[158.824px] h-[158.824px]">
                    <svg className="w-full h-full -rotate-90">
                      <circle 
                        cx="79.412" 
                        cy="79.412" 
                        r="75.412" 
                        fill="none" 
                        stroke="#00a81c" 
                        strokeWidth="8"
                      />
                    </svg>
                    <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px absolute inset-0 shrink-0">
                      <p className="font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[36px] text-nowrap whitespace-pre">100%</p>
                    </div>
                  </div>
                  <p className="text-[16px] text-[#383838]">
                    預計發送好友人數：{loadingEstimate ? '計算中...' : `${estimatedCount}人`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Flex Message Editor Section */}
          <div className="box-border flex flex-col gap-[32px] items-start p-[40px]">
            <div className="w-full">
              <FlexMessageEditorWrapper
                initialJson={flexMessageJson}
                onChange={setFlexMessageJson}
              />
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
        </div>
      </TooltipProvider>
    </Layout>
  );
}
