function Paragraph({ title }: { title?: string }) {
  return (
    <div className="absolute h-[28.5px] left-[16px] overflow-clip top-[208px] w-[256px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[28.5px] left-0 not-italic text-[#383838] text-[19px] text-nowrap top-0 tracking-[-0.4453px] whitespace-pre">{title || '標題文字'}</p>
    </div>
  );
}

function Paragraph1({ content }: { content?: string }) {
  return (
    <div className="absolute h-[18px] left-[16px] overflow-clip top-[252.5px] w-[256px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">{content || '內文文字'}</p>
    </div>
  );
}

function Paragraph2({ price, currency }: { price?: string; currency?: string }) {
  return (
    <div className="absolute h-[36px] left-[16px] top-[286.5px] w-[256px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[36px] left-[256.81px] not-italic text-[#383838] text-[24px] text-right top-0 tracking-[0.0703px] translate-x-[-100%] w-[78px]">{currency === 'ntd' ? 'NT $' : '$'} {price || '0'}</p>
    </div>
  );
}

function Paragraph3({ button1 }: { button1?: string }) {
  return (
    <div className="h-[21px] overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[21px] left-[115px] not-italic text-[#383838] text-[14px] text-center text-nowrap top-0 tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">{button1 || '動作按鈕一'}</p>
    </div>
  );
}

function Container({ button1 }: { button1?: string }) {
  return (
    <div className="bg-white h-[47px] relative rounded-[12px] shrink-0 w-[256px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[47px] items-start pb-px pt-[13px] px-[13px] relative w-[256px]">
        <Paragraph3 button1={button1} />
      </div>
    </div>
  );
}

function Paragraph4({ button2 }: { button2?: string }) {
  return (
    <div className="h-[21px] overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[21px] left-[115px] not-italic text-[#383838] text-[14px] text-center text-nowrap top-0 tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">{button2 || '動作按鈕二'}</p>
    </div>
  );
}

function Container1({ button2 }: { button2?: string }) {
  return (
    <div className="bg-white h-[47px] relative rounded-[12px] shrink-0 w-[256px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[47px] items-start pb-px pt-[13px] px-[13px] relative w-[256px]">
        <Paragraph4 button2={button2} />
      </div>
    </div>
  );
}

function Container2({ button1, button2 }: { button1?: string; button2?: string }) {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[5px] h-[122px] items-start left-0 pb-0 pl-[16px] pr-0 pt-[7px] top-[338.5px] w-[288px]" data-name="Container">
      <Container button1={button1} />
      <Container1 button2={button2} />
    </div>
  );
}

function Paragraph5({ imageUrl }: { imageUrl?: string }) {
  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt="卡片圖片" 
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="absolute h-[28.5px] left-[106px] top-[81.75px] w-[76px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[28.5px] left-[38.5px] not-italic text-[#383838] text-[19px] text-center text-nowrap top-0 tracking-[-0.4453px] translate-x-[-50%] whitespace-pre">上傳圖片</p>
    </div>
  );
}

function Container3({ imageUrl }: { imageUrl?: string }) {
  return (
    <div className="absolute bg-[#edf0f8] h-[192px] left-0 overflow-clip top-0 w-[288px]" data-name="Container">
      <Paragraph5 imageUrl={imageUrl} />
    </div>
  );
}

function Container4({ cardData }: { cardData?: any }) {
  return (
    <div className="bg-white h-[460.5px] relative rounded-[12px] shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[460.5px] overflow-clip relative rounded-[inherit] w-full">
        <Paragraph title={cardData?.cardTitle} />
        <Paragraph1 content={cardData?.content} />
        <Paragraph2 price={cardData?.price} currency={cardData?.currency} />
        <Container2 button1={cardData?.button1} button2={cardData?.button2} />
        <Container3 imageUrl={cardData?.imageUrl} />
      </div>
    </div>
  );
}

function CardDescription({ triggerText }: { triggerText?: string }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Card Description">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center p-[16px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{triggerText || '文字訊息'}</p>
        </div>
      </div>
    </div>
  );
}

function TemplateTextOnly({ triggerText }: { triggerText?: string }) {
  return (
    <div className="bg-[#f6f9fd] relative rounded-[15px] shrink-0 w-full" data-name="Template#Text only">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-center overflow-clip relative rounded-[inherit] w-full">
        <CardDescription triggerText={triggerText} />
      </div>
    </div>
  );
}

interface TriggerTextPreviewProps {
  cardData?: {
    cardTitle?: string;
    content?: string;
    price?: string;
    currency?: string;
    button1?: string;
    button2?: string;
    imageUrl?: string;
  };
  triggerText?: string;
}

export default function TriggerTextPreview({ cardData, triggerText }: TriggerTextPreviewProps) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative size-full" data-name="Container">
      <Container4 cardData={cardData} />
      <TemplateTextOnly triggerText={triggerText} />
    </div>
  );
}