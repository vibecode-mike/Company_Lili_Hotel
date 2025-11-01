import { useState, useMemo, useEffect } from 'react';
import svgPaths from "../imports/svg-ckckvhq9os";
import InteractiveMessageTable, { type Message } from "./InteractiveMessageTable";
import { campaignService } from '../services/campaignService';
import { transformResponseListToMessages } from '../utils/dataTransform';
import Layout from './Layout';
import { useNavigation } from '../contexts/NavigationContext';

interface MessageListProps {}

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

function TitleContainer() {
  return (
    <div className="flex w-full flex-col items-start gap-2" data-name="Title Container">
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-left text-[#383838] text-[32px] whitespace-pre">
        活動與訊息推播
      </p>
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-left text-[#6e6e6e] text-[16px] whitespace-pre">
        建立單一圖文或多頁輪播內容，打造引人注目的品牌訊息
      </p>
    </div>
  );
}

function HeaderContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full text-left" data-name="Header Container">
      <TitleContainer />
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
        {activeFilter === '已發送' && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
        <StatusFilterButton
          status="已發送"
          count={statusCounts['已發送']}
          isActive={activeFilter === '已發送'}
          onClick={() => onFilterChange(activeFilter === '已發送' ? null : '已發送')}
        />
      </div>
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
    <div className="relative w-full" data-name="Main Content">
      <div className="box-border flex w-full flex-col gap-[24px] px-[40px] pt-[16px] pb-[12px]">
        <HeaderContainer />
        <Frame onCreateMessage={onCreateMessage} searchValue={searchValue} onSearchChange={onSearchChange} onClearAll={onClearAll} />
        <Frame1 statusCounts={statusCounts} activeFilter={activeFilter} onFilterChange={onFilterChange} />
      </div>
      <div className="box-border px-[40px] pb-[40px] w-full">
        <InteractiveMessageTable messages={filteredMessages} onEdit={onEditMessage} onViewDetails={onViewDetails} />
      </div>
    </div>
  );
}

export default function MessageList() {
  const { navigate } = useNavigation();
  const [searchValue, setSearchValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>('已發送');

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
    <Layout activeSection="messages">
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
            onCreateMessage={() => navigate('messageCreation')}
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
    </Layout>
  );
}
