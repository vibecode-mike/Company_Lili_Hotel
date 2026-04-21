import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import Sidebar from "./Sidebar";
import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import { useNavigation } from "../contexts/NavigationContext";
import { useLineChannelStatus } from "../contexts/LineChannelStatusContext";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { apiGet } from "../utils/apiClient";

// ─── 比較期間設定 ──────────────────────────────────

type Period = "day" | "week" | "month" | "quarter" | "year";

const PERIOD_OPTIONS: { value: Period; name: string; trendPrefix: string }[] = [
  { value: "year", name: "年", trendPrefix: "相較去年" },
  { value: "quarter", name: "季", trendPrefix: "相較上季" },
  { value: "month", name: "月", trendPrefix: "相較上月" },
  { value: "week", name: "週", trendPrefix: "相較上週" },
  { value: "day", name: "日", trendPrefix: "相較昨天" },
];

const PERIOD_MAP: Record<Period, { name: string; trendPrefix: string }> = Object.fromEntries(
  PERIOD_OPTIONS.map((p) => [p.value, { name: p.name, trendPrefix: p.trendPrefix }]),
) as Record<Period, { name: string; trendPrefix: string }>;

// 格式化為 YYYY-MM-DD（台灣時區）
function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 根據 period 與方向（本期 / 上一期）計算日期區間
function getPeriodRange(period: Period, direction: "current" | "previous"): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "day") {
    const d = direction === "current" ? today : new Date(today.getTime() - 86400000);
    return { start: fmtDate(d), end: fmtDate(d) };
  }

  if (period === "week") {
    // 以星期一為週首
    const dow = (today.getDay() + 6) % 7;
    const mondayThis = new Date(today);
    mondayThis.setDate(today.getDate() - dow);
    if (direction === "current") {
      return { start: fmtDate(mondayThis), end: fmtDate(today) };
    }
    const mondayLast = new Date(mondayThis);
    mondayLast.setDate(mondayThis.getDate() - 7);
    const sundayLast = new Date(mondayLast);
    sundayLast.setDate(mondayLast.getDate() + 6);
    return { start: fmtDate(mondayLast), end: fmtDate(sundayLast) };
  }

  if (period === "month") {
    if (direction === "current") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: fmtDate(first), end: fmtDate(today) };
    }
    const firstLast = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastLast = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: fmtDate(firstLast), end: fmtDate(lastLast) };
  }

  if (period === "quarter") {
    const q = Math.floor(today.getMonth() / 3);
    if (direction === "current") {
      const first = new Date(today.getFullYear(), q * 3, 1);
      return { start: fmtDate(first), end: fmtDate(today) };
    }
    const prevQ = q - 1;
    const year = prevQ < 0 ? today.getFullYear() - 1 : today.getFullYear();
    const qIdx = prevQ < 0 ? 3 : prevQ;
    const first = new Date(year, qIdx * 3, 1);
    const last = new Date(year, qIdx * 3 + 3, 0);
    return { start: fmtDate(first), end: fmtDate(last) };
  }

  // year
  if (direction === "current") {
    const first = new Date(today.getFullYear(), 0, 1);
    return { start: fmtDate(first), end: fmtDate(today) };
  }
  const firstLast = new Date(today.getFullYear() - 1, 0, 1);
  const lastLast = new Date(today.getFullYear() - 1, 11, 31);
  return { start: fmtDate(firstLast), end: fmtDate(lastLast) };
}

// ─── 假資料 ──────────────────────────────────────────

// 其他 KPI 仍為假資料，僅 aiCoverage 改從 API 取（MOCK_KPI.aiCoverage 保留做 fallback 樣貌）
const MOCK_KPI = {
  aiCoverage: { value: 0, unit: "%", trend: 0, up: true },
  completedOrders: { value: 100, unit: "單", trend: 20, up: true },
  newMembers: { value: 100, unit: "人", trend: 2, up: false },
};

// ─── AI 覆蓋率 API ──────────────────────────────────────

interface UnansweredQuestion {
  message_id: string;
  thread_id: string;
  question: string;
  ai_reply: string;
  platform: string | null;
  created_at: string;
}

interface AiCoverageResponse {
  start_date: string;
  end_date: string;
  total: number;
  unanswered: number;
  coverage_rate: number;
  daily: Array<{ date: string; total: number; unanswered: number; coverage_rate: number }>;
  top_unanswered: UnansweredQuestion[];
}

interface CompletedOrdersResponse {
  start_date: string;
  end_date: string;
  total: number;
  daily: Array<{ date: string; count: number }>;
}

