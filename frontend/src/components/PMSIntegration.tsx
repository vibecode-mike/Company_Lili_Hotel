import React, { useState, useRef, memo, useCallback, useMemo, useEffect } from "react";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "../utils/apiClient";
import { getAuthToken } from "../utils/token";
import { useToast } from "./ToastProvider";
import Sidebar from "./Sidebar";
import {
  RoomEditModal,
  RoomFaqDraft,
  RoomPmsData,
  ViewMode,
} from "./chatbot/AIChatbotEditModal";

import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import CategoryTitleDropdown from "./common/CategoryTitleDropdown";
import svgPaths from "../imports/svg-icons-common";
import togglePaths from "../imports/svg-wbwsye31ry";
import ButtonEdit from "../imports/ButtonEdit";
import TestEnvHeaderLabel from "./common/TestEnvHeaderLabel";

interface PMSIntegrationProps {
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToAIChatbot?: () => void;
}

// ------- Types -------
interface RoomRecord {
  id: string;
  roomType: string;
  image: string;
  pricePerNight: number;
  maxGuests: number;
  remainingRooms: string; // e.g. "2/5"
  features: string;
  memberTags: string[];
  url: string;
  lastUpdated: string;
  enabled: boolean;    // 加入測試環境
  published: boolean;  // 發佈狀態
  /** PMS 系統的房型代碼，用於驗證有效性 */
  pmsRoomCode: string;
  /** 使用者自訂的房型圖片 URL（自訂 FAQ 欄位） */
  customImageUrl: string;
}

type FaqRuleRaw = {
  id: number;
  content_json: Record<string, string>;
  status: string;
  is_enabled?: boolean;
  published_at?: string | null;
  tags: Array<{ tag_name: string }>;
  updated_at: string | null;
};

function mapRuleToRoom(rule: FaqRuleRaw): RoomRecord {
  const c = rule.content_json ?? {};
  return {
    id: String(rule.id),
    roomType: c["房型名稱"] ?? "",
    image: c["image_url"] || "",
    pricePerNight: Number(String(c["房價"] ?? "0").replace(/,/g, "")) || 0,
    maxGuests: Number(c["人數"]) || 0,
    remainingRooms: c["間數"] ?? "",
    features: c["房型特色"] ?? "",
    memberTags: (rule.tags ?? []).map((t) => t.tag_name),
    url: c["url"] ?? "",
    lastUpdated: rule.updated_at
      ? rule.updated_at.slice(0, 16).replace("T", " ")
      : "—",
    enabled: rule.is_enabled !== false,
    published: !!rule.published_at,
    pmsRoomCode: "",
    customImageUrl: c["image_url"] ?? "",
  };
}

type SortField =
  | "pricePerNight"
  | "maxGuests"
  | "remainingRooms"
  | "memberTags"
  | "lastUpdated"
  | "published";
type SortDir = "asc" | "desc";

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
          <g clipPath="url(#clip0_toggle_pms)">
            <g />
            <path
              d={checked ? togglePaths.p13e42a00 : togglePaths.p3ed4d200}
              fill={checked ? "#0F6BEB" : "#E5E7EB"}
              className="transition-all duration-300 ease-in-out"
            />
          </g>
          <defs>
            <clipPath id="clip0_toggle_pms">
              <rect fill="white" height="40" width="40" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </button>
  );
});

// Sort icon: ⇅ neutral, ↑ asc, ↓ desc
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

