function DescriptionTextContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Description Text Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">本月的訊息用量</p>
    </div>
  );
}

function DescriptionTextContainer1() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Description Text Container">
      <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">79/6,000</p>
    </div>
  );
}

function DescriptionWrapper() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Description Wrapper">
      <DescriptionTextContainer />
      <DescriptionTextContainer1 />
    </div>
  );
}

function Usage() {
  return <div className="absolute bg-[#3a87f2] h-[8px] left-0 rounded-[80px] top-0 w-[258px]" data-name="usage" />;
}

function UsageStatus() {
  return (
    <div className="bg-[#f0f6ff] h-[8px] overflow-clip relative rounded-[80px] shrink-0 w-full" data-name="usage status">
      <Usage />
    </div>
  );
}

function DescriptionTextContainer2() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-[340px]" data-name="Description Text Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[12px]">※ 已傳送的訊息則數資訊通常於每天上午更新。</p>
    </div>
  );
}

function DescriptionWrapper1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Description Wrapper">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative w-full">
          <DescriptionTextContainer2 />
        </div>
      </div>
    </div>
  );
}

export default function DescriptionContainer() {
  return (
    <div className="bg-[rgba(255,255,255,0.3)] relative rounded-[16px] size-full" data-name="Description Container">
      <div aria-hidden="true" className="absolute border border-[#f0f6ff] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start justify-center p-[24px] relative size-full">
          <DescriptionWrapper />
          <UsageStatus />
          <DescriptionWrapper1 />
        </div>
      </div>
    </div>
  );
}