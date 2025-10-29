import svgPaths from "./svg-bb67wsv7at";

function Add() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Add">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_25_1675)" id="Add">
          <g id="Vector"></g>
          <path d={svgPaths.p3a3793c0} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_25_1675">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function Tag() {
  return (
    <div className="relative rounded-[8px] size-full" data-name="Tag">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-inherit p-[4px] relative size-full">
          <Add />
          <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#0f6beb] text-[16px] text-nowrap whitespace-pre">選擇圖片</p>
        </div>
      </div>
    </div>
  );
}