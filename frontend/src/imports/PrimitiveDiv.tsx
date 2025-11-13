// 優化後的 PrimitiveDiv 組件
// 原始文件：2353 行 → 優化後：~200 行
// 減少代碼量：91.5%

// 通用 Option 組件
interface OptionProps {
  label: string;
}

function Option({ label }: OptionProps) {
  return (
    <div className="h-0 relative shrink-0 w-full" data-name="Option">
      <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[normal] left-0 not-italic text-[14px] text-neutral-950 top-0 tracking-[-0.1504px] w-0">
        {label}
      </p>
    </div>
  );
}

// 月份下拉選單
function Dropdown() {
  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  return (
    <div className="basis-0 bg-white grow h-[33px] min-h-px min-w-px relative rounded-bl-[4px] rounded-tl-[4px] shrink-0" data-name="Dropdown">
      <div aria-hidden="true" className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[33px] items-start pb-px pr-[589px] relative w-full">
          {months.map((month, index) => (
            <Option key={`month-${index}`} label={month} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 年份下拉選單
function Dropdown1() {
  // 生成 1900-2024 年的選項
  const years = Array.from({ length: 125 }, (_, i) => `${1900 + i}年`);

  return (
    <div className="basis-0 bg-white grow h-[33px] min-h-px min-w-px relative shrink-0" data-name="Dropdown">
      <div aria-hidden="true" className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[33px] items-start pb-px pr-[589px] relative w-full">
          {years.map((year, index) => (
            <Option key={`year-${index}`} label={year} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 日期下拉選單
function Dropdown2() {
  // 生成 1-31 日的選項
  const days = Array.from({ length: 31 }, (_, i) => `${i + 1}日`);

  return (
    <div className="basis-0 bg-white grow h-[33px] min-h-px min-w-px relative rounded-br-[4px] rounded-tr-[4px] shrink-0" data-name="Dropdown">
      <div aria-hidden="true" className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[33px] items-start pb-px pr-[589px] relative w-full">
          {days.map((day, index) => (
            <Option key={`day-${index}`} label={day} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 主要日期選擇器容器
function Ea() {
  return (
    <div className="basis-0 flex flex-col grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="ea">
      <div className="flex gap-0 h-[33px] items-start relative w-full">
        <Dropdown />
        <Dropdown1 />
        <Dropdown2 />
      </div>
    </div>
  );
}

// 導出主組件
export default function PrimitiveDiv() {
  return (
    <div className="bg-white relative rounded-[8px] size-full" data-name="Primitive.div">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start pb-px pt-[13px] px-[13px] relative size-full">
          <Ea />
        </div>
      </div>
    </div>
  );
}
