import React, { useState, memo, useCallback, useMemo, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useToast } from "./ToastProvider";
import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import CategoryTitleDropdown from "./common/CategoryTitleDropdown";
import svgPaths from "../imports/svg-icons-common";
import togglePaths from "../imports/svg-wbwsye31ry";
import ButtonEdit from "../imports/ButtonEdit";
import {
  FacilityEditModal,
  FacilityFaqDraft,
} from "./chatbot/AIChatbotEditModal";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiClient";

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

// ------- API types & mapping -------
type FaqRuleRaw = {
  id: number;
  content_json: Record<string, string>;
  status: string;
  tags: Array<{ tag_name: string }>;
  updated_at: string | null;
};

function mapRuleToFacility(rule: FaqRuleRaw): FacilityRecord {
  const c = rule.content_json ?? {};
  return {
    id: String(rule.id),
    name: c["設施名稱"] ?? "",
    image: c["image_url"] || img("facility-" + rule.id),
    hours: c["開放時間"] ?? "",
    fee: c["費用"] ?? "",
    description: c["說明"] ?? "",
    memberTags: (rule.tags ?? []).map((t) => t.tag_name),
    lastUpdated: rule.updated_at
      ? rule.updated_at.slice(0, 16).replace("T", " ")
      : "—",
    published: rule.status === "active",
  };
}

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
        !isLast ? "row-divider" : ""
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
        <div className="flex items-center gap-[12px]">
          <span>{record.lastUpdated}</span>
          <div
            className="inline-flex items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0"
            style={{ backgroundColor: record.published ? "#e4fcea" : "#f5f5f5" }}
          >
            <span
              className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[16px] text-center whitespace-nowrap"
              style={{ color: record.published ? "#00470c" : "#383838" }}
            >
              {record.published ? "已發佈" : "未發佈"}
            </span>
          </div>
        </div>
      </td>

      {/* 啟用狀態 — 凍結欄 */}
      <td
        style={{
          width: 104,
          minWidth: 104,
          maxWidth: 104,
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
        style={{ width: 68, minWidth: 68, maxWidth: 68, position: "sticky", right: 0, zIndex: 1 }}
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
  const { showToast } = useToast();
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingFacility, setEditingFacility] = useState<FacilityRecord | null>(
    null,
  );
  const [editDraft, setEditDraft] = useState<FacilityFaqDraft | null>(null);

  // Load FAQ rules from API
  useEffect(() => {
    setLoadingFacilities(true);
    apiGet("/api/v1/faq/categories")
      .then((res) => res.json())
      .then(async (json) => {
        const cats: Array<{ id: number; name: string }> = json.data ?? [];
        const facilityCat = cats.find((c) => c.name === "設施");
        if (!facilityCat) return;
        setCategoryId(facilityCat.id);
        const rulesRes = await apiGet(
          `/api/v1/faq/categories/${facilityCat.id}/rules?page_size=50`,
        );
        const rulesJson = await rulesRes.json();
        const items: FaqRuleRaw[] = rulesJson.data?.items ?? [];
        setFacilities(items.map(mapRuleToFacility));
      })
      .catch(() => {})
      .finally(() => setLoadingFacilities(false));
  }, []);

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

  const handleToggle = useCallback(
    async (id: string, value: boolean) => {
      const facility = facilities.find((r) => r.id === id);
      const name = facility?.name ?? "";
      setFacilities((prev) =>
        prev.map((r) => (r.id === id ? { ...r, published: value } : r)),
      );
      try {
        if (value) {
          await apiPost(`/api/v1/faq/rules/${id}/publish`, {});
        } else if (facility) {
          const content_json: Record<string, string> = {
            設施名稱: facility.name,
            開放時間: facility.hours,
            費用: facility.fee,
            說明: facility.description,
            url: "",
          };
          await apiPut(`/api/v1/faq/rules/${id}`, {
            content_json,
            tag_names: facility.memberTags,
          });
        }
        showToast(
          value ? (
            <>
              {name} 已啟用{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("open-chatfab"));
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#DBEDFF",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontSize: 16,
                  lineHeight: 1.5,
                  textDecoration: "underline",
                }}
              >
                測試
              </button>
            </>
          ) : `${name} 已停用`,
          "success",
        );
      } catch {
        // revert on failure
        setFacilities((prev) =>
          prev.map((r) => (r.id === id ? { ...r, published: !value } : r)),
        );
        showToast("操作失敗", "error");
      }
    },
    [facilities, showToast],
  );

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
    setSearch("");
  }, []);

  const filtered = useMemo(() => {
    let list = facilities.filter((r) => {
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
  }, [facilities, search, sortField, sortDir]);

  const thProps = { sortField, sortDir, onSort: handleSort };

  return (
    <div className="flex flex-col gap-[16px] w-full">
      {/* Filter row */}
      <div className="flex flex-wrap gap-y-[8px] items-stretch w-full">
        {/* Search bar + 清除全部條件 */}
        <div className="flex gap-[4px] self-stretch shrink-0">
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
            className="flex gap-[2px] items-center justify-center px-[8px] py-[8px] rounded-[12px] shrink-0 self-stretch cursor-pointer hover:bg-[#f0f6ff] active:bg-[#dce8fc] transition-colors"
            type="button"
          >
            <span className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#0f6beb] text-[16px] whitespace-nowrap">
              清除全部條件
            </span>
          </button>
        </div>

        <div className="flex-1" />

        {/* 新增規則 + 測試 */}
        <div className="flex gap-[4px] self-stretch shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!categoryId) {
                showToast("尚未載入分類資料", "error");
                return;
              }
              const newFacility: FacilityRecord = {
                id: `new-${Date.now()}`,
                name: "",
                image: "",
                hours: "",
                fee: "",
                description: "",
                memberTags: [],
                lastUpdated: "—",
                published: false,
              };
              setEditingFacility(newFacility);
              setEditDraft({
                name: "",
                imageUrl: "",
                hours: "",
                fee: "",
                description: "",
                memberTags: [],
              });
            }}
            className="flex items-center justify-center px-[12px] py-[8px] rounded-[16px] shrink-0 self-stretch cursor-pointer hover:bg-[#f0f6ff] active:bg-[#dce8fc] transition-colors duration-150"
          >
            <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#0f6beb] text-center whitespace-nowrap">
              新增規則
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-chatfab"))}
            className="bg-[#242424] flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] shrink-0 self-stretch cursor-pointer hover:bg-[#383838] transition-colors duration-150"
          >
            <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white text-center whitespace-nowrap">
              測試
            </span>
          </button>
        </div>
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
                  minWidth: 104,
                  maxWidth: 104,
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
                style={{ width: 68, minWidth: 68, maxWidth: 68, position: "sticky", right: 0, zIndex: 2 }}
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
          onSave={async (draft) => {
            const content_json: Record<string, string> = {
              設施名稱: draft.name,
              開放時間: draft.hours,
              費用: draft.fee,
              說明: draft.description,
              url: "",
              image_url: draft.imageUrl,
            };
            try {
              const isNew = editingFacility.id.startsWith("new-");
              if (isNew && categoryId) {
                const res = await apiPost(
                  `/api/v1/faq/categories/${categoryId}/rules`,
                  { content_json, tag_names: draft.memberTags },
                );
                const json = await res.json();
                const newId = String(json.data?.id ?? editingFacility.id);
                const now = new Date().toISOString().slice(0, 16).replace("T", " ");
                setFacilities((prev) => [
                  {
                    id: newId,
                    name: draft.name,
                    image: draft.imageUrl || img("facility-" + newId),
                    hours: draft.hours,
                    fee: draft.fee,
                    description: draft.description,
                    memberTags: draft.memberTags,
                    lastUpdated: now,
                    published: false,
                  },
                  ...prev,
                ]);
              } else {
                await apiPut(`/api/v1/faq/rules/${editingFacility.id}`, {
                  content_json,
                  tag_names: draft.memberTags,
                });
                const now = new Date().toISOString().slice(0, 16).replace("T", " ");
                setFacilities((prev) =>
                  prev.map((r) =>
                    r.id === editingFacility.id
                      ? {
                          ...r,
                          name: draft.name,
                          image: draft.imageUrl || r.image,
                          hours: draft.hours,
                          fee: draft.fee,
                          description: draft.description,
                          memberTags: draft.memberTags,
                          lastUpdated: now,
                          published: false,
                        }
                      : r,
                  ),
                );
              }
              showToast("儲存成功", "success");
            } catch {
              showToast("儲存失敗", "error");
            }
          }}
          onDelete={async () => {
            const isNew = editingFacility.id.startsWith("new-");
            try {
              if (!isNew) {
                await apiDelete(`/api/v1/faq/rules/${editingFacility.id}`);
              }
              setFacilities((prev) =>
                prev.filter((r) => r.id !== editingFacility.id),
              );
              setEditingFacility(null);
              setEditDraft(null);
              showToast("已刪除", "success");
            } catch {
              showToast("刪除失敗", "error");
            }
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
  statusColor: "green" | "gray" | "red";
  lastUpdated: string;
  lastPublished: string;
  enabled: boolean;
  enabledDisabled?: boolean;
};

const DATA_SOURCES_FACILITIES: DataSourceRow[] = [
  {
    type: "自訂 FAQ",
    statusLabel: "已啟用",
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
        !isLast ? "row-divider" : ""
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
              row.statusColor === "green"
                ? "#e4fcea"
                : row.statusColor === "red"
                  ? "#ffebee"
                  : "#f5f5f5",
          }}
          className="inline-flex items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0"
        >
          <p
            style={{
              color:
                row.statusColor === "green"
                  ? "#00470c"
                  : row.statusColor === "red"
                    ? "#b71c1c"
                    : "#383838",
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
                      s.type === type
                        ? {
                            ...s,
                            enabled: v,
                            statusLabel: v ? "已啟用" : "已停用",
                            statusColor: v ? "green" : "red",
                          }
                        : s,
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
          titleSuffix={<CategoryTitleDropdown />}
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

    </div>
  );
}
