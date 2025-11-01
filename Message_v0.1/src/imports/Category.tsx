import svgPaths from "./svg-20k1bhrsry";

function Button() {
  return (
    <div className="aspect-[48/48] content-stretch flex gap-[4px] h-full items-center justify-center relative shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">1</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="aspect-[48/48] content-stretch flex gap-[4px] h-full items-center justify-center relative shrink-0" data-name="Button">
      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">2</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="aspect-[48/48] content-stretch flex gap-[4px] h-full items-center justify-center relative shrink-0" data-name="Button">
      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">3</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="aspect-[48/48] content-stretch flex gap-[4px] h-full items-center justify-center relative shrink-0" data-name="Button">
      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">4</p>
      </div>
    </div>
  );
}

function ButtonFilledButton() {
  return (
    <div className="box-border content-stretch flex h-full items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button/Filled Button">
      <div className="content-stretch flex gap-[2px] items-center justify-center min-w-[32px] relative rounded-[8px] shrink-0" data-name="Tag">
        <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Add">
          <div className="absolute inset-0" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Vector"></g>
            </svg>
          </div>
          <div className="absolute inset-[20.833%]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
              <path d={svgPaths.pb4c0180} fill="var(--fill-0, #A8A8A8)" id="Vector" />
            </svg>
          </div>
        </div>
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">新增訊息內容</p>
      </div>
    </div>
  );
}

export default function Category() {
  return (
    <div className="content-stretch flex items-center relative size-full" data-name="Category">
      <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center self-stretch">
        <Button />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <Button1 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <Button2 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <Button3 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <ButtonFilledButton />
      </div>
    </div>
  );
}