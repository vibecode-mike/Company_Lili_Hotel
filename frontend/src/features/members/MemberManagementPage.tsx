import { useMemo, useState } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent as ShadTooltipContent,
} from '../../components/ui/tooltip';
import TooltipPanel from './TooltipContent';
import SearchBar from './SearchBar';
import svgPaths from './svgPaths';

// Member data type
export interface Member {
  id: string;
  username: string; // LINE user name
  realName: string;
  tags: string[];
  phone: string;
  email: string;
  createTime: string;
  lastChatTime: string;
}

interface MemberManagementPageProps {
  onAddMember?: () => void;
}

// Sample member data
const SAMPLE_MEMBERS: Member[] = [
  {
    id: '1',
    username: 'User Name',
    realName: 'Real Name',
    tags: ['優惠活動', '伴手禮', 'KOL'],
    phone: '0987654321',
    email: 'Chox.ox@gmail.com',
    createTime: '2025-10-02 10:40',
    lastChatTime: '2025-10-02 18:40',
  },
  {
    id: '2',
    username: 'JaneDoe88',
    realName: 'Jane Doe',
    tags: ['夏季特惠', '手工皂', 'BeautyBlogger'],
    phone: '0912345678',
    email: 'JaneDoe88@example.com',
    createTime: '2025-10-03 10:00',
    lastChatTime: '2025-10-03 10:30',
  },
  {
    id: '3',
    username: 'ChocLover',
    realName: 'John Smith',
    tags: ['聖誕促銷', '巧克力禮盒', 'Foodie'],
    phone: '0923456789',
    email: 'john.smith@example.com',
    createTime: '2025-10-04 14:20',
    lastChatTime: '2025-10-04 16:45',
  },
];

type SortField = 'realName' | 'tags' | 'phone' | 'email' | 'createTime' | 'lastChatTime';

function BreadcrumbModule() {
  return (
    <div
      className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0"
      data-name="Breadcrumb Module"
    >
      <div
        className="content-stretch flex items-center justify-center relative shrink-0"
        data-name="Breadcrumb-atomic"
      >
        <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">
          會員管理
        </p>
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="relative shrink-0 w-full" data-name="Breadcrumb">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
          <BreadcrumbModule />
        </div>
      </div>
    </div>
  );
}

function TitleTextContainer() {
  return (
    <div
      className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0"
      data-name="Title Text Container"
    >
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#383838] text-[32px] text-center text-nowrap whitespace-pre">
        會員管理
      </p>
    </div>
  );
}

function TitleWrapper() {
  return (
    <div
      className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0"
      data-name="Title Wrapper"
    >
      <TitleTextContainer />
    </div>
  );
}

function TitleContainer() {
  return (
    <div
      className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full"
      data-name="Title Container"
    >
      <TitleWrapper />
    </div>
  );
}

function DescriptionTextContainer() {
  return (
    <div
      className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0"
      data-name="Description Text Container"
    >
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[16px] text-center text-nowrap whitespace-pre">
        管理會員資料與一對一訊息，查看互動內容與紀錄
      </p>
    </div>
  );
}

function DescriptionWrapper() {
  return (
    <div
      className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0"
      data-name="Description Wrapper"
    >
      <DescriptionTextContainer />
    </div>
  );
}

function DescriptionContainer() {
  return (
    <div
      className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full"
      data-name="Description Container"
    >
      <DescriptionWrapper />
    </div>
  );
}

function HeaderContainer() {
  return (
    <div
      className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full"
      data-name="Header Container"
    >
      <TitleContainer />
      <DescriptionContainer />
    </div>
  );
}

function AddMemberButton({ onAddMember }: { onAddMember?: () => void }) {
  return (
    <div
      className="basis-0 content-stretch flex gap-[12px] grow items-center justify-end min-h-px min-w-px relative shrink-0"
      data-name="Container"
    >
      <div
        onClick={onAddMember}
        className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors"
        data-name="Button"
      >
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">
          新增會員
        </p>
      </div>
    </div>
  );
}

function FiltersRow({
  searchValue,
  onSearchChange,
  onSearch,
  onClearSearch,
  onAddMember,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onAddMember?: () => void;
}) {
  return (
    <div
      className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full"
      data-name="Container"
    >
      <SearchBar value={searchValue} onChange={onSearchChange} onSearch={onSearch} onClear={onClearSearch} />
      <AddMemberButton onAddMember={onAddMember} />
    </div>
  );
}

function MembersCount({ count }: { count: number }) {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap whitespace-pre">
        <span>{`共 ${count} `}</span>
        <span className="tracking-[-0.12px]">筆</span>
      </p>
    </div>
  );
}

