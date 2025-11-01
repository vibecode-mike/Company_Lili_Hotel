import { useState, useRef, useEffect, useMemo } from 'react';
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
import svgPaths from '../imports/svg-jb10q6lg6b';
import splitButtonPaths from '../imports/svg-qkkkp98ojr';
import { imgGroup, imgGroup1, imgGroup2, imgGroup3, imgGroup4, imgGroup5, imgGroup6 } from "../imports/svg-zrjx6";
import imgBackgroundImage from "figma:asset/d1c10d8dbfc2ae5783543c9f0b76cd2635713297.png";
import FilterModal from './FilterModal';
import closeIconPaths from '../imports/svg-b62f9l13m2';
import uploadIconPaths from '../imports/svg-wb8nmg8j6i';
import messageTextSvgPaths from '../imports/svg-hbkooryl5v';
import Container7 from '../imports/Container';
import ActionTriggerTextMessage from '../imports/ActionTriggerTextMessage';
import ActionTriggerImageMessage from '../imports/ActionTriggerImageMessage';
import TriggerImagePreview from '../imports/Container-32-2033';
import TriggerTextPreview from '../imports/Container-37-43';

// Starbit Logo Component
function StarbitLogo() {
  return (
    <div className="h-[49.333px] overflow-clip relative shrink-0 w-[148px]">
      <div className="absolute inset-[24.73%_62.3%_43%_29.83%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
          <path clipRule="evenodd" d={svgPaths.p7342f80} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.24%_60.47%_37.55%_28.01%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.697px_2.706px] mask-size-[11.65px_15.923px]" style={{ maskImage: `url('${imgGroup}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 22">
          <path d={svgPaths.p361e8400} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[26.39%_53.22%_43.6%_38.6%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 15">
          <path clipRule="evenodd" d={svgPaths.p1f6b2880} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[20.91%_51.39%_38.13%_36.77%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.701px] mask-size-[12.116px_14.805px]" style={{ maskImage: `url('${imgGroup1}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={svgPaths.pa9b4c00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.29%_44.05%_43.6%_46.53%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 16">
          <path clipRule="evenodd" d={svgPaths.p26ade400} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.82%_42.23%_38.13%_44.71%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.696px] mask-size-[13.937px_15.348px]" style={{ maskImage: `url('${imgGroup2}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 21">
          <path d={svgPaths.p3b240180} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.29%_34.51%_43.6%_57.22%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
          <path clipRule="evenodd" d={svgPaths.p335ae980} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.82%_32.69%_38.13%_55.4%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.696px] mask-size-[12.235px_15.348px]" style={{ maskImage: `url('${imgGroup3}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={svgPaths.p2baf8a00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.3%_24.44%_43.6%_67.58%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
          <path clipRule="evenodd" d={svgPaths.p5c7b800} fill="#6ED7FF" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.82%_22.62%_38.13%_65.76%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.701px] mask-size-[11.801px_15.343px]" style={{ maskImage: `url('${imgGroup4}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={svgPaths.p20a15b00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[25.84%_20.11%_43.6%_77.65%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 16">
          <path d={svgPaths.p38d4b100} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[20.36%_18.29%_38.13%_75.83%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.703px_2.701px] mask-size-[3.31px_15.076px]" style={{ maskImage: `url('${imgGroup5}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 21">
          <path d={svgPaths.p31afde00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[26.39%_9.96%_43.6%_81.86%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 15">
          <path clipRule="evenodd" d={svgPaths.p18a2a000} fill="#6ED7FF" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[20.91%_8.13%_38.13%_80.03%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.702px_2.701px] mask-size-[12.114px_14.805px]" style={{ maskImage: `url('${imgGroup6}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={svgPaths.p1df19600} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[23.55%_79.27%_61.17%_10.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
          <path d={svgPaths.peae5a00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[38.83%_76.47%_42.23%_10.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 10">
          <path d={svgPaths.p56e0200} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[23.57%_76.37%_58.34%_18.22%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 9">
          <path d={svgPaths.p3047d700} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[53.48%_84.18%_26.93%_9.37%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p38a8ff00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[57.77%_76.47%_26.91%_12.72%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
          <path d={svgPaths.p29639800} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[22.41%_72.4%_67.66%_24.12%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 5">
          <path d={svgPaths.p29088600} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[63.59%_64.96%_25.62%_31.17%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p1b016f00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63%_56.2%_25.28%_40.09%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p3d5c5b00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63.13%_47.23%_25.2%_48.93%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p32938000} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.93%_38.59%_25.16%_57.81%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p2e055800} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.96%_29.55%_25.22%_66.71%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p1c98d3b0} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.9%_20.63%_25.25%_75.58%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p664e180} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63.18%_11.74%_25.36%_84.49%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p7d2500} fill="#189AEB" />
        </svg>
      </div>
    </div>
  );
}

interface MessageCreationProps {
  onBack?: () => void;
}

export default function MessageCreation({ onBack }: MessageCreationProps = {}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [templateType, setTemplateType] = useState('select');
  const [title, setTitle] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');
  const [previewMsg, setPreviewMsg] = useState('');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [targetType, setTargetType] = useState('all');
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFilterTags, setSelectedFilterTags] = useState<Array<{ id: string; name: string }>>([]);
  const [filterCondition, setFilterCondition] = useState<'include' | 'exclude'>('include');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState({ hours: '12', minutes: '00' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const button1TriggerImageInputRef = useRef<HTMLInputElement>(null);
  const button2TriggerImageInputRef = useRef<HTMLInputElement>(null);
  
  // Card states
  const [cards, setCards] = useState([
    { 
      id: 1, 
      enableImage: false,
      enableTitle: false,
      enableContent: false,
      enablePrice: false,
      enableButton1: false,
      enableButton2: false,
      image: '', 
      cardTitle: '', 
      content: '', 
      price: '', 
      currency: 'ntd',
      button1: '', 
      button2: '', 
      button1Action: 'select', 
      button1Url: '', 
      button1Tag: '', 
      button1Text: '',
      button1TriggerImage: null as File | null,
      button2Action: 'select',
      button2Url: '',
      button2Tag: '',
      button2Text: '',
      button2TriggerImage: null as File | null 
    }
  ]);

  const currentCard = cards.find(c => c.id === activeTab) || cards[0];

  const updateCard = (updates: Partial<typeof currentCard>) => {
    setCards(cards.map(card => 
      card.id === activeTab ? { ...card, ...updates } : card
    ));
  };

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
        image: '', 
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
        button1TriggerImage: null as File | null,
        button2Action: firstCard.button2Action,
        button2Url: '',
        button2Tag: '',
        button2Text: '',
        button2TriggerImage: null as File | null 
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
        toast.error('圖片大小超過 1 MB，請選擇較小的圖片');
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
    toast.success('草稿已儲存');
  };

  const handlePublish = () => {
    if (!title || !notificationMsg || !previewMsg) {
      toast.error('請填寫所有必填欄位');
      return;
    }
    toast.success('訊息已發佈');
  };

  const handlePublishOption = (option: string) => {
    setDropdownOpen(false);
    toast(option, { duration: 3000 });
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

  return (
    <TooltipProvider>
      <div className="bg-slate-50 min-h-screen flex">
        {/* Sidebar */}
        <aside className={`bg-slate-100 content-stretch flex flex-col h-screen items-start fixed top-0 left-0 shrink-0 z-50 ${sidebarOpen ? 'w-[330px] lg:w-[280px] md:w-[250px]' : 'w-[72px]'} transition-all duration-300`}>
          {/* Logo & Toggle */}
          <div className="box-border flex items-center justify-between p-4 w-full">
            {sidebarOpen && (
              <div className="content-stretch flex flex-col h-[56px] items-start justify-center overflow-clip relative shrink-0 w-[148px]">
                <StarbitLogo />
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="overflow-clip relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
            >
              <svg className="block size-full" fill="none" viewBox="0 0 27 24">
                <rect height="22" rx="7" stroke="#B6C8F1" strokeWidth="2" width="24.6667" x="1" y="1" />
                <path d="M9.99992 0L9.99992 24" stroke="#B6C8F1" strokeWidth="2" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 w-full overflow-y-auto">
            {sidebarOpen && (
              <>
                {/* 群發訊息 Section */}
                <div className="box-border flex flex-col gap-1 px-4">
                  <div className="box-border flex gap-1 h-[29px] items-center p-1">
                    <svg className="shrink-0 size-[18px]" fill="none" viewBox="0 0 14 13">
                      <path d={svgPaths.p25432100} fill="#6E6E6E" />
                    </svg>
                    <p className="text-[14px] text-[#6e6e6e]">群發訊息</p>
                  </div>
                  <button className="bg-[#e1ebf9] box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-[#d0e0f5] transition-colors">
                    <p className="text-[16px] text-[#0f6beb]">活動與訊息推播</p>
                  </button>
                  <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                    <p className="text-[16px] text-[#383838]">自動回應</p>
                  </button>
                </div>

                {/* 會員 Section */}
                <div className="box-border flex flex-col gap-1 px-4 mt-5">
                  <div className="box-border flex gap-1 h-[29px] items-center p-1">
                    <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 14 14">
                      <path d={svgPaths.pa54d00} fill="#6E6E6E" />
                    </svg>
                    <p className="text-[14px] text-[#6e6e6e]">會員</p>
                  </div>
                  <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                    <p className="text-[16px] text-[#383838]">會員管理</p>
                  </button>
                </div>

                {/* 設定 Section */}
                <div className="box-border flex flex-col gap-1 px-4 mt-5">
                  <div className="box-border flex gap-1 h-[29px] items-center p-1">
                    <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 20 20">
                      <path d={svgPaths.p16734900} fill="#6E6E6E" />
                    </svg>
                    <p className="text-[14px] text-[#6e6e6e]">設定</p>
                  </div>
                  <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                    <p className="text-[16px] text-[#383838]">標籤管理</p>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="bg-slate-100 box-border border-t border-[#b6c8f1] flex flex-col items-start pb-[44px] pt-[12px] px-4 w-full">
            <div className="flex items-center gap-2 w-full">
              <div className="bg-white relative rounded-full shrink-0 size-[32px] flex items-center justify-center">
                <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                  <path d={svgPaths.p1c72d580} fill="#7A9FFF" />
                </svg>
              </div>
              {sidebarOpen && (
                <>
                  <p className="flex-1 text-[16px] text-[#383838]">Daisy Yang</p>
                  <button className="text-[16px] text-[#0f6beb] hover:underline">登出</button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 overflow-auto bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
          {/* Breadcrumb */}
          <div className="box-border flex items-center pb-0 pt-[48px] px-[40px]">
            <div className="box-border flex gap-1 items-center p-1">
              <p 
                className="text-[14px] text-[#6e6e6e] cursor-pointer hover:text-[#0f6beb] transition-colors"
                onClick={onBack}
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
                <div className="relative flex items-center">
                  <button 
                    onClick={handlePublish}
                    className="bg-[#242424] hover:bg-[#383838] transition-colors flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-tl-[16px] rounded-bl-[16px] border-r border-r-[#383838]"
                  >
                    <span className="text-white text-[16px] leading-[1.5] text-center">發佈</span>
                  </button>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="bg-[#242424] hover:bg-[#383838] transition-colors flex items-center justify-center min-h-[48px] px-[4px] py-[8px] rounded-tr-[16px] rounded-br-[16px]"
                  >
                    <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                      <path d={splitButtonPaths.p18c88e00} fill="white" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute top-[calc(100%+4px)] right-0 z-20 w-[160px]">
                        <div className="bg-white box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[8px] shadow-[0px_0px_4px_0px_rgba(168,168,168,0.25),0px_1px_4px_0px_rgba(221,221,221,0.25)]">
                          <button
                            onClick={() => handlePublishOption('正式發佈')}
                            className="relative shrink-0 w-full hover:bg-[#f6f9fd] active:bg-[#f6f9fd] transition-colors group"
                          >
                            <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_0.4px] border-solid inset-0 pointer-events-none" />
                            <div className="flex flex-row items-center size-full">
                              <div className="box-border content-stretch flex items-center px-[12px] py-[8px] relative w-full">
                                <div className="basis-0 flex flex-col font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] group-hover:text-[#0f6beb] group-active:text-[#0f6beb] text-[14px]">
                                  <p className="leading-[1.5]">正式發佈</p>
                                </div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => handlePublishOption('發佈測試訊息')}
                            className="relative shrink-0 w-full hover:bg-[#f6f9fd] active:bg-[#f6f9fd] transition-colors group"
                          >
                            <div className="flex flex-row items-center size-full">
                              <div className="box-border content-stretch flex items-center px-[12px] py-[8px] relative w-full">
                                <div className="basis-0 flex flex-col font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] group-hover:text-[#0f6beb] group-active:text-[#0f6beb] text-[14px]">
                                  <p className="leading-[1.5]">發佈測試訊息</p>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields Row 1 */}
            <div className="flex flex-col xl:flex-row gap-[32px] xl:gap-[120px] items-start w-full">
              <div className="flex-1 flex flex-col sm:flex-row items-start gap-4 w-full">
                <Label className="min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] pt-3">
                  <span className="text-[16px] text-[#383838]">模板類型</span>
                  <span className="text-[16px] text-[#f44336]">*</span>
                </Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger className={`flex-1 !h-[48px] rounded-[8px] border-neutral-100 bg-white ${templateType === 'select' ? 'text-[#717182]' : ''}`}>
                    <SelectValue placeholder="選擇模板類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select" className="text-[#717182]">選擇模板類型</SelectItem>
                    <SelectItem value="文字按鈕確認型">文字按鈕確認型</SelectItem>
                    <SelectItem value="圖卡按鈕型">圖卡按鈕型</SelectItem>
                    <SelectItem value="圖片點擊型">圖片點擊型</SelectItem>
                    <SelectItem value="純文字">純文字</SelectItem>
                  </SelectContent>
                </Select>
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
                    {targetType === 'filtered' && (
                      <div className="bg-white max-w-[600px] min-w-[300px] rounded-[8px] shrink-0 w-full border border-neutral-100">
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
                              <DialogContent className="max-w-[800px] max-h-[90vh] p-0 bg-transparent border-0">
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
                  <p className="text-[16px] text-[#383838]">預計發送好友人數：60人</p>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel & Card Editor Section */}
          <div className="box-border flex flex-col gap-[32px] items-start p-[40px]">
            {/* Edit Mode Toggle & Carousel Tabs */}
            <div className="flex items-center gap-[24px] w-full">
              <div className="bg-slate-50 p-[4px] rounded-[12px] inline-flex">
                <button className="bg-white rounded-[8px]">
                  <div className="flex flex-col justify-center">
                    <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center p-[8px]">
                      <div className="content-stretch flex gap-[10px] items-center justify-center w-full">
                        <p className="font-normal leading-[1.5] text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">編輯</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <div className="flex items-center gap-0 border-b border-[#e1ebf9] flex-1">
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      setActiveTab(card.id);
                      scrollToCard(card.id);
                    }}
                    className={`box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] rounded-[16px] shrink-0 relative ${
                      activeTab === card.id 
                        ? 'text-[#383838]' 
                        : 'text-[#6e6e6e]'
                    }`}
                  >
                    {activeTab === card.id && (
                      <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
                    )}
                    <p className="basis-0 font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center">{index + 1}</p>
                  </button>
                ))}
                {cards.length < 10 && (
                  <button 
                    onClick={addCarousel}
                    className="h-[48px] px-3 text-[#a8a8a8] hover:text-[#383838] flex items-center gap-[2px]"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-[16px]">新增輪播</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card Preview & Editor */}
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
                    
                    {/* Show simplified preview for 文字按鈕確認型 */}
                    {templateType === '文字按鈕確認型' ? (
                      <div className="relative shrink-0 w-[288px]">
                        <div className="bg-[#f6f9fd] relative rounded-[15px] w-[288px]">
                          <div className="flex flex-col items-center overflow-clip relative rounded-[inherit] w-[288px]">
                            {/* Card Description */}
                            <div className="relative shrink-0 w-full">
                              <div className="flex flex-row items-center size-full">
                                <div className="box-border flex items-center p-[16px] relative w-full">
                                  <p className="basis-0 font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
                                    {messageText || '文字訊息'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Card Actions - show when button1 or button2 is enabled */}
                            {(currentCard.enableButton1 || currentCard.enableButton2) && (
                              <div className="relative shrink-0 w-full">
                                <div className="flex flex-col justify-center size-full">
                                  <div className="box-border content-stretch flex flex-col gap-[6px] items-start justify-center p-[9px] relative w-full">
                                    {currentCard.enableButton1 && (
                                      <div className="bg-white relative rounded-[15px] shrink-0 w-full">
                                        <div className="flex flex-row items-center justify-center size-full">
                                          <div className="box-border content-stretch flex items-center justify-center p-[15px] relative w-full">
                                            <p className="basis-0 font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[18px] text-center">
                                              {currentCard.button1 || '動作按鈕一'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {currentCard.enableButton2 && (
                                      <div className="bg-white relative rounded-[15px] shrink-0 w-full">
                                        <div className="flex flex-row items-center justify-center size-full">
                                          <div className="box-border content-stretch flex items-center justify-center p-[15px] relative w-full">
                                            <p className="basis-0 font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[18px] text-center">
                                              {currentCard.button2 || '動作按鈕二'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
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
                    )}
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

                {/* Message Text */}
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                  <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                    <div className="flex gap-[10px] items-center justify-center opacity-0 size-[24px]">
                      <div className="relative shrink-0 size-[16px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                          <g clipPath="url(#clip0_4004_285)">
                            <g id="Vector"></g>
                            <path d={messageTextSvgPaths.pcd62e00} fill="#0F6BEB" id="Vector_2" />
                          </g>
                          <defs>
                            <clipPath id="clip0_4004_285">
                              <rect fill="white" height="16" width="16" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                    </div>
                    <Label className="flex items-center">
                      <span className="text-[16px] text-[#383838]">訊息文字</span>
                      <span className="text-[16px] text-[#f44336]">*</span>
                    </Label>
                    <div className="relative shrink-0 size-[24px] opacity-0">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                        <g opacity="0">
                          <path d={messageTextSvgPaths.p2cd5ff00} fill="#0F6BEB" />
                        </g>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-[2px]">
                    <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] w-full">
                      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                      <div className="flex flex-col justify-center min-h-inherit size-full">
                        <div className="box-border flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                          <input
                            type="text"
                            value={messageText}
                            onChange={(e) => {
                              if (e.target.value.length <= 100) {
                                setMessageText(e.target.value);
                              }
                            }}
                            placeholder="輸入訊息文字"
                            className="w-full bg-transparent outline-none text-[16px] text-[#383838] placeholder:text-[#717182]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-[10px] items-end w-full">
                      <div className="h-[18px] w-full text-right">
                        <p className="text-[12px] leading-[1.5]">
                          <span className="text-[#6e6e6e]">{messageText.length}</span>
                          <span className="text-[#383838]">/100</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title - Hidden for 文字按鈕確認型 */}
                {templateType !== '文字按鈕確認型' && (
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
                )}

                {/* Content - Hidden for 文字按鈕確認型 */}
                {templateType !== '文字按鈕確認型' && (
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
                )}

                {/* Price - Hidden for 文字按鈕確認型 */}
                {templateType !== '文字按鈕確認型' && (
                  <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                    <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                      <div className="flex gap-[10px] items-center justify-center size-[24px]">
                        <Checkbox 
                          checked={currentCard.enablePrice}
                          onCheckedChange={(checked) => updateCard({ enablePrice: checked as boolean })}
                        />
                      </div>
                      <Label className="flex items-center">
                        <span className="text-[16px] text-[#383838]">金額</span>
                      </Label>
                    </div>
                    <div className="flex-1 space-y-[2px]">
                      <div className="flex items-center gap-1">
                        <Select 
                          value={currentCard.currency} 
                          onValueChange={(value) => updateCard({ currency: value })}
                          disabled={!currentCard.enablePrice}
                        >
                          <SelectTrigger className="w-[88px] !h-[48px] rounded-[8px] border-neutral-100 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ntd">NT $</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          value={currentCard.price}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 15) {
                              updateCard({ price: value });
                            }
                          }}
                          placeholder="00,000"
                          className="flex-1 h-[48px] rounded-[8px] border-neutral-100 bg-white"
                          disabled={!currentCard.enablePrice}
                        />
                      </div>
                      <p className="text-[12px] text-right text-[#6e6e6e]">
                        {currentCard.price.length}<span className="text-[#383838]">/15</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Button 1 */}
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                  <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                    <div className="flex gap-[10px] items-center justify-center size-[24px]">
                      <Checkbox 
                        checked={currentCard.enableButton1}
                        onCheckedChange={(checked) => {
                          // If unchecking button1 and button2 is enabled, move button2 data to button1
                          if (!checked && currentCard.enableButton2) {
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
                            updateCard({ enableButton1: checked as boolean });
                          }
                        }}
                      />
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
                      disabled={!currentCard.enableButton1}
                      maxLength={12}
                    />
                    <p className="text-[12px] text-right text-[#6e6e6e]">
                      {currentCard.button1.length}<span className="text-[#383838]">/12</span>
                    </p>
                  </div>
                </div>

                {/* Button 1 Action Type */}
                {currentCard.enableButton1 && (
                  <>
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
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                  <div className="flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px]">
                    <div className="flex gap-[10px] items-center justify-center size-[24px]">
                      <Checkbox 
                        checked={currentCard.enableButton2}
                        onCheckedChange={(checked) => updateCard({ enableButton2: checked as boolean })}
                      />
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
                      disabled={!currentCard.enableButton2}
                      maxLength={12}
                    />
                    <p className="text-[12px] text-right text-[#6e6e6e]">
                      {currentCard.button2.length}<span className="text-[#383838]">/12</span>
                    </p>
                  </div>
                </div>

                {/* Button 2 Action Type */}
                {currentCard.enableButton2 && (
                  <>
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
    </TooltipProvider>
  );
}
