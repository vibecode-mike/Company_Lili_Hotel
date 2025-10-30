import { useMemo, useState, useEffect, KeyboardEvent } from "react";
import svgPaths from "./svg-wbwsye31ry";
import SearchContainer from "./Container-6001-1508";
import { getMembers, MemberListItem, TagInfo } from "../../services/memberService";

export interface Member {
  id: number;
  username: string; // LINE display name
  realName: string; // first_name + last_name
  tags: string[];
  phone: string;
  email: string;
  createTime: string;
  lastChatTime: string;
}

interface MemberMainContainerProps {
  onAddMember?: () => void;
}

type SortField = "realName" | "tags" | "phone" | "email" | "createTime" | "lastChatTime";

// 轉換後端數據為前端格式
function transformMemberData(item: MemberListItem): Member {
  const firstName = item.first_name || "";
  const lastName = item.last_name || "";
  const realName = `${firstName} ${lastName}`.trim() || item.line_display_name || "未設定";

  return {
    id: item.id,
    username: item.line_display_name || "未設定",
    realName,
    tags: item.tags.map(tag => tag.name),
    phone: item.phone || "-",
    email: item.email || "-",
    createTime: formatDateTime(item.created_at),
    lastChatTime: formatDateTime(item.last_interaction_at),
  };
}

// 格式化日期時間
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch {
    return "-";
  }
}

const COLUMN_WIDTH_CLASSES = {
  username: "min-w-[260px]",
  realName: "min-w-[160px]",
  tags: "min-w-[320px]",
  phone: "min-w-[160px]",
  email: "min-w-[220px]",
  createTime: "min-w-[160px]",
  lastChatTime: "min-w-[200px]",
  message: "w-[56px]",
  detail: "w-[80px]",
} as const;

function BreadcrumbModule() {
  return (
    <div className="box-border flex items-center gap-1 p-1" data-name="Breadcrumb Module">
      <div className="flex items-center justify-center">
        <p className="font-['Noto_Sans_TC:Medium',sans-serif] text-[14px] font-medium leading-[1.5] text-[#383838] whitespace-pre">
          會員管理
        </p>
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="relative w-full" data-name="Breadcrumb">
      <div className="flex flex-row items-center">
        <div className="box-border flex w-full items-center gap-1 px-[40px] pb-0 pt-[48px]">
          <BreadcrumbModule />
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex w-full flex-col items-start gap-2 text-left">
      <h1 className="font-['Noto_Sans_TC:Regular',sans-serif] text-[32px] leading-[1.5] text-[#383838] text-left">
        會員管理
      </h1>
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#6e6e6e] text-left">
        管理會員資料與一對一訊息，查看互動內容與紀錄
      </p>
    </div>
  );
}

function AddMemberButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[48px] min-w-[72px] whitespace-nowrap rounded-[16px] bg-[#242424] px-[12px] py-[8px] text-[16px] text-white transition-colors hover:bg-[#383838]"
    >
      新增會員
    </button>
  );
}

function ActionBar({
  searchValue,
  onSearchChange,
  onSearch,
  onClearSearch,
  onAddMember,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onAddMember?: () => void;
}) {
  return (
    <div className="flex w-full gap-2 items-center justify-end">
      <SearchContainer value={searchValue} onChange={onSearchChange} onSearch={onSearch} onClear={onClearSearch} />
      <AddMemberButton onClick={onAddMember} />
    </div>
  );
}

function MemberCount({ count }: { count: number }) {
  return (
    <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#6e6e6e]">
      共 {count} 筆
    </p>
  );
}

function AvatarIcon() {
  return (
    <div className="flex size-[60px] items-center justify-center rounded-[60px] bg-[#f6f9fd]">
      <div className="flex size-[28px] items-center justify-center rounded-[28px] bg-[#edf0f8]">
        <svg className="block size-[18.667px]" fill="none" viewBox="0 0 19 19" aria-hidden="true">
          <path d={svgPaths.p17f8c200} fill="#383838" />
        </svg>
      </div>
    </div>
  );
}

