import React, { useState, memo, useCallback, useMemo } from "react";
import Sidebar from "./Sidebar";
import ChatFAB from "./ChatFAB";
import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import svgPaths from "../imports/svg-icons-common";
import togglePaths from "../imports/svg-wbwsye31ry";
import ButtonEdit from "../imports/ButtonEdit";
import {
  FacilityEditModal,
  FacilityFaqDraft,
} from "./chatbot/AIChatbotEditModal";

// Facility-matched placeholder images via picsum (seed = stable, unique per facility)
const img = (seed: string) => `https://picsum.photos/seed/${seed}/110/74`;

interface FacilitiesContentProps {
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToAIChatbot?: () => void;
}

// ------- Types -------
interface FacilityRecord {
  id: string;
  name: string;
  image: string;
  hours: string;
  fee: string;
  description: string;
  memberTags: string[];
  lastUpdated: string;
  published: boolean;
}

type SortField = "hours" | "fee" | "memberTags" | "lastUpdated" | "published";
type SortDir = "asc" | "desc";

// ------- Mock Data -------
const MOCK_FACILITIES: FacilityRecord[] = [
  {
    id: "1",
    name: "無邊際泳池",
    image: img("infinity-pool"),
    hours: "06:00 – 22:00",
    fee: "免費",
    description: "270° 環湖景觀，全年開放加熱恆溫水池",
    memberTags: ["景觀首選", "VIP"],
    lastUpdated: "2026-10-02 22:47",
    published: true,
  },
  {
    id: "2",
    name: "SPA 水療中心",
    image: img("spa-therapy"),
    hours: "10:00 – 21:00",
    fee: "NT$1,800 / 次",
    description: "提供芳療、熱石、深層舒壓等多款療程",
    memberTags: ["蜜月", "頂級", "送禮"],
    lastUpdated: "2026-09-11 00:47",
    published: true,
  },
  {
    id: "3",
    name: "全方位健身房",
    image: img("gym-fitness"),
    hours: "05:30 – 23:00",
    fee: "免費",
    description: "設備齊全，配備跑步機、重訓區、瑜珈空間",
    memberTags: ["商務房", "長住客"],
    lastUpdated: "2026-09-11 20:47",
    published: true,
  },
  {
    id: "4",
    name: "湖畔餐廳",
    image: img("lake-restaurant"),
    hours: "07:00 – 22:00",
    fee: "依點餐計費",
    description: "供應在地食材早午餐及精緻晚餐，含素食選項",
    memberTags: ["家庭", "浪漫約會", "商務房"],
    lastUpdated: "2026-07-31 22:47",
    published: true,
  },
  {
    id: "5",
    name: "兒童探索樂園",
    image: img("kids-playground"),
    hours: "09:00 – 20:00",
    fee: "免費",
    description: "室內外遊樂設施，含安全看護服務",
    memberTags: ["家庭", "親子遊"],
    lastUpdated: "2026-06-02 22:47",
    published: true,
  },
  {
    id: "6",
    name: "商務貴賓室",
    image: img("business-lounge"),
    hours: "08:00 – 20:00",
    fee: "免費（商務房型）",
    description: "高速 Wi-Fi、投影設備、私人會議室可預約",
    memberTags: ["商務房", "KOL"],
    lastUpdated: "2026-05-13 22:47",
    published: false,
  },
  {
    id: "7",
    name: "溫泉湯屋",
    image: img("onsen-hotspring"),
    hours: "07:00 – 23:00",
    fee: "NT$600 / 小時",
    description: "碳酸氫鈉泉質，附私人湯屋及備品組",
    memberTags: ["蜜月", "溫泉房", "頂級"],
    lastUpdated: "2026-04-02 22:47",
    published: true,
  },
  {
    id: "8",
    name: "戶外停車場",
    image: img("parking-lot"),
    hours: "24 小時",
    fee: "免費",
    description: "提供 200 個車位，含無障礙及電動車充電樁",
    memberTags: ["自駕遊"],
    lastUpdated: "2026-03-02 22:47",
    published: true,
  },
];

// ------- Sub-components -------