interface PendingConversation {
  thread_id: string;
  member_id: number | null;
  display_name: string;
  avatar_url: string | null;
  question: string;
  question_at: string;
  reason: "no_reply" | "ai_unanswered";
}

interface PendingConversationsResponse {
  total: number;
  items: PendingConversation[];
}

interface NewMembersResponse {
  start_date: string;
  end_date: string;
  source: string;
  total: number;
  daily: Array<{ date: string; count: number }>;
}


interface FaqItem {
  id: number;
  question: string;
  badge: string;
  badgeColor: string;
  date: string;
  aiAnswer: string;
}

const MOCK_FAQ: FaqItem[] = [
  {
    id: 1,
    question: "飯店可以幫忙生日佈置嗎？",
    badge: "Chatbot",
    badgeColor: "bg-blue-100 text-blue-700",
    date: "2026-04-10 08:00",
    aiAnswer:
      "AI 來自回覆160則訊息，建議加入知識庫：\n・飯店可以代為佈置嗎？\n・入住時間和退房時間是什麼時候？\n・飯店提供免費早餐嗎？\n・有無障礙設施嗎？",
  },
  {
    id: 2,
    question: "入住時間和退房時間是什麼？",
    badge: "Chatbot",
    badgeColor: "bg-green-100 text-green-700",
    date: "2026-04-10 08:00",
    aiAnswer:
      "入住時間為下午 15:00，退房時間為上午 11:00。如需提前入住或延遲退房，請提前與櫃台聯繫。",
  },
  {
    id: 3,
    question: "飯店提供免費早餐嗎？",
    badge: "Chatbot",
    badgeColor: "bg-red-100 text-red-700",
    date: "2026-04-10 08:00",
    aiAnswer:
      "部分房型包含免費自助早餐，供應時間為 07:00-10:00。未含早餐的房型可另外加購，每人 $350。",
  },
  {
    id: 4,
    question: "有無障礙設施嗎？",
    badge: "AI",
    badgeColor: "bg-yellow-100 text-yellow-700",
    date: "2026-04-10 08:00",
    aiAnswer:
      "飯店設有無障礙客房、電梯、無障礙坡道及專用停車位。如有特殊需求，請於訂房時告知。",
  },
];

// ─── 時段洞察 ─ 資料與工具 ─────────────────────
type Channel = "line" | "facebook" | "nonMember";

const CHANNELS: { key: Channel; label: string; total: number }[] = [
  { key: "line", label: "LINE 會員", total: 389 },
  { key: "facebook", label: "Facebook 會員", total: 79 },
  { key: "nonMember", label: "非會員（官網）", total: 70 },
];

// 每 4 小時為一個區間（6 列）x 7 天（欄）
const TIME_BLOCKS = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"] as const;

const HEATMAP_BY_CHANNEL: Record<Channel, number[][]> = {
  line: [
    [3, 4, 4, 3, 7, 9, 8],
    [2, 3, 3, 2, 8, 11, 6],
    [5, 7, 6, 5, 9, 12, 8],
    [7, 9, 11, 8, 16, 17, 89],
    [8, 6, 7, 6, 10, 11, 9],
    [5, 6, 7, 5, 9, 10, 8],
  ],
  facebook: [
    [1, 2, 2, 1, 3, 4, 3],
    [1, 2, 1, 1, 3, 4, 2],
    [2, 3, 2, 2, 4, 5, 3],
    [3, 4, 4, 3, 6, 8, 12],
    [3, 3, 3, 2, 5, 5, 4],
    [2, 2, 3, 2, 4, 4, 3],
  ],
  nonMember: [
    [1, 1, 1, 1, 2, 3, 2],
    [1, 1, 1, 1, 2, 2, 1],
    [2, 2, 2, 2, 3, 3, 2],
    [3, 3, 4, 3, 5, 6, 9],
    [2, 2, 3, 2, 4, 4, 3],
    [2, 2, 2, 2, 3, 3, 2],
  ],
};

const JOURNEY_TAGS: Record<Channel, string[]> = {
  line: ["經典九州", "限時限量", "九州小旅行", "精選南九州", "雄熊遇見你", "美讚小豆島", "懷舊九州"],
  facebook: ["秋櫻浪漫", "限量早鳥", "九州賞楓", "溫泉巡禮", "美食探索", "慢遊北海道"],
  nonMember: ["訂房查詢", "活動資訊", "房型介紹", "交通指南", "常見問題"],
};

// heatmap 色階：從 #FFDF94（少）到 #D24546（多）做等分線性插值
// 用 OKLab 色空間以避免 sRGB 直插中段變灰；瀏覽器 native 計算。
const HEATMAP_LOW = "#FFDF94";
const HEATMAP_HIGH = "#D24546";

