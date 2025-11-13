import svgPaths from "./svg-0t36cx7k7a";

function ActiveButtonContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full" data-name="Active Button Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">訊息排序</p>
    </div>
  );
}

function SwitchButtonActive() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center p-[8px] relative rounded-[8px] shrink-0" data-name="Switch Button#Active">
      <ActiveButtonContainer />
    </div>
  );
}

function Switch() {
  return (
    <div className="bg-slate-50 box-border content-stretch flex gap-[4px] items-center p-[4px] relative rounded-[12px] shrink-0" data-name="Switch">
      <SwitchButtonActive />
    </div>
  );
}

function SwitchContainer() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-name="Switch Container">
      <Switch />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16.938px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18px] relative w-[16.938px]">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">OA</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-white relative rounded-[3.35544e+07px] shrink-0 size-[45px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[45px]">
        <Paragraph />
      </div>
    </div>
  );
}

function CardDescription() {
  return (
    <div className="relative shrink-0 w-full" data-name="Card Description">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-white">輸入訊息文字</p>
        </div>
      </div>
    </div>
  );
}

function TemplateTextOnly() {
  return (
    <div className="bg-[#383838] max-w-[288px] relative rounded-[15px] shrink-0 w-[288px]" data-name="Template#Text only">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-center max-w-inherit overflow-clip relative rounded-[inherit] w-[288px]">
        <CardDescription />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-[288px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip relative rounded-[inherit] w-[288px]">
        <TemplateTextOnly />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-gradient-to-b box-border content-stretch flex from-[#a5d8ff] gap-[20px] items-start overflow-clip p-[24px] relative rounded-[20px] self-stretch shrink-0 to-[#d0ebff] w-[460px]" data-name="Container">
      <Container />
      <Container1 />
    </div>
  );
}

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

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">歡迎訊息</p>
      <Arrow />
    </div>
  );
}

function Option() {
  return (
    <div className="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[8px] shrink-0" data-name="Option">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col justify-center min-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[8px] relative w-full">
          <Frame />
        </div>
      </div>
    </div>
  );
}

function DropdownItem() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent1 />
      <Option />
    </div>
  );
}

function CheckBox1() {
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

function ActionButtonIconContainer1() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]" data-name="Action Button Icon Container">
      <CheckBox1 />
    </div>
  );
}

function ModalTitleContent2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">啟用狀態</p>
      </div>
    </div>
  );
}

function ModalTitleContent3() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer1 />
      <ModalTitleContent2 />
    </div>
  );
}

function Toggle() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Toggle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g clipPath="url(#clip0_8254_1101)" id="Toggle">
          <g id="Vector"></g>
          <path d={svgPaths.p13e42a00} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8254_1101">
            <rect fill="white" height="40" width="40" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function RadioButton() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Radio Button">
      <Toggle />
    </div>
  );
}

function DropdownItem1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent3 />
      <RadioButton />
    </div>
  );
}

function CheckBox2() {
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

function ActionButtonIconContainer2() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]" data-name="Action Button Icon Container">
      <CheckBox2 />
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

function ModalTitleContent4() {
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
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Action Button Info Icon">
          <path d={svgPaths.p2cd5ff00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ModalTitleContent5() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer2 />
      <ModalTitleContent4 />
      <ActionButtonInfoIcon1 />
    </div>
  );
}

function RadioButton1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Radio Button">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g clipPath="url(#clip0_8254_1084)" id="Radio Button">
          <g id="Vector"></g>
          <path d={svgPaths.p26f9ce00} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
          <path d={svgPaths.pee04100} fill="var(--fill-0, #0F6BEB)" id="Vector_3" />
        </g>
        <defs>
          <clipPath id="clip0_8254_1084">
            <rect fill="white" height="24" width="24" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function ModalTitleContent6() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">立即回覆</p>
      </div>
    </div>
  );
}

function Option1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Option">
      <RadioButton1 />
      <ModalTitleContent6 />
    </div>
  );
}

function RadioButton2() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Radio Button">
      <Option1 />
    </div>
  );
}

function DropdownItem2() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent5 />
      <RadioButton2 />
    </div>
  );
}

function Arrow1() {
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
      <Arrow1 />
    </div>
  );
}

function Arrow2() {
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
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg]">
          <Arrow2 />
        </div>
      </div>
    </div>
  );
}

function DeleteIcon() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Delete Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_8254_74)" id="Delete Icon">
          <g id="Vector"></g>
          <path d={svgPaths.pcbf700} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8254_74">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconButton() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center opacity-50 p-[8px] relative rounded-[16px] shrink-0" data-name="Icon Button">
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

function CheckBox3() {
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

function ActionButtonIconContainer3() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]" data-name="Action Button Icon Container">
      <CheckBox3 />
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

function ModalTitleContent7() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
      <ModalTitle2 />
      <Hint2 />
    </div>
  );
}

function ActionButtonInfoIcon2() {
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

function ModalTitleContent8() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer3 />
      <ModalTitleContent7 />
      <ActionButtonInfoIcon2 />
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

function DropdownItem3() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end relative shrink-0 w-full" data-name="Dropdown Item">
      <Digit />
    </div>
  );
}

function DropdownItem4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <TextArea />
      <DropdownItem3 />
    </div>
  );
}

function DropdownItem5() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent8 />
      <DropdownItem4 />
    </div>
  );
}

function Add() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Add">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_8254_1105)" id="Add">
          <g id="Vector"></g>
          <path d={svgPaths.p3a3793c0} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8254_1105">
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

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
      <ModalHeader />
      <DropdownItem5 />
      <IconTextButtonSecondary />
    </div>
  );
}

function ModalBody() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-end relative shrink-0 w-full" data-name="Modal Body">
      <DropdownItem />
      <DropdownItem1 />
      <DropdownItem2 />
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1018 1">
            <line id="Line 93" stroke="var(--stroke-0, #E1EBF9)" strokeLinecap="round" x1="0.5" x2="1017.5" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <Frame1 />
    </div>
  );
}

function ModalMessageContent() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-end min-h-[200px] relative shrink-0 w-full" data-name="Modal#Message#Content">
      <ModalBody />
    </div>
  );
}

function ModalContent() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[24px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Modal Content">
      <ModalMessageContent />
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full" data-name="Content Container">
      <Container2 />
      <ModalContent />
    </div>
  );
}

export default function ContentContainer1() {
  return (
    <div className="relative size-full" data-name="Content Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative size-full">
          <SwitchContainer />
          <ContentContainer />
        </div>
      </div>
    </div>
  );
}