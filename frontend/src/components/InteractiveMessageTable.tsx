import svgPaths from "../imports/svg-kh0dbookih";

export interface Message {
  id: string;
  title: string;
  tags: string[];
  platform: string;
  status: string;
  sentCount: string;
  openCount: string;
  clickCount: string;
  sendTime: string;
}

interface InteractiveMessageTableProps {
  messages: Message[];
  onEdit: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const COLUMN_WIDTH_CLASSES = {
  title: "min-w-[240px] max-w-[320px]",
  tags: "min-w-[200px] max-w-[280px]",
  platform: "min-w-[100px] w-[120px]",
  status: "min-w-[120px] w-[140px]",
  sentCount: "min-w-[100px] w-[120px]",
  openCount: "min-w-[120px] w-[140px]",
  clickCount: "min-w-[100px] w-[130px]",
  sendTime: "min-w-[160px] w-[180px]",
  edit: "w-[50px] shrink-0",
  detail: "w-[70px] shrink-0",
} as const;

const STATUS_STYLES: Record<string, { text: string; bg: string; border: string; icon?: "success" | "clock" | "draft" }> = {
  已發送: {
    text: "text-[#1f7a39]",
    bg: "bg-[#e8f9ef]",
    border: "border-[#b9ebc8]",
    icon: "success",
  },
  已排程: {
    text: "text-[#0f6beb]",
    bg: "bg-[#f0f6ff]",
    border: "border-[#c8ddff]",
    icon: "clock",
  },
  草稿: {
    text: "text-[#6e6e6e]",
    bg: "bg-[#f5f5f5]",
    border: "border-[#dddddd]",
    icon: "draft",
  },
};

const TAGS_PER_ROW = 3;

function MessageTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <span className="text-[14px] text-[#6e6e6e]">—</span>;
  }

  // Limit displayed tags to prevent excessive row height
  const maxDisplayTags = 4;
  const displayTags = tags.slice(0, maxDisplayTags);
  const remainingCount = tags.length - maxDisplayTags;

  const rows: string[][] = [];
  for (let i = 0; i < displayTags.length; i += TAGS_PER_ROW) {
    rows.push(displayTags.slice(i, i + TAGS_PER_ROW));
  }

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {rows.map((rowTags, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex flex-wrap gap-2">
          {rowTags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-[8px] bg-[#f0f6ff] px-2.5 py-1 text-[14px] leading-[1.4] text-[#0f6beb] whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
          {rowIndex === rows.length - 1 && remainingCount > 0 && (
            <span
              className="inline-block rounded-[8px] bg-[#f5f5f5] px-2.5 py-1 text-[14px] leading-[1.4] text-[#6e6e6e] whitespace-nowrap"
            >
              +{remainingCount}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    text: "text-[#383838]",
    bg: "bg-[#f5f5f5]",
    border: "border-[#dddddd]",
  };

  const renderIcon = () => {
    if (style.icon === "success") {
      return (
        <svg className="block size-[16px]" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d={svgPaths.p36cd5f00} fill="#00C853" />
        </svg>
      );
    }

    if (style.icon === "clock") {
      return (
        <svg className="block size-[16px]" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="#0F6BEB" strokeWidth="1.2" fill="none" />
          <path d="M8 4.5V8L10.5 10" stroke="#0F6BEB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (style.icon === "draft") {
      return (
        <svg className="block size-[16px]" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M11.5 2L14 4.5L5 13.5L2 14L2.5 11L11.5 2Z" stroke="#6E6E6E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M10 3.5L12.5 6" stroke="#6E6E6E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    return null;
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[14px] leading-[1.5] ${style.text} ${style.bg} ${style.border}`}
    >
      <span className="flex items-center justify-center w-[16px] h-[16px] shrink-0">
        {renderIcon()}
      </span>
      <span className="whitespace-nowrap">{status}</span>
    </span>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-[8px] p-2 text-[#0f6beb] transition-colors hover:bg-[#f0f6ff]"
      aria-label="編輯訊息"
    >
      <svg className="block size-4" viewBox="0 0 17 17" fill="none" aria-hidden="true">
        <g>
          <path d={svgPaths.p15419680} fill="#0F6BEB" />
          <path d={svgPaths.p239e3d00} fill="#0F6BEB" />
        </g>
      </svg>
    </button>
  );
}

function DetailButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-[14px] leading-[1.5] text-[#0f6beb] transition-opacity hover:opacity-70"
    >
      詳細
      <svg className="size-4 rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d={svgPaths.pbafd480} fill="#0F6BEB" />
      </svg>
    </button>
  );
}

function MessageRow({ message, onEdit, onViewDetails }: { message: Message; onEdit: () => void; onViewDetails: () => void }) {
  return (
    <tr className="border-b border-[#dddddd] text-[14px] leading-[1.5] text-[#383838] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
      <td className={`${COLUMN_WIDTH_CLASSES.title} px-4 py-5 align-top`} style={{ textAlign: 'left' }}>
        <span className="block break-words line-clamp-2">{message.title}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.tags} px-4 py-5 align-top`} style={{ textAlign: 'left' }}>
        <MessageTags tags={message.tags} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.platform} px-3 py-5 align-top`} style={{ textAlign: 'left' }}>
        <span className="block truncate">{message.platform}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.status} px-3 py-5 align-top`} style={{ textAlign: 'left' }}>
        <StatusBadge status={message.status} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.sentCount} px-3 py-5 align-top`} style={{ textAlign: 'left' }}>
        <span className="block">{message.sentCount}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.openCount} px-3 py-5 align-top`} style={{ textAlign: 'left' }}>
        <span className="block">{message.openCount}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.clickCount} px-3 py-5 align-top`} style={{ textAlign: 'left' }}>
        <span className="block">{message.clickCount}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.sendTime} px-3 py-5 align-top`} style={{ textAlign: 'left' }}>
        <span className="block whitespace-nowrap">{message.sendTime}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.edit} px-1 py-5 align-top`} style={{ textAlign: 'center' }}>
        <EditButton onClick={onEdit} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.detail} px-1 py-5 align-top`} style={{ textAlign: 'center' }}>
        <DetailButton onClick={onViewDetails} />
      </td>
    </tr>
  );
}

