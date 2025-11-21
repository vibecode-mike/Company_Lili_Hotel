import { useState, useMemo, memo, useCallback, useEffect } from 'react';
import svgPaths from "../imports/svg-icons-common";
import { imgGroup, imgGroup1, imgGroup2, imgGroup3, imgGroup4, imgGroup5, imgGroup6 } from "../imports/StarbitLogoAssets";
import InteractiveMessageTable, { type Message } from "./InteractiveMessageTable";
import MemberMainContainer from "../imports/MemberListContainer";
import AddMemberContainer from "../imports/MemberDetailContainer";
import ChatRoom from "./ChatRoom";
import Sidebar from './Sidebar';
import { PageHeaderWithBreadcrumb } from './common/Breadcrumb';
import { MessageDetailDrawer } from './MessageDetailDrawer';
import { useMessages } from '../contexts/MessagesContext';

interface MessageListProps {
  onCreateMessage: () => void;
  onEditMessage?: (messageId: string) => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToSettings?: () => void;
}

// Local Description Container Component
const DescriptionContainerLocal = memo(function DescriptionContainerLocal({ children }: { children: React.ReactNode }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Description Container">
      {children}
    </div>
  );
});

// Message data now comes from MessagesContext

const IconSearch = memo(function IconSearch() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Icon/Search">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Icon/Search">
          <path d={svgPaths.p2bfa9080} fill="var(--fill-0, #A8A8A8)" id="Vector" />
        </g>
      </svg>
    </div>
  );
});

const SearchBar = memo(function SearchBar({ value, onChange, onClear }: { value: string; onChange: (value: string) => void; onClear: () => void }) {
  return (
    <div className="bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 w-[292px]" data-name="Search Bar">
      <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
        <IconSearch />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="以訊息標題或標籤搜尋"
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
});

const ButtonReanalyze = memo(function ButtonReanalyze({ onClick }: { onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] px-[8px] py-[12px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors h-[48px]" 
      data-name="Button/Reanalyze"
    >
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">清除全部條件</p>
    </div>
  );
});

const Frame11 = memo(function Frame11({ searchValue, onSearchChange, onClearAll }: { searchValue: string; onSearchChange: (value: string) => void; onClearAll: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <SearchBar value={searchValue} onChange={onSearchChange} onClear={() => onSearchChange('')} />
      <ButtonReanalyze onClick={onClearAll} />
    </div>
  );
});

const ButtonFilledButton = memo(function ButtonFilledButton({ onClick }: { onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors" 
      data-name="Button/Filled Button"
    >
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立訊息</p>
    </div>
  );
});

const Frame9 = memo(function Frame9({ onCreateMessage }: { onCreateMessage: () => void }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0">
      <ButtonFilledButton onClick={onCreateMessage} />
    </div>
  );
});

const Frame = memo(function Frame({ onCreateMessage, searchValue, onSearchChange, onClearAll }: { onCreateMessage: () => void; searchValue: string; onSearchChange: (value: string) => void; onClearAll: () => void }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
      <Frame11 searchValue={searchValue} onSearchChange={onSearchChange} onClearAll={onClearAll} />
      <div className="flex-1"></div>
      <Frame9 onCreateMessage={onCreateMessage} />
    </div>
  );
});

