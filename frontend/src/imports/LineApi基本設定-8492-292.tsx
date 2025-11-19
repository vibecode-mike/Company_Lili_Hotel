import svgPaths from "./svg-2hugjs8p4q";

function Heading() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[36px] left-[448px] not-italic text-[#0f6beb] text-[24px] text-center text-nowrap top-0 tracking-[0.0703px] translate-x-[-50%] whitespace-pre">LINE 官方帳號 API 串接設定</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] left-[448.55px] not-italic text-[#4a5565] text-[16px] text-center text-nowrap top-[-0.5px] tracking-[-0.3125px] translate-x-[-50%] whitespace-pre">顧客可以使用 LINE 官方帳號與您聊天，群發訊息、會員功能模組已啟用！</p>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[68px] items-start relative shrink-0 w-full" data-name="Container">
      <Heading />
      <Paragraph />
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.pace200} id="Vector" stroke="var(--stroke-0, #0F6BEB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M9 12L11 14L15 10" id="Vector_2" stroke="var(--stroke-0, #0F6BEB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CardTitle() {
  return (
    <div className="h-[24px] relative shrink-0 w-[217.898px]" data-name="CardTitle">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative w-[217.898px]">
        <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#0f6beb] text-[16px] text-nowrap top-[-0.5px] tracking-[-0.3125px] whitespace-pre">您目前已與 LINE 官方帳號連結</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[24px] items-center left-[25px] top-[25px] w-[846px]" data-name="App">
      <Icon />
      <CardTitle />
    </div>
  );
}

function Text() {
  return (
    <div className="h-[28px] relative shrink-0 w-[10.703px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[28px] relative w-[10.703px]">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-0 not-italic text-[20px] text-nowrap text-white top-0 tracking-[-0.4492px] whitespace-pre">L</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-[#06c755] relative rounded-[1.67772e+07px] shrink-0 size-[48px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[48px]">
        <Text />
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#101828] text-[16px] text-nowrap top-[-0.5px] tracking-[-0.3125px] whitespace-pre">LINE 官方帳號</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#6a7282] text-[14px] top-[0.5px] tracking-[-0.1504px] w-[41px]">@ˇˇˇˇ</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="basis-0 grow h-[44px] min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[44px] items-start relative w-full">
        <Paragraph1 />
        <Paragraph2 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-green-100 h-[24px] relative rounded-[1.67772e+07px] shrink-0 w-[60px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative w-[60px]">
        <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[16px] left-[12px] not-italic text-[#008236] text-[12px] text-nowrap top-[5px] whitespace-pre">已連結</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex gap-[12px] h-[48px] items-center relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Container2 />
      <Container3 />
    </div>
  );
}

function App1() {
  return (
    <div className="bg-white h-[84px] relative rounded-[10px] shrink-0 w-full" data-name="App">
      <div aria-hidden="true" className="absolute border-2 border-[#0f6beb] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[84px] items-start pb-[2px] pt-[18px] px-[18px] relative w-full">
          <Container4 />
        </div>
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px] tracking-[-0.1504px] whitespace-pre">Channel ID</p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#101828] text-[16px] text-nowrap top-[-0.5px] tracking-[-0.3125px] whitespace-pre">ˇˇˇˇ</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-white h-[74px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#bedbff] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] h-[74px] items-start pb-px pt-[13px] px-[13px] relative w-full">
          <Paragraph3 />
          <Paragraph4 />
        </div>
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px] tracking-[-0.1504px] whitespace-pre">Channel Secret</p>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#101828] text-[16px] text-nowrap top-[-0.5px] tracking-[-0.3125px] whitespace-pre">••••••••</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-white h-[74px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#bedbff] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] h-[74px] items-start pb-px pt-[13px] px-[13px] relative w-full">
          <Paragraph5 />
          <Paragraph6 />
        </div>
      </div>
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px] tracking-[-0.1504px] whitespace-pre">Access Token</p>
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#101828] text-[16px] text-nowrap top-[-0.5px] tracking-[-0.3125px] whitespace-pre">••••••••</p>
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-white h-[74px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#bedbff] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] h-[74px] items-start pb-px pt-[13px] px-[13px] relative w-full">
          <Paragraph7 />
          <Paragraph8 />
        </div>
      </div>
    </div>
  );
}

function App2() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] h-[246px] items-start relative shrink-0 w-full" data-name="App">
      <Container5 />
      <Container6 />
      <Container7 />
    </div>
  );
}

function Button() {
  return (
    <div className="h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <p className="absolute font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] left-[395px] not-italic text-[#0f6beb] text-[14px] text-nowrap top-[8.5px] tracking-[-0.1504px] whitespace-pre">重新設定</p>
    </div>
  );
}

function CardContent() {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[16px] h-[422px] items-start left-px px-[24px] py-0 top-[79px] w-[894px]" data-name="CardContent">
      <App1 />
      <App2 />
      <Button />
    </div>
  );
}

function Card() {
  return (
    <div className="bg-blue-50 h-[502px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border border-[#bedbff] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <App />
      <CardContent />
    </div>
  );
}

function BoldText() {
  return (
    <div className="absolute content-stretch flex h-[16.5px] items-start left-0 top-[1.5px] w-[59.461px]" data-name="Bold Text">
      <p className="font-['Inter:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[20px] not-italic relative shrink-0 text-[#193cb8] text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre">💡 提醒：</p>
    </div>
  );
}

function Paragraph9() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <BoldText />
      <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[59.46px] not-italic text-[#193cb8] text-[14px] text-nowrap top-[0.5px] tracking-[-0.1504px] whitespace-pre">妥善保管您的 Channel Secret 和 Access Token，切勿公開分享。 這些資料將用於與 LINE 平台進行安全通訊。</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-blue-50 h-[54px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#bedbff] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[54px] items-start pb-px pt-[17px] px-[17px] relative w-full">
          <Paragraph9 />
        </div>
      </div>
    </div>
  );
}

function App3() {
  return (
    <div className="bg-[#f6f9fd] h-[784px] relative shrink-0 w-full" data-name="App">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] h-[784px] items-start pb-0 pt-[48px] px-[95px] relative w-full">
          <Container />
          <Card />
          <Container8 />
        </div>
      </div>
    </div>
  );
}

export default function LineApi() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="LINE API 基本設定">
      <App3 />
    </div>
  );
}