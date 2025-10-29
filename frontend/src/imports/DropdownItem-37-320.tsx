function Frame() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">輸入訊息</p>
    </div>
  );
}

function TextArea() {
  return (
    <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col justify-center min-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
          <Frame />
        </div>
      </div>
    </div>
  );
}

function Digit() {
  return (
    <div className="h-[18px] relative shrink-0 w-[25px]" data-name="Digit">
      <div className="absolute flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal inset-0 justify-center leading-[0] text-[#6e6e6e] text-[12px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">
          0<span className="text-[#383838]">/32</span>
        </p>
      </div>
    </div>
  );
}

function DropdownItem() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end relative shrink-0 w-full" data-name="Dropdown Item">
      <Digit />
    </div>
  );
}

export default function DropdownItem1() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative size-full" data-name="Dropdown Item">
      <TextArea />
      <DropdownItem />
    </div>
  );
}