import svgPaths from "./svg-5jcpb7l403";
import imgApp from "figma:asset/6b82043ca68632e4603c63153aae4828cae95e1b.png";

function Heading() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[36px] left-[448.89px] text-[#0f6beb] text-[24px] text-center text-nowrap top-[-1.6px] translate-x-[-50%] whitespace-pre">LINE 官方帳號 API 串接設定</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] left-[448.37px] text-[#4a5565] text-[16px] text-center text-nowrap top-[-1.4px] translate-x-[-50%] whitespace-pre">顧客可以使用 LINE 官方帳號與您聊天，群發訊息、會員功能模組已啟用！</p>
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

function Container1() {
  return (
    <div className="bg-[#0f6beb] relative rounded-[2.68435e+07px] shrink-0 size-[32px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[32px]">
        <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">1</p>
      </div>
    </div>
  );
}

function CardTitle() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="CardTitle">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[28px] left-0 text-[18px] text-neutral-950 text-nowrap top-[-0.6px] whitespace-pre">設定 Channel ID</p>
    </div>
  );
}

function CardDescription() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="CardDescription">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#717182] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">從 Basic Settings 取得</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="basis-0 grow h-[52px] min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[52px] items-start relative w-full">
        <CardTitle />
        <CardDescription />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[52px] relative shrink-0 w-[203.088px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] h-[52px] items-center relative w-[203.088px]">
        <Container1 />
        <Container2 />
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p243b8b80} id="Vector" stroke="var(--stroke-0, #6A7282)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function App() {
  return (
    <div className="absolute content-stretch flex h-[52px] items-center justify-between left-[24px] top-[16px] w-[844.8px]" data-name="App">
      <Container3 />
      <Icon />
    </div>
  );
}

function CardHeader() {
  return (
    <div className="absolute h-[90px] left-0 rounded-tl-[14px] rounded-tr-[14px] top-0 w-[892.8px]" data-name="CardHeader">
      <App />
    </div>
  );
}

function PrimitiveButton() {
  return (
    <div className="h-[90px] relative shrink-0 w-[892.8px]" data-name="Primitive.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[90px] relative w-[892.8px]">
        <CardHeader />
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[93.2px] items-start left-0 p-[1.6px] rounded-[14px] top-0 w-[896px]" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.6px] border-gray-200 border-solid inset-0 pointer-events-none rounded-[14px]" />
      <PrimitiveButton />
    </div>
  );
}

function Container4() {
  return (
    <div className="bg-[#0f6beb] relative rounded-[2.68435e+07px] shrink-0 size-[32px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[32px]">
        <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">2</p>
      </div>
    </div>
  );
}

function CardTitle1() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="CardTitle">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[28px] left-0 text-[18px] text-neutral-950 text-nowrap top-[-0.6px] whitespace-pre">設定 Channel Secret</p>
    </div>
  );
}

function CardDescription1() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="CardDescription">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#717182] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">從 Basic Settings 取得</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="basis-0 grow h-[52px] min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[52px] items-start relative w-full">
        <CardTitle1 />
        <CardDescription1 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[52px] relative shrink-0 w-[211.063px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] h-[52px] items-center relative w-[211.063px]">
        <Container4 />
        <Container5 />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p243b8b80} id="Vector" stroke="var(--stroke-0, #6A7282)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function App1() {
  return (
    <div className="absolute content-stretch flex h-[52px] items-center justify-between left-[24px] top-[16px] w-[844.8px]" data-name="App">
      <Container6 />
      <Icon1 />
    </div>
  );
}

function CardHeader1() {
  return (
    <div className="absolute h-[90px] left-0 rounded-tl-[14px] rounded-tr-[14px] top-0 w-[892.8px]" data-name="CardHeader">
      <App1 />
    </div>
  );
}

function PrimitiveButton1() {
  return (
    <div className="h-[90px] relative shrink-0 w-[892.8px]" data-name="Primitive.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[90px] relative w-[892.8px]">
        <CardHeader1 />
      </div>
    </div>
  );
}