// External link icon 12x12
const ExternalLinkIcon = memo(function ExternalLinkIcon() {
  return (
    <svg
      className="shrink-0 w-[12px] h-[12px] text-[#565656]"
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d="M1.5 10.5L10.5 1.5M10.5 1.5H5.5M10.5 1.5V6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

// Tab button
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

// Search icon 32x32
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

// Arrow down icon 24x24
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

// Dropdown selector — Figma style, no border
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
  idx,
  isLast,
  onToggle,
  onEdit,
  pmsEnabled,
}: {
  record: RoomRecord;
  idx: number;
  isLast: boolean;
  onToggle: (id: string, v: boolean) => void;
  onEdit: (id: string) => void;
  pmsEnabled: boolean;
}) {
  return (
    <tr
      className={`bg-white transition-colors duration-150 hover:bg-[#f5f8ff] group ${
        !isLast ? "row-divider" : ""
      }`}
    >
      {/* 房型名稱 — thumbnail + name */}
      <td className="p-0 w-[220px]">
        <div className="flex items-center py-[12px] pl-[12px]">
          {/* Room thumbnail */}
          <img
            src={record.customImageUrl || record.image || ""}
            alt={record.roomType}
            className="shrink-0 rounded-[4px] object-cover bg-[#f0f0f0]"
            style={{ width: 110, height: 74 }}
          />
          {/* Room name */}
          <span className="px-[12px] text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] min-w-0 truncate">
            {record.roomType}
          </span>
        </div>
      </td>

      {/* 房價 — left-aligned */}
      <td className="px-[12px] py-[12px] w-[160px] text-[14px] text-[#383838] font-['Inter',sans-serif] font-normal tracking-[0.22px] leading-[24px] whitespace-nowrap">
        {pmsEnabled ? "即時房價" : `NT$${record.pricePerNight.toLocaleString()}`}
      </td>

      {/* 可入住人數 — left-aligned */}
      <td className="px-[12px] py-[12px] w-[140px] text-[14px] text-[#383838] font-['Inter',sans-serif] font-normal tracking-[0.22px] leading-[24px]">
        {pmsEnabled ? "即時資料" : record.maxGuests}
      </td>

      {/* 剩餘間數 — left-aligned */}
      <td className="px-[12px] py-[12px] w-[140px] text-[14px] text-[#383838] font-['Inter',sans-serif] font-normal tracking-[0.22px] leading-[24px]">
        {pmsEnabled ? "即時資料" : record.remainingRooms}
      </td>

      {/* 房型特色 */}
      <td className="px-[12px] py-[12px] w-[160px] text-[14px] text-[#383838] font-['Inter',sans-serif] font-normal tracking-[0.22px] leading-[24px]">
        <span className="truncate block max-w-[136px]" title={record.features}>
          {record.features}
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

      {/* 訂房 URL */}
      <td className="px-[12px] py-[12px] w-[160px]">
        <a
          href={`https://${record.url}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="booking-url-btn"
        >
          <span className="booking-url-text">{record.url}</span>
          <ExternalLinkIcon />
        </a>
      </td>

      {/* 最後更新 */}
      <td className="px-[12px] py-[12px] w-[220px] whitespace-nowrap text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5]">
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

// ------- PMS Data Table -------
const PMSDataTable = memo(function PMSDataTable({
  onChangeSource,
  onNavigateToSettings,
  sourceName,
}: {
  onChangeSource: () => void;
  onNavigateToSettings: () => void;
  sourceName: string;
}) {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [pmsEnabled, setPmsEnabled] = useState(false);

  // Fetch PMS enabled status
  useEffect(() => {
    apiGet("/api/v1/chatbot/pms-status")
      .then((res: any) => setPmsEnabled(!!res?.enabled))
      .catch(() => {});
  }, []);
  const [viewMode, setViewMode] = useState<ViewMode>("faq");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
  const [editDraft, setEditDraft] = useState<RoomFaqDraft | null>(null);
  const savedRuleIdRef = useRef<string | null>(null);

  // Load FAQ rules from API
  useEffect(() => {
    setLoadingRooms(true);
    apiGet("/api/v1/faq/categories")
      .then((res) => res.json())
      .then(async (json) => {
        const cats: Array<{ id: number; name: string }> = json.data ?? [];
        const booking = cats.find((c) => c.name === "訂房") ?? cats[0];
        if (!booking) return;
        setCategoryId(booking.id);
        const rulesRes = await apiGet(
          `/api/v1/faq/categories/${booking.id}/rules?page_size=50`,
        );
        const rulesJson = await rulesRes.json();
        const items: FaqRuleRaw[] = rulesJson.data?.items ?? [];
        setRooms(items.map(mapRuleToRoom));
      })
      .catch(() => {})
      .finally(() => setLoadingRooms(false));
  }, []);

  // 監聽發佈事件，即時更新發佈狀態
  useEffect(() => {
    const handler = () => {
      setRooms((prev) =>
        prev.map((r) => (r.enabled ? { ...r, published: true } : { ...r, published: false })),
      );
    };
    window.addEventListener("faq-published", handler);
    return () => window.removeEventListener("faq-published", handler);
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

  const fetchRules = useCallback(async () => {
    if (!categoryId) return;
    setLoadingRooms(true);
    try {
      const res = await apiGet(`/api/v1/faq/categories/${categoryId}/rules?page_size=50`);
      const json = await res.json();
      const items: FaqRuleRaw[] = json.data?.items ?? [];
      setRooms(items.map(mapRuleToRoom));
    } catch {
      // ignore
    } finally {
      setLoadingRooms(false);
    }
  }, [categoryId]);

  const handleImport = useCallback(async (file: File) => {
    if (!categoryId) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = getAuthToken() || "";
      const res = await fetch(
        `/api/v1/faq/categories/${categoryId}/rules/import`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData },
      );
      if (res.ok) {
        showToast("規則匯入成功", "success");
        fetchRules();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "匯入失敗", "error");
      }
    } catch {
      showToast("匯入失敗", "error");
    }
  }, [categoryId, showToast, fetchRules]);

  const handleExport = useCallback(async (format: "csv" | "xls" | "xlsx" = "csv") => {
    if (!categoryId) return;
    try {
      const token = getAuthToken() || "";
      const res = await fetch(
        `/api/v1/faq/categories/${categoryId}/rules/export?format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rules_export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("匯出失敗", "error");
    }
  }, [categoryId, showToast]);

  const handleToggle = useCallback(
    async (id: string, value: boolean) => {
      const room = rooms.find((r) => r.id === id);
      const name = room?.roomType ?? "";
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: value } : r)),
      );
      try {
        await apiPatch(`/api/v1/faq/rules/${id}/toggle`, { is_enabled: value });
        showToast(
          value ? (
            <>
              {name} 同步至測試環境，請先進行對話測試以確保回覆品質{" "}
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
        // Revert on error
        setRooms((prev) =>
          prev.map((r) => (r.id === id ? { ...r, enabled: !value } : r)),
        );
      }
    },
    [rooms, showToast],
  );

  const handleEdit = useCallback(
    (id: string) => {
      const room = rooms.find((r) => r.id === id);
      if (room) {
        setEditingRoom(room);
        setEditDraft({
          customRoomName: room.roomType,
          customImageUrl: room.customImageUrl,
          customPrice: String(room.pricePerNight),
          customGuests: String(room.maxGuests),
          customRemaining: room.remainingRooms,
          features: room.features,
          memberTags: [...room.memberTags],
          bookingUrl: room.url,
        });
      }
    },
    [rooms],
  );

  const handleSaveEdit = useCallback(
    async (id: string, draft: RoomFaqDraft) => {
      const room = rooms.find((r) => r.id === id);
      const content_json: Record<string, string> = {
        房型名稱: draft.customRoomName || room?.roomType || "",
        房型特色: draft.features,
        房價: draft.customPrice || String(room?.pricePerNight ?? 0),
        人數: draft.customGuests || String(room?.maxGuests ?? 0),
        間數: draft.customRemaining || room?.remainingRooms || "",
        url: draft.bookingUrl,
        image_url: draft.customImageUrl,
      };
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const updatedRoom: Partial<RoomRecord> = {
        roomType: draft.customRoomName || room?.roomType || "",
        customImageUrl: draft.customImageUrl,
        features: draft.features,
        memberTags: draft.memberTags,
        url: draft.bookingUrl,
        pricePerNight: Number(draft.customPrice) || room?.pricePerNight || 0,
        maxGuests: Number(draft.customGuests) || room?.maxGuests || 0,
        remainingRooms: draft.customRemaining || room?.remainingRooms || "",
        lastUpdated: now,
        published: false, // editing resets to draft
      };
      if (id.startsWith("new-")) {
        // 檢查是否有同名房型
        const newName = draft.customRoomName || room?.roomType || "";
        if (rooms.some((r) => r.id !== id && r.roomType === newName)) {
          showToast("此房型名稱已存在，請編輯現有規則或刪除後重新新增", "error");
          return;
        }
        // New item: add to list only after save succeeds
        try {
          if (categoryId) {
            const res = await apiPost(
              `/api/v1/faq/categories/${categoryId}/rules`,
              { content_json, tag_names: draft.memberTags },
            );
            const json = await res.json();
            const newId = String(json.data?.id ?? id);
            savedRuleIdRef.current = newId;
            setRooms((prev) => [
              {
                id: newId,
                roomType: updatedRoom.roomType || "",
                image: draft.customImageUrl || "",
                pricePerNight: updatedRoom.pricePerNight || 0,
                maxGuests: updatedRoom.maxGuests || 0,
                remainingRooms: updatedRoom.remainingRooms || "",
                features: updatedRoom.features || "",
                memberTags: updatedRoom.memberTags || [],
                url: updatedRoom.url || "",
                lastUpdated: now,
                enabled: false,
                published: false,
                pmsRoomCode: "",
                customImageUrl: draft.customImageUrl,
              },
              ...prev,
            ]);
          }
        } catch {
          // Don't add to list on error
        }
      } else {
        // Existing item: update in place
        savedRuleIdRef.current = id;
        setRooms((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, ...updatedRoom } : r,
          ),
        );
        try {
          await apiPut(`/api/v1/faq/rules/${id}`, {
            content_json,
            tag_names: draft.memberTags,
          });
        } catch {
          // Silently keep local state on error
        }
      }
    },
    [rooms, categoryId],
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
  }, []);

  const filtered = useMemo(() => {
    let list = rooms.filter((r) => {
      if (
        search &&
        !r.roomType.includes(search) &&
        !r.memberTags.some((t) => t.includes(search)) &&
        !r.features.includes(search)
      )
        return false;
      return true;
    });

    if (sortField) {
      list = [...list].sort((a, b) => {
        let av: string | number = 0;
        let bv: string | number = 0;
        switch (sortField) {
          case "pricePerNight":
            av = a.pricePerNight;
            bv = b.pricePerNight;
            break;
          case "maxGuests":
            av = a.maxGuests;
            bv = b.maxGuests;
            break;
          case "remainingRooms":
            av = parseInt(a.remainingRooms);
            bv = parseInt(b.remainingRooms);
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
  }, [rooms, search, sortField, sortDir]);

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

        {/* Spacer */}
        <div className="flex-1" />

        {/* 匯出/匯入 + 新增規則 + PMS/FAQ 切換 + 測試 */}
        <div className="flex gap-[4px] self-stretch shrink-0 items-center">
          {viewMode === "faq" && (
            <>
              <CategoryTitleDropdown onImport={handleImport} onExport={handleExport} />
              <button
                type="button"
                onClick={() => {
                  if (!categoryId) return;
                  const newId = `new-${Date.now()}`;
                  const newRoom: RoomRecord = {
                    id: newId,
                    roomType: "",
                    image: "",
                    pricePerNight: 0,
                    maxGuests: 0,
                    remainingRooms: "",
                    features: "",
                    memberTags: [],
                    url: "",
                    lastUpdated: "—",
                    enabled: false,
                    published: false,
                    pmsRoomCode: "",
                    customImageUrl: "",
                  };
                  setEditingRoom(newRoom);
                  setEditDraft({
                    customRoomName: "",
                    customImageUrl: "",
                    customPrice: "",
                    customGuests: "",
                    customRemaining: "",
                    features: "",
                    memberTags: [],
                    bookingUrl: "",
                  });
                }}
                className="flex items-center justify-center px-[12px] py-[8px] rounded-[16px] shrink-0 self-stretch cursor-pointer hover:bg-[#f0f6ff] active:bg-[#dce8fc] transition-colors duration-150"
              >
                <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#0f6beb] text-center whitespace-nowrap">
                  新增規則
                </span>
              </button>
            </>
          )}

          {/* PMS / FAQ toggle */}
          <div className="flex rounded-[12px] overflow-hidden border border-[#e0e0e0] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("pms")}
              className={`px-[16px] py-[8px] text-[14px] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] border-none cursor-pointer transition-colors ${
                viewMode === "pms"
                  ? "bg-[#242424] text-white"
                  : "bg-white text-[#6e6e6e] hover:bg-[#f5f5f5]"
              }`}
            >
              PMS
            </button>
            <button
              type="button"
              onClick={() => setViewMode("faq")}
              className={`px-[16px] py-[8px] text-[14px] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] border-none cursor-pointer transition-colors ${
                viewMode === "faq"
                  ? "bg-[#242424] text-white"
                  : "bg-white text-[#6e6e6e] hover:bg-[#f5f5f5]"
              }`}
            >
              FAQ
            </button>
          </div>

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
          className="min-w-[1486px] w-full"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          <thead className="sticky top-0 z-[3]">
            <tr className="bg-white [&>th]:border-b [&>th]:border-[#ddd]">
              {/* 房型名稱 — no sort */}
              <th className="px-[12px] py-[16px] text-left text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap bg-white border-b border-[#ddd] w-[220px]">
                房型名稱
              </th>

              <Th
                width={160}
                sortable
                field="pricePerNight"
                {...thProps}
              >
                房價
              </Th>

              <Th
                width={140}
                sortable
                field="maxGuests"
                {...thProps}
              >
                可入住人數
              </Th>

              <Th
                width={140}
                sortable
                field="remainingRooms"
                {...thProps}
              >
                剩餘間數
              </Th>

              {/* 房型特色 — no sort */}
              <th className="px-[12px] py-[16px] text-left text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap bg-white border-b border-[#ddd] w-[160px]">
                房型特色
              </th>

              <Th width={200} sortable field="memberTags" {...thProps}>
                會員標籤
              </Th>

              {/* 訂房 URL — no sort */}
              <th className="px-[12px] py-[16px] text-left text-[14px] font-normal text-[#383838] font-['Noto_Sans_TC',sans-serif] leading-[1.5] whitespace-nowrap bg-white border-b border-[#ddd] w-[160px]">
                訂房 URL
              </th>

              <Th width={220} sortable field="lastUpdated" {...thProps}>
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
                發佈狀態
                <SortIcon
                  field="published"
                  sortField={sortField}
                  sortDir={sortDir}
                />
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
            {loadingRooms ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-[12px] py-[40px] text-center text-[14px] text-[#6e6e6e] font-['Noto_Sans_TC',sans-serif]"
                >
                  載入中…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
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
                  idx={idx}
                  isLast={idx === filtered.length - 1}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  pmsEnabled={pmsEnabled}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 編輯房型彈窗 */}
      {editingRoom && editDraft && (
        <RoomEditModal
          viewMode={viewMode}
          pmsData={
            pmsEnabled
              ? {
                  roomType: editingRoom.roomType,
                  priceLabel: "即時房價",
                  guestsLabel: "即時資料",
                  remainingLabel: "即時資料",
                  imageUrl: editingRoom.image,
                }
              : null
          }
          draft={editDraft}
          hasFaq={Boolean(
            editDraft.customImageUrl ||
            editDraft.features ||
            editDraft.memberTags.length > 0,
          )}
          pmsRoomCode={editingRoom.pmsRoomCode}
          onClose={() => {
            setEditingRoom(null);
            setEditDraft(null);
          }}
          onNavigateToPMS={() => {
            setEditingRoom(null);
            setEditDraft(null);
            onNavigateToSettings();
          }}
          onChange={setEditDraft}
          onSave={(draft) => {
            // 只存資料；modal 由 SaveSuccessDialog 的按鈕關閉
            handleSaveEdit(editingRoom.id, draft);
          }}
          onEnableTest={() => {
            const id = savedRuleIdRef.current ?? editingRoom.id;
            if (!id || id.startsWith("new-")) return;
            setRooms((prev) =>
              prev.map((r) => (r.id === id ? { ...r, enabled: true } : r)),
            );
            apiPatch(`/api/v1/faq/rules/${id}/toggle`, { is_enabled: true }).catch(() => {});
          }}
          onDelete={async () => {
            const id = editingRoom.id;
            const snapshot = editingRoom;
            setEditingRoom(null);
            setEditDraft(null);
            if (id.startsWith("new-")) return; // Not yet saved, nothing to delete
            setRooms((prev) => prev.filter((r) => r.id !== id));
            try {
              const res = await apiDelete(`/api/v1/faq/rules/${id}`);
              if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
            } catch {
              // Restore the deleted room on failure
              setRooms((prev) => [...prev, snapshot]);
            }
          }}
        />
      )}
    </div>
  );
});

// ------- 串接設定 Tab -------
const SYNC_OPTIONS = [
  "每 1 分鐘",
  "每 5 分鐘",
  "每 10 分鐘",
  "每 15 分鐘",
  "每 30 分鐘",
  "每 60 分鐘",
];

const EyeToggle = memo(function EyeToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ color: "#9E9E9E" }}
      className="shrink-0 hover:text-[#383838] transition-colors cursor-pointer p-0 border-none bg-transparent"
      tabIndex={-1}
      aria-label={show ? "隱藏" : "顯示"}
    >
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        {show ? (
          <>
            <path
              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <>
            <path
              d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="1"
              y1="1"
              x2="23"
              y2="23"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </button>
  );
});

