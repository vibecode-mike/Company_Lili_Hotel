import { useState, useMemo, memo } from 'react';
import svgPaths from "../imports/svg-noih6nla1w";
import { TextIconButton } from './common/buttons';
import { ArrowRightIcon } from './common/icons/ArrowIcon';
import ButtonEdit from '../imports/ButtonEdit';
import IcInfo from '../imports/IcInfo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export interface Message {
  id: string;
  title: string;
  tags: string[];
  platform: string;
  status: string;
  sentCount: string;
  openCount: string;
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

type SortField = 'title' | 'tags' | 'platform' | 'status' | 'sentCount' | 'openCount' | 'clickCount' | 'sendTime';
type SortOrder = 'asc' | 'desc';
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// Memoized Table Header Component
const TableHeader = memo(function TableHeader({ sortConfig, onSortChange, statusFilter }: { sortConfig: SortConfig; onSortChange: (field: SortField) => void; statusFilter: string }) {
  const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => (
    <div className="overflow-clip relative shrink-0 size-[20px]">
      <div className="absolute inset-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector"></g>
        </svg>
      </div>
      <div
        className={`absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px] ${active && order === 'asc' ? 'rotate-180' : ''}`}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
          <path d="M0.666667 8H3.33333C3.7 8 4 7.7 4 7.33333C4 6.96667 3.7 6.66667 3.33333 6.66667H0.666667C0.3 6.66667 0 6.96667 0 7.33333C0 7.7 0.3 8 0.666667 8ZM0 0.666667C0 1.03333 0.3 1.33333 0.666667 1.33333H11.3333C11.7 1.33333 12 1.03333 12 0.666667C12 0.3 11.7 0 11.3333 0H0.666667C0.3 0 0 0.3 0 0.666667ZM0.666667 4.66667H7.33333C7.7 4.66667 8 4.36667 8 4C8 3.63333 7.7 3.33333 7.33333 3.33333H0.666667C0.3 3.33333 0 3.63333 0 4C0 4.36667 0.3 4.66667 0.666667 4.66667Z" fill={active ? '#0F6BEB' : '#6E6E6E'} />
        </svg>
      </div>
    </div>
  );
  const isActive = (field: SortField) => sortConfig.field === field;

  // Determine time column label based on status filter
  const getTimeColumnLabel = () => {
    if (statusFilter === '已排程') return '預計發送時間';
    if (statusFilter === '草稿') return '最後更新時間';
    return '發送時間'; // Default for '已發送'
  };

  return (
    <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          {/* 訊息標題 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[250px] cursor-pointer" 
            onClick={() => onSortChange('title')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">訊息標題</p>
            </div>
            <SortIcon active={isActive('title')} order={sortConfig.order} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 互動標籤 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[200px] cursor-pointer"
            onClick={() => onSortChange('tags')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">互動標籤</p>
            </div>
            <SortIcon active={isActive('tags')} order={sortConfig.order} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 平台 */}
          <div
            className={`box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[100px] ${statusFilter === '已發送' || statusFilter === '已排程' || statusFilter === '草稿' ? '' : 'cursor-pointer'}`}
            onClick={statusFilter === '已發送' || statusFilter === '已排程' || statusFilter === '草稿' ? undefined : () => onSortChange('platform')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">平台</p>
            </div>
            {!(statusFilter === '已發送' || statusFilter === '已排程' || statusFilter === '草稿') && (
              <SortIcon active={isActive('platform')} order={sortConfig.order} />
            )}
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 狀態 */}
          <div
            className={`box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[100px] ${statusFilter === '已發送' || statusFilter === '已排程' || statusFilter === '草稿' ? '' : 'cursor-pointer'}`}
            onClick={statusFilter === '已發送' || statusFilter === '已排程' || statusFilter === '草稿' ? undefined : () => onSortChange('status')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">狀態</p>
            </div>
            {!(statusFilter === '已發送' || statusFilter === '已排程' || statusFilter === '草稿') && (
              <SortIcon active={isActive('status')} order={sortConfig.order} />
            )}
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 發送人數 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[100px] cursor-pointer"
            onClick={() => onSortChange('sentCount')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">發送人數</p>
            </div>
            <SortIcon active={isActive('sentCount')} order={sortConfig.order} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 已開啟次數 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[120px] cursor-pointer"
            onClick={() => onSortChange('openCount')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">已開啟次數</p>
            </div>
            <SortIcon active={isActive('openCount')} order={sortConfig.order} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 點擊次數 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[100px] cursor-pointer"
            onClick={() => onSortChange('clickCount')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">點擊次數</p>
            </div>
            <SortIcon active={isActive('clickCount')} order={sortConfig.order} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 時間欄位 - 動態標籤 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[150px] cursor-pointer"
            onClick={() => onSortChange('sendTime')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">{getTimeColumnLabel()}</p>
            </div>
            {statusFilter === '草稿' && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div 
                      className="relative shrink-0 size-[24px]"
                      onClick={(e) => e.stopPropagation()}
                    >
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
  );
});

// Memoized Message Row Component
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
    <div className="relative shrink-0 size-[16px]">
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

  const EditButton = () => {
    const isDisabled = message.status === '已發送';
    return (
      <ButtonEdit onClick={() => onEdit(message.id)} hidden={isDisabled} />
    );
  };

  const Arrow = () => (
    <div className="relative size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <path d="M6 12L10 8L6 4" fill="#0F6BEB" />
      </svg>
    </div>
  );

  return (
    <div className={`bg-white relative shrink-0 w-full ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : ''}`}>
      <div aria-hidden="true" className={`absolute border-[#dddddd] ${isLast ? 'border-0' : 'border-[0px_0px_1px]'} border-solid inset-0 pointer-events-none ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : ''}`} />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          {/* 訊息標題 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[250px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5] truncate">{message.title}</p>
            </div>
          </div>

          {/* 互動標籤 */}
          <div className="box-border content-stretch flex flex-wrap gap-[4px] items-start px-[12px] py-0 relative shrink-0 w-[200px]">
            {message.tags.map((tag, index) => (
              <div key={index} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] px-[8px] py-[4px] relative rounded-[8px] shrink-0">
                <p className="leading-[1.5] relative shrink-0 text-[#0f6beb] text-[14px] text-center whitespace-nowrap">{tag}</p>
              </div>
            ))}
          </div>

          {/* 平台 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[100px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[24px]">{message.platform}</p>
            </div>
          </div>

          {/* 狀態 */}
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[100px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">{message.status}</p>
            </div>
            {(message.status === '已排程' || message.status === '已發送') && <CheckSuccess />}
          </div>

          {/* 發送人數 - 左對齊 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[100px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[24px]">{message.sentCount}</p>
            </div>
          </div>

          {/* 已開啟次數 - 左對齊 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[120px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[24px]">{message.openCount}</p>
            </div>
          </div>

          {/* 點擊次數 - 左對齊 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[100px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[24px]">{message.clickCount}</p>
            </div>
          </div>

          {/* 時間欄位 - 動態標籤 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[150px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5] whitespace-nowrap">{message.sendTime}</p>
            </div>
          </div>

          {/* 編輯按鈕 */}
          <EditButton />

          {/* 詳細按鈕 */}
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

const EmptyStateRow = memo(function EmptyStateRow() {
  return (
    <div className="bg-white relative shrink-0 w-full rounded-bl-[16px] rounded-br-[16px]" aria-live="polite">
      <div aria-hidden="true" className="absolute border-[#dddddd] border border-solid inset-0 pointer-events-none rounded-bl-[16px] rounded-br-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-center p-[40px] relative w-full">
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[#a8a8a8] text-[16px]">尚無此資料</p>
        </div>
      </div>
    </div>
  );
});

export default function InteractiveMessageTable({ messages, onEdit, onViewDetails, statusFilter }: InteractiveMessageTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'sendTime',
    order: 'desc',
  });

  const getDefaultOrder = (field: SortField): SortOrder => {
    switch (field) {
      case 'sendTime':
      case 'sentCount':
      case 'openCount':
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

    const list = [...messages];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'title':
          comparison = compareString(a.title, b.title);
          break;
        case 'tags':
          comparison = compareString(a.tags?.[0], b.tags?.[0]);
          break;
        case 'platform':
          comparison = compareString(a.platform, b.platform);
          break;
        case 'status':
          comparison = compareString(a.status, b.status);
          break;
        case 'sentCount':
          comparison = parseNumber(a.sentCount) - parseNumber(b.sentCount);
          break;
        case 'openCount':
          comparison = parseNumber(a.openCount) - parseNumber(b.openCount);
          break;
        case 'clickCount':
          comparison = parseNumber(a.clickCount) - parseNumber(b.clickCount);
          break;
        case 'sendTime':
          comparison = parseTime(a.timeValue ?? a.sendTime) - parseTime(b.timeValue ?? b.sendTime);
          break;
        default:
          comparison = 0;
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [messages, sortConfig]);

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      {/* Table Container - Fixed height container with horizontal scroll */}
      <div className="bg-white rounded-[16px] w-full flex flex-col max-h-[600px] overflow-x-auto table-scroll">
        {/* Table Header - Fixed */}
        <div className="relative shrink-0 w-[1250px]">
          <TableHeader sortConfig={sortConfig} onSortChange={handleSort} statusFilter={statusFilter} />
        </div>
        
        {/* Table Body - Scrollable Container */}
        <div className="w-[1250px] flex-1 table-scroll">
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
