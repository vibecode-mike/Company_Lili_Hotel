import { useState, useMemo, useEffect, useLayoutEffect, useRef, useDeferredValue, Fragment } from "react";
import { createPortal } from "react-dom";
import Sidebar from "./Sidebar";
import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import { useNavigation } from "../contexts/NavigationContext";
import { useLineChannelStatus } from "../contexts/LineChannelStatusContext";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { apiGet } from "../utils/apiClient";
import { formatUnansweredTime } from "../utils/memberTime";
import { Odometer } from "./Odometer";
import { useInViewOnce } from "../hooks/useInViewOnce";
import { useReducedMotion } from "../hooks/useReducedMotion";

// ─── 比較期間設定 ──────────────────────────────────

type Period = "day" | "week" | "month" | "quarter" | "year";

const PERIOD_OPTIONS: { value: Period; name: string; trendPrefix: string }[] = [
  { value: "day", name: "日", trendPrefix: "相較昨天" },
  { value: "week", name: "週", trendPrefix: "相較上週" },
  { value: "month", name: "月", trendPrefix: "相較上月" },
  { value: "quarter", name: "季", trendPrefix: "相較上季" },
  { value: "year", name: "年", trendPrefix: "相較去年" },
];

const PERIOD_MAP: Record<Period, { name: string; trendPrefix: string }> = Object.fromEntries(
  PERIOD_OPTIONS.map((p) => [p.value, { name: p.name, trendPrefix: p.trendPrefix }]),
) as Record<Period, { name: string; trendPrefix: string }>;

// 格式化為 YYYY-MM-DD（臺灣時區）
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
      "入住時間為下午 15:00，退房時間為上午 11:00。如需提前入住或延遲退房，請提前與櫃臺聯繫。",
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

// ⚠️ 時段洞察假數據注入（開發展示用）⚠️
// 為了檢視色塊色階分佈，把 FAKE_HEATMAP_DATES 列出的日期灌固定假值（5-100）；
// 其他日期維持後端真實資料。最後一欄 4/23 保留真實。
// 還原方式：把 FAKE_HEATMAP_ENABLED 改為 false（或把這整段 + load 內的注入段落刪掉）。
const FAKE_HEATMAP_ENABLED = true;
const FAKE_HEATMAP_DATES = [
  "2026-04-17",
  "2026-04-18",
  "2026-04-19",
  "2026-04-20",
  "2026-04-21",
  "2026-04-22",
];
// 每個渠道 6 列（時段）× 6 欄（日期 4/17-4/22）
const FAKE_HEATMAP_MATRIX: Record<"line" | "facebook" | "nonMember", number[][]> = {
  line: [
    [8, 15, 22, 35, 50, 78],
    [5, 12, 28, 42, 65, 95],
    [10, 25, 40, 55, 72, 88],
    [18, 33, 48, 62, 80, 100],
    [9, 22, 38, 52, 70, 92],
    [6, 16, 30, 45, 58, 82],
  ],
  facebook: [
    [7, 12, 20, 28, 40, 60],
    [5, 10, 22, 35, 45, 55],
    [8, 18, 28, 38, 48, 70],
    [12, 25, 35, 50, 60, 80],
    [9, 15, 25, 35, 55, 65],
    [6, 11, 18, 30, 42, 50],
  ],
  nonMember: [
    [5, 10, 15, 20, 30, 45],
    [5, 8, 12, 18, 25, 35],
    [7, 12, 20, 25, 32, 50],
    [10, 18, 25, 35, 45, 60],
    [6, 9, 15, 22, 30, 48],
    [5, 7, 11, 16, 22, 38],
  ],
};

const CHANNELS: { key: Channel; label: string; total: number }[] = [
  { key: "line", label: "LINE", total: 389 },
  { key: "facebook", label: "Facebook 會員", total: 79 },
  { key: "nonMember", label: "官網", total: 70 },
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

// heatmap 色階：兩段漸層 淺黃 → 鮮紅
// 用 OKLCH 色空間沿色相走，路徑經過橘色、保持高彩度，避免中段變灰。
// 另外 HEATMAP_MAX 用紫紅，專門給「數值等於當前最大值」的那幾格，凸顯極值。
const HEATMAP_LOW = "#FFEBA8";
const HEATMAP_HIGH = "#E53845";
const HEATMAP_MAX = "#CF3868";

function heatColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const pct = Math.round(clamped * 1000) / 10; // 0.0–100.0
  return `color-mix(in oklch shorter hue, ${HEATMAP_LOW}, ${HEATMAP_HIGH} ${pct}%)`;
}

// 對 42 格計算色階 t：rank 百分位 × log-scale 幅度感知 的混合。
//  - rank 成分：ties 取平均 rank，確保 42 格均勻鋪滿色階（小差異看得到）。
//  - log 成分：以 log(v) 正規化至 [0,1]，讓離羣值（如 line 的 89）與
//    次高值（17）之間保持實際幅度差，避免全部擠在色階頂端。
const RANK_WEIGHT = 0.5;
const LOG_WEIGHT = 0.5;

