import { useState } from 'react';
import ButtonEdit from '../imports/ButtonEdit';

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
}

interface InteractiveMessageTableProps {
  messages: Message[];
  onEdit: (id: string) => void;
  onViewDetails: (id: string) => void;
}

type SortField = 'title' | 'tags' | 'platform' | 'status' | 'sentCount' | 'openCount' | 'clickCount' | 'sendTime';

// Table Header Component
function TableHeader({ sortBy, onSortChange }: { sortBy: SortField | null; onSortChange: (field: SortField) => void }) {
  const SortIcon = ({
    column,
    isActive
  }: {
    column: string;
    isActive: boolean;
  }) => {
    return (
      <div className="overflow-clip relative shrink-0 size-[20px]">
        <div className="absolute inset-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
            <path d="M0.666667 8H3.33333C3.7 8 4 7.7 4 7.33333C4 6.96667 3.7 6.66667 3.33333 6.66667H0.666667C0.3 6.66667 0 6.96667 0 7.33333C0 7.7 0.3 8 0.666667 8ZM0 0.666667C0 1.03333 0.3 1.33333 0.666667 1.33333H11.3333C11.7 1.33333 12 1.03333 12 0.666667C12 0.3 11.7 0 11.3333 0H0.666667C0.3 0 0 0.3 0 0.666667ZM0.666667 4.66667H7.33333C7.7 4.66667 8 4.36667 8 4C8 3.63333 7.7 3.33333 7.33333 3.33333H0.666667C0.3 3.33333 0 3.63333 0 4C0 4.36667 0.3 4.66667 0.666667 4.66667Z" fill={isActive ? '#0F6BEB' : '#6E6E6E'} />
          </svg>
        </div>
      </div>
    );
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
            <SortIcon column="title" isActive={sortBy === 'title'} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 標籤 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[200px] cursor-pointer"
            onClick={() => onSortChange('tags')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">標籤</p>
            </div>
            <SortIcon column="tags" isActive={sortBy === 'tags'} />
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
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[100px] cursor-pointer"
            onClick={() => onSortChange('platform')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">平台</p>
            </div>
            <SortIcon column="platform" isActive={sortBy === 'platform'} />
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
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[100px] cursor-pointer"
            onClick={() => onSortChange('status')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">狀態</p>
            </div>
            <SortIcon column="status" isActive={sortBy === 'status'} />
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
            <SortIcon column="sentCount" isActive={sortBy === 'sentCount'} />
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
            <SortIcon column="openCount" isActive={sortBy === 'openCount'} />
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
            <SortIcon column="clickCount" isActive={sortBy === 'clickCount'} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 發送時間 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[150px] cursor-pointer"
            onClick={() => onSortChange('sendTime')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">發送時間</p>
            </div>
            <SortIcon column="sendTime" isActive={sortBy === 'sendTime'} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Row Component
function MessageRow({ 
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
      <div 
        className={`${
          isDisabled 
            ? 'cursor-not-allowed opacity-50' 
            : ''
        }`}
        onClick={() => !isDisabled && onEdit(message.id)}
      >
        <ButtonEdit />
      </div>
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

          {/* 標籤 */}
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

          {/* 發送時間 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[150px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5] whitespace-nowrap">{message.sendTime}</p>
            </div>
          </div>

          {/* 編輯按鈕 */}
          <EditButton />

          {/* 詳細按鈕 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors rounded-[8px]"
            onClick={() => onViewDetails(message.id)}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">詳細</p>
            </div>
            <div className="flex items-center justify-center relative shrink-0">
              <div className="flex-none scale-y-[-100%]">
                <Arrow />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InteractiveMessageTable({ messages, onEdit, onViewDetails }: InteractiveMessageTableProps) {
  const [sortBy, setSortBy] = useState<SortField | null>('sendTime');

  const handleSort = (field: SortField) => {
    setSortBy(field);
  };

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      {/* Table Container - Fixed height container with horizontal scroll */}
      <div className="bg-white rounded-[16px] w-full flex flex-col max-h-[600px] overflow-x-auto table-scroll">
        {/* Table Header - Fixed */}
        <div className="relative shrink-0 w-[1250px]">
          <TableHeader sortBy={sortBy} onSortChange={handleSort} />
        </div>
        
        {/* Table Body - Scrollable Container */}
        <div className="w-[1250px] flex-1 table-scroll">
          {messages.map((message, index) => (
            <MessageRow 
              key={message.id} 
              message={message} 
              isLast={index === messages.length - 1}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
}