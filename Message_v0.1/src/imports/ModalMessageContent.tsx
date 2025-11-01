import svgPaths from "./svg-3x7tacqrbm";

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
        <p className="leading-[1.5] whitespace-pre">回應類型</p>
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
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame4816() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">歡迎訊息</p>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Arrow">
        <div className="absolute inset-[37.49%_26.74%_35.07%_26.7%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
            <path d={svgPaths.pc951b80} fill="var(--fill-0, #6E6E6E)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function DropdownItem() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent />
      <div className="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[8px] shrink-0" data-name="Option">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame4816 />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButtonIconContainer1() {
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

function ModalTitle1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">觸發時間</p>
      </div>
    </div>
  );
}

function Hint1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer1 />
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle1 />
        <Hint1 />
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

function Option() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Option">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Radio Button">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[8.333%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p3a58b490} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[29.167%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
            <path d={svgPaths.p46c6500} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">立即回覆</p>
        </div>
      </div>
    </div>
  );
}

function Option1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Option">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Radio Button">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[8.333%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p3a58b490} fill="var(--fill-0, #383838)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">指定日期或時間</p>
        </div>
      </div>
    </div>
  );
}

function OptionContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Option Container">
      <Option1 />
    </div>
  );
}

function RadioButton() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Radio Button">
      <Option />
      <OptionContainer />
    </div>
  );
}

function DropdownItem1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent1 />
      <RadioButton />
    </div>
  );
}

function ActionButtonIconContainer2() {
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

function ModalTitle2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">訊息文字</p>
      </div>
    </div>
  );
}

function Hint2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent2() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer2 />
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle2 />
        <Hint2 />
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
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
    <div className="content-stretch flex gap-[10px] items-start min-h-[84px] relative shrink-0 w-full" data-name="Text Area Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">輸入訊息文字</p>
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
          <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Submit Button">
            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">好友的顯示名稱</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem2() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end relative shrink-0 w-full" data-name="Dropdown Item">
      <div className="h-[18px] relative shrink-0 w-full" data-name="Digit">
        <div className="absolute flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 justify-center leading-[0] text-[#6e6e6e] text-[12px] text-nowrap text-right">
          <p className="leading-[1.5] whitespace-pre">
            0<span className="text-[#383838]">/100</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function DropdownItem3() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <TextArea />
      <DropdownItem2 />
    </div>
  );
}

function DropdownItem4() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent2 />
      <DropdownItem3 />
    </div>
  );
}

function ModalBody() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-end relative shrink-0 w-full" data-name="Modal Body">
      <DropdownItem />
      <DropdownItem1 />
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1018 1">
            <line id="Line 93" stroke="var(--stroke-0, #E1EBF9)" strokeLinecap="round" x1="0.5" x2="1017.5" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <DropdownItem4 />
    </div>
  );
}

export default function ModalMessageContent() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-end relative size-full" data-name="Modal#Message#Content">
      <ModalBody />
    </div>
  );
}