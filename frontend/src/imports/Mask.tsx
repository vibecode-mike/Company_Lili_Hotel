import svgPaths from "./svg-ukuy34kve3";
import imgImageHero from "figma:asset/68b289cb927cef11d11501fd420bb560ad25c667.png";

function Frame1() {
  return <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-end min-h-px min-w-px shrink-0" />;
}

function Close() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Close">
          <g clipPath="url(#clip0_8411_517)">
            <rect fill="var(--fill-0, #F5F5F5)" height="32" rx="16" width="32" />
            <g id="Vector"></g>
            <path d={svgPaths.p21a60700} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_8411_517">
            <rect fill="white" height="32" rx="16" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function HeaderContent() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full" data-name="Header Content">
      <Frame1 />
      <Close />
    </div>
  );
}

function ImageHero() {
  return (
    <div className="h-[180px] relative shrink-0 w-full" data-name="Image (Hero)">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImageHero} />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[16.2px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[16.2px] left-0 text-[10.8px] text-black text-nowrap top-0 whitespace-pre">標題文字</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[10.8px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[10.8px] left-0 text-[#666666] text-[7.2px] text-nowrap top-0 whitespace-pre">內文文字說明</p>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[51px] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[4.8px] h-[51px] items-start pb-0 pt-[9.6px] px-[9.6px] relative w-full">
          <Paragraph />
          <Paragraph1 />
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-white h-[231px] relative rounded-[6px] shadow-[0px_12px_15px_-3px_rgba(0,0,0,0.1),0px_4.8px_6px_-3.6px_rgba(0,0,0,0.1)] shrink-0 w-[180px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[231px] items-start overflow-clip relative rounded-[inherit] w-[180px]">
        <ImageHero />
        <Container />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-gradient-to-b box-border content-stretch flex from-[#a5d8ff] gap-[12px] h-[304.2px] items-center justify-center overflow-clip p-[12px] relative rounded-[20px] shrink-0 to-[#d0ebff] w-[276px]" data-name="Container">
      <Container1 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[2px] items-center justify-center px-[2px] py-0 relative w-full">
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap">
            <p className="leading-[1.5] whitespace-pre">
              1<span className="text-[#383838]">/1</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
      <Container2 />
      <Frame2 />
    </div>
  );
}

function TableListAtomic() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table/List-atomic">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center px-[12px] py-0 relative w-full">
          <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[0px] text-center">
            <p className="leading-[1.5] text-[20px]">雙人遊行 獨家優惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠惠</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalTitleContent() {
  return (
    <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">互動標籤</p>
      </div>
    </div>
  );
}

function Tag() {
  return (
    <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">互動標籤</p>
    </div>
  );
}

function TextAreaContainer() {
  return (
    <div className="basis-0 content-center flex flex-wrap gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Text Area Container">
      {[...Array(20).keys()].map((_, i) => (
        <Tag key={i} />
      ))}
    </div>
  );
}

function TemplateTypeRow() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Template Type Row">
      <ModalTitleContent />
      <TextAreaContainer />
    </div>
  );
}

function ModalTitleContent1() {
  return (
    <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">平台</p>
      </div>
    </div>
  );
}

function TableListAtomic1() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
        <p className="leading-[24px] whitespace-pre">LINE</p>
      </div>
    </div>
  );
}

function TemplateTypeRow1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Template Type Row">
      <ModalTitleContent1 />
      <TableListAtomic1 />
    </div>
  );
}

function ModalTitleContent2() {
  return (
    <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">狀態</p>
      </div>
    </div>
  );
}

function CheckSuccess() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Check/Success">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_8411_773)" id="Check/Success">
          <g id="Vector"></g>
          <path d={svgPaths.p36cd5f00} fill="var(--fill-0, #00C853)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8411_773">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TableListAtomic2() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已排程</p>
      </div>
      <CheckSuccess />
    </div>
  );
}

function TemplateTypeRow2() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Template Type Row">
      <ModalTitleContent2 />
      <TableListAtomic2 />
    </div>
  );
}

function ModalTitleContent3() {
  return (
    <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">發送人數</p>
      </div>
    </div>
  );
}

function TableListAtomic3() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
        <p className="leading-[24px] whitespace-pre">1000</p>
      </div>
    </div>
  );
}

function TemplateTypeRow3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Template Type Row">
      <ModalTitleContent3 />
      <TableListAtomic3 />
    </div>
  );
}

function ModalTitleContent4() {
  return (
    <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">點擊次數</p>
      </div>
    </div>
  );
}

function TableListAtomic4() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
        <p className="leading-[24px] whitespace-pre">800</p>
      </div>
    </div>
  );
}

function TemplateTypeRow4() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Template Type Row">
      <ModalTitleContent4 />
      <TableListAtomic4 />
    </div>
  );
}

function ModalTitleContent5() {
  return (
    <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">已開啟次數</p>
      </div>
    </div>
  );
}

function TableListAtomic5() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#383838] text-[14px] text-nowrap tracking-[0.22px]">
        <p className="leading-[24px] whitespace-pre">980</p>
      </div>
    </div>
  );
}

function TemplateTypeRow5() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Template Type Row">
      <ModalTitleContent5 />
      <TableListAtomic5 />
    </div>
  );
}

function ModalTitleContent6() {
  return (
    <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">發送時間</p>
      </div>
    </div>
  );
}

function TableListAtomic6() {
  return (
    <div className="box-border content-stretch flex items-center px-[12px] py-0 relative self-stretch shrink-0" data-name="Table/List-atomic">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">2025-10-02 22:47</p>
      </div>
    </div>
  );
}

function TemplateTypeRow6() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Template Type Row">
      <ModalTitleContent6 />
      <TableListAtomic6 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
      <TemplateTypeRow />
      <TemplateTypeRow1 />
      <TemplateTypeRow2 />
      <TemplateTypeRow3 />
      <TemplateTypeRow4 />
      <TemplateTypeRow5 />
      <TemplateTypeRow6 />
    </div>
  );
}

function Drawer() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col gap-[32px] h-[1303px] items-start p-[32px] right-0 top-0 w-[344px]" data-name="Drawer">
      <HeaderContent />
      <Frame3 />
      <TableListAtomic />
      <Frame />
    </div>
  );
}

export default function Mask() {
  return (
    <div className="bg-[rgba(56,56,56,0.3)] relative size-full" data-name="Mask">
      <Drawer />
    </div>
  );
}