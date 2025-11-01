function Tag() {
  return (
    <div className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px] text-center">＋ 新增標籤</p>
    </div>
  );
}

export default function TextArea() {
  return (
    <div className="bg-white relative rounded-[8px] size-full" data-name="Text area">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col justify-center max-w-inherit min-w-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center max-w-inherit min-w-inherit p-[8px] relative size-full">
          <Tag />
        </div>
      </div>
    </div>
  );
}