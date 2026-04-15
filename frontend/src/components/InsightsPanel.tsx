import { useState, useMemo } from "react";
import Sidebar from "./Sidebar";
import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import { useNavigation } from "../contexts/NavigationContext";
import { useLineChannelStatus } from "../contexts/LineChannelStatusContext";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";

// ─── 假資料 ──────────────────────────────────────────

const MOCK_KPI = {
  aiCoverage: { value: 88.7, unit: "%", trend: 20, up: true },
  serviceHours: { value: 88.7, unit: "小時", trend: 20, up: true },
  completedOrders: { value: 100, unit: "單", trend: 25, up: true },
  newMembers: { value: 100, unit: "人", trend: 2, up: false },
};

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

const MOCK_MARKETING_SUGGESTION =
  "建議在今天17:00發提醒(限7日) 設計優惠配套！(促銷優惠)";

// 熱力圖：每 4 小時為一個區間（6 列）x 7 天（欄）
const HEATMAP_LABELS = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

// 固定假資料，6 列 x 7 欄，每格 = 該時段三平台人次加總
const HEATMAP_DATA: number[][] = [
  [ 12,  8, 10,  5,  9,  3,  2],  // 00:00~03:59
  [ 25, 18, 22, 15, 20, 10,  8],  // 04:00~07:59
  [ 95, 88, 80, 72, 90, 45, 35],  // 08:00~11:59
  [238,120,110,100,130, 65, 50],   // 12:00~15:59  ← 最高峰含 238
  [ 85, 78, 70, 65, 82, 40, 30],  // 16:00~19:59
  [ 30, 22, 18, 15, 25, 10,  6],  // 20:00~23:59
];
const HEATMAP_MAX = Math.max(...HEATMAP_DATA.flat());

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const DATES = ["4/6", "4/7", "4/8", "4/9", "4/10", "4/11", "4/12"];

interface RankingItem {
  category: string;
  counts: number[];
  colors: string[];
}

const MOCK_RANKING: RankingItem[] = [
  {
    category: "{行政景觀套房}",
    counts: [7, 6, 3],
    colors: ["#93c5fd", "#3b82f6", "#1e40af"],
  },
  {
    category: "{豪華景觀客房}",
    counts: [6, 5, 2],
    colors: ["#93c5fd", "#3b82f6", "#1e40af"],
  },
  {
    category: "{君璽雅緻客房}",
    counts: [6, 5, 2],
    colors: ["#93c5fd", "#3b82f6", "#1e40af"],
  },
  {
    category: "{思偉達至尊套房}",
    counts: [5, 5, 3],
    colors: ["#93c5fd", "#3b82f6", "#1e40af"],
  },
  {
    category: "{琴香古韻}",
    counts: [5, 5, 2],
    colors: ["#93c5fd", "#3b82f6", "#1e40af"],
  },
  {
    category: "{天地流動}",
    counts: [5, 4, 2],
    colors: ["#93c5fd", "#3b82f6", "#1e40af"],
  },
  {
    category: "{白色戀人}",
    counts: [4, 4, 3],
    colors: ["#93c5fd", "#3b82f6", "#1e40af"],
  },
];

// ─── 子元件 ─────────────────────────────────────

