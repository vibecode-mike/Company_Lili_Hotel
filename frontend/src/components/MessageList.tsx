import { useState, useMemo, useEffect } from 'react';
import svgPaths from "../imports/svg-ckckvhq9os";
import sidebarPaths from '../imports/svg-jb10q6lg6b';
import { imgGroup, imgGroup1, imgGroup2, imgGroup3, imgGroup4, imgGroup5, imgGroup6 } from "../imports/svg-zrjx6";
import InteractiveMessageTable, { type Message } from "./InteractiveMessageTable";
import { campaignService } from '../services/campaignService';
import { transformResponseListToMessages } from '../utils/dataTransform';

interface MessageListProps {
  onCreateMessage: () => void;
}

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
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 16">
          <path clipRule="evenodd" d={sidebarPaths.p26ade400} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.82%_42.23%_38.13%_44.71%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.696px] mask-size-[13.937px_15.348px]" style={{ maskImage: `url('${imgGroup2}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 21">
          <path d={sidebarPaths.p3b240180} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.29%_34.51%_43.6%_57.22%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
          <path clipRule="evenodd" d={sidebarPaths.p335ae980} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.82%_32.69%_38.13%_55.4%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.696px] mask-size-[12.235px_15.348px]" style={{ maskImage: `url('${imgGroup3}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={sidebarPaths.p2baf8a00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.3%_24.44%_43.6%_67.58%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
          <path clipRule="evenodd" d={sidebarPaths.p5c7b800} fill="#6ED7FF" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[19.82%_22.62%_38.13%_65.76%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.701px] mask-size-[11.801px_15.343px]" style={{ maskImage: `url('${imgGroup4}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={sidebarPaths.p20a15b00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[25.84%_20.11%_43.6%_77.65%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 16">
          <path d={sidebarPaths.p38d4b100} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[20.36%_18.29%_38.13%_75.83%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.703px_2.701px] mask-size-[3.31px_15.076px]" style={{ maskImage: `url('${imgGroup5}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 21">
          <path d={sidebarPaths.p31afde00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[26.39%_9.96%_43.6%_81.86%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 15">
          <path clipRule="evenodd" d={sidebarPaths.p18a2a000} fill="#6ED7FF" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[20.91%_8.13%_38.13%_80.03%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.702px_2.701px] mask-size-[12.114px_14.805px]" style={{ maskImage: `url('${imgGroup6}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={sidebarPaths.p1df19600} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[23.55%_79.27%_61.17%_10.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
          <path d={sidebarPaths.peae5a00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[38.83%_76.47%_42.23%_10.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 10">
          <path d={sidebarPaths.p56e0200} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[23.57%_76.37%_58.34%_18.22%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 9">
          <path d={sidebarPaths.p3047d700} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[53.48%_84.18%_26.93%_9.37%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={sidebarPaths.p38a8ff00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[57.77%_76.47%_26.91%_12.72%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
          <path d={sidebarPaths.p29639800} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[22.41%_72.4%_67.66%_24.12%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 5">
          <path d={sidebarPaths.p29088600} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[63.59%_64.96%_25.62%_31.17%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p1b016f00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63%_56.2%_25.28%_40.09%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p3d5c5b00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63.13%_47.23%_25.2%_48.93%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p32938000} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.93%_38.59%_25.16%_57.81%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p2e055800} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.96%_29.55%_25.22%_66.71%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p1c98d3b0} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.9%_20.63%_25.25%_75.58%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p664e180} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63.18%_11.74%_25.36%_84.49%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p7d2500} fill="#189AEB" />
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

function StatusFilterButton({
  status,
  count,
  isActive,
  onClick
}: {
  status: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
      data-name="Button/Filled Button"
    >
      <p className={`basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${
        isActive ? 'text-[#383838]' : 'text-[#6e6e6e]'
      }`}>
        {status} ({count})
      </p>
    </button>
  );
}

function Frame1({
  statusCounts,
  activeFilter,
  onFilterChange
}: {
  statusCounts: { '已排程': number; '草稿': number; '已發送': number };
  activeFilter: string | null;
  onFilterChange: (status: string | null) => void;
}) {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        {activeFilter === '已排程' && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
        <StatusFilterButton
          status="已排程"
          count={statusCounts['已排程']}
          isActive={activeFilter === '已排程'}
          onClick={() => onFilterChange(activeFilter === '已排程' ? null : '已排程')}
        />
      </div>
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        {activeFilter === '草稿' && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
        <StatusFilterButton
          status="草稿"
          count={statusCounts['草稿']}
          isActive={activeFilter === '草稿'}
          onClick={() => onFilterChange(activeFilter === '草稿' ? null : '草稿')}
        />
      </div>
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        {activeFilter === '已發送' && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
        <StatusFilterButton
          status="已發送"
          count={statusCounts['已發送']}
          isActive={activeFilter === '已發送'}
          onClick={() => onFilterChange(activeFilter === '已發送' ? null : '已發送')}
        />
      </div>
    </div>
  );
}

function MainContent({
  onCreateMessage,
  searchValue,
  onSearchChange,
  onClearAll,
  filteredMessages,
  onEditMessage,
  onViewDetails,
  statusCounts,
  activeFilter,
  onFilterChange
}: {
  onCreateMessage: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearAll: () => void;
  filteredMessages: Message[];
  onEditMessage: (id: string) => void;
  onViewDetails: (id: string) => void;
  statusCounts: { '已排程': number; '草稿': number; '已發送': number };
  activeFilter: string | null;
  onFilterChange: (status: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-[24px] items-start pb-[40px] pt-[16px] px-[40px] relative w-full" data-name="Main Content">
      <HeaderContainer />
      <Frame onCreateMessage={onCreateMessage} searchValue={searchValue} onSearchChange={onSearchChange} onClearAll={onClearAll} />
      <Frame1 statusCounts={statusCounts} activeFilter={activeFilter} onFilterChange={onFilterChange} />
      <InteractiveMessageTable messages={filteredMessages} onEdit={onEditMessage} onViewDetails={onViewDetails} />
    </div>
  );
}

export default function MessageList({ onCreateMessage }: MessageListProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);

  // Fetch campaigns from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await campaignService.getCampaigns({
          page: 1,
          page_size: 100,
          sort_by: 'created_at',
          sort_order: 'desc',
        });

        console.log('API Response:', response); // Debug log

        if (response.error) {
          setError(typeof response.error.detail === 'string'
            ? response.error.detail
            : '載入活動列表失敗'
          );
          setMessages([]);
        } else if (response.data) {
          // Handle both paginated response and direct array response
          const items = Array.isArray(response.data)
            ? response.data
            : (response.data.items || []);

          console.log('Items to transform:', items); // Debug log

          if (items.length > 0) {
            const transformedMessages = transformResponseListToMessages(items);
            setMessages(transformedMessages);
          } else {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('獲取活動列表失敗:', err);
        setError('網絡錯誤，請稍後再試');
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      '已排程': 0,
      '草稿': 0,
      '已發送': 0,
    };

    messages.forEach((message) => {
      if (message.status in counts) {
        counts[message.status as keyof typeof counts]++;
      }
    });

    return counts;
  }, [messages]);

  // Filter messages based on search value and status filter
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Apply status filter
    if (activeStatusFilter) {
      filtered = filtered.filter((message) => message.status === activeStatusFilter);
    }

    // Apply search filter
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter((message) => {
        return (
          message.title.toLowerCase().includes(searchLower) ||
          message.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          message.platform.toLowerCase().includes(searchLower) ||
          message.status.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [messages, searchValue, activeStatusFilter]);

  const handleClearAll = () => {
    setSearchValue('');
  };

  const handleEditMessage = (id: string) => {
    console.log('編輯訊息:', id);
    // TODO: Navigate to edit page or open edit modal
    // This would typically use React Router or a modal state
  };

  const handleViewDetails = (id: string) => {
    console.log('查看詳細:', id);
    // TODO: Navigate to details page or open details modal
    // This would typically use React Router or a modal state
  };

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
                <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
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
          {loading ? (
            <div className="flex items-center justify-center w-full min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f6beb] mx-auto mb-4"></div>
                <p className="text-[#6e6e6e] text-[16px]">載入中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center w-full min-h-[400px]">
              <div className="text-center">
                <p className="text-red-500 text-[18px] mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#242424] text-white px-6 py-2 rounded-[16px] hover:bg-[#383838] transition-colors"
                >
                  重新載入
                </button>
              </div>
            </div>
          ) : (
            <MainContent
              onCreateMessage={onCreateMessage}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              onClearAll={handleClearAll}
              filteredMessages={filteredMessages}
              onEditMessage={handleEditMessage}
              onViewDetails={handleViewDetails}
              statusCounts={statusCounts}
              activeFilter={activeStatusFilter}
              onFilterChange={setActiveStatusFilter}
            />
          )}
        </div>
      </main>
    </div>
  );
}
