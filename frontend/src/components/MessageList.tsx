import { useState, useMemo } from 'react';
import svgPaths from "../imports/svg-ckckvhq9os";
import { imgGroup, imgGroup1, imgGroup2, imgGroup3, imgGroup4, imgGroup5, imgGroup6 } from "../imports/svg-zrjx6";
import InteractiveMessageTable, { type Message } from "./InteractiveMessageTable";
import MemberMainContainer from "../imports/MainContainer-6001-1415";
import AddMemberContainer from "../imports/MainContainer-6001-3170";
import ChatRoom from "./ChatRoom";
import Sidebar from './Sidebar';
import { PageHeaderWithBreadcrumb } from './common/Breadcrumb';
import DescriptionContainer from "../imports/DescriptionContainer";

interface MessageListProps {
  onCreateMessage: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToSettings?: () => void;
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
      className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] px-[8px] py-[12px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors h-[48px]" 
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
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0">
      <ButtonFilledButton onClick={onCreateMessage} />
    </div>
  );
}

function Frame({ onCreateMessage, searchValue, onSearchChange, onClearAll }: { onCreateMessage: () => void; searchValue: string; onSearchChange: (value: string) => void; onClearAll: () => void }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
      <Frame11 searchValue={searchValue} onSearchChange={onSearchChange} onClearAll={onClearAll} />
      <div className="flex-1"></div>
      <Frame9 onCreateMessage={onCreateMessage} />
    </div>
  );
}

function ButtonFilledButton1({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer transition-colors" 
      data-name="Button/Filled Button"
    >
      <p className={`basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${isActive ? 'text-[#383838]' : 'text-[#6e6e6e]'}`}>
        已發送 ({count})
      </p>
    </div>
  );
}

