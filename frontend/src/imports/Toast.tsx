import svgPaths from "./svg-178qjp7k4w";

function Frame3468760() {
  return (
    <div className="content-center flex flex-wrap gap-[8px] items-center relative shrink-0">
      <div className="overflow-clip relative shrink-0 size-[16.667px]" data-name="Check circle">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[8.333%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
            <path d={svgPaths.p3f8b2200} fill="var(--fill-0, #00C853)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">儲存成功</p>
    </div>
  );
}

export default function Toast() {
  return (
    <div className="bg-[#383838] relative rounded-[8px] shadow-[0px_0px_4px_0px_rgba(168,168,168,0.25),0px_1px_4px_0px_rgba(221,221,221,0.25)] size-full" data-name="Toast">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-center flex flex-wrap gap-0 items-center px-[8px] py-[12px] relative size-full">
          <Frame3468760 />
        </div>
      </div>
    </div>
  );
}