function computeColorMap(data: number[][]): number[][] {
  const flat: { r: number; c: number; v: number }[] = [];
  let minV = Infinity;
  let maxV = -Infinity;
  for (let r = 0; r < data.length; r++) {
    const row = data[r]!;
    for (let c = 0; c < row.length; c++) {
      const v = row[c]!;
      flat.push({ r, c, v });
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
  }
  flat.sort((a, b) => a.v - b.v);
  const n = flat.length;
  const logMin = Math.log(Math.max(1, minV));
  const logMax = Math.log(Math.max(1, maxV));
  const logSpan = logMax - logMin;
  const out: number[][] = data.map((row) => row.map(() => 0));

  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && flat[j + 1]!.v === flat[i]!.v) j++;
    const avgRank = (i + j) / 2;
    const rankT = n > 1 ? avgRank / (n - 1) : 0;
    const logT =
      logSpan > 0 ? (Math.log(Math.max(1, flat[i]!.v)) - logMin) / logSpan : 0;
    const t = RANK_WEIGHT * rankT + LOG_WEIGHT * logT;
    for (let k = i; k <= j; k++) {
      const { r, c } = flat[k]!;
      out[r]![c] = t;
    }
    i = j + 1;
  }
  return out;
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
// 由呼叫端透過 className 決定是否帶 border-l divider。
function KpiColumn({
  label,
  value,
  unit,
  trend,
  up,
  trendPrefix,
  className = "",
  inView = false,
  reducedMotion = false,
  staggerDelay = 0,
}: {
  label: string;
  value: number | string;
  unit: string;
  trend: number;
  up: boolean;
  trendPrefix: string;
  className?: string;
  // 進場觸發旗標：父層的 IntersectionObserver 命中後傳入 true
  inView?: boolean;
  reducedMotion?: boolean;
  // 三張卡之間的進場 stagger（0 / 80 / 160 ms）
  staggerDelay?: number;
}) {
  return (
    <div
      className={`flex-1 min-w-0 bg-white px-[20px] py-[16px] flex flex-col gap-[12px] ${className}`}
    >
      <div className="text-[16px] leading-[1.5] text-[#6e6e6e]">{label}</div>
      <div className="flex items-center gap-[12px]">
        <span className="text-[32px] leading-[1.5] font-medium text-[#383838] whitespace-nowrap">
          <Odometer
            value={value}
            unit={unit}
            active={inView}
            reducedMotion={reducedMotion}
            delay={staggerDelay}
          />
        </span>
      </div>
      <div
        className="flex items-center gap-[4px] text-[16px] leading-[1.5]"
        style={{ color: up ? "#005c0f" : "#b71c1c" }}
      >
        <svg
          className="shrink-0 size-[24px]"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          {up ? (
            <path
              transform="translate(7.41 8.77)"
              d="M0.379036 3.68517L3.69026 0.373951C4.18886 -0.12465 4.99429 -0.12465 5.49289 0.373951L8.80412 3.68517C9.60955 4.49061 9.03424 5.87135 7.89641 5.87135H1.27396C0.136127 5.87135 -0.426397 4.49061 0.379036 3.68517Z"
            />
          ) : (
            <path
              transform="translate(7.41 9.36)"
              d="M0.379036 2.18617L3.69026 5.4974C4.18886 5.996 4.99429 5.996 5.49289 5.4974L8.80412 2.18617C9.60955 1.38074 9.03424 0 7.89641 0H1.27396C0.136127 0 -0.426397 1.38074 0.379036 2.18617Z"
            />
          )}
        </svg>
        <span className="whitespace-nowrap inline-flex items-baseline gap-[4px]">
          <span>
            {trendPrefix}
            {up ? "提升" : "下降"}
          </span>
          <Odometer
            value={trend}
            unit="%"
            active={inView}
            reducedMotion={reducedMotion}
            baseDuration={800}
            perDigitOffset={100}
            delay={staggerDelay}
          />
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
  reducedMotion,
}: {
  period: Period;
  onPeriodChange: (p: Period) => void;
  aiCoverage: { value: number | string; unit: string; trend: number; up: boolean };
  completedOrders: { value: number | string; unit: string; trend: number; up: boolean };
  newMembers: { value: number | string; unit: string; trend: number; up: boolean };
  reducedMotion: boolean;
}) {
  // 卡片進場：第一次進視窗才觸發 odometer 老虎機
  const [coreRef, coreInView] = useInViewOnce<HTMLDivElement>({ reducedMotion });
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // dropdown 以 React Portal 渲染到 document.body，position: fixed，
  // 避免被 CoreInsightsCard 的 overflow-hidden 裁切。
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // 量測觸發按鈕位置（viewport 座標）
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  }, [open]);

  // 外部點擊關閉 + scroll/resize 自動關閉（因為 fixed 定位不會跟著 trigger 滾動）
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrap = wrapRef.current?.contains(target);
      const insideList = listRef.current?.contains(target);
      if (!insideWrap && !insideList) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true); // capture 才能抓到可滾動祖先
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const { name: periodName, trendPrefix } = PERIOD_MAP[period];

  return (
    <div ref={coreRef} className="bg-white rounded-[16px] flex flex-col w-full overflow-hidden">
      {/* Header：核心洞察 + 期間 dropdown + 描述（自帶 border-b #ddd，對應 Figma Dimesion 1744:33108） */}
      <div className="bg-white border-b border-solid border-[#ddd] py-[16px]">
        <div className="flex items-start">
          <div className="flex-1 min-w-0 px-[20px] flex flex-col gap-[4px] self-stretch">
            <div className="flex items-center gap-[4px] w-full">
              <span className="text-[16px] leading-[1.5] text-[#383838]">核心洞察</span>
              <InfoIconWithTooltip tooltip="掌握 AI 本月的服務績效，瞭解它幫你處理了多少對話、促成多少訂單、帶來多少新會員" />

              {/* 比較期間 dropdown */}
              <div ref={wrapRef} className="relative">
                <button
                  ref={triggerRef}
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

                {open && createPortal(
                  <ul
                    ref={listRef}
                    role="listbox"
                    className="fixed min-w-[120px] bg-white border border-solid rounded-[12px] flex flex-col gap-[4px] p-[4px]"
                    style={{
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      zIndex: 1000,
                      borderColor: "rgba(221, 221, 221, 0.55)",
                      boxShadow:
                        "0px 2px 2px 0px rgba(221, 221, 221, 0.32), 0px 5px 15px 0px rgba(221, 221, 221, 0.2)",
                    }}
                  >
                    {PERIOD_OPTIONS.map((opt) => {
                      const selected = opt.value === period;
                      return (
                        <li key={opt.value} role="option" aria-selected={selected} className="w-full">
                          <button
                            type="button"
                            onClick={() => {
                              onPeriodChange(opt.value);
                              setOpen(false);
                            }}
                            className={`flex w-full items-center gap-[4px] min-h-[48px] p-[8px] rounded-[8px] text-[16px] leading-[1.5] text-[#383838] text-left cursor-pointer transition-colors hover:bg-[#f0f6ff] ${
                              selected ? "bg-[#f0f6ff]" : "bg-white"
                            }`}
                          >
                            <span className="flex-1 min-w-0">{opt.name}</span>
                            {selected && (
                              <Check
                                size={24}
                                className="shrink-0 text-[#0f6beb]"
                                strokeWidth={2}
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>,
                  document.body,
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body：3 columns（桌機橫排、手機直排）
          divider：第一欄無線；2、3 欄桌機左側加 border-l，手機直排時改由上方 border-t 分隔 */}
      <div className="flex flex-col md:flex-row items-stretch w-full">
        <KpiColumn
          label="AI 自動回覆率"
          {...aiCoverage}
          trendPrefix={trendPrefix}
          inView={coreInView}
          reducedMotion={reducedMotion}
          staggerDelay={0}
        />
        <KpiColumn
          label="完成訂單"
          {...completedOrders}
          trendPrefix={trendPrefix}
          className="border-t md:border-t-0 md:border-l border-solid border-[#ddd]"
          inView={coreInView}
          reducedMotion={reducedMotion}
          staggerDelay={80}
        />
        <KpiColumn
          label="新增會員"
          {...newMembers}
          trendPrefix={trendPrefix}
          className="border-t md:border-t-0 md:border-l border-solid border-[#ddd]"
          inView={coreInView}
          reducedMotion={reducedMotion}
          staggerDelay={160}
        />
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
      className={`shrink-0 size-[20px] ${className}`}
      fill="none"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <g transform="translate(2 2) scale(1.125)">
        <path
          fill="#9CA3AF"
          d="M5.33333 10.6667C2.38773 10.6667 0 8.27893 0 5.33333C0 2.38773 2.38773 0 5.33333 0C8.27893 0 10.6667 2.38773 10.6667 5.33333C10.6667 8.27893 8.27893 10.6667 5.33333 10.6667ZM5.33333 9.6C6.46492 9.6 7.55017 9.15048 8.35032 8.35032C9.15048 7.55017 9.6 6.46492 9.6 5.33333C9.6 4.20174 9.15048 3.1165 8.35032 2.31634C7.55017 1.51619 6.46492 1.06667 5.33333 1.06667C4.20174 1.06667 3.1165 1.51619 2.31634 2.31634C1.51619 3.1165 1.06667 4.20174 1.06667 5.33333C1.06667 6.46492 1.51619 7.55017 2.31634 8.35032C3.1165 9.15048 4.20174 9.6 5.33333 9.6ZM4.8 2.66667H5.86667V3.73333H4.8V2.66667ZM4.8 4.8H5.86667V8H4.8V4.8Z"
        />
      </g>
    </svg>
  );
}

// 含 tooltip 的 InfoIcon：hover 顯示提示（樣式對齊 AI Chatbot 頁 PmsTooltip）
// 使用 portal 輸出到 body，避免被外層 overflow-hidden 卡片裁切。
function InfoIconWithTooltip({ tooltip }: { tooltip: string }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (visible && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [visible]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="shrink-0 cursor-pointer bg-transparent border-none p-0 inline-flex items-center"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={tooltip}
      >
        <InfoIcon />
      </button>
      {visible &&
        createPortal(
          <div
            className="fixed bg-[#383838] text-white text-[12px] leading-[1.5] font-['Noto_Sans_TC',sans-serif] font-normal rounded-[8px] p-[8px] pointer-events-none"
            style={{ zIndex: 9999, top: pos.top, left: pos.left, maxWidth: 320 }}
          >
            {tooltip}
          </div>,
          document.body,
        )}
    </>
  );
}

// 時段洞察 + 互動旅程：一張卡三個區段
type JourneyTab = "overall" | "conversation" | "interaction" | "conversion";

const JOURNEY_SEG_COLORS = ["#83bfff", "#2578ff", "#004ac2"] as const;
const JOURNEY_TAB_TO_SEG: Record<JourneyTab, number | null> = {
  overall: null,
  conversation: 0,
  interaction: 1,
  conversion: 2,
};

// 互動旅程 header 左側 label 寬度下限，等於下方 stacked bar 的 left-offset：
// container px-[20px] + badge wrapper 208px + gap-[4px] = 232
const JOURNEY_LEFT_MIN = 232;

// 後端回傳格式
interface TimeSlotInsightsResponse {
  start_date: string;
  end_date: string;
  channel: string;
  total_unique_members: number;
  dates: string[];
  weekdays: string[];
  matrix: number[][];
}

interface TimeSlotDetailTag {
  tag: string;
  conversation: number;
  interaction: number;
  conversion: number;
  total: number;
  last_triggered_at: string;
}

interface TimeSlotDetailResponse {
  start_date: string;
  end_date: string;
  channel: string;
  scope: "range" | "cell";
  cell_date: string | null;
  cell_block: number | null;
  total_unique_members: number;
  tags: TimeSlotDetailTag[];
}

function TimeInsightsSection({ reducedMotion }: { reducedMotion: boolean }) {
  const { navigate } = useNavigation();
  // 兩個區塊各自的進場 ref：journey 與 heatmap 分開觸發，互不干擾
  const [journeyRef, journeyInView] = useInViewOnce<HTMLDivElement>({ reducedMotion });
  const [heatmapRef, heatmapInView] = useInViewOnce<HTMLDivElement>({ reducedMotion });
  // journey row 進場 phase：enter 階段才套 keyframe；結束後切回 idle 讓 segment 走 transition
  const [journeyAnimPhase, setJourneyAnimPhase] = useState<"idle" | "enter">("idle");
  const journeyEnteredRef = useRef(false);
  const [channel, setChannel] = useState<Channel>("line");
  // 先放 mock 當 fallback，API 成功就覆蓋
  const [matrixByChannel, setMatrixByChannel] = useState<Record<Channel, number[][]>>(HEATMAP_BY_CHANNEL);
  const [totalByChannel, setTotalByChannel] = useState<Record<Channel, number>>({
    line: CHANNELS[0].total,
    facebook: CHANNELS[1].total,
    nonMember: CHANNELS[2].total,
  });
  const [apiDateLabels, setApiDateLabels] = useState<string[] | null>(null);
  const [apiDates, setApiDates] = useState<string[]>([]);
  // 預設 cell=null：載入時顯示整個 7 天範圍。點擊任一格才會設成具體 r/c
  // 設定後不可回到 null（依需求：刷新或離開頁再回來才重置）
  const [cell, setCell] = useState<{ r: number; c: number } | null>(null);
  const [journeyTags, setJourneyTags] = useState<TimeSlotDetailTag[]>([]);
  // 互動旅程「查看全部 / 收合」展開狀態：超過 10 項時顯示按鈕、預設收合（只看前 10）
  const [isJourneyExpanded, setIsJourneyExpanded] = useState<boolean>(false);
  // 把展開狀態 defer 到 concurrent 低優先級 lane：點擊瞬間按鈕已切換（高優先級），
  // 大量新 row 的 mount 工作交給 React 在 idle frame 排程，不阻塞點擊回饋
  const deferredJourneyExpanded = useDeferredValue(isJourneyExpanded);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [journeyTab, setJourneyTab] = useState<JourneyTab>("overall");
  const journeyLabelRef = useRef<HTMLSpanElement>(null);
  const [journeyLeftCol, setJourneyLeftCol] = useState<number>(JOURNEY_LEFT_MIN);

  // 渠道 tab 等寬同步：量測兩顆 button 的自然寬度，取 max 套回兩顆 minWidth
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabMinWidth, setTabMinWidth] = useState<number | null>(null);

  // 後端 channel key → 我們的 Channel 型別。nonMember 對應後端 webchat
  const apiChannelKey: Record<Channel, string> = { line: "line", facebook: "facebook", nonMember: "webchat" };

  // heatmap 載入（隨 channel 切換）
  useEffect(() => {
    const load = async (ch: Channel) => {
      try {
        const res = await apiGet(
          `/api/v1/analytics/time-slot-insights?channel=${apiChannelKey[ch]}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as TimeSlotInsightsResponse;
        // ⚠️ 假數據注入（還原：把 FAKE_HEATMAP_ENABLED 設為 false）
        if (FAKE_HEATMAP_ENABLED) {
          const fakeRows = FAKE_HEATMAP_MATRIX[ch];
          data.dates.forEach((dateStr, colIdx) => {
            const fakeColIdx = FAKE_HEATMAP_DATES.indexOf(dateStr);
            if (fakeColIdx >= 0) {
              for (let rowIdx = 0; rowIdx < 6; rowIdx++) {
                if (data.matrix[rowIdx] && fakeRows[rowIdx]) {
                  data.matrix[rowIdx][colIdx] = fakeRows[rowIdx][fakeColIdx]!;
                }
              }
            }
          });
        }
        setMatrixByChannel((prev) => ({ ...prev, [ch]: data.matrix }));
        setTotalByChannel((prev) => ({ ...prev, [ch]: data.total_unique_members }));
        setApiDates(data.dates);
        // 日期標籤：轉成 'M/D（週X）' 格式
        const labels = data.dates.map((d, i) => {
          const [, m, day] = d.split("-");
          return `${Number(m)}/${Number(day)}（${data.weekdays[i]}）`;
        });
        setApiDateLabels(labels);
      } catch (err) {
        console.error("[TimeInsights] load failed:", err);
      }
    };
    load(channel);
  }, [channel]);

  // 互動旅程明細載入（隨 channel + cell 切換）
  useEffect(() => {
    const load = async () => {
      setLoadingJourney(true);
      try {
        const params = new URLSearchParams({ channel: apiChannelKey[channel] });
        if (cell && apiDates[cell.c]) {
          params.set("cell_date", apiDates[cell.c]);
          params.set("cell_block", String(cell.r));
        }
        const res = await apiGet(`/api/v1/analytics/time-slot-detail?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as TimeSlotDetailResponse;
        setJourneyTags(data.tags);
      } catch (err) {
        console.error("[TimeInsightsDetail] load failed:", err);
        setJourneyTags([]);
      } finally {
        setLoadingJourney(false);
      }
    };
    // cell 模式需要 apiDates 對齊；apiDates 沒載入時跳過 cell 請求避免錯位
    if (cell && apiDates.length === 0) return;
    load();
  }, [channel, cell, apiDates]);

  // 互動旅程進場：journey 第一次有資料且容器在視窗內才開 enter phase；只跑一次
  useEffect(() => {
    if (!journeyInView || reducedMotion) return;
    if (journeyEnteredRef.current) return;
    if (loadingJourney) return;
    if (journeyTags.length === 0) return;
    journeyEnteredRef.current = true;
    const raf = requestAnimationFrame(() => setJourneyAnimPhase("enter"));
    // 預估最後一個 row 動畫結束時間：60ms stagger × N + 600ms keyframe + 100ms 緩衝
    const maxDelay = Math.max(0, journeyTags.length - 1) * 60;
    const timer = setTimeout(() => setJourneyAnimPhase("idle"), maxDelay + 600 + 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [journeyInView, reducedMotion, loadingJourney, journeyTags.length]);

  // 有 API 資料就用；沒有（初始化前）先用 hardcoded mock
  const dateLabels = apiDateLabels ?? getNext7DayLabels();
  const heatmap = matrixByChannel[channel];
  const colorMap = useMemo(() => computeColorMap(heatmap), [heatmap]);
  // 找出當前 heatmap 的最大值，用來凸顯最高格（可能多格同時最大）
  const maxHeatValue = useMemo(() => {
    let m = 0;
    for (const row of heatmap) for (const v of row) if (v > m) m = v;
    return m;
  }, [heatmap]);
  // 沒選 cell：顯示 7 天 distinct member 總數（從 totalByChannel 取）
  // 有選 cell：顯示該格的數值
  const selectedValue = cell
    ? (heatmap[cell.r]?.[cell.c] ?? 0)
    : (totalByChannel[channel] ?? 0);
  const journeySubtitle = (() => {
    if (!cell) return "近 7 天的統計";
    const dateStr = apiDates[cell.c];
    if (!dateStr) return "近 7 天的統計";
    const [, mm, dd] = dateStr.split("-");
    const startHour = Number(TIME_BLOCKS[cell.r].split(":")[0]);
    const endHour = startHour + 4;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${Number(mm)}/${Number(dd)} ${pad(startHour)}:00-${pad(endHour)}:00`;
  })();
  const maxJourneyTotal = useMemo(
    () => Math.max(1, ...journeyTags.map((t) => t.conversation + t.interaction + t.conversion)),
    [journeyTags],
  );
  // filter 到單一色段時 bar 依該色段的最大值伸縮
  const maxSegmentCount = useMemo(
    () => [
      Math.max(1, ...journeyTags.map((t) => t.conversation)),
      Math.max(1, ...journeyTags.map((t) => t.interaction)),
      Math.max(1, ...journeyTags.map((t) => t.conversion)),
    ],
    [journeyTags],
  );
  const activeSegIdx = JOURNEY_TAB_TO_SEG[journeyTab];

  // 切換 channel 時重置 cell 為 null（回到 7 天總覽）
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setCell(null);
  }, [channel]);

  // 測量 journey label 自然寬度。selectedValue 改變後，
  // 若 "此 {N} 人次的互動旅程" 需要 > 232px 才能維持一行字，則擴張寬度，
  // 這樣 header tabs 和下方 stacked bar 會一起往右推、保持左側對齊。
  useLayoutEffect(() => {
    const span = journeyLabelRef.current;
    if (!span) return;
    const natural = span.getBoundingClientRect().width;
    // label wrapper = px-[20px] + span + gap-[4px] + InfoIcon(20px) + px-[20px]
    const required = 20 + natural + 4 + 20 + 20;
    setJourneyLeftCol(Math.max(JOURNEY_LEFT_MIN, Math.ceil(required)));
  }, [selectedValue]);

  // 渠道 tab 等寬同步：量測兩顆 button 的自然寬度，取 max 套回兩顆 minWidth
  // 依賴 totalByChannel —— API 拉回新數字時要重新量測
  useLayoutEffect(() => {
    const root = tabsContainerRef.current;
    if (!root) return;
    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
    if (btns.length === 0) return;
    // 先清掉已套用的 minWidth，取得自然寬度（否則量到的會是上一輪結果）
    btns.forEach((b) => {
      b.style.minWidth = "";
    });
    const natural = Math.max(...btns.map((b) => b.getBoundingClientRect().width));
    setTabMinWidth(Math.ceil(natural));
  }, [totalByChannel]);

  return (
    <div className="bg-white rounded-[16px] flex flex-col w-full overflow-hidden">
      {/* C. 互動旅程：標題 + 三個彩色底線 tab + stacked bar list */}
      <div
        ref={journeyRef}
        className="bg-white border-b border-solid border-[#ddd] flex flex-col"
        style={{ ["--journey-left-col" as string]: `${journeyLeftCol}px` }}
        data-anim-active={journeyInView && !reducedMotion ? "true" : "false"}
        data-anim-phase={journeyAnimPhase}
      >
        <div className="journey-header-row">
          <button
            type="button"
            onClick={() => setJourneyTab("overall")}
            aria-pressed={journeyTab === "overall"}
            className="journey-label-col insights-channel-tab"
          >
            <div className="flex flex-col gap-[4px]">
              <div className="flex items-center gap-[4px]">
                <span
                  ref={journeyLabelRef}
                  className="text-[16px] leading-[1.5] text-[#6e6e6e] whitespace-nowrap"
                >
                  此{" "}
                  <span className="font-medium text-[#383838]">{selectedValue}</span>{" "}
                  人次的互動旅程
                </span>
              </div>
              <span className="text-[16px] leading-[1.5] text-[#6e6e6e] whitespace-nowrap">
                {journeySubtitle}
              </span>
            </div>
          </button>
          <div className="journey-tabs-col">
            {(
              [
                { key: "conversation", label: "對話", color: "#83bfff" },
                { key: "interaction", label: "互動", color: "#2578ff" },
                { key: "conversion", label: "轉單", color: "#004ac2" },
              ] as { key: JourneyTab; label: string; color: string }[]
            ).map((t, i) => {
              const active = journeyTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setJourneyTab(t.key)}
                  aria-pressed={active}
                  className={`insights-channel-tab journey-tab-btn`}
                  style={{ boxShadow: `inset 0 -6px 0 ${t.color}`, paddingBottom: 6 }}
                >
                  <span className="text-[24px] leading-[1.5] text-[#383838] whitespace-nowrap">
                    {t.label}
                  </span>
                </button>
              );
            })}
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
          ) : journeyTags.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#6e6e6e] text-[14px]">
              此範圍尚無標籤資料
            </div>
          ) : (
            <>
            {(deferredJourneyExpanded ? journeyTags : journeyTags.slice(0, 10)).map((item, rowIndex) => {
                const counts: [number, number, number] = [
                  item.conversation,
                  item.interaction,
                  item.conversion,
                ];
                const total = counts.reduce((a, b) => a + b, 0);
                // 永遠輸出 3 段，搭配 visible 旗標：tab 切換時透過 CSS --seg-scale 控制收/展，
                // 不重 mount 才能跑 transition。未選中段的 widthPct 沿用 overall 模式算法、
                // 維持 layout 穩定；選中段切到單段模式時改用 maxSegmentCount 作基準（同現行行為）。
                const segments =
                  activeSegIdx === null
                    ? counts.map((count, idx) => ({
                        idx,
                        count,
                        color: JOURNEY_SEG_COLORS[idx],
                        widthPct: (count / maxJourneyTotal) * 100,
                        visible: true,
                      }))
                    : counts.map((count, idx) => {
                        const isActive = idx === activeSegIdx;
                        const widthPct = isActive
                          ? (count / maxSegmentCount[idx]) * 100
                          : (count / maxJourneyTotal) * 100;
                        return {
                          idx,
                          count,
                          color: JOURNEY_SEG_COLORS[idx],
                          widthPct,
                          visible: isActive,
                        };
                      });
                const trailingCount =
                  activeSegIdx === null ? total : counts[activeSegIdx] ?? 0;
                return (
                  <div
                    key={item.tag}
                    className="journey-row flex items-center gap-[4px] w-full"
                    style={{
                      minHeight: 44,
                      height: 44,
                      ["--row-delay" as string]: `${rowIndex * 60}ms`,
                    }}
                  >
                    <div className="journey-bar-badge">
                      {/* 點擊標籤帶入會員列表的標籤篩選；同時把平台釘到當下互動旅程的渠道 */}
                      <button
                        type="button"
                        onClick={() => {
                          // 互動旅程的 channel：line / facebook / nonMember
                          // 對應會員列表 ChannelType：LINE / Facebook / Webchat
                          const channelMap: Record<Channel, string> = {
                            line: "LINE",
                            facebook: "Facebook",
                            nonMember: "Webchat",
                          };
                          navigate("member-management", {
                            tagFilter: JSON.stringify([item.tag]),
                            platformChannel: channelMap[channel],
                          });
                        }}
                        className="bg-[#f0f6ff] rounded-[8px] px-[8px] py-[4px] min-w-[32px] text-[#0f6beb] text-[16px] leading-[1.5] text-center whitespace-nowrap cursor-pointer border-none transition-colors hover:bg-[#dde9ff]"
                        aria-label={`在會員列表查看標籤「${item.tag}」`}
                      >
                        {item.tag}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-[8px]" style={{ height: 44 }}>
                      <div
                        className="flex-1 min-w-0 bg-[#fafafa] rounded-[4px] overflow-hidden flex items-center"
                        style={{ minHeight: 44, height: 44 }}
                      >
                        {segments.map((seg) =>
                          seg.widthPct <= 0 ? null : (
                            <div
                              key={seg.idx}
                              style={{
                                width: `${seg.widthPct}%`,
                                backgroundColor: seg.color,
                                ["--seg-scale" as string]: seg.visible ? 1 : 0,
                              }}
                              className="journey-seg shrink-0 min-w-0 flex items-center justify-center text-white text-[16px] leading-[1.5] py-[10px] px-[4px] whitespace-nowrap overflow-hidden"
                            >
                              {seg.count}
                            </div>
                          ),
                        )}
                      </div>
                      <span className="text-[16px] leading-[1.5] text-[#6e6e6e] whitespace-nowrap shrink-0 inline-flex items-baseline gap-[4px]">
                        <Odometer
                          value={trailingCount}
                          unit=""
                          active={journeyInView}
                          reducedMotion={reducedMotion}
                          baseDuration={500}
                          perDigitOffset={80}
                          // 只有首次進場 phase 內才套 stagger delay；展開後 mount 的新 row
                          // 應立即顯示，避免帶到 660–1800ms 的舊 stagger 而看起來卡頓
                          delay={journeyAnimPhase === "enter" ? rowIndex * 60 : 0}
                          playEntry={journeyAnimPhase === "enter"}
                        />
                        <span>人</span>
                      </span>
                    </div>
                  </div>
                );
            })}
            {journeyTags.length > 10 && (
              <ExpandToggleButton
                isExpanded={isJourneyExpanded}
                onClick={() => setIsJourneyExpanded((v) => !v)}
              />
            )}
            </>
          )}
        </div>
      </div>

      {/* A. 標題 + 三個渠道 tab */}
      <div className="flex items-stretch border-b border-solid border-[#ddd] flex-col md:flex-row">
        <div className="flex-1 min-w-0 px-[20px] py-[16px] flex flex-col gap-[4px] self-stretch justify-center">
          <div className="flex items-center gap-[4px]">
            <span className="text-[16px] leading-[1.5] text-[#383838]">時段洞察</span>
            <InfoIconWithTooltip tooltip="找出用戶最活躍的詢問時段，掌握對話 → 互動 → 轉單的漏斗效益" />
          </div>
        </div>
        <div ref={tabsContainerRef} className="flex shrink-0 overflow-x-auto">
          {CHANNELS.filter((ch) => ch.key !== "facebook").map((ch, idx) => {
            const active = channel === ch.key;
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => setChannel(ch.key)}
                aria-pressed={active}
                className={`${idx === 0 ? "md:border-l" : "border-l"} border-solid border-[#ddd] px-[24px] py-[16px] flex flex-col items-start justify-center cursor-pointer insights-channel-tab`}
                style={{ minWidth: tabMinWidth ?? 152 }}
              >
                <span className="text-[16px] leading-[1.5] text-[#6e6e6e] whitespace-nowrap">
                  {ch.label}
                </span>
                <span className="text-[32px] leading-[1.5] font-medium text-[#383838] whitespace-nowrap">
                  {totalByChannel[ch.key] ?? ch.total}人次
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* B. Heatmap：7 欄 x 6 列 + 時間/日期標籤 + 圖例 */}
      <div ref={heatmapRef} className="bg-white px-[20px] py-[16px] flex flex-col gap-[16px]">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div
              className="grid items-stretch"
              data-anim-active={heatmapInView && !reducedMotion ? "true" : "false"}
              style={{ gridTemplateColumns: "44px repeat(7, minmax(0, 1fr))" }}
            >
              {TIME_BLOCKS.map((label, r) => (
                <Fragment key={`row-${r}`}>
                  <div
                    className="pr-[4px] flex flex-col"
                    style={{ minHeight: 64 }}
                  >
                    <span
                      aria-hidden="true"
                      className="h-px bg-[#dddddd] rounded-full"
                    />
                    <span className="text-left text-[14px] leading-[1.5] text-[#6e6e6e]">
                      {label}
                    </span>
                  </div>
                  {(heatmap[r] ?? []).map((value, c) => {
                    const isSelected = cell?.r === r && cell?.c === c;
                    return (
                      <button
                        key={`cell-${r}-${c}`}
                        type="button"
                        onClick={() => setCell({ r, c })}
                        aria-pressed={isSelected}
                        aria-label={`${dateLabels[c]} ${label} 時段：${value} 人`}
                        className={`heatmap-cell heatmap-cell-anim relative flex items-center justify-center text-[16px] leading-[1.5] text-[#383838] p-[4px] transition-[filter,box-shadow] cursor-pointer focus:outline-none ${
                          isSelected
                            ? "ring-2 ring-[#0f6beb] ring-inset z-10"
                            : ""
                        }`}
                        style={{
                          backgroundColor:
                            maxHeatValue > 0 && value === maxHeatValue
                              ? HEATMAP_MAX
                              : heatColor(colorMap[r]?.[c] ?? 0),
                          minHeight: 64,
                          ["--col" as string]: c,
                        }}
                      >
                        <span className="relative">{value}</span>
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

        {/* 色階圖例：單一連續漸層（黃 → 紅 → 紫紅），2px 圓角 */}
        <div className="flex items-center gap-[4px] pl-[44px]">
          <span className="text-[14px] leading-[1.5] text-[#6e6e6e]">少</span>
          <div
            className="h-[8px] rounded-[2px]"
            style={{
              width: "110px",
              background: `linear-gradient(90deg, ${HEATMAP_LOW} 0%, ${HEATMAP_HIGH} 90%, ${HEATMAP_MAX} 100%)`,
            }}
          />
          <span className="text-[14px] leading-[1.5] text-[#6e6e6e]">多</span>
          <span className="text-[14px] leading-[1.5] text-[#6e6e6e]">（人）</span>
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

// 「查看全部 / 收合」toggle 按鈕。整 section 內 3 處共用（行動建議 2 處、互動旅程 1 處）。
// 樣式 + state 表現與重構前 inline 寫法 1:1 一致。
function ExpandToggleButton({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-end w-full">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-center w-[80px] p-[8px] rounded-[8px] cursor-pointer hover:bg-[#f0f6ff] transition-colors"
      >
        <span className="text-[#0f6beb] text-[16px] leading-[1.5] whitespace-nowrap">
          {isExpanded ? "收合" : "查看全部"}
        </span>
      </button>
    </div>
  );
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
  // 使用者「減少動畫」偏好；下傳到子元件統一決策
  const reducedMotion = useReducedMotion();

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
  const [isPendingExpanded, setIsPendingExpanded] = useState<boolean>(false);
  // 行動建議 - AI 未能回答快照（不受 period 影響，固定範圍載入一次，排序由後端做 created_at DESC）
  const [unansweredSnapshot, setUnansweredSnapshot] = useState<AiCoverageResponse | null>(null);
  const [isAiUnansweredExpanded, setIsAiUnansweredExpanded] = useState<boolean>(false);
  // 行動建議兩個區塊的 accordion 狀態（預設收合）
  const [isPendingOpen, setIsPendingOpen] = useState<boolean>(false);
  const [isAiUnansweredOpen, setIsAiUnansweredOpen] = useState<boolean>(false);

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

  // 行動建議 - AI 未能回答：只載一次，用近 365 天固定範圍，與 period 脫鉤
  // 後端已用 ORDER BY created_at DESC，直接符合「越新越前面」
  useEffect(() => {
    const today = new Date();
    const startDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 364);
    const endStr = fmtDate(today);
    const startStr = fmtDate(startDay);
    apiGet(`/api/v1/analytics/ai-coverage?start_date=${startStr}&end_date=${endStr}&top_n=50`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setUnansweredSnapshot((await res.json()) as AiCoverageResponse);
      })
      .catch((err) => console.error("[InsightsPanel] load unanswered snapshot failed:", err));
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
          description="讓 AI 幫助優化服務品質"
        />

        <div className="px-[40px] pb-[40px] flex flex-col gap-[16px]">

          {/* 核心洞察卡（整合 AI 覆蓋率 / 完成訂單 / 新增會員） */}
          <CoreInsightsCard
            period={period}
            onPeriodChange={setPeriod}
            aiCoverage={aiCoverageKpi}
            completedOrders={completedOrdersKpi}
            newMembers={newMembersKpi}
            reducedMotion={reducedMotion}
          />

          {/* 行動建議區塊 */}
          <div className="bg-white relative rounded-[16px] w-full">
            <div className="relative py-[16px] px-[20px] flex flex-col gap-[24px]">
              <div className="flex items-center gap-[4px]">
                <span className="text-[16px] leading-[1.5] text-[#383838]">
                  行動建議
                </span>
                <InfoIconWithTooltip tooltip="根據 AI 的服務狀況，提供當下優先處理的建議" />
              </div>

              {/* 1. 待回覆對話（含：使用者訊息無人回 + AI 被標 unanswered 的對話） */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsPendingOpen((v) => !v)}
                  aria-expanded={isPendingOpen}
                  className="flex items-center gap-[2px] w-full bg-transparent border-none p-0 cursor-pointer text-left"
                >
                  <span className="flex-1 min-w-0 text-[14px] leading-[1.5] text-[#383838]">
                    1. <span style={{ color: "#B71C1C" }}>{pending?.total ?? 0}則</span>對話待回覆
                  </span>
                  <span className="flex items-center justify-center p-[4px] rounded-[8px] shrink-0">
                    <span className="inline-flex size-[24px] items-center justify-center">
                      <ChevronDown
                        size={20}
                        color="#0f6beb"
                        strokeWidth={2}
                        className={`transition-transform ${isPendingOpen ? "rotate-180" : ""}`}
                      />
                    </span>
                  </span>
                </button>
                {isPendingOpen && (
                <div className="flex flex-col gap-[8px] mt-[12px]">
                  {pending && pending.items.length > 0 ? (
                    <>
                      {(isPendingExpanded ? pending.items : pending.items.slice(0, 10)).map((item, idx, arr) => (
                      <div
                        key={item.thread_id}
                        className="flex items-center justify-between py-[8px] px-[12px] rounded-[8px]"
                        style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
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
                          <span className="text-[16px] leading-[1.5] text-[#0f6beb] font-medium shrink-0 max-w-[120px] truncate">
                            {item.display_name}
                          </span>
                          <span className="text-[16px] leading-[1.5] text-[#383838] truncate" title={item.question}>
                            {item.question}
                          </span>
                        </div>
                        <div className="flex items-center gap-[16px] shrink-0 ml-[16px]">
                          <span className="text-[16px] leading-[1.5] text-[#6e6e6e] text-right min-w-[120px]">
                            {formatUnansweredTime(item.question_at) || ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              // LINE 渠道：優先用 member.id（DB ID），fallback 用 thread_id（= line_uid / channelUid）
                              const mid = item.member_id != null
                                ? String(item.member_id)
                                : item.thread_id;
                              navigate("chat-room", { memberId: mid, channel: "LINE" });
                            }}
                            className="text-[#0f6beb] text-[16px] leading-[1.5] text-center hover:underline cursor-pointer"
                          >
                            查看詳情
                          </button>
                        </div>
                      </div>
                      ))}
                      {pending.items.length > 10 && (
                        <ExpandToggleButton
                          isExpanded={isPendingExpanded}
                          onClick={() => setIsPendingExpanded((v) => !v)}
                        />
                      )}
                    </>
                  ) : (
                    <div className="py-[10px] text-[13px] text-[#a8a8a8]">
                      目前沒有待回覆的對話
                    </div>
                  )}
                </div>
                )}
              </div>

              {/* 2. AI 未能回答的訊息（獨立於頂部 period，近 365 天快照） */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsAiUnansweredOpen((v) => !v)}
                  aria-expanded={isAiUnansweredOpen}
                  className="flex items-center gap-[2px] w-full bg-transparent border-none p-0 cursor-pointer text-left"
                >
                  <span className="flex-1 min-w-0 text-[14px] leading-[1.5] text-[#383838]">
                    2. AI 未能回答
                    <span style={{ color: "#B71C1C" }}>
                      {unansweredSnapshot?.unanswered ?? 0}則
                    </span>
                    訊息，建議加入知識庫
                  </span>
                  <span className="flex items-center justify-center p-[4px] rounded-[8px] shrink-0">
                    <span className="inline-flex size-[24px] items-center justify-center">
                      <ChevronDown
                        size={20}
                        color="#0f6beb"
                        strokeWidth={2}
                        className={`transition-transform ${isAiUnansweredOpen ? "rotate-180" : ""}`}
                      />
                    </span>
                  </span>
                </button>
                {isAiUnansweredOpen && (
                <div className="flex flex-col gap-[8px] mt-[12px]">
                  {unansweredSnapshot && unansweredSnapshot.top_unanswered.length > 0 ? (
                    <>
                      {(isAiUnansweredExpanded ? unansweredSnapshot.top_unanswered : unansweredSnapshot.top_unanswered.slice(0, 10)).map((q, idx, arr) => (
                      <div
                        key={q.message_id}
                        className="flex items-center justify-between min-h-[48px] py-[8px] px-[12px] rounded-[8px]"
                        style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
                      >
                        <span className="text-[16px] leading-[1.5] text-[#383838] truncate" title={q.question}>
                          {q.question || "(無對應提問)"}
                        </span>
                        <div className="flex items-center gap-[16px] shrink-0 ml-[16px]">
                          <span className="text-[16px] leading-[1.5] text-[#6e6e6e] text-right min-w-[120px]">
                            {formatUnansweredTime(q.created_at) || ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              // 跳到關鍵字回應頁並開新建畫面，回應類型預設「觸發關鍵字」
                              navigate("auto-reply", {
                                view: "edit",
                                replyType: "keyword",
                              });
                            }}
                            className="text-[#0f6beb] text-[16px] leading-[1.5] text-center hover:underline cursor-pointer"
                          >
                            加入知識庫
                          </button>
                        </div>
                      </div>
                      ))}
                      {unansweredSnapshot.top_unanswered.length > 10 && (
                        <ExpandToggleButton
                          isExpanded={isAiUnansweredExpanded}
                          onClick={() => setIsAiUnansweredExpanded((v) => !v)}
                        />
                      )}
                    </>
                  ) : (
                    <div className="py-[10px] text-[13px] text-[#a8a8a8]">
                      目前沒有 AI 答不出的問題
                    </div>
                  )}
                </div>
                )}
              </div>

            </div>
          </div>

          {/* 時段洞察 + 互動旅程 */}
          <TimeInsightsSection reducedMotion={reducedMotion} />
        </div>
      </main>
    </div>
  );
}
