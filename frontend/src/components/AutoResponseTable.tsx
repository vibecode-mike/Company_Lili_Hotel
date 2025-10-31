import { Edit, Info, ChevronDown } from 'lucide-react';
import svgPaths from '../imports/svg-6vdoib8lfm';

export interface AutoResponse {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  status: boolean;
  platform: string;
  triggerCount: number;
  lastModified: string;
}

interface AutoResponseTableProps {
  responses: AutoResponse[];
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
}

const COLUMN_WIDTH_CLASSES = {
  content: "w-[360px]",
  responseType: "w-[200px]",
  keywords: "w-[320px]",
  status: "w-[120px]",
  platform: "w-[120px]",
  triggerCount: "w-[140px]",
  lastModified: "w-[200px]",
  edit: "w-[80px]",
} as const;

function DataCount({ count }: { count: number }) {
  return (
    <p className="font-['Noto_Sans_TC:Regular',_sans-serif] text-[16px] leading-[1.5] text-[#6e6e6e]">
      共 {count} 筆
    </p>
  );
}

const TAGS_PER_ROW = 3;

function KeywordTags({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) {
    return <span className="text-[14px] text-[#6e6e6e]">—</span>;
  }

  const rows: string[][] = [];
  for (let i = 0; i < keywords.length; i += TAGS_PER_ROW) {
    rows.push(keywords.slice(i, i + TAGS_PER_ROW));
  }

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {rows.map((rowTags, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex flex-wrap gap-2">
          {rowTags.map((tag, tagIndex) => (
            <span
              key={`${rowIndex}-${tagIndex}`}
              className="inline-block rounded-[8px] bg-[#FFFAF0] px-2.5 py-1 font-['Noto_Sans_TC:Regular',_sans-serif] text-[14px] leading-[1.4] text-[#EBA20F] whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function SortIcon() {
  return (
    <ChevronDown className="h-3.5 w-3.5 text-[#6e6e6e] ml-1" />
  );
}

function StatusToggle({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="overflow-clip relative shrink-0 size-[40px] cursor-pointer"
    >
      <div className="absolute inset-[29.17%_8.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 17">
          <path
            d={enabled ? svgPaths.p38913700 : svgPaths.p23a98e80}
            fill={enabled ? "var(--fill-0, #0F6BEB)" : "var(--fill-0, #DDDDDD)"}
          />
        </svg>
      </div>
    </button>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center p-1 transition-colors hover:opacity-70"
      aria-label="編輯訊息"
    >
      <Edit className="h-5 w-5 text-[#0f6beb]" />
    </button>
  );
}

function ResponseTableRow({ item, onToggleStatus, onEdit }: { item: AutoResponse; onToggleStatus: (id: string) => void; onEdit: (id: string) => void }) {
  return (
    <tr className="border-b border-[#e5e7eb] text-[14px] leading-[1.5] text-[#383838] hover:bg-[#f9fafb] transition-colors">
      <td className={`${COLUMN_WIDTH_CLASSES.content} px-4 py-4 align-top text-left break-words`}>
        {item.name}
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.responseType} px-4 py-4 align-top text-left whitespace-nowrap overflow-hidden text-ellipsis`}>
        {item.description}
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.keywords} px-4 py-4 align-top text-left`}>
        <KeywordTags keywords={item.keywords} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.status} px-4 py-4 align-top text-left`}>
        <StatusToggle enabled={item.status} onClick={() => onToggleStatus(item.id)} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.platform} px-4 py-4 align-top text-left whitespace-nowrap`}>
        {item.platform}
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.triggerCount} px-4 py-4 align-top text-left whitespace-nowrap`}>
        {item.triggerCount || '-'}
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.lastModified} px-4 py-4 align-top text-left whitespace-nowrap`}>
        {item.lastModified}
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.edit} px-4 py-4 align-top text-left`}>
        <EditButton onClick={() => onEdit(item.id)} />
      </td>
    </tr>
  );
}

export function AutoResponseTable({ responses, onToggleStatus, onEdit }: AutoResponseTableProps) {
  return (
    <>
      <DataCount count={responses.length} />
      <div className="bg-white rounded-[12px] overflow-hidden shadow-sm border border-[#e5e7eb]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#f9fafb]">
              <tr className="border-b border-[#e5e7eb]">
                <th className={`${COLUMN_WIDTH_CLASSES.content} px-4 py-3 text-left font-['Noto_Sans_TC:Regular',_sans-serif] font-medium text-[14px] text-[#6b7280] whitespace-nowrap`}>
                  訊息內容
                </th>
                <th className={`${COLUMN_WIDTH_CLASSES.responseType} px-4 py-3 text-left font-['Noto_Sans_TC:Regular',_sans-serif] font-medium text-[14px] text-[#6b7280] whitespace-nowrap`}>
                  回應類型
                </th>
                <th className={`${COLUMN_WIDTH_CLASSES.keywords} px-4 py-3 text-left font-['Noto_Sans_TC:Regular',_sans-serif] font-medium text-[14px] text-[#6b7280] whitespace-nowrap`}>
                  <div className="flex items-center justify-start">
                    <span>關鍵字標籤</span>
                    <Info className="h-4 w-4 text-[#0f6beb] ml-1" />
                    <SortIcon />
                  </div>
                </th>
                <th className={`${COLUMN_WIDTH_CLASSES.status} px-4 py-3 text-left font-['Noto_Sans_TC:Regular',_sans-serif] font-medium text-[14px] text-[#6b7280] whitespace-nowrap`}>
                  <div className="flex items-center justify-start">
                    <span>狀態</span>
                    <SortIcon />
                  </div>
                </th>
                <th className={`${COLUMN_WIDTH_CLASSES.platform} px-4 py-3 text-left font-['Noto_Sans_TC:Regular',_sans-serif] font-medium text-[14px] text-[#6b7280] whitespace-nowrap`}>
                  <div className="flex items-center justify-start">
                    <span>平台</span>
                    <SortIcon />
                  </div>
                </th>
                <th className={`${COLUMN_WIDTH_CLASSES.triggerCount} px-4 py-3 text-left font-['Noto_Sans_TC:Regular',_sans-serif] font-medium text-[14px] text-[#6b7280] whitespace-nowrap`}>
                  <div className="flex items-center justify-start">
                    <span>觸發次數</span>
                    <Info className="h-4 w-4 text-[#0f6beb] ml-1" />
                    <SortIcon />
                  </div>
                </th>
                <th className={`${COLUMN_WIDTH_CLASSES.lastModified} px-4 py-3 text-left font-['Noto_Sans_TC:Regular',_sans-serif] font-medium text-[14px] text-[#6b7280] whitespace-nowrap`}>
                  <div className="flex items-center justify-start">
                    <span>建立時間</span>
                    <SortIcon />
                  </div>
                </th>
                <th className={`${COLUMN_WIDTH_CLASSES.edit} px-4 py-3 text-left font-['Noto_Sans_TC:Regular',_sans-serif] font-medium text-[14px] text-[#6b7280] whitespace-nowrap`}>
                  編輯
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {responses.map((item) => (
                <ResponseTableRow
                  key={item.id}
                  item={item}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEdit}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
