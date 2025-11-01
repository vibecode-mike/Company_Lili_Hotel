import svgPaths from "./svg-i0s4b3eetb";

function ActionButtonIconContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]" data-name="Action Button Icon Container">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Check box">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[12.5%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
            <path d={svgPaths.p2f710980} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ModalTitle() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">關鍵字標籤</p>
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
    <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer />
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle />
        <Hint />
      </div>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TextAreaContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Text Area Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">點擊 Enter 即可新增關鍵字標籤</p>
    </div>
  );
}

function TextArea() {
  return (
    <div className="bg-white min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col justify-center min-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[16px] relative w-full">
          <TextAreaContainer />
        </div>
      </div>
    </div>
  );
}

function DropdownItem() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end relative shrink-0 w-full" data-name="Dropdown Item">
      <div className="h-[18px] relative shrink-0 w-full" data-name="Digit">
        <div className="absolute flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 justify-center leading-[0] text-[#6e6e6e] text-[12px] text-nowrap text-right">
          <p className="leading-[1.5] whitespace-pre">
            0<span className="text-[#383838]">/20</span>
          </p>
        </div>
      </div>
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
      <ModalTitleContent />
      <DropdownItem1 />
    </div>
  );
}