function MembersCountContainer({ count }: { count: number }) {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Container">
      <MembersCount count={count} />
    </div>
  );
}

function MembersSectionHeader({
  sortBy,
  onSortChange,
}: {
  sortBy: SortField;
  onSortChange: (field: SortField) => void;
}) {
  return (
    <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full" data-name="Container">
      <div
        aria-hidden="true"
        className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]"
      />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          <div
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[260px]"
            data-name="Table/Title-atomic"
          >
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
            <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
              <div className="absolute inset-0" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                  <g id="Vector"></g>
                </svg>
              </div>
              <div
                className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]"
                data-name="Vector"
              >
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                  <path d={svgPaths.p24dcb900} fill={sortBy === 'realName' ? '#0F6BEB' : '#6E6E6E'} id="Vector" />
                </svg>
              </div>
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
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px] cursor-pointer"
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('tags')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">標籤</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="overflow-clip relative shrink-0 size-[24px] hover:opacity-70 transition-opacity cursor-help"
                  data-name="Icon"
                >
                  <div className="absolute inset-[16.667%]" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <path d={svgPaths.p2d577a80} fill="#0F6BEB" id="Vector" />
                    </svg>
                  </div>
                </div>
              </TooltipTrigger>
              <ShadTooltipContent className="p-0 border-0 shadow-lg max-w-[400px]" sideOffset={8} side="top">
                <TooltipPanel />
              </ShadTooltipContent>
            </Tooltip>
            <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
              <div className="absolute inset-0" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                  <g id="Vector"></g>
                </svg>
              </div>
              <div
                className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]"
                data-name="Vector"
              >
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                  <path d={svgPaths.p24dcb900} fill={sortBy === 'tags' ? '#0F6BEB' : '#6E6E6E'} id="Vector" />
                </svg>
              </div>
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
            onClick={() => onSortChange('phone')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">手機號碼</p>
            </div>
            <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
              <div className="absolute inset-0" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                  <g id="Vector"></g>
                </svg>
              </div>
              <div
                className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]"
                data-name="Vector"
              >
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                  <path d={svgPaths.p24dcb900} fill={sortBy === 'phone' ? '#0F6BEB' : '#6E6E6E'} id="Vector" />
                </svg>
              </div>
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
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[200px] cursor-pointer"
            data-name="Table/Title-atomic"
            onClick={() => onSortChange('email')}
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">Email</p>
            </div>
            <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
              <div className="absolute inset-0" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                  <g id="Vector"></g>
                </svg>
              </div>
              <div
                className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]"
                data-name="Vector"
              >
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                  <path d={svgPaths.p24dcb900} fill={sortBy === 'email' ? '#0F6BEB' : '#6E6E6E'} id="Vector" />
                </svg>
              </div>
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
            <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
              <div className="absolute inset-0" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                  <g id="Vector"></g>
                </svg>
              </div>
              <div
                className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]"
                data-name="Vector"
              >
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                  <path d={svgPaths.p24dcb900} fill={sortBy === 'createTime' ? '#0F6BEB' : '#6E6E6E'} id="Vector" />
                </svg>
              </div>
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
                <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
                  <div className="absolute inset-0" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                      <g id="Vector"></g>
                    </svg>
                  </div>
                  <div
                    className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]"
                    data-name="Vector"
                  >
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                      <path d={svgPaths.p24dcb900} fill={sortBy === 'lastChatTime' ? '#0F6BEB' : '#6E6E6E'} id="Vector" />
                    </svg>
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

