function PushMessageAvatar() {
  return (
    <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full" data-name="Push Message Avatar">
      <p className="font-['Noto_Sans_TC:Medium',_sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[36px] text-nowrap whitespace-pre">100%</p>
    </div>
  );
}

function Avatar() {
  return (
    <div className="relative rounded-[158.824px] shrink-0 size-[158.824px]" data-name="Avatar">
      <div className="content-stretch flex flex-col items-center overflow-clip relative rounded-[inherit] size-[158.824px]">
        <PushMessageAvatar />
      </div>
      <div aria-hidden="true" className="absolute border-4 border-[#00a81c] border-solid inset-0 pointer-events-none rounded-[158.824px]" />
    </div>
  );
}

export default function PushMessage() {
  return (
    <div className="content-stretch flex gap-[40px] items-center relative size-full" data-name="Push Message">
      <Avatar />
      <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">預計發送好友人數：60人</p>
    </div>
  );
}