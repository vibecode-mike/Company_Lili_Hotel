/**
 * 预览面板组件
 * 用于显示消息的实时预览
 */

import { TriggerImagePreview, TriggerTextPreview, GradientPreviewContainer } from '../common/PreviewContainers';
import FlexMessageEditorNew from '../flex-message/FlexMessageEditorNew';

// ========== 类型定义 ==========

export interface CardData {
  id: number;
  enableImage: boolean;
  enableTitle: boolean;
  enableContent: boolean;
  enablePrice: boolean;
  enableButton1: boolean;
  enableButton2: boolean;
  cardTitle: string;
  content: string;
  price: string;
  currency: 'ntd' | 'usd';
  button1: string;
  button2: string;
  imageUrl?: string;
  button1TriggerType?: 'text' | 'image';
  button2TriggerType?: 'text' | 'image';
  button1TriggerText?: string;
  button2TriggerText?: string;
  button1TriggerImageUrl?: string;
  button2TriggerImageUrl?: string;
}

export interface PreviewPanelProps {
  activeTab: number;
  cards: CardData[];
  flexMessageJson?: any;
  onFlexMessageUpdate?: (json: any) => void;
}

// ========== 预览卡片组件 ==========

function CardPreview({ card }: { card: CardData }) {
  const cardData = {
    cardTitle: card.cardTitle,
    content: card.content,
    price: card.price,
    currency: card.currency,
    button1: card.button1,
    button2: card.button2,
    imageUrl: card.imageUrl,
  };

  // 根据触发类型显示不同的预览
  if (card.button1TriggerType === 'image' && card.button1TriggerImageUrl) {
    return (
      <TriggerImagePreview
        cardData={cardData}
        triggerImageUrl={card.button1TriggerImageUrl}
      />
    );
  }

  if (card.button1TriggerType === 'text' && card.button1TriggerText) {
    return (
      <TriggerTextPreview
        cardData={cardData}
        triggerText={card.button1TriggerText}
      />
    );
  }

  // 默认预览（只显示卡片）
  return (
    <GradientPreviewContainer>
      <div className="bg-white h-[460.5px] relative rounded-[12px] shrink-0 w-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[460.5px] overflow-clip relative rounded-[inherit] w-full">
          {/* 标题 */}
          {card.enableTitle && card.cardTitle && (
            <div className="absolute h-[28.5px] left-[16px] overflow-clip top-[208px] w-[256px]">
              <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[28.5px] left-0 not-italic text-[#383838] text-[19px] text-nowrap top-0 tracking-[-0.4453px] whitespace-pre">
                {card.cardTitle}
              </p>
            </div>
          )}

          {/* 内容 */}
          {card.enableContent && card.content && (
            <div className="absolute h-[18px] left-[16px] overflow-clip top-[252.5px] w-[256px]">
              <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">
                {card.content}
              </p>
            </div>
          )}

          {/* 价格 */}
          {card.enablePrice && (
            <div className="absolute h-[36px] left-[16px] top-[286.5px] w-[256px]">
              <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[36px] left-[256.81px] not-italic text-[#383838] text-[24px] text-right top-0 tracking-[0.0703px] translate-x-[-100%] w-[78px]">
                {card.currency === 'ntd' ? 'NT $' : '$'} {card.price || '0'}
              </p>
            </div>
          )}

          {/* 图片 */}
          {card.enableImage && (
            <div className="absolute bg-[#edf0f8] h-[192px] left-0 overflow-clip top-0 w-[288px]">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt="卡片圖片"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[28.5px] text-[#383838] text-[19px] text-center text-nowrap tracking-[-0.4453px] whitespace-pre">
                    選擇圖片
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </GradientPreviewContainer>
  );
}

// ========== 主组件 ==========

export default function PreviewPanel({
  activeTab,
  cards,
  flexMessageJson,
  onFlexMessageUpdate,
}: PreviewPanelProps) {
  // Flex Message 编辑器模式
  if (activeTab === 0) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="w-full max-w-[1200px] h-full">
          <FlexMessageEditorNew
            onJsonUpdate={onFlexMessageUpdate}
            initialJson={flexMessageJson}
          />
        </div>
      </div>
    );
  }

  // 卡片预览模式
  const currentCard = cards.find((card) => card.id === activeTab);

  if (!currentCard) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[16px] text-[#717182]">找不到卡片</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-[24px]">
      <div className="w-[340px]">
        <CardPreview card={currentCard} />
      </div>
    </div>
  );
}