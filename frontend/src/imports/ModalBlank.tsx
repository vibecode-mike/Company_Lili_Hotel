import svgPaths from "./svg-er211vihwc";

function Frame1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[32px]">
        <p className="leading-[1.5]">篩選目標對象</p>
      </div>
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

function Frame2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <IconSearch />
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#a8a8a8] text-[20px] text-center text-nowrap whitespace-pre">輸入或按 Enter 新增標籤，可多組輸入</p>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-[292px] relative rounded-[16px] shrink-0" data-name="Search Bar">
      <div className="flex flex-row items-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[28px] items-center min-w-inherit px-[12px] py-[8px] relative w-full">
          <Frame2 />
        </div>
      </div>
    </div>
  );
}

function ModalTitle() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">條件</p>
      </div>
    </div>
  );
}

function Hint() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
      <ModalTitle />
      <Hint />
    </div>
  );
}

function ModalTitleContent1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[60px] relative shrink-0" data-name="Modal/Title&Content">
      <ModalTitleContent />
    </div>
  );
}

function Toggle() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Toggle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g clipPath="url(#clip0_15_501)" id="Toggle">
          <g id="Vector"></g>
          <path d={svgPaths.p13e42a00} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_15_501">
            <rect fill="white" height="40" width="40" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FilterToggle() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Filter Toggle">
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#a8a8a8] text-[16px] text-nowrap whitespace-pre">不包含</p>
      <Toggle />
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-nowrap whitespace-pre">包含</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <ModalTitleContent1 />
      <FilterToggle />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex gap-[36px] items-center relative shrink-0 w-full">
      <SearchBar />
      <Frame6 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full">
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#a8a8a8] text-[0px] text-[20px] text-center text-nowrap whitespace-pre">
        尚無標<span className="tracking-[-0.2px]">籤，於上方輸入並</span>開始建立
      </p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px relative shrink-0 w-full">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[14px] w-[410px]">
        <p className="leading-[1.5]">選擇或建立標籤</p>
      </div>
      <Frame8 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[32px] grow items-start min-h-px min-w-px relative shrink-0 w-full">
      <Frame1 />
      <Frame7 />
      <Frame5 />
    </div>
  );
}

function ButtonFilledButton() {
  return (
    <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">取消</p>
    </div>
  );
}

function ButtonFilledButton1() {
  return (
    <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">確認</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-end min-h-px min-w-px relative shrink-0">
      <ButtonFilledButton />
      <ButtonFilledButton1 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full">
      <Frame3 />
    </div>
  );
}

export default function ModalBlank() {
  return (
    <div className="bg-white relative rounded-[16px] size-full" data-name="Modal#Blank">
      <div className="min-h-inherit min-w-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[60px] items-start min-h-inherit min-w-inherit p-[32px] relative size-full">
          <Frame4 />
          <Frame />
        </div>
      </div>
    </div>
  );
}