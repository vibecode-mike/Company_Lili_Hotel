import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import svgPaths from "../imports/svg-wbwsye31ry";
import ButtonEdit from '../imports/ButtonEdit';
import { MemberSourceIcon } from './common/icons/MemberSourceIcon';
import type { MemberSourceType } from '../types/channel';

// 關鍵字對象（包含重複標記）
export interface KeywordObject {
  id?: number;
  keyword: string;
  isDuplicate: boolean;
}

export interface AutoReplyData {
  id: string;
  content: string;
  replyType: '歡迎訊息' | '觸發關鍵字' | '一律回應' | '指定時間';
  keywords: string[];
  keywordObjects?: KeywordObject[];  // 包含重複標記的關鍵字對象
  status: '啟用' | '停用';
  platform: string;
  channelName?: string;  // 粉專名稱
  triggerCount: number;
  createTime: string;
}

interface AutoReplyTableProps {
  data: AutoReplyData[];
  onRowClick?: (id: string) => void;
  onToggleStatus?: (id: string, nextState: boolean) => void;
  onDuplicateKeywordClick?: (keywordId: number, keyword: string, autoReplyId: string) => void;
}

// 重複關鍵字標籤組件（帶 Portal Tooltip）
function DuplicateKeywordTag({
  id,
  keyword,
  autoReplyId,
  onUpdateClick,
}: {
  id?: number;
  keyword: string;
  autoReplyId: string;
  onUpdateClick?: (keywordId: number, keyword: string, autoReplyId: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tagRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 300);
  };

  useEffect(() => {
    if (showTooltip && tagRef.current) {
      const rect = tagRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showTooltip]);

  // 清理計時器
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={tagRef}
      className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] px-[8px] py-[4px] relative rounded-[8px] shrink-0 transition-colors cursor-pointer"
      style={{ backgroundColor: isHovered ? '#ffcdd2' : '#ffebee' }}
      onMouseEnter={() => { handleMouseEnter(); setIsHovered(true); }}
      onMouseLeave={() => { handleMouseLeave(); setIsHovered(false); }}
    >
      <p className="leading-[1.5] relative shrink-0 text-[14px] text-center whitespace-nowrap" style={{ color: '#f44336' }}>
        {keyword}
      </p>
      {showTooltip && createPortal(
        <div
          className="fixed z-[9999] pointer-events-auto"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translate(-50%, -100%)',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="rounded-lg px-3 py-2 text-[13px] whitespace-nowrap shadow-lg cursor-pointer transition-colors"
            style={{ backgroundColor: '#383838', color: 'white' }}
            onClick={(e) => {
              e.stopPropagation();
              if (id && onUpdateClick) {
                onUpdateClick(id, keyword, autoReplyId);
                setShowTooltip(false);
              }
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4a4a4a')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#383838')}
          >
            重複標籤,<span style={{ color: '#64b5f6', textDecoration: 'underline' }}>點擊更新</span>為最新版本
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #383838',
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

type SortField = 'content' | 'replyType' | 'keywords' | 'status' | 'platform' | 'triggerCount' | 'createTime';
type SortOrder = 'asc' | 'desc';
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// 統一欄位寬度配置 - 使用 flex 彈性分配寬度
const COLUMN_CONFIG = {
  content: 'flex-1 min-w-[200px]',
  replyType: 'w-[120px]',
  keywords: 'flex-1 min-w-[180px]',
  status: 'w-[80px]',
  triggerCount: 'w-[100px]',
  platform: 'flex-1 min-w-[140px]',
  createTime: 'w-[160px]',
  actions: 'w-[60px]',
} as const;

// Cell padding - consistent across header and data rows
const CELL_PADDING = 'px-[12px]';

// Memoized Table Header Component
const TableHeader = memo(function TableHeader({ sortConfig, onSortChange }: { sortConfig: SortConfig; onSortChange: (field: SortField) => void }) {
  const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => (
    <div className="overflow-clip relative shrink-0 size-[20px]">
      <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]">
        <svg className={`block size-full ${active && order === 'asc' ? 'rotate-180' : ''}`} fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
          <path d="M0.666667 8H3.33333C3.7 8 4 7.7 4 7.33333C4 6.96667 3.7 6.66667 3.33333 6.66667H0.666667C0.3 6.66667 0 6.96667 0 7.33333C0 7.7 0.3 8 0.666667 8ZM0 0.666667C0 1.03333 0.3 1.33333 0.666667 1.33333H11.3333C11.7 1.33333 12 1.03333 12 0.666667C12 0.3 11.7 0 11.3333 0H0.666667C0.3 0 0 0.3 0 0.666667ZM0.666667 4.66667H7.33333C7.7 4.66667 8 4.36667 8 4C8 3.63333 7.7 3.33333 7.33333 3.33333H0.666667C0.3 3.33333 0 3.63333 0 4C0 4.36667 0.3 4.66667 0.666667 4.66667Z" fill={active ? '#0F6BEB' : '#6E6E6E'} />
        </svg>
      </div>
    </div>
  );
  const isActive = (field: SortField) => sortConfig.field === field;

  return (
    <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex items-center pb-[12px] pt-[16px]">
        <div
          className={`flex gap-[4px] items-center ${CELL_PADDING} ${COLUMN_CONFIG.content} cursor-pointer`}
          onClick={() => onSortChange('content')}
        >
          <span className="text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">訊息內容</span>
          <SortIcon active={isActive('content')} order={sortConfig.order} />
        </div>
        <div
          className={`flex gap-[4px] items-center ${CELL_PADDING} ${COLUMN_CONFIG.replyType} cursor-pointer`}
          onClick={() => onSortChange('replyType')}
        >
          <span className="text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">回應類型</span>
          <SortIcon active={isActive('replyType')} order={sortConfig.order} />
        </div>
        <div
          className={`flex gap-[4px] items-center ${CELL_PADDING} ${COLUMN_CONFIG.keywords} cursor-pointer`}
          onClick={() => onSortChange('keywords')}
        >
          <span className="text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">關鍵字標籤</span>
          <SortIcon active={isActive('keywords')} order={sortConfig.order} />
        </div>
        <div
          className={`flex gap-[4px] items-center ${CELL_PADDING} ${COLUMN_CONFIG.status} cursor-pointer`}
          onClick={() => onSortChange('status')}
        >
          <span className="text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">狀態</span>
          <SortIcon active={isActive('status')} order={sortConfig.order} />
        </div>
        <div
          className={`flex gap-[4px] items-center ${CELL_PADDING} ${COLUMN_CONFIG.triggerCount} cursor-pointer`}
          onClick={() => onSortChange('triggerCount')}
        >
          <span className="text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">觸發次數</span>
          <SortIcon active={isActive('triggerCount')} order={sortConfig.order} />
        </div>
        <div
          className={`flex gap-[4px] items-center ${CELL_PADDING} ${COLUMN_CONFIG.platform}`}
        >
          <span className="text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">平台</span>
        </div>
        <div
          className={`flex gap-[4px] items-center ${CELL_PADDING} ${COLUMN_CONFIG.createTime} cursor-pointer`}
          onClick={() => onSortChange('createTime')}
        >
          <span className="text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">建立時間</span>
          <SortIcon active={isActive('createTime')} order={sortConfig.order} />
        </div>
        <div className={COLUMN_CONFIG.actions} />
      </div>
    </div>
  );
});

// Memoized Auto Reply Row Component
const AutoReplyRow = memo(function AutoReplyRow({
  row,
  isLast,
  onRowClick,
  onToggleStatus,
  onDuplicateKeywordClick,
}: {
  row: AutoReplyData;
  isLast: boolean;
  onRowClick: (id: string) => void;
  onToggleStatus: (event: React.MouseEvent, id: string, status: AutoReplyData['status']) => void;
  onDuplicateKeywordClick?: (keywordId: number, keyword: string, autoReplyId: string) => void;
}) {
  const EditButton = () => (
    <div className={`${COLUMN_CONFIG.actions} flex items-center justify-center`} onClick={() => onRowClick(row.id)}>
      <ButtonEdit />
    </div>
  );

  const keywordList = row.keywordObjects && row.keywordObjects.length > 0
    ? row.keywordObjects
    : row.keywords.map(kw => ({ keyword: kw, isDuplicate: false }));

  return (
    <div className={`bg-white relative shrink-0 w-full hover:bg-[#f6f9fd] transition-colors cursor-pointer ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : ''}`}>
      <div aria-hidden="true" className={`absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : ''}`} />
      <div className="flex items-center py-[12px]">
        <div className={`flex items-center ${CELL_PADDING} ${COLUMN_CONFIG.content}`}>
          <p className="text-[#383838] text-[14px] leading-[1.5] line-clamp-2">{row.content}</p>
        </div>
        <div className={`flex items-center ${CELL_PADDING} ${COLUMN_CONFIG.replyType}`}>
          <p className="text-[#383838] text-[14px] leading-[1.5]">{row.replyType}</p>
        </div>
        <div className={`flex flex-wrap gap-[4px] items-start ${CELL_PADDING} ${COLUMN_CONFIG.keywords}`}>
          {row.keywords.length > 0 ? (
            keywordList.map((kwObj, idx) =>
              kwObj.isDuplicate ? (
                <DuplicateKeywordTag
                  key={idx}
                  id={kwObj.id}
                  keyword={kwObj.keyword}
                  autoReplyId={row.id}
                  onUpdateClick={onDuplicateKeywordClick}
                />
              ) : (
                <div
                  key={idx}
                  className="flex items-center justify-center min-w-[32px] px-[8px] py-[4px] rounded-[8px] bg-[#f0f6ff]"
                >
                  <p className="text-[14px] text-center whitespace-nowrap text-[#0f6beb] leading-[1.5]">
                    {kwObj.keyword}
                  </p>
                </div>
              )
            )
          ) : (
            <p className="text-[14px] text-[#6e6e6e] leading-[1.5]">-</p>
          )}
        </div>
        <div className={`flex items-center ${CELL_PADDING} ${COLUMN_CONFIG.status}`}>
          <button
            onClick={(e) => onToggleStatus(e, row.id, row.status)}
            className="flex items-center justify-center"
          >
            <div className="relative size-[40px]">
              <svg className="block size-full" fill="none" viewBox="0 0 40 40">
                <g clipPath="url(#clip0_8236_70)" id="Toggle">
                  <g id="Vector"></g>
                  <path
                    d={row.status === '啟用' ? svgPaths.p13e42a00 : svgPaths.p3ed4d200}
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
        <div className={`flex items-center ${CELL_PADDING} ${COLUMN_CONFIG.triggerCount}`}>
          <p className="text-[#383838] text-[14px] leading-[1.5]">
            {row.triggerCount === 0 ? '-' : row.triggerCount.toLocaleString()}
          </p>
        </div>
        <div className={`flex items-center gap-[8px] ${CELL_PADDING} ${COLUMN_CONFIG.platform}`}>
          <MemberSourceIcon source={row.platform as MemberSourceType} size={28} />
          {row.channelName && (
            <p className="text-[#383838] text-[14px] leading-[1.5] truncate">{row.channelName}</p>
          )}
        </div>
        <div className={`flex items-center ${CELL_PADDING} ${COLUMN_CONFIG.createTime}`}>
          <p className="text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">{row.createTime}</p>
        </div>
        <EditButton />
      </div>
    </div>
  );
});

export default function AutoReplyTableStyled({ data, onRowClick, onToggleStatus, onDuplicateKeywordClick }: AutoReplyTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createTime',
    order: 'desc',
  });

  const getDefaultOrder = (field: SortField): SortOrder => {
    switch (field) {
      case 'createTime':
      case 'triggerCount':
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

  const sortedData = useMemo(() => {
    const list = [...data];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'content':
          comparison = a.content.localeCompare(b.content);
          break;
        case 'replyType':
          comparison = a.replyType.localeCompare(b.replyType);
          break;
        case 'keywords':
          comparison = a.keywords.join(',').localeCompare(b.keywords.join(','));
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'platform':
          comparison = a.platform.localeCompare(b.platform);
          break;
        case 'triggerCount':
          comparison = a.triggerCount - b.triggerCount;
          break;
        case 'createTime':
          comparison = new Date(a.createTime).getTime() - new Date(b.createTime).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [data, sortConfig]);

  const handleRowClick = (id: string) => {
    onRowClick?.(id);
  };

  const handleToggleStatus = (event: React.MouseEvent, id: string, status: AutoReplyData['status']) => {
    event.stopPropagation();
    onToggleStatus?.(id, status !== '啟用');
  };

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      {/* Table Container */}
      <div className="bg-white rounded-[16px] w-full">
        {/* Inner wrapper */}
        <div>
          {/* Vertical scroll container with sticky header */}
          <div className="max-h-[600px] overflow-y-auto table-scroll">
            {/* Table Header - Sticky */}
            <div className="sticky top-0 z-10">
              <TableHeader sortConfig={sortConfig} onSortChange={handleSort} />
            </div>

            {/* Table Body */}
            {sortedData.map((row, index) => (
              <AutoReplyRow
                key={row.id}
                row={row}
                isLast={index === sortedData.length - 1}
                onRowClick={handleRowClick}
                onToggleStatus={handleToggleStatus}
                onDuplicateKeywordClick={onDuplicateKeywordClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
