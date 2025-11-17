import React from "react";
import { Drawer, DrawerContent, DrawerClose, DrawerPortal, DrawerOverlay, DrawerTitle, DrawerDescription } from "./ui/drawer";
import svgPaths from "../imports/svg-ukuy34kve3";
import svgPathsPagination from "../imports/svg-0m1jkx8owp";
import imgImageHero from "figma:asset/68b289cb927cef11d11501fd420bb560ad25c667.png";
import { cn } from "./ui/utils";
import { FlexMessageCardPreview, type CarouselCard } from "./CarouselMessageEditor";
import { ArrowButton } from "./ArrowButton";
import { SecondaryButton } from "./common/SecondaryButton";

interface MessageDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  messageId: string | null;
  onEdit?: (messageId: string) => void;
}

function CloseButton() {
  return (
    <DrawerClose asChild>
      <div className="relative shrink-0 size-[32px] cursor-pointer rounded-full bg-[#F5F5F5] flex items-center justify-center hover:bg-gray-200 transition-colors" data-name="Close">
        <svg className="size-[16px]" viewBox="0 0 32 32" fill="none">
          <path d={svgPaths.p21a60700} fill="#6E6E6E" />
        </svg>
      </div>
    </DrawerClose>
  );
}

function Divider() {
  return (
    <div className="h-[12px] relative shrink-0 w-0" data-name="Divider">
      <div className="absolute inset-[-3.33%_-0.4px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
          <path d="M0.4 0.4V12.4" id="Divider" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  );
}

function HeaderContent({ status, onEdit }: { status: string; onEdit: () => void }) {
  const showEditButton = status === '已排程' || status === '草稿';

  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full" data-name="Header Content">
      <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-end min-h-px min-w-px shrink-0">
        {showEditButton && (
          <SecondaryButton text="編輯" onClick={onEdit} />
        )}
      </div>
      {showEditButton && <Divider />}
      <CloseButton />
    </div>
  );
}

interface MessagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

function MessagePagination({ currentPage, totalPages, onPrevious, onNext }: MessagePaginationProps) {
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className="box-border content-stretch flex gap-[2px] items-center justify-center px-[2px] py-0 relative w-full">
      {/* Left Arrow Button */}
      <ArrowButton
        direction="left"
        onClick={onPrevious}
        disabled={isPrevDisabled}
        aria-label="上一頁"
      />

      {/* Page Numbers */}
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap">
        <p className="leading-[1.5] whitespace-pre">
          {currentPage}<span className="text-[#383838]">/{totalPages}</span>
        </p>
      </div>

      {/* Right Arrow Button */}
      <ArrowButton
        direction="right"
        onClick={onNext}
        disabled={isNextDisabled}
        aria-label="下一頁"
      />
    </div>
  );
}

function MessagePreview({ 
  card, 
  currentPage = 1, 
  totalPages = 1,
  onPrevious,
  onNext
}: { 
  card: CarouselCard; 
  currentPage?: number; 
  totalPages?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
      <div className="bg-gradient-to-b box-border content-stretch flex from-[#a5d8ff] gap-[12px] h-[304.2px] items-center justify-center overflow-clip p-[12px] relative rounded-[20px] shrink-0 to-[#d0ebff] w-[276px]" data-name="Container">
        <div style={{ transform: 'scale(0.6)', transformOrigin: 'center' }}>
          <FlexMessageCardPreview card={card} />
        </div>
      </div>
      <div className="relative shrink-0 w-full">
        <div className="flex flex-row items-center justify-center size-full">
          <MessagePagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPrevious={onPrevious || (() => {})} 
            onNext={onNext || (() => {})} 
          />
        </div>
      </div>
    </div>
  );
}

function MessageTitle({ title }: { title: string }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[0px] text-center">
            <p className="leading-[1.5] text-[20px]">{title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Template Type Row">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{label}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">{label}</p>
    </div>
  );
}

