import svgPaths from "./svg-7n2x2m6q7b";

function Arrow() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Arrow">
          <path d={svgPaths.p2b927b00} fill="var(--fill-0, #6E6E6E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonFilledButton() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <Arrow />
    </div>
  );
}

function Arrow1() {
  return (
    <div className="relative size-[24px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Arrow">
          <path d={svgPaths.p2b927b00} fill="var(--fill-0, #6E6E6E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonFilledButton1() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] opacity-50 p-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg]">
          <Arrow1 />
        </div>
      </div>
    </div>
  );
}

function DeleteIcon() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Delete Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_8297_480)" id="Delete Icon">
          <g id="Vector"></g>
          <path d={svgPaths.pcbf700} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8297_480">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconButton() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center p-[8px] relative rounded-[16px] shrink-0" data-name="Icon Button">
      <DeleteIcon />
    </div>
  );
}

function ModalHeader() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full" data-name="Modal Header">
      <ButtonFilledButton />
      <ButtonFilledButton1 />
      <IconButton />
    </div>
  );
}

function CheckBox() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Check box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_8297_460)" id="Check box">
          <g id="Vector"></g>
          <path d={svgPaths.p6990300} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8297_460">
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

function TextAreaContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-start min-h-[84px] relative shrink-0 w-full" data-name="Text Area Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">輸入訊息文字</p>
    </div>
  );
}

function SubmitButton() {
  return (
    <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Submit Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">好友的顯示名稱</p>
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
          <SubmitButton />
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

function DropdownItem2() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent1 />
      <DropdownItem1 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
      <ModalHeader />
      <DropdownItem2 />
    </div>
  );
}

function Arrow2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Arrow">
          <path d={svgPaths.p2b927b00} fill="var(--fill-0, #6E6E6E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonFilledButton2() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <Arrow2 />
    </div>
  );
}

function Arrow3() {
  return (
    <div className="relative size-[24px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Arrow">
          <path d={svgPaths.p2b927b00} fill="var(--fill-0, #6E6E6E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonFilledButton3() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg]">
          <Arrow3 />
        </div>
      </div>
    </div>
  );
}

function DeleteIcon1() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Delete Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_8297_480)" id="Delete Icon">
          <g id="Vector"></g>
          <path d={svgPaths.pcbf700} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8297_480">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconButton1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center p-[8px] relative rounded-[16px] shrink-0" data-name="Icon Button">
      <DeleteIcon1 />
    </div>
  );
}

function ModalHeader1() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full" data-name="Modal Header">
      <ButtonFilledButton2 />
      <ButtonFilledButton3 />
      <IconButton1 />
    </div>
  );
}

function CheckBox1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Check box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_8297_460)" id="Check box">
          <g id="Vector"></g>
          <path d={svgPaths.p6990300} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8297_460">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function ActionButtonIconContainer1() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]" data-name="Action Button Icon Container">
      <CheckBox1 />
    </div>
  );
}

function ModalTitle1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">訊息文字</p>
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

function ModalTitleContent2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
      <ModalTitle1 />
      <Hint1 />
    </div>
  );
}

function ActionButtonInfoIcon1() {
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

function ModalTitleContent3() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer1 />
      <ModalTitleContent2 />
      <ActionButtonInfoIcon1 />
    </div>
  );
}

function TextAreaContainer1() {
  return (
    <div className="content-stretch flex gap-[10px] items-start min-h-[84px] relative shrink-0 w-full" data-name="Text Area Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">輸入訊息文字</p>
    </div>
  );
}

function SubmitButton1() {
  return (
    <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Submit Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">好友的顯示名稱</p>
    </div>
  );
}

function TextArea1() {
  return (
    <div className="bg-white min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col justify-center min-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[16px] relative w-full">
          <TextAreaContainer1 />
          <SubmitButton1 />
        </div>
      </div>
    </div>
  );
}

function Digit1() {
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

function DropdownItem3() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end relative shrink-0 w-full" data-name="Dropdown Item">
      <Digit1 />
    </div>
  );
}

function DropdownItem4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <TextArea1 />
      <DropdownItem3 />
    </div>
  );
}

function DropdownItem5() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent3 />
      <DropdownItem4 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
      <ModalHeader1 />
      <DropdownItem5 />
    </div>
  );
}

function Add() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Add">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_8297_473)" id="Add">
          <g id="Vector"></g>
          <path d={svgPaths.p3a3793c0} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8297_473">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconTextButtonSecondary() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[4px] items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Icon+Text Button*Secondary">
      <Add />
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">新增</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
      <IconTextButtonSecondary />
    </div>
  );
}

export default function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative size-full">
      <Frame />
      {[...Array(3).keys()].map((_, i) => (
        <Frame1 key={i} />
      ))}
      <Frame2 />
    </div>
  );
}