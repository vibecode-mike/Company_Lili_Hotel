import svgPaths from "./svg-60x5mpq2qr";

function IcInfo() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="ic_info">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="ic_info">
          <path d={svgPaths.p2cd5ff00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Sorting() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Sorting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_8424_44)" id="Sorting">
          <g id="Vector"></g>
          <path d={svgPaths.p2cb9e040} fill="var(--fill-0, #0F6BEB)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8424_44">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function TableTitleAtomic() {
  return (
    <div className="relative size-full" data-name="Table/Title-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative size-full">
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
            <p className="leading-[1.5] whitespace-pre">最後更新時間</p>
          </div>
          <IcInfo />
          <Sorting />
        </div>
      </div>
    </div>
  );
}