import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Filter, Check } from "lucide-react";
import svgPaths from "./svg-wbwsye31ry";
import { SearchContainer } from "../components/common/SearchContainers";
import DownloadConversationsModal from "../components/DownloadConversationsModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";
import TooltipComponent from "./Tooltip";
import { PageHeaderWithBreadcrumb } from "../components/common/Breadcrumb";
import { TextIconButton, ArrowRightIcon, Tag } from "../components/common";
import { MemberSourceIconLarge, ChannelIcon as CommonChannelIcon } from "../components/common/icons";
import { useMembers } from "../contexts/MembersContext";
import { formatMemberDateTime, getLatestMemberChatTimestamp, formatUnansweredTime } from "../utils/memberTime";
import { apiGet } from "../utils/apiClient";

/**
 * 會員管理列表頁面組件
 * 
 * 用途：顯示會員列表、搜索和管理會員
 * 使用位置：
 * - App.tsx (作為 MemberManagement)
 * - MessageList.tsx (作為 MemberMainContainer)
 * 
 * 注意：此文件名為 Figma 導入時自動生成的名稱
 */

import type { DisplayMember, ChannelType } from "../types/member";

interface MemberMainContainerProps {
  onAddMember?: () => void;
  onOpenChat?: (member: DisplayMember) => void;
  onViewDetail?: (member: DisplayMember) => void;
  // 由外部（例如數據洞察頁的互動旅程 stacked bar）帶入的初始篩選
  initialTagFilter?: string[];
  // ChannelType 字串：'LINE' | 'Facebook' | 'Webchat'
  // boundChannels 載入完成後解析成第一個符合的 BoundChannel.key 套用到 platformFilter
  initialPlatformChannel?: string;
}





function Container1({ onAddMember }: { onAddMember?: () => void }) {
  return (
    <div className="basis-0 content-stretch flex gap-[12px] grow items-center justify-end min-h-px min-w-px relative shrink-0" data-name="Container">
      <div 
        onClick={onAddMember}
        className="hidden bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors" 
        data-name="Button"
      >
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">新增會員</p>
      </div>
    </div>
  );
}

// 下載對話紀錄按鈕
function DownloadConversationsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="box-border content-stretch flex gap-[6px] items-center rounded-[12px] shrink-0 h-[48px] px-[8px] py-[12px] text-[16px] font-['Noto_Sans_TC:Regular',sans-serif] text-[#0f6beb] hover:bg-[#f0f6ff] transition-colors cursor-pointer"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>下載對話紀錄</span>
    </button>
  );
}

function Container2({
  searchValue, onSearchChange, onSearch, onClearSearch, onClearAll, onDownloadConversations,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onClearAll: () => void;
  onAddMember?: () => void;
  onDownloadConversations: () => void;
}) {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full" data-name="Container">
      {/* SearchContainer 內含 size-full，會吃光 flex 空間。
          外面包一層 shrink-0 並用 ! 覆寫 size-full，讓它退回自然寬。 */}
      <div className="shrink-0">
        <SearchContainer
          value={searchValue}
          onChange={onSearchChange}
          onSearch={onSearch}
          onClear={onClearSearch}
          onClearAll={onClearAll}
          className="!size-auto !w-auto !h-auto"
        />
      </div>
      {/* 右側按鈕群：grow 取得剩餘空間、justify-end 推到右緣，
          與下方表格 px-[40px] 容器右緣對齊 */}
      <div className="basis-0 grow flex gap-[12px] items-center justify-end min-w-px">
        <DownloadConversationsButton onClick={onDownloadConversations} />
      </div>
    </div>
  );
}

// 計數文字依平臺篩選決定：
// - 所有平臺：共 OO 位（Web Chat 保留近 7 天的匿名資料）
// - Webchat：共 OO 位（保留近 7 天的匿名資料）
// - LINE / Facebook：共 OO 位
function buildCountText(count: number, platformFilter: string, boundChannels: BoundChannel[]): string {
  if (platformFilter === 'all') {
    return `共 ${count} 位（Web Chat 保留近 7 天的匿名資料）`;
  }
  const found = boundChannels.find((c) => c.key === platformFilter);
  if (found?.channel === 'Webchat') {
    return `共 ${count} 位（保留近 7 天的匿名資料）`;
  }
  // LINE / Facebook：未補註解
  return `共 ${count} 位`;
}

function Container3({ count, platformFilter, boundChannels }: { count: number; platformFilter: string; boundChannels: BoundChannel[] }) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-name="Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px]">
        {buildCountText(count, platformFilter, boundChannels)}
      </p>
    </div>
  );
}

function Container4({ count, platformFilter, boundChannels }: { count: number; platformFilter: string; boundChannels: BoundChannel[] }) {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Container">
      <Container3 count={count} platformFilter={platformFilter} boundChannels={boundChannels} />
    </div>
  );
}

function Container5({ count, platformFilter, boundChannels }: { count: number; platformFilter: string; boundChannels: BoundChannel[] }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Container4 count={count} platformFilter={platformFilter} boundChannels={boundChannels} />
    </div>
  );
}

type SortField = 'realName' | 'phone' | 'email' | 'lastChatTime';
type SortOrder = 'asc' | 'desc';
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

