import { useMemo, useState, memo, type ReactNode } from 'react';
import { TextIconButton } from './common/buttons';
import { ArrowRightIcon } from './common/icons/ArrowIcon';
import ButtonEdit from '../imports/ButtonEdit';
import IcInfo from '../imports/IcInfo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { MemberSourceIcon } from './common/icons/MemberSourceIcon';
import type { MemberSourceType } from '../types/channel';

export interface Message {
  id: string;
  title: string;
  tags: string[];
  platform: string;
  channelName?: string; // 渠道名稱（頻道名/粉專名）
  status: string;
  sentCount: string;
  sender: string;  // 發送人員
  clickCount: string;
  sendTime: string;
  timeValue?: string | null;
}

interface InteractiveMessageTableProps {
  messages: Message[];
  onEdit: (id: string) => void;
  onViewDetails: (id: string) => void;
  statusFilter: string;
  // 「平台」欄位表頭的自訂 slot：傳入時取代原本的「平台」文字 + 排序 icon，
  // 訊息推播頁透過此 slot 嵌入 LINE OA 切換器。
  channelHeaderSlot?: ReactNode;
}

type SortField = 'title' | 'tags' | 'platform' | 'status' | 'sentCount' | 'sender' | 'clickCount' | 'sendTime';
type SortOrder = 'asc' | 'desc';
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// 平台顯示名稱對應
const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  'LINE': 'LINE',
  'Facebook': 'Facebook',
  'Webchat': 'Webchat',
} as const;

// 統一欄位樣式 - 參照會員管理頁的對齊方式
const CELL_BASE = 'box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0';
const CELL_TEXT = 'text-[#383838] text-[14px] leading-[1.5]';

// 固定欄位寬度 - 參照會員管理頁
const COL_TITLE = 'w-[200px]';       // 訊息標題
const COL_SENT_COUNT = 'w-[100px]';  // 發送人數
const COL_SENDER = 'w-[140px]';      // 發送人員
const COL_CLICK_COUNT = 'w-[120px]'; // 點擊次數
const COL_PLATFORM = 'w-[200px]';    // 平台
const COL_TIME = 'min-w-[180px] grow'; // 時間 (最後一欄用 grow)

// 排序圖標組件 — 16x16 SVG from Figma, both arrows always visible
const SortIcon = memo(function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
      <g transform="translate(1.34, 2.67)">
        <path d="M2.85381 0.195333C2.97883 0.0703528 3.14837 0.000142415 3.32514 0.000142415C3.50192 0.000142415 3.67146 0.0703528 3.79647 0.195333L6.46314 2.862C6.58458 2.98774 6.65178 3.15614 6.65026 3.33093C6.64874 3.50573 6.57863 3.67294 6.45502 3.79655C6.33142 3.92015 6.16421 3.99026 5.98941 3.99178C5.81461 3.9933 5.64621 3.92611 5.52047 3.80467L3.99181 2.276V10C3.99181 10.1768 3.92157 10.3464 3.79655 10.4714C3.67152 10.5964 3.50195 10.6667 3.32514 10.6667C3.14833 10.6667 2.97876 10.5964 2.85374 10.4714C2.72871 10.3464 2.65847 10.1768 2.65847 10V2.276L1.12981 3.80467C1.00407 3.92611 0.835672 3.9933 0.660874 3.99178C0.486076 3.99026 0.318868 3.92015 0.195262 3.79655C0.0716568 3.67294 0.00154415 3.50573 2.52018e-05 3.33093C-0.00149374 3.15614 0.0657025 2.98774 0.187141 2.862L2.85381 0.195333Z" fill={active && order === "asc" ? "#0f6beb" : "#9CA3AF"} />
        <path d="M9.32514 8.39067V0.666667C9.32514 0.489856 9.39538 0.320287 9.5204 0.195262C9.64543 0.070238 9.815 0 9.99181 0C10.1686 0 10.3382 0.070238 10.4632 0.195262C10.5882 0.320287 10.6585 0.489856 10.6585 0.666667V8.39067L12.1871 6.862C12.3129 6.74056 12.4813 6.67337 12.6561 6.67488C12.8309 6.6764 12.9981 6.74652 13.1217 6.87012C13.2453 6.99373 13.3154 7.16094 13.3169 7.33573C13.3184 7.51053 13.2512 7.67893 13.1298 7.80467L10.4631 10.4713C10.3381 10.5963 10.1686 10.6665 9.99181 10.6665C9.81503 10.6665 9.64549 10.5963 9.52047 10.4713L6.85381 7.80467C6.73237 7.67893 6.66517 7.51053 6.66669 7.33573C6.66821 7.16094 6.73832 6.99373 6.86193 6.87012C6.98553 6.74652 7.15274 6.6764 7.32754 6.67488C7.50234 6.67337 7.67074 6.74056 7.79647 6.862L9.32514 8.39067Z" fill={active && order === "desc" ? "#0f6beb" : "#9CA3AF"} />
      </g>
    </svg>
  );
});

