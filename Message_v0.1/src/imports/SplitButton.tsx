import svgPaths from "./svg-qkkkp98ojr";

function SplitButtonContent() {
  return (
    <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-bl-[16px] rounded-tl-[16px] shrink-0" data-name="Split Button#Content">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">發佈</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Arrow">
          <path d={svgPaths.p18c88e00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function SplitButtonAction() {
  return (
    <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] px-[4px] py-[8px] relative rounded-br-[16px] rounded-tr-[16px] shrink-0" data-name="Split Button#Action">
      <Arrow />
    </div>
  );
}

export default function SplitButton() {
  return (
    <div className="content-stretch flex items-center relative size-full" data-name="Split Button">
      <SplitButtonContent />
      <SplitButtonAction />
    </div>
  );
}