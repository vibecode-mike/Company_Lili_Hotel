import svgPaths from "./svg-ckckvhq9os";

function BreadcrumbAtomic() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Breadcrumb-atomic">
      <p className="font-['Noto_Sans_TC:Medium',_sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">活動與訊息推播</p>
    </div>
  );
}

function BreadcrumbModule() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0" data-name="Breadcrumb Module">
      <BreadcrumbAtomic />
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
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[32px] text-center text-nowrap whitespace-pre">活動與訊息推播</p>
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
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Description Text Container">
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[16px] text-center text-nowrap whitespace-pre">建立單一圖文或多頁輪播內容，打造引人注目的品牌訊息</p>
    </div>
  );
}

function DescriptionWrapper() {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Description Wrapper">
      <DescriptionTextContainer />
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

function IconSearch() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Icon/Search">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Icon/Search">
          <path d={svgPaths.p2bfa9080} fill="var(--fill-0, #A8A8A8)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame10() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
      <IconSearch />
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#dddddd] text-[20px] text-center text-nowrap whitespace-pre">輸入搜尋</p>
    </div>
  );
}

function CancelCircle() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Cancel circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g clipPath="url(#clip0_2001_2718)" id="Cancel circle">
          <g id="Vector" opacity="0.87"></g>
          <path d={svgPaths.p3cde6900} fill="var(--fill-0, #F5F5F5)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2718">
            <rect fill="white" height="24" width="24" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 w-[292px]" data-name="Search Bar">
      <Frame10 />
      <CancelCircle />
    </div>
  );
}

function ButtonReanalyze() {
  return (
    <div className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] p-[8px] relative rounded-[12px] shrink-0" data-name="Button/Reanalyze">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">清除全部條件</p>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <SearchBar />
      <ButtonReanalyze />
    </div>
  );
}

function ButtonFilledButton() {
  return (
    <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立訊息</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="basis-0 content-stretch flex gap-[12px] grow items-center justify-end min-h-px min-w-px relative shrink-0">
      <ButtonFilledButton />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full">
      <Frame11 />
      <Frame9 />
    </div>
  );
}

function ButtonFilledButton1() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">已排程 (6)</p>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      <ButtonFilledButton1 />
    </div>
  );
}

function ButtonFilledButton2() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">草稿 (2)</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <ButtonFilledButton2 />
    </div>
  );
}

function ButtonFilledButton3() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">已發送 (0)</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <ButtonFilledButton3 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <Frame14 />
      <Frame13 />
      <Frame12 />
    </div>
  );
}

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
        <g clipPath="url(#clip0_2001_2685)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2685">
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

function Sorting1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Sorting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_2001_2685)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2685">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableTitleAtomic2() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">平台</p>
      </div>
      <Sorting1 />
    </div>
  );
}

function Sorting2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Sorting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_2001_2685)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2685">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableTitleAtomic3() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">狀態</p>
      </div>
      <Sorting2 />
    </div>
  );
}

function Sorting3() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Sorting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_2001_2685)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2685">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableTitleAtomic4() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">發送人數</p>
      </div>
      <Sorting3 />
    </div>
  );
}

function IcInfo1() {
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

function Sorting4() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Sorting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_2001_2685)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2685">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableTitleAtomic5() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已開啟次數</p>
      </div>
      <IcInfo1 />
      <Sorting4 />
    </div>
  );
}

function IcInfo2() {
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

function Sorting5() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Sorting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_2001_2685)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2685">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableTitleAtomic6() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/Title-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">點擊次數</p>
      </div>
      <IcInfo2 />
      <Sorting5 />
    </div>
  );
}

function Sorting6() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Sorting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_2001_2681)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2681">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableTitleAtomic7() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
            <p className="leading-[1.5] whitespace-pre">發送時間</p>
          </div>
          <Sorting6 />
        </div>
      </div>
    </div>
  );
}

function Frame2() {
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

function TableListAtomic() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
        <p className="leading-[1.5]">雙人遊行 獨家優惠</p>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[290px]">
      <TableListAtomic />
    </div>
  );
}

