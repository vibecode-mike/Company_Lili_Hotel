import { useMemo, useState, memo } from 'react';
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
}

type SortField = 'title' | 'tags' | 'platform' | 'status' | 'sentCount' | 'sender' | 'clickCount' | 'sendTime';
type SortOrder = 'asc' | 'desc';
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// 統一欄位寬度配置 - 確保表頭與資料對齊
const COLUMN_WIDTHS = {
  title: 'w-[160px]',
  tags: 'w-[180px]',
  platform: 'w-[140px]',
  status: 'w-[100px]',
  sentCount: 'w-[120px]',
  sender: 'w-[160px]',  // 發送人員
  clickCount: 'w-[160px]',
  sendTime: 'w-[180px]',
  actions: 'w-[120px]',
} as const;

// 平台顯示名稱對應
const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  'LINE': 'LINE',
  'Facebook': 'Facebook',
  'Webchat': 'Webchat',
} as const;

// 統一欄位樣式
const CELL_BASE = 'box-border flex items-center px-[12px] py-0 shrink-0';
const CELL_TEXT = 'text-[#383838] text-[14px] leading-[24px] whitespace-nowrap';

// 分隔線組件
const Divider = memo(function Divider({ visible = true }: { visible?: boolean }) {
  return (
    <div className="h-[12px] shrink-0 w-0 relative">
      <div className={`absolute inset-[-3.33%_-0.4px] ${visible ? '' : 'opacity-0'}`}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
          <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  );
});

// 排序圖標組件
const SortIcon = memo(function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  return (
    <div className="overflow-clip shrink-0 size-[20px] relative">
      <div
        className={`absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px] ${active && order === 'asc' ? 'rotate-180' : ''}`}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
          <path d="M0.666667 8H3.33333C3.7 8 4 7.7 4 7.33333C4 6.96667 3.7 6.66667 3.33333 6.66667H0.666667C0.3 6.66667 0 6.96667 0 7.33333C0 7.7 0.3 8 0.666667 8ZM0 0.666667C0 1.03333 0.3 1.33333 0.666667 1.33333H11.3333C11.7 1.33333 12 1.03333 12 0.666667C12 0.3 11.7 0 11.3333 0H0.666667C0.3 0 0 0.3 0 0.666667ZM0.666667 4.66667H7.33333C7.7 4.66667 8 4.36667 8 4C8 3.63333 7.7 3.33333 7.33333 3.33333H0.666667C0.3 3.33333 0 3.63333 0 4C0 4.36667 0.3 4.66667 0.666667 4.66667Z" fill={active ? '#0F6BEB' : '#6E6E6E'} />
        </svg>
      </div>
    </div>
  );
});