function SortingIcon({ active, order }: { active: boolean; order: SortOrder }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
      <g transform="translate(1.34, 2.67)">
        <path d="M2.85381 0.195333C2.97883 0.0703528 3.14837 0.000142415 3.32514 0.000142415C3.50192 0.000142415 3.67146 0.0703528 3.79647 0.195333L6.46314 2.862C6.58458 2.98774 6.65178 3.15614 6.65026 3.33093C6.64874 3.50573 6.57863 3.67294 6.45502 3.79655C6.33142 3.92015 6.16421 3.99026 5.98941 3.99178C5.81461 3.9933 5.64621 3.92611 5.52047 3.80467L3.99181 2.276V10C3.99181 10.1768 3.92157 10.3464 3.79655 10.4714C3.67152 10.5964 3.50195 10.6667 3.32514 10.6667C3.14833 10.6667 2.97876 10.5964 2.85374 10.4714C2.72871 10.3464 2.65847 10.1768 2.65847 10V2.276L1.12981 3.80467C1.00407 3.92611 0.835672 3.9933 0.660874 3.99178C0.486076 3.99026 0.318868 3.92015 0.195262 3.79655C0.0716568 3.67294 0.00154415 3.50573 2.52018e-05 3.33093C-0.00149374 3.15614 0.0657025 2.98774 0.187141 2.862L2.85381 0.195333Z" fill={active && order === "asc" ? "#0f6beb" : "#9CA3AF"} />
        <path d="M9.32514 8.39067V0.666667C9.32514 0.489856 9.39538 0.320287 9.5204 0.195262C9.64543 0.070238 9.815 0 9.99181 0C10.1686 0 10.3382 0.070238 10.4632 0.195262C10.5882 0.320287 10.6585 0.489856 10.6585 0.666667V8.39067L12.1871 6.862C12.3129 6.74056 12.4813 6.67337 12.6561 6.67488C12.8309 6.6764 12.9981 6.74652 13.1217 6.87012C13.2453 6.99373 13.3154 7.16094 13.3169 7.33573C13.3184 7.51053 13.2512 7.67893 13.1298 7.80467L10.4631 10.4713C10.3381 10.5963 10.1686 10.6665 9.99181 10.6665C9.81503 10.6665 9.64549 10.5963 9.52047 10.4713L6.85381 7.80467C6.73237 7.67893 6.66517 7.51053 6.66669 7.33573C6.66821 7.16094 6.73832 6.99373 6.86193 6.87012C6.98553 6.74652 7.15274 6.6764 7.32754 6.67488C7.50234 6.67337 7.67074 6.74056 7.79647 6.862L9.32514 8.39067Z" fill={active && order === "desc" ? "#0f6beb" : "#9CA3AF"} />
      </g>
    </svg>
  );
}

// 平臺篩選用：每筆代表「基本設定已綁定的一個帳號」
// key 用 `${channel}|${channelName}` 作為唯一識別，方便和會員資料比對
export interface BoundChannel {
  key: string;
  channel: ChannelType | null;
  channelName: string | null;
  label: string;
}

// 平臺 dropdown 內單一渠道圖標：尺寸/樣式與會員列表平臺欄一致（20px）
// LINE / Facebook 走統一 SVG；Webchat 沿用列表平臺欄同款 chat bubble + 星星 icon
export function ChannelOptionIcon({ channel }: { channel: ChannelType }) {
  if (channel === 'LINE' || channel === 'Facebook') {
    return <CommonChannelIcon channel={channel} size={20} />;
  }
  return (
    <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 20 20" aria-hidden>
      <path fill="#6E6E6E" d="M10.002 3.3334C8.7996 3.3334 7.59712 3.38045 6.40337 3.47337C4.88253 3.5917 3.59972 4.5209 2.97889 5.8334H2.50037C2.04037 5.8334 1.66704 6.20673 1.66704 6.66673V8.3334C1.66704 8.7934 2.04037 9.16673 2.50037 9.16673H2.502C2.502 9.8259 2.53386 10.4844 2.59803 11.1394C2.79719 13.1386 4.39995 14.7034 6.40662 14.8601C7.60162 14.9526 8.80609 15.0001 10.0053 15.0001C10.5719 15.0001 11.1355 14.99 11.698 14.9691C12.158 14.9516 12.5154 14.5649 12.4987 14.1049C12.4821 13.6449 12.0919 13.2758 11.6361 13.3041C9.94695 13.3641 8.23183 13.3291 6.53683 13.1983C5.336 13.105 4.37572 12.17 4.25656 10.975C4.13739 9.77417 4.13818 8.55683 4.25818 7.35683C4.37735 6.16183 5.33441 5.22849 6.53357 5.13515C8.83691 4.95515 11.1687 4.95515 13.472 5.13515C14.6479 5.22599 15.6234 6.16837 15.7409 7.32754C15.7768 7.67504 15.8016 8.0225 15.8174 8.37083C15.8383 8.82417 16.2228 9.16851 16.6687 9.16185V9.16673H17.502C17.962 9.16673 18.3353 8.7934 18.3353 8.3334V6.66673C18.3345 6.20673 17.9604 5.8334 17.5004 5.8334H17.0267C16.4101 4.52256 15.1256 3.5917 13.6006 3.47337C12.4073 3.38045 11.2044 3.3334 10.002 3.3334ZM10.0004 6.66673C9.38735 6.66673 8.77451 6.68226 8.16118 6.71393C6.86451 6.78143 5.83787 7.84561 5.8337 9.14394V9.18952C5.83787 10.4879 6.86451 11.5504 8.16118 11.6179C9.38784 11.6812 10.6146 11.6812 11.8396 11.6179C13.1362 11.5504 14.1629 10.4879 14.167 9.18952V9.14394C14.1629 7.84561 13.1362 6.78143 11.8396 6.71393C11.2266 6.68226 10.6134 6.66673 10.0004 6.66673ZM8.3337 8.3334C8.7937 8.3334 9.16704 8.70673 9.16704 9.16673C9.16704 9.62673 8.7937 10.0001 8.3337 10.0001C7.8737 10.0001 7.50037 9.62673 7.50037 9.16673C7.50037 8.70673 7.8737 8.3334 8.3337 8.3334ZM11.667 8.3334C12.127 8.3334 12.5004 8.70673 12.5004 9.16673C12.5004 9.62673 12.127 10.0001 11.667 10.0001C11.207 10.0001 10.8337 9.62673 10.8337 9.16673C10.8337 8.70673 11.207 8.3334 11.667 8.3334ZM15.8337 10.0001C15.7695 10.0001 15.7057 10.0459 15.6791 10.1384C15.0007 12.4976 14.502 12.7524 13.4411 13.1658C13.2978 13.2216 13.2978 13.442 13.4411 13.4978C14.5011 13.9111 15.0007 14.1643 15.6791 16.5235C15.7324 16.7085 15.935 16.7085 15.9883 16.5235C16.6667 14.1643 17.1654 13.9111 18.2263 13.4978C18.3696 13.442 18.3696 13.2216 18.2263 13.1658C17.1663 12.7524 16.6667 12.4976 15.9883 10.1384C15.9617 10.0459 15.8979 10.0001 15.8337 10.0001Z"/>
    </svg>
  );
}

