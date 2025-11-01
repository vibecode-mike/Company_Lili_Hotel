import svgPaths from "./svg-6vdoib8lfm";

function BreadcrumbModule() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0" data-name="Breadcrumb Module">
      <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Breadcrumb-atomic">
        <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">自動回應訊息</p>
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="relative shrink-0 w-full" data-name="Breadcrumb">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
          <BreadcrumbModule />
        </div>
      </div>
    </div>
  );
}

function TitleTextContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Title Text Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[32px] text-center text-nowrap whitespace-pre">自動回應訊息</p>
    </div>
  );
}

function TitleWrapper() {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Title Wrapper">
      <TitleTextContainer />
    </div>
  );
}

function TitleContainer() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Title Container">
      <TitleWrapper />
    </div>
  );
}

function DescriptionTextContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-[592px]" data-name="Description Text Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px]">當用戶加入好友或發送訊息時，自動觸發系統回覆，以確保能在第一時間與用戶互動</p>
    </div>
  );
}

function DescriptionWrapper() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Description Wrapper">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-center flex flex-wrap gap-0 items-center pl-[4px] pr-0 py-0 relative w-full">
          <DescriptionTextContainer />
        </div>
      </div>
    </div>
  );
}

function DescriptionContainer() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Description Container">
      <DescriptionWrapper />
    </div>
  );
}

function HeaderContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Header Container">
      <TitleContainer />
      <DescriptionContainer />
    </div>
  );
}

function Frame3468528() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <div className="overflow-clip relative shrink-0 size-[32px]" data-name="Icon/Search">
        <div className="absolute h-[17.575px] left-[calc(50%-0.2px)] top-[calc(50%-0.212px)] translate-x-[-50%] translate-y-[-50%] w-[17.6px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
            <path d={svgPaths.p29b263c0} fill="var(--fill-0, #A8A8A8)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#dddddd] text-[20px] text-center text-nowrap whitespace-pre">以訊息內容或標籤搜尋</p>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <div className="bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Search Bar">
        <Frame3468528 />
        <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Cancel circle">
          <div className="absolute inset-0" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Vector" opacity="0.87"></g>
            </svg>
          </div>
          <div className="absolute inset-[8.333%]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <path d={svgPaths.pb584900} fill="var(--fill-0, #F5F5F5)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
      <div className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] p-[8px] relative rounded-[12px] shrink-0" data-name="Button/Reanalyze">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">清除全部條件</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="basis-0 content-stretch flex gap-[12px] grow items-center justify-end min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full" data-name="Container">
      <Container />
      <Container1 />
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[0px] text-[12px] text-center text-nowrap whitespace-pre">
        <span>{`共 4 `}</span>
        <span className="tracking-[-0.12px]">筆</span>
      </p>
    </div>
  );
}

function Container4() {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Container">
      <Container3 />
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Container4 />
    </div>
  );
}

function TableTitleAtomic() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[280px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">關鍵字標籤</p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
            <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TableTitleAtomic1() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">狀態</p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
            <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TableTitleAtomic2() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">平台</p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
            <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TableTitleAtomic3() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">觸發次數</p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
            <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full" data-name="Table Header">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/Title-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">訊息內容</p>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[192px]" data-name="Table/Title-atomic">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">回應類型</p>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
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
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">建立時間</p>
                </div>
                <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
                  <div className="absolute inset-0" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                      <g id="Vector"></g>
                    </svg>
                  </div>
                  <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                      <path d={svgPaths.p24dcb900} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[320px]" data-name="Content Container">
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[192px]" data-name="Content Container">
      <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
          <p className="leading-[1.5]">觸發關鍵字</p>
        </div>
      </div>
    </div>
  );
}

function TableListAtomic() {
  return (
    <div className="box-border content-center flex flex-wrap gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[280px]" data-name="Table/List-atomic">
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">飯店</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">房型</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">空房</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">飯店位置</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">人數</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">日期</p>
      </div>
    </div>
  );
}

function TableListAtomic1() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="overflow-clip relative shrink-0 size-[40px]" data-name="Toggle">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[29.17%_8.33%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 17">
            <path d={svgPaths.p38913700} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <div className="absolute bottom-0 left-[-0.03%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group1 />
      <Group2 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group3 />
    </div>
  );
}

function ModeEdit() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group />
      <Group4 />
    </div>
  );
}

function TableRow() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Table Row">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <ContentContainer />
          <ContentContainer1 />
          <TableListAtomic />
          <TableListAtomic1 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">LINE</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px] w-[90px]">
              <p className="leading-[24px]">-</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">2026-10-02 22:47</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-[12px] shrink-0 size-[28px]" data-name="Button/Edit">
            <ModeEdit />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[320px]" data-name="Content Container">
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[192px]" data-name="Content Container">
      <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
          <p className="leading-[1.5]">一律回應</p>
        </div>
      </div>
    </div>
  );
}

