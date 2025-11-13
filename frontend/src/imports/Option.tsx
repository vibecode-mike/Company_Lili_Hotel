import svgPaths from "./svg-2glqvsta4l";

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

export default function Option() {
  return (
    <div className="bg-white relative rounded-[8px] size-full" data-name="Option">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col justify-center min-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[8px] relative size-full">
          <Frame />
        </div>
      </div>
    </div>
  );
}