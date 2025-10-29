import svgPaths from "./svg-1jj4fky3vl";

function Close() {
  return (
    <div className="absolute left-[208px] size-[24px] top-[8px]" data-name="Close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Close">
          <g clipPath="url(#clip0_4001_94)">
            <rect fill="var(--fill-0, #C4C4C4)" fillOpacity="0.6" height="24" rx="12" width="24" />
            <g id="Vector"></g>
            <path d={svgPaths.p329aa280} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_4001_94">
            <rect fill="white" height="24" rx="12" width="24" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function CardImage() {
  return (
    <div className="bg-[#edf0f8] content-stretch flex items-center justify-center relative rounded-[15px] size-full" data-name="Card Image">
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[24px] text-center text-nowrap whitespace-pre">上傳圖片</p>
      <Close />
    </div>
  );
}