function KpiCard({
  label,
  value,
  unit,
  trend,
  up,
}: {
  label: string;
  value: number;
  unit: string;
  trend: number;
  up: boolean;
}) {
  return (
    <div className="bg-[rgba(255,255,255,0.3)] relative rounded-[16px] flex-1 min-w-[200px]">
      <div aria-hidden="true" className="absolute border border-[#f0f6ff] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="relative p-[24px]">
        <div className="flex items-center justify-between mb-[8px]">
          <span className="text-[14px] text-[#6e6e6e]">{label}</span>
          <button className="flex items-center gap-[2px] text-[12px] text-[#0f6beb] border border-[#0f6beb] rounded-[8px] px-[8px] py-[2px] cursor-pointer hover:bg-[#f0f6ff] transition-colors">
            上月
            <ChevronDown size={12} />
          </button>
        </div>
        <div className="text-[32px] text-[#383838] mb-[4px]">
          {value}
          <span className="text-[16px] text-[#6e6e6e] ml-[2px]">
            {unit}
          </span>
        </div>
        <div
          className="flex items-center gap-[4px] text-[14px]"
          style={{ color: up ? "#16a34a" : "#dc2626" }}
        >
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>
            相較上月{up ? "提升" : "下降"} {trend}%
          </span>
        </div>
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

function HeatmapCell({
  value,
  isSelected,
  onClick,
}: {
  value: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  // 依照最大值動態計算深淺
  const intensity = HEATMAP_MAX > 0 ? Math.min(value / HEATMAP_MAX, 1) : 0;
  const r = 234;
  const g = Math.round(180 - intensity * 100);
  const b = Math.round(60 - intensity * 40);
  const bg = value === 0 ? "#fef3c7" : `rgb(${r}, ${g}, ${b})`;

  return (
    <button
      onClick={onClick}
      className={`w-full h-full text-[10px] flex items-center justify-center transition-all cursor-pointer ${
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-1"
          : "hover:ring-1 hover:ring-[#a8a8a8]"
      }`}
      style={{ backgroundColor: bg }}
      title={`${value} 人次`}
    >
      <span className="text-[#383838] opacity-70">{value}</span>
    </button>
  );
}

function RankingBar({ item, maxTotal }: { item: RankingItem; maxTotal: number }) {
  const total = item.counts.reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center py-[10px]">
      <span className="text-[15px] w-[140px] shrink-0 text-left rounded-[8px] px-[8px] py-[2px] mr-[40px]" style={{ color: "#0f6beb", backgroundColor: "#e8f0fe" }}>
        {item.category}
      </span>
      <div className="flex-1">
        <div className="flex h-[36px] rounded-[6px] overflow-hidden" style={{ width: `${(total / maxTotal) * 65}%` }}>
          {item.counts.map(
            (count, i) =>
              count > 0 && (
                <div
                  key={i}
                  className="h-full flex items-center justify-center text-white text-[12px]"
                  style={{
                    width: `${(count / total) * 100}%`,
                    backgroundColor: item.colors[i],
                    minWidth: "24px",
                  }}
                >
                  {count}
                </div>
              ),
          )}
        </div>
      </div>
      <span className="text-[14px] text-[#a8a8a8] w-[48px] shrink-0 text-left ml-[12px]">
        {total} 次
      </span>
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
  const [selectedCell, setSelectedCell] = useState<{
    hour: number;
    day: number;
  } | null>({ hour: 10, day: 0 });

  const maxRankTotal = useMemo(
    () =>
      Math.max(...MOCK_RANKING.map((r) => r.counts.reduce((a, b) => a + b, 0))),
    [],
  );

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

          {/* KPI 卡片 */}
          <div className="flex gap-4 flex-wrap">
            <KpiCard
              label="AI 覆蓋率"
              {...MOCK_KPI.aiCoverage}
            />
            <KpiCard
              label="客服人力工時"
              {...MOCK_KPI.serviceHours}
            />
            <KpiCard
              label="完成訂單"
              {...MOCK_KPI.completedOrders}
            />
            <KpiCard
              label="新增會員"
              {...MOCK_KPI.newMembers}
            />
          </div>

          {/* 行動建議區塊 */}
          <div className="bg-[rgba(255,255,255,0.3)] relative rounded-[16px] w-full">
            <div aria-hidden="true" className="absolute border border-[#f0f6ff] border-solid inset-0 pointer-events-none rounded-[16px]" />
            <div className="relative p-[24px] flex flex-col gap-[24px]">
              <p className="text-[16px] text-[#383838] font-medium">
                行動建議
              </p>

              {/* 1. 60則對話待回覆 */}
              <div>
                <p className="text-[14px] text-[#383838] mb-[12px]">1. <span style={{ color: "#dc2626" }}>60則</span>對話待回覆</p>
                <div className="flex flex-col">
                  {[
                    { name: "Daisy", avatar: "https://sprofile.line-scdn.net/0hyp85T7eMJl8VTDApZ8NYIGUcJTU2PX9NbiNoPiNKeWwvK2YPOCtrOSAeeDoueWgJai87OyZELTwZX1E5CxraaxJ8e24peGMOOythug", question: "可以使用生日禮卷嗎？" },
                    { name: "雷恩", avatar: "https://sprofile.line-scdn.net/0hrTBRPYTSLXtvKzgwcAJTBB97LhFMWnRpSxhqTV58dk5RTD55REk1GA8rJkwCHDokSxliGl0ud0JjOFodcX3RT2gbcEpTH2gqQUxqng", question: "入住時間和退房時間是什麼時候？" },
                    { name: "林錦泰 Nick", avatar: "https://sprofile.line-scdn.net/0hq83KQ3DHLhceMj_F_sxQaG5iLX09Q3cFNl0zIXgzc3N2CjpFMVZncn4wIicnVj1JNQdnIiNnJScSIVlxAGTSIxkCcyYiBmtGMFVp8g", question: "飯店提供免費早餐嗎？" },
                    { name: "Colette 小酌玥岑", avatar: "https://sprofile.line-scdn.net/0hA6rBU6DvHhlfOw_CHUtgZi9rHXN8SkcLJFtYLDo8Qis2DAoYIwkEdmk7QS9iDAxHIV4CLG4yRipTKGl_QW3iLVgLQyhjD1tIcVxZ_A", question: "有無障礙設施嗎？" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-[10px] border-b border-[#f0f6ff] last:border-b-0">
                      <div className="flex items-center gap-[10px] min-w-0">
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-[32px] h-[32px] rounded-full shrink-0 object-cover"
                        />
                        <span className="text-[14px] text-[#0f6beb] font-medium shrink-0">{item.name}</span>
                        <span className="text-[14px] text-[#383838] truncate">{item.question}</span>
                      </div>
                      <div className="flex items-center gap-[16px] shrink-0 ml-[16px]">
                        <span className="text-[12px] text-[#a8a8a8]">yyyy-mm-dd hh:mm</span>
                        <button className="text-[#0f6beb] text-[14px] hover:underline cursor-pointer">查看詳情</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. AI 來自回覆60則訊息，建議加入知識庫 */}
              <div>
                <p className="text-[14px] text-[#383838] mb-[12px]">2. AI 未能回答<span style={{ color: "#dc2626" }}>60則</span>訊息，建議加入知識庫</p>
                <div className="flex flex-col">
                  {[
                    "可以幫忙佈置房間嗎？",
                    "入住時間和退房時間是什麼時候？",
                    "飯店提供免費早餐嗎？",
                    "有無障礙設施？",
                  ].map((q, i) => (
                    <div key={i} className="flex items-center justify-between py-[10px] border-b border-[#f0f6ff] last:border-b-0">
                      <span className="text-[14px] text-[#6e6e6e]">{q}</span>
                      <div className="flex items-center gap-[16px] shrink-0 ml-[16px]">
                        <span className="text-[12px] text-[#a8a8a8]">yyyy-mm-dd hh:mm</span>
                        <button className="text-[#0f6beb] text-[14px] hover:underline cursor-pointer">加入知識庫</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 建議推播 */}
              <div>
                <p className="text-[14px] text-[#383838]">
                  3. 建議在<span style={{ color: "#0f6beb" }} className="cursor-pointer">{"{"}今天{"}"}</span><span style={{ color: "#0f6beb" }} className="cursor-pointer">{"{"}17:00{"}"}</span>發送給<span style={{ color: "#0f6beb" }} className="cursor-pointer">{"{"}曾下單{"}"}</span> <span style={{ color: "#0f6beb" }} className="cursor-pointer">{"{"}經典九州{"}"}</span> <span style={{ color: "#0f6beb" }} className="cursor-pointer">{"{"}促銷優惠{"}"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 時段洞察區塊 */}
          <div className="bg-[rgba(255,255,255,0.3)] relative rounded-[16px] w-full">
            <div aria-hidden="true" className="absolute border border-[#f0f6ff] border-solid inset-0 pointer-events-none rounded-[16px]" />
            <div className="relative p-[24px] flex flex-col gap-[16px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[16px] text-[#383838] font-medium">
                    時段洞察
                  </p>
                  <p className="text-[14px] text-[#a8a8a8]">篩選條件</p>
                </div>
                <div className="flex gap-[24px]">
                  <div className="text-center">
                    <p className="text-[12px] text-[#a8a8a8]">LINE 會員</p>
                    <p className="text-[20px] text-[#383838]">
                      89<span className="text-[14px] text-[#6e6e6e]">人次</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] text-[#a8a8a8]">Facebook 會員</p>
                    <p className="text-[20px] text-[#383838]">
                      79<span className="text-[14px] text-[#6e6e6e]">人次</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] text-[#a8a8a8]">非會員(官網)</p>
                    <p className="text-[20px] text-[#383838]">
                      70<span className="text-[14px] text-[#6e6e6e]">人次</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 分隔線 */}
              <div className="border-t border-[#f0f6ff]" />

              {/* 熱力圖格線（左右各留 56px 讓橘色區域置中） */}
              <div className="overflow-x-auto">
                <table className="border-collapse w-full" style={{ minWidth: 600 }}>
                  <tbody>
                    {HEATMAP_DATA.map((row, block) => (
                      <tr key={block}>
                        <td className="w-[56px] text-[12px] text-[#a8a8a8] text-right pr-[8px] py-0" style={{ height: 56 }}>
                          {HEATMAP_LABELS[block]}
                        </td>
                        {row.map((value, day) => (
                          <td key={day} className="p-0" style={{ height: 56 }}>
                            <HeatmapCell
                              value={value}
                              isSelected={
                                selectedCell?.hour === block &&
                                selectedCell?.day === day
                              }
                              onClick={() => setSelectedCell({ hour: block, day })}
                            />
                          </td>
                        ))}
                        <td style={{ minWidth: 56, width: 56 }} />
                      </tr>
                    ))}
                    {/* 星期標籤（底部） */}
                    <tr>
                      <td style={{ minWidth: 56, width: 56 }} />
                      {DATES.map((date, i) => (
                        <td key={i} className="text-center text-[12px] text-[#6e6e6e] pt-[6px]">
                          {date} ({WEEKDAYS[i]})
                        </td>
                      ))}
                      <td style={{ minWidth: 56, width: 56 }} />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 色階圖例 */}
              <div className="flex items-center gap-[8px] text-[12px] text-[#a8a8a8]">
                <span>少</span>
                <div
                  className="h-[12px] w-[120px]"
                  style={{ background: "linear-gradient(to right, #fef3c7, #ea9a28, #c05621)" }}
                />
                <span>多 (人)</span>
              </div>
            </div>
          </div>

          {/* 互動排行區塊 */}
          <div className="bg-[rgba(255,255,255,0.3)] relative rounded-[16px] w-full">
            <div aria-hidden="true" className="absolute border border-[#f0f6ff] border-solid inset-0 pointer-events-none rounded-[16px]" />
            <div className="relative p-[24px] flex flex-col gap-[16px]">
              <p className="text-[16px] text-[#383838] font-medium">
                此 <span style={{ color: "#0f6beb" }}>89</span> 人次的互動旅程 ⊙
              </p>


              {/* 排行長條圖 */}
              <div>
                {MOCK_RANKING.map((item) => (
                  <RankingBar
                    key={item.category}
                    item={item}
                    maxTotal={maxRankTotal}
                  />
                ))}
              </div>

              {/* 圖例 */}
              <div className="flex gap-[16px] text-[12px]">
                <div className="flex items-center gap-[4px]">
                  <div style={{ width: 12, height: 12, backgroundColor: "#93c5fd" }} />
                  <span className="text-[#6e6e6e]">對話</span>
                </div>
                <div className="flex items-center gap-[4px]">
                  <div style={{ width: 12, height: 12, backgroundColor: "#3b82f6" }} />
                  <span className="text-[#6e6e6e]">互動</span>
                </div>
                <div className="flex items-center gap-[4px]">
                  <div style={{ width: 12, height: 12, backgroundColor: "#1e40af" }} />
                  <span className="text-[#6e6e6e]">轉單</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
