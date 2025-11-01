import { useState, useMemo } from 'react';
import svgPaths from "../imports/svg-ckckvhq9os";
import sidebarPaths from '../imports/svg-jb10q6lg6b';
import { imgGroup, imgGroup1, imgGroup2, imgGroup3, imgGroup4, imgGroup5, imgGroup6 } from "../imports/svg-zrjx6";
import InteractiveMessageTable, { type Message } from "./InteractiveMessageTable";
import AutoResponseList from "./AutoResponseList";

interface MessageListProps {
  onCreateMessage: () => void;
}

// Sample message data
const SAMPLE_MESSAGES: Message[] = [
  {
    id: '1',
    title: '雙人遊行 獨家優惠',
    tags: ['雙人床', '送禮', 'KOL'],
    platform: 'LINE',
    status: '已排程',
    sentCount: '-',
    openCount: '-',
    clickCount: '-',
    sendTime: '2026-10-02 22:47'
  },
  {
    id: '2',
    title: '雙人遊行 獨家優惠',
    tags: ['商務房', '送禮', 'KOL'],
    platform: 'LINE',
    status: '已排程',
    sentCount: '-',
    openCount: '-',
    clickCount: '-',
    sendTime: '2026-10-02 22:47'
  },
  {
    id: '3',
    title: '雙人遊行 獨家優惠',
    tags: ['商務房', 'KOL'],
    platform: 'LINE',
    status: '已排程',
    sentCount: '-',
    openCount: '-',
    clickCount: '-',
    sendTime: '2026-10-02 22:47'
  },
  {
    id: '4',
    title: '夏季特惠活動',
    tags: ['促銷', '限時'],
    platform: 'LINE',
    status: '已發送',
    sentCount: '1,234',
    openCount: '856',
    clickCount: '342',
    sendTime: '2026-09-28 10:00'
  },
  {
    id: '5',
    title: '會員專屬優惠',
    tags: ['VIP', '會員'],
    platform: 'LINE',
    status: '已發送',
    sentCount: '2,567',
    openCount: '1,823',
    clickCount: '891',
    sendTime: '2026-09-25 14:30'
  },
  {
    id: '6',
    title: '新品上市通知',
    tags: ['新品', '首發'],
    platform: 'LINE',
    status: '草稿',
    sentCount: '-',
    openCount: '-',
    clickCount: '-',
    sendTime: '-'
  }
];

// Starbit Logo Component
function StarbitLogo() {
  return (
    <div className="h-[49.333px] overflow-clip relative shrink-0 w-[148px]">
      <div className="absolute inset-[24.73%_62.3%_43%_29.83%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
          <path clipRule="evenodd" d={sidebarPaths.p7342f80} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.24%_60.47%_37.55%_28.01%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.697px_2.706px] mask-size-[11.65px_15.923px]" style={{ maskImage: `url('${imgGroup}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 22">
          <path d={sidebarPaths.p361e8400} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[26.39%_53.22%_43.6%_38.6%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 15">
          <path clipRule="evenodd" d={sidebarPaths.p1f6b2880} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[20.91%_51.39%_38.13%_36.77%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.701px] mask-size-[12.116px_14.805px]" style={{ maskImage: `url('${imgGroup1}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={sidebarPaths.pa9b4c00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.29%_44.05%_43.6%_46.53%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
          <path clipRule="evenodd" d={sidebarPaths.p3b7aeb00} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.84%_42.23%_38.17%_44.69%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.697px] mask-size-[11.658px_15.931px]" style={{ maskImage: `url('${imgGroup2}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 22">
          <path d={sidebarPaths.p33976b80} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[26.39%_34.87%_43.6%_55.91%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 15">
          <path clipRule="evenodd" d={sidebarPaths.p4a1e400} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[20.91%_33.03%_38.13%_54.09%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.708px_2.701px] mask-size-[12.116px_14.805px]" style={{ maskImage: `url('${imgGroup3}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 21">
          <path d={sidebarPaths.p8da8e700} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.29%_25.68%_43.6%_65.1%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 16">
          <path clipRule="evenodd" d={sidebarPaths.p4e25bc80} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.84%_23.86%_38.17%_63.28%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.701px_2.697px] mask-size-[11.658px_15.931px]" style={{ maskImage: `url('${imgGroup4}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 22">
          <path d={sidebarPaths.p9e8b5800} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[24.73%_15.49%_43%_75.69%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 16">
          <path clipRule="evenodd" d={sidebarPaths.p4b86600} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.24%_13.67%_37.55%_73.85%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.697px_2.706px] mask-size-[11.65px_15.923px]" style={{ maskImage: `url('${imgGroup5}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 22">
          <path d={sidebarPaths.p9acb3300} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[26.39%_6.33%_43.6%_84.46%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 15">
          <path clipRule="evenodd" d={sidebarPaths.p3993bc00} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[20.91%_4.49%_38.13%_82.63%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.708px_2.701px] mask-size-[12.116px_14.805px]" style={{ maskImage: `url('${imgGroup6}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 21">
          <path d={sidebarPaths.p9d2f2200} fill="#189AEB" />
        </svg>
      </div>
    </div>
  );
}

