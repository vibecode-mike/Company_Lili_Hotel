import { useState } from 'react';
import toggleSvgPaths from '../imports/svg-3zvphj6nxz';
import ButtonEdit from '../imports/ButtonEdit';

export interface AutoReplyData {
  id: string;
  content: string;
  replyType: string;
  keywords: string[];
  status: '啟用' | '停用';
  platform: string;
  triggerCount: number;
  createTime: string;
}

interface AutoReplyTableProps {
  data: AutoReplyData[];
  onRowClick?: (id: string) => void;
}

type SortField = 'content' | 'replyType' | 'keywords' | 'status' | 'platform' | 'triggerCount' | 'createTime';

// Table Header Component
function TableHeader({ sortBy, onSortChange }: { sortBy: SortField | null; onSortChange: (field: SortField) => void }) {
  const SortIcon = ({ isActive }: { isActive: boolean }) => (
    <div className="overflow-clip relative shrink-0 size-[20px]">
      <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
          <path d="M0.666667 8H3.33333C3.7 8 4 7.7 4 7.33333C4 6.96667 3.7 6.66667 3.33333 6.66667H0.666667C0.3 6.66667 0 6.96667 0 7.33333C0 7.7 0.3 8 0.666667 8ZM0 0.666667C0 1.03333 0.3 1.33333 0.666667 1.33333H11.3333C11.7 1.33333 12 1.03333 12 0.666667C12 0.3 11.7 0 11.3333 0H0.666667C0.3 0 0 0.3 0 0.666667ZM0.666667 4.66667H7.33333C7.7 4.66667 8 4.36667 8 4C8 3.63333 7.7 3.33333 7.33333 3.33333H0.666667C0.3 3.33333 0 3.63333 0 4C0 4.36667 0.3 4.66667 0.666667 4.66667Z" fill={isActive ? '#0F6BEB' : '#6E6E6E'} />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] pl-[12px] pr-[12px] relative w-full">
          {/* 訊息內容 */}
          <div
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[300px] cursor-pointer"
            onClick={() => onSortChange('content')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">訊息內容</p>
            </div>
            <SortIcon isActive={sortBy === 'content'} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 回應類型 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[140px] cursor-pointer"
            onClick={() => onSortChange('replyType')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">回應類型</p>
            </div>
            <SortIcon isActive={sortBy === 'replyType'} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 關鍵字標籤 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[280px] cursor-pointer"
            onClick={() => onSortChange('keywords')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">關鍵字標籤</p>
            </div>
            <SortIcon isActive={sortBy === 'keywords'} />
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
            <SortIcon isActive={sortBy === 'status'} />
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
            <SortIcon isActive={sortBy === 'platform'} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 觸發次數 */}
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[110px] cursor-pointer"
            onClick={() => onSortChange('triggerCount')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">觸發次數</p>
            </div>
            <SortIcon isActive={sortBy === 'triggerCount'} />
          </div>

          {/* Divider */}
          <div className="h-[12px] relative shrink-0 w-0">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" stroke="#DDDDDD" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          {/* 建立時間 */}
          <div 
            className="box-border content-stretch flex items-center pl-[12px] pr-0 py-0 relative shrink-0 w-[160px] cursor-pointer"
            onClick={() => onSortChange('createTime')}
          >
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">建立時間</p>
            </div>
            <SortIcon isActive={sortBy === 'createTime'} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Auto Reply Row Component
function AutoReplyRow({ 
  row, 
  isLast, 
  onRowClick,
  onToggleStatus
}: { 
  row: AutoReplyData; 
  isLast: boolean; 
  onRowClick: (id: string) => void;
  onToggleStatus: (e: React.MouseEvent, id: string) => void;
}) {
  const EditButton = () => (
    <div onClick={() => onRowClick(row.id)}>
      <ButtonEdit />
    </div>
  );

  return (
    <div className={`bg-white relative shrink-0 w-full ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : ''}`}>
      <div aria-hidden="true" className={`absolute border-[#dddddd] ${isLast ? 'border-0' : 'border-[0px_0px_1px]'} border-solid inset-0 pointer-events-none ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : ''}`} />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pl-[12px] py-[12px] pr-[12px] relative w-full">
          {/* 訊息內容 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[300px]">
            <div className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5] line-clamp-2">{row.content}</p>
            </div>
          </div>

          {/* 回應類型 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]">
            <div className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">{row.replyType}</p>
            </div>
          </div>

          {/* 關鍵字標籤 */}
          <div className="box-border content-stretch flex flex-wrap gap-[4px] items-start px-[12px] py-0 relative shrink-0 w-[280px]">
            {row.keywords.length > 0 ? (
              <>
                {row.keywords.map((keyword, idx) => (
                  <div key={idx} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] px-[8px] py-[4px] relative rounded-[8px] shrink-0">
                    <p className="leading-[1.5] relative shrink-0 text-[#0f6beb] text-[14px] text-center whitespace-nowrap">{keyword}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-[14px] text-[#6e6e6e] leading-[1.5]">-</p>
            )}
          </div>

          {/* 狀態 */}
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[100px]">
            <button 
              onClick={(e) => onToggleStatus(e, row.id)}
              className="flex items-center justify-center"
            >
              <div className="relative size-[40px]">
                <svg className="block size-full" fill="none" viewBox="0 0 40 40">
                  <g clipPath="url(#clip0_8236_70)" id="Toggle">
                    <g id="Vector"></g>
                    <path 
                      d={row.status === '啟用' 
                        ? toggleSvgPaths.p13e42a00 
                        : "M28.3333 11.6667H11.6667C7.06667 11.6667 3.33333 15.4 3.33333 20C3.33333 24.6 7.06667 28.3333 11.6667 28.3333H28.3333C32.9333 28.3333 36.6667 24.6 36.6667 20C36.6667 15.4 32.9333 11.6667 28.3333 11.6667ZM11.6667 25C8.9 25 6.66667 22.7667 6.66667 20C6.66667 17.2333 8.9 15 11.6667 15C14.4333 15 16.6667 17.2333 16.6667 20C16.6667 22.7667 14.4333 25 11.6667 25Z"
                      }
                      fill={row.status === '啟用' ? '#0F6BEB' : '#E5E7EB'}
                      id="Vector_2"
                      className="transition-all duration-300 ease-in-out"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_8236_70">
                      <rect fill="white" height="40" width="40" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </button>
          </div>

          {/* 平台 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[100px]">
            <div className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">{row.platform}</p>
            </div>
          </div>

          {/* 觸發次數 - 左對齊 */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[110px]">
            <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">
                {row.triggerCount === 0 ? '-' : row.triggerCount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* 建立時間 */}
          <div className="box-border content-stretch flex items-center pl-[12px] pr-0 py-0 relative shrink-0 w-[160px]">
            <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5] whitespace-nowrap">{row.createTime}</p>
            </div>
          </div>

          {/* 編輯按鈕 */}
          <EditButton />
        </div>
      </div>
    </div>
  );
}

export default function AutoReplyTableStyled({ data, onRowClick }: AutoReplyTableProps) {
  const [sortBy, setSortBy] = useState<SortField | null>('createTime');
  const [tableData, setTableData] = useState<AutoReplyData[]>(data);

  const handleSort = (field: SortField) => {
    setSortBy(field);
  };

  const handleRowClick = (id: string) => {
    onRowClick?.(id);
  };

  const handleToggleStatus = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Toggle status between '啟用' and '停用'
    setTableData(prevData =>
      prevData.map(row =>
        row.id === id
          ? { ...row, status: row.status === '啟用' ? '停用' : '啟用' }
          : row
      )
    );
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
        <div className="w-[1250px] flex-1 overflow-y-auto table-scroll">
          {tableData.map((row, index) => (
            <AutoReplyRow 
              key={row.id} 
              row={row} 
              isLast={index === tableData.length - 1}
              onRowClick={handleRowClick}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
}