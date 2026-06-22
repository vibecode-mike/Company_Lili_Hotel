/**
 * 1:1 聊天室的群發 Flex 訊息渲染
 *
 * 重用群發編輯器的 FlexMessageCardPreview 還原卡片外觀，
 * 不另寫 Flex 渲染器（專案群發都是編輯器產生的固定結構）。
 * 解析失敗時退回純文字泡泡（fallbackText = 通知文字備援）。
 */
import { FlexMessageCardPreview } from '../CarouselMessageEditor';
import { parseFlexMessageToCards } from '../../utils/parseFlexMessageToCards';

interface FlexMessageRendererProps {
  flexMessage: string | Record<string, any>;
  fallbackText?: string;
}

export function FlexMessageRenderer({ flexMessage, fallbackText }: FlexMessageRendererProps) {
  const cards = parseFlexMessageToCards(flexMessage);

  if (!cards || cards.length === 0) {
    return (
      <div
        className="flex flex-col items-center max-w-[288px] w-fit overflow-clip relative rounded-2xl shrink-0"
        style={{ backgroundColor: '#9ED5FF' }}
      >
        <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
          <p
            className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[16px] text-[#383838] break-words whitespace-pre-wrap text-left"
            style={{ overflowWrap: 'anywhere' }}
          >
            {fallbackText || '（群發訊息）'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: cards.length > 1 ? 'auto' : 'visible',
        overscrollBehaviorX: 'contain',
        padding: '2px 0 6px',
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch',
        maxWidth: 300,
      }}
    >
      {cards.map((card) => (
        <div key={card.id} style={{ flexShrink: 0, zoom: 0.85 }}>
          <FlexMessageCardPreview card={card} />
        </div>
      ))}
    </div>
  );
}

export default FlexMessageRenderer;