function BreadcrumbAtomic() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Breadcrumb-atomic">
      <p className="font-['Noto_Sans_TC:Medium',_sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">活動與訊息推播</p>
    </div>
  );
}

function BreadcrumbModule() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0" data-name="Breadcrumb Module">
      <BreadcrumbAtomic />
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
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Title Text Container">
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[32px] text-center text-nowrap whitespace-pre">活動與訊息推播</p>
    </div>
  );
}

function TitleWrapper() {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Title Wrapper">
      <TitleTextContainer />
    </div>
  );
}

function TitleContainer() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Title Container">
      <TitleWrapper />
    </div>
  );
}

function DescriptionTextContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Description Text Container">
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[16px] text-center text-nowrap whitespace-pre">建立單一圖文或多頁輪播內容，打造引人注目的品牌訊息</p>
    </div>
  );
}

function DescriptionWrapper() {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Description Wrapper">
      <DescriptionTextContainer />
    </div>
  );
}

function DescriptionContainer() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Description Container">
      <DescriptionWrapper />
    </div>
  );
}

function HeaderContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Header Container">
      <TitleContainer />
      <DescriptionContainer />
    </div>
  );
}

function IconSearch() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Icon/Search">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Icon/Search">
          <path d={svgPaths.p2bfa9080} fill="var(--fill-0, #A8A8A8)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function SearchBar({ value, onChange, onClear }: { value: string; onChange: (value: string) => void; onClear: () => void }) {
  return (
    <div className="bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 w-[292px]" data-name="Search Bar">
      <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
        <IconSearch />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="輸入搜尋"
          className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] flex-1 text-[#383838] text-[20px] bg-transparent border-none outline-none placeholder:text-[#dddddd]"
        />
      </div>
      {value && (
        <div 
          onClick={onClear}
          className="relative shrink-0 size-[24px] cursor-pointer hover:opacity-70 transition-opacity" 
          data-name="Cancel circle"
        >
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
            <g clipPath="url(#clip0_2001_2718)" id="Cancel circle">
              <g id="Vector" opacity="0.87"></g>
              <path d={svgPaths.p3cde6900} fill="var(--fill-0, #DDDDDD)" id="Vector_2" />
            </g>
            <defs>
              <clipPath id="clip0_2001_2718">
                <rect fill="white" height="24" width="24" />
              </clipPath>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
}

function ButtonReanalyze({ onClick }: { onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] p-[8px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors" 
      data-name="Button/Reanalyze"
    >
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">清除全部條件</p>
    </div>
  );
}

function Frame11({ searchValue, onSearchChange, onClearAll }: { searchValue: string; onSearchChange: (value: string) => void; onClearAll: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <SearchBar value={searchValue} onChange={onSearchChange} onClear={() => onSearchChange('')} />
      <ButtonReanalyze onClick={onClearAll} />
    </div>
  );
}

function ButtonFilledButton({ onClick }: { onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors" 
      data-name="Button/Filled Button"
    >
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立訊息</p>
    </div>
  );
}

function Frame9({ onCreateMessage }: { onCreateMessage: () => void }) {
  return (
    <div className="basis-0 content-stretch flex gap-[12px] grow items-center justify-end min-h-px min-w-px relative shrink-0">
      <ButtonFilledButton onClick={onCreateMessage} />
    </div>
  );
}

function Frame({ onCreateMessage, searchValue, onSearchChange, onClearAll }: { onCreateMessage: () => void; searchValue: string; onSearchChange: (value: string) => void; onClearAll: () => void }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full">
      <Frame11 searchValue={searchValue} onSearchChange={onSearchChange} onClearAll={onClearAll} />
      <Frame9 onCreateMessage={onCreateMessage} />
    </div>
  );
}

function ButtonFilledButton1() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">已排程 (6)</p>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      <ButtonFilledButton1 />
    </div>
  );
}

function ButtonFilledButton2() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">草稿 (2)</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <ButtonFilledButton2 />
    </div>
  );
}

function ButtonFilledButton3() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">已發送 (0)</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <ButtonFilledButton3 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <Frame14 />
      <Frame13 />
      <Frame12 />
    </div>
  );
}

