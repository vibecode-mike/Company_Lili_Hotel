import svgPaths from "./svg-0m1jkx8owp";

function Arrow() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <g clipPath="url(#clip0_8411_1185)">
            <g id="Vector"></g>
            <path d={svgPaths.p1fb6d4c0} fill="var(--fill-0, #E8E8E8)" id="Vector_2" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_8411_1185">
            <rect fill="white" height="16" rx="8" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Arrow1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <g clipPath="url(#clip0_8411_1181)">
            <g id="Vector"></g>
            <path d={svgPaths.p30296c80} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_8411_1181">
            <rect fill="white" height="16" rx="8" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[2px] items-center justify-center px-[2px] py-0 relative size-full">
          <Arrow />
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap">
            <p className="leading-[1.5] whitespace-pre">
              1<span className="text-[#383838]">/9</span>
            </p>
          </div>
          <Arrow1 />
        </div>
      </div>
    </div>
  );
}