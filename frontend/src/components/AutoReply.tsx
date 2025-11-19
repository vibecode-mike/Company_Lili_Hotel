import { useMemo, useState, memo } from 'react';
import AutoReplyTableStyled, { AutoReplyData } from './AutoReplyTableStyled';
import svgPaths from "../imports/svg-icons-common";
import { PageWithSidebar } from './Sidebar';
import { PageHeaderWithBreadcrumb } from './common/Breadcrumb';
import CreateAutoReplyInteractive from './CreateAutoReplyInteractive';
import { useAutoReplies } from '../contexts/AutoRepliesContext';

interface AutoReplyProps {
  onBack: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
}

const replyTypeLabelMap = {
  welcome: '歡迎訊息',
  keyword: '觸發關鍵字',
  follow: '一律回應',
  time: '指定時間',
} as const;

function getReplyTypeLabel(type: keyof typeof replyTypeLabelMap) {
  return replyTypeLabelMap[type] ?? '觸發關鍵字';
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const hh = String(parsed.getHours()).padStart(2, '0');
  const mins = String(parsed.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mins}`;
}

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

const CancelCircleIcon = memo(function CancelCircleIcon({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
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
  );
});

export default function AutoReply({ onBack: _onBack, onNavigateToMessages, onNavigateToMembers, onNavigateToSettings }: AutoReplyProps) {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { autoReplies, isLoading, error, toggleAutoReply } = useAutoReplies();

  const tableData = useMemo<AutoReplyData[]>(() => {
    return autoReplies.map((reply) => ({
      id: reply.id,
      content: reply.messages[0] ?? '',
      replyType: getReplyTypeLabel(reply.triggerType),
      keywords: reply.keywords,
      status: reply.isActive ? '啟用' : '停用',
      platform: 'LINE',
      triggerCount: reply.triggerCount,
      createTime: formatDateTime(reply.createdAt),
    }));
  }, [autoReplies]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableData;
    const keyword = searchTerm.trim().toLowerCase();
    return tableData.filter((row) => {
      const contentMatch = row.content.toLowerCase().includes(keyword);
      const keywordMatch = row.keywords.some((item) => item.toLowerCase().includes(keyword));
      const replyTypeMatch = row.replyType.toLowerCase().includes(keyword);
      const statusMatch = row.status.includes(keyword);
      return contentMatch || keywordMatch || replyTypeMatch || statusMatch;
    });
  }, [tableData, searchTerm]);

  const handleClearFilters = () => {
    setSearchTerm('');
  };

  const openEditor = (id?: string) => {
    setEditingId(id ?? null);
    setView('editor');
  };

  const closeEditor = () => {
    setEditingId(null);
    setView('list');
  };

  const handleToggleStatus = async (id: string, nextState: boolean) => {
    try {
      await toggleAutoReply(id, nextState);
    } catch {
      // 已在 context 中處理錯誤提示
    }
  };

  if (view === 'editor') {
    return (
      <CreateAutoReplyInteractive
        autoReplyId={editingId}
        onBack={closeEditor}
        onSaved={closeEditor}
        onDeleted={closeEditor}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToSettings={onNavigateToSettings}
      />
    );
  }

  return (
    <PageWithSidebar
      currentPage="auto-reply"
      onNavigateToMessages={onNavigateToMessages}
      onNavigateToMembers={onNavigateToMembers}
      onNavigateToSettings={onNavigateToSettings}
    >
      <div className="bg-slate-50 content-stretch flex flex-col items-start relative w-full" data-name="Main Container">
        <PageHeaderWithBreadcrumb
          breadcrumbItems={[
            { label: '自動回應', active: true }
          ]}
          title="自動回應"
          description="設定自動回應訊息，讓顧客獲得即時的回覆"
        />

        <div className="px-[40px] pb-[16px] w-full">
          <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
              <div className="bg-white box-border content-stretch flex gap-[12px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0">
                <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                  <IconSearch />
                  <input
                    type="text"
                    placeholder="以訊息內容或標籤搜尋"
                    className="flex-1 text-[20px] text-[#383838] placeholder:text-[#dddddd] bg-transparent border-none outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {searchTerm && (
                  <CancelCircleIcon onClick={handleClearFilters} />
                )}
              </div>

              <div
                onClick={handleClearFilters}
                className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] px-[8px] py-[12px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors h-[48px]"
                data-name="Button/ClearFilters"
              >
                <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">清除全部條件</p>
              </div>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => openEditor()}
              className="bg-[#242424] hover:bg-[#383838] text-white rounded-[16px] h-[48px] min-w-[72px] px-[12px] transition-colors flex items-center justify-center shrink-0"
            >
              建立
            </button>
          </div>
        </div>

        <div className="px-[40px] pb-[12px]">
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#6e6e6e] text-[12px]">
            共 {filteredData.length} 筆
          </p>
        </div>

        <div className="px-[40px] pb-[40px] w-full min-h-[240px]">
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
          ) : filteredData.length > 0 ? (
            <AutoReplyTableStyled
              data={filteredData}
              onRowClick={(id) => openEditor(id)}
              onToggleStatus={handleToggleStatus}
            />
          ) : (
            <div className="flex h-[240px] items-center justify-center rounded-[16px] border border-dashed border-[#dddddd] bg-white text-[#6e6e6e]">
              尚無自動回應資料
            </div>
          )}
        </div>
      </div>
    </PageWithSidebar>
  );
}