function Frame14({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      {isActive && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
      <ButtonFilledButton1 count={count} isActive={isActive} onClick={onClick} />
    </div>
  );
}

function ButtonFilledButton2({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer transition-colors" 
      data-name="Button/Filled Button"
    >
      <p className={`basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${isActive ? 'text-[#383838]' : 'text-[#6e6e6e]'}`}>
        已排程 ({count})
      </p>
    </div>
  );
}

function Frame13({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      {isActive && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
      <ButtonFilledButton2 count={count} isActive={isActive} onClick={onClick} />
    </div>
  );
}

function ButtonFilledButton3({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer transition-colors" 
      data-name="Button/Filled Button"
    >
      <p className={`basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${isActive ? 'text-[#383838]' : 'text-[#6e6e6e]'}`}>
        草稿 ({count})
      </p>
    </div>
  );
}

function Frame12({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      {isActive && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
      <ButtonFilledButton3 count={count} isActive={isActive} onClick={onClick} />
    </div>
  );
}

function Frame1({ 
  statusFilter, 
  onStatusFilterChange, 
  sentCount, 
  scheduledCount, 
  draftCount 
}: { 
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sentCount: number;
  scheduledCount: number;
  draftCount: number;
}) {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <Frame14 
        count={sentCount} 
        isActive={statusFilter === '已發送'} 
        onClick={() => onStatusFilterChange('已發送')} 
      />
      <Frame13 
        count={scheduledCount} 
        isActive={statusFilter === '已排程'} 
        onClick={() => onStatusFilterChange('已排程')} 
      />
      <Frame12 
        count={draftCount} 
        isActive={statusFilter === '草稿'} 
        onClick={() => onStatusFilterChange('草稿')} 
      />
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
  statusFilter,
  onStatusFilterChange,
  sentCount,
  scheduledCount,
  draftCount
}: { 
  onCreateMessage: () => void; 
  searchValue: string; 
  onSearchChange: (value: string) => void; 
  onClearAll: () => void;
  filteredMessages: Message[];
  onEditMessage: (id: string) => void;
  onViewDetails: (id: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sentCount: number;
  scheduledCount: number;
  draftCount: number;
}) {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Main Content">
      {/* Search and Create Button */}
      <div className="px-[40px] pb-[16px] w-full">
        <Frame onCreateMessage={onCreateMessage} searchValue={searchValue} onSearchChange={onSearchChange} onClearAll={onClearAll} />
      </div>
      
      {/* Description Container - Message Usage */}
      <div className="px-[40px] pb-[20px] w-full">
        <DescriptionContainer />
      </div>
      
      {/* Filter Buttons */}
      <div className="px-[40px] pb-[12px] w-full">
        <Frame1 
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          sentCount={sentCount}
          scheduledCount={scheduledCount}
          draftCount={draftCount}
        />
      </div>
      
      {/* Table */}
      <div className="px-[40px] pb-[40px] w-full">
        <InteractiveMessageTable messages={filteredMessages} onEdit={onEditMessage} onViewDetails={onViewDetails} />
      </div>
    </div>
  );
}

export default function MessageList({ onCreateMessage, onNavigateToAutoReply, onNavigateToSettings }: MessageListProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState<'messages' | 'members'>('messages');
  const [memberView, setMemberView] = useState<'list' | 'add' | 'detail' | 'chat'>('list');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('已發送');
  
  // Calculate message counts by status
  const statusCounts = useMemo(() => {
    return {
      sent: SAMPLE_MESSAGES.filter(m => m.status === '已發送').length,
      scheduled: SAMPLE_MESSAGES.filter(m => m.status === '已排程').length,
      draft: SAMPLE_MESSAGES.filter(m => m.status === '草稿').length
    };
  }, []);
  
  // Filter messages based on search value and status filter
  const filteredMessages = useMemo(() => {
    let messages = SAMPLE_MESSAGES;
    
    // Filter by status
    messages = messages.filter(message => message.status === statusFilter);
    
    // Filter by search value
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      messages = messages.filter((message) => {
        return (
          message.title.toLowerCase().includes(searchLower) ||
          message.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          message.platform.toLowerCase().includes(searchLower) ||
          message.status.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return messages;
  }, [searchValue, statusFilter]);
  
  const handleClearAll = () => {
    setSearchValue('');
  };
  
  const handleEditMessage = (id: string) => {
    // TODO: Implement edit functionality
  };
  
  const handleViewDetails = (id: string) => {
    // TODO: Implement view details functionality
  };

  const handleAddMember = () => {
    setMemberView('add');
  };

  const handleBackToMemberList = () => {
    setMemberView('list');
    setSelectedMember(null);
  };

  const handleOpenChat = (member: any) => {
    setSelectedMember(member);
    setMemberView('chat');
  };

  const handleViewDetail = (member: any) => {
    setSelectedMember(member);
    setMemberView('detail');
  };

  const handleNavigateFromDetail = (page: string, params?: { memberId?: string }) => {
    if (page === 'member-chat') {
      // Navigate to chat room - selectedMember is already set from handleViewDetail
      setMemberView('chat');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage}
        onNavigateToMessages={() => setCurrentPage('messages')}
        onNavigateToAutoReply={onNavigateToAutoReply}
        onNavigateToMembers={() => {
          setCurrentPage('members');
          setMemberView('list');
        }}
        onNavigateToSettings={onNavigateToSettings}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
      />

      {/* Main Content */}
      <main className={`flex-1 bg-slate-50 transition-all duration-300 overflow-x-hidden overflow-y-auto ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
        {currentPage === 'messages' ? (
          <div className="bg-slate-50 content-stretch flex flex-col items-start relative w-full" data-name="Main Container">
            {/* Breadcrumb, Title and Description */}
            <PageHeaderWithBreadcrumb
              breadcrumbItems={[
                { label: '活動與訊息推播', active: true }
              ]}
              title="活動與訊息推播"
              description="建立單一圖文或多頁輪播內容，打造引人注目的品牌訊息"
            />
            
            <MainContent 
              onCreateMessage={onCreateMessage}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              onClearAll={handleClearAll}
              filteredMessages={filteredMessages}
              onEditMessage={handleEditMessage}
              onViewDetails={handleViewDetails}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sentCount={statusCounts.sent}
              scheduledCount={statusCounts.scheduled}
              draftCount={statusCounts.draft}
            />
          </div>
        ) : (
          memberView === 'list' ? (
            <MemberMainContainer 
              onAddMember={handleAddMember} 
              onOpenChat={handleOpenChat}
              onViewDetail={handleViewDetail}
            />
          ) : memberView === 'add' ? (
            <AddMemberContainer onBack={handleBackToMemberList} />
          ) : memberView === 'detail' ? (
            <AddMemberContainer 
              onBack={handleBackToMemberList} 
              member={selectedMember} 
              onNavigate={handleNavigateFromDetail}
            />
          ) : (
            <ChatRoom member={selectedMember} onBack={handleBackToMemberList} />
          )
        )}
      </main>
    </div>
  );
}