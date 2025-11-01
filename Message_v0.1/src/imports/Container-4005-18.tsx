function Paragraph() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16.938px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18px] relative w-[16.938px]">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">OA</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-white relative rounded-[3.35544e+07px] shrink-0 size-[45px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[45px]">
        <Paragraph />
      </div>
    </div>
  );
}

function CardDescription() {
  return (
    <div className="relative shrink-0 w-full" data-name="Card Description">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[16px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">文字訊息</p>
        </div>
      </div>
    </div>
  );
}

function ButtonFilledButton() {
  return (
    <div className="bg-white relative rounded-[15px] shrink-0 w-full" data-name="Button/Filled Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex items-center justify-center p-[15px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[18px] text-center">動作按鈕一</p>
        </div>
      </div>
    </div>
  );
}

function ButtonFilledButton1() {
  return (
    <div className="bg-white relative rounded-[15px] shrink-0 w-full" data-name="Button/Filled Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex items-center justify-center p-[15px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[18px] text-center">動作按鈕二</p>
        </div>
      </div>
    </div>
  );
}

function CardActions() {
  return (
    <div className="relative shrink-0 w-full" data-name="Card Actions">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[6px] items-start justify-center p-[9px] relative w-full">
          <ButtonFilledButton />
          <ButtonFilledButton1 />
        </div>
      </div>
    </div>
  );
}

function TemplateText2ActionButton() {
  return (
    <div className="bg-[#f6f9fd] relative rounded-[15px] shrink-0 w-[288px]" data-name="Template#Text＋2 Action Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-center overflow-clip relative rounded-[inherit] w-[288px]">
        <CardDescription />
        <CardActions />
      </div>
    </div>
  );
}

export default function Container1() {
  return (
    <div className="bg-gradient-to-b from-[#a5d8ff] relative rounded-[20px] size-full to-[#d0ebff]" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[20px] items-start overflow-clip pb-0 pl-[24px] pr-0 pt-[24px] relative size-full">
          <Container />
          <TemplateText2ActionButton />
        </div>
      </div>
    </div>
  );
}