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

// 統一欄位樣式 - 參照會員管理頁的對齊方式
const CELL_BASE = 'box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0';
const CELL_TEXT = 'text-[#383838] text-[14px] leading-[1.5]';

// 固定欄位寬度 - 參照會員管理頁
const COL_CONTENT = 'w-[200px]';      // 訊息內容
const COL_REPLY_TYPE = 'w-[100px]';   // 回應類型
const COL_KEYWORDS = 'w-[200px]';     // 關鍵字標籤
const COL_STATUS = 'w-[80px]';        // 狀態
const COL_TRIGGER = 'w-[100px]';      // 觸發次數
const COL_PLATFORM = 'w-[200px]';     // 平台
const COL_TIME = 'min-w-[160px] grow'; // 建立時間 (最後一欄用 grow)

// Memoized Table Header Component
const TableHeader = memo(function TableHeader({ sortConfig, onSortChange }: { sortConfig: SortConfig; onSortChange: (field: SortField) => void }) {
  const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
      <g transform="translate(1.34, 2.67)">
        <path d="M2.85381 0.195333C2.97883 0.0703528 3.14837 0.000142415 3.32514 0.000142415C3.50192 0.000142415 3.67146 0.0703528 3.79647 0.195333L6.46314 2.862C6.58458 2.98774 6.65178 3.15614 6.65026 3.33093C6.64874 3.50573 6.57863 3.67294 6.45502 3.79655C6.33142 3.92015 6.16421 3.99026 5.98941 3.99178C5.81461 3.9933 5.64621 3.92611 5.52047 3.80467L3.99181 2.276V10C3.99181 10.1768 3.92157 10.3464 3.79655 10.4714C3.67152 10.5964 3.50195 10.6667 3.32514 10.6667C3.14833 10.6667 2.97876 10.5964 2.85374 10.4714C2.72871 10.3464 2.65847 10.1768 2.65847 10V2.276L1.12981 3.80467C1.00407 3.92611 0.835672 3.9933 0.660874 3.99178C0.486076 3.99026 0.318868 3.92015 0.195262 3.79655C0.0716568 3.67294 0.00154415 3.50573 2.52018e-05 3.33093C-0.00149374 3.15614 0.0657025 2.98774 0.187141 2.862L2.85381 0.195333Z" fill={active && order === "asc" ? "#0f6beb" : "#9CA3AF"} />
        <path d="M9.32514 8.39067V0.666667C9.32514 0.489856 9.39538 0.320287 9.5204 0.195262C9.64543 0.070238 9.815 0 9.99181 0C10.1686 0 10.3382 0.070238 10.4632 0.195262C10.5882 0.320287 10.6585 0.489856 10.6585 0.666667V8.39067L12.1871 6.862C12.3129 6.74056 12.4813 6.67337 12.6561 6.67488C12.8309 6.6764 12.9981 6.74652 13.1217 6.87012C13.2453 6.99373 13.3154 7.16094 13.3169 7.33573C13.3184 7.51053 13.2512 7.67893 13.1298 7.80467L10.4631 10.4713C10.3381 10.5963 10.1686 10.6665 9.99181 10.6665C9.81503 10.6665 9.64549 10.5963 9.52047 10.4713L6.85381 7.80467C6.73237 7.67893 6.66517 7.51053 6.66669 7.33573C6.66821 7.16094 6.73832 6.99373 6.86193 6.87012C6.98553 6.74652 7.15274 6.6764 7.32754 6.67488C7.50234 6.67337 7.67074 6.74056 7.79647 6.862L9.32514 8.39067Z" fill={active && order === "desc" ? "#0f6beb" : "#9CA3AF"} />
      </g>
    </svg>
  );
  const isActive = (field: SortField) => sortConfig.field === field;

  return (
    <div className="bg-white relative shrink-0 w-full" data-name="TableHeader">
      <div className="flex flex-row items-center size-full border-b border-[#dddddd]">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          {/* 訊息內容 */}
          <div
            className={`${CELL_BASE} ${COL_CONTENT} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('content')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>訊息內容</span>
            <SortIcon active={isActive('content')} order={sortConfig.order} />
          </div>

          {/* 回應類型 */}
          <div
            className={`${CELL_BASE} ${COL_REPLY_TYPE} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('replyType')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>回應類型</span>
            <SortIcon active={isActive('replyType')} order={sortConfig.order} />
          </div>

          {/* 關鍵字標籤 */}
          <div
            className={`${CELL_BASE} ${COL_KEYWORDS} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('keywords')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>關鍵字標籤</span>
            <SortIcon active={isActive('keywords')} order={sortConfig.order} />
          </div>

          {/* 狀態 */}
          <div
            className={`${CELL_BASE} ${COL_STATUS} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('status')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>狀態</span>
            <SortIcon active={isActive('status')} order={sortConfig.order} />
          </div>

          {/* 觸發次數 */}
          <div
            className={`${CELL_BASE} ${COL_TRIGGER} gap-[4px] cursor-pointer`}
            onClick={() => onSortChange('triggerCount')}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>觸發次數</span>
            <SortIcon active={isActive('triggerCount')} order={sortConfig.order} />
          </div>

          {/* 平台 */}
          <div
            className={`${CELL_BASE} ${COL_PLATFORM} gap-[4px]`}
          >
            <span className={`${CELL_TEXT} whitespace-nowrap`}>平台</span>
          </div>

          {/* 建立時間 - 使用 grow 填滿剩餘空間 */}
          <div className="basis-0 grow min-h-px min-w-[160px] relative shrink-0">
            <div className="flex flex-row items-center size-full">
              <div
                className={`${CELL_BASE} w-full ${COL_TIME} gap-[4px] cursor-pointer`}
                onClick={() => onSortChange('createTime')}
              >
                <span className={`${CELL_TEXT} whitespace-nowrap`}>建立時間</span>
                <SortIcon active={isActive('createTime')} order={sortConfig.order} />
              </div>
            </div>
          </div>
        </div>
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
  const keywordList = row.keywordObjects && row.keywordObjects.length > 0
    ? row.keywordObjects
    : row.keywords.map(kw => ({ keyword: kw, isDuplicate: false }));

  return (
    <div
      className={`relative shrink-0 w-full transition-colors hover:bg-[#F8FAFC] cursor-pointer ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : 'border-b border-[#dddddd]'}`}
      style={{ backgroundColor: 'white' }}
      data-name="AutoReplyRow"
    >
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          {/* 訊息內容 */}
          <div className={`${CELL_BASE} ${COL_CONTENT}`}>
            <p className={`${CELL_TEXT} line-clamp-2`}>{row.content}</p>
          </div>

          {/* 回應類型 */}
          <div className={`${CELL_BASE} ${COL_REPLY_TYPE}`}>
            <p className={CELL_TEXT}>{row.replyType}</p>
          </div>

          {/* 關鍵字標籤 */}
          <div className={`${CELL_BASE} ${COL_KEYWORDS} flex-wrap gap-[4px] items-start`}>
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

          {/* 狀態 */}
          <div className={`${CELL_BASE} ${COL_STATUS}`}>
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

          {/* 觸發次數 */}
          <div className={`${CELL_BASE} ${COL_TRIGGER}`}>
            <p className={CELL_TEXT}>
              {row.triggerCount === 0 ? '-' : row.triggerCount.toLocaleString()}
            </p>
          </div>

          {/* 平台 - 文字超過時顯示 ... */}
          <div className={`${CELL_BASE} ${COL_PLATFORM} gap-[8px]`}>
            <MemberSourceIcon source={row.platform as MemberSourceType} size={24} />
            <span className={`${CELL_TEXT} truncate`}>{row.channelName || row.platform}</span>
          </div>

          {/* 建立時間 - 使用 grow 填滿剩餘空間 */}
          <div className={`${CELL_BASE} ${COL_TIME}`}>
            <p className={`${CELL_TEXT} whitespace-nowrap`}>{row.createTime}</p>
          </div>

          {/* 操作按鈕 */}
          <div className="content-stretch flex items-center shrink-0" onClick={() => onRowClick(row.id)}>
            <ButtonEdit />
          </div>
        </div>
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
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="AutoReplyTable">
      {/* 外層容器 - 水平滾動 */}
      <div className="bg-white rounded-[16px] w-full overflow-x-auto table-scroll">
        {/* 內層容器 - 最小寬度確保欄位對齊 */}
        <div className="min-w-[1160px]">
          {/* 表頭 - 固定在滾動區域外 */}
          <TableHeader sortConfig={sortConfig} onSortChange={handleSort} />

          {/* 垂直滾動容器 - 只有資料列滾動 */}
          <div className="max-h-[600px] overflow-y-auto table-scroll">
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
