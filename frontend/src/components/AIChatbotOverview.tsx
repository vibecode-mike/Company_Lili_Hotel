
import { useState, useRef, memo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPut, apiPatch } from "../utils/apiClient";
import { useToast } from "./ToastProvider";

interface TokenUsage {
  total_quota: number;
  used_amount: number;
  remaining: number;
  usage_percent: number;
}


import Sidebar from "./Sidebar";
import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import svgPaths from "../imports/svg-icons-common";
import togglePaths from "../imports/svg-wbwsye31ry";
import ButtonEdit from "../imports/ButtonEdit";

interface AIChatbotOverviewProps {
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPMS?: () => void;
  onNavigateToFacilities?: () => void;
}

type CategoryStatus = "normal" | "error";
type TabType = "categories" | "connection";

interface CategoryRecord {
  id: string;
  name: string;
  pmsStatus: CategoryStatus;
  pmsLabel: string;
  pmsErrorCode?: string;
  faqStatus: "saved";
  faqLabel: string;
  lastUpdated: string;
  enabled: boolean;
}

interface FaqCategoryApi {
  id: number;
  name: string;
  is_active: boolean;
  rule_count: number;
  data_source_type?: string;
  updated_at?: string | null;
  pms_connection?: { status: string; last_synced_at: string | null } | null;
}

// Maps API category names to their correct display names (inner-page titles)
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  訂房: "訂房",
};

function mapApiCategory(cat: FaqCategoryApi): CategoryRecord {
  // Determine PMS status from API pms_connection field
  let pmsStatus: "normal" | "error" = "normal";
  let pmsLabel = "未串接";
  if (cat.data_source_type === "pms" && cat.pms_connection) {
    pmsLabel = cat.pms_connection.status === "enabled" ? "已串接" : "已停用";
    pmsStatus = cat.pms_connection.status === "enabled" ? "normal" : "error";
  }

  // Format last updated time from category updated_at
  let lastUpdated = "—";
  const ts = cat.updated_at;
  if (ts) {
    const d = new Date(ts);
    lastUpdated = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return {
    id: String(cat.id),
    name: CATEGORY_DISPLAY_NAMES[cat.name] ?? cat.name,
    pmsStatus,
    pmsLabel,
    faqStatus: "saved",
    faqLabel: cat.rule_count > 0 ? "已儲存" : "未設定",
    lastUpdated,
    enabled: cat.is_active,
  };
}

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
          <g clipPath="url(#clip0_toggle_overview)">
            <g />
            <path
              d={checked ? togglePaths.p13e42a00 : togglePaths.p3ed4d200}
              fill={checked ? "#0F6BEB" : "#E5E7EB"}
              className="transition-all duration-300 ease-in-out"
            />
          </g>
          <defs>
            <clipPath id="clip0_toggle_overview">
              <rect fill="white" height="40" width="40" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </button>
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

const StatusTag = memo(function StatusTag({
  label,
  color,
}: {
  label: string;
  color: "green" | "red" | "gray" | "none";
}) {
  const bgColor =
    color === "green"
      ? "#e4fcea"
      : color === "red"
        ? "#ffebee"
        : color === "gray"
          ? "#f5f5f5"
          : "transparent";
  const textColor =
    color === "green" ? "#00470c" : color === "gray" ? "#383838" : "#b71c1c";
  return (
    <div
      style={{ backgroundColor: bgColor }}
      className="inline-flex items-center justify-center min-w-[32px] p-[4px] rounded-[8px] shrink-0"
    >
      <p
        style={{ flex: "1 0 0", color: textColor }}
        className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] min-h-px min-w-px text-[16px] text-center whitespace-nowrap"
      >
        {label}
      </p>
    </div>
  );
});

function ViewDetailTooltip({ anchorRef, visible }: { anchorRef: React.RefObject<HTMLElement | null>; visible: boolean }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 4 });
    }
  }, [visible, anchorRef]);

  if (!visible) return null;
  return createPortal(
    <div
      className="fixed bg-[#383838] text-white text-[12px] leading-[1.5] font-['Noto_Sans_TC',sans-serif] font-normal rounded-[8px] p-[8px] whitespace-nowrap pointer-events-none"
      style={{ zIndex: 9999, top: pos.top, left: pos.left }}
    >
      查看詳細
    </div>,
    document.body,
  );
}