function MemberTags({ tags }: { tags: string[] }) {
  const rows: string[][] = [];
  for (let i = 0; i < tags.length; i += 2) {
    rows.push(tags.slice(i, i + 2));
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

function SortableHeader({ field, onSortChange, children }: { field: SortField; onSortChange: (field: SortField) => void; children: React.ReactNode }) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSortChange(field);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSortChange(field)}
      onKeyDown={handleKeyDown}
      className="flex w-full cursor-pointer select-none items-center justify-start text-left text-[#383838] outline-none focus-visible:ring-2 focus-visible:ring-[#0f6beb]"
    >
      {children}
    </div>
  );
}

function MessageButton() {
  return (
    <button
      type="button"
      className="flex size-[28px] items-center justify-center rounded-[8px] transition-colors hover:bg-[#f0f6ff]"
      aria-label="開啟一對一訊息"
    >
      <svg className="block size-[24px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={svgPaths.pc989200} fill="#0F6BEB" />
      </svg>
    </button>
  );
}

function DetailButton() {
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-[14px] leading-[1.5] text-[#0f6beb] transition-opacity hover:opacity-70"
    >
      詳細
      <svg className="size-4 rotate-180" viewBox="0 0 8 5" fill="none" aria-hidden="true">
        <path d={svgPaths.p1c38d100} fill="#0F6BEB" />
      </svg>
    </button>
  );
}

function MembersTableRow({ member }: { member: Member }) {
  return (
    <tr className="border-b border-[#dddddd] text-[14px] leading-[1.5] text-[#383838] last:border-b-0">
      <td className={`${COLUMN_WIDTH_CLASSES.username} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <div className="flex items-center gap-3">
          <AvatarIcon />
          <span className="block truncate">{member.username}</span>
        </div>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.realName} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block truncate">{member.realName}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.tags} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <MemberTags tags={member.tags} />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.phone} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block">{member.phone}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.email} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block truncate">{member.email}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.createTime} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <span className="block">{member.createTime}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.lastChatTime} px-4 py-4 align-middle whitespace-nowrap`} style={{ textAlign: 'left' }}>
        <span className="block">{member.lastChatTime}</span>
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.message} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <MessageButton />
      </td>
      <td className={`${COLUMN_WIDTH_CLASSES.detail} px-4 py-4 align-middle`} style={{ textAlign: 'left' }}>
        <DetailButton />
      </td>
    </tr>
  );
}