// 表頭組件
const TableHeader = memo(function TableHeader({
  sortConfig,
  onSortChange,
  statusFilter
}: {
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  statusFilter: string;
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
    <div className="bg-white rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full relative">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex items-center pb-[12px] pt-[16px] px-[12px]">

        {/* 訊息標題 */}
        <div
          className={`${CELL_BASE} ${COLUMN_WIDTHS.title} gap-[4px] cursor-pointer`}
          onClick={() => onSortChange('title')}
        >
          <span className={CELL_TEXT}>訊息標題</span>
          <SortIcon active={isActive('title')} order={sortConfig.order} />
        </div>
        <Divider />

        {/* 互動標籤 */}
        <div
          className={`${CELL_BASE} ${COLUMN_WIDTHS.tags} gap-[4px] cursor-pointer`}
          onClick={() => onSortChange('tags')}
        >
          <span className={CELL_TEXT}>互動標籤</span>
          <SortIcon active={isActive('tags')} order={sortConfig.order} />
        </div>
        <Divider />

        {/* 平台 */}
        <div
          className={`${CELL_BASE} ${COLUMN_WIDTHS.platform} gap-[4px] ${isSortDisabled ? '' : 'cursor-pointer'}`}
          onClick={isSortDisabled ? undefined : () => onSortChange('platform')}
        >
          <span className={CELL_TEXT}>平台</span>
          {!isSortDisabled && <SortIcon active={isActive('platform')} order={sortConfig.order} />}
        </div>
        <Divider />

        {/* 狀態 */}
        <div
          className={`${CELL_BASE} ${COLUMN_WIDTHS.status} gap-[4px] ${isSortDisabled ? '' : 'cursor-pointer'}`}
          onClick={isSortDisabled ? undefined : () => onSortChange('status')}
        >
          <span className={CELL_TEXT}>狀態</span>
          {!isSortDisabled && <SortIcon active={isActive('status')} order={sortConfig.order} />}
        </div>
        <Divider />

        {/* 發送人數 */}
        <div
          className={`${CELL_BASE} ${COLUMN_WIDTHS.sentCount} gap-[4px] cursor-pointer`}
          onClick={() => onSortChange('sentCount')}
        >
          <span className={CELL_TEXT}>發送人數</span>
          <SortIcon active={isActive('sentCount')} order={sortConfig.order} />
        </div>
        <Divider />

        {/* 發送人員 / 建立人員 */}
        <div
          className={`${CELL_BASE} ${COLUMN_WIDTHS.sender} gap-[4px] cursor-pointer`}
          onClick={() => onSortChange('sender')}
        >
          <span className={CELL_TEXT}>{getSenderColumnLabel()}</span>
          <SortIcon active={isActive('sender')} order={sortConfig.order} />
        </div>
        <Divider />

        {/* 點擊次數 */}
        <div
          className={`${CELL_BASE} ${COLUMN_WIDTHS.clickCount} gap-[4px] cursor-pointer`}
          onClick={() => onSortChange('clickCount')}
        >
          <span className={CELL_TEXT}>點擊次數</span>
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
        <Divider />

        {/* 時間欄位 */}
        <div
          className={`${CELL_BASE} ${COLUMN_WIDTHS.sendTime} gap-[4px] cursor-pointer`}
          onClick={() => onSortChange('sendTime')}
        >
          <span className={CELL_TEXT}>{getTimeColumnLabel()}</span>
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
        <Divider />

        {/* 操作欄位佔位 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.actions}`} />
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
    <div className={`bg-white shrink-0 w-full relative ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : ''}`}>
      <div
        aria-hidden="true"
        className={`absolute border-[#dddddd] ${isLast ? 'border-0' : 'border-[0px_0px_1px]'} border-solid inset-0 pointer-events-none ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : ''}`}
      />
      <div className="flex items-center py-[12px] px-[12px]">

        {/* 訊息標題 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.title}`}>
          <span className={`${CELL_TEXT} truncate`}>{message.title}</span>
        </div>
        <Divider visible={false} />

        {/* 互動標籤 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.tags} flex-wrap gap-[4px] items-start`}>
          {message.tags.map((tag, index) => (
            <div key={index} className="bg-[#f0f6ff] flex items-center justify-center min-w-[32px] px-[8px] py-[4px] rounded-[8px]">
              <span className="text-[#0f6beb] text-[14px] leading-[1.5] whitespace-nowrap">{tag}</span>
            </div>
          ))}
        </div>
        <Divider visible={false} />

        {/* 平台 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.platform} gap-[8px]`}>
          <MemberSourceIcon source={message.platform as MemberSourceType} size={24} />
          <span className={`${CELL_TEXT} truncate`}>{message.channelName || PLATFORM_DISPLAY_NAMES[message.platform] || message.platform}</span>
        </div>
        <Divider visible={false} />

        {/* 狀態 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.status} gap-[4px]`}>
          <span className={CELL_TEXT}>{message.status}</span>
          {(message.status === '已排程' || message.status === '已發送') && <CheckSuccess />}
        </div>
        <Divider visible={false} />

        {/* 發送人數 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.sentCount}`}>
          <span className={CELL_TEXT}>{message.sentCount}</span>
        </div>
        <Divider visible={false} />

        {/* 發送人員 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.sender}`}>
          <span className={`${CELL_TEXT} truncate`}>{message.sender}</span>
        </div>
        <Divider visible={false} />

        {/* 點擊次數 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.clickCount}`}>
          <span className={CELL_TEXT}>{message.clickCount}</span>
        </div>
        <Divider visible={false} />

        {/* 時間欄位 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.sendTime}`}>
          <span className={CELL_TEXT}>{message.sendTime}</span>
        </div>
        <Divider visible={false} />

        {/* 操作按鈕 */}
        <div className={`${CELL_BASE} ${COLUMN_WIDTHS.actions} gap-[4px] justify-end`}>
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
export default function InteractiveMessageTable({ messages, onEdit, onViewDetails, statusFilter }: InteractiveMessageTableProps) {
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
    <div className="flex flex-col items-start shrink-0 w-full">
      <div className="bg-white rounded-[16px] w-full flex flex-col max-h-[600px] overflow-x-auto table-scroll">
        {/* 表頭 */}
        <div className="shrink-0 w-[1300px]">
          <TableHeader sortConfig={sortConfig} onSortChange={handleSort} statusFilter={statusFilter} />
        </div>

        {/* 表格內容 */}
        <div className="w-[1300px] flex-1 table-scroll">
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
  );
}
