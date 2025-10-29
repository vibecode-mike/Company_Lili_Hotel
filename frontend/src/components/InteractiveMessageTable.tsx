import svgPaths from "../imports/svg-kh0dbookih";

interface Message {
  id: string;
  title: string;
  tags: string[];
  platform: string;
  status: string;
  sentCount: string;
  openCount: string;
  clickCount: string;
  sendTime: string;
}

interface InteractiveMessageTableProps {
  messages: Message[];
  onEdit: (id: string) => void;
  onViewDetails: (id: string) => void;
}

// Table Header Components
function TableTitleAtomic() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[290px]" data-name="Table/Title-atomic">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
        <p className="leading-[1.5]">訊息標題</p>
      </div>
    </div>
  );
}

function IcInfo() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="ic_info">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="ic_info">
          <path d={svgPaths.p2cd5ff00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Sorting() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Sorting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_2001_5023)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_5023">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableTitleAtomic1() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[215px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">標籤</p>
      </div>
      <IcInfo />
      <Sorting />
    </div>
  );
}

function TableTitleAtomic2() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">平台</p>
      </div>
      <Sorting />
    </div>
  );
}

function TableTitleAtomic3() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">狀態</p>
      </div>
      <Sorting />
    </div>
  );
}

function TableTitleAtomic4() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">發送人數</p>
      </div>
      <Sorting />
    </div>
  );
}

function TableTitleAtomic5() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[146px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已開啟次數</p>
      </div>
      <IcInfo />
      <Sorting />
    </div>
  );
}

function TableTitleAtomic6() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[132px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">點擊次數</p>
      </div>
      <IcInfo />
      <Sorting />
    </div>
  );
}

function TableTitleAtomic7() {
  return (
    <div className="relative shrink-0 w-[180px]" data-name="Table/Title-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
            <p className="leading-[1.5] whitespace-pre">發送時間</p>
          </div>
          <div className="relative shrink-0 size-[20px]" data-name="Sorting">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <g clipPath="url(#clip0_2001_5027)" id="Sorting">
                <g id="Vector"></g>
                <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
              </g>
              <defs>
                <clipPath id="clip0_2001_5027">
                  <rect fill="white" height="20" width="20" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// Table Header
function TableHeader() {
  return (
    <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          <TableTitleAtomic />
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <TableTitleAtomic1 />
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <TableTitleAtomic2 />
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <TableTitleAtomic3 />
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <TableTitleAtomic4 />
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <TableTitleAtomic5 />
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <TableTitleAtomic6 />
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <TableTitleAtomic7 />
        </div>
      </div>
    </div>
  );
}

// Table Row Component
function TableRow({ message, onEdit, onViewDetails }: { message: Message; onEdit: (id: string) => void; onViewDetails: (id: string) => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          {/* Title */}
          <div className="content-stretch flex items-center relative shrink-0 w-[290px]">
            <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-[278.8px]">
              <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                <p className="leading-[1.5]">{message.title}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="box-border flex gap-[4px] items-start px-[12px] py-[8px] relative shrink-0 w-[215px]" style={{ flexWrap: 'wrap' }}>
            {message.tags.map((tag, index) => (
              <>
                <div key={index} className="bg-[#f0f6ff] box-border flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0">
                  <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative text-[#0f6beb] text-[16px] text-center whitespace-nowrap">{tag}</p>
                </div>
                {(index + 1) % 2 === 0 && index < message.tags.length - 1 && (
                  <div key={`break-${index}`} className="w-full h-0" />
                )}
              </>
            ))}
          </div>

          {/* Platform */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]">
            <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">{message.platform}</p>
            </div>
          </div>

          {/* Status */}
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">{message.status}</p>
            </div>
            {message.status === '已排程' && (
              <div className="relative shrink-0 size-[16px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                  <g clipPath="url(#clip0_2001_5019)" id="Check/Success">
                    <g id="Vector"></g>
                    <path d={svgPaths.p36cd5f00} fill="var(--fill-0, #00C853)" id="Vector_2" />
                  </g>
                  <defs>
                    <clipPath id="clip0_2001_5019">
                      <rect fill="white" height="16" width="16" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            )}
          </div>

          {/* Sent Count */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[104px]">
            <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">{message.sentCount}</p>
            </div>
          </div>

          {/* Open Count */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[146px]">
            <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">{message.openCount}</p>
            </div>
          </div>

          {/* Click Count */}
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[132px]">
            <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">{message.clickCount}</p>
            </div>
          </div>

          {/* Send Time */}
          <div className="relative shrink-0 w-[180px]">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5] whitespace-nowrap">{message.sendTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div 
            onClick={() => onEdit(message.id)}
            className="relative rounded-[8.4px] shrink-0 size-[28px] cursor-pointer hover:bg-[#f0f6ff] transition-colors flex items-center justify-center"
          >
            <div className="relative size-[16.8px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                <g id="Group">
                  <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" />
                  <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" />
                </g>
              </svg>
            </div>
          </div>

          {/* Details Link */}
          <div 
            onClick={() => onViewDetails(message.id)}
            className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">詳細</p>
            </div>
            <div className="flex items-center justify-center relative shrink-0">
              <div className="flex-none scale-y-[-100%]">
                <div className="relative size-[16px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                    <g id="Arrow">
                      <path d={svgPaths.pbafd480} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InteractiveMessageTable({ messages, onEdit, onViewDetails }: InteractiveMessageTableProps) {
  return (
    <div className="flex flex-col items-start relative rounded-[16px] w-full overflow-x-auto">
      <div className="min-w-[1200px] w-full">
        <TableHeader />
        {messages.length > 0 ? (
          messages.map((message) => (
            <TableRow
              key={message.id}
              message={message}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
            />
          ))
      ) : (
        <div className="bg-white relative shrink-0 w-full p-[40px] text-center">
          <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal text-[#6e6e6e] text-[16px]">
            沒有找到符合條件的訊息
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

export type { Message };
