import { useState } from 'react';
import svgPaths from "../imports/svg-6vdoib8lfm";
import TooltipComponent from "../imports/Tooltip";
import AutoResponseCreation from "./AutoResponseCreation";
import Layout from './Layout';

interface AutoResponse {
  id: string;
  content: string;
  responseType: string;
  keywords: string[];
  enabled: boolean;
  platform: string;
  triggerCount: string;
  createdAt: string;
}

// Sample data
const SAMPLE_AUTO_RESPONSES: AutoResponse[] = [
  {
    id: '1',
    content: '您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢',
    responseType: '觸發關鍵字',
    keywords: ['飯店', '房型', '空房', '飯店位置', '人數', '日期'],
    enabled: true,
    platform: 'LINE',
    triggerCount: '-',
    createdAt: '2026-10-02 22:47'
  },
  {
    id: '2',
    content: '您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢',
    responseType: '一鍵回應',
    keywords: [],
    enabled: true,
    platform: 'LINE',
    triggerCount: '-',
    createdAt: '2026-10-02 22:47'
  },
  {
    id: '3',
    content: 'Hi [User Name] 歡迎加入好友～請告訴我們您的需求我司將即時為您解答好問題',
    responseType: '歡迎訊息',
    keywords: [],
    enabled: true,
    platform: 'LINE',
    triggerCount: '-',
    createdAt: '2026-10-02 22:47'
  },
  {
    id: '4',
    content: '您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢',
    responseType: '觸發關鍵字',
    keywords: ['在哪', '飯店位置', '地址', '怎麼去'],
    enabled: false,
    platform: 'LINE',
    triggerCount: '-',
    createdAt: '2026-10-02 22:47'
  }
];

interface AutoResponseListProps {
  onBack: () => void;
  onShowMessages?: () => void;
  onShowAutoResponse?: () => void;
  onShowMembers?: () => void;
}

