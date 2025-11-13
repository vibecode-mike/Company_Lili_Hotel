import { useState } from 'react';
import CreateAutoReply from './CreateAutoReply';
import Sidebar from './Sidebar';
import { PageHeaderWithBreadcrumb } from './common/Breadcrumb';
import AutoReplyTableStyled, { AutoReplyData } from './AutoReplyTableStyled';
import svgPaths from "../imports/svg-ckckvhq9os";

interface AutoReplyProps {
  onBack: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
}

// Sample data for auto-reply messages
const SAMPLE_AUTO_REPLIES: AutoReplyData[] = [
  {
    id: '1',
    content: '您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢',
    replyType: '觸發關鍵字',
    keywords: ['飯店', '房型', '空房', '飯店位置', '人數', '日期'],
    status: '啟用',
    platform: 'LINE',
    triggerCount: 0,
    createTime: '2026-10-02 22:47'
  },
  {
    id: '2',
    content: '您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢',
    replyType: '一鍵回應',
    keywords: [],
    status: '啟用',
    platform: 'LINE',
    triggerCount: 0,
    createTime: '2026-10-02 22:47'
  },
  {
    id: '3',
    content: '感謝您的詢問！我們的客服人員將會盡快回覆您',
    replyType: '觸發關鍵字',
    keywords: ['客服', '詢問', '幫助'],
    status: '停用',
    platform: 'LINE',
    triggerCount: 156,
    createTime: '2026-09-28 14:30'
  },
  {
    id: '4',
    content: '歡迎來到我們的飯店！如需任何協助請隨時告訴我們',
    replyType: '一鍵回應',
    keywords: [],
    status: '啟用',
    platform: 'LINE',
    triggerCount: 89,
    createTime: '2026-09-15 10:20'
  }
];

export default function AutoReply({ onBack, onNavigateToMessages, onNavigateToMembers, onNavigateToSettings }: AutoReplyProps) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  if (view === 'create') {
    return <CreateAutoReply 
      onBack={() => setView('list')} 
      onNavigateToMessages={onNavigateToMessages}
      onNavigateToMembers={onNavigateToMembers}
    />;
  }

  const handleRowClick = (rowIndex: number) => {
    // TODO: Navigate to edit page
    setView('create');
  };

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar 
        currentPage="auto-reply"
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToAutoReply={() => {}}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToSettings={onNavigateToSettings}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
      />

      {/* Main Content Area - offset by sidebar width */}
      <main className={`flex-1 overflow-auto bg-slate-50 transition-all duration-300 ${sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'}`}>
        <div className="bg-slate-50 content-stretch flex flex-col items-start relative w-full" data-name="Main Container">
          {/* Breadcrumb, Title and Description */}
          <PageHeaderWithBreadcrumb
            breadcrumbItems={[
              { label: '自動回應', active: true }
            ]}
            title="自動回應"
            description="設定自動回應訊息，讓顧客獲得即時的回覆"
          />
          
          {/* Search and Create Button */}
          <div className="px-[40px] pb-[16px] w-full">
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                <div className="bg-white box-border content-stretch flex gap-[12px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0">
                  <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                    <div className="relative shrink-0 size-[32px]" data-name="Icon/Search">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                        <g id="Icon/Search">
                          <path d={svgPaths.p2bfa9080} fill="var(--fill-0, #A8A8A8)" id="Vector" />
                        </g>
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="以訊息內容或標籤搜尋"
                      className="flex-1 text-[20px] text-[#383838] placeholder:text-[#dddddd] bg-transparent border-none outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {searchTerm && (
                    <div 
                      onClick={() => setSearchTerm('')}
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
                
                {/* Clear Filters Button */}
                <button className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] px-[8px] py-[12px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors h-[48px]">
                  <span className="text-[#0f6beb] text-[16px] text-center">清除全部條件</span>
                </button>
              </div>
              
              {/* 弹性空白区域 - 将按钮推到最右边 */}
              <div className="flex-1"></div>
              
              {/* Create Button - 完全靠右对齐 */}
              <button
                onClick={() => setView('create')}
                className="bg-[#242424] hover:bg-[#383838] text-white rounded-[16px] h-[48px] min-w-[72px] px-[12px] transition-colors flex items-center justify-center shrink-0"
              >
                建立
              </button>
            </div>
          </div>
          
          {/* Count */}
          <div className="px-[40px] pb-[12px]">
            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#6e6e6e] text-[12px]">
              共 {SAMPLE_AUTO_REPLIES.length} 筆
            </p>
          </div>
          
          {/* Table */}
          <div className="px-[40px] pb-[40px] w-full">
            <AutoReplyTableStyled data={SAMPLE_AUTO_REPLIES} onRowClick={(id) => {
              setView('create');
            }} />
          </div>
        </div>
      </main>
    </div>
  );
}