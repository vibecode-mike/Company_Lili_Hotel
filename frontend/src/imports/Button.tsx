function Button() {
  return (
    <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">2</p>
    </div>
  );
}

export default function Button1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative size-full" data-name="Button">
      <Button />
    </div>
  );
}