function Card1() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[93.2px] items-start left-0 p-[1.6px] rounded-[14px] top-[109.2px] w-[896px]" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.6px] border-gray-200 border-solid inset-0 pointer-events-none rounded-[14px]" />
      <PrimitiveButton1 />
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-[#0f6beb] relative rounded-[2.68435e+07px] shrink-0 size-[32px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[32px]">
        <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">3</p>
      </div>
    </div>
  );
}

function CardTitle2() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="CardTitle">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[28px] left-0 text-[18px] text-neutral-950 text-nowrap top-[-0.6px] whitespace-pre">設定 Channel Access Token</p>
    </div>
  );
}

function CardDescription2() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="CardDescription">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#717182] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">從 Messaging API 分頁取得</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="basis-0 grow h-[52px] min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[52px] items-start relative w-full">
        <CardTitle2 />
        <CardDescription2 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[52px] relative shrink-0 w-[269.75px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] h-[52px] items-center relative w-[269.75px]">
        <Container7 />
        <Container8 />
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p243b8b80} id="Vector" stroke="var(--stroke-0, #6A7282)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function App2() {
  return (
    <div className="absolute content-stretch flex h-[52px] items-center justify-between left-[24px] top-[16px] w-[844.8px]" data-name="App">
      <Container9 />
      <Icon2 />
    </div>
  );
}

function CardHeader2() {
  return (
    <div className="absolute h-[90px] left-0 rounded-tl-[14px] rounded-tr-[14px] top-0 w-[892.8px]" data-name="CardHeader">
      <App2 />
    </div>
  );
}

function PrimitiveButton2() {
  return (
    <div className="h-[90px] relative shrink-0 w-[892.8px]" data-name="Primitive.button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[90px] relative w-[892.8px]">
        <CardHeader2 />
      </div>
    </div>
  );
}

function Card2() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[93.2px] items-start left-0 p-[1.6px] rounded-[14px] top-[218.4px] w-[896px]" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.6px] border-gray-200 border-solid inset-0 pointer-events-none rounded-[14px]" />
      <PrimitiveButton2 />
    </div>
  );
}

function Container10() {
  return (
    <div className="bg-[#0f6beb] relative rounded-[2.68435e+07px] shrink-0 size-[32px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[32px]">
        <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">4</p>
      </div>
    </div>
  );
}

function CardTitle3() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="CardTitle">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[28px] left-0 text-[18px] text-neutral-950 text-nowrap top-[-0.6px] whitespace-pre">啟用聊天機器人與 Webhook</p>
    </div>
  );
}

function CardDescription3() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="CardDescription">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#717182] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">從 LINE 官方帳號後台設定</p>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[52px] relative shrink-0 w-[230.887px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[52px] items-start relative w-[230.887px]">
        <CardTitle3 />
        <CardDescription3 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[52px] relative shrink-0 w-[274.888px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] h-[52px] items-center relative w-[274.888px]">
        <Container10 />
        <Container11 />
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p13447200} id="Vector" stroke="var(--stroke-0, #6A7282)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function App3() {
  return (
    <div className="absolute content-stretch flex h-[52px] items-center justify-between left-[24px] top-[16px] w-[844.8px]" data-name="App">
      <Container12 />
      <Icon3 />
    </div>
  );
}

function CardHeader3() {
  return (
    <div className="absolute h-[90px] left-0 rounded-tl-[14px] rounded-tr-[14px] top-0 w-[892.8px]" data-name="CardHeader">
      <App3 />
    </div>
  );
}

function PrimitiveButton3() {
  return (
    <div className="h-[90px] relative shrink-0 w-full" data-name="Primitive.button">
      <CardHeader3 />
    </div>
  );
}

function BoldText() {
  return (
    <div className="absolute content-stretch flex h-[17.6px] items-start left-[16px] top-[16.8px] w-[78.725px]" data-name="Bold Text">
      <p className="basis-0 font-['Arimo:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[#364153] text-[14px]">📘 操作步驟</p>
    </div>
  );
}

