import { useState, useMemo } from "react";
import svgPaths from "./svg-wbwsye31ry";
import { SearchContainer } from "../components/common/SearchContainers";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";
import TooltipComponent from "./Tooltip";
import { PageHeaderWithBreadcrumb } from "../components/common/Breadcrumb";
import { TextIconButton, ArrowRightIcon, Tag } from "../components/common";
import { MemberSourceIconLarge, ChannelIcon as CommonChannelIcon } from "../components/common/icons";
import { useMembers } from "../contexts/MembersContext";
import { formatMemberDateTime, getLatestMemberChatTimestamp, formatUnansweredTime } from "../utils/memberTime";

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

function Container2({ searchValue, onSearchChange, onSearch, onClearSearch, onAddMember }: { 
  searchValue: string; 
  onSearchChange: (value: string) => void; 
  onSearch: () => void;
  onClearSearch: () => void;
  onAddMember?: () => void;
}) {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full" data-name="Container">
      <SearchContainer 
        value={searchValue}
        onChange={onSearchChange}
        onSearch={onSearch}
        onClear={onClearSearch}
      />
      <Container1 onAddMember={onAddMember} />
    </div>
  );
}

function Container3({ count, totalMembers }: { count: number; totalMembers?: number }) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-name="Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px]">
        {totalMembers !== undefined ? (
          <>共 {totalMembers} 位會員（{count} 筆渠道記錄）</>
        ) : (
          <>共 {count} 筆</>
        )}
      </p>
    </div>
  );
}

function Container4({ count, totalMembers }: { count: number; totalMembers?: number }) {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Container">
      <Container3 count={count} totalMembers={totalMembers} />
    </div>
  );
}

function Container5({ count, totalMembers }: { count: number; totalMembers?: number }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Container4 count={count} totalMembers={totalMembers} />
    </div>
  );
}

type SortField = 'realName' | 'tags' | 'phone' | 'email' | 'lastChatTime';
type SortOrder = 'asc' | 'desc';
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

