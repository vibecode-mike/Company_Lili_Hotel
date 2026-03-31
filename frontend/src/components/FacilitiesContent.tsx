import React, { useState, useRef, memo, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Sidebar from "./Sidebar";
import { useToast } from "./ToastProvider";
import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import CategoryTitleDropdown from "./common/CategoryTitleDropdown";
import svgPaths from "../imports/svg-icons-common";
import togglePaths from "../imports/svg-wbwsye31ry";
import ButtonEdit from "../imports/ButtonEdit";
import TestEnvHeaderLabel from "./common/TestEnvHeaderLabel";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  FacilityEditModal,
  FacilityFaqDraft,
} from "./chatbot/AIChatbotEditModal";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "../utils/apiClient";


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
  enabled: boolean;    // 加入測試環境
  published: boolean;  // 發佈狀態
}

type SortField = "hours" | "fee" | "memberTags" | "lastUpdated" | "published";
type SortDir = "asc" | "desc";

// ------- API types & mapping -------
type FaqRuleRaw = {
  id: number;
  content_json: Record<string, string>;
  status: string;
  is_enabled?: boolean;
  published_at?: string | null;
  tags: Array<{ tag_name: string }>;
  updated_at: string | null;
};

function mapRuleToFacility(rule: FaqRuleRaw): FacilityRecord {
  const c = rule.content_json ?? {};
  return {
    id: String(rule.id),
    name: c["設施名稱"] ?? "",
    image: c["image_url"] || "",
    hours: c["開放時間"] ?? "",
    fee: c["費用"] ?? "",
    description: c["說明"] ?? "",
    memberTags: (rule.tags ?? []).map((t) => t.tag_name),
    lastUpdated: rule.updated_at
      ? rule.updated_at.slice(0, 16).replace("T", " ")
      : "—",
    enabled: rule.is_enabled !== false,
    published: !!rule.published_at,
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
  disabled = false,
  disabledTip = "",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledTip?: string;
}) {
  const [showTip, setShowTip] = React.useState(false);
  const [tipPos, setTipPos] = React.useState<{ top: number; left: number } | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = React.useCallback(() => {
    if (!disabled || !disabledTip) return;
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setTipPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    }
    setShowTip(true);
  }, [disabled, disabledTip]);

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTip(false)}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`flex items-center justify-center border-none bg-transparent p-0 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="relative size-[40px]">
          <svg className="block size-full" fill="none" viewBox="0 0 40 40">
            <g clipPath="url(#clip0_toggle_facilities)">
              <g />
              <path
                d={checked ? togglePaths.p13e42a00 : togglePaths.p3ed4d200}
                fill={disabled ? "#C0C4CC" : checked ? "#0F6BEB" : "#E5E7EB"}
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
      {showTip && tipPos && createPortal(
        <div
          className="fixed bg-[#383838] text-white text-[12px] leading-[1.5] font-['Noto_Sans_TC',sans-serif] font-normal rounded-[8px] p-[8px] whitespace-nowrap pointer-events-none"
          style={{ zIndex: 9999, top: tipPos.top, left: tipPos.left, transform: "translateX(-85%)" }}
        >
          {disabledTip}
        </div>,
        document.body,
      )}
    </div>
  );
});

const SortIcon = memo(function SortIcon({
  field,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort?: (field: SortField, dir?: SortDir) => void;
}) {
  const isActive = sortField === field;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 cursor-pointer select-none"
    >
      <g transform="translate(1.34, 2.67)">
        <path
          d="M2.85381 0.195333C2.97883 0.0703528 3.14837 0.000142415 3.32514 0.000142415C3.50192 0.000142415 3.67146 0.0703528 3.79647 0.195333L6.46314 2.862C6.58458 2.98774 6.65178 3.15614 6.65026 3.33093C6.64874 3.50573 6.57863 3.67294 6.45502 3.79655C6.33142 3.92015 6.16421 3.99026 5.98941 3.99178C5.81461 3.9933 5.64621 3.92611 5.52047 3.80467L3.99181 2.276V10C3.99181 10.1768 3.92157 10.3464 3.79655 10.4714C3.67152 10.5964 3.50195 10.6667 3.32514 10.6667C3.14833 10.6667 2.97876 10.5964 2.85374 10.4714C2.72871 10.3464 2.65847 10.1768 2.65847 10V2.276L1.12981 3.80467C1.00407 3.92611 0.835672 3.9933 0.660874 3.99178C0.486076 3.99026 0.318868 3.92015 0.195262 3.79655C0.0716568 3.67294 0.00154415 3.50573 2.52018e-05 3.33093C-0.00149374 3.15614 0.0657025 2.98774 0.187141 2.862L2.85381 0.195333Z"
          fill={isActive && sortDir === "asc" ? "#0f6beb" : "#9CA3AF"}
          onClick={(e) => { e.stopPropagation(); onSort?.(field, "asc"); }}
          style={{ cursor: "pointer" }}
        />
        <path
          d="M9.32514 8.39067V0.666667C9.32514 0.489856 9.39538 0.320287 9.5204 0.195262C9.64543 0.070238 9.815 0 9.99181 0C10.1686 0 10.3382 0.070238 10.4632 0.195262C10.5882 0.320287 10.6585 0.489856 10.6585 0.666667V8.39067L12.1871 6.862C12.3129 6.74056 12.4813 6.67337 12.6561 6.67488C12.8309 6.6764 12.9981 6.74652 13.1217 6.87012C13.2453 6.99373 13.3154 7.16094 13.3169 7.33573C13.3184 7.51053 13.2512 7.67893 13.1298 7.80467L10.4631 10.4713C10.3381 10.5963 10.1686 10.6665 9.99181 10.6665C9.81503 10.6665 9.64549 10.5963 9.52047 10.4713L6.85381 7.80467C6.73237 7.67893 6.66517 7.51053 6.66669 7.33573C6.66821 7.16094 6.73832 6.99373 6.86193 6.87012C6.98553 6.74652 7.15274 6.6764 7.32754 6.67488C7.50234 6.67337 7.67074 6.74056 7.79647 6.862L9.32514 8.39067Z"
          fill={isActive && sortDir === "desc" ? "#0f6beb" : "#9CA3AF"}
          onClick={(e) => { e.stopPropagation(); onSort?.(field, "desc"); }}
          style={{ cursor: "pointer" }}
        />
      </g>
    </svg>
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
  onSort?: (field: SortField, dir?: SortDir) => void;
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
      <span className={`inline-flex items-center${sortable && field ? " gap-[4px]" : ""}`}>
        {children}
        {sortable && field && (
          <SortIcon field={field} sortField={sortField} sortDir={sortDir} onSort={onSort} />
        )}
      </span>
    </th>
  );
});

// ------- Table Row -------
const TableRow = memo(function TableRow({
  record,
  isLast,
  onToggle,
  onEdit,
  categoryActive = true,
  categoryName = "",
}: {
  record: FacilityRecord;
  isLast: boolean;
  onToggle: (id: string, v: boolean) => void;
  onEdit: (id: string) => void;
  categoryActive?: boolean;
  categoryName?: string;
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
          <ImageWithFallback
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

      {/* 發佈狀態 — 凍結欄 */}
      <td
        style={{
          width: 90,
          minWidth: 90,
          maxWidth: 90,
          position: "sticky",
          right: 188,
          zIndex: 1,
          boxShadow: "inset 1px 0 0 #ddd",
        }}
        className="px-[12px] py-[12px] align-middle text-center bg-white"
      >
        <div
          className="inline-flex items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0"
          style={{ backgroundColor: record.published ? "#e4fcea" : "#f5f5f5" }}
        >
          <span
            className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[14px] text-center whitespace-nowrap"
            style={{ color: record.published ? "#00470c" : "#383838" }}
          >
            {record.published ? "已發佈" : "未發佈"}
          </span>
        </div>
      </td>

      {/* 加入測試環境 — 凍結欄 */}
      <td
        style={{
          width: 120,
          minWidth: 120,
          maxWidth: 120,
          position: "sticky",
          right: 68,
          zIndex: 1,
        }}
        className="py-[12px] bg-white"
      >
        <div className="flex items-center justify-center w-full">
          <Toggle
            checked={record.enabled}
            onChange={(v) => onToggle(record.id, v)}
            disabled={!categoryActive}
            disabledTip={`請先至分類列表開啟 ${categoryName} 的測試環境開關，確保測試環境生效。`}
          />
        </div>
      </td>

      {/* 動作 — 凍結欄 */}
      <td
        style={{ width: 68, minWidth: 68, maxWidth: 68, position: "sticky", right: 0, zIndex: 1 }}
        className="py-[12px] bg-white"
      >
        <div className="flex items-center justify-center w-full">
          <ButtonEdit onClick={() => onEdit(record.id)} />
        </div>
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
  const [categoryActive, setCategoryActive] = useState(true);
  const [categoryName, setCategoryName] = useState("設施");
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingFacility, setEditingFacility] = useState<FacilityRecord | null>(
    null,
  );
  const [editDraft, setEditDraft] = useState<FacilityFaqDraft | null>(null);
  const savedRuleIdRef = useRef<string | null>(null);

  // Load FAQ rules from API
  useEffect(() => {
    setLoadingFacilities(true);
    apiGet("/api/v1/faq/categories")
      .then((res) => res.json())
      .then(async (json) => {
        const cats: Array<{ id: number; name: string; is_active: boolean }> = json.data ?? [];
        const facilityCat = cats.find((c) => c.name === "設施");
        if (!facilityCat) return;
        setCategoryId(facilityCat.id);
        setCategoryActive(facilityCat.is_active ?? true);
        setCategoryName(facilityCat.name);
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

  // 監聽發佈事件，即時更新發佈狀態
  useEffect(() => {
    const handler = () => {
      setFacilities((prev) =>
        prev.map((r) => (r.enabled ? { ...r, published: true } : { ...r, published: false })),
      );
    };
    window.addEventListener("faq-published", handler);
    return () => window.removeEventListener("faq-published", handler);
  }, []);

  const handleSort = useCallback((field: SortField, dir?: SortDir) => {
    if (dir) {
      // Clicked a specific arrow: toggle off if already active, otherwise activate
      setSortField((prev) => {
        if (prev === field && sortDir === dir) {
          // same field & same dir → deactivate
          return null;
        }
        setSortDir(dir);
        return field;
      });
    } else {
      setSortField((prev) => {
        if (prev === field) {
          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          return field;
        }
        setSortDir("asc");
        return field;
      });
    }
  }, [sortDir]);

  const handleToggle = useCallback(
    async (id: string, value: boolean) => {
      const facility = facilities.find((r) => r.id === id);
      const name = facility?.name ?? "";
      setFacilities((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: value } : r)),
      );
      try {
        await apiPatch(`/api/v1/faq/rules/${id}/toggle`, { is_enabled: value });
        showToast(
          value ? (
            <>
              {name} 已進入測試，請先試聊看看以確保回覆品質。{" "}
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
          ) : (
            <>
              已關閉 {name} 的測試模式。{" "}
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
          ),
          "success",
        );
      } catch {
        // revert on failure
        setFacilities((prev) =>
          prev.map((r) => (r.id === id ? { ...r, enabled: !value } : r)),
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

        {/* 匯出/匯入 + 新增規則 + 測試 */}
        <div className="flex gap-[4px] self-stretch shrink-0 items-center">
          <CategoryTitleDropdown />
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
                enabled: false,
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
          共 {filtered.length} 筆，AI 引用{" "}
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

              {/* 發佈狀態 — 凍結欄 */}
              <th
                onClick={() => handleSort("published")}
                style={{
                  width: 90,
                  minWidth: 90,
                  maxWidth: 90,
                  position: "sticky",
                  right: 188,
                  zIndex: 2,
                  boxShadow: "inset 1px 0 0 #ddd",
                }}
                className="px-[12px] py-[16px] text-center text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap select-none bg-white border-b border-[#ddd] cursor-pointer hover:bg-[#f5f8ff] transition-colors duration-150"
              >
                <span className="inline-flex items-center gap-[4px]">
                  發佈狀態
                  <SortIcon
                    field="published"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                </span>
              </th>

              {/* 加入測試環境 — 凍結欄 */}
              <th
                style={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  position: "sticky",
                  right: 68,
                  zIndex: 2,
                }}
                className="px-[8px] py-[16px] text-center text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] bg-white border-b border-[#ddd]"
              >
                <TestEnvHeaderLabel />
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
                  categoryActive={categoryActive}
                  categoryName={categoryName}
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
            const isNew = editingFacility.id.startsWith("new-");
            if (isNew && categoryId) {
              const res = await apiPost(
                `/api/v1/faq/categories/${categoryId}/rules`,
                { content_json, tag_names: draft.memberTags },
              );
              const json = await res.json();
              const newId = String(json.data?.id ?? editingFacility.id);
              savedRuleIdRef.current = newId;
              const now = new Date().toISOString().slice(0, 16).replace("T", " ");
              setFacilities((prev) => [
                {
                  id: newId,
                  name: draft.name,
                  image: draft.imageUrl || "",
                  hours: draft.hours,
                  fee: draft.fee,
                  description: draft.description,
                  memberTags: draft.memberTags,
                  lastUpdated: now,
                  enabled: false,
                  published: false,
                },
                ...prev,
              ]);
            } else {
              savedRuleIdRef.current = editingFacility.id;
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
          }}
          onDelete={async () => {
            const isNew = editingFacility.id.startsWith("new-");
            try {
              if (!isNew) {
                const res = await apiDelete(`/api/v1/faq/rules/${editingFacility.id}`);
                if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
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
      {/* 加入測試環境 — 凍結欄 */}
      <td
        style={{
          width: 120,
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
  const { showToast } = useToast();

  // 監聽發佈事件，更新資料來源狀態
  useEffect(() => {
    const handler = () => {
      setSources((prev) =>
        prev.map((s) =>
          s.enabled
            ? { ...s, statusLabel: "已啟用", statusColor: "green" as const }
            : { ...s, statusLabel: "已停用", statusColor: "red" as const },
        ),
      );
    };
    window.addEventListener("faq-published", handler);
    return () => window.removeEventListener("faq-published", handler);
  }, []);

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
              {/* 凍結欄 header：加入測試環境 */}
              <th
                style={{
                  width: 120,
                  position: "sticky",
                  right: 0,
                  zIndex: 2,
                  boxShadow: "inset 1px 0 0 #ddd",
                }}
                className="px-[8px] py-[16px] text-center font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] bg-white border-b border-[#ddd]"
              >
                <TestEnvHeaderLabel />
              </th>
            </tr>
          </thead>
          <tbody>
            {sources.map((row, idx) => (
              <DataSourceTableRow
                key={row.type}
                row={row}
                isLast={idx === sources.length - 1}
                onToggle={(type, v) => {
                  setSources((prev) =>
                    prev.map((s) =>
                      s.type === type ? { ...s, enabled: v } : s,
                    ),
                  );
                  showToast(
                    v ? (
                      <>
                        {type} 已進入測試，請先試聊看看以確保回覆品質。{" "}
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
                    ) : (
                      <>
                        已關閉 {type} 的測試模式。{" "}
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
                    ),
                    "success",
                  );
                }}
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

    </div>
  );
}
