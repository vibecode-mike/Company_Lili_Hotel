function ActiveButtonContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full" data-name="Active Button Container">
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">編輯</p>
    </div>
  );
}

export default function SwitchButtonActive() {
  return (
    <div className="bg-white relative rounded-[8px] size-full" data-name="Switch Button#Active">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center p-[8px] relative size-full">
          <ActiveButtonContainer />
        </div>
      </div>
    </div>
  );
}