const PMSConnectionSettings = memo(function PMSConnectionSettings() {
  const [pmsUrl, setPmsUrl] = useState("https://api.lilihotel.com/v2");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [syncFreq, setSyncFreq] = useState("每 5 分鐘");
  const [webhookUrl, setWebhookUrl] = useState(
    "https://starbit.io/webhook/pms/abc123",
  );
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const runTest = useCallback(async () => {
    setTesting(true);
    try {
      // 使用 FAQ PMS connection test endpoint (訂房 category)
      const res = await apiPost("/api/v1/faq/categories/697/pms-connection/test", {});
      const data = res as any;
      showToast(data?.message || "連線測試成功", "success");
      return true;
    } catch (e: any) {
      const detail = e?.detail || e?.message || "連線測試失敗";
      showToast(String(detail), "error");
      return false;
    } finally {
      setTesting(false);
    }
  }, [showToast]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    // 規格：先執行連線測試，成功才儲存
    const ok = await runTest();
    if (ok) {
      try {
        await apiPut("/api/v1/faq/categories/697/pms-connection/toggle", { status: "enabled" });
        showToast("連線測試成功，PMS 已啟用", "success");
      } catch {
        showToast("PMS 啟用失敗", "error");
      }
    }
    setSaving(false);
  }, [runTest, showToast]);

  const helperStyle: React.CSSProperties = { color: "#9E9E9E" };

  return (
    <div className="flex flex-col items-start px-[12px] py-[16px] w-full">
      <div className="flex flex-col gap-[32px] items-start shrink-0 w-full">
        {/* PMS Endpoint URL */}
        <div className="pms-field-row">
          <div className="pms-label-col">
            <div className="pms-label-inner flex gap-[2px] items-center">
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#383838] shrink-0">
                PMS Endpoint URL
              </p>
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#f44336] shrink-0">
                *
              </p>
            </div>
            <p
              style={helperStyle}
              className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5]"
            >
              PMS 系統的 API 端點位址
            </p>
          </div>
          <div className="pms-input-col">
            <div className="bg-white flex items-center min-h-[56px] w-full p-[16px] rounded-[8px]">
              <input
                type="text"
                value={pmsUrl}
                onChange={(e) => setPmsUrl(e.target.value)}
                placeholder="https://api.example.com/v2"
                className="flex-1 min-w-0 font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#383838] bg-transparent border-none outline-none"
              />
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="pms-field-row">
          <div className="pms-label-col">
            <div className="pms-label-inner flex gap-[2px] items-center">
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#383838] shrink-0">
                API Key
              </p>
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#f44336] shrink-0">
                *
              </p>
            </div>
            <p
              style={helperStyle}
              className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5]"
            >
              用於身份驗證的金鑰，請妥善保管
            </p>
          </div>
          <div className="pms-input-col">
            <div className="bg-white flex items-center min-h-[56px] w-full p-[16px] rounded-[8px] gap-[8px]">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                className="flex-1 min-w-0 font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#383838] bg-transparent border-none outline-none"
              />
              <EyeToggle
                show={showApiKey}
                onToggle={() => setShowApiKey((v) => !v)}
              />
            </div>
          </div>
        </div>

        {/* 同步頻率 */}
        <div className="pms-field-row">
          <div className="pms-label-col">
            <div className="pms-label-inner flex gap-[2px] items-center">
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#383838] shrink-0">
                同步頻率
              </p>
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#f44336] shrink-0">
                *
              </p>
            </div>
            <p
              style={helperStyle}
              className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5]"
            >
              資料自動同步的時間間隔
            </p>
          </div>
          <div className="pms-input-col">
            <div className="relative bg-white inline-flex items-center justify-center min-h-[56px] p-[16px] rounded-[8px] w-fit">
              <div className="flex gap-[8px] items-center pointer-events-none select-none">
                <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838] whitespace-nowrap">
                  {syncFreq}
                </p>
                <ArrowDownIcon />
              </div>
              <select
                value={syncFreq}
                onChange={(e) => setSyncFreq(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              >
                {SYNC_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Webhook 回傳 URL */}
        <div className="pms-field-row">
          <div className="pms-label-col">
            <div className="pms-label-inner flex gap-[2px] items-center">
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#383838] shrink-0">
                Webhook 回傳 URL
              </p>
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#f44336] shrink-0">
                *
              </p>
            </div>
            <p
              style={helperStyle}
              className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5]"
            >
              PMS 事件推送的接收位址
            </p>
          </div>
          <div className="pms-input-col">
            <div className="bg-white flex items-center min-h-[56px] w-full p-[16px] rounded-[8px]">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 min-w-0 font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[24px] text-[#383838] bg-transparent border-none outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-[8px] items-center justify-end shrink-0 w-full">
          <div className="flex flex-row items-center self-stretch">
            <button
              type="button"
              disabled={testing}
              onClick={runTest}
              className="flex gap-[2px] h-full items-center justify-center min-w-[72px] p-[8px] rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors disabled:opacity-50"
            >
              <span className="flex-[1_0_0] font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#0f6beb] text-center">
                {testing ? "測試中…" : "測試"}
              </span>
            </button>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="bg-[#242424] flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] shrink-0 w-[88px] cursor-pointer hover:bg-[#383838] transition-colors disabled:opacity-50"
          >
            <span className="flex-[1_0_0] font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white text-center">
              {saving ? "儲存中…" : "儲存設定"}
            </span>
          </button>
        </div>
      </div>
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

const DATA_SOURCES_PMS_INIT: DataSourceRow[] = [
  {
    type: "PMS",
    statusLabel: "未串接",
    statusColor: "gray",
    lastUpdated: "—",
    lastPublished: "—",
    enabled: false,
  },
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
  onNavigateToSettings,
}: {
  row: DataSourceRow;
  isLast: boolean;
  onToggle: (type: string, v: boolean) => void;
  onNavigateToSettings?: () => void;
}) {
  const isUnlinkedPms = row.type === "PMS" && row.statusLabel === "未串接";
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
            cursor: isUnlinkedPms ? "pointer" : undefined,
          }}
          className="inline-flex items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0"
          onClick={isUnlinkedPms ? onNavigateToSettings : undefined}
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
  sources,
  setSources,
  onNavigateToSettings,
}: {
  sources: DataSourceRow[];
  setSources: React.Dispatch<React.SetStateAction<DataSourceRow[]>>;
  onNavigateToSettings?: () => void;
}) {
  const { showToast } = useToast();

  // 監聽發佈事件，更新資料來源狀態
  useEffect(() => {
    const handler = () => {
      setSources((prev) =>
        prev.map((s) => {
          if (s.type === "PMS") {
            return s.enabled
              ? { ...s, statusLabel: "已串接", statusColor: "green" as const }
              : { ...s, statusLabel: "未串接", statusColor: "gray" as const };
          }
          return s.enabled
            ? { ...s, statusLabel: "已啟用", statusColor: "green" as const }
            : { ...s, statusLabel: "已停用", statusColor: "red" as const };
        }),
      );
    };
    window.addEventListener("faq-published", handler);
    return () => window.removeEventListener("faq-published", handler);
  }, [setSources]);

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
        共 {sources.length} 筆，引用順序如下
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
                onNavigateToSettings={onNavigateToSettings}
                row={row}
                isLast={idx === sources.length - 1}
                onToggle={(type, v) => {
                  if (type === "PMS") {
                    // Optimistic update — 只改 enabled，不改狀態
                    setSources((prev) =>
                      prev.map((s) =>
                        s.type === "PMS" ? { ...s, enabled: v } : s,
                      ),
                    );
                    apiPut("/api/v1/chatbot/pms-status", { enabled: v }).catch(() => {
                      setSources((prev) =>
                        prev.map((s) =>
                          s.type === "PMS" ? { ...s, enabled: !v } : s,
                        ),
                      );
                    });
                  } else {
                    setSources((prev) =>
                      prev.map((s) =>
                        s.type === type ? { ...s, enabled: v } : s,
                      ),
                    );
                  }
                  showToast(
                    v ? (
                      <>
                        {type} 同步至測試環境，請先進行對話測試以確保回覆品質{" "}
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
                    ) : `${type} 已停用`,
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
export default function PMSIntegration({
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings,
  onNavigateToAIChatbot,
}: PMSIntegrationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"data" | "sources" | "settings">(
    "data",
  );
  const [dataSources, setDataSources] = useState<DataSourceRow[]>(DATA_SOURCES_PMS_INIT);

  // Fetch PMS enabled status on mount
  useEffect(() => {
    apiGet("/api/v1/chatbot/pms-status")
      .then((res: any) => {
        const enabled = !!res?.enabled;
        const lastSync = res?.last_synced_at || "—";
        setDataSources((prev) =>
          prev.map((s) =>
            s.type === "PMS"
              ? {
                  ...s,
                  enabled,
                  statusLabel: enabled ? "已串接" : "未串接",
                  statusColor: enabled ? "green" : "gray",
                  lastUpdated: lastSync,
                  lastPublished: enabled ? lastSync : "—",
                }
              : s,
          ),
        );
      })
      .catch(() => {});
  }, []);

  const pmsEnabled = dataSources.find((s) => s.type === "PMS")?.enabled ?? false;
  const sourceName = pmsEnabled ? "PMS" : "自訂 FAQ";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
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

      {/* Main content */}
      <main
        className={`flex-1 bg-slate-50 transition-all duration-300 overflow-x-hidden overflow-y-auto ${
          sidebarOpen ? "ml-[330px] lg:ml-[280px] md:ml-[250px]" : "ml-[72px]"
        }`}
      >
        {/* Breadcrumb + Header */}
        <PageHeaderWithBreadcrumb
          breadcrumbItems={[
            { label: "AI Chatbot", onClick: onNavigateToAIChatbot },
            { label: "訂房", active: true },
          ]}
          title="訂房"
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
          <TabButton
            label="串接設定"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </div>

        {/* Content area */}
        <div
          className="px-[40px]"
          style={{ paddingTop: 16, paddingBottom: 24 }}
        >
          {activeTab === "data" && (
            <PMSDataTable
              onChangeSource={() => setActiveTab("sources")}
              onNavigateToSettings={() => setActiveTab("settings")}
              sourceName={sourceName}
            />
          )}
          {activeTab === "sources" && (
            <DataSourcesTable sources={dataSources} setSources={setDataSources} onNavigateToSettings={() => setActiveTab("settings")} />
          )}
          {activeTab === "settings" && <PMSConnectionSettings />}
        </div>
      </main>
    </div>
  );
}