export default function InteractiveMessageTable({ messages, onEdit, onViewDetails }: InteractiveMessageTableProps) {
  if (messages.length === 0) {
    return (
      <div className="w-full rounded-[16px] border border-dashed border-[#cbd5f5] bg-white p-10 text-center">
        <p className="text-[16px] text-[#6e6e6e]">沒有找到符合條件的訊息</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-hidden overflow-x-auto">
      <div className="inline-block min-w-full rounded-[16px] border border-[#dddddd] bg-white shadow-sm">
        <table className="w-full min-w-[1400px] border-collapse table-fixed" style={{ textAlign: 'left' }}>
          <thead className="bg-[#fafbfc] text-[14px] leading-[1.5] text-[#383838]">
            <tr className="border-b-2 border-[#e5e7eb]">
              <th className={`${COLUMN_WIDTH_CLASSES.title} px-4 py-4 font-medium`} style={{ textAlign: 'left', fontSize: '16px' }}>訊息標題</th>
              <th className={`${COLUMN_WIDTH_CLASSES.tags} px-4 py-4 font-medium`} style={{ textAlign: 'left', fontSize: '16px' }}>標籤</th>
              <th className={`${COLUMN_WIDTH_CLASSES.platform} px-3 py-4 font-medium`} style={{ textAlign: 'left', fontSize: '16px' }}>平台</th>
              <th className={`${COLUMN_WIDTH_CLASSES.status} px-3 py-4 font-medium`} style={{ textAlign: 'left', fontSize: '16px' }}>狀態</th>
              <th className={`${COLUMN_WIDTH_CLASSES.sentCount} px-3 py-4 font-medium`} style={{ textAlign: 'left', fontSize: '16px' }}>發送人數</th>
              <th className={`${COLUMN_WIDTH_CLASSES.openCount} px-3 py-4 font-medium`} style={{ textAlign: 'left', fontSize: '16px' }}>已開啟次數</th>
              <th className={`${COLUMN_WIDTH_CLASSES.clickCount} px-3 py-4 font-medium`} style={{ textAlign: 'left', fontSize: '16px' }}>點擊次數</th>
              <th className={`${COLUMN_WIDTH_CLASSES.sendTime} px-3 py-4 font-medium`} style={{ textAlign: 'left', fontSize: '16px' }}>發送時間</th>
              <th className={`${COLUMN_WIDTH_CLASSES.edit} px-1 py-4 font-medium`} style={{ textAlign: 'center', fontSize: '16px' }} aria-label="編輯" />
              <th className={`${COLUMN_WIDTH_CLASSES.detail} px-1 py-4 font-medium`} style={{ textAlign: 'center', fontSize: '16px' }} aria-label="詳細" />
            </tr>
          </thead>
          <tbody className="bg-white">
            {messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                onEdit={() => onEdit(message.id)}
                onViewDetails={() => onViewDetails(message.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