const TagChip = memo(function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-[4px] py-[4px] rounded-[8px] bg-[#f0f6ff] text-[#0f6beb] text-[16px] leading-[1.5] whitespace-nowrap font-['Noto_Sans_TC',sans-serif] font-normal">
      {label}
    </span>
  );
});

const Toggle = memo(function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-center cursor-pointer border-none bg-transparent p-0"
    >
      <div className="relative size-[40px]">
        <svg className="block size-full" fill="none" viewBox="0 0 40 40">
          <g clipPath="url(#clip0_toggle_facilities)">
            <g />
            <path
              d={checked ? togglePaths.p13e42a00 : togglePaths.p3ed4d200}
              fill={checked ? "#0F6BEB" : "#E5E7EB"}
              className="transition-all duration-300 ease-in-out"
            />
          </g>
          <defs>
            <clipPath id="clip0_toggle_facilities">
              <rect fill="white" height="40" width="40" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </button>
  );
});

const SortIcon = memo(function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
}) {
  const isActive = sortField === field;
  const icon = !isActive ? "⇅" : sortDir === "asc" ? "↑" : "↓";
  return (
    <span
      className={`ml-[4px] text-[11px] select-none font-['PingFang_TC',sans-serif] ${
        isActive ? "text-[#0f6beb]" : "text-[#9ca3af]"
      }`}
    >
      {icon}
    </span>
  );
});