const TableRow = memo(function TableRow({
  record,
  isLast,
  onToggle,
  onEdit,
}: {
  record: CategoryRecord;
  isLast: boolean;
  onToggle: (id: string, v: boolean) => void;
  onEdit: (id: string) => void;
}) {
  const [nameHover, setNameHover] = useState(false);
  const [editHover, setEditHover] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);
  return (
    <tr
      className={`bg-white transition-colors hover:bg-[#f5f8ff] group ${
        !isLast ? "row-divider" : ""
      }`}
    >
      <td className="px-[12px] py-[12px] align-middle">
        <div
          ref={nameRef}
          className="relative inline-block cursor-pointer"
          onMouseEnter={() => setNameHover(true)}
          onMouseLeave={() => setNameHover(false)}
          onClick={() => onEdit(record.id)}
        >
          <p
            className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[14px] transition-colors"
            style={{ color: nameHover ? "#0F6BEB" : "#383838" }}
          >
            {record.name}
          </p>
        </div>
        <ViewDetailTooltip anchorRef={nameRef} visible={nameHover} />
      </td>

      <td className="px-[12px] py-[12px] align-middle">
        <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#383838] text-[14px] whitespace-nowrap">
            {record.lastUpdated}
          </p>
          {(() => {
            // Derive source type label + status
            if (record.pmsLabel !== "未串接") {
              // PMS is connected
              const active = record.pmsStatus === "normal";
              return (
                <StatusTag
                  label={`PMS ${active ? "已啟用" : "已停用"}`}
                  color={active ? "green" : "red"}
                />
              );
            }
            if (record.faqLabel === "已儲存") {
              return <StatusTag label="自訂 FAQ 已啟用" color="green" />;
            }
            return <StatusTag label="未串接" color="gray" />;
          })()}
        </div>
      </td>

      {/* 凍結欄：啟用狀態 */}
      <td
        style={{
          width: 104,
          position: "sticky",
          right: 68,
          zIndex: 1,
          boxShadow: "inset 1px 0 0 #ddd",
        }}
        className="px-[12px] py-[12px] align-middle bg-white group-hover:bg-[#f5f8ff] transition-colors"
      >
        <Toggle
          checked={record.enabled}
          onChange={(v) => onToggle(record.id, v)}
        />
      </td>

      {/* 凍結欄：動作 */}
      <td
        style={{ width: 68, position: "sticky", right: 0, zIndex: 1 }}
        className="px-[12px] py-[12px] align-middle bg-white group-hover:bg-[#f5f8ff] transition-colors"
      >
        <div
          ref={editRef}
          className="relative inline-block"
          onMouseEnter={() => setEditHover(true)}
          onMouseLeave={() => setEditHover(false)}
        >
          <ButtonEdit onClick={() => onEdit(record.id)} />
        </div>
        <ViewDetailTooltip anchorRef={editRef} visible={editHover} />
      </td>
    </tr>
  );
});

