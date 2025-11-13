import svgPaths from "./svg-zz3j3c5xj3";
import imgImageHero from "figma:asset/68b289cb927cef11d11501fd420bb560ad25c667.png";

function Heading() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[36px] left-0 text-[#101828] text-[24px] text-nowrap top-[-1.6px] whitespace-pre">LINE Flex Message 編輯器</p>
    </div>
  );
}

function Header() {
  return (
    <div className="h-[68.8px] relative shrink-0 w-[1002.4px]" data-name="Header">
      <div aria-hidden="true" className="absolute border-[0px_0px_0.8px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[68.8px] items-start pb-[0.8px] pt-[16px] px-[24px] relative w-[1002.4px]">
        <Heading />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Arimo:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[27px] left-0 text-[18px] text-black text-nowrap top-[-1.4px] whitespace-pre">標題文字</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[18px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[18px] left-0 text-[#666666] text-[12px] text-nowrap top-[-1.2px] whitespace-pre">內文文字說明</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[8px] h-[85px] items-start left-0 pb-0 pt-[16px] px-[16px] top-[300px] w-[300px]" data-name="Container">
      <Container />
      <Container1 />
    </div>
  );
}

function Button() {
  return (
    <div className="absolute bg-[#06c755] h-[44px] left-[16px] rounded-[4px] top-[401px] w-[268px]" data-name="Button">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[134px] text-[14px] text-center text-nowrap text-white top-[10.8px] translate-x-[-50%] whitespace-pre">動作按鈕一</p>
    </div>
  );
}

function ImageHero() {
  return (
    <div className="relative shrink-0 size-[300px]" data-name="Image (Hero)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid box-border inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImageHero} />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border size-[300px]" />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute bg-gray-200 content-stretch flex items-center justify-center left-0 overflow-clip size-[300px] top-0" data-name="Container">
      <ImageHero />
    </div>
  );
}

function FlexBubblePreview() {
  return (
    <div className="bg-white h-[461px] overflow-clip relative rounded-[10px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="FlexBubblePreview">
      <Container2 />
      <Button />
      <Container3 />
    </div>
  );
}

function PreviewPanel() {
  return (
    <div className="box-border content-stretch flex flex-col h-[461px] items-start overflow-clip pl-[0.2px] py-0 relative shrink-0 w-full" data-name="PreviewPanel">
      <FlexBubblePreview />
    </div>
  );
}