function Tag() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">雙人床</p>
    </div>
  );
}

function Tag1() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">送禮</p>
    </div>
  );
}

function Tag2() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">KOL</p>
    </div>
  );
}

function TableListAtomic1() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[215px]" data-name="Table/List-atomic">
      <Tag />
      <Tag1 />
      <Tag2 />
    </div>
  );
}

function TableListAtomic2() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">LINE</p>
      </div>
    </div>
  );
}

function CheckSuccess() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check/Success">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_2001_2677)" id="Check/Success">
          <g id="Vector"></g>
          <path d={svgPaths.p36cd5f00} fill="var(--fill-0, #00C853)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2677">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableListAtomic3() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已排程</p>
      </div>
      <CheckSuccess />
    </div>
  );
}

function TableListAtomic4() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic5() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[146px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic6() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[132px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic7() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
            <p className="leading-[1.5]">2026-10-02 22:47</p>
          </div>
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
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="Group">
          <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[12.49%_12.5%_63.04%_63.03%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
        <g id="Group">
          <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
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

function ButtonEdit() {
  return (
    <div className="relative rounded-[8.4px] shrink-0 size-[28px]" data-name="Button/Edit">
      <ModeEdit />
    </div>
  );
}

function Arrow() {
  return (
    <div className="relative size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <path d={svgPaths.pbafd480} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TableListAtomic8() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">詳細</p>
      </div>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Arrow />
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <Frame15 />
          <TableListAtomic1 />
          <TableListAtomic2 />
          <TableListAtomic3 />
          <TableListAtomic4 />
          <TableListAtomic5 />
          <TableListAtomic6 />
          <TableListAtomic7 />
          <ButtonEdit />
          <TableListAtomic8 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic9() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
        <p className="leading-[1.5]">雙人遊行 獨家優惠</p>
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[290px]">
      <TableListAtomic9 />
    </div>
  );
}

function Tag3() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">商務房</p>
    </div>
  );
}

function Tag4() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">送禮</p>
    </div>
  );
}

function Tag5() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">KOL</p>
    </div>
  );
}

function TableListAtomic10() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
          <Tag3 />
          <Tag4 />
          <Tag5 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic11() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">LINE</p>
      </div>
    </div>
  );
}

function CheckSuccess1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check/Success">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_2001_2677)" id="Check/Success">
          <g id="Vector"></g>
          <path d={svgPaths.p36cd5f00} fill="var(--fill-0, #00C853)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2677">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableListAtomic12() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已排程</p>
      </div>
      <CheckSuccess1 />
    </div>
  );
}

function TableListAtomic13() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic14() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[146px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic15() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[132px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic16() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
            <p className="leading-[1.5]">2026-10-02 22:47</p>
          </div>
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
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="Group">
          <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute inset-[12.49%_12.5%_63.04%_63.03%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
        <g id="Group">
          <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
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

function ButtonEdit1() {
  return (
    <div className="relative rounded-[8.4px] shrink-0 size-[28px]" data-name="Button/Edit">
      <ModeEdit1 />
    </div>
  );
}

function Arrow1() {
  return (
    <div className="relative size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <path d={svgPaths.pbafd480} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TableListAtomic17() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">詳細</p>
      </div>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Arrow1 />
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <Frame16 />
          <TableListAtomic10 />
          <TableListAtomic11 />
          <TableListAtomic12 />
          <TableListAtomic13 />
          <TableListAtomic14 />
          <TableListAtomic15 />
          <TableListAtomic16 />
          <ButtonEdit1 />
          <TableListAtomic17 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic18() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
        <p className="leading-[1.5]">雙人遊行 獨家優惠</p>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[290px]">
      <TableListAtomic18 />
    </div>
  );
}

function Tag6() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">商務房</p>
    </div>
  );
}

function Tag7() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">KOL</p>
    </div>
  );
}

function TableListAtomic19() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
          <Tag6 />
          <Tag7 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic20() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">LINE</p>
      </div>
    </div>
  );
}