function MainContent({ onCreateMessage, searchValue, onSearchChange, onClearAll, filteredMessages, onEditMessage, onViewDetails }: { 
  onCreateMessage: () => void; 
  searchValue: string; 
  onSearchChange: (value: string) => void; 
  onClearAll: () => void;
  filteredMessages: Message[];
  onEditMessage: (id: string) => void;
  onViewDetails: (id: string) => void;
}) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[24px] grow items-start min-h-px min-w-px pb-[40px] pt-[16px] px-[40px] relative shrink-0 w-full" data-name="Main Content">
      <HeaderContainer />
      <Frame onCreateMessage={onCreateMessage} searchValue={searchValue} onSearchChange={onSearchChange} onClearAll={onClearAll} />
      <Frame1 />
      <InteractiveMessageTable messages={filteredMessages} onEdit={onEditMessage} onViewDetails={onViewDetails} />
    </div>
  );
}

export default function MessageList({ onCreateMessage }: MessageListProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState<'messages' | 'autoResponse'>('messages');
  
  // Filter messages based on search value
  const filteredMessages = useMemo(() => {
    if (!searchValue.trim()) {
      return SAMPLE_MESSAGES;
    }
    
    const searchLower = searchValue.toLowerCase();
    return SAMPLE_MESSAGES.filter((message) => {
      return (
        message.title.toLowerCase().includes(searchLower) ||
        message.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        message.platform.toLowerCase().includes(searchLower) ||
        message.status.toLowerCase().includes(searchLower)
      );
    });
  }, [searchValue]);
  
  const handleClearAll = () => {
    setSearchValue('');
  };
  
  const handleEditMessage = (id: string) => {
    console.log('編輯訊息:', id);
    // TODO: Implement edit functionality
  };
  
  const handleViewDetails = (id: string) => {
    console.log('查看詳細:', id);
    // TODO: Implement view details functionality
  };

  // If on auto response page, render the AutoResponseList component
  if (currentPage === 'autoResponse') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen flex">
        {/* Sidebar */}
        <aside className={`bg-slate-100 content-stretch flex flex-col h-screen items-start fixed top-0 left-0 shrink-0 z-50 ${sidebarOpen ? 'w-[330px] lg:w-[280px] md:w-[250px]' : 'w-[72px]'} transition-all duration-300`}>
          {/* Logo & Toggle */}
          <div className="box-border flex items-center justify-between p-4 w-full">
            {sidebarOpen && (
              <div className="content-stretch flex flex-col h-[56px] items-start justify-center overflow-clip relative shrink-0 w-[148px]">
                <StarbitLogo />
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="overflow-clip relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
            >
              <svg className="block size-full" fill="none" viewBox="0 0 27 24">
                <rect height="22" rx="7" stroke="#B6C8F1" strokeWidth="2" width="24.6667" x="1" y="1" />
                <path d="M9.99992 0L9.99992 24" stroke="#B6C8F1" strokeWidth="2" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 w-full overflow-y-auto">
            {sidebarOpen && (
              <>
                {/* 群發訊息 Section */}
                <div className="box-border flex flex-col gap-1 px-4">
                  <div className="box-border flex gap-1 h-[29px] items-center p-1">
                    <svg className="shrink-0 size-[18px]" fill="none" viewBox="0 0 14 13">
                      <path d={sidebarPaths.p25432100} fill="#6E6E6E" />
                    </svg>
                    <p className="text-[14px] text-[#6e6e6e]">群發訊息</p>
                  </div>
                  <button 
                    onClick={() => setCurrentPage('messages')}
                    className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors"
                  >
                    <p className="text-[16px] text-[#383838]">活動與訊息推播</p>
                  </button>
                  <button className="bg-[#e1ebf9] box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-[#d0e0f5] transition-colors">
                    <p className="text-[16px] text-[#0f6beb]">自動回應</p>
                  </button>
                </div>

                {/* 會員 Section */}
                <div className="box-border flex flex-col gap-1 px-4 mt-5">
                  <div className="box-border flex gap-1 h-[29px] items-center p-1">
                    <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 14 14">
                      <path d={sidebarPaths.pa54d00} fill="#6E6E6E" />
                    </svg>
                    <p className="text-[14px] text-[#6e6e6e]">會員</p>
                  </div>
                  <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                    <p className="text-[16px] text-[#383838]">會員管理</p>
                  </button>
                </div>

                {/* 設定 Section */}
                <div className="box-border flex flex-col gap-1 px-4 mt-5">
                  <div className="box-border flex gap-1 h-[29px] items-center p-1">
                    <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 20 20">
                      <path d={sidebarPaths.p16734900} fill="#6E6E6E" />
                    </svg>
                    <p className="text-[14px] text-[#6e6e6e]">設定</p>
                  </div>
                  <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                    <p className="text-[16px] text-[#383838]">標籤管理</p>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="bg-slate-100 box-border border-t border-[#b6c8f1] flex flex-col items-start pb-[44px] pt-[12px] px-4 w-full">
            <div className="flex items-center gap-2 w-full">
              <div className="bg-white relative rounded-full shrink-0 size-[32px] flex items-center justify-center">
                <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                  <path d={sidebarPaths.p1c72d580} fill="#7A9FFF" />
                </svg>
              </div>
              {sidebarOpen && (
                <>
                  <p className="flex-1 text-[16px] text-[#383838]">Daisy Yang</p>
                  <button className="text-[16px] text-[#0f6beb] hover:underline">登出</button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content - Auto Response */}
        <main className={`flex-1 overflow-auto bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
          <AutoResponseList onBack={() => setCurrentPage('messages')} />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {/* Sidebar */}
      <aside className={`bg-slate-100 content-stretch flex flex-col h-screen items-start fixed top-0 left-0 shrink-0 z-50 ${sidebarOpen ? 'w-[330px] lg:w-[280px] md:w-[250px]' : 'w-[72px]'} transition-all duration-300`}>
        {/* Logo & Toggle */}
        <div className="box-border flex items-center justify-between p-4 w-full">
          {sidebarOpen && (
            <div className="content-stretch flex flex-col h-[56px] items-start justify-center overflow-clip relative shrink-0 w-[148px]">
              <StarbitLogo />
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="overflow-clip relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
          >
            <svg className="block size-full" fill="none" viewBox="0 0 27 24">
              <rect height="22" rx="7" stroke="#B6C8F1" strokeWidth="2" width="24.6667" x="1" y="1" />
              <path d="M9.99992 0L9.99992 24" stroke="#B6C8F1" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 w-full overflow-y-auto">
          {sidebarOpen && (
            <>
              {/* 群發訊息 Section */}
              <div className="box-border flex flex-col gap-1 px-4">
                <div className="box-border flex gap-1 h-[29px] items-center p-1">
                  <svg className="shrink-0 size-[18px]" fill="none" viewBox="0 0 14 13">
                    <path d={sidebarPaths.p25432100} fill="#6E6E6E" />
                  </svg>
                  <p className="text-[14px] text-[#6e6e6e]">群發訊息</p>
                </div>
                <button className="bg-[#e1ebf9] box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-[#d0e0f5] transition-colors">
                  <p className="text-[16px] text-[#0f6beb]">活動與訊息推播</p>
                </button>
                <button 
                  onClick={() => setCurrentPage('autoResponse')}
                  className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors"
                >
                  <p className="text-[16px] text-[#383838]">自動回應</p>
                </button>
              </div>

              {/* 會員 Section */}
              <div className="box-border flex flex-col gap-1 px-4 mt-5">
                <div className="box-border flex gap-1 h-[29px] items-center p-1">
                  <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 14 14">
                    <path d={sidebarPaths.pa54d00} fill="#6E6E6E" />
                  </svg>
                  <p className="text-[14px] text-[#6e6e6e]">會員</p>
                </div>
                <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                  <p className="text-[16px] text-[#383838]">會員管理</p>
                </button>
              </div>

              {/* 設定 Section */}
              <div className="box-border flex flex-col gap-1 px-4 mt-5">
                <div className="box-border flex gap-1 h-[29px] items-center p-1">
                  <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 20 20">
                    <path d={sidebarPaths.p16734900} fill="#6E6E6E" />
                  </svg>
                  <p className="text-[14px] text-[#6e6e6e]">設定</p>
                </div>
                <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                  <p className="text-[16px] text-[#383838]">標籤管理</p>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="bg-slate-100 box-border border-t border-[#b6c8f1] flex flex-col items-start pb-[44px] pt-[12px] px-4 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="bg-white relative rounded-full shrink-0 size-[32px] flex items-center justify-center">
              <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                <path d={sidebarPaths.p1c72d580} fill="#7A9FFF" />
              </svg>
            </div>
            {sidebarOpen && (
              <>
                <p className="flex-1 text-[16px] text-[#383838]">Daisy Yang</p>
                <button className="text-[16px] text-[#0f6beb] hover:underline">登出</button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
        <div className="bg-slate-50 content-stretch flex flex-col items-start relative w-full" data-name="Main Container">
          <Breadcrumb />
          <MainContent 
            onCreateMessage={onCreateMessage}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onClearAll={handleClearAll}
            filteredMessages={filteredMessages}
            onEditMessage={handleEditMessage}
            onViewDetails={handleViewDetails}
          />
        </div>
      </main>
    </div>
  );
}