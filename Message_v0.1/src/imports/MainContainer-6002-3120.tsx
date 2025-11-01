import svgPaths from "./svg-5k1pwt7x5m";

function BreadcrumbModule() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0" data-name="Breadcrumb Module">
      <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Breadcrumb-atomic">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[14px] text-nowrap whitespace-pre">自動回應訊息</p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[12px]" data-name="Breadcrumb Divider">
        <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.9510564804077148)+(var(--transform-inner-height)*0.30901697278022766)))] items-center justify-center left-[calc(50%-0.313px)] top-[calc(50%+0.542px)] translate-x-[-50%] translate-y-[-50%] w-[calc(1px*((var(--transform-inner-height)*0.9510564804077148)+(var(--transform-inner-width)*0.30901697278022766)))]" style={{ "--transform-inner-width": "8.5", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="flex-none rotate-[108deg]">
            <div className="h-0 relative w-[8.5px]">
              <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 1">
                  <line id="Line 91" stroke="var(--stroke-0, #6E6E6E)" strokeLinecap="round" x1="0.5" x2="8" y1="0.5" y2="0.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Breadcrumb-atomic">
        <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">建立自動回應訊息</p>
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

function ModalFooter() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0" data-name="Modal Footer">
      <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立</p>
      </div>
    </div>
  );
}

function HeaderContainer() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Header Container">
      <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Header Text">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">建立自動回應訊息</p>
        </div>
      </div>
      <ModalFooter />
    </div>
  );
}

function MainContent() {
  return (
    <div className="relative shrink-0 w-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
          <HeaderContainer />
        </div>
      </div>
    </div>
  );
}

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

function Button() {
  return (
    <div className="aspect-[48/48] content-stretch flex gap-[4px] h-full items-center justify-center relative shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">1</p>
      </div>
    </div>
  );
}

function ButtonFilledButton() {
  return (
    <div className="box-border content-stretch flex h-full items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <div className="content-stretch flex gap-[2px] items-center justify-center min-w-[32px] relative rounded-[8px] shrink-0" data-name="Tag">
        <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Add">
          <div className="absolute inset-0" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Vector"></g>
            </svg>
          </div>
          <div className="absolute inset-[20.833%]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
              <path d={svgPaths.pb4c0180} fill="var(--fill-0, #A8A8A8)" id="Vector" />
            </svg>
          </div>
        </div>
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">新增訊息內容</p>
      </div>
    </div>
  );
}

function Category() {
  return (
    <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Category">
      <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center self-stretch">
        <Button />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <ButtonFilledButton />
      </div>
    </div>
  );
}

function SwitchContainer() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-name="Switch Container">
      <Switch />
      <Category />
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

function ButtonFilledButton1() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
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

function ButtonFilledButton2() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg]">
          <div className="overflow-clip relative size-[24px]" data-name="Arrow">
            <div className="absolute inset-[37.49%_26.74%_35.07%_26.7%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                <path d={svgPaths.pc951b80} fill="var(--fill-0, #6E6E6E)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonFilledButton3() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <div className="box-border content-stretch flex items-center justify-between overflow-clip p-[7px] relative shrink-0 size-[32px]" data-name="Delete Icon">
        <div className="absolute aspect-[24/24] left-0 right-0 top-1/2 translate-y-[-50%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute h-[18px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[16px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
            <path d={svgPaths.p2248ae00} fill="var(--fill-0, #6E6E6E)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ModalHeader() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full" data-name="Modal Header">
      <ButtonFilledButton1 />
      <ButtonFilledButton2 />
      <ButtonFilledButton3 />
    </div>
  );
}

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
      <DropdownItem4 />
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
      <ModalHeader />
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

function ContentContainer1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Content Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
          <SwitchContainer />
          <ContentContainer />
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
      <ContentContainer1 />
    </div>
  );
}