function SortingIcon({ active, order }: { active: boolean; order: SortOrder }) {
  const color = active ? 'var(--fill-0, #0F6BEB)' : 'var(--fill-0, #6E6E6E)';
  return (
    <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
      <div className="absolute inset-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector"></g>
        </svg>
      </div>
      <div
        className={`absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px] ${active && order === 'asc' ? 'rotate-180' : ''}`}
        data-name="Vector"
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
          <path d={svgPaths.p24dcb900} fill={color} id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container6({ 
  sortConfig, 
  onSortChange 
}: { 
  sortConfig: SortConfig; 
  onSortChange: (field: SortField) => void;
}) {
  const isActive = (field: SortField) => sortConfig.field === field;
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full border-b border-[#dddddd]">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[260px]" data-name="Table/Title-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">會員</p>
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
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px] cursor-pointer" 
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('tags')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">標籤</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="overflow-clip relative shrink-0 size-[24px] hover:opacity-70 transition-opacity cursor-help" data-name="Icon">
                  <div className="absolute inset-[16.667%]" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                    </svg>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                className="p-0 border-0 shadow-lg max-w-[400px]" 
                sideOffset={8}
                side="top"
              >
                <TooltipComponent />
              </TooltipContent>
            </Tooltip>
            <SortingIcon active={isActive('tags')} order={sortConfig.order} />
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
          {/* 平台欄位表頭 */}
          <div
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[200px]"
            data-name="Table/Title-atomic"
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">平台</p>
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
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-[200px] relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div 
                className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full min-w-[200px] cursor-pointer"
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
      <div className="box-border flex flex-wrap gap-[4px] items-center justify-start px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
        <p className="text-[14px] text-[#6e6e6e] leading-[1.5]">-</p>
      </div>
    );
  }

  return (
    <div className="box-border flex flex-wrap gap-[4px] items-center justify-start px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
      {allDisplayTags.map((tag, index) => (
        <div key={index} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">{tag}</p>
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
  const displayName = channelName || (channel === 'LINE' ? 'LINE' : channel === 'Facebook' ? 'FB' : 'Web');

  // LINE 和 Facebook 使用統一組件，Webchat 使用內嵌 SVG
  if (channel === 'LINE' || channel === 'Facebook') {
    return (
      <div className="flex items-center gap-[8px]">
        <CommonChannelIcon channel={channel} size={20} />
        <span className="text-[14px] text-[#383838] truncate">{displayName}</span>
      </div>
    );
  }

  // Webchat 使用內嵌 SVG
  return (
    <div className="flex items-center gap-[8px]">
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#6E6E6E">
        <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.936 1.444 5.545 3.684 7.227V22l3.266-1.793c.87.24 1.792.369 2.75.369h.3c5.523 0 10-4.145 10-9.243S17.523 2 12 2z"/>
      </svg>
      <span className="text-[14px] text-[#383838] truncate">{displayName}</span>
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
          {/* 平台欄位內容 */}
          <div className="box-border flex items-center justify-start px-[12px] py-0 relative shrink-0 w-[200px]" data-name="Table/List-atomic">
            <ChannelIcon channel={member.channel} channelName={member.channelName} />
          </div>
          {/* 最近聊天時間欄位內容 */}
          <div className="box-border flex items-center justify-start px-[12px] py-0 relative shrink-0 min-w-[200px] grow" data-name="Table/List-atomic">
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
  onViewDetail
}: {
  members: DisplayMember[];
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  onOpenChat?: (member: DisplayMember) => void;
  onViewDetail?: (member: DisplayMember) => void;
}) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Table/8 Columns+3 Actions">
      {/* 外層容器 - 水平滾動 */}
      <div className="bg-white rounded-[16px] w-full overflow-x-auto table-scroll">
        {/* 內層容器 - 最小寬度確保欄位對齊 */}
        <div className="min-w-[1160px]">
          {/* 垂直滾動容器 + Sticky 表頭 */}
          <div className="max-h-[600px] overflow-y-auto table-scroll">
            {/* Table Header - Sticky */}
            <div className="sticky top-0 z-10">
              <Container6 sortConfig={sortConfig} onSortChange={onSortChange} />
            </div>

            {/* Table Body */}
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
  filteredMembers,
  sortConfig,
  onSortChange,
  onAddMember,
  onOpenChat,
  onViewDetail,
  isLoading,
  error,
  totalMembers,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  filteredMembers: DisplayMember[];
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  onAddMember?: () => void;
  onOpenChat?: (member: DisplayMember) => void;
  onViewDetail?: (member: DisplayMember) => void;
  isLoading: boolean;
  error: string | null;
  totalMembers: number;
}) {
  return (
    <div className="relative shrink-0 w-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start relative w-full">
          {/* Search and Add Button */}
          <div className="px-[40px] pb-[16px]">
            <Container2 
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              onSearch={onSearch}
              onClearSearch={onClearSearch}
              onAddMember={onAddMember}
            />
          </div>
          
          {/* Count */}
          <div className="px-[40px] pb-[12px]">
            <Container5 count={filteredMembers.length} totalMembers={totalMembers} />
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
              <Table8Columns3Actions members={filteredMembers} sortConfig={sortConfig} onSortChange={onSortChange} onOpenChat={onOpenChat} onViewDetail={onViewDetail} />
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

export default function MainContainer({ onAddMember, onOpenChat, onViewDetail }: MemberMainContainerProps = {}) {
  const { displayMembers, totalDisplayMembers, isLoading, error } = useMembers();
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearchValue, setAppliedSearchValue] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'lastChatTime',
    order: 'desc',
  });

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
        case 'tags':
          comparison = (a.tags?.[0] || '').localeCompare(b.tags?.[0] || '');
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
  }, [displayMembers, appliedSearchValue, sortConfig]);

  const handleSearch = () => {
    setAppliedSearchValue(searchValue);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setAppliedSearchValue('');
    setSortConfig({ field: 'lastChatTime', order: 'desc' }); // Reset to default sort
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
        filteredMembers={filteredMembers}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        onAddMember={onAddMember}
        onOpenChat={onOpenChat}
        onViewDetail={onViewDetail}
        isLoading={isLoading}
        error={error}
        totalMembers={totalDisplayMembers}
      />
    </div>
  );
}
