import React from "react";
import { Drawer, DrawerContent, DrawerClose, DrawerPortal, DrawerOverlay, DrawerTitle, DrawerDescription } from "./ui/drawer";
import svgPaths from "../imports/svg-ukuy34kve3";
import imgImageHero from "figma:asset/68b289cb927cef11d11501fd420bb560ad25c667.png";
import { cn } from "./ui/utils";
import { FlexMessageCardPreview, type CarouselCard } from "./CarouselMessageEditor";
import { ArrowButton } from "./ArrowButton";
import { SecondaryButton } from "./common/SecondaryButton";
import { normalizeInteractionTags } from "../utils/interactionTags";
import { apiGet } from "../utils/apiClient";

interface MessageDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  messageId: string | null;
  onEdit?: (messageId: string) => void;
}

function CloseButton() {
  return (
    <DrawerClose asChild>
      <div className="relative shrink-0 size-[32px] cursor-pointer rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors" data-name="Close">
        <svg className="size-[20px]" fill="none" viewBox="0 0 16 16">
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="#6E6E6E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
  const [messageData, setMessageData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch message data from API
  React.useEffect(() => {
    if (!messageId || !open) {
      return;
    }

    const fetchMessageData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 判斷是否為 FB 訊息（ID 以 "fb-" 開頭）
        let url: string;
        if (messageId.startsWith('fb-')) {
          const fbId = messageId.replace('fb-', '');
          url = `/api/v1/messages/fb/${fbId}`;
        } else {
          url = `/api/v1/messages/${messageId}`;
        }

        // 使用 apiGet 自動處理 token 和 401 重試
        const response = await apiGet(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch message: ${response.statusText}`);
        }

        const payload = await response.json();
        const normalizedData = payload?.data?.data ?? payload?.data ?? payload;
        setMessageData(normalizedData);
      } catch (err) {
        console.error('Error fetching message data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load message');
      } finally {
        setLoading(false);
      }
    };

    fetchMessageData();
  }, [messageId, open]);

  // Reset to first card when drawer opens or messageId changes
  React.useEffect(() => {
    setCurrentCardIndex(0);
  }, [open, messageId]);

  // Parse Flex Message JSON to CarouselCard format
  const createFallbackCards = (): CarouselCard[] => [{
    id: 1,
    enableImage: false,
    enableTitle: true,
    enableContent: true,
    enablePrice: false,
    enableButton1: false,
    enableButton2: false,
    enableButton3: false,
    enableButton4: false,
    image: imgImageHero,
    cardTitle: '訊息標題',
    content: '內文文字說明',
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
  }];

  const parseFlexMessageToCards = (flexMessageJson: string | Record<string, any> | null): CarouselCard[] => {
    console.log('[parseFlexMessageToCards] Input:', flexMessageJson);

    if (!flexMessageJson) {
      console.log('[parseFlexMessageToCards] No input, returning fallback');
      return createFallbackCards();
    }

    try {
      let flexMessage: Record<string, any> | null = null;

      if (typeof flexMessageJson === 'string') {
        try {
          flexMessage = JSON.parse(flexMessageJson);
        } catch {
          const normalized = flexMessageJson
            .replace(/'/g, '"')
            .replace(/\bTrue\b/g, 'true')
            .replace(/\bFalse\b/g, 'false')
            .replace(/\bNone\b/g, 'null');
          flexMessage = JSON.parse(normalized);
        }
      } else {
        flexMessage = flexMessageJson;
      }

      console.log('[parseFlexMessageToCards] Parsed flexMessage:', flexMessage);

      // Flex wrapper可能是 { type: 'flex', altText, contents: {...} }
      const root = flexMessage?.type === 'flex'
        ? flexMessage.contents
        : flexMessage;

      console.log('[parseFlexMessageToCards] Root:', root);

      if (!root) {
        console.log('[parseFlexMessageToCards] No root, returning fallback');
        return createFallbackCards();
      }

      // Handle carousel type
      if (root.type === 'carousel') {
        const slides = root.contents || [];
        return slides.map((bubble: any, index: number) => {
          const body = bubble.body?.contents || [];
          const hero = bubble.hero;

          // Extract title, content, and price from body
          let cardTitle = '';
          let content = '';
          let price = '';
          let foundTitle = false;  // 追蹤是否已找到標題（即使為空）

          body.forEach((item: any) => {
            if (item.type === 'text' && item.weight === 'bold' && !foundTitle) {
              cardTitle = item.text || '';
              foundTitle = true;
            } else if (item.type === 'text' && !content && foundTitle) {
              content = item.text || '';
            } else if (item.type === 'text' && item.text?.includes('NT$')) {
              price = item.text.replace('NT$', '').trim();
            }
          });

          // Extract buttons
          const footer = bubble.footer?.contents || [];
          const buttons = footer.filter((item: any) => item.type === 'button');

          return {
            id: index + 1,
            enableImage: !!hero?.url,
            enableTitle: foundTitle,  // 使用 flag，而非 cardTitle 的 truthy 值
            enableContent: !!content,
            enablePrice: !!price,
            enableButton1: buttons.length > 0,
            enableButton2: buttons.length > 1,
            enableButton3: buttons.length > 2,
            enableButton4: buttons.length > 3,
            image: hero?.url || imgImageHero,
            cardTitle,
            content,
            price,
            currency: 'ntd',
            button1: buttons[0]?.action?.label || '',
            button2: buttons[1]?.action?.label || '',
            button3: buttons[2]?.action?.label || '',
            button4: buttons[3]?.action?.label || '',
            button1Action: buttons[0]?.action?.type || '',
            button1Url: buttons[0]?.action?.uri || '',
            button1Tag: '',
            button1Text: '',
            button1TriggerImage: null,
            button1Mode: 'primary',
            button2Action: buttons[1]?.action?.type || '',
            button2Url: buttons[1]?.action?.uri || '',
            button2Tag: '',
            button2Text: '',
            button2TriggerImage: null,
            button2Mode: 'secondary',
            button3Action: buttons[2]?.action?.type || '',
            button3Url: buttons[2]?.action?.uri || '',
            button3Tag: '',
            button3Text: '',
            button3TriggerImage: null,
            button3Mode: 'secondary',
            button4Action: buttons[3]?.action?.type || '',
            button4Url: buttons[3]?.action?.uri || '',
            button4Tag: '',
            button4Text: '',
            button4TriggerImage: null,
            button4Mode: 'secondary',
            enableImageUrl: false,
            imageUrl: '',
            imageTag: '',
          };
        });
      }

      // Handle single bubble
      if (root.type === 'bubble') {
        const body = root.body?.contents || [];
        const hero = root.hero;

        let cardTitle = '';
        let content = '';
        let price = '';
        let foundTitle = false;  // 追蹤是否已找到標題（即使為空）

        body.forEach((item: any) => {
          if (item.type === 'text' && item.weight === 'bold' && !foundTitle) {
            cardTitle = item.text || '';
            foundTitle = true;
          } else if (item.type === 'text' && !content && foundTitle) {
            content = item.text || '';
          } else if (item.type === 'text' && item.text?.includes('NT$')) {
            price = item.text.replace('NT$', '').trim();
          }
        });

        const footer = root.footer?.contents || [];
        const buttons = footer.filter((item: any) => item.type === 'button');

        return [{
          id: 1,
          enableImage: !!hero?.url,
          enableTitle: foundTitle,  // 使用 flag，而非 cardTitle 的 truthy 值
          enableContent: !!content,
          enablePrice: !!price,
          enableButton1: buttons.length > 0,
          enableButton2: buttons.length > 1,
          enableButton3: buttons.length > 2,
          enableButton4: buttons.length > 3,
            image: hero?.url || hero?.contents?.url || imgImageHero,
            cardTitle,
            content,
            price,
          currency: 'ntd',
          button1: buttons[0]?.action?.label || '',
          button2: buttons[1]?.action?.label || '',
          button3: buttons[2]?.action?.label || '',
          button4: buttons[3]?.action?.label || '',
          button1Action: buttons[0]?.action?.type || '',
          button1Url: buttons[0]?.action?.uri || '',
          button1Tag: '',
          button1Text: '',
          button1TriggerImage: null,
          button1Mode: 'primary',
          button2Action: buttons[1]?.action?.type || '',
          button2Url: buttons[1]?.action?.uri || '',
          button2Tag: '',
          button2Text: '',
          button2TriggerImage: null,
          button2Mode: 'secondary',
          button3Action: buttons[2]?.action?.type || '',
          button3Url: buttons[2]?.action?.uri || '',
          button3Tag: '',
          button3Text: '',
          button3TriggerImage: null,
          button3Mode: 'secondary',
          button4Action: buttons[3]?.action?.type || '',
          button4Url: buttons[3]?.action?.uri || '',
          button4Tag: '',
          button4Text: '',
          button4TriggerImage: null,
          button4Mode: 'secondary',
          enableImageUrl: false,
          imageUrl: '',
          imageTag: '',
        }];
      }

      // Fallback if unable to parse
      return createFallbackCards();
    } catch (err) {
      console.error('Error parsing Flex Message JSON:', err);
      return createFallbackCards();
    }
  };

  // Format datetime for display
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).replace(/\//g, '-');
    } catch {
      return dateString;
    }
  };

  // Map API data to display format
  // FB 草稿使用 fb_message_json，LINE 使用 flex_message_json
  // FB 已發送訊息（從外部 API）會轉換為 flex_message_json 格式
  const cards = React.useMemo(() => {
    console.log('[cards useMemo] messageData:', messageData);
    console.log('[cards useMemo] flex_message_json:', messageData?.flex_message_json);
    console.log('[cards useMemo] fb_message_json:', messageData?.fb_message_json);

    if (!messageData) return createFallbackCards();
    // 優先使用 flex_message_json，若無則使用 fb_message_json（FB 草稿）
    const jsonContent = messageData.flex_message_json || messageData.fb_message_json;
    console.log('[cards useMemo] Using jsonContent:', jsonContent);
    return parseFlexMessageToCards(jsonContent);
  }, [messageData]);

  const displayData = React.useMemo(() => {
    if (loading) {
      return {
        title: '載入中...',
        tags: [],
        platform: 'LINE',
        status: '載入中',
        recipients: 0,
        clicks: 0,
        opens: 0,
        sendTime: '-',
        updatedTime: '-',
      };
    }

    if (error || !messageData) {
      return {
        title: error || '無法載入訊息',
        tags: [],
        platform: 'LINE',
        status: '錯誤',
        recipients: 0,
        clicks: 0,
        opens: 0,
        sendTime: '-',
        updatedTime: '-',
      };
    }

    const lastUpdated = messageData.updated_at || messageData.updatedAt;

    return {
      title: messageData.message_title || messageData.template?.name || '訊息標題',
      tags: normalizeInteractionTags(messageData.interaction_tags ?? messageData.interactionTags ?? messageData.tags),
      platform: messageData.platform || 'LINE',
      status: messageData.send_status || '草稿',
      recipients: messageData.send_count || 0,
      clicks: messageData.click_count || 0,
      opens: messageData.open_count || 0,
      sendTime: formatDateTime(messageData.send_time || messageData.scheduled_at),
      updatedTime: formatDateTime(lastUpdated),
    };
  }, [messageData, loading, error]);

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
    <Drawer
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}
      direction="right"
      modal={true}
      dismissible={true}
    >
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

              {displayData.status === '已發送' && (
                <>
                  <InfoRow label="發送人數">
                    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
                      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
                        <p className="leading-[24px] whitespace-pre">{displayData.recipients}</p>
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

                  <InfoRow label="點擊次數">
                    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
                      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
                        <p className="leading-[24px] whitespace-pre">{displayData.clicks}</p>
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
                </>
              )}
              {displayData.status === '草稿' && (
                <InfoRow label="最後更新時間">
                  <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0">
                    <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                      <p className="leading-[1.5] whitespace-pre">{displayData.updatedTime}</p>
                    </div>
                  </div>
                </InfoRow>
              )}
            </div>
          </div>
        </DrawerContent>
    </Drawer>
  );
}
