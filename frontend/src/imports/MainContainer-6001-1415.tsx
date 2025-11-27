import { useState, useMemo } from "react";
import svgPaths from "./svg-wbwsye31ry";
import { SearchContainer } from "../components/common/SearchContainers";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";
import TooltipComponent from "./Tooltip";
import { PageHeaderWithBreadcrumb } from "../components/common/Breadcrumb";
import { TextIconButton, ArrowRightIcon, Tag } from "../components/common";
import { useMembers } from "../contexts/MembersContext";
import { formatMemberDateTime, getLatestMemberChatTimestamp } from "../utils/memberTime";

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

// 使用共享的 Member 类型
export type { Member } from "../types/member";
import type { Member } from "../types/member";

interface MemberMainContainerProps {
  onAddMember?: () => void;
  onOpenChat?: (member: Member) => void;
  onViewDetail?: (member: Member) => void;
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

function Container3({ count }: { count: number }) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-name="Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px]">
        共 {count} 筆
      </p>
    </div>
  );
}

function Container4({ count }: { count: number }) {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Container">
      <Container3 count={count} />
    </div>
  );
}

function Container5({ count }: { count: number }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Container4 count={count} />
    </div>
  );
}

type SortField = 'realName' | 'tags' | 'phone' | 'email' | 'createTime' | 'lastChatTime';
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
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[140px] cursor-pointer" 
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('phone')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">手機號碼</p>
            </div>
            <SortingIcon active={isActive('phone')} order={sortConfig.order} />
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[200px] cursor-pointer" 
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('email')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">Email</p>
            </div>
            <SortingIcon active={isActive('email')} order={sortConfig.order} />
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
          <div 
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[140px] cursor-pointer" 
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('createTime')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">建立時間</p>
            </div>
            <SortingIcon active={isActive('createTime')} order={sortConfig.order} />
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
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div 
                className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full cursor-pointer"
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

function Container7() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[260px]" data-name="Container">
      <div className="overflow-clip relative shrink-0 size-[68px]" data-name="Avatar">
        <Avatar />
      </div>
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">User Name</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableListAtomic() {
  return (
    <div className="box-border content-center flex flex-wrap gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
      <Tag variant="blue">優惠活動</Tag>
      <Tag variant="blue">伴手禮</Tag>
      <Tag variant="blue">KOL</Tag>
      <Tag variant="blue">優惠活動</Tag>
      <Tag variant="blue">伴手禮</Tag>
      <Tag variant="blue">KOL</Tag>
    </div>
  );
}

// Dynamic Tags Component
function MemberTags({ member }: { member: Member }) {
  // 取會員標籤最新的3個
  const displayMemberTags = (member.memberTags || []).slice(0, 3);
  // 取互動標籤最新的3個
  const displayInteractionTags = (member.interactionTags || []).slice(0, 3);
  // 合併顯示
  const allDisplayTags = [...displayMemberTags, ...displayInteractionTags];

  // 如果沒有任何標籤，顯示 "-"
  if (allDisplayTags.length === 0) {
    return (
      <div className="box-border content-center flex flex-wrap gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
        <p className="text-[14px] text-[#6e6e6e] leading-[1.5]">-</p>
      </div>
    );
  }

  return (
    <div className="box-border content-center flex flex-wrap gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
      {allDisplayTags.map((tag, index) => (
        <div key={index} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">{tag}</p>
        </div>
      ))}
    </div>
  );
}