// 平臺 filter dropdown（樣式對齊 InsightsPanel 核心洞察 duration 篩選）
export function PlatformFilterDropdown({
  selected,
  onChange,
  boundChannels,
}: {
  selected: string;
  onChange: (key: string) => void;
  boundChannels: BoundChannel[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // 量測觸發按鈕位置（viewport 座標，搭配 fixed 定位避免被表頭裁切）
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  }, [open]);

  // 外部點擊 / 滾動 / 視窗大小改變時自動關閉
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrap = wrapRef.current?.contains(target);
      const insideList = listRef.current?.contains(target);
      if (!insideWrap && !insideList) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true); // capture：抓得到可滾動祖先
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  // 「所有平臺」永遠排第一，作為預設選項
  const allOption: BoundChannel = { key: "all", channel: null, channelName: null, label: "所有平臺" };
  const options: BoundChannel[] = [allOption, ...boundChannels];
  // 平臺 filter trigger icon 永遠呈藍色 active 狀態（含「所有平臺」），不再以 selected 是否為 all 來切換灰/藍
  const isFilterActive = true;

  return (
    <div ref={wrapRef} className="relative inline-flex items-center shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center justify-center size-[16px] cursor-pointer bg-transparent border-none p-0 m-0"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="篩選平臺"
      >
        <Filter
          size={16}
          color={isFilterActive ? "#0f6beb" : "#9CA3AF"}
          strokeWidth={2}
        />
      </button>

      {open && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          className="fixed min-w-[180px] max-w-[320px] bg-white border border-solid rounded-[12px] flex flex-col gap-[4px] p-[4px]"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 1000,
            borderColor: "rgba(221, 221, 221, 0.55)",
            boxShadow:
              "0px 2px 2px 0px rgba(221, 221, 221, 0.32), 0px 5px 15px 0px rgba(221, 221, 221, 0.2)",
          }}
        >
          {options.map((opt) => {
            const active = opt.key === selected;
            return (
              <li key={opt.key} role="option" aria-selected={active} className="w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.key);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-[8px] min-h-[48px] p-[8px] rounded-[8px] text-[16px] leading-[1.5] text-[#383838] text-left cursor-pointer transition-colors hover:bg-[#f0f6ff] ${
                    active ? "bg-[#f0f6ff]" : "bg-white"
                  }`}
                >
                  {/* 非「所有平臺」才顯示渠道 icon（icon 樣式/大小對齊會員列表平臺欄）*/}
                  {opt.channel && <ChannelOptionIcon channel={opt.channel} />}
                  <span className="flex-1 min-w-0 truncate">{opt.channel ? (opt.channelName ?? opt.label) : opt.label}</span>
                  {active && (
                    <Check
                      size={24}
                      className="shrink-0 text-[#0f6beb]"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </div>
  );
}

// 標籤 filter dropdown（多選 + 搜尋 + 已選 chips + 可滾動列表）
// trigger 視覺與 PlatformFilterDropdown 對齊；isFilterActive 條件改成「有任一已選」。
export function TagFilterDropdown({
  selected,
  onChange,
  tagPool,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
  tagPool: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // 量測觸發按鈕位置（fixed 定位，避免被表頭裁切）
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  }, [open]);

  // 外部點擊 / 滾動 / 視窗大小改變時自動關閉
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrap = wrapRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideWrap && !insidePanel) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  // 關閉時把搜尋字串清掉，下次開啟回到初始狀態
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const isFilterActive = selected.length > 0;

  // 列表用：依搜尋字串模糊比對（case-insensitive 子字串）
  const filteredPool = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tagPool;
    return tagPool.filter((t) => t.toLowerCase().includes(q));
  }, [tagPool, search]);

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(selected.filter((t) => t !== tag));
  };

  return (
    <div ref={wrapRef} className="relative inline-flex items-center shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center justify-center size-[16px] cursor-pointer bg-transparent border-none p-0 m-0"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="篩選標籤"
      >
        <Filter
          size={16}
          color={isFilterActive ? "#0f6beb" : "#9CA3AF"}
          strokeWidth={2}
        />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed min-w-[260px] max-w-[360px] bg-white border border-solid rounded-[12px] flex flex-col p-[8px] gap-[8px]"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 1000,
            borderColor: "rgba(221, 221, 221, 0.55)",
            boxShadow:
              "0px 2px 2px 0px rgba(221, 221, 221, 0.32), 0px 5px 15px 0px rgba(221, 221, 221, 0.2)",
          }}
        >
          {/* 1. Search bar */}
          <div className="flex items-center gap-[6px] px-[8px] py-[6px] rounded-[8px] border border-solid border-[#dddddd]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm10 2-4.35-4.35"
                stroke="#9CA3AF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="輸入標籤名稱搜尋"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[14px] leading-[1.5] text-[#383838] placeholder:text-[#9CA3AF] font-['Noto_Sans_TC:Regular',sans-serif]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 2. 已選區：未選顯示「全部」、已選顯示帶 close button 的 chip */}
          <div className="flex flex-wrap gap-[4px] min-h-[28px] items-center px-[4px]">
            {selected.length === 0 ? (
              <span className="text-[14px] leading-[1.5] text-[#6e6e6e] font-['Noto_Sans_TC:Regular',sans-serif]">
                全部
              </span>
            ) : (
              selected.map((t) => (
                <Tag key={t} variant="blue" onRemove={() => removeTag(t)}>
                  {t}
                </Tag>
              ))
            )}
          </div>

          {/* 分隔線 */}
          <div className="h-px bg-[#eef0f3]" />

          {/* 3. 標籤列表（可滾動，多選 toggle） */}
          <ul
            role="listbox"
            aria-multiselectable="true"
            className="flex flex-col gap-[2px] max-h-[280px] overflow-y-auto"
          >
            {filteredPool.length === 0 ? (
              <li className="px-[8px] py-[12px] text-[14px] text-[#6e6e6e] text-center">
                沒有符合的標籤
              </li>
            ) : (
              filteredPool.map((tag) => {
                const active = selected.includes(tag);
                return (
                  <li key={tag} role="option" aria-selected={active} className="w-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(tag);
                      }}
                      className={`flex w-full items-center gap-[4px] min-h-[40px] p-[8px] rounded-[8px] text-[16px] leading-[1.5] text-[#383838] text-left cursor-pointer transition-colors hover:bg-[#f0f6ff] ${
                        active ? "bg-[#f0f6ff]" : "bg-white"
                      }`}
                    >
                      <span className="flex-1 min-w-0 truncate">{tag}</span>
                      {active && (
                        <Check size={20} className="shrink-0 text-[#0f6beb]" strokeWidth={2} />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}

// 說明用 info icon（與 InsightsPanel 之 InfoIcon 規格一致：20×20、#9CA3AF）
function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`block shrink-0 size-[20px] ${className}`}
      fill="none"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <g transform="translate(2 2) scale(1.125)">
        <path
          fill="#9CA3AF"
          d="M5.33333 10.6667C2.38773 10.6667 0 8.27893 0 5.33333C0 2.38773 2.38773 0 5.33333 0C8.27893 0 10.6667 2.38773 10.6667 5.33333C10.6667 8.27893 8.27893 10.6667 5.33333 10.6667ZM5.33333 9.6C6.46492 9.6 7.55017 9.15048 8.35032 8.35032C9.15048 7.55017 9.6 6.46492 9.6 5.33333C9.6 4.20174 9.15048 3.1165 8.35032 2.31634C7.55017 1.51619 6.46492 1.06667 5.33333 1.06667C4.20174 1.06667 3.1165 1.51619 2.31634 2.31634C1.51619 3.1165 1.06667 4.20174 1.06667 5.33333C1.06667 6.46492 1.51619 7.55017 2.31634 8.35032C3.1165 9.15048 4.20174 9.6 5.33333 9.6ZM4.8 2.66667H5.86667V3.73333H4.8V2.66667ZM4.8 4.8H5.86667V8H4.8V4.8Z"
        />
      </g>
    </svg>
  );
}

// hover 顯示 tooltip 的 info button（樣式與 InsightsPanel 相同：#383838 底、白字、12px、Noto Sans TC、8px 圓角）
function InfoIconWithTooltip({ tooltip }: { tooltip: string }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (visible && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [visible]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="shrink-0 cursor-pointer bg-transparent border-none p-0 m-0 leading-none inline-flex items-center self-center -translate-y-px"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={tooltip}
      >
        <InfoIcon />
      </button>
      {visible &&
        createPortal(
          <div
            className="fixed bg-[#383838] text-white text-[12px] leading-[1.5] font-['Noto_Sans_TC',sans-serif] font-normal rounded-[8px] p-[8px] pointer-events-none"
            style={{ zIndex: 9999, top: pos.top, left: pos.left, maxWidth: 320 }}
          >
            {tooltip}
          </div>,
          document.body,
        )}
    </>
  );
}

function Container6({
  sortConfig,
  onSortChange,
  platformFilter,
  onPlatformFilterChange,
  boundChannels,
  tagFilter,
  onTagFilterChange,
  tagPool,
}: {
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  platformFilter: string;
  onPlatformFilterChange: (key: string) => void;
  boundChannels: BoundChannel[];
  tagFilter: string[];
  onTagFilterChange: (tags: string[]) => void;
  tagPool: string[];
}) {
  const isActive = (field: SortField) => sortConfig.field === field;
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full border-b border-[#dddddd]">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[260px]" data-name="Table/Title-atomic">
            <div className="basis-0 flex items-center gap-[4px] font-['Noto_Sans_TC:Regular',sans-serif] grow min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <span className="leading-[1.5]">會員</span>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[180px] cursor-pointer" 
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('realName')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">姓名</p>
            </div>
            <SortingIcon active={isActive('realName')} order={sortConfig.order} />
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          {/* 標籤欄位表頭：右側 filter button 取代原排序 icon，採與「平臺」欄位相同的 dropdown 樣式（多選 + 搜尋 + 已選 chips） */}
          <div
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[260px]"
            data-name="Table/Title-atomic"
          >
            <span className="font-['Noto_Sans_TC:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">標籤</span>
            <InfoIconWithTooltip tooltip="依據用戶在訊息或按鈕上的互動行為自動生成，或是自行設定" />
            <TagFilterDropdown
              selected={tagFilter}
              onChange={onTagFilterChange}
              tagPool={tagPool}
            />
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div
            className="hidden box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[140px] cursor-pointer"
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('phone')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">手機號碼</p>
            </div>
            <SortingIcon active={isActive('phone')} order={sortConfig.order} />
          </div>
          <div className="hidden h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div
            className="hidden box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[200px] cursor-pointer"
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('email')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">Email</p>
            </div>
            <SortingIcon active={isActive('email')} order={sortConfig.order} />
          </div>
          <div className="hidden h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          {/* 平臺欄位表頭：右側 filter icon button 與「最近聊天時間」的 sort icon 規格一致（16×16、gap 4px） */}
          <div
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[200px]"
            data-name="Table/Title-atomic"
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">平臺</p>
            </div>
            <PlatformFilterDropdown
              selected={platformFilter}
              onChange={onPlatformFilterChange}
              boundChannels={boundChannels}
            />
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-[160px] relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div
                className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full min-w-[160px] cursor-pointer"
                onClick={() => onSortChange('lastChatTime')}
              >
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">最近聊天時間</p>
                </div>
                <SortingIcon active={isActive('lastChatTime')} order={sortConfig.order} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Icons8Account() {
  return (
    <div className="absolute left-1/2 size-[18.667px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="icons8-account 1">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="icons8-account 1">
          <path d={svgPaths.p17f8c200} fill="var(--fill-0, #383838)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="basis-0 bg-[#edf0f8] content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full">
      <div className="relative shrink-0 size-[28px]" data-name="Avatar">
        <Icons8Account />
      </div>
    </div>
  );
}

function Avatar({ avatarUrl, altText }: { avatarUrl?: string; altText?: string }) {
  const [imageError, setImageError] = useState(false);

  // 有 LINE 頭像且未載入失敗
  if (avatarUrl && !imageError) {
    return (
      <div className="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] overflow-clip rounded-full size-[60px]">
        <img
          src={avatarUrl}
          alt={altText || '會員頭像'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // 無頭像或載入失敗時顯示預設圖標
  return (
    <div className="absolute bg-[#f6f9fd] content-stretch flex flex-col items-center left-1/2 overflow-clip rounded-[60px] size-[60px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Avatar">
      <Frame1 />
    </div>
  );
}

// Dynamic Tags Component
function MemberTags({ member }: { member: DisplayMember }) {
  // 顯示最多 6 個標籤
  const allDisplayTags = (member.tags || []).slice(0, 6);

  // 如果沒有任何標籤，顯示 "-"
  if (allDisplayTags.length === 0) {
    return (
      <div className="box-border flex flex-wrap gap-[4px] items-center justify-start px-[12px] py-0 relative shrink-0 w-[260px]" data-name="Table/List-atomic">
        <p className="text-[14px] text-[#6e6e6e] leading-[1.5]">-</p>
      </div>
    );
  }

  return (
    <div className="box-border flex flex-wrap gap-[4px] items-center justify-start px-[12px] py-0 relative shrink-0 w-[260px] max-w-[260px]" data-name="Table/List-atomic">
      {allDisplayTags.map((tag, index) => (
        <div key={index} className="bg-[#f0f6ff] box-border flex gap-[2px] items-center justify-center max-w-[80px] p-[4px] rounded-[8px]" data-name="Tag">
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] leading-[1.5] text-[#0f6beb] text-[16px] text-center truncate">{tag}</p>
        </div>
      ))}
    </div>
  );
}

function MessageIcon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="mynaui:message-solid">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="mynaui:message-solid">
          <path d={svgPaths.pc989200} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

// 渠道圖標組件（使用統一組件）
function ChannelIcon({ channel, channelName }: { channel: ChannelType; channelName?: string | null }) {
  // 顯示渠道名稱，如果沒有則使用預設名稱
  const displayName = channelName || (channel === 'LINE' ? 'LINE' : channel === 'Facebook' ? 'FB' : 'Web Chat');

  // LINE 和 Facebook 使用統一組件，Webchat 使用「自動回應 chat-bot」icon（與左側選單一致）
  if (channel === 'LINE' || channel === 'Facebook') {
    return (
      <div className="flex items-center gap-[8px] min-w-0 w-full overflow-hidden">
        <CommonChannelIcon channel={channel} size={20} />
        <span className="text-[14px] text-[#383838] truncate flex-1 min-w-0" title={displayName}>{displayName}</span>
      </div>
    );
  }

  // Webchat 使用左側選單「自動回應」同款 icon（chat bubble + 星星）
  return (
    <div className="flex items-center gap-[8px] min-w-0 w-full overflow-hidden">
      <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 20 20">
        <path fill="#6E6E6E" d="M10.002 3.3334C8.7996 3.3334 7.59712 3.38045 6.40337 3.47337C4.88253 3.5917 3.59972 4.5209 2.97889 5.8334H2.50037C2.04037 5.8334 1.66704 6.20673 1.66704 6.66673V8.3334C1.66704 8.7934 2.04037 9.16673 2.50037 9.16673H2.502C2.502 9.8259 2.53386 10.4844 2.59803 11.1394C2.79719 13.1386 4.39995 14.7034 6.40662 14.8601C7.60162 14.9526 8.80609 15.0001 10.0053 15.0001C10.5719 15.0001 11.1355 14.99 11.698 14.9691C12.158 14.9516 12.5154 14.5649 12.4987 14.1049C12.4821 13.6449 12.0919 13.2758 11.6361 13.3041C9.94695 13.3641 8.23183 13.3291 6.53683 13.1983C5.336 13.105 4.37572 12.17 4.25656 10.975C4.13739 9.77417 4.13818 8.55683 4.25818 7.35683C4.37735 6.16183 5.33441 5.22849 6.53357 5.13515C8.83691 4.95515 11.1687 4.95515 13.472 5.13515C14.6479 5.22599 15.6234 6.16837 15.7409 7.32754C15.7768 7.67504 15.8016 8.0225 15.8174 8.37083C15.8383 8.82417 16.2228 9.16851 16.6687 9.16185V9.16673H17.502C17.962 9.16673 18.3353 8.7934 18.3353 8.3334V6.66673C18.3345 6.20673 17.9604 5.8334 17.5004 5.8334H17.0267C16.4101 4.52256 15.1256 3.5917 13.6006 3.47337C12.4073 3.38045 11.2044 3.3334 10.002 3.3334ZM10.0004 6.66673C9.38735 6.66673 8.77451 6.68226 8.16118 6.71393C6.86451 6.78143 5.83787 7.84561 5.8337 9.14394V9.18952C5.83787 10.4879 6.86451 11.5504 8.16118 11.6179C9.38784 11.6812 10.6146 11.6812 11.8396 11.6179C13.1362 11.5504 14.1629 10.4879 14.167 9.18952V9.14394C14.1629 7.84561 13.1362 6.78143 11.8396 6.71393C11.2266 6.68226 10.6134 6.66673 10.0004 6.66673ZM8.3337 8.3334C8.7937 8.3334 9.16704 8.70673 9.16704 9.16673C9.16704 9.62673 8.7937 10.0001 8.3337 10.0001C7.8737 10.0001 7.50037 9.62673 7.50037 9.16673C7.50037 8.70673 7.8737 8.3334 8.3337 8.3334ZM11.667 8.3334C12.127 8.3334 12.5004 8.70673 12.5004 9.16673C12.5004 9.62673 12.127 10.0001 11.667 10.0001C11.207 10.0001 10.8337 9.62673 10.8337 9.16673C10.8337 8.70673 11.207 8.3334 11.667 8.3334ZM15.8337 10.0001C15.7695 10.0001 15.7057 10.0459 15.6791 10.1384C15.0007 12.4976 14.502 12.7524 13.4411 13.1658C13.2978 13.2216 13.2978 13.442 13.4411 13.4978C14.5011 13.9111 15.0007 14.1643 15.6791 16.5235C15.7324 16.7085 15.935 16.7085 15.9883 16.5235C16.6667 14.1643 17.1654 13.9111 18.2263 13.4978C18.3696 13.442 18.3696 13.2216 18.2263 13.1658C17.1663 12.7524 16.6667 12.4976 15.9883 10.1384C15.9617 10.0459 15.8979 10.0001 15.8337 10.0001Z"/>
      </svg>
      <span className="text-[14px] text-[#383838] truncate flex-1 min-w-0" title={displayName}>{displayName}</span>
    </div>
  );
}

// Dynamic Member Row Component
function MemberRow({ member, isLast, onOpenChat, onViewDetail }: { member: DisplayMember; isLast?: boolean; onOpenChat?: (member: DisplayMember) => void; onViewDetail?: (member: DisplayMember) => void }) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleRowClick = () => {
    // 點擊行直接開啟聊天室
    onOpenChat?.(member);
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => {
    setIsPressed(false);
    setIsHovered(false);
  };
  const handleMouseEnter = () => setIsHovered(true);

  // 計算未回覆時間顯示
  const unansweredTimeText = member.isUnanswered ? formatUnansweredTime(member.unansweredSince) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className={`relative shrink-0 w-full transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f6beb]/30 ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : 'border-b border-[#dddddd]'}`}
      data-name="Container"
      style={{ backgroundColor: isPressed || isHovered ? '#F8FAFC' : 'white' }}
    >
      {/* 未回覆藍點指示器 */}
      {member.isUnanswered && (
        <div
          style={{
            position: 'absolute',
            left: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#0F6BEB',
            zIndex: 10,
          }}
          data-name="Unanswered Indicator"
        />
      )}
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <div className="flex items-center relative shrink-0 w-[260px]" data-name="Container">
            <div className="bg-white relative rounded-full shrink-0 size-[68px] ml-[8px]" data-name="Avatar">
              <Avatar avatarUrl={member.avatar} altText={member.displayName || '會員頭像'} />
            </div>
            <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex flex-col items-start justify-center px-[12px] py-0 relative w-full">
                  {/* 用戶名稱 - hover/press 時變藍色 */}
                  <p className={`font-['Noto_Sans_TC:Regular',sans-serif] text-[14px] leading-[1.5] transition-colors ${isPressed || isHovered ? 'text-[#0F6BEB]' : 'text-[#383838]'}`}>
                    {member.displayName || '未命名會員'}
                  </p>
                  {/* 未回覆時間顯示 */}
                  {unansweredTimeText && (
                    <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[12px] leading-[1.5] text-[#6E6E6E] mt-[4px]">
                      {unansweredTimeText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">{member.realName || '-'}</p>
            </div>
          </div>
          <MemberTags member={member} />
          <div className="hidden box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] w-[90px]">
              <p className="leading-[1.5]">{member.phone || '-'}</p>
            </div>
          </div>
          <div className="hidden box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[200px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">{member.email || '-'}</p>
            </div>
          </div>
          {/* 平臺欄位內容 */}
          <div className="box-border flex items-center justify-start px-[12px] py-0 relative shrink-0 w-[200px]" data-name="Table/List-atomic">
            <ChannelIcon channel={member.channel} channelName={member.channelName} />
          </div>
          {/* 最近聊天時間欄位內容 */}
          <div className="box-border flex items-center justify-start px-[12px] py-0 relative shrink-0 min-w-[160px] grow" data-name="Table/List-atomic">
            <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[#383838] text-[14px] leading-[1.5] whitespace-nowrap">
              {formatMemberDateTime(getLatestMemberChatTimestamp(member)) || '-'}
            </p>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat?.(member);
            }}
            className="content-stretch flex items-center justify-center min-h-[28px] min-w-[28px] relative rounded-[8px] shrink-0 size-[28px] cursor-pointer hover:bg-[#f0f6ff] transition-colors"
            data-name="Icon Button"
          >
            <MessageIcon />
          </div>
          <TextIconButton
            text="詳細"
            icon={<ArrowRightIcon color="#0F6BEB" />}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail?.(member);
            }}
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
}

function Table8Columns3Actions({
  members,
  sortConfig,
  onSortChange,
  onOpenChat,
  onViewDetail,
  platformFilter,
  onPlatformFilterChange,
  boundChannels,
  tagFilter,
  onTagFilterChange,
  tagPool,
}: {
  members: DisplayMember[];
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  onOpenChat?: (member: DisplayMember) => void;
  onViewDetail?: (member: DisplayMember) => void;
  platformFilter: string;
  onPlatformFilterChange: (key: string) => void;
  boundChannels: BoundChannel[];
  tagFilter: string[];
  onTagFilterChange: (tags: string[]) => void;
  tagPool: string[];
}) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Table/8 Columns+3 Actions">
      {/* 外層容器 - 水平滾動 */}
      <div className="bg-white rounded-[16px] w-full overflow-x-auto table-scroll">
        {/* 內層容器 - 最小寬度確保欄位對齊 */}
        <div className="min-w-[1160px]">
          {/* 表頭 - 固定在滾動區域外 */}
          <Container6
            sortConfig={sortConfig}
            onSortChange={onSortChange}
            platformFilter={platformFilter}
            onPlatformFilterChange={onPlatformFilterChange}
            boundChannels={boundChannels}
            tagFilter={tagFilter}
            onTagFilterChange={onTagFilterChange}
            tagPool={tagPool}
          />

          {/* 垂直滾動容器 - 只有資料列滾動 */}
          <div className="max-h-[600px] overflow-y-auto table-scroll">
            {members.map((member, index) => (
              <MemberRow
                key={member.id}
                member={member}
                isLast={index === members.length - 1}
                onOpenChat={onOpenChat}
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function MainContent({
  searchValue,
  onSearchChange,
  onSearch,
  onClearSearch,
  onClearAll,
  filteredMembers,
  sortConfig,
  onSortChange,
  onAddMember,
  onOpenChat,
  onViewDetail,
  isLoading,
  error,
  onDownloadConversations,
  platformFilter,
  onPlatformFilterChange,
  boundChannels,
  tagFilter,
  onTagFilterChange,
  tagPool,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onClearAll: () => void;
  filteredMembers: DisplayMember[];
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  onAddMember?: () => void;
  onOpenChat?: (member: DisplayMember) => void;
  onViewDetail?: (member: DisplayMember) => void;
  isLoading: boolean;
  error: string | null;
  onDownloadConversations: () => void;
  platformFilter: string;
  onPlatformFilterChange: (key: string) => void;
  boundChannels: BoundChannel[];
  tagFilter: string[];
  onTagFilterChange: (tags: string[]) => void;
  tagPool: string[];
}) {
  return (
    <div className="relative shrink-0 w-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start relative w-full">
          {/* Search and Add Button */}
          <div className="px-[40px] pb-[16px] w-full">
            <Container2
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              onSearch={onSearch}
              onClearSearch={onClearSearch}
              onClearAll={onClearAll}
              onAddMember={onAddMember}
              onDownloadConversations={onDownloadConversations}
            />
          </div>

          {/* 計數欄位（已移除 全部/會員/非會員 toggle，身份篩選改由「平臺」處理） */}
          <div className="px-[40px] pb-[12px] w-full">
            <Container5
              count={filteredMembers.length}
              platformFilter={platformFilter}
              boundChannels={boundChannels}
            />
          </div>

          {/* Table */}
          <div className="px-[40px] pb-[40px] w-full">
            {isLoading ? (
              <div className="flex h-[240px] items-center justify-center rounded-[16px] border border-dashed border-[#dddddd] bg-white text-[#6e6e6e]">
                <div className="flex flex-col items-center gap-2 text-sm">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0f6beb] border-r-transparent" />
                  <span>資料載入中...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-[240px] items-center justify-center rounded-[16px] border border-dashed border-red-200 bg-white text-red-500">
                {error}
              </div>
            ) : filteredMembers.length > 0 ? (
              <Table8Columns3Actions
                members={filteredMembers}
                sortConfig={sortConfig}
                onSortChange={onSortChange}
                onOpenChat={onOpenChat}
                onViewDetail={onViewDetail}
                platformFilter={platformFilter}
                onPlatformFilterChange={onPlatformFilterChange}
                boundChannels={boundChannels}
                tagFilter={tagFilter}
                onTagFilterChange={onTagFilterChange}
                tagPool={tagPool}
              />
            ) : (
              <div className="flex h-[240px] items-center justify-center rounded-[16px] border border-dashed border-[#dddddd] bg-white text-[#6e6e6e]">
                尚無會員資料
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MainContainer({
  onAddMember,
  onOpenChat,
  onViewDetail,
  initialTagFilter,
  initialPlatformChannel,
}: MemberMainContainerProps = {}) {
  const { displayMembers, isLoading, error } = useMembers();
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearchValue, setAppliedSearchValue] = useState('');
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'lastChatTime',
    order: 'desc',
  });

  // 平臺篩選：'all' = 所有平臺；其餘為 `${channel}|${channelName}` 對應某個已綁定帳號
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  // 從基本設定（LINE / FB）API 取得的已綁定帳號
  const [apiBoundChannels, setApiBoundChannels] = useState<BoundChannel[]>([]);

  // 標籤篩選：多選，OR 語意（會員標籤命中任一即顯示）
  const [tagFilter, setTagFilter] = useState<string[]>(initialTagFilter ?? []);
  // 標籤池：合併 memberTags + interactionTags + conversionTags 後去重排序
  const [tagPool, setTagPool] = useState<string[]>([]);

  // 載入 LINE / FB 已綁定帳號（資料來源同基本設定頁）
  // Webchat 沒有獨立綁定設定 API，於下方 useMemo 從會員資料反推
  useEffect(() => {
    let cancelled = false;

    async function loadBoundChannels() {
      const list: BoundChannel[] = [];

      // LINE：取得目前綁定的官方帳號
      try {
        const res = await apiGet('/api/v1/line_channels/current');
        if (res.ok) {
          const data = await res.json();
          if (data?.channel_id) {
            const name = data.channel_name || 'LINE 官方帳號';
            list.push({
              key: `LINE|${name}`,
              channel: 'LINE',
              channelName: name,
              label: `LINE｜${name}`,
            });
          }
        }
      } catch (err) {
        console.error('[MemberList] 取得 LINE 綁定帳號失敗:', err);
      }

      // Facebook：取得本地 DB 已綁定的粉專列表
      try {
        const res = await apiGet('/api/v1/fb_channels');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const ch of data) {
              const name = ch.channel_name || 'Facebook 粉專';
              list.push({
                key: `Facebook|${name}`,
                channel: 'Facebook',
                channelName: name,
                label: `Facebook｜${name}`,
              });
            }
          }
        }
      } catch (err) {
        console.error('[MemberList] 取得 FB 綁定帳號失敗:', err);
      }

      if (!cancelled) setApiBoundChannels(list);
    }

    loadBoundChannels();
    return () => {
      cancelled = true;
    };
  }, []);

  // 拉標籤池：合併會員 + 互動 + 轉單三類後去重排序
  useEffect(() => {
    let cancelled = false;
    async function loadTagPool() {
      try {
        const res = await apiGet('/api/v1/tags/available-options');
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data ?? {};
        const merged = Array.from(
          new Set<string>([
            ...(data.memberTags ?? []),
            ...(data.interactionTags ?? []),
            ...(data.conversionTags ?? []),
          ])
        )
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        if (!cancelled) setTagPool(merged);
      } catch (err) {
        console.error('[MemberList] 取得標籤池失敗:', err);
      }
    }
    loadTagPool();
    return () => {
      cancelled = true;
    };
  }, []);

  // 合併 API 綁定帳號 + 從會員資料反推的 Webchat 站點
  const boundChannels = useMemo<BoundChannel[]>(() => {
    const list = [...apiBoundChannels];
    const seen = new Set(list.map((c) => c.key));
    for (const m of displayMembers) {
      if (m.channel !== 'Webchat') continue;
      const name = m.channelName || 'Web Chat';
      const key = `Webchat|${name}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          key,
          channel: 'Webchat',
          channelName: name,
          label: `官網｜${name}`,
        });
      }
    }
    return list;
  }, [apiBoundChannels, displayMembers]);

  // 由外部帶入的初始平臺渠道：boundChannels 載入後解析成第一個符合的 key 套用一次
  const appliedInitialChannelRef = useRef(false);
  useEffect(() => {
    if (appliedInitialChannelRef.current) return;
    if (!initialPlatformChannel) return;
    if (boundChannels.length === 0) return;
    const found = boundChannels.find((c) => c.channel === initialPlatformChannel);
    if (found) {
      setPlatformFilter(found.key);
      appliedInitialChannelRef.current = true;
    }
  }, [initialPlatformChannel, boundChannels]);

  // Helper function to parse date strings
  const parseDateTime = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const timestamp = Date.parse(normalized);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  // Filter and sort display members
  const filteredMembers = useMemo(() => {
    let result = displayMembers;

    // 平臺篩選：依使用者選擇的綁定帳號 (channel + channelName) 過濾
    if (platformFilter !== 'all') {
      const sepIdx = platformFilter.indexOf('|');
      const filterChannel = sepIdx >= 0 ? platformFilter.slice(0, sepIdx) : platformFilter;
      const filterName = sepIdx >= 0 ? platformFilter.slice(sepIdx + 1) : '';
      result = result.filter(
        (m) => m.channel === filterChannel && (m.channelName || '') === filterName,
      );
    }

    // 標籤篩選（AND）：會員必須同時命中所有已選標籤才顯示
    if (tagFilter.length > 0) {
      result = result.filter((m) => {
        const memberTags = new Set(m.tags || []);
        return tagFilter.every((t) => memberTags.has(t));
      });
    }

    // Apply search filter
    if (appliedSearchValue.trim()) {
      const searchLower = appliedSearchValue.toLowerCase();
      result = result.filter((member) => {
        return (
          (member.displayName || '').toLowerCase().includes(searchLower) ||
          (member.realName || '').toLowerCase().includes(searchLower) ||
          (member.tags || []).some(tag => tag.toLowerCase().includes(searchLower)) ||
          (member.phone || '').includes(searchLower) ||
          (member.email || '').toLowerCase().includes(searchLower) ||
          member.channel.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'realName':
          comparison = (a.realName || '').localeCompare(b.realName || '');
          break;
        case 'phone':
          comparison = (a.phone || '').localeCompare(b.phone || '');
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'lastChatTime':
          comparison = parseDateTime(a.lastChatTime) - parseDateTime(b.lastChatTime);
          break;
        default:
          break;
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [displayMembers, appliedSearchValue, sortConfig, platformFilter, tagFilter]);

  const handleSearch = () => {
    setAppliedSearchValue(searchValue);
  };

  // 搜尋框內的 X：只清搜尋字串（不動排序與篩選器，使用者選的 platform/tag 應保留）
  const handleClearSearch = () => {
    setSearchValue('');
    setAppliedSearchValue('');
  };

  // 「清除全部條件」按鈕：把搜尋、排序、平臺、標籤全部 reset 回預設
  const handleClearAll = () => {
    setSearchValue('');
    setAppliedSearchValue('');
    setSortConfig({ field: 'lastChatTime', order: 'desc' });
    setPlatformFilter('all');
    setTagFilter([]);
  };

  const handleSortChange = (field: SortField) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          order: prev.order === 'desc' ? 'asc' : 'desc',
        };
      }
      const defaultOrder: SortOrder = field === 'lastChatTime' ? 'desc' : 'asc';
      return { field, order: defaultOrder };
    });
  };

  return (
    <div className="bg-slate-50 content-stretch flex flex-col items-start relative size-full" data-name="Main Container">
      {/* Breadcrumb, Title and Description */}
      <PageHeaderWithBreadcrumb
        breadcrumbItems={[
          { label: '會員管理', active: true }
        ]}
        title="會員管理"
        description="管理會員資料與一對一訊息，查看互動內容與紀錄"
      />
      
      <MainContent
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        onClearAll={handleClearAll}
        filteredMembers={filteredMembers}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        onAddMember={onAddMember}
        onOpenChat={onOpenChat}
        onViewDetail={onViewDetail}
        isLoading={isLoading}
        error={error}
        onDownloadConversations={() => setDownloadModalOpen(true)}
        platformFilter={platformFilter}
        onPlatformFilterChange={setPlatformFilter}
        boundChannels={boundChannels}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        tagPool={tagPool}
      />
      <DownloadConversationsModal
        open={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        members={displayMembers}
        boundChannels={boundChannels}
        initialPlatformFilter={platformFilter}
      />
    </div>
  );
}