const ButtonFilledButton1 = memo(function ButtonFilledButton1({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
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
});

const Frame14 = memo(function Frame14({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      {isActive && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
      <ButtonFilledButton1 count={count} isActive={isActive} onClick={onClick} />
    </div>
  );
});

const ButtonFilledButton2 = memo(function ButtonFilledButton2({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
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
});

const Frame13 = memo(function Frame13({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      {isActive && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
      <ButtonFilledButton2 count={count} isActive={isActive} onClick={onClick} />
    </div>
  );
});

const ButtonFilledButton3 = memo(function ButtonFilledButton3({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
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
});

const Frame12 = memo(function Frame12({ count, isActive, onClick }: { count: number; isActive: boolean; onClick: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      {isActive && <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />}
      <ButtonFilledButton3 count={count} isActive={isActive} onClick={onClick} />
    </div>
  );
});

const Frame1 = memo(function Frame1({ 
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
});

const MainContent = memo(function MainContent({
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
  draftCount,
  quotaStatus
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
  quotaStatus: { used: number; monthlyLimit: number; availableQuota: number; quotaType: string } | null;
}) {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Main Content">
      {/* Search and Create Button */}
      <div className="px-[40px] pb-[16px] w-full">
        <Frame onCreateMessage={onCreateMessage} searchValue={searchValue} onSearchChange={onSearchChange} onClearAll={onClearAll} />
      </div>
      
      {/* Description Container - Message Usage */}
      <div className="px-[40px] pb-[20px] w-full">
        <div className="bg-[rgba(255,255,255,0.3)] relative rounded-[16px] w-full" data-name="Description Container">
          <div aria-hidden="true" className="absolute border border-[#f0f6ff] border-solid inset-0 pointer-events-none rounded-[16px]" />
          <div className="flex flex-col justify-center w-full">
            <div className="box-border content-stretch flex flex-col gap-[8px] items-start justify-center p-[24px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Description Wrapper">
                <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Description Text Container">
                  <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">本月的訊息用量</p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Description Text Container">
                  <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">
                    {quotaStatus ? `${quotaStatus.used.toLocaleString()}/${quotaStatus.monthlyLimit.toLocaleString()}` : '載入中...'}
                  </p>
                </div>
              </div>
              <div className="bg-[#f0f6ff] h-[8px] overflow-clip relative rounded-[80px] shrink-0 w-full" data-name="usage status">
                <div
                  className="absolute bg-[#3a87f2] h-[8px] left-0 rounded-[80px] top-0 transition-all duration-300"
                  style={{
                    width: quotaStatus
                      ? `${Math.min((quotaStatus.used / quotaStatus.monthlyLimit) * 100, 100)}%`
                      : '0%'
                  }}
                  data-name="usage"
                />
              </div>
              <div className="relative shrink-0 w-full" data-name="Description Wrapper">
                <div className="flex flex-row items-center size-full">
                  <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative w-full">
                    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full max-w-[340px]" data-name="Description Text Container">
                      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[12px]">已傳送的訊息則數資訊通常於每天上午更新。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
        <InteractiveMessageTable 
          messages={filteredMessages} 
          onEdit={onEditMessage} 
          onViewDetails={onViewDetails} 
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
});

export default function MessageList({ onCreateMessage, onEditMessage, onNavigateToAutoReply, onNavigateToSettings }: MessageListProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState<'messages' | 'members'>('messages');
  const [memberView, setMemberView] = useState<'list' | 'add' | 'detail' | 'chat'>('list');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('已發送');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Get messages from context
  const {
    messages: contextMessages,
    isLoading,
    statusCounts,
    quotaStatus,
    fetchMessages,
    fetchQuota
  } = useMessages();

  useEffect(() => {
    if (currentPage === 'messages') {
      fetchMessages();
      fetchQuota();
    }
  }, [currentPage, fetchMessages, fetchQuota]);

  // Transform context messages to match InteractiveMessageTable format
  const transformedMessages = useMemo(() => {
    return contextMessages.map(msg => ({
      id: msg.id,
      title: msg.title,
      tags: msg.tags,
      platform: msg.platform,
      status: msg.status,
      sentCount: msg.recipientCount > 0 ? msg.recipientCount.toString() : '-',
      openCount: msg.openCount > 0 ? msg.openCount.toString() : '-',
      clickCount: msg.clickCount > 0 ? msg.clickCount.toString() : '-',
      sendTime: msg.sendTime !== '-' ? new Date(msg.sendTime).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\//g, '-') : '-'
    }));
  }, [contextMessages]);

  // Filter messages based on search value and status filter
  const filteredMessages = useMemo(() => {
    let messages = transformedMessages;

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
  }, [transformedMessages, searchValue, statusFilter]);
  
  const handleClearAll = () => {
    setSearchValue('');
  };
  
  const handleEditMessage = (id: string) => {
    if (onEditMessage) {
      onEditMessage(id);
    }
  };
  
  const handleViewDetails = (id: string) => {
    setSelectedMessageId(id);
    setDrawerOpen(true);
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
              quotaStatus={quotaStatus}
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
      <MessageDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        messageId={selectedMessageId}
        onEdit={(messageId) => {
          if (onEditMessage) {
            onEditMessage(messageId);
          }
        }}
      />
    </div>
  );
}
