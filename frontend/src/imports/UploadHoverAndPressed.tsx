import svgPaths from "./svg-o7txqsmr58";

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
    <div className="h-[104px] min-w-[32px] relative rounded-[8px] shrink-0 w-full" data-name="Tag">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[2px] h-[104px] items-center justify-center min-w-inherit p-[4px] relative w-full">
          <Add />
          <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#0f6beb] text-[16px] text-nowrap whitespace-pre">上傳圖片</p>
        </div>
      </div>
    </div>
  );
}

export default function UploadHoverAndPressed() {
  return (
    <div className="bg-[#e1ebf9] relative rounded-[8px] size-full" data-name="Upload#Hover and Pressed">
      <div aria-hidden="true" className="absolute border-2 border-[#7a9fff] border-dashed inset-[-1px] pointer-events-none rounded-[9px]" />
      <div className="flex flex-col items-center justify-center min-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-center justify-center min-h-inherit p-[8px] relative size-full">
          <Tag />
        </div>
      </div>
    </div>
  );
}