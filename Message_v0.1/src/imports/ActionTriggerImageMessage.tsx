import svgPaths from "./svg-ritoniwq08";

function CheckBox() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_32_1178)" id="Check box">
          <g id="Vector"></g>
          <path d={svgPaths.pcd62e00} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_32_1178">
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
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">觸發圖片</p>
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
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] relative shrink-0" data-name="Modal/Title&Content">
      <ActionButtonIconContainer />
      <ModalTitleContent />
      <ActionButtonInfoIcon />
    </div>
  );
}

function Add() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Add">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_32_1945)" id="Add">
          <g id="Vector"></g>
          <path d={svgPaths.p3a3793c0} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_32_1945">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Tag() {
  return (
    <div className="basis-0 grow min-h-px min-w-[32px] relative rounded-[8px] shrink-0 w-full" data-name="Tag">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-inherit p-[4px] relative size-full">
          <Add />
          <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#0f6beb] text-[16px] text-nowrap whitespace-pre">選擇圖片</p>
        </div>
      </div>
    </div>
  );
}

function UploadNormal() {
  return (
    <div className="bg-[#f6f9fd] box-border content-stretch flex flex-col gap-[4px] h-[120px] items-center justify-center min-h-[120px] p-[8px] relative rounded-[8px] shrink-0 w-[558px]" data-name="Upload#Normal">
      <div aria-hidden="true" className="absolute border-2 border-[#c3dffd] border-dashed inset-[-1px] pointer-events-none rounded-[9px]" />
      <Tag />
    </div>
  );
}

function DropdownOptions() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Options">
      <UploadNormal />
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[0px] w-[410px]">
        <ul className="list-disc">
          <li className="mb-0 ms-[calc(1.5*1*var(--list-marker-font-size,0))]">
            <span className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[#6e6e6e] text-[14px]">限制格式為 JPG, JPEG, PNG</span>
          </li>
          <li className="ms-[calc(1.5*1*var(--list-marker-font-size,0))]">
            <span className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[14px]">每張圖片大小不超過 1 MB</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function ActionTriggerImageMessage() {
  return (
    <div className="content-stretch flex items-start relative size-full" data-name="Action#Trigger Image Message">
      <ModalTitleContent1 />
      <DropdownOptions />
    </div>
  );
}