// 表頭組件
const TableHeader = memo(function TableHeader({
  sortConfig,
  onSortChange,
  statusFilter,
  channelHeaderSlot,
}: {
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  statusFilter: string;
  channelHeaderSlot?: ReactNode;
}) {
  const isActive = (field: SortField) => sortConfig.field === field;
  const isSortDisabled = statusFilter === '已發送' || statusFilter === '已排程' || statusFilter === '草稿';

  const getTimeColumnLabel = () => {
    if (statusFilter === '已排程') return '預計發送時間';
    if (statusFilter === '草稿') return '最後更新時間';
    return '發送時間';
  };

  const getSenderColumnLabel = () => {
    if (statusFilter === '草稿') return '建立人員';
    return '發送人員';
  };

  return (
    <div className="bg-white relative shrink-0 w-full" data-name="TableHeader">
      <div className="flex flex-row items-center size-full border-b border-[#dddddd]">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          {/* 訊息標題 */}
          <div
            className={`${CELL_BASE} ${COL_TITLE} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('title')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>訊息標題</span>
            <SortIcon active={isActive('title')} order={sortConfig.order} />
          </div>

          {/* 發送人數 */}
          <div
            className={`${CELL_BASE} ${COL_SENT_COUNT} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('sentCount')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>發送人數</span>
            <SortIcon active={isActive('sentCount')} order={sortConfig.order} />
          </div>

          {/* 發送人員 / 建立人員 */}
          <div
            className={`${CELL_BASE} ${COL_SENDER} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('sender')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>{getSenderColumnLabel()}</span>
            <SortIcon active={isActive('sender')} order={sortConfig.order} />
          </div>

          {/* 點擊次數 */}
          <div
            className={`${CELL_BASE} ${COL_CLICK_COUNT} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('clickCount')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>點擊次數</span>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="shrink-0 size-[20px]" onClick={(e) => e.stopPropagation()}>
                    <IcInfo />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>使用者需點擊訊息內的按鈕/圖片（追蹤連結）才會累積點擊次數</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SortIcon active={isActive('clickCount')} order={sortConfig.order} />
          </div>

          {/* 平台：訊息推播頁傳入 channelHeaderSlot 取代為 LINE OA 切換器；其他情境保留原欄位 */}
          {channelHeaderSlot ? (
            <div className={`${CELL_BASE} ${COL_PLATFORM} gap-[4px]`}>
              {channelHeaderSlot}
            </div>
          ) : (
            <div
              className={`${CELL_BASE} ${COL_PLATFORM} gap-[4px] cursor-pointer`}
              onClick={() => onSortChange('platform')}
            >
              <span className={`${CELL_TEXT} whitespace-nowrap`}>平台</span>
              <SortIcon active={isActive('platform')} order={sortConfig.order} />
            </div>
          )}

          {/* 時間欄位 - 使用 grow 填滿剩餘空間 */}
          <div className="basis-0 grow min-h-px min-w-[180px] relative shrink-0">
            <div className="flex flex-row items-center size-full">
              <div
                className={`${CELL_BASE} w-full ${COL_TIME} gap-[4px] cursor-pointer`}
                onClick={() => onSortChange('sendTime')}
              >
                <span className={`${CELL_TEXT} whitespace-nowrap`}>{getTimeColumnLabel()}</span>
                {statusFilter === '草稿' && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="shrink-0 size-[20px]" onClick={(e) => e.stopPropagation()}>
                          <IcInfo />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>草稿不會因發送而移除，可重複使用</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <SortIcon active={isActive('sendTime')} order={sortConfig.order} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// 資料列組件
const MessageRow = memo(function MessageRow({
  message,
  isLast,
  onEdit,
  onViewDetails
}: {
  message: Message;
  isLast: boolean;
  onEdit: (id: string) => void;
  onViewDetails: (id: string) => void;
}) {
  const CheckSuccess = () => (
    <div className="shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_check)">
          <path d="M6.66667 10.1147L12.7947 3.98599L13.7381 4.92866L6.66667 12L2.42468 7.75801L3.36734 6.81534L6.66667 10.1147Z" fill="#00C853" />
        </g>
        <defs>
          <clipPath id="clip0_check">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );

  const isEditHidden = message.status === '已發送';

  return (
    <div
      className={`relative shrink-0 w-full transition-colors hover:bg-[#F8FAFC] cursor-pointer ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : 'border-b border-[#dddddd]'}`}
      style={{ backgroundColor: 'white' }}
      data-name="MessageRow"
    >
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          {/* 訊息標題 */}
          <div className={`${CELL_BASE} ${COL_TITLE}`}>
            <span className={`${CELL_TEXT} truncate`}>{message.title}</span>
          </div>

          {/* 發送人數 */}
          <div className={`${CELL_BASE} ${COL_SENT_COUNT}`}>
            <span className={CELL_TEXT}>{message.sentCount}</span>
          </div>

          {/* 發送人員 */}
          <div className={`${CELL_BASE} ${COL_SENDER}`}>
            <span className={`${CELL_TEXT} truncate`}>{message.sender}</span>
          </div>

          {/* 點擊次數 */}
          <div className={`${CELL_BASE} ${COL_CLICK_COUNT}`}>
            <span className={CELL_TEXT}>{message.clickCount}</span>
          </div>

          {/* 平台 - 文字超過時顯示 ... */}
          <div className={`${CELL_BASE} ${COL_PLATFORM} gap-[8px]`}>
            <MemberSourceIcon source={message.platform as MemberSourceType} size={24} />
            <span className={`${CELL_TEXT} truncate`}>{message.channelName || PLATFORM_DISPLAY_NAMES[message.platform] || message.platform}</span>
          </div>

          {/* 時間欄位 - 使用 grow 填滿剩餘空間 */}
          <div className={`${CELL_BASE} ${COL_TIME}`}>
            <span className={`${CELL_TEXT} whitespace-nowrap`}>{message.sendTime}</span>
          </div>

          {/* 操作按鈕 */}
          <div className="content-stretch flex items-center gap-[4px] shrink-0">
            {!isEditHidden && (
              <ButtonEdit onClick={() => onEdit(message.id)} />
            )}
            <TextIconButton
              text="詳細"
              icon={<ArrowRightIcon color="#0F6BEB" />}
              onClick={() => onViewDetails(message.id)}
              variant="primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

// 空狀態組件
const EmptyStateRow = memo(function EmptyStateRow() {
  return (
    <div className="bg-white shrink-0 w-full rounded-bl-[16px] rounded-br-[16px] relative" aria-live="polite">
      <div aria-hidden="true" className="absolute border-[#dddddd] border border-solid inset-0 pointer-events-none rounded-bl-[16px] rounded-br-[16px]" />
      <div className="flex items-center justify-center p-[40px]">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[#a8a8a8] text-[16px]">尚無此資料</p>
      </div>
    </div>
  );
});

// 主表格組件
export default function InteractiveMessageTable({ messages, onEdit, onViewDetails, statusFilter, channelHeaderSlot }: InteractiveMessageTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'sendTime',
    order: 'desc',
  });

  const getDefaultOrder = (field: SortField): SortOrder => {
    switch (field) {
      case 'sendTime':
      case 'sentCount':
      case 'clickCount':
        return 'desc';
      default:
        return 'asc';
    }
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          order: prev.order === 'desc' ? 'asc' : 'desc',
        };
      }
      return {
        field,
        order: getDefaultOrder(field),
      };
    });
  };

  const sortedMessages = useMemo(() => {
    const compareString = (a?: string, b?: string) =>
      (a || '').localeCompare(b || '', undefined, { numeric: true, sensitivity: 'base' });

    const parseNumber = (value?: string) => {
      const num = Number(value?.replace(/,/g, ''));
      return Number.isNaN(num) ? 0 : num;
    };

    const parseTime = (value?: string) => {
      const timestamp = Date.parse(value || '');
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const getComparison = (a: Message, b: Message): number => {
      const { field } = sortConfig;
      if (field === 'title' || field === 'platform' || field === 'status' || field === 'sender') {
        return compareString(a[field], b[field]);
      }
      if (field === 'tags') return compareString(a.tags?.[0], b.tags?.[0]);
      if (field === 'sentCount' || field === 'clickCount') {
        return parseNumber(a[field]) - parseNumber(b[field]);
      }
      if (field === 'sendTime') {
        return parseTime(a.timeValue ?? a.sendTime) - parseTime(b.timeValue ?? b.sendTime);
      }
      return 0;
    };

    return [...messages].sort((a, b) => {
      const comparison = getComparison(a, b);
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });
  }, [messages, sortConfig]);

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="MessageTable">
      {/* 外層容器 - 水平滾動 */}
      <div className="bg-white rounded-[16px] w-full overflow-x-auto table-scroll">
        {/* 內層容器 - 最小寬度確保欄位對齊 */}
        <div className="min-w-[1060px]">
          {/* 表頭 - 固定在滾動區域外 */}
          <TableHeader
            sortConfig={sortConfig}
            onSortChange={handleSort}
            statusFilter={statusFilter}
            channelHeaderSlot={channelHeaderSlot}
          />

          {/* 垂直滾動容器 - 只有資料列滾動 */}
          <div className="max-h-[600px] overflow-y-auto table-scroll">
            {sortedMessages.length === 0 ? (
              <EmptyStateRow />
            ) : (
              sortedMessages.map((message, index) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  isLast={index === sortedMessages.length - 1}
                  onEdit={onEdit}
                  onViewDetails={onViewDetails}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
