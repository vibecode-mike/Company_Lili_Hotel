import svgPaths from "./svg-hjyt6boy9r";

function IconTextButtonSecondary() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[32px] shrink-0" data-name="Icon+Text Button*Secondary">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">編輯</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-end min-h-px min-w-px relative shrink-0">
      <IconTextButtonSecondary />
    </div>
  );
}

function Close() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Close">
          <g clipPath="url(#clip0_8413_1647)">
            <rect fill="var(--fill-0, #F5F5F5)" height="32" rx="16" width="32" />
            <g id="Vector"></g>
            <path d={svgPaths.p21a60700} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_8413_1647">
            <rect fill="white" height="32" rx="16" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function HeaderContent() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative size-full" data-name="Header Content">
      <Frame />
      <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
        <div className="absolute inset-[-3.33%_-0.4px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
            <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
          </svg>
        </div>
      </div>
      <Close />
    </div>
  );
}