function App4() {
  return (
    <div className="absolute h-[220.9px] left-[1.6px] top-[1.6px] w-[395.2px]" data-name="App">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgApp} />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g filter="url(#filter0_d_8337_133)" id="Icon" opacity="0">
          <path d="M20 20L28 28" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M20 12L28 4" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M28 21.3333V28H21.3333" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M28 10.6667V4H21.3333" id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M4 21.3333V28H10.6667" id="Vector_5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M4 28L12 20" id="Vector_6" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M4 10.6667V4H10.6667" id="Vector_7" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M12 12L4 4" id="Vector_8" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
        </g>
        <defs>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="-inf" id="filter0_d_8337_133" width="-inf" x="inf" y="inf">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="4" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_8337_133" />
            <feBlend in="SourceGraphic" in2="effect1_dropShadow_8337_133" mode="normal" result="shape" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

function App5() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] content-stretch flex h-[220.9px] items-center justify-center left-[1.6px] top-[1.6px] w-[395.2px]" data-name="App">
      <Icon4 />
    </div>
  );
}

function SlotClone() {
  return (
    <div className="absolute bg-gray-200 h-[224.1px] left-0 rounded-[10px] top-0 w-[398.4px]" data-name="SlotClone">
      <div className="h-[224.1px] overflow-clip relative rounded-[inherit] w-[398.4px]">
        <App4 />
        <App5 />
      </div>
      <div aria-hidden="true" className="absolute border-[#0f6beb] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Text() {
  return (
    <div className="h-[21px] relative shrink-0 w-[11.35px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[11.35px]">
        <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#364153] text-[14px] text-nowrap top-[-0.4px] whitespace-pre">1.</p>
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[21px] relative shrink-0 w-[271.225px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[271.225px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-0 text-[#364153] text-[14px] text-nowrap top-[-1.2px] whitespace-pre">點擊右上角的「齒輪」圖示（⚙️）進入設定</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[21px] items-start left-0 top-0 w-[398.4px]" data-name="Container">
      <Text />
      <Paragraph1 />
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[21px] relative shrink-0 w-[11.35px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[11.35px]">
        <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#364153] text-[14px] text-nowrap top-[-0.4px] whitespace-pre">2.</p>
      </div>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[21px] relative shrink-0 w-[196px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[196px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-0 text-[#364153] text-[14px] text-nowrap top-[-1.2px] whitespace-pre">在左側選單中選擇「回應模式」</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[21px] items-start left-0 top-[29px] w-[398.4px]" data-name="Container">
      <Text1 />
      <Paragraph2 />
    </div>
  );
}

function Text2() {
  return (
    <div className="h-[68px] relative shrink-0 w-[11.35px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[68px] relative w-[11.35px]">
        <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#364153] text-[14px] text-nowrap top-[-0.4px] whitespace-pre">3.</p>
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] left-0 text-[#364153] text-[14px] text-nowrap top-[-1.2px] whitespace-pre">將以下選項開啟：</p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[16px] text-[#364153] text-[14px] text-nowrap top-[-1.2px] whitespace-pre">- 聊天機器人（Chatbot）</p>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[16px] text-[#364153] text-[14px] text-nowrap top-[-1.2px] whitespace-pre">- Webhook（用於接收外部事件）</p>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[68px] relative shrink-0 w-[229.625px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] h-[68px] items-start relative w-[229.625px]">
        <Paragraph3 />
        <Paragraph4 />
        <Paragraph5 />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[68px] items-start left-0 top-[58px] w-[398.4px]" data-name="Container">
      <Text2 />
      <Container15 />
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[21px] relative shrink-0 w-[11.35px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[11.35px]">
        <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#364153] text-[14px] text-nowrap top-[-0.4px] whitespace-pre">4.</p>
      </div>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[21px] relative shrink-0 w-[364px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[364px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-0 text-[#364153] text-[14px] text-nowrap top-[-1.2px] whitespace-pre">將回應方式改為「手動回應」，以便系統自動處理訊息互動</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[21px] items-start left-0 top-[134px] w-[398.4px]" data-name="Container">
      <Text3 />
      <Paragraph6 />
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute h-[224.1px] left-[414.4px] top-0 w-[398.4px]" data-name="Container">
      <Container13 />
      <Container14 />
      <Container16 />
      <Container17 />
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute h-[224.1px] left-[16px] top-[48px] w-[812.8px]" data-name="Container">
      <SlotClone />
      <Container18 />
    </div>
  );
}

function App6() {
  return (
    <div className="bg-[#e1edfd] h-[288.1px] relative rounded-[10px] shrink-0 w-full" data-name="App">
      <BoldText />
      <Container19 />
    </div>
  );
}

function Checkbox() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Checkbox">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border size-[16px]" />
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div className="h-[14px] relative shrink-0 w-[239.075px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[14px] items-center relative w-[239.075px]">
        <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">我已完成聊天機器人與 Webhook 設定</p>
      </div>
    </div>
  );
}

function App7() {
  return (
    <div className="bg-white h-[41.6px] relative rounded-[10px] shrink-0 w-full" data-name="App">
      <div aria-hidden="true" className="absolute border-[#bedbff] border-[0.8px] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[41.6px] items-center pl-[12.8px] pr-[0.8px] py-[0.8px] relative w-full">
          <Checkbox />
          <PrimitiveLabel />
        </div>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#d1d5dc] h-[36px] opacity-50 relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[394.4px] text-[14px] text-nowrap text-white top-[6.8px] whitespace-pre">建立連結</p>
    </div>
  );
}

function CardContent() {
  return (
    <div className="h-[421.7px] relative shrink-0 w-full" data-name="CardContent">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] h-[421.7px] items-start px-[24px] py-0 relative w-full">
          <App6 />
          <App7 />
          <Button />
        </div>
      </div>
    </div>
  );
}

function PrimitiveDiv() {
  return (
    <div className="h-[511.7px] relative shrink-0 w-[892.8px]" data-name="Primitive.div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[511.7px] items-start relative w-[892.8px]">
        <PrimitiveButton3 />
        <CardContent />
      </div>
    </div>
  );
}

function Card3() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[514.9px] items-start left-0 p-[1.6px] rounded-[14px] top-[327.6px] w-[896px]" data-name="Card">
      <div aria-hidden="true" className="absolute border-[#0f6beb] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
      <PrimitiveDiv />
    </div>
  );
}

function Container20() {
  return (
    <div className="h-[842.5px] relative shrink-0 w-full" data-name="Container">
      <Card />
      <Card1 />
      <Card2 />
      <Card3 />
    </div>
  );
}

function BoldText1() {
  return (
    <div className="absolute content-stretch flex h-[17.6px] items-start left-0 top-[0.8px] w-[64.725px]" data-name="Bold Text">
      <p className="basis-0 font-['Arimo:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[#193cb8] text-[14px]">💡 提醒：</p>
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <BoldText1 />
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[64.73px] text-[#193cb8] text-[14px] text-nowrap top-[-1.2px] whitespace-pre">妥善保管您的 Channel Secret 和 Access Token，切勿公開分享。 這些資料將用於與 LINE 平台進行安全通訊。</p>
    </div>
  );
}

function Container21() {
  return (
    <div className="bg-blue-50 h-[53.6px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#bedbff] border-[0.8px] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[53.6px] items-start pb-[0.8px] pt-[16.8px] px-[16.8px] relative w-full">
          <Paragraph7 />
        </div>
      </div>
    </div>
  );
}

function App8() {
  return (
    <div className="bg-[#f6f9fd] h-[1124.1px] relative shrink-0 w-full" data-name="App">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] h-[1124.1px] items-start pb-0 pt-[48px] px-[172.4px] relative w-full">
          <Container />
          <Container20 />
          <Container21 />
        </div>
      </div>
    </div>
  );
}

export default function LineApi() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="LINE API 基本設定">
      <App8 />
    </div>
  );
}