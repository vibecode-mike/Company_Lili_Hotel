function Paragraph() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16.938px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18px] relative w-[16.938px]">
        <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">OA</p>
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

function Paragraph1() {
  return (
    <div className="absolute h-[28.5px] left-[16px] overflow-clip top-[208px] w-[256px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[28.5px] left-0 not-italic text-[#383838] text-[19px] text-nowrap top-0 tracking-[-0.4453px] whitespace-pre">標題文字</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[18px] left-[16px] overflow-clip top-[252.5px] w-[256px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">內文文字</p>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute h-[36px] left-[16px] top-[286.5px] w-[256px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[36px] left-[256.81px] not-italic text-[#383838] text-[24px] text-right top-0 tracking-[0.0703px] translate-x-[-100%] w-[78px]">NT $ 0</p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[21px] overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[21px] left-[115px] not-italic text-[#383838] text-[14px] text-center text-nowrap top-0 tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">動作按鈕一</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-white h-[47px] relative rounded-[12px] shrink-0 w-[256px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[47px] items-start pb-px pt-[13px] px-[13px] relative w-[256px]">
        <Paragraph4 />
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[21px] overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[21px] left-[115px] not-italic text-[#383838] text-[14px] text-center text-nowrap top-0 tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">動作按鈕二</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-white h-[47px] relative rounded-[12px] shrink-0 w-[256px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[47px] items-start pb-px pt-[13px] px-[13px] relative w-[256px]">
        <Paragraph5 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[5px] h-[122px] items-start left-0 pb-0 pl-[16px] pr-0 pt-[7px] top-[338.5px] w-[288px]" data-name="Container">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="absolute h-[28.5px] left-[106px] top-[81.75px] w-[76px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[28.5px] left-[38.5px] not-italic text-[#383838] text-[19px] text-center text-nowrap top-0 tracking-[-0.4453px] translate-x-[-50%] whitespace-pre">選擇圖片</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute bg-[#edf0f8] h-[192px] left-0 overflow-clip top-0 w-[288px]" data-name="Container">
      <Paragraph6 />
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-white h-[460.5px] relative rounded-[12px] shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[460.5px] overflow-clip relative rounded-[inherit] w-full">
        <Paragraph1 />
        <Paragraph2 />
        <Paragraph3 />
        <Container3 />
        <Container4 />
      </div>
    </div>
  );
}

function CardDescription({ text }: { text?: string }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Card Description">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[16px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{text || '文字訊息'}</p>
        </div>
      </div>
    </div>
  );
}

function TemplateTextOnly({ text }: { text?: string }) {
  return (
    <div className="bg-[#f6f9fd] relative rounded-[15px] shrink-0 w-full" data-name="Template#Text only">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-center overflow-clip relative rounded-[inherit] w-full">
        <CardDescription text={text} />
      </div>
    </div>
  );
}

function Container6({ button1Text, button2Text }: { button1Text?: string, button2Text?: string }) {
  return (
    <div className="relative shrink-0 w-[288px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip relative rounded-[inherit] w-[288px]">
        <Container5 />
        {button1Text && <TemplateTextOnly text={button1Text} />}
        {button2Text && <TemplateTextOnly text={button2Text} />}
      </div>
    </div>
  );
}

export default function Container7({ button1Text, button2Text }: { button1Text?: string, button2Text?: string }) {
  return (
    <div className="bg-gradient-to-b from-[#a5d8ff] relative rounded-[20px] size-full to-[#d0ebff]" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[20px] items-start overflow-y-auto overflow-x-hidden pb-[24px] pl-[24px] pr-0 pt-[24px] relative h-full w-full">
          <Container />
          <Container6 button1Text={button1Text} button2Text={button2Text} />
        </div>
      </div>
    </div>
  );
}