export default function AIChatbotOverview({
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings,
  onNavigateToPMS,
  onNavigateToFacilities,
}: AIChatbotOverviewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    apiGet("/api/v1/faq/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setCategories((json.data as FaqCategoryApi[]).map(mapApiCategory));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiGet("/api/v1/faq/token-usage")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setTokenUsage(json.data as TokenUsage);
      })
      .catch(() => {});
  }, []);

  const handleToggle = useCallback(async (id: string, v: boolean) => {
    const cat = categories.find((c) => c.id === id);
    const name = cat?.name ?? "";
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: v } : c)),
    );
    try {
      await apiPatch(`/api/v1/faq/categories/${id}/toggle`, { is_active: v });
      showToast(
        v ? (
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
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled: !v } : c)),
      );
    }
  }, [categories, showToast]);

  // Map display category name → inner-page navigator
  const CATEGORY_NAVIGATORS: Record<string, (() => void) | undefined> = {
    訂房: onNavigateToPMS,
    設施: onNavigateToFacilities,
  };

  const handleEdit = useCallback(
    (id: string) => {
      const record = categories.find((c) => c.id === id);
      const nav = record ? CATEGORY_NAVIGATORS[record.name] : undefined;
      if (nav) nav();
      else if (onNavigateToPMS) onNavigateToPMS();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, onNavigateToPMS, onNavigateToFacilities],
  );

  const handleClearSearch = useCallback(() => setSearch(""), []);

  const filtered = categories.filter((c) =>
    search.trim() === "" ? true : c.name.includes(search.trim()),
  );

  const enabledCount = categories.filter((c) => c.enabled).length;

  const marginLeft = sidebarOpen
    ? "ml-[330px] lg:ml-[280px] md:ml-[250px]"
    : "ml-[72px]";

  return (
    <div className="bg-slate-50 min-h-screen flex">
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
        className={`flex-1 bg-slate-50 transition-all duration-300 overflow-x-hidden overflow-y-auto min-h-screen ${marginLeft}`}
      >
        <PageHeaderWithBreadcrumb
          breadcrumbItems={[{ label: "AI Chatbot", active: true }]}
          title="AI Chatbot"
          description="統一管理 AI 回覆會使用的分類內容與資料狀態"
        />

        {/* Token 用量 */}
        <div className="px-[40px] pb-[20px] w-full">
          <div
            className="bg-[rgba(255,255,255,0.3)] relative rounded-[16px] w-full"
            data-name="Description Container"
          >
            <div
              aria-hidden="true"
              className="absolute border border-[#f0f6ff] border-solid inset-0 pointer-events-none rounded-[16px]"
            />
            <div className="flex flex-col justify-center w-full">
              <div className="box-border content-stretch flex flex-col gap-[8px] items-start justify-center p-[24px] relative w-full">
                {tokenUsage ? (
                  <>
                    <div
                      className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full"
                      data-name="Description Wrapper"
                    >
                      <div
                        className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0"
                        data-name="Description Text Container"
                      >
                        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">
                          AI Token 用量
                        </p>
                      </div>
                      <div
                        className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0"
                        data-name="Description Text Container"
                      >
                        <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">
                          {tokenUsage.remaining.toLocaleString()} / {tokenUsage.total_quota.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div
                      className="bg-[#f0f6ff] h-[8px] overflow-clip relative rounded-[80px] shrink-0 w-full"
                      data-name="usage status"
                    >
                      <div
                        className="absolute bg-[#3a87f2] h-[8px] left-0 rounded-[80px] top-0 transition-all duration-300"
                        style={{
                          width: `${Math.min(tokenUsage.usage_percent, 100)}%`,
                        }}
                        data-name="usage"
                      />
                    </div>
                    <div
                      className="relative shrink-0 w-full"
                      data-name="Description Wrapper"
                    >
                      <div className="flex flex-row items-center size-full">
                        <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative w-full">
                          <div
                            className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full"
                            data-name="Description Text Container"
                          >
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#a8a8a8] text-[12px] whitespace-nowrap">
                              已消耗 {tokenUsage.used_amount.toLocaleString()}（{tokenUsage.usage_percent}%） 耗盡 AI Token ，則啟用關鍵字回應模組
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {tokenUsage.remaining <= 0 && (
                      <div className="mt-[4px] px-[10px] py-[6px] bg-[#fef2f2] border border-[#fecaca] rounded-[8px]">
                        <p className="text-[12px] text-[#dc2626] font-medium font-['Noto_Sans_TC',sans-serif]">
                          Token 額度已用完，AI 回覆已停用。當前客服已啟用自動回應模組，須加值請聯繫系統商。
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#a8a8a8] text-[14px]">
                    載入中…
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="content-stretch flex items-center relative shrink-0 w-full px-[40px]">
          <TabButton
            label="分類"
            active={activeTab === "categories"}
            onClick={() => setActiveTab("categories")}
          />
        </div>

        <div
          className="px-[40px]"
          style={{ paddingTop: 16, paddingBottom: 24 }}
        >
          {activeTab === "categories" && (
            <div className="flex flex-col gap-[16px] items-start w-full">
              <div className="flex items-stretch gap-[4px] w-full">
                <div
                  className="bg-white flex gap-[28px] items-center px-[12px] py-[8px] rounded-[16px] shrink-0"
                  style={{ width: 292 }}
                >
                  <div
                    className="flex gap-[4px] items-center min-w-0"
                    style={{ flex: "1 1 0" }}
                  >
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
                      onClick={handleClearSearch}
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
                  onClick={handleClearSearch}
                  className="flex gap-[2px] items-center justify-center px-[8px] py-[8px] rounded-[12px] shrink-0 self-stretch cursor-pointer hover:bg-[#f0f6ff] active:bg-[#dce8fc] transition-colors"
                  type="button"
                >
                  <span className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#0f6beb] text-[16px] whitespace-nowrap">
                    清除全部條件
                  </span>
                </button>

                <div className="flex-1" />
              </div>

              <p className="text-[14px] text-[#6e6e6e] font-['Noto_Sans_TC',sans-serif]">
                共 {categories.length} 類，已啟用 {enabledCount} 類
              </p>

              <div className="w-full overflow-x-auto rounded-[16px] ring-1 ring-[#ddd]">
                <table
                  className="w-full border-separate"
                  style={{ minWidth: 700, borderSpacing: 0 }}
                >
                  <thead className="sticky top-0 z-[3]">
                    <tr className="bg-white [&>th]:border-b [&>th]:border-[#ddd]">
                      <th className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]">
                        分類
                      </th>
                      <th className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]">
                        最後更新{" "}
                        <span className="text-[11px] text-[#9ca3af] select-none font-['PingFang_TC',sans-serif]">
                          ⇅
                        </span>
                      </th>
                      {/* 凍結欄 header：啟用狀態 */}
                      <th
                        style={{
                          width: 104,
                          position: "sticky",
                          right: 68,
                          zIndex: 2,
                          boxShadow: "inset 1px 0 0 #ddd",
                        }}
                        className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]"
                      >
                        啟用狀態
                      </th>
                      {/* 凍結欄 header：動作 */}
                      <th
                        style={{
                          width: 68,
                          position: "sticky",
                          right: 0,
                          zIndex: 2,
                        }}
                        className="text-left px-[12px] py-[16px] font-normal text-[14px] text-[#383838] font-['Noto_Sans_TC',sans-serif] whitespace-nowrap bg-white border-b border-[#ddd]"
                      >
                        動作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="bg-white px-[12px] py-[40px] text-center text-[14px] text-[#6e6e6e] font-['Noto_Sans_TC',sans-serif]"
                        >
                          載入中…
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="bg-white px-[12px] py-[40px] text-center text-[14px] text-[#6e6e6e] font-['Noto_Sans_TC',sans-serif]"
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
            </div>
          )}

          {activeTab === "connection" && (
            <div className="flex items-center justify-center py-[80px]">
              <p className="text-[14px] text-[#6e6e6e] font-['Noto_Sans_TC',sans-serif]">
                串接設定（待實作）
              </p>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
