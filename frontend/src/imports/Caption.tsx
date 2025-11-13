export default function Caption() {
  return (
    <div className="bg-[rgba(246,249,253,0.7)] relative rounded-[28px] size-full" data-name="caption">
      <div aria-hidden="true" className="absolute border-[#e8e8e8] border-[0.4px] border-solid inset-0 pointer-events-none rounded-[28px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[2px] relative size-full">
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap whitespace-pre">2025/10/08（三）</p>
        </div>
      </div>
    </div>
  );
}