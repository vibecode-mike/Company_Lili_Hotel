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
  title: "min-w-[280px]",
  tags: "min-w-[280px]",
  platform: "min-w-[140px]",
  status: "min-w-[140px]",
  sentCount: "min-w-[140px]",
  openCount: "min-w-[160px]",
  clickCount: "min-w-[160px]",
  sendTime: "min-w-[180px]",
  edit: "w-[80px]",
  detail: "w-[90px]",
} as const;

const STATUS_STYLES: Record<string, { text: string; bg: string; border: string; icon?: "success" }> = {
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
  },
  草稿: {
    text: "text-[#6e6e6e]",
    bg: "bg-[#f5f5f5]",
    border: "border-[#dddddd]",
  },
};

const TAGS_PER_ROW = 2;

function MessageTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <span className="text-[14px] text-[#6e6e6e]">—</span>;
  }

  const rows: string[][] = [];
  for (let i = 0; i < tags.length; i += TAGS_PER_ROW) {
    rows.push(tags.slice(i, i + TAGS_PER_ROW));
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {rows.map((rowTags, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex flex-wrap gap-2">
          {rowTags.map((tag) => (
            <span
              key={tag}
              className="rounded-[8px] bg-[#f0f6ff] px-2 py-1 text-[16px] leading-[1.5] text-[#0f6beb]"
            >
              {tag}
            </span>
          ))}
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
    return null;
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[14px] leading-[1.5] ${style.text} ${style.bg} ${style.border}`}
    >
      {renderIcon()}
      <span>{status}</span>
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
    <tr className="border-b border-[#dddddd] text-[14px] leading-[1.5] text-[#383838] last:border-b-0">
      <td className={`${COLUMN_WIDTH_CLASSES.title} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block truncate">{message.title}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.tags} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <MessageTags tags={message.tags} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.platform} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block truncate">{message.platform}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.status} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <StatusBadge status={message.status} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.sentCount} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block">{message.sentCount}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.openCount} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block">{message.openCount}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.clickCount} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block">{message.clickCount}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.sendTime} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block">{message.sendTime}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.edit} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <EditButton onClick={onEdit} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.detail} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
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
    <div className="w-full overflow-x-auto">
      <div className="min-w-full overflow-hidden rounded-[16px] border border-[#dddddd] bg-white">
        <table className="w-full min-w-[1100px] border-collapse" style={{ textAlign: 'left' }}>
          <thead className="bg-white text-[14px] leading-[1.5] text-[#383838]">
            <tr className="border-b border-[#dddddd]">
              <th className={`${COLUMN_WIDTH_CLASSES.title} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }}>訊息標題</th>
              <th className={`${COLUMN_WIDTH_CLASSES.tags} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }}>標籤</th>
              <th className={`${COLUMN_WIDTH_CLASSES.platform} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }}>平台</th>
              <th className={`${COLUMN_WIDTH_CLASSES.status} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }}>狀態</th>
              <th className={`${COLUMN_WIDTH_CLASSES.sentCount} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }}>發送人數</th>
              <th className={`${COLUMN_WIDTH_CLASSES.openCount} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }}>已開啟次數</th>
              <th className={`${COLUMN_WIDTH_CLASSES.clickCount} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }}>點擊次數</th>
              <th className={`${COLUMN_WIDTH_CLASSES.sendTime} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }}>發送時間</th>
              <th className={`${COLUMN_WIDTH_CLASSES.edit} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }} aria-label="編輯" />
              <th className={`${COLUMN_WIDTH_CLASSES.detail} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '18px' }} aria-label="詳細" />
            </tr>
          </thead>
          <tbody>
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
