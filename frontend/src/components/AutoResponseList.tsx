import { useState } from 'react';
import { AutoResponseTable, type AutoResponse } from './AutoResponseTable';
import AutoResponseCreation from './AutoResponseCreation';
import Layout from './Layout';
import svgPaths from '../imports/svg-6vdoib8lfm';
import searchIconPaths from '../imports/svg-ckckvhq9os';
import { useNavigation } from '../contexts/NavigationContext';

const mockData: AutoResponse[] = [
  {
    id: '1',
    name: '您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢',
    description: '觸發關鍵字',
    keywords: ['飯店', '房型', '空房', '飯店位置', '人數', '日期'],
    status: true,
    platform: 'LINE',
    triggerCount: 0,
    lastModified: '2026-10-02 22:47'
  },
  {
    id: '2',
    name: '您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢',
    description: '一鍵回應',
    keywords: [],
    status: true,
    platform: 'LINE',
    triggerCount: 0,
    lastModified: '2026-10-02 22:47'
  },
  {
    id: '3',
    name: 'Hi [User Name] 歡迎加入好友～請告訴我們您的需求我司將即時為您解答好問題',
    description: '歡迎訊息',
    keywords: [],
    status: true,
    platform: 'LINE',
    triggerCount: 0,
    lastModified: '2026-10-02 22:47'
  },
  {
    id: '4',
    name: '您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢',
    description: '觸發關鍵字',
    keywords: ['在哪', '飯店位置', '地址', '怎麼去'],
    status: false,
    platform: 'LINE',
    triggerCount: 0,
    lastModified: '2026-10-02 22:47'
  }
];

interface AutoResponseListProps {}

function Breadcrumb() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
          <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0">
            <div className="content-stretch flex items-center justify-center relative shrink-0">
              <p className="font-['Noto_Sans_TC:Medium',_sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">自動回應訊息</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <h1 className="font-['Noto_Sans_TC:Regular',_sans-serif] text-[32px] font-normal leading-[1.5] text-[#383838]">
        自動回應訊息
      </h1>
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] text-[16px] leading-[1.5] text-[#6e6e6e]">
        當用戶加入好友或發送訊息時，自動觸發系統回覆，以確保能在第一時間與用戶互動
      </p>
    </div>
  );
}

function SearchBar({ value, onChange, onSearch, onClear }: { value: string; onChange: (value: string) => void; onSearch: () => void; onClear: () => void }) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 w-[292px]">
      <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
        <div className="relative shrink-0 size-[32px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <path d={searchIconPaths.p2bfa9080} fill="var(--fill-0, #A8A8A8)" />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="以訊息內容或標籤搜尋"
          className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] flex-1 text-[#383838] text-[20px] bg-transparent border-none outline-none placeholder:text-[#dddddd]"
        />
      </div>
      {value && (
        <div
          onClick={onClear}
          className="overflow-clip relative shrink-0 size-[24px] cursor-pointer hover:opacity-70 transition-opacity"
        >
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
            <g opacity="0.87"></g>
            <path d={svgPaths.pb584900} fill="var(--fill-0, #DDDDDD)" />
          </svg>
        </div>
      )}
    </div>
  );
}

function ClearAllButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] p-[8px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors"
    >
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">清除全部條件</p>
    </button>
  );
}

function CreateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors"
    >
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立</p>
    </button>
  );
}

function ActionBar({
  searchValue,
  onSearchChange,
  onSearch,
  onClearAll,
  onCreate
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearAll: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full">
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          onSearch={onSearch}
          onClear={() => onSearchChange('')}
        />
        <ClearAllButton onClick={onClearAll} />
      </div>
      <div className="basis-0 content-stretch flex gap-[12px] grow items-center justify-end min-h-px min-w-px relative shrink-0">
        <CreateButton onClick={onCreate} />
      </div>
    </div>
  );
}

function MainContent({
  searchValue,
  onSearchChange,
  onSearch,
  onClearAll,
  onCreate,
  filteredResponses,
  onToggleStatus,
  onEdit
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearAll: () => void;
  onCreate: () => void;
  filteredResponses: AutoResponse[];
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="relative w-full">
      <div className="box-border flex w-full flex-col gap-[24px] px-[40px] pt-[16px] pb-[12px]">
        <PageHeader />
        <ActionBar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSearch={onSearch}
          onClearAll={onClearAll}
          onCreate={onCreate}
        />
        <AutoResponseTable
          responses={filteredResponses}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}

export default function AutoResponseList() {
  const { navigate } = useNavigation();
  const [responses, setResponses] = useState<AutoResponse[]>(mockData);
  const [searchValue, setSearchValue] = useState('');
  const [showCreation, setShowCreation] = useState(false);

  const handleToggleStatus = (id: string) => {
    setResponses(prev =>
      prev.map(r => (r.id === id ? { ...r, status: !r.status } : r))
    );
  };

  const handleEdit = (id: string) => {
    console.log('編輯自動回應:', id);
    // TODO: 實現編輯功能
  };

  const handleClearFilters = () => {
    setSearchValue('');
  };

  const handleSearch = () => {
    console.log('搜尋:', searchValue);
    // 搜尋功能已經通過 filteredResponses 實現
  };

  // 過濾資料
  const filteredResponses = responses.filter(
    r =>
      r.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      r.keywords.some(k => k.toLowerCase().includes(searchValue.toLowerCase()))
  );

  if (showCreation) {
    return <AutoResponseCreation onBack={() => setShowCreation(false)} />;
  }

  return (
    <Layout activeSection="autoResponse">
      <div className="bg-[#F8FAFC] content-stretch flex flex-col items-start relative w-full">
        <Breadcrumb />
        <MainContent
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearch={handleSearch}
          onClearAll={handleClearFilters}
          onCreate={() => setShowCreation(true)}
          filteredResponses={filteredResponses}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
        />
      </div>
    </Layout>
  );
}