function TagsContainer({ tags }: { tags: string[] }) {
  return (
    <div className="basis-0 content-center flex flex-wrap gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Text Area Container">
      {tags.map((tag, i) => (
        <Tag key={i} label={tag} />
      ))}
    </div>
  );
}

function CheckSuccess() {
  return (
    <div className="relative shrink-0 size-[16px] flex items-center justify-center" data-name="Check/Success">
      <svg className="size-[14px]" viewBox="0 0 16 16" fill="none">
        <path d={svgPaths.p36cd5f00} fill="#00C853" />
      </svg>
    </div>
  );
}

export function MessageDetailDrawer({ open, onClose, messageId, onEdit }: MessageDetailDrawerProps) {
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);

  // Reset to first card when drawer opens or messageId changes
  React.useEffect(() => {
    setCurrentCardIndex(0);
  }, [open, messageId]);

  // Create mock CarouselCard data for preview
  const createMockCard = (title: string, content: string, image?: string): CarouselCard => ({
    id: 1,
    enableImage: true,
    enableTitle: true,
    enableContent: true,
    enablePrice: false,
    enableButton1: false,
    enableButton2: false,
    enableButton3: false,
    enableButton4: false,
    image: image || imgImageHero,
    cardTitle: title,
    content: content,
    price: '',
    currency: 'ntd',
    button1: '',
    button2: '',
    button3: '',
    button4: '',
    button1Action: '',
    button1Url: '',
    button1Tag: '',
    button1Text: '',
    button1TriggerImage: null,
    button1Mode: 'primary',
    button2Action: '',
    button2Url: '',
    button2Tag: '',
    button2Text: '',
    button2TriggerImage: null,
    button2Mode: 'secondary',
    button3Action: '',
    button3Url: '',
    button3Tag: '',
    button3Text: '',
    button3TriggerImage: null,
    button3Mode: 'secondary',
    button4Action: '',
    button4Url: '',
    button4Tag: '',
    button4Text: '',
    button4TriggerImage: null,
    button4Mode: 'secondary',
    enableImageUrl: false,
    imageUrl: '',
    imageTag: '',
  });

  // Mock data mapping for demo purposes
  const messageDataMap: Record<string, any> = {
    '1': {
      title: '雙人遊行 獨家優惠',
      tags: ['雙人床', '送禮', 'KOL'],
      platform: 'LINE',
      status: '已排程',
      recipients: 1000,
      clicks: 0,
      opens: 0,
      sendTime: '2026-10-02 22:47',
      cards: [
        createMockCard('雙人遊行 獨家優惠', '限時特惠，立即預訂享受超值優惠'),
        createMockCard('豪華雙人房', '頂級享受，浪漫時光'),
        createMockCard('早鳥優惠', '提前預訂，享受更多優惠'),
      ],
    },
    '2': {
      title: '雙人遊行 獨家優惠',
      tags: ['商務房', '送禮', 'KOL'],
      platform: 'LINE',
      status: '已排程',
      recipients: 1200,
      clicks: 0,
      opens: 0,
      sendTime: '2026-10-02 22:47',
      cards: [
        createMockCard('雙人遊行 獨家優惠', '商務房特惠方案，立即預訂'),
        createMockCard('行政套房', '專業商務人士首選'),
      ],
    },
    '3': {
      title: '雙人遊行 獨家優惠',
      tags: ['商務房', 'KOL'],
      platform: 'LINE',
      status: '已排程',
      recipients: 800,
      clicks: 0,
      opens: 0,
      sendTime: '2026-10-02 22:47',
      cards: [
        createMockCard('雙人遊行 獨家優惠', '頂級商務房體驗'),
      ],
    },
    '4': {
      title: '夏季特惠活動',
      tags: ['促銷', '限時'],
      platform: 'LINE',
      status: '已發送',
      recipients: 1234,
      clicks: 342,
      opens: 856,
      sendTime: '2026-09-28 10:00',
      cards: [
        createMockCard('夏季特惠活動', '炎炎夏日，清涼優惠等你來'),
        createMockCard('泳池派對', '夏日限定，盡情享受'),
        createMockCard('海灘度假', '陽光沙灘，放鬆身心'),
        createMockCard('冰品優惠', '清涼一夏，甜蜜滋味'),
      ],
    },
    '5': {
      title: '會員專屬優惠',
      tags: ['VIP', '會員'],
      platform: 'LINE',
      status: '已發送',
      recipients: 2567,
      clicks: 891,
      opens: 1823,
      sendTime: '2026-09-25 14:30',
      cards: [
        createMockCard('會員專屬優惠', 'VIP 會員限定，專屬禮遇'),
        createMockCard('積分加倍', '消費滿額，積分翻倍'),
      ],
    },
    '6': {
      title: '新品上市通知',
      tags: ['新品', '首發'],
      platform: 'LINE',
      status: '草稿',
      recipients: 0,
      clicks: 0,
      opens: 0,
      sendTime: '-',
      cards: [
        createMockCard('新品上市通知', '全新產品，搶先體驗'),
      ],
    },
  };

  const defaultData = {
    title: '訊息標題',
    tags: ['標籤'],
    platform: 'LINE',
    status: '草稿',
    recipients: 0,
    clicks: 0,
    opens: 0,
    sendTime: '-',
    cards: [createMockCard('訊息標題', '內文文字說明')],
  };

  const displayData = messageId && messageDataMap[messageId] ? messageDataMap[messageId] : defaultData;
  const cards = displayData.cards || [];
  const totalPages = cards.length;
  const currentCard = cards[currentCardIndex] || cards[0];

  const handlePrevious = () => {
    setCurrentCardIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentCardIndex((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleEdit = () => {
    if (messageId && onEdit) {
      onEdit(messageId);
      onClose(); // Close drawer when editing
    }
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }} direction="right">
      <DrawerContent
        className="bg-white border-0 rounded-none w-[344px] h-screen p-0"
      >
          <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[32px] relative size-full overflow-y-auto" data-name="Drawer">
            {/* Accessibility - Hidden Title and Description */}
            <DrawerTitle className="sr-only">訊息詳細資訊</DrawerTitle>
            <DrawerDescription className="sr-only">
              查看訊息的完整資訊，包含標題、標籤、平台、狀態、發送數據等
            </DrawerDescription>
            
            <HeaderContent status={displayData.status} onEdit={handleEdit} />
            <MessagePreview 
              card={currentCard} 
              currentPage={currentCardIndex + 1} 
              totalPages={totalPages} 
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
            <MessageTitle title={displayData.title} />
            
            <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
              <InfoRow label="互動標籤">
                <TagsContainer tags={displayData.tags} />
              </InfoRow>

              <InfoRow label="平台">
                <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
                  <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
                    <p className="leading-[24px] whitespace-pre">{displayData.platform}</p>
                  </div>
                </div>
              </InfoRow>

              <InfoRow label="狀態">
                <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
                  <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                    <p className="leading-[1.5] whitespace-pre">{displayData.status}</p>
                  </div>
                  <CheckSuccess />
                </div>
              </InfoRow>

              <InfoRow label="發送人數">
                <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
                  <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
                    <p className="leading-[24px] whitespace-pre">{displayData.recipients}</p>
                  </div>
                </div>
              </InfoRow>

              <InfoRow label="點擊次數">
                <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
                  <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
                    <p className="leading-[24px] whitespace-pre">{displayData.clicks}</p>
                  </div>
                </div>
              </InfoRow>

              <InfoRow label="已開啟次數">
                <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
                  <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
                    <p className="leading-[24px] whitespace-pre">{displayData.opens}</p>
                  </div>
                </div>
              </InfoRow>

              <InfoRow label="發送時間">
                <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
                  <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                    <p className="leading-[1.5] whitespace-pre">{displayData.sendTime}</p>
                  </div>
                </div>
              </InfoRow>
            </div>
          </div>
        </DrawerContent>
    </Drawer>
  );
}