function heatColor(value: number, min: number, max: number): string {
  const span = max - min;
  const t = span > 0 ? Math.min(1, Math.max(0, (value - min) / span)) : 0;
  const pct = Math.round(t * 1000) / 10; // 0.0–100.0
  return `color-mix(in oklab, ${HEATMAP_LOW}, ${HEATMAP_HIGH} ${pct}%)`;
}

// 由今天起算，回傳往後 7 天的顯示字串 'M/D（週）'
function getNext7DayLabels(): string[] {
  const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return `${d.getMonth() + 1}/${d.getDate()}（${weekdayNames[d.getDay()]}）`;
  });
}

function findMaxCell(data: number[][]): { r: number; c: number } {
  let best = { r: 0, c: 0, v: -Infinity };
  for (let r = 0; r < data.length; r++) {
    const row = data[r]!;
    for (let c = 0; c < row.length; c++) {
      const v = row[c]!;
      if (v > best.v) best = { r, c, v };
    }
  }
  return { r: best.r, c: best.c };
}

interface JourneyItem {
  tag: string;
  counts: [number, number, number]; // 對話、互動、轉單
}

// 依據選到的格子值回傳互動旅程的 stacked bar 資料。
// cellValue=89 時第一列恰為 7/6/3（與 Figma 標準稿一致），其餘依比例縮放。
function buildJourney(channel: Channel, cellValue: number): JourneyItem[] {
  const tags = JOURNEY_TAGS[channel];
  const scale = Math.max(0.12, cellValue / 89);
  const baseRows: [number, number, number][] = [
    [7, 6, 3],
    [6, 5, 2],
    [6, 5, 2],
    [5, 5, 3],
    [5, 5, 2],
    [5, 4, 2],
    [4, 4, 3],
    [4, 3, 2],
    [3, 3, 2],
  ];
  return tags.map((tag, i) => {
    const base = (baseRows[i] ?? baseRows[baseRows.length - 1])!;
    const a = Math.max(1, Math.round(base[0] * scale));
    const b = Math.max(1, Math.round(base[1] * scale));
    const c = Math.max(1, Math.round(base[2] * scale));
    return { tag, counts: [a, b, c] as [number, number, number] };
  });
}

// ─── 子元件 ─────────────────────────────────────