function CheckSuccess2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check/Success">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_2001_2677)" id="Check/Success">
          <g id="Vector"></g>
          <path d={svgPaths.p36cd5f00} fill="var(--fill-0, #00C853)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2677">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableListAtomic21() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已排程</p>
      </div>
      <CheckSuccess2 />
    </div>
  );
}

function TableListAtomic22() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic23() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[146px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic24() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[132px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic25() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
            <p className="leading-[1.5]">2026-10-02 22:47</p>
          </div>
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
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="Group">
          <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute inset-[12.49%_12.5%_63.04%_63.03%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
        <g id="Group">
          <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
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

function ButtonEdit2() {
  return (
    <div className="relative rounded-[8.4px] shrink-0 size-[28px]" data-name="Button/Edit">
      <ModeEdit2 />
    </div>
  );
}

function Arrow2() {
  return (
    <div className="relative size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <path d={svgPaths.pbafd480} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TableListAtomic26() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">詳細</p>
      </div>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Arrow2 />
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <Frame17 />
          <TableListAtomic19 />
          <TableListAtomic20 />
          <TableListAtomic21 />
          <TableListAtomic22 />
          <TableListAtomic23 />
          <TableListAtomic24 />
          <TableListAtomic25 />
          <ButtonEdit2 />
          <TableListAtomic26 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic27() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
        <p className="leading-[1.5]">雙人遊行 獨家優惠</p>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[290px]">
      <TableListAtomic27 />
    </div>
  );
}

function Tag8() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">環湖體驗</p>
    </div>
  );
}

function Tag9() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">KOL</p>
    </div>
  );
}

function TableListAtomic28() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
          <Tag8 />
          <Tag9 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic29() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">LINE</p>
      </div>
    </div>
  );
}

function CheckSuccess3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check/Success">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_2001_2677)" id="Check/Success">
          <g id="Vector"></g>
          <path d={svgPaths.p36cd5f00} fill="var(--fill-0, #00C853)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2677">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableListAtomic30() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已排程</p>
      </div>
      <CheckSuccess3 />
    </div>
  );
}

function TableListAtomic31() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic32() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[146px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic33() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[132px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic34() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
            <p className="leading-[1.5]">2026-10-02 22:47</p>
          </div>
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
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="Group">
          <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group17() {
  return (
    <div className="absolute inset-[12.49%_12.5%_63.04%_63.03%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
        <g id="Group">
          <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
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

function ButtonEdit3() {
  return (
    <div className="relative rounded-[8.4px] shrink-0 size-[28px]" data-name="Button/Edit">
      <ModeEdit3 />
    </div>
  );
}

function Arrow3() {
  return (
    <div className="relative size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <path d={svgPaths.pbafd480} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TableListAtomic35() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">詳細</p>
      </div>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Arrow3 />
        </div>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <Frame18 />
          <TableListAtomic28 />
          <TableListAtomic29 />
          <TableListAtomic30 />
          <TableListAtomic31 />
          <TableListAtomic32 />
          <TableListAtomic33 />
          <TableListAtomic34 />
          <ButtonEdit3 />
          <TableListAtomic35 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic36() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
        <p className="leading-[1.5]">雙人遊行 獨家優惠</p>
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[290px]">
      <TableListAtomic36 />
    </div>
  );
}

function Tag10() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">親子房</p>
    </div>
  );
}

function Tag11() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">KOL</p>
    </div>
  );
}

function TableListAtomic37() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
          <Tag10 />
          <Tag11 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic38() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">LINE</p>
      </div>
    </div>
  );
}

function CheckSuccess4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check/Success">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_2001_2677)" id="Check/Success">
          <g id="Vector"></g>
          <path d={svgPaths.p36cd5f00} fill="var(--fill-0, #00C853)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2677">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableListAtomic39() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已排程</p>
      </div>
      <CheckSuccess4 />
    </div>
  );
}

function TableListAtomic40() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic41() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[146px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic42() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[132px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic43() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
            <p className="leading-[1.5]">2026-10-02 22:47</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group20() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group21() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="Group">
          <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group22() {
  return (
    <div className="absolute inset-[12.49%_12.5%_63.04%_63.03%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
        <g id="Group">
          <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group23() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group21 />
      <Group22 />
    </div>
  );
}

function Group24() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group23 />
    </div>
  );
}