function Container4() {
  return (
    <div className="bg-gradient-to-b from-[#a5d8ff] h-[577.6px] relative shrink-0 to-[#d0ebff] w-[350.837px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[577.6px] items-start overflow-clip pb-0 pt-[58.3px] px-[32px] relative rounded-[inherit] w-[350.837px]">
        <PreviewPanel />
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute bg-white box-border content-stretch flex h-[32px] items-center justify-center left-[4px] rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] top-[4px] w-[96px]" data-name="Button">
      <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#101828] text-[14px] text-nowrap whitespace-pre">輪播 1</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-gray-50 h-[40px] relative rounded-[10px] shrink-0 w-[104px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[40px] overflow-clip relative rounded-[inherit] w-[104px]">
        <Button1 />
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[10px] size-[16px] top-[8px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #0F6BEB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #0F6BEB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="h-[32px] relative rounded-[8px] shrink-0 w-[96px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[32px] relative w-[96px]">
        <Icon />
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[30px] text-[#0f6beb] text-[14px] text-nowrap top-[4.8px] whitespace-pre">新增輪播</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex gap-[8px] h-[40px] items-center relative shrink-0 w-full" data-name="Container">
      <Container5 />
      <Button2 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[12.8px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Icon">
          <path d={svgPaths.p8b49980} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.06667" />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveSpan() {
  return (
    <div className="content-stretch flex h-[14px] items-center justify-center relative shrink-0 w-full" data-name="Primitive.span">
      <Icon1 />
    </div>
  );
}

function PrimitiveButton() {
  return (
    <div className="bg-[#2b7fff] relative rounded-[6px] shrink-0 size-[16px]" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[#2b7fff] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start p-[1.6px] relative size-[16px]">
        <PrimitiveSpan />
      </div>
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div className="h-[14px] relative shrink-0 w-[56px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[14px] items-center relative w-[56px]">
        <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">選擇圖片</p>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex gap-[8px] h-[16px] items-center relative shrink-0 w-full" data-name="Container">
      <PrimitiveButton />
      <PrimitiveLabel />
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute left-[104.89px] size-[16px] top-[10px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M8 2V10" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p26e09a00} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p23ad1400} id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button3() {
  return (
    <div className="basis-0 bg-white grow h-[36px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[36px] relative w-full">
        <Icon2 />
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[128.89px] text-[14px] text-neutral-950 text-nowrap top-[6.8px] whitespace-pre">上傳圖片</p>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute left-[104.89px] size-[16px] top-[10px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_8135_337)" id="Icon">
          <path d={svgPaths.p216f800} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p13e4b3c0} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_8135_337">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div className="basis-0 bg-white grow h-[36px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[36px] relative w-full">
        <Icon3 />
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[128.89px] text-[14px] text-neutral-950 text-nowrap top-[6.8px] whitespace-pre">複製圖卡</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-start pl-0 py-0 relative shrink-0 w-full" data-name="Container">
      <Button3 />
      <Button4 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal h-[47.962px] leading-[16px] relative shrink-0 text-[#6a7282] text-[12px] text-nowrap w-full whitespace-pre" data-name="Paragraph">
      <p className="absolute left-0 top-[-1px]">• 圖片格式 JPG, JPEG, PNG</p>
      <p className="absolute left-0 top-[14.99px]">• 檔案最大不可下載超過 5 MB</p>
      <p className="absolute left-0 top-[30.98px]">• 圖片會自動調整為 1.92:1 或 1:1 比例</p>
    </div>
  );
}

function PrimitiveButton1() {
  return (
    <div className="bg-white relative rounded-[6px] shrink-0 size-[16px]" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[#99a1af] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border size-[16px]" />
    </div>
  );
}

function PrimitiveLabel1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[113.925px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[20px] items-center relative w-[113.925px]">
        <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">點擊圖片觸發 URL</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex gap-[8px] h-[20px] items-center relative shrink-0 w-full" data-name="Container">
      <PrimitiveButton1 />
      <PrimitiveLabel1 />
    </div>
  );
}

function Container10() {
  return (
    <div className="box-border content-stretch flex flex-col h-[28.8px] items-start pb-0 pt-[8.8px] px-0 relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px_0px_0px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none" />
      <Container9 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] h-[136.762px] items-start relative shrink-0 w-full" data-name="Container">
      <Container8 />
      <Paragraph />
      <Container10 />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[164.762px] items-start left-0 top-0 w-[587.562px]" data-name="Container">
      <Container7 />
      <Container11 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[12.8px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Icon">
          <path d={svgPaths.p8b49980} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.06667" />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveSpan1() {
  return (
    <div className="content-stretch flex h-[14px] items-center justify-center relative shrink-0 w-full" data-name="Primitive.span">
      <Icon4 />
    </div>
  );
}

function PrimitiveButton2() {
  return (
    <div className="bg-[#2b7fff] relative rounded-[6px] shrink-0 size-[16px]" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[#2b7fff] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start p-[1.6px] relative size-[16px]">
        <PrimitiveSpan1 />
      </div>
    </div>
  );
}

function PrimitiveLabel2() {
  return (
    <div className="h-[14px] relative shrink-0 w-[56px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[14px] items-center relative w-[56px]">
        <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">標題文字</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex gap-[8px] h-[16px] items-center relative shrink-0 w-full" data-name="Container">
      <PrimitiveButton2 />
      <PrimitiveLabel2 />
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">標題文字</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[0.8px] border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[16px] left-[587.67px] text-[#99a1af] text-[12px] text-right top-[-1px] translate-x-[-100%] w-[26px]">4/20</p>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[55.987px] items-start relative shrink-0 w-full" data-name="Container">
      <Input />
      <Container14 />
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[79.987px] items-start left-0 top-[188.76px] w-[587.562px]" data-name="Container">
      <Container13 />
      <Container15 />
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[12.8px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Icon">
          <path d={svgPaths.p8b49980} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.06667" />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveSpan2() {
  return (
    <div className="content-stretch flex h-[14px] items-center justify-center relative shrink-0 w-full" data-name="Primitive.span">
      <Icon5 />
    </div>
  );
}

function PrimitiveButton3() {
  return (
    <div className="bg-[#2b7fff] relative rounded-[6px] shrink-0 size-[16px]" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[#2b7fff] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start p-[1.6px] relative size-[16px]">
        <PrimitiveSpan2 />
      </div>
    </div>
  );
}

function PrimitiveLabel3() {
  return (
    <div className="h-[14px] relative shrink-0 w-[84px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[14px] items-center relative w-[84px]">
        <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">內文文字說明</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex gap-[8px] h-[16px] items-center relative shrink-0 w-full" data-name="Container">
      <PrimitiveButton3 />
      <PrimitiveLabel3 />
    </div>
  );
}

function Textarea() {
  return (
    <div className="bg-white h-[64px] relative rounded-[8px] shrink-0 w-full" data-name="Textarea">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[64px] items-start px-[12px] py-[8px] relative w-full">
          <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">輸入內文文字說明</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[0.8px] border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[16px] left-[587.67px] text-[#99a1af] text-[12px] text-right top-[-1px] translate-x-[-100%] w-[26px]">6/60</p>
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[83.987px] items-start relative shrink-0 w-full" data-name="Container">
      <Textarea />
      <Container18 />
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[107.988px] items-start left-0 top-[292.75px] w-[587.562px]" data-name="Container">
      <Container17 />
      <Container19 />
    </div>
  );
}

function PrimitiveButton4() {
  return (
    <div className="bg-white relative rounded-[6px] shrink-0 size-[16px]" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[#99a1af] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border size-[16px]" />
    </div>
  );
}

function PrimitiveLabel4() {
  return (
    <div className="h-[14px] relative shrink-0 w-[28px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[14px] items-center relative w-[28px]">
        <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">金額</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[16px] items-center left-0 top-[424.74px] w-[587.562px]" data-name="Container">
      <PrimitiveButton4 />
      <PrimitiveLabel4 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="absolute left-[60px] size-[12px] top-px" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g clipPath="url(#clip0_8135_332)" id="Icon">
          <path d={svgPaths.p3e7757b0} id="Vector" stroke="var(--stroke-0, #2B7FFF)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 8V6" id="Vector_2" stroke="var(--stroke-0, #2B7FFF)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 4H6.005" id="Vector_3" stroke="var(--stroke-0, #2B7FFF)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <defs>
          <clipPath id="clip0_8135_332">
            <rect fill="white" height="12" width="12" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function PrimitiveLabel5() {
  return (
    <div className="h-[14px] relative shrink-0 w-[72px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[14px] relative w-[72px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[14px] left-0 text-[14px] text-neutral-950 text-nowrap top-[-1.4px] whitespace-pre">動作按鈕</p>
        <Icon6 />
      </div>
    </div>
  );
}

function Icon7() {
  return (
    <div className="absolute left-[10.8px] size-[16px] top-[8px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-white h-[32px] relative rounded-[8px] shrink-0 w-[97.6px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[32px] relative w-[97.6px]">
        <Icon7 />
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] left-[30.8px] text-[14px] text-neutral-950 text-nowrap top-[4.8px] whitespace-pre">新增按鈕</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex gap-[12px] h-[32px] items-center relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel5 />
      <Button5 />
    </div>
  );
}

function PrimitiveLabel6() {
  return (
    <div className="h-[20px] relative shrink-0 w-[39.625px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[20px] items-center relative w-[39.625px]">
        <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">按鈕 1</p>
      </div>
    </div>
  );
}

function Icon8() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M6.66667 7.33333V11.3333" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M9.33333 7.33333V11.3333" id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p37e28100} id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M2 4H14" id="Vector_4" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p2ffbeb80} id="Vector_5" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button6() {
  return (
    <div className="relative rounded-[8px] shrink-0 size-[24px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[24px]">
        <Icon8 />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-center justify-between left-[12.8px] top-[12.8px] w-[561.963px]" data-name="Container">
      <PrimitiveLabel6 />
      <Button6 />
    </div>
  );
}

function PrimitiveLabel7() {
  return (
    <div className="content-stretch flex gap-[8px] h-[15.988px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[12px] text-neutral-950 text-nowrap whitespace-pre">按鈕文字</p>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-white h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">動作按鈕一</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[0.8px] border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container24() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[16px] left-[562.08px] text-[#99a1af] text-[12px] text-right top-[-1px] translate-x-[-100%] w-[26px]">5/12</p>
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[55.987px] items-start relative shrink-0 w-full" data-name="Container">
      <Input1 />
      <Container24 />
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[79.975px] items-start left-[12.8px] top-[48.8px] w-[561.963px]" data-name="Container">
      <PrimitiveLabel7 />
      <Container25 />
    </div>
  );
}

function PrimitiveLabel8() {
  return (
    <div className="content-stretch flex gap-[8px] h-[15.988px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[12px] text-neutral-950 text-nowrap whitespace-pre">連結網址</p>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-white h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">https://example.com</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[0.8px] border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[59.987px] items-start left-[12.8px] top-[140.78px] w-[561.963px]" data-name="Container">
      <PrimitiveLabel8 />
      <Input2 />
    </div>
  );
}

function PrimitiveLabel9() {
  return (
    <div className="content-stretch flex gap-[8px] h-[15.988px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[12px] text-neutral-950 text-nowrap whitespace-pre">互動標籤</p>
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-white h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#717182] text-[14px] text-nowrap whitespace-pre">輸入互動標籤（僅供後台紀錄）</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[0.8px] border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="basis-0 font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#6a7282] text-[12px]">此欄位不影響 Flex Message，僅供後台紀錄使用</p>
    </div>
  );
}

function Container28() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[83.975px] items-start left-[12.8px] top-[212.76px] w-[561.963px]" data-name="Container">
      <PrimitiveLabel9 />
      <Input3 />
      <Paragraph1 />
    </div>
  );
}

function PrimitiveLabel10() {
  return (
    <div className="content-stretch flex gap-[8px] h-[15.988px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[12px] text-neutral-950 text-nowrap whitespace-pre">按鈕樣式</p>
    </div>
  );
}

function PrimitiveSpan3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[134.963px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[20px] items-center overflow-clip relative rounded-[inherit] w-[134.963px]">
        <p className="font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-neutral-950 text-nowrap whitespace-pre">Primary（綠色實心）</p>
      </div>
    </div>
  );
}

function Icon9() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon" opacity="0.5">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveButton5() {
  return (
    <div className="bg-white h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex h-[36px] items-center justify-between px-[12.8px] py-[0.8px] relative w-full">
          <PrimitiveSpan3 />
          <Icon9 />
        </div>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[59.987px] items-start left-[12.8px] top-[308.74px] w-[561.963px]" data-name="Container">
      <PrimitiveLabel10 />
      <PrimitiveButton5 />
    </div>
  );
}

function Container30() {
  return (
    <div className="bg-gray-50 h-[381.525px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-gray-200 border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Container23 />
      <Container26 />
      <Container27 />
      <Container28 />
      <Container29 />
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[425.525px] items-start left-0 top-[464.74px] w-[587.562px]" data-name="Container">
      <Container22 />
      <Container30 />
    </div>
  );
}

function ConfigPanel() {
  return (
    <div className="h-[890.263px] relative shrink-0 w-full" data-name="ConfigPanel">
      <Container12 />
      <Container16 />
      <Container20 />
      <Container21 />
      <Container31 />
    </div>
  );
}

function Container32() {
  return (
    <div className="h-[1002.26px] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] h-[1002.26px] items-start pb-0 pt-[24px] px-[24px] relative w-full">
          <Container6 />
          <ConfigPanel />
        </div>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="basis-0 bg-white grow h-[577.6px] min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[577.6px] items-start pl-[0.8px] pr-[15.2px] py-0 relative w-full">
          <Container32 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[0px_0px_0px_0.8px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container34() {
  return (
    <div className="h-[577.6px] relative shrink-0 w-full" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex h-[577.6px] items-start relative w-full">
          <Container4 />
          <Container33 />
        </div>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[1002.4px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-full items-start overflow-clip relative rounded-[inherit] w-[1002.4px]">
        <Container34 />
      </div>
    </div>
  );
}

export default function LineFlexMessageBuilder() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="LINE Flex Message Builder">
      <Header />
      <Container35 />
    </div>
  );
}