export default function AutoResponseList({
  onBack,
  onShowMessages = () => {},
  onShowAutoResponse = () => {},
  onShowMembers = () => {}
}: AutoResponseListProps) {
  const [responses, setResponses] = useState(SAMPLE_AUTO_RESPONSES);
  const [searchText, setSearchText] = useState('');
  const [showKeywordTooltip, setShowKeywordTooltip] = useState(false);
  const [showCreationPage, setShowCreationPage] = useState(false);

  const toggleResponse = (id: string) => {
    setResponses(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const filteredResponses = responses.filter(r => 
    r.content.includes(searchText) || 
    r.keywords.some(k => k.includes(searchText))
  );

  if (showCreationPage) {
    return <AutoResponseCreation onBack={() => setShowCreationPage(false)} />;
  }

  return (
    <Layout
      activeSection="autoResponse"
      onShowMessages={onShowMessages}
      onShowAutoResponse={onShowAutoResponse}
      onShowMembers={onShowMembers}
    >
      <div className="bg-[#F8FAFC] min-h-screen flex flex-col">
        {/* Breadcrumb */}
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
              <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0">
                <div className="content-stretch flex items-center justify-center relative shrink-0">
                  <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">自動回應訊息</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Container */}
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start px-[40px] pt-[12px] relative shrink-0 w-full">
          {/* Title */}
          <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
            <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0">
              <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[32px] text-center text-nowrap whitespace-pre">自動回應訊息</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
            <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-center flex flex-wrap gap-0 items-center pl-[4px] pr-0 py-0 relative w-full">
                  <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-[592px]">
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px]">當用戶加入好友或發送訊息時，自動觸發系統回覆，以確保能在第一時間與用戶互動</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Create Button */}
        <div className="box-border px-[40px] pt-[24px] pb-[16px] w-full">
        <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full">
          {/* Search Bar */}
          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
            <div className="bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0">
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                <div className="overflow-clip relative shrink-0 size-[32px]">
                  <div className="absolute h-[17.575px] left-[calc(50%-0.2px)] top-[calc(50%-0.212px)] translate-x-[-50%] translate-y-[-50%] w-[17.6px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                      <path d={svgPaths.p29b263c0} fill="var(--fill-0, #A8A8A8)" />
                    </svg>
                  </div>
                </div>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="以訊息內容或標籤搜尋"
                  className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[20px] bg-transparent border-none outline-none placeholder:text-[#dddddd] text-[#383838] w-[280px]"
                />
              </div>
              {searchText && (
                <button 
                  onClick={() => setSearchText('')}
                  className="overflow-clip relative shrink-0 size-[24px] cursor-pointer"
                >
                  <div className="absolute inset-[8.333%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <path d={svgPaths.pb584900} fill="var(--fill-0, #A8A8A8)" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
            <button className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] p-[8px] relative rounded-[12px] shrink-0 hover:bg-slate-200 transition-colors">
              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">清除全部條件</p>
            </button>
          </div>

          {/* Create Button */}
          <div className="basis-0 content-stretch flex gap-[12px] grow items-center justify-end min-h-px min-w-px relative shrink-0">
            <button 
              className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 hover:bg-[#383838] transition-colors"
              onClick={() => setShowCreationPage(true)}
            >
              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立</p>
            </button>
          </div>
        </div>
      </div>

      {/* Total Count */}
      <div className="box-border px-[40px] pb-[12px] w-full">
        <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
          <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0">
            <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
              <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap whitespace-pre">
                共 {filteredResponses.length} 筆
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="box-border px-[40px] pb-[40px] w-full">
        <div className="bg-white rounded-[16px] overflow-y-hidden overflow-x-auto">
          {/* Table Header */}
          <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full border-b border-[#dddddd] min-w-[1400px]">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
                <div className="box-border content-stretch flex gap-[4px] items-start px-[12px] py-0 relative shrink-0 w-[320px]">
                  <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                    <p className="leading-[1.5]">訊息內容</p>
                  </div>
                </div>
                <div className="h-[12px] relative shrink-0 w-0">
                  <div className="absolute inset-[-3.33%_-0.4px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                      <path d="M0.4 0.4V12.4" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>
                <div className="box-border content-stretch flex gap-[4px] items-start px-[12px] py-0 relative shrink-0 w-[192px]">
                  <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                    <p className="leading-[1.5]">回應類型</p>
                  </div>
                </div>
                <div className="h-[12px] relative shrink-0 w-0">
                  <div className="absolute inset-[-3.33%_-0.4px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                      <path d="M0.4 0.4V12.4" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>
                <div className="box-border content-stretch flex gap-[4px] items-start px-[12px] py-0 relative shrink-0 w-[280px]">
                  <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                    <p className="leading-[1.5] whitespace-pre">關鍵字標籤</p>
                  </div>
                  <div 
                    className="overflow-clip relative shrink-0 size-[24px] cursor-pointer"
                    onMouseEnter={() => setShowKeywordTooltip(true)}
                    onMouseLeave={() => setShowKeywordTooltip(false)}
                  >
                    <div className="absolute inset-[16.667%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                        <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" />
                      </svg>
                    </div>
                    {showKeywordTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50" style={{ width: '280px', height: '28px' }}>
                        <TooltipComponent />
                      </div>
                    )}
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="h-[12px] relative shrink-0 w-0">
                  <div className="absolute inset-[-3.33%_-0.4px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                      <path d="M0.4 0.4V12.4" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>
                <div className="box-border content-stretch flex gap-[4px] items-start px-[12px] py-0 relative shrink-0 w-[180px]">
                  <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                    <p className="leading-[1.5] whitespace-pre">狀態</p>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="h-[12px] relative shrink-0 w-0">
                  <div className="absolute inset-[-3.33%_-0.4px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                      <path d="M0.4 0.4V12.4" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>
                <div className="box-border content-stretch flex gap-[4px] items-start px-[12px] py-0 relative shrink-0 w-[140px]">
                  <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                    <p className="leading-[1.5] whitespace-pre">平台</p>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="h-[12px] relative shrink-0 w-0">
                  <div className="absolute inset-[-3.33%_-0.4px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                      <path d="M0.4 0.4V12.4" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>
                <div className="box-border content-stretch flex gap-[4px] items-start px-[12px] py-0 relative shrink-0 w-[140px]">
                  <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                    <p className="leading-[1.5] whitespace-pre">觸發次數</p>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[24px]">
                    <div className="absolute inset-[16.667%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                        <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" />
                      </svg>
                    </div>
                  </div>
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="h-[12px] relative shrink-0 w-0">
                  <div className="absolute inset-[-3.33%_-0.4px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                      <path d="M0.4 0.4V12.4" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>
                <div className="h-[12px] relative shrink-0 w-0">
                  <div className="absolute inset-[-3.33%_-0.4px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                      <path d="M0.4 0.4V12.4" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>
                <div className="h-[12px] relative shrink-0 w-0">
                  <div className="absolute inset-[-3.33%_-0.4px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                      <path d="M0.4 0.4V12.4" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>
                <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                  <div className="flex flex-row items-center size-full">
                    <div className="box-border content-stretch flex gap-[4px] items-start px-[12px] py-0 relative w-full">
                      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                        <p className="leading-[1.5] whitespace-pre">建立時間</p>
                      </div>
                      <div className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                            <path d={svgPaths.p24dcb900} fill="var(--fill-0, #0F6BEB)" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Rows */}
          {filteredResponses.map((response) => (
            <div key={response.id} className="bg-white relative shrink-0 w-full border-b border-[#dddddd] last:border-b-0 min-w-[1400px]">
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
                  {/* Content */}
                  <div className="content-stretch flex items-start relative shrink-0 w-[320px]">
                    <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                      <div className="flex flex-row items-start size-full">
                        <div className="box-border content-stretch flex items-start px-[12px] py-0 relative w-full">
                          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                            <p className="leading-[1.5]">{response.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Response Type */}
                  <div className="content-stretch flex items-start relative shrink-0 w-[192px]">
                    <div className="box-border content-stretch flex items-start px-[12px] py-0 relative shrink-0 w-[278.8px]">
                      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                        <p className="leading-[1.5]">{response.responseType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="box-border px-[12px] py-0 relative shrink-0 w-[280px]">
                    {response.keywords.length > 0 ? (
                      <div className="grid grid-cols-3 gap-[4px]">
                        {response.keywords.map((keyword, idx) => (
                          <div key={idx} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px]">
                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#0f6beb] text-[16px] text-center truncate">{keyword}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[0] text-[#383838] text-[14px]">
                        <p className="leading-[1.5]">-</p>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="box-border content-stretch flex items-start px-[12px] py-0 relative shrink-0 w-[180px]">
                    <button
                      onClick={() => toggleResponse(response.id)}
                      className="overflow-clip relative shrink-0 size-[40px] cursor-pointer"
                    >
                      <div className="absolute inset-[29.17%_8.33%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 17">
                          <path
                            d={response.enabled ? svgPaths.p38913700 : svgPaths.p23a98e80}
                            fill={response.enabled ? "var(--fill-0, #0F6BEB)" : "var(--fill-0, #DDDDDD)"}
                          />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {/* Platform */}
                  <div className="box-border content-stretch flex items-start px-[12px] py-0 relative shrink-0 w-[140px]">
                    <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
                      <p className="leading-[24px]">{response.platform}</p>
                    </div>
                  </div>

                  {/* Trigger Count */}
                  <div className="box-border content-stretch flex items-start px-[12px] py-0 relative shrink-0 w-[140px]">
                    <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px] w-[90px]">
                      <p className="leading-[24px]">{response.triggerCount}</p>
                    </div>
                  </div>

                  {/* Created At */}
                  <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                    <div className="flex flex-row items-start size-full">
                      <div className="box-border content-stretch flex items-start px-[12px] py-0 relative w-full">
                        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                          <p className="leading-[1.5]">{response.createdAt}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button className="relative rounded-[12px] shrink-0 size-[28px] hover:bg-slate-100 transition-colors">
                    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                        <g>
                          <g></g>
                        </g>
                      </svg>
                      <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]">
                        <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]">
                          <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]">
                            <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
                                <g>
                                  <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" />
                                </g>
                              </svg>
                            </div>
                          </div>
                          <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]">
                            <div className="absolute bottom-0 left-[-0.03%] right-0 top-0">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
                                <g>
                                  <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" />
                                </g>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </Layout>
  );
}