function MembersTable({ members, onSortChange }: { members: Member[]; onSortChange: (field: SortField) => void }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full overflow-hidden rounded-[16px] border border-[#dddddd] bg-white">
        <table className="w-full min-w-[1100px] border-collapse" style={{ textAlign: 'left' }}>
          <thead className="bg-white text-[14px] leading-[1.5] text-[#383838]">
            <tr className="border-b border-[#dddddd]">
              <th className={`${COLUMN_WIDTH_CLASSES.username} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '16px' }}>會員</th>
              <th className={`${COLUMN_WIDTH_CLASSES.realName} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '16px' }}>
                <SortableHeader field="realName" onSortChange={onSortChange}>
                  <span>姓名</span>
                </SortableHeader>
              </th>
              <th className={`${COLUMN_WIDTH_CLASSES.tags} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '16px' }}>
                <SortableHeader field="tags" onSortChange={onSortChange}>
                  <span>標籤</span>
                </SortableHeader>
              </th>
              <th className={`${COLUMN_WIDTH_CLASSES.phone} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '16px' }}>
                <SortableHeader field="phone" onSortChange={onSortChange}>
                  <span>手機號碼</span>
                </SortableHeader>
              </th>
              <th className={`${COLUMN_WIDTH_CLASSES.email} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '16px' }}>
                <SortableHeader field="email" onSortChange={onSortChange}>
                  <span>Email</span>
                </SortableHeader>
              </th>
              <th className={`${COLUMN_WIDTH_CLASSES.createTime} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '16px' }}>
                <SortableHeader field="createTime" onSortChange={onSortChange}>
                  <span>建立時間</span>
                </SortableHeader>
              </th>
              <th className={`${COLUMN_WIDTH_CLASSES.lastChatTime} px-4 py-[18px] font-normal whitespace-nowrap`} style={{ textAlign: 'left', fontSize: '16px' }}>
                <SortableHeader field="lastChatTime" onSortChange={onSortChange}>
                  <span>最近聊天時間</span>
                </SortableHeader>
              </th>
              <th className={`${COLUMN_WIDTH_CLASSES.message} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '16px' }} aria-label="訊息" />
              <th className={`${COLUMN_WIDTH_CLASSES.detail} px-4 py-[18px] font-normal`} style={{ textAlign: 'left', fontSize: '16px' }} aria-label="詳細" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MembersTableRow key={member.id} member={member} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MainContent({
  searchValue,
  onSearchChange,
  onSearch,
  onClearSearch,
  filteredMembers,
  onSortChange,
  onAddMember,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  filteredMembers: Member[];
  onSortChange: (field: SortField) => void;
  onAddMember?: () => void;
}) {
  return (
    <div className="relative w-full">
      <div className="box-border flex w-full flex-col gap-[24px] px-[40px] pb-[40px] pt-[16px]">
        <PageHeader />
        <ActionBar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSearch={onSearch}
          onClearSearch={onClearSearch}
          onAddMember={onAddMember}
        />
        <div className="flex w-full flex-col gap-2 items-start">
          <MemberCount count={filteredMembers.length} />
          <MembersTable members={filteredMembers} onSortChange={onSortChange} />
        </div>
      </div>
    </div>
  );
}

export default function MainContainer({ onAddMember }: MemberMainContainerProps = {}) {
  const [searchValue, setSearchValue] = useState("");
  const [appliedSearchValue, setAppliedSearchValue] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("lastChatTime");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // 獲取會員數據
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await getMembers({
          page: 1,
          page_size: 1000, // 獲取所有數據以便前端過濾排序
        });

        if (response.data && response.data.data) {
          const transformedMembers = response.data.data.items.map(transformMemberData);
          setMembers(transformedMembers);
        }
      } catch (error) {
        console.error("獲取會員數據失敗:", error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const parseDateTime = (dateStr: string): number => {
    if (dateStr === "-") return 0;
    const parts = dateStr.split(" ");
    if (parts.length !== 2) return 0;
    const [datePart, timePart] = parts;
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute).getTime();
  };

  const filteredMembers = useMemo(() => {
    let result = members;

    if (appliedSearchValue.trim()) {
      const searchLower = appliedSearchValue.toLowerCase();
      result = result.filter((member) => {
        return (
          member.username.toLowerCase().includes(searchLower) ||
          member.realName.toLowerCase().includes(searchLower) ||
          member.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          member.phone.includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower)
        );
      });
    }

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case "realName":
          return a.realName.localeCompare(b.realName);
        case "tags":
          return (a.tags[0] || "").localeCompare(b.tags[0] || "");
        case "phone":
          return a.phone.localeCompare(b.phone);
        case "email":
          return a.email.localeCompare(b.email);
        case "createTime":
          return parseDateTime(b.createTime) - parseDateTime(a.createTime);
        case "lastChatTime":
          return parseDateTime(b.lastChatTime) - parseDateTime(a.lastChatTime);
        default:
          return 0;
      }
    });

    return sorted;
  }, [members, appliedSearchValue, sortBy]);

  const handleSearch = () => {
    setAppliedSearchValue(searchValue);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setAppliedSearchValue("");
    setSortBy("lastChatTime");
  };

  const handleSortChange = (field: SortField) => {
    setSortBy(field);
  };

  if (loading) {
    return (
      <div className="flex size-full flex-col items-start bg-slate-50">
        <Breadcrumb />
        <div className="flex w-full items-center justify-center p-40">
          <p className="text-[16px] text-[#6e6e6e]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col items-start bg-slate-50">
      <Breadcrumb />
      <MainContent
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        filteredMembers={filteredMembers}
        onSortChange={handleSortChange}
        onAddMember={onAddMember}
      />
    </div>
  );
}