const TabButton = memo(function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      {active && (
        <div
          aria-hidden="true"
          className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none"
        />
      )}
      <div
        onClick={onClick}
        className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer transition-colors"
      >
        <p
          className={`basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${
            active ? "text-[#383838]" : "text-[#6e6e6e]"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
});

const IconSearch = memo(function IconSearch() {
  return (
    <div className="overflow-clip relative shrink-0 size-[32px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 32 32"
      >
        <path d={svgPaths.p2bfa9080} fill="#A8A8A8" />
      </svg>
    </div>
  );
});

const ArrowDownIcon = memo(function ArrowDownIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" viewBox="0 0 24 24">
        <path
          d="M6 9l6 6 6-6"
          stroke="#383838"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

const FilterOption = memo(function FilterOption({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative bg-white rounded-[16px] min-h-[48px] px-[8px] flex items-center shrink-0 cursor-pointer">
      <div className="flex gap-[8px] items-center pointer-events-none select-none">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] whitespace-nowrap">
          {value}
        </p>
        <ArrowDownIcon />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
});

// ------- Table Header Cell -------
interface ThProps {
  children: React.ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  field?: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort?: (field: SortField) => void;
  borderRight?: boolean;
  className?: string;
}

const Th = memo(function Th({
  children,
  width,
  align = "left",
  sortable = false,
  field,
  sortField,
  sortDir,
  onSort,
  borderRight = false,
  className = "",
}: ThProps) {
  const handleClick = () => {
    if (sortable && field && onSort) onSort(field);
  };
  return (
    <th
      onClick={handleClick}
      style={width ? { width } : undefined}
      className={`px-[12px] py-[16px] text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap select-none bg-white border-b border-[#ddd] ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      } ${sortable ? "cursor-pointer hover:bg-[#f5f8ff] transition-colors duration-150" : ""} ${
        borderRight ? "border-r border-[#ddd]" : ""
      } ${className}`}
    >
      {children}
      {sortable && field && (
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      )}
    </th>
  );
});

// ------- Table Row -------
const TableRow = memo(function TableRow({
  record,
  isLast,
  onToggle,
  onEdit,
}: {
  record: FacilityRecord;
  isLast: boolean;
  onToggle: (id: string, v: boolean) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <tr
      className={`bg-white transition-colors duration-150 hover:bg-[#f5f8ff] group ${
        !isLast ? "[&>td]:border-b [&>td]:border-[#ddd]" : ""
      }`}
    >
      {/* 設施名稱 — thumbnail + name */}
      <td className="p-0 w-[220px]">
        <div className="flex items-center py-[12px] pl-[12px]">
          <img
            src={record.image}
            alt={record.name}
            className="shrink-0 rounded-[4px] object-cover"
            style={{ width: 110, height: 74 }}
          />
          <span className="px-[12px] text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] min-w-0 truncate">
            {record.name}
          </span>
        </div>
      </td>

      {/* 開放時間 */}
      <td className="px-[12px] py-[12px] w-[160px] text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] whitespace-nowrap">
        {record.hours}
      </td>

      {/* 費用 */}
      <td className="px-[12px] py-[12px] w-[180px] text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] whitespace-nowrap">
        {record.fee}
      </td>

      {/* 簡介 */}
      <td className="px-[12px] py-[12px] w-[240px] text-[14px] text-[#383838] font-['Inter',sans-serif] font-normal tracking-[0.22px] leading-[24px]">
        <span
          className="truncate block max-w-[216px]"
          title={record.description}
        >
          {record.description}
        </span>
      </td>

      {/* 會員標籤 */}
      <td className="px-[12px] py-[12px] w-[200px]">
        <div className="flex flex-wrap gap-[4px]">
          {record.memberTags.map((tag, i) => (
            <TagChip key={i} label={tag} />
          ))}
        </div>
      </td>

      {/* 最後更新 */}
      <td className="px-[12px] py-[12px] whitespace-nowrap text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5]">
        {record.lastUpdated}
      </td>

      {/* 啟用狀態 — 凍結欄 */}
      <td
        style={{
          width: 104,
          position: "sticky",
          right: 68,
          zIndex: 1,
          boxShadow: "inset 1px 0 0 #ddd",
        }}
        className="px-[12px] py-[12px] align-middle text-center bg-white"
      >
        <Toggle
          checked={record.published}
          onChange={(v) => onToggle(record.id, v)}
        />
      </td>

      {/* 動作 — 凍結欄 */}
      <td
        style={{ width: 68, position: "sticky", right: 0, zIndex: 1 }}
        className="px-[12px] py-[12px] align-middle text-center bg-white"
      >
        <ButtonEdit onClick={() => onEdit(record.id)} />
      </td>
    </tr>
  );
});

// ------- Facilities Data Table -------
const FacilitiesDataTable = memo(function FacilitiesDataTable({
  onChangeSource,
  sourceName,
}: {
  onChangeSource: () => void;
  sourceName: string;
}) {
  const [facilities, setFacilities] =
    useState<FacilityRecord[]>(MOCK_FACILITIES);
  const [filterType, setFilterType] = useState("全部");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingFacility, setEditingFacility] = useState<FacilityRecord | null>(
    null,
  );
  const [editDraft, setEditDraft] = useState<FacilityFaqDraft | null>(null);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDir("asc");
      return field;
    });
  }, []);

  const handleToggle = useCallback((id: string, value: boolean) => {
    setFacilities((prev) =>
      prev.map((r) => (r.id === id ? { ...r, published: value } : r)),
    );
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      const facility = facilities.find((r) => r.id === id);
      if (facility) {
        setEditingFacility(facility);
        setEditDraft({
          name: facility.name,
          imageUrl: facility.image,
          hours: facility.hours,
          fee: facility.fee,
          description: facility.description,
          memberTags: [...facility.memberTags],
        });
      }
    },
    [facilities],
  );

  const handleClearFilters = useCallback(() => {
    setFilterType("全部");
    setSearch("");
  }, []);

  const filtered = useMemo(() => {
    let list = facilities.filter((r) => {
      if (filterType === "已發佈" && !r.published) return false;
      if (filterType === "未發佈" && r.published) return false;
      if (
        search &&
        !r.name.includes(search) &&
        !r.description.includes(search) &&
        !r.memberTags.some((t) => t.includes(search))
      )
        return false;
      return true;
    });

    if (sortField) {
      list = [...list].sort((a, b) => {
        let av: string | number = 0;
        let bv: string | number = 0;
        switch (sortField) {
          case "hours":
            av = a.hours;
            bv = b.hours;
            break;
          case "fee":
            av = a.fee;
            bv = b.fee;
            break;
          case "memberTags":
            av = a.memberTags.length;
            bv = b.memberTags.length;
            break;
          case "lastUpdated":
            av = a.lastUpdated;
            bv = b.lastUpdated;
            break;
          case "published":
            av = a.published ? 1 : 0;
            bv = b.published ? 1 : 0;
            break;
        }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [facilities, filterType, search, sortField, sortDir]);

  const thProps = { sortField, sortDir, onSort: handleSort };

  return (
    <div className="flex flex-col gap-[16px] w-full">
      {/* Filter row */}
      <div className="flex flex-wrap gap-x-[8px] gap-y-[8px] items-center w-full">
        <div className="flex flex-col items-start pb-[2px] pt-px shrink-0">
          <p className="font-['Noto_Sans_TC',sans-serif] font-medium leading-[1.5] text-[#6e6e6e] text-[12px] whitespace-nowrap">
            篩選
          </p>
        </div>

        <FilterOption
          value={filterType}
          options={["全部", "已發佈", "未發佈"]}
          onChange={setFilterType}
        />

        {/* Search bar */}
        <div className="bg-white flex gap-[28px] items-center px-[12px] py-[8px] rounded-[16px] shrink-0 w-[292px]">
          <div className="flex flex-[1_0_0] gap-[4px] items-center min-w-0">
            <IconSearch />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="輸入搜尋"
              className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] flex-1 min-w-0 text-[#383838] text-[20px] bg-transparent border-none outline-none placeholder:text-[#ddd]"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="overflow-clip relative shrink-0 size-[24px] cursor-pointer hover:opacity-70 transition-opacity"
              type="button"
            >
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 24 24"
              >
                <path d={svgPaths.p3cde6900} fill="#DDDDDD" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={handleClearFilters}
          className="flex gap-[2px] items-center justify-center px-[8px] py-[8px] rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors"
          type="button"
        >
          <span className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#0f6beb] text-[16px] whitespace-nowrap">
            清除全部條件
          </span>
        </button>

        <div className="flex-1" />

        {/* 測試 */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-chatfab"))}
          className="bg-[#242424] flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors duration-150"
        >
          <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white text-center whitespace-nowrap">
            測試
          </span>
        </button>
      </div>

      {/* Record count + 變更 */}
      <div className="flex items-center pt-px w-full">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[14px] text-[#6e6e6e] whitespace-nowrap leading-[1.5]">
          共 {filtered.length} 筆，引用{" "}
          <span className="text-[#383838]">{sourceName}</span> 內容
        </p>
        <button
          type="button"
          onClick={onChangeSource}
          className="flex items-center px-[8px] cursor-pointer bg-transparent border-none"
        >
          <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[14px] text-[#0f6beb] leading-[1.5] whitespace-nowrap">
            變更
          </span>
        </button>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-[16px] ring-1 ring-[#ddd]">
        <table
          className="min-w-[1200px] w-full"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          <thead className="sticky top-0 z-[3]">
            <tr className="bg-white [&>th]:border-b [&>th]:border-[#ddd]">
              <th className="px-[12px] py-[16px] text-left text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap bg-white border-b border-[#ddd] w-[220px]">
                設施名稱
              </th>

              <Th width={160} sortable field="hours" {...thProps}>
                開放時間
              </Th>

              <Th width={180} sortable field="fee" {...thProps}>
                費用
              </Th>

              <th className="px-[12px] py-[16px] text-left text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap bg-white border-b border-[#ddd] w-[240px]">
                簡介
              </th>

              <Th width={200} sortable field="memberTags" {...thProps}>
                會員標籤
              </Th>

              <Th width={134} sortable field="lastUpdated" {...thProps}>
                最後更新
              </Th>

              {/* 啟用狀態 — 凍結欄 */}
              <th
                onClick={() => handleSort("published")}
                style={{
                  width: 104,
                  position: "sticky",
                  right: 68,
                  zIndex: 2,
                  boxShadow: "inset 1px 0 0 #ddd",
                }}
                className="px-[12px] py-[16px] text-center text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap select-none bg-white border-b border-[#ddd] cursor-pointer hover:bg-[#f5f8ff] transition-colors duration-150"
              >
                啟用狀態
                <SortIcon
                  field="published"
                  sortField={sortField}
                  sortDir={sortDir}
                />
              </th>

              {/* 動作 — 凍結欄 */}
              <th
                style={{ width: 68, position: "sticky", right: 0, zIndex: 2 }}
                className="px-[12px] py-[16px] text-center text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap bg-white border-b border-[#ddd]"
              >
                動作
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-[12px] py-[40px] text-center text-[14px] text-[#6e6e6e] font-['Noto_Sans_TC',sans-serif]"
                >
                  無符合條件的資料
                </td>
              </tr>
            ) : (
              filtered.map((record, idx) => (
                <TableRow
                  key={record.id}
                  record={record}
                  isLast={idx === filtered.length - 1}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 編輯設施彈窗 */}
      {editingFacility && editDraft && (
        <FacilityEditModal
          draft={editDraft}
          hasFaq={Boolean(
            editDraft.description ||
            editDraft.hours ||
            editDraft.memberTags.length > 0,
          )}
          onClose={() => {
            setEditingFacility(null);
            setEditDraft(null);
          }}
          onChange={setEditDraft}
          onSave={(draft) => {
            // 只存資料；modal 由 SaveSuccessDialog 的按鈕關閉
            setFacilities((prev) =>
              prev.map((r) =>
                r.id === editingFacility.id
                  ? {
                      ...r,
                      name: draft.name,
                      image: draft.imageUrl,
                      hours: draft.hours,
                      fee: draft.fee,
                      description: draft.description,
                      memberTags: draft.memberTags,
                      lastUpdated: new Date()
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " "),
                    }
                  : r,
              ),
            );
          }}
          onDelete={() => {
            // 無 PMS → 整筆刪除
            setFacilities((prev) =>
              prev.filter((r) => r.id !== editingFacility.id),
            );
            setEditingFacility(null);
            setEditDraft(null);
          }}
        />
      )}
    </div>
  );
});

// ------- 資料來源 Tab -------
type DataSourceRow = {
  type: string;
  statusLabel: string;
  statusColor: "green" | "gray";
  lastUpdated: string;
  lastPublished: string;
  enabled: boolean;
  enabledDisabled?: boolean;
};

const DATA_SOURCES_FACILITIES: DataSourceRow[] = [
  {
    type: "自訂 FAQ",
    statusLabel: "已儲存",
    statusColor: "green",
    lastUpdated: "2026-03-02 22:47",
    lastPublished: "2026-03-02 22:47",
    enabled: true,
  },
];

const DataSourceTableRow = memo(function DataSourceTableRow({
  row,
  isLast,
  onToggle,
}: {
  row: DataSourceRow;
  isLast: boolean;
  onToggle: (type: string, v: boolean) => void;
}) {
  return (
    <tr
      className={`bg-white transition-colors hover:bg-[#f5f8ff] group ${
        !isLast ? "[&>td]:border-b [&>td]:border-[#ddd]" : ""
      }`}
    >
      <td
        className="px-[12px] py-[12px] align-middle text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5]"
        style={{ width: 220 }}
      >
        {row.type}
      </td>
      <td className="px-[12px] py-[12px] align-middle">
        <div
          style={{
            backgroundColor:
              row.statusColor === "green" ? "#e4fcea" : "#f5f5f5",
          }}
          className="inline-flex items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0"
        >
          <p
            style={{
              color: row.statusColor === "green" ? "#00470c" : "#383838",
            }}
            className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[16px] text-center whitespace-nowrap"
          >
            {row.statusLabel}
          </p>
        </div>
      </td>
      <td className="px-[12px] py-[12px] align-middle text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] whitespace-nowrap">
        {row.lastUpdated}
      </td>
      <td className="px-[12px] py-[12px] align-middle text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] whitespace-nowrap">
        {row.lastPublished}
      </td>
      {/* 啟用狀態 — 凍結欄 */}
      <td
        style={{
          width: 104,
          position: "sticky",
          right: 0,
          zIndex: 1,
          boxShadow: "inset 1px 0 0 #ddd",
        }}
        className="px-[12px] py-[12px] align-middle text-center bg-white"
      >
        <div
          className={
            row.enabledDisabled ? "opacity-50 pointer-events-none" : ""
          }
        >
          <Toggle
            checked={row.enabled}
            onChange={(v) => onToggle(row.type, v)}
          />
        </div>
      </td>
    </tr>
  );
});

const DataSourcesTable = memo(function DataSourcesTable({
  rows,
}: {
  rows: DataSourceRow[];
}) {
  const [sources, setSources] = useState(rows);
  return (
    <div className="flex flex-col gap-[16px] items-start w-full">
      {/* 測試 button — own row, right-aligned */}
      <div className="flex flex-wrap items-center w-full">
        <div className="flex flex-col items-end" style={{ flex: "1 0 0" }}>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-chatfab"))
            }
            className="bg-[#242424] flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors"
          >
            <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white text-center">
              測試
            </span>
          </button>
        </div>
      </div>
      {/* 共 N 筆 — own row */}
      <p className="text-[14px] text-[#6e6e6e] font-['Noto_Sans_TC',sans-serif]">
        共 {rows.length} 筆，引用順序如下
      </p>
      <div className="w-full overflow-x-auto rounded-[16px] ring-1 ring-[#ddd]">
        <table
          className="w-full"
          style={{
            minWidth: 700,
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead className="sticky top-0 z-[3]">
            <tr className="bg-white [&>th]:border-b [&>th]:border-[#ddd]">
              <th
                className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]"
                style={{ width: 220 }}
              >
                來源類型
              </th>
              <th className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]">
                狀態{" "}
                <span className="text-[11px] text-[#9ca3af] select-none font-['PingFang_TC',sans-serif]">
                  ⇅
                </span>
              </th>
              <th className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]">
                最後更新{" "}
                <span className="text-[11px] text-[#9ca3af] select-none font-['PingFang_TC',sans-serif]">
                  ⇅
                </span>
              </th>
              <th className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]">
                最後發佈{" "}
                <span className="text-[11px] text-[#9ca3af] select-none font-['PingFang_TC',sans-serif]">
                  ⇅
                </span>
              </th>
              {/* 凍結欄 header：啟用狀態 */}
              <th
                style={{
                  width: 104,
                  position: "sticky",
                  right: 0,
                  zIndex: 2,
                  boxShadow: "inset 1px 0 0 #ddd",
                }}
                className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]"
              >
                啟用狀態
              </th>
            </tr>
          </thead>
          <tbody>
            {sources.map((row, idx) => (
              <DataSourceTableRow
                key={row.type}
                row={row}
                isLast={idx === sources.length - 1}
                onToggle={(type, v) =>
                  setSources((prev) =>
                    prev.map((s) =>
                      s.type === type ? { ...s, enabled: v } : s,
                    ),
                  )
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ------- Main Component -------
export default function FacilitiesContent({
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings,
  onNavigateToAIChatbot,
}: FacilitiesContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"data" | "sources">("data");

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        currentPage="pms"
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToAutoReply={onNavigateToAutoReply}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToSettings={onNavigateToSettings}
        onNavigateToPMS={() => {}}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
      />

      <main
        className={`flex-1 bg-slate-50 transition-all duration-300 overflow-x-hidden overflow-y-auto min-h-screen ${
          sidebarOpen ? "ml-[330px] lg:ml-[280px] md:ml-[250px]" : "ml-[72px]"
        }`}
      >
        <PageHeaderWithBreadcrumb
          breadcrumbItems={[
            { label: "AI Chatbot", onClick: onNavigateToAIChatbot },
            { label: "設施", active: true },
          ]}
          title="設施"
          description="啟用後，AI 回覆將引用此內容"
        />

        {/* Tab bar */}
        <div className="content-stretch flex items-center relative shrink-0 w-full px-[40px]">
          <TabButton
            label="資料總覽"
            active={activeTab === "data"}
            onClick={() => setActiveTab("data")}
          />
          <TabButton
            label="資料來源"
            active={activeTab === "sources"}
            onClick={() => setActiveTab("sources")}
          />
        </div>

        <div
          className="px-[40px]"
          style={{ paddingTop: 16, paddingBottom: 24 }}
        >
          {activeTab === "data" && (
            <FacilitiesDataTable
              onChangeSource={() => setActiveTab("sources")}
              sourceName="自訂 FAQ"
            />
          )}
          {activeTab === "sources" && (
            <DataSourcesTable rows={DATA_SOURCES_FACILITIES} />
          )}
        </div>
      </main>

      <ChatFAB />
    </div>
  );
}