function ContentContainer4() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[280px]" data-name="Content Container">
      <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
          <p className="leading-[1.5]">-</p>
        </div>
      </div>
    </div>
  );
}

function TableListAtomic2() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="overflow-clip relative shrink-0 size-[40px]" data-name="Toggle">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[29.17%_8.33%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 17">
            <path d={svgPaths.p38913700} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Group5() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <div className="absolute bottom-0 left-[-0.03%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group6 />
      <Group7 />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group8 />
    </div>
  );
}

function ModeEdit1() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group5 />
      <Group9 />
    </div>
  );
}

function TableRow1() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Table Row">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <ContentContainer2 />
          <ContentContainer3 />
          <ContentContainer4 />
          <TableListAtomic2 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">LINE</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px] w-[90px]">
              <p className="leading-[24px]">-</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">2026-10-02 22:47</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-[12px] shrink-0 size-[28px]" data-name="Button/Edit">
            <ModeEdit1 />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer5() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[320px]" data-name="Content Container">
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">
                <span>{`Hi {User Name`}</span>
                <span className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal">{`}`}</span>
                <span>{` 歡迎加入好友～ 填寫會員資料即可取得精美好禮`}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer6() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[192px]" data-name="Content Container">
      <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
          <p className="leading-[1.5]">歡迎訊息</p>
        </div>
      </div>
    </div>
  );
}

function ContentContainer7() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[280px]" data-name="Content Container">
      <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[320px]" data-name="Table/List-atomic">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
          <p className="leading-[1.5]">-</p>
        </div>
      </div>
    </div>
  );
}

function TableListAtomic3() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="overflow-clip relative shrink-0 size-[40px]" data-name="Toggle">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[29.17%_8.33%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 17">
            <path d={svgPaths.p38913700} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Group10() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group11() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <div className="absolute bottom-0 left-[-0.03%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group13() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group11 />
      <Group12 />
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group13 />
    </div>
  );
}

function ModeEdit2() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group10 />
      <Group14 />
    </div>
  );
}

function TableRow2() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Table Row">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <ContentContainer5 />
          <ContentContainer6 />
          <ContentContainer7 />
          <TableListAtomic3 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">LINE</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px] w-[90px]">
              <p className="leading-[24px]">-</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">2026-10-02 22:47</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-[12px] shrink-0 size-[28px]" data-name="Button/Edit">
            <ModeEdit2 />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer8() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[320px]" data-name="Content Container">
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
              <p className="leading-[1.5]">您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer9() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[192px]" data-name="Content Container">
      <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
          <p className="leading-[1.5]">觸發關鍵字</p>
        </div>
      </div>
    </div>
  );
}

function TableListAtomic4() {
  return (
    <div className="box-border content-center flex flex-wrap gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[280px]" data-name="Table/List-atomic">
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">在哪</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">飯店位置</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">地址</p>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">怎麼去</p>
      </div>
    </div>
  );
}

function TableListAtomic5() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="opacity-50 overflow-clip relative shrink-0 size-[40px]" data-name="Toggle">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[29.17%_8.33%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 17">
            <path d={svgPaths.p23a98e80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Group15() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group16() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group17() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <div className="absolute bottom-0 left-[-0.03%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group18() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group16 />
      <Group17 />
    </div>
  );
}

function Group19() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group18 />
    </div>
  );
}

function ModeEdit3() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group15 />
      <Group19 />
    </div>
  );
}

function TableRow3() {
  return (
    <div className="bg-white relative rounded-bl-[16px] rounded-br-[16px] shrink-0 w-full" data-name="Table Row">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[16px] pt-[12px] px-[12px] relative w-full">
          <ContentContainer8 />
          <ContentContainer9 />
          <TableListAtomic4 />
          <TableListAtomic5 />
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
              <p className="leading-[24px]">LINE</p>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[140px]" data-name="Table/List-atomic">
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px] w-[90px]">
              <p className="leading-[24px]">-</p>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">2026-10-02 22:47</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-[12px] shrink-0 size-[28px]" data-name="Button/Edit">
            <ModeEdit3 />
          </div>
        </div>
      </div>
    </div>
  );
}

function Table8Columns3Actions() {
  return (
    <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[1510px]" data-name="Table/8 Columns+3 Actions">
      <TableHeader />
      <TableRow />
      <TableRow1 />
      <TableRow2 />
      <TableRow3 />
    </div>
  );
}

function TableContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Table Container">
      <Table8Columns3Actions />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container5 />
      <TableContainer />
    </div>
  );
}

function MainContent() {
  return (
    <div className="relative shrink-0 w-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
          <HeaderContainer />
          <Container2 />
          <Container6 />
        </div>
      </div>
    </div>
  );
}

export default function MainContainer() {
  return (
    <div className="bg-slate-50 content-stretch flex flex-col items-start relative size-full" data-name="Main Container">
      <Breadcrumb />
      <MainContent />
    </div>
  );
}