function ModeEdit4() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group20 />
      <Group24 />
    </div>
  );
}

function ButtonEdit4() {
  return (
    <div className="relative rounded-[8.4px] shrink-0 size-[28px]" data-name="Button/Edit">
      <ModeEdit4 />
    </div>
  );
}

function Arrow4() {
  return (
    <div className="relative size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <path d={svgPaths.pbafd480} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TableListAtomic44() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">詳細</p>
      </div>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Arrow4 />
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[12px] relative w-full">
          <Frame19 />
          <TableListAtomic37 />
          <TableListAtomic38 />
          <TableListAtomic39 />
          <TableListAtomic40 />
          <TableListAtomic41 />
          <TableListAtomic42 />
          <TableListAtomic43 />
          <ButtonEdit4 />
          <TableListAtomic44 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic45() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[278.8px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
        <p className="leading-[1.5]">雙人遊行 獨家優惠</p>
      </div>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[290px]">
      <TableListAtomic45 />
    </div>
  );
}

function Tag12() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">豪華套房</p>
    </div>
  );
}

function Tag13() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">和風專案</p>
    </div>
  );
}

function TableListAtomic46() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
          <Tag12 />
          <Tag13 />
        </div>
      </div>
    </div>
  );
}

function TableListAtomic47() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">LINE</p>
      </div>
    </div>
  );
}

function CheckSuccess5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check/Success">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_2001_2677)" id="Check/Success">
          <g id="Vector"></g>
          <path d={svgPaths.p36cd5f00} fill="var(--fill-0, #00C853)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2001_2677">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableListAtomic48() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已排程</p>
      </div>
      <CheckSuccess5 />
    </div>
  );
}

function TableListAtomic49() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[104px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic50() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[146px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic51() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[132px]" data-name="Table/List-atomic">
      <div className="basis-0 flex flex-col font-['Inter:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#383838] text-[14px] tracking-[0.22px]">
        <p className="leading-[24px]">-</p>
      </div>
    </div>
  );
}

function TableListAtomic52() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
            <p className="leading-[1.5]">2026-10-02 22:47</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group25() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group26() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="Group">
          <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group27() {
  return (
    <div className="absolute inset-[12.49%_12.5%_63.04%_63.03%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
        <g id="Group">
          <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group28() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group26 />
      <Group27 />
    </div>
  );
}

function Group29() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group28 />
    </div>
  );
}

function ModeEdit5() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group25 />
      <Group29 />
    </div>
  );
}

function ButtonEdit5() {
  return (
    <div className="relative rounded-[8.4px] shrink-0 size-[28px]" data-name="Button/Edit">
      <ModeEdit5 />
    </div>
  );
}

function Arrow5() {
  return (
    <div className="relative size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <path d={svgPaths.pbafd480} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TableListAtomic53() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f6beb] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">詳細</p>
      </div>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Arrow5 />
        </div>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-white relative rounded-bl-[16px] rounded-br-[16px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[16px] pt-[12px] px-[12px] relative w-full">
          <Frame20 />
          <TableListAtomic46 />
          <TableListAtomic47 />
          <TableListAtomic48 />
          <TableListAtomic49 />
          <TableListAtomic50 />
          <TableListAtomic51 />
          <TableListAtomic52 />
          <ButtonEdit5 />
          <TableListAtomic53 />
        </div>
      </div>
    </div>
  );
}

function Table8Columns3Actions() {
  return (
    <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[1510px]" data-name="Table/8 Columns+3 Actions">
      <Frame2 />
      <Frame3 />
      <Frame4 />
      <Frame5 />
      <Frame6 />
      <Frame7 />
      <Frame8 />
    </div>
  );
}

function MainContent() {
  return (
    <div className="relative shrink-0 w-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
          <HeaderContainer />
          <Frame />
          <Frame1 />
          <Table8Columns3Actions />
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