function AvatarIcon() {
  return (
    <div className="absolute bg-[#f6f9fd] content-stretch flex flex-col items-center left-1/2 overflow-clip rounded-[60px] size-[60px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
      <div className="basis-0 bg-[#edf0f8] content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full">
        <div className="relative shrink-0 size-[28px]" data-name="Avatar">
          <div className="absolute left-1/2 size-[18.667px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="icons8-account 1">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
              <path d={svgPaths.p17f8c200} fill="#383838" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberAvatar() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[260px]" data-name="Container">
      <div className="overflow-clip relative shrink-0 size-[68px]" data-name="Avatar">
        <AvatarIcon />
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

function TagChip({ label }: { label: string }) {
  return (
    <div
      className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0"
      data-name="Tag"
    >
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">
        {label}
      </p>
    </div>
  );
}

function TagsList({ tags }: { tags: string[] }) {
  return (
    <div
      className="box-border content-center flex flex-wrap gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px]"
      data-name="Table/List-atomic"
    >
      {tags.map((tag) => (
        <TagChip key={tag} label={tag} />
      ))}
    </div>
  );
}

function MessageIcon() {
  return (
    <div className="content-stretch flex items-center justify-center min-h-[28px] min-w-[28px] relative rounded-[8px] shrink-0 size-[28px]" data-name="Icon Button">
      <div className="relative shrink-0 size-[24px]" data-name="mynaui:message-solid">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <path d={svgPaths.pc989200} fill="#0F6BEB" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function MemberRow({ member, isLast }: { member: Member; isLast: boolean }) {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Container">
      <div
        aria-hidden="true"
        className={`absolute border-[#dddddd] border-[0px_0px_${isLast ? 0 : 1}px] border-solid inset-0 pointer-events-none`}
      />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <MemberAvatar />
          <div
            className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]"
            data-name="Table/List-atomic"
          >
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">{member.realName}</p>
            </div>
          </div>
          <TagsList tags={member.tags} />
          <div
            className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]"
            data-name="Table/List-atomic"
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] w-[90px]">
              <p className="leading-[1.5]">{member.phone}</p>
            </div>
          </div>
          <div
            className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[200px]"
            data-name="Table/List-atomic"
          >
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">{member.email}</p>
            </div>
          </div>
          <div
            className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]"
            data-name="Table/List-atomic"
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">{member.createTime}</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">{member.lastChatTime}</p>
                </div>
              </div>
            </div>
          </div>
          <MessageIcon />
          <div
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0"
            data-name="Table/List-atomic"
          >
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
                          <path d={svgPaths.p1c38d100} fill="#0F6BEB" id="Vector" />
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

function MembersTable({
  members,
  sortBy,
  onSortChange,
}: {
  members: Member[];
  sortBy: SortField;
  onSortChange: (field: SortField) => void;
}) {
  return (
    <div
      className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[1510px]"
      data-name="Table/8 Columns+3 Actions"
    >
      <MembersSectionHeader sortBy={sortBy} onSortChange={onSortChange} />
      {members.map((member, index) => (
        <MemberRow key={member.id} member={member} isLast={index === members.length - 1} />
      ))}
    </div>
  );
}

function MembersContainer({
  members,
  sortBy,
  onSortChange,
}: {
  members: Member[];
  sortBy: SortField;
  onSortChange: (field: SortField) => void;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <MembersCountContainer count={members.length} />
      <MembersTable members={members} sortBy={sortBy} onSortChange={onSortChange} />
    </div>
  );
}

function MainContent({
  searchValue,
  onSearchChange,
  onSearch,
  onClearSearch,
  filteredMembers,
  sortBy,
  onSortChange,
  onAddMember,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  filteredMembers: Member[];
  sortBy: SortField;
  onSortChange: (field: SortField) => void;
  onAddMember?: () => void;
}) {
  return (
    <div className="relative shrink-0 w-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
          <HeaderContainer />
          <FiltersRow
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearch={onSearch}
            onClearSearch={onClearSearch}
            onAddMember={onAddMember}
          />
          <MembersContainer members={filteredMembers} sortBy={sortBy} onSortChange={onSortChange} />
        </div>
      </div>
    </div>
  );
}

export default function MemberManagementPage({ onAddMember }: MemberManagementPageProps = {}) {
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearchValue, setAppliedSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('lastChatTime');

  const parseDateTime = (dateStr: string): number => {
    const parts = dateStr.split(' ');
    if (parts.length !== 2) return 0;
    const [datePart, timePart] = parts;
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute).getTime();
  };

  const filteredMembers = useMemo(() => {
    let result = SAMPLE_MEMBERS;

    if (appliedSearchValue.trim()) {
      const searchLower = appliedSearchValue.toLowerCase();
      result = result.filter((member) => {
        return (
          member.username.toLowerCase().includes(searchLower) ||
          member.realName.toLowerCase().includes(searchLower) ||
          member.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          member.phone.includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower)
        );
      });
    }

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'realName':
          return a.realName.localeCompare(b.realName);
        case 'tags':
          return (a.tags[0] || '').localeCompare(b.tags[0] || '');
        case 'phone':
          return a.phone.localeCompare(b.phone);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'createTime':
          return parseDateTime(b.createTime) - parseDateTime(a.createTime);
        case 'lastChatTime':
          return parseDateTime(b.lastChatTime) - parseDateTime(a.lastChatTime);
        default:
          return 0;
      }
    });

    return sorted;
  }, [appliedSearchValue, sortBy]);

  const handleSearch = () => {
    setAppliedSearchValue(searchValue);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setAppliedSearchValue('');
    setSortBy('lastChatTime');
  };

  const handleSortChange = (field: SortField) => {
    setSortBy(field);
  };

  return (
    <div className="bg-slate-50 content-stretch flex flex-col items-start relative size-full" data-name="Main Container">
      <Breadcrumb />
      <MainContent
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        filteredMembers={filteredMembers}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onAddMember={onAddMember}
      />
    </div>
  );
}

