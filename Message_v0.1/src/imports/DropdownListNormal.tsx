function Frame() {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_0.4px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-[8px] relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
            <p className="leading-[1.5]">正式發佈</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_0.4px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-[8px] relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
            <p className="leading-[1.5]">發佈測試訊息</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DropdownListNormal() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[8px] shadow-[0px_0px_4px_0px_rgba(168,168,168,0.25),0px_1px_4px_0px_rgba(221,221,221,0.25)] size-full" data-name="Dropdown List#Normal">
      <Frame />
      <Frame1 />
    </div>
  );
}