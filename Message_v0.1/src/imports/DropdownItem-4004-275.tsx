import svgPaths from "./svg-hbkooryl5v";

function CheckBox() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_4004_285)" id="Check box">
          <g id="Vector"></g>
          <path d={svgPaths.pcd62e00} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_4004_285">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function ActionButtonIconContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]" data-name="Action Button Icon Container">
      <CheckBox />
    </div>
  );
}

function ModalTitle() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">訊息文字</p>
      </div>
    </div>
  );
}

function Hint() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
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

function ActionButtonInfoIcon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Action Button Info Icon" opacity="0">
          <path d={svgPaths.p2cd5ff00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ModalTitleContent1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer />
      <ModalTitleContent />
      <ActionButtonInfoIcon />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">輸入訊息文字</p>
    </div>
  );
}

function TextArea() {
  return (
    <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col justify-center min-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
          <Frame />
        </div>
      </div>
    </div>
  );
}

function Digit() {
  return (
    <div className="h-[18px] relative shrink-0 w-full" data-name="Digit">
      <div className="absolute bottom-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] left-[96.27%] right-0 text-[#6e6e6e] text-[12px] text-nowrap text-right top-0">
        <p className="leading-[1.5] whitespace-pre">
          0<span className="text-[#383838]">/100</span>
        </p>
      </div>
    </div>
  );
}

function DropdownItem() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end relative shrink-0 w-full" data-name="Dropdown Item">
      <Digit />
    </div>
  );
}

function DropdownItem1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <TextArea />
      <DropdownItem />
    </div>
  );
}

export default function DropdownItem2() {
  return (
    <div className="content-stretch flex items-start relative size-full" data-name="Dropdown Item">
      <ModalTitleContent1 />
      <DropdownItem1 />
    </div>
  );
}