function MynauiMessageSolid() {
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

// Dynamic Member Row Component
function MemberRow({ member, isLast, onOpenChat, onViewDetail }: { member: Member; isLast?: boolean; onOpenChat?: (member: Member) => void; onViewDetail?: (member: Member) => void }) {
  const [isPressed, setIsPressed] = useState(false);

  const handleRowClick = () => {
    onViewDetail?.(member);
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className={`relative shrink-0 w-full transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f6beb]/30 ${isLast ? 'rounded-bl-[16px] rounded-br-[16px]' : 'border-b border-[#dddddd]'}`}
      data-name="Container"
      style={{ backgroundColor: isPressed ? '#edf3ff' : 'white' }}
    >
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <div className="content-stretch flex items-center relative shrink-0 w-[260px]" data-name="Container">
            <div className="bg-white relative rounded-full shrink-0 size-[68px]" data-name="Avatar">
              <Avatar avatarUrl={member.lineAvatar} altText={member.username || '會員頭像'} />
            </div>
            <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                  <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                    <p className="leading-[1.5]">{member.username || '未命名會員'}</p>
                  </div>
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
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] w-[90px]">
              <p className="leading-[1.5]">{member.phone || '-'}</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[200px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">{member.email || '-'}</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">{formatMemberDateTime(member.createTime) || '-'}</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">{formatMemberDateTime(getLatestMemberChatTimestamp(member)) || '-'}</p>
                </div>
              </div>
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat?.(member);
            }}
            className="content-stretch flex items-center justify-center min-h-[28px] min-w-[28px] relative rounded-[8px] shrink-0 size-[28px] cursor-pointer hover:bg-[#f0f6ff] transition-colors" 
            data-name="Icon Button"
          >
            <MynauiMessageSolid />
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

function Container8() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <Container7 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">Real Name</p>
            </div>
          </div>
          <TableListAtomic />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] w-[90px]">
              <p className="leading-[1.5]">0987654321</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[200px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">Chox.ox@gmail.com</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">2025-10-02 10:40</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">2025-10-02 18:40</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center min-h-[28px] min-w-[28px] relative rounded-[8px] shrink-0 size-[28px]" data-name="Icon Button">
            <MynauiMessageSolid />
          </div>
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">詳細</p>
            </div>
            <div className="flex items-center justify-center relative shrink-0">
              <div className="flex-none rotate-[180deg]">
                <div className="overflow-clip relative size-[16px]" data-name="Arrow">
                  <div className="absolute flex inset-[23.56%_36.29%_29.88%_36.27%] items-center justify-center">
                    <div className="flex-none h-[4.39px] rotate-[90deg] w-[7.45px]">
                      <div className="relative size-full" data-name="Vector">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 5">
                          <path d={svgPaths.p1c38d100} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Icons8Account1() {
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

function Frame2() {
  return (
    <div className="basis-0 bg-[#edf0f8] content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full">
      <div className="relative shrink-0 size-[28px]" data-name="Avatar">
        <Icons8Account1 />
      </div>
    </div>
  );
}

function Avatar1() {
  return (
    <div className="absolute bg-[#f6f9fd] content-stretch flex flex-col items-center left-1/2 overflow-clip rounded-[60px] size-[60px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Avatar">
      <Frame2 />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[260px]" data-name="Container">
      <div className="overflow-clip relative shrink-0 size-[68px]" data-name="Avatar">
        <Avatar1 />
      </div>
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">JaneDoe88</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableListAtomic1() {
  return (
    <div className="box-border content-center flex flex-wrap gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">夏季特惠</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">手工皂</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">BeautyBlogger</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">夏季特惠</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">手工皂</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">BeautyBlogger</p>
      </div>
    </div>
  );
}

function MynauiMessageSolid1() {
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

function Container10() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <Container9 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">Jane Doe</p>
            </div>
          </div>
          <TableListAtomic1 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] w-[90px]">
              <p className="leading-[1.5]">0912345678</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[200px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">JaneDoe88@example.com</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">2025-10-03 10:00</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">2025-10-03 10:30</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center min-h-[28px] min-w-[28px] relative rounded-[8px] shrink-0 size-[28px]" data-name="Icon Button">
            <MynauiMessageSolid1 />
          </div>
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">詳情</p>
            </div>
            <div className="flex items-center justify-center relative shrink-0">
              <div className="flex-none rotate-[180deg]">
                <div className="overflow-clip relative size-[16px]" data-name="Arrow">
                  <div className="absolute flex inset-[23.56%_36.29%_29.88%_36.27%] items-center justify-center">
                    <div className="flex-none h-[4.39px] rotate-[90deg] w-[7.45px]">
                      <div className="relative size-full" data-name="Vector">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 5">
                          <path d={svgPaths.p1c38d100} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Icons8Account2() {
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

function Frame3() {
  return (
    <div className="basis-0 bg-[#edf0f8] content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full">
      <div className="relative shrink-0 size-[28px]" data-name="Avatar">
        <Icons8Account2 />
      </div>
    </div>
  );
}

function Avatar2() {
  return (
    <div className="absolute bg-[#f6f9fd] content-stretch flex flex-col items-center left-1/2 overflow-clip rounded-[60px] size-[60px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Avatar">
      <Frame3 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[260px]" data-name="Container">
      <div className="overflow-clip relative shrink-0 size-[68px]" data-name="Avatar">
        <Avatar2 />
      </div>
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">MarkSmith</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableListAtomic2() {
  return (
    <div className="box-border content-center flex flex-wrap gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">聖誕促銷</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">巧克力禮盒</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">Foodie</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">聖誕促銷</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">巧克力禮盒</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">Foodie</p>
      </div>
    </div>
  );
}

function MynauiMessageSolid2() {
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

function Container12() {
  return (
    <div className="bg-white relative rounded-bl-[16px] rounded-br-[16px] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <Container11 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">Mark Smith</p>
            </div>
          </div>
          <TableListAtomic2 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] w-[90px]">
              <p className="leading-[1.5]">0923456789</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[200px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">MarkSmith@example.com</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">2025-10-04 15:30</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">2025-10-04 18:30</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center min-h-[28px] min-w-[28px] relative rounded-[8px] shrink-0 size-[28px]" data-name="Icon Button">
            <MynauiMessageSolid2 />
          </div>
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">詳細</p>
            </div>
            <div className="flex items-center justify-center relative shrink-0">
              <div className="flex-none rotate-[180deg]">
                <div className="overflow-clip relative size-[16px]" data-name="Arrow">
                  <div className="absolute flex inset-[23.56%_36.29%_29.88%_36.27%] items-center justify-center">
                    <div className="flex-none h-[4.39px] rotate-[90deg] w-[7.45px]">
                      <div className="relative size-full" data-name="Vector">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 5">
                          <path d={svgPaths.p1c38d100} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
  members: Member[]; 
  sortConfig: SortConfig; 
  onSortChange: (field: SortField) => void;
  onOpenChat?: (member: Member) => void;
  onViewDetail?: (member: Member) => void;
}) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Table/8 Columns+3 Actions">
      {/* Table Container with Border - Fixed height container with horizontal scroll */}
      <div className="bg-white rounded-[16px] w-full flex flex-col max-h-[600px] overflow-x-auto table-scroll">
        {/* Table Header - Fixed */}
        <div className="relative shrink-0 w-[1510px]">
          <Container6 sortConfig={sortConfig} onSortChange={onSortChange} />
        </div>
        
        {/* Table Body - Scrollable Container */}
        <div className="w-[1510px] flex-1 overflow-y-auto table-scroll">
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
  );
}

function Container13({ 
  members, 
  sortConfig, 
  onSortChange,
  onOpenChat,
  onViewDetail
}: { 
  members: Member[]; 
  sortConfig: SortConfig; 
  onSortChange: (field: SortField) => void;
  onOpenChat?: (member: Member) => void;
  onViewDetail?: (member: Member) => void;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container5 count={members.length} />
      <Table8Columns3Actions members={members} sortConfig={sortConfig} onSortChange={onSortChange} onOpenChat={onOpenChat} onViewDetail={onViewDetail} />
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
}: { 
  searchValue: string; 
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  filteredMembers: Member[];
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  onAddMember?: () => void;
  onOpenChat?: (member: Member) => void;
  onViewDetail?: (member: Member) => void;
  isLoading: boolean;
  error: string | null;
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
            <Container5 count={filteredMembers.length} />
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
  const { members, isLoading, error } = useMembers();
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

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let result = members;
    
    // Apply search filter
    if (appliedSearchValue.trim()) {
      const searchLower = appliedSearchValue.toLowerCase();
      result = result.filter((member) => {
        return (
          (member.username || '').toLowerCase().includes(searchLower) ||
          (member.realName || '').toLowerCase().includes(searchLower) ||
          (member.tags || []).some(tag => tag.toLowerCase().includes(searchLower)) ||
          (member.phone || '').includes(searchLower) ||
          (member.email || '').toLowerCase().includes(searchLower)
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
        case 'createTime':
          comparison = parseDateTime(a.createTime) - parseDateTime(b.createTime);
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
  }, [members, appliedSearchValue, sortConfig]);

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
      const defaultOrder: SortOrder = field === 'createTime' || field === 'lastChatTime' ? 'desc' : 'asc';
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
      />
    </div>
  );
}
