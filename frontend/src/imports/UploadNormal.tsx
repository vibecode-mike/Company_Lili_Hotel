import svgPaths from "./svg-wb8nmg8j6i";

function Add() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Add">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_25_1611)" id="Add">
          <g id="Vector"></g>
          <path d={svgPaths.p3a3793c0} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_25_1611">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Tag() {
  return (
    <div className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <Add />
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px]">上傳圖片</p>
    </div>
  );
}

export default function UploadNormal() {
  return (
    <div className="bg-[#f6f9fd] relative rounded-[8px] size-full" data-name="Upload#Normal">
      <div aria-hidden="true" className="absolute border-2 border-[#c3dffd] border-dashed inset-[-1px] pointer-events-none rounded-[9px]" />
      <div className="flex flex-col items-center justify-center min-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-center justify-center min-h-inherit p-[8px] relative size-full">
          <Tag />
        </div>
      </div>
    </div>
  );
}