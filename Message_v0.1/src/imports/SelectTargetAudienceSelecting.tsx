import svgPaths from "./svg-b62f9l13m2";

function RadioButton() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Radio Button">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g clipPath="url(#clip0_23_1380)" id="Radio Button">
          <g id="Vector"></g>
          <path d={svgPaths.p26f9ce00} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
          <path d={svgPaths.pee04100} fill="var(--fill-0, #0F6BEB)" id="Vector_3" />
        </g>
        <defs>
          <clipPath id="clip0_23_1380">
            <rect fill="white" height="24" width="24" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function ModalTitleContent() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">篩選目標對象</p>
      </div>
    </div>
  );
}

function Option() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Option">
      <RadioButton />
      <ModalTitleContent />
    </div>
  );
}

function RadioButton1() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Radio Button">
      <Option />
    </div>
  );
}

function Close() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_23_1462)" id="Close">
          <g id="Vector"></g>
          <path d={svgPaths.p1f281200} fill="var(--fill-0, #A8A8A8)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_23_1462">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Tag() {
  return (
    <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px]">中秋</p>
      <Close />
    </div>
  );
}

function Tag1() {
  return (
    <div className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px] text-center">＋ 新增標籤</p>
    </div>
  );
}

function TextArea() {
  return (
    <div className="bg-white max-w-[720px] min-w-[720px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col justify-center max-w-inherit min-w-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center max-w-inherit min-w-inherit p-[8px] relative w-full">
          <Tag />
          <Tag1 />
        </div>
      </div>
    </div>
  );
}

export default function SelectTargetAudienceSelecting() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative size-full" data-name="Select#Target Audience#Selecting">
      <RadioButton1 />
      <TextArea />
    </div>
  );
}