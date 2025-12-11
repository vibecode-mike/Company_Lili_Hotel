import svgPaths from "./svg-12t3cmqk9i";

function CheckBox() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Check box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_8254_1080)" id="Check box">
          <g id="Vector"></g>
          <path d={svgPaths.p6990300} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8254_1080">
            <rect fill="white" height="20" width="20" />
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
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
      <ModalTitle />
      <Hint />
    </div>
  );
}

function ActionButtonInfoIcon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Action Button Info Icon">
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

function Close() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_8264_2722)" id="Close">
          <g id="Vector"></g>
          <path d={svgPaths.p2e85a380} fill="var(--fill-0, #A8A8A8)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8264_2722">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Tag() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px]">關鍵字標籤</p>
      <Close />
    </div>
  );
}

function TextAreaContainer() {
  return (
    <div className="content-center flex flex-wrap gap-[4px] items-center relative shrink-0 w-full" data-name="Text Area Container">
      {[...Array(9).keys()].map((_, i) => (
        <Tag key={i} />
      ))}
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

function Digit() {
  return (
    <div className="h-[18px] relative shrink-0 w-full" data-name="Digit">
      <div className="absolute bottom-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] left-[97.09%] right-0 text-[#6e6e6e] text-[12px] text-nowrap text-right top-0">
        <p className="leading-[1.5] whitespace-pre">
          9<span className="text-[#383838]">/20</span>
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