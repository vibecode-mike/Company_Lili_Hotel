function DescriptionTextContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-[340px]" data-name="Description Text Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[12px]">已傳送的訊息則數資訊通常於每天上午更新。</p>
    </div>
  );
}

export default function DescriptionWrapper() {
  return (
    <div className="relative size-full" data-name="Description Wrapper">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative size-full">
          <DescriptionTextContainer />
        </div>
      </div>
    </div>
  );
}