// 單一指標欄位（核心洞察卡內的 column）
function KpiColumn({
  label,
  value,
  unit,
  trend,
  up,
  trendPrefix,
  isFirst,
}: {
  label: string;
  value: number | string;
  unit: string;
  trend: number;
  up: boolean;
  trendPrefix: string;
  isFirst: boolean;
}) {
  // RWD：桌機 3 欄（左側分隔線）；手機 1 欄（上方分隔線）
  const dividerClass = isFirst
    ? ""
    : "border-t md:border-t-0 md:border-l border-solid border-[#ddd]";

  return (
    <div
      className={`flex-1 min-w-0 bg-white px-[20px] py-[16px] flex flex-col gap-[12px] ${dividerClass}`}
    >
      <div className="text-[16px] leading-[1.5] text-[#6e6e6e]">{label}</div>
      <div className="flex items-center gap-[12px]">
        <span className="text-[32px] leading-[1.5] font-medium text-[#383838] whitespace-nowrap">
          {value}
          {unit}
        </span>
      </div>
      <div
        className="flex items-center gap-[4px] text-[16px] leading-[1.5]"
        style={{ color: up ? "#005c0f" : "#b71c1c" }}
      >
        <span className="inline-flex size-[24px] items-center justify-center shrink-0">
          {up ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
        </span>
        <span className="whitespace-nowrap">
          {trendPrefix}{up ? "提升" : "下降"} {trend} %
        </span>
      </div>
    </div>
  );
}

// 核心洞察卡（含 header 的期間 dropdown + 3 個 KPI column）
function CoreInsightsCard({
  period,
  onPeriodChange,
  aiCoverage,
  completedOrders,
  newMembers,
}: {
  period: Period;
  onPeriodChange: (p: Period) => void;
  aiCoverage: { value: number | string; unit: string; trend: number; up: boolean };
  completedOrders: { value: number | string; unit: string; trend: number; up: boolean };
  newMembers: { value: number | string; unit: string; trend: number; up: boolean };
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 點 dropdown 外部時關閉選單
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const { name: periodName, trendPrefix } = PERIOD_MAP[period];

  return (
    <div className="bg-white rounded-[16px] border border-solid border-[#ddd] overflow-hidden flex flex-col w-full">
      {/* Header：核心洞察 + 期間 dropdown + 描述 */}
      <div className="bg-white border-b border-solid border-[#ddd] py-[16px]">
        <div className="flex items-start">
          <div className="flex-1 min-w-0 px-[20px] flex flex-col gap-[4px] self-stretch">
            <div className="flex items-center gap-[4px] w-full">
              <span className="text-[16px] leading-[1.5] text-[#383838]">核心洞察</span>

              {/* 比較期間 dropdown */}
              <div ref={wrapRef} className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-[2px] justify-center p-[4px] rounded-[8px] cursor-pointer hover:bg-[#f0f6ff] transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  aria-label="切換比較期間"
                >
                  <span className="text-[16px] leading-[1.5] text-[#0f6beb] text-center min-w-[32px] whitespace-nowrap">
                    {periodName}
                  </span>
                  <span className="inline-flex size-[24px] items-center justify-center">
                    <ChevronDown
                      size={20}
                      color="#0f6beb"
                      strokeWidth={2}
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>

                {open && (
                  <ul
                    role="listbox"
                    className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[120px] bg-white border border-solid border-[#ddd] rounded-[8px] shadow-md py-[4px]"
                  >
                    {PERIOD_OPTIONS.map((opt) => {
                      const selected = opt.value === period;
                      return (
                        <li key={opt.value} role="option" aria-selected={selected}>
                          <button
                            type="button"
                            onClick={() => {
                              onPeriodChange(opt.value);
                              setOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-[12px] py-[8px] text-[14px] leading-[1.5] text-left cursor-pointer transition-colors hover:bg-[#f0f6ff] ${
                              selected ? "text-[#0f6beb]" : "text-[#383838]"
                            }`}
                          >
                            <span>{opt.name}</span>
                            {selected && <Check size={14} className="text-[#0f6beb]" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex items-center w-full">
              <span className="text-[16px] leading-[1.5] text-[#6e6e6e]">描述描述</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body：3 columns（桌機橫排、手機直排） */}
      <div className="flex flex-col md:flex-row items-stretch w-full">
        <KpiColumn label="AI 覆蓋率" {...aiCoverage} trendPrefix={trendPrefix} isFirst />
        <KpiColumn label="完成訂單" {...completedOrders} trendPrefix={trendPrefix} isFirst={false} />
        <KpiColumn label="新增會員" {...newMembers} trendPrefix={trendPrefix} isFirst={false} />
      </div>
    </div>
  );
}

function FaqRow({
  item,
  index,
  isExpanded,
  onToggle,
}: {
  item: FaqItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#f0f6ff] last:border-b-0">
      <div className="flex items-center justify-between py-[12px] px-[4px]">
        <div className="flex items-center gap-[12px] flex-1 min-w-0">
          <span className="text-[#a8a8a8] text-[14px] w-[20px] shrink-0">
            {index + 1}.
          </span>
          <span
            className={`text-[12px] px-[8px] py-[2px] rounded-full font-medium shrink-0 ${item.badgeColor}`}
          >
            {item.badge}
          </span>
          <span className="text-[14px] text-[#383838] truncate">
            {item.question}
          </span>
        </div>
        <div className="flex items-center gap-[16px] shrink-0 ml-[16px]">
          <span className="text-[12px] text-[#a8a8a8]">{item.date}</span>
          <button
            onClick={onToggle}
            className="text-[#0f6beb] text-[14px] hover:underline flex items-center gap-[4px] cursor-pointer"
          >
            查看詳情
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="bg-[#f8fafc] rounded-[12px] p-[16px] mx-[24px] mb-[12px] text-[14px] text-[#6e6e6e] whitespace-pre-line">
          {item.aiAnswer}
        </div>
      )}
    </div>
  );
}

// Info icon matching Figma (16x16 outlined info)
function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 size-[16px] ${className}`}
      fill="none"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        fill="#6E6E6E"
        d="M8 1.333A6.667 6.667 0 1 0 8 14.667 6.667 6.667 0 0 0 8 1.333Zm0 12A5.333 5.333 0 1 1 8 2.667a5.333 5.333 0 0 1 0 10.666Zm.667-8h-1.334v-1.333h1.334V5.333Zm0 5.334h-1.334V6.667h1.334v4Z"
      />
    </svg>
  );
}

// 時段洞察 + 互動旅程：一張卡三個區段
function TimeInsightsSection() {
  const dateLabels = useMemo(() => getNext7DayLabels(), []);
  const [channel, setChannel] = useState<Channel>("line");
  const [cell, setCell] = useState(() => findMaxCell(HEATMAP_BY_CHANNEL.line));
  const [loadingJourney, setLoadingJourney] = useState(false);

  const heatmap = HEATMAP_BY_CHANNEL[channel];
  const { min, max } = useMemo(() => {
    const flat = heatmap.flat();
    return { min: Math.min(...flat), max: Math.max(...flat) };
  }, [heatmap]);
  const selectedValue = heatmap[cell.r]?.[cell.c] ?? 0;
  const journey = useMemo(
    () => buildJourney(channel, selectedValue),
    [channel, selectedValue],
  );
  const maxJourneyTotal = useMemo(
    () =>
      Math.max(
        1,
        ...journey.map((j) => j.counts.reduce((s, v) => s + v, 0)),
      ),
    [journey],
  );

  // 切換 channel 時重新聚焦在該 channel 的最高值格子
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setCell(findMaxCell(HEATMAP_BY_CHANNEL[channel]));
  }, [channel]);

  // cell 或 channel 改變 → 模擬 loading，重繪下方互動旅程
  const cellKey = `${channel}|${cell.r}|${cell.c}`;
  useEffect(() => {
    setLoadingJourney(true);
    const t = setTimeout(() => setLoadingJourney(false), 260);
    return () => clearTimeout(t);
  }, [cellKey]);

  return (
    <div className="bg-white rounded-[16px] border border-solid border-[#ddd] flex flex-col w-full overflow-hidden">
      {/* A. 標題 + 三個渠道 tab */}
      <div className="flex items-stretch border-b border-solid border-[#ddd] flex-col md:flex-row">
        <div className="flex-1 min-w-0 px-[20px] py-[16px] flex flex-col gap-[4px] self-stretch">
          <div className="flex items-center gap-[4px]">
            <span className="text-[16px] leading-[1.5] text-[#383838]">時段洞察</span>
            <InfoIcon />
          </div>
          <span className="text-[16px] leading-[1.5] text-[#6e6e6e]">
            描述描述
          </span>
        </div>
        <div className="flex shrink-0 border-t md:border-t-0 border-solid border-[#ddd] overflow-x-auto">
          {CHANNELS.map((ch, idx) => {
            const active = channel === ch.key;
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => setChannel(ch.key)}
                aria-pressed={active}
                className={`${idx === 0 ? "md:border-l" : "border-l"} border-solid border-[#ddd] px-[24px] py-[16px] flex flex-col gap-[12px] items-start justify-center min-w-[152px] transition-colors cursor-pointer ${
                  active ? "bg-[#f7f7f7]" : "bg-white hover:bg-[#fafafa]"
                }`}
              >
                <span className="text-[16px] leading-[1.5] text-[#6e6e6e] whitespace-nowrap">
                  {ch.label}
                </span>
                <span className="text-[32px] leading-[1.5] font-medium text-[#383838] whitespace-nowrap">
                  {ch.total}人次
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* B. Heatmap：7 欄 x 6 列 + 時間/日期標籤 + 圖例 */}
      <div className="bg-white border-b border-solid border-[#ddd] px-[20px] py-[16px] flex flex-col gap-[16px]">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div
              className="grid items-stretch"
              style={{ gridTemplateColumns: "44px repeat(7, minmax(0, 1fr))" }}
            >
              {TIME_BLOCKS.map((label, r) => (
                <Fragment key={`row-${r}`}>
                  <div
                    className="pr-[4px] flex items-start justify-end text-[14px] leading-[1.5] text-[#6e6e6e]"
                    style={{ minHeight: 64 }}
                  >
                    {label}
                  </div>
                  {(heatmap[r] ?? []).map((value, c) => {
                    const isSelected = cell.r === r && cell.c === c;
                    return (
                      <button
                        key={`cell-${r}-${c}`}
                        type="button"
                        onClick={() => setCell({ r, c })}
                        aria-pressed={isSelected}
                        aria-label={`${dateLabels[c]} ${label} 時段：${value} 人`}
                        className={`flex items-center justify-center text-[16px] leading-[1.5] text-[#383838] p-[4px] transition-[filter,box-shadow] cursor-pointer focus:outline-none ${
                          isSelected
                            ? "ring-2 ring-[#0f6beb] ring-inset relative z-10"
                            : "hover:brightness-95"
                        }`}
                        style={{ backgroundColor: heatColor(value, min, max), minHeight: 64 }}
                      >
                        {value}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
              {/* 最底列：日期標籤 */}
              <div />
              {dateLabels.map((label, i) => (
                <div
                  key={`date-${i}`}
                  className="pt-[12px] text-center text-[14px] leading-[1.5] text-[#6e6e6e] whitespace-nowrap"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 色階圖例（少 → 多） */}
        <div className="flex items-center gap-[4px] pl-[44px]">
          <span className="text-[14px] leading-[1.5] text-[#6e6e6e]">少</span>
          <div
            className="h-[8px] w-[100px] rounded-[2px]"
            style={{
              backgroundImage:
                "linear-gradient(in oklab 90deg, #FFDF94 0%, #D24546 100%)",
            }}
          />
          <span className="text-[14px] leading-[1.5] text-[#6e6e6e]">多</span>
          <span className="text-[14px] leading-[1.5] text-[#6e6e6e]">（人）</span>
        </div>
      </div>

      {/* C. 互動旅程：標題 + 三個彩色底線 tab + stacked bar list */}
      <div className="bg-white flex flex-col">
        <div className="flex items-stretch border-b border-solid border-[#ddd] flex-col md:flex-row">
          <div className="flex-[0_0_auto] md:flex-1 md:min-w-0 px-[20px] py-[16px] flex items-center gap-[4px]">
            <span className="text-[16px] leading-[1.5] text-[#6e6e6e] whitespace-nowrap">
              此{" "}
              <span className="font-medium text-[#383838]">{selectedValue}</span>{" "}
              人次的互動旅程
            </span>
            <InfoIcon />
          </div>
          <div className="flex shrink-0 md:shrink md:min-w-0 md:flex-[3]">
            {[
              { label: "對話", color: "#83bfff" },
              { label: "互動", color: "#2578ff" },
              { label: "轉單", color: "#004ac2" },
            ].map((t, i) => (
              <div
                key={t.label}
                className={`flex-1 min-w-0 py-[16px] px-[24px] flex items-center ${i === 0 ? "md:border-l-0" : "border-l"} border-solid border-[#ddd]`}
                style={{ borderBottom: `6px solid ${t.color}` }}
              >
                <span className="text-[24px] leading-[1.5] text-[#383838] whitespace-nowrap">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-[20px] py-[16px] flex flex-col gap-[12px] relative min-h-[380px]">
          {loadingJourney ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#0f6beb] border-r-transparent"
                aria-label="載入中"
              />
            </div>
          ) : (
            journey.map((item) => {
              const total = item.counts.reduce((a, b) => a + b, 0);
              const segColors = ["#83bfff", "#2578ff", "#004ac2"];
              return (
                <div key={item.tag} className="flex items-center gap-[4px] w-full">
                  <div className="flex items-center min-w-[160px] md:min-w-[208px] md:w-[208px] shrink-0">
                    <span className="bg-[#f0f6ff] rounded-[8px] px-[8px] py-[4px] min-w-[32px] text-[#0f6beb] text-[16px] leading-[1.5] text-center whitespace-nowrap">
                      {`{${item.tag}}`}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-[8px]">
                    <div className="flex-1 min-w-0 bg-[#fafafa] rounded-[4px] overflow-hidden flex items-center">
                      {item.counts.map((count, idx) => {
                        const widthPct = (count / maxJourneyTotal) * 100;
                        if (widthPct <= 0) return null;
                        return (
                          <div
                            key={idx}
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: segColors[idx],
                            }}
                            className="flex items-center justify-center text-white text-[16px] leading-[1.5] py-[10px] px-[4px] whitespace-nowrap"
                          >
                            {count}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[16px] leading-[1.5] text-[#6e6e6e] whitespace-nowrap shrink-0">
                      {total} 次
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 主元件 ─────────────────────────────────────

interface InsightsPanelProps {
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
}

export default function InsightsPanel({
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings,
}: InsightsPanelProps) {
  const { navigate } = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isConfigured } = useLineChannelStatus();
  const navigationLocked = !isConfigured;

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // 比較期間（預設：月 = 本月 vs 上月）
  const [period, setPeriod] = useState<Period>("month");

  // AI 覆蓋率：本期 + 上一期（跟著 period 切換）
  const [aiCoverage, setAiCoverage] = useState<AiCoverageResponse | null>(null);
  const [aiCoveragePrev, setAiCoveragePrev] = useState<AiCoverageResponse | null>(null);
  // 完成訂單：本期 + 上一期
  const [orders, setOrders] = useState<CompletedOrdersResponse | null>(null);
  const [ordersPrev, setOrdersPrev] = useState<CompletedOrdersResponse | null>(null);
  // 新增會員：本期 + 上一期（預設 source=line，未來可擴充）
  const [newMembers, setNewMembers] = useState<NewMembersResponse | null>(null);
  const [newMembersPrev, setNewMembersPrev] = useState<NewMembersResponse | null>(null);
  // 待回覆對話（不受 period 影響，是整體未處理的 snapshot）
  const [pending, setPending] = useState<PendingConversationsResponse | null>(null);

  useEffect(() => {
    const curr = getPeriodRange(period, "current");
    const prev = getPeriodRange(period, "previous");

    const loadCoverage = async (start: string, end: string, topN: number) => {
      const res = await apiGet(`/api/v1/analytics/ai-coverage?start_date=${start}&end_date=${end}&top_n=${topN}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as AiCoverageResponse;
    };
    const loadOrders = async (start: string, end: string) => {
      const res = await apiGet(`/api/v1/analytics/completed-orders?start_date=${start}&end_date=${end}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as CompletedOrdersResponse;
    };

    loadCoverage(curr.start, curr.end, 10)
      .then(setAiCoverage)
      .catch((err) => console.error("[InsightsPanel] load current coverage failed:", err));
    loadCoverage(prev.start, prev.end, 1)
      .then(setAiCoveragePrev)
      .catch((err) => console.error("[InsightsPanel] load previous coverage failed:", err));

    loadOrders(curr.start, curr.end)
      .then(setOrders)
      .catch((err) => console.error("[InsightsPanel] load current orders failed:", err));
    loadOrders(prev.start, prev.end)
      .then(setOrdersPrev)
      .catch((err) => console.error("[InsightsPanel] load previous orders failed:", err));

    // 新增會員（預設 source=line；未來要展開 fb/webchat/all 時直接加 query 即可）
    const loadMembers = async (start: string, end: string) => {
      const res = await apiGet(
        `/api/v1/analytics/new-members?start_date=${start}&end_date=${end}&source=line`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as NewMembersResponse;
    };
    loadMembers(curr.start, curr.end)
      .then(setNewMembers)
      .catch((err) => console.error("[InsightsPanel] load current new-members failed:", err));
    loadMembers(prev.start, prev.end)
      .then(setNewMembersPrev)
      .catch((err) => console.error("[InsightsPanel] load previous new-members failed:", err));
  }, [period]);

  // 待回覆對話：只在第一次載入，不跟 period 綁定（是 snapshot）
  useEffect(() => {
    apiGet(`/api/v1/analytics/pending-conversations?limit=50`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setPending((await res.json()) as PendingConversationsResponse);
      })
      .catch((err) => console.error("[InsightsPanel] load pending conversations failed:", err));
  }, []);

  // KPI 卡顯示值（本期覆蓋率 + 相較上一期的趨勢）
  const aiCoverageKpi = useMemo(() => {
    if (!aiCoverage) return MOCK_KPI.aiCoverage;
    const curr = aiCoverage.coverage_rate;
    const prev = aiCoveragePrev?.coverage_rate ?? 0;
    const diff = Math.round((curr - prev) * 10) / 10;
    return {
      value: curr,
      unit: "%",
      trend: Math.abs(diff),
      up: diff >= 0,
    };
  }, [aiCoverage, aiCoveragePrev]);

  // 完成訂單 KPI（本期單數 + 與上一期成長率）
  const completedOrdersKpi = useMemo(() => {
    if (!orders) return MOCK_KPI.completedOrders;
    const curr = orders.total;
    const prev = ordersPrev?.total ?? 0;
    // 成長率：上期=0 時，若本期>0 顯示 100%、本期=0 顯示 0%
    let trend = 0;
    let up = true;
    if (prev === 0) {
      trend = curr > 0 ? 100 : 0;
      up = true;
    } else {
      const ratio = ((curr - prev) / prev) * 100;
      trend = Math.abs(Math.round(ratio));
      up = ratio >= 0;
    }
    return {
      value: curr,
      unit: "單",
      trend,
      up,
    };
  }, [orders, ordersPrev]);

  // 新增會員 KPI（目前僅 LINE 好友，同成長率算法）
  const newMembersKpi = useMemo(() => {
    if (!newMembers) return MOCK_KPI.newMembers;
    const curr = newMembers.total;
    const prev = newMembersPrev?.total ?? 0;
    let trend = 0;
    let up = true;
    if (prev === 0) {
      trend = curr > 0 ? 100 : 0;
      up = true;
    } else {
      const ratio = ((curr - prev) / prev) * 100;
      trend = Math.abs(Math.round(ratio));
      up = ratio >= 0;
    }
    return {
      value: curr,
      unit: "人",
      trend,
      up,
    };
  }, [newMembers, newMembersPrev]);

  return (
    <div className="bg-slate-50 min-h-screen flex">
      <Sidebar
        currentPage="insights"
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToAutoReply={onNavigateToAutoReply}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToSettings={onNavigateToSettings}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={setSidebarOpen}
        navigationLocked={navigationLocked}
        lockedTooltip="請先完成基本設定"
      />

      <main
        className={`flex-1 transition-all duration-300 overflow-x-hidden overflow-y-auto ${sidebarOpen ? "ml-[330px] lg:ml-[280px] md:ml-[250px]" : "ml-[72px]"}`}
      >
        <PageHeaderWithBreadcrumb
          breadcrumbItems={[{ label: "數據洞察", active: true }]}
          title="數據洞察"
          description="讓AI幫助優化服務品質"
        />

        <div className="px-[40px] pb-[40px] flex flex-col gap-[16px]">

          {/* 核心洞察卡（整合 AI 覆蓋率 / 完成訂單 / 新增會員） */}
          <CoreInsightsCard
            period={period}
            onPeriodChange={setPeriod}
            aiCoverage={aiCoverageKpi}
            completedOrders={completedOrdersKpi}
            newMembers={newMembersKpi}
          />

          {/* 行動建議區塊 */}
          <div className="bg-[rgba(255,255,255,0.3)] relative rounded-[16px] w-full">
            <div aria-hidden="true" className="absolute border border-[#f0f6ff] border-solid inset-0 pointer-events-none rounded-[16px]" />
            <div className="relative p-[24px] flex flex-col gap-[24px]">
              <p className="text-[16px] text-[#383838] font-medium">
                行動建議
              </p>

              {/* 1. 待回覆對話（含：使用者訊息無人回 + AI 被標 unanswered 的對話） */}
              <div>
                <p className="text-[14px] text-[#383838] mb-[12px]">
                  1. <span style={{ color: "#dc2626" }}>{pending?.total ?? 0}則</span>對話待回覆
                </p>
                <div className="flex flex-col">
                  {pending && pending.items.length > 0 ? (
                    pending.items.map((item) => (
                      <div
                        key={item.thread_id}
                        className="flex items-center justify-between py-[10px] border-b border-[#f0f6ff] last:border-b-0"
                      >
                        <div className="flex items-center gap-[10px] min-w-0">
                          {item.avatar_url ? (
                            <img
                              src={item.avatar_url}
                              alt={item.display_name}
                              className="w-[32px] h-[32px] rounded-full shrink-0 object-cover"
                            />
                          ) : (
                            <div className="w-[32px] h-[32px] rounded-full shrink-0 bg-[#e5e7eb] flex items-center justify-center text-[12px] text-[#6e6e6e]">
                              {item.display_name?.[0] ?? "?"}
                            </div>
                          )}
                          <span className="text-[14px] text-[#0f6beb] font-medium shrink-0 max-w-[120px] truncate">
                            {item.display_name}
                          </span>
                          <span className="text-[14px] text-[#383838] truncate" title={item.question}>
                            {item.question}
                          </span>
                        </div>
                        <div className="flex items-center gap-[16px] shrink-0 ml-[16px]">
                          <span className="text-[12px] text-[#a8a8a8]">
                            {item.question_at?.slice(0, 16).replace("T", " ")}
                          </span>
                          <button className="text-[#0f6beb] text-[14px] hover:underline cursor-pointer">查看詳情</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-[10px] text-[13px] text-[#a8a8a8]">
                      目前沒有待回覆的對話
                    </div>
                  )}
                </div>
              </div>

              {/* 2. AI 未能回答的訊息（本月） */}
              <div>
                <p className="text-[14px] text-[#383838] mb-[12px]">
                  2. AI 未能回答
                  <span style={{ color: "#dc2626" }}>
                    {aiCoverage?.unanswered ?? 0}則
                  </span>
                  訊息，建議加入知識庫
                </p>
                <div className="flex flex-col">
                  {aiCoverage && aiCoverage.top_unanswered.length > 0 ? (
                    aiCoverage.top_unanswered.map((q) => (
                      <div
                        key={q.message_id}
                        className="flex items-center justify-between py-[10px] border-b border-[#f0f6ff] last:border-b-0"
                      >
                        <span className="text-[14px] text-[#6e6e6e] truncate" title={q.question}>
                          {q.question || "(無對應提問)"}
                        </span>
                        <div className="flex items-center gap-[16px] shrink-0 ml-[16px]">
                          <span className="text-[12px] text-[#a8a8a8]">
                            {q.created_at?.slice(0, 16).replace("T", " ")}
                          </span>
                          <button className="text-[#0f6beb] text-[14px] hover:underline cursor-pointer">
                            加入知識庫
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-[10px] text-[13px] text-[#a8a8a8]">
                      目前本月沒有 AI 答不出的問題
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 時段洞察 + 互動旅程 */}
          <TimeInsightsSection />
        </div>
      </main>
    </div>
  );
}
