function PrimitiveH() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[462px]" data-name="Primitive.h2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-full relative w-[462px]">
        <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[28px] left-0 not-italic text-[18px] text-neutral-950 text-nowrap top-0 tracking-[-0.4395px] whitespace-pre">重新設定</p>
      </div>
    </div>
  );
}

function PrimitiveP() {
  return (
    <div className="h-[20px] relative shrink-0 w-[462px]" data-name="Primitive.p">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative w-[462px]">
        <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#717182] text-[14px] text-nowrap top-[0.5px] tracking-[-0.1504px] whitespace-pre">確定要解除與 @LINE 的連結嗎？解除後需要重新設定所有資料。</p>
      </div>
    </div>
  );
}

function AlertDialogHeader() {
  return (
    <div className="[grid-area:1_/_1] content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="AlertDialogHeader">
      <PrimitiveH />
      <PrimitiveP />
    </div>
  );
}

function PrimitiveButton() {
  return (
    <div className="bg-white h-[36px] relative rounded-[8px] shrink-0 w-[62px]" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[36px] items-center justify-center px-[17px] py-[9px] relative w-[62px]">
        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-neutral-950 text-nowrap tracking-[-0.1504px] whitespace-pre">取消</p>
      </div>
    </div>
  );
}

function PrimitiveButton1() {
  return (
    <div className="bg-[#e7000b] h-[36px] relative rounded-[8px] shrink-0 w-[88px]" data-name="Primitive.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[36px] items-center justify-center px-[16px] py-[8px] relative w-[88px]">
        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap text-white tracking-[-0.1504px] whitespace-pre">確認解除</p>
      </div>
    </div>
  );
}

function AlertDialogFooter() {
  return (
    <div className="[grid-area:2_/_1] content-stretch flex gap-[8px] items-start justify-end relative shrink-0" data-name="AlertDialogFooter">
      <PrimitiveButton />
      <PrimitiveButton1 />
    </div>
  );
}

export default function PrimitiveDiv() {
  return (
    <div className="bg-white relative rounded-[10px] size-full" data-name="Primitive.div">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
      <div className="size-full">
        <div className="box-border gap-[16px] grid grid-cols-[repeat(1,_minmax(0px,_1fr))] grid-rows-[56px_minmax(0px,_1fr)] p-[25px] relative size-full">
          <AlertDialogHeader />
          <AlertDialogFooter />
        </div>
      </div>
    </div>
  );
}