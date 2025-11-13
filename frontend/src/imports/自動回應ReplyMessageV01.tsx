import svgPaths from "./svg-epkf10l3t9";

function TextInput() {
  return (
    <div className="absolute content-stretch flex h-[30px] items-center left-[36px] overflow-clip top-px w-[280px]" data-name="Text Input">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#dddddd] text-[20px] text-nowrap whitespace-pre">以訊息內容或標籤搜尋</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[17.575px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[2.36%] left-0 right-[2.22%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <path d={svgPaths.p12214200} fill="var(--fill-0, #A8A8A8)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col h-[17.575px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-0 overflow-clip pb-0 pl-[7px] pr-[7.4px] pt-[7px] size-[32px] top-0" data-name="Container">
      <Container />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute h-[32px] left-[12px] top-[8px] w-[316px]" data-name="Container">
      <TextInput />
      <Container1 />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute bg-white h-[48px] left-0 rounded-[16px] top-0 w-[340px]" data-name="Container">
      <Container2 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[8px] top-[8px] w-[96px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">清除全部條件</p>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute h-[40px] left-[344px] rounded-[12px] top-[4px] w-[112px]" data-name="Button">
      <Paragraph />
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute h-[48px] left-0 top-0 w-[456px]" data-name="Container">
      <Container3 />
      <Button />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[12px] top-[12px] w-[48px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立</p>
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute bg-[#242424] h-[48px] left-[852px] rounded-[16px] top-0 w-[72px]" data-name="Button">
      <Paragraph1 />
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute h-[48px] left-[40px] top-[193px] w-[924px]" data-name="Container">
      <Container4 />
      <Button1 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[18px] left-[44px] top-[257px] w-[36.063px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[18px] left-[18.5px] text-[#6e6e6e] text-[12px] text-center top-[-2px] translate-x-[-50%] w-[37px]">共 4 筆</p>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[24px] top-[17.5px] w-[296px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[21px] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">訊息內容</p>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[12.775px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[3.08%_60%_4.62%_40%]" data-name="Vector">
        <div className="absolute inset-[-3.01%_-0.35px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
            <path d="M0.354661 0.354661V12.147" id="Vector" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.709323" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex flex-col h-[12.775px] items-start left-[331.6px] top-[21.61px] w-[0.8px]" data-name="Container">
      <Icon1 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[344px] top-[17.5px] w-[168px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[21px] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">回應類型</p>
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[12.775px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[3.08%_60%_4.62%_40%]" data-name="Vector">
        <div className="absolute inset-[-3.01%_-0.35px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
            <path d="M0.354661 0.354661V12.147" id="Vector" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.709323" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute content-stretch flex flex-col h-[12.775px] items-start left-[523.6px] top-[21.61px] w-[0.8px]" data-name="Container">
      <Icon2 />
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[12px] top-[1.5px] w-[70px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">關鍵字標籤</p>
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
      </svg>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col h-[16px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon3 />
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[86px] overflow-clip pb-0 pt-[4px] px-[4px] size-[24px] top-0" data-name="Container">
      <Container8 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
      </svg>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon4 />
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[114px] overflow-clip pb-0 pt-[6px] px-[4px] size-[20px] top-[2px]" data-name="Container">
      <Container10 />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute h-[24px] left-[524px] top-[16px] w-[280px]" data-name="Container">
      <Paragraph5 />
      <Container9 />
      <Container11 />
    </div>
  );
}

function Icon5() {
  return (
    <div className="h-[12.775px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[3.08%_60%_4.62%_40%]" data-name="Vector">
        <div className="absolute inset-[-3.01%_-0.35px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
            <path d="M0.354661 0.354661V12.147" id="Vector" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.709323" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex flex-col h-[12.775px] items-start left-[803.6px] top-[21.61px] w-[0.8px]" data-name="Container">
      <Icon5 />
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[12px] top-0 w-[28px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">狀態</p>
    </div>
  );
}

function Icon6() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
      </svg>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon6 />
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[44px] overflow-clip pb-0 pt-[6px] px-[4px] size-[20px] top-[0.5px]" data-name="Container">
      <Container14 />
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute h-[21px] left-[804px] top-[17.5px] w-[180px]" data-name="Container">
      <Paragraph6 />
      <Container15 />
    </div>
  );
}

function Icon7() {
  return (
    <div className="h-[12.775px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[3.08%_60%_4.62%_40%]" data-name="Vector">
        <div className="absolute inset-[-3.01%_-0.35px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
            <path d="M0.354661 0.354661V12.147" id="Vector" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.709323" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex flex-col h-[12.775px] items-start left-[983.6px] top-[21.61px] w-[0.8px]" data-name="Container">
      <Icon7 />
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[12px] top-0 w-[28px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">平台</p>
    </div>
  );
}

function Icon8() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
      </svg>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon8 />
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[44px] overflow-clip pb-0 pt-[6px] px-[4px] size-[20px] top-[0.5px]" data-name="Container">
      <Container18 />
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute h-[21px] left-[984px] top-[17.5px] w-[140px]" data-name="Container">
      <Paragraph7 />
      <Container19 />
    </div>
  );
}

function Icon9() {
  return (
    <div className="h-[12.775px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[3.08%_60%_4.62%_40%]" data-name="Vector">
        <div className="absolute inset-[-3.01%_-0.35px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
            <path d="M0.354661 0.354661V12.147" id="Vector" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.709323" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex flex-col h-[12.775px] items-start left-[1123.6px] top-[21.61px] w-[0.8px]" data-name="Container">
      <Icon9 />
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[12px] top-[1.5px] w-[56px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">觸發次數</p>
    </div>
  );
}

function Icon10() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
      </svg>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex flex-col h-[16px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon10 />
    </div>
  );
}

function Container23() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[72px] overflow-clip pb-0 pt-[4px] px-[4px] size-[24px] top-0" data-name="Container">
      <Container22 />
    </div>
  );
}

function Icon11() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
      </svg>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon11 />
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[100px] overflow-clip pb-0 pt-[6px] px-[4px] size-[20px] top-[2px]" data-name="Container">
      <Container24 />
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute h-[24px] left-[1124px] top-[16px] w-[140px]" data-name="Container">
      <Paragraph8 />
      <Container23 />
      <Container25 />
    </div>
  );
}

function Icon12() {
  return (
    <div className="h-[12.775px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[3.08%_60%_4.62%_40%]" data-name="Vector">
        <div className="absolute inset-[-3.01%_-0.35px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
            <path d="M0.354661 0.354661V12.147" id="Vector" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.709323" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex flex-col h-[12.775px] items-start left-[1263.6px] top-[21.61px] w-[0.8px]" data-name="Container">
      <Icon12 />
    </div>
  );
}

function Paragraph9() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[12px] top-0 w-[56px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">建立時間</p>
    </div>
  );
}

function Icon13() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
        <path d={svgPaths.p24dcb900} fill="var(--fill-0, #0F6BEB)" id="Vector" />
      </svg>
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon13 />
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[72px] overflow-clip pb-0 pt-[6px] px-[4px] size-[20px] top-[0.5px]" data-name="Container">
      <Container28 />
    </div>
  );
}

function Container30() {
  return (
    <div className="absolute h-[21px] left-[1264px] top-[17.5px] w-[124px]" data-name="Container">
      <Paragraph9 />
      <Container29 />
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute bg-white h-[52px] left-0 rounded-tl-[16px] rounded-tr-[16px] top-0 w-[1400px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0px_0px_0.8px] border-black border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <Paragraph3 />
      <Container6 />
      <Paragraph4 />
      <Container7 />
      <Container12 />
      <Container13 />
      <Container16 />
      <Container17 />
      <Container20 />
      <Container21 />
      <Container26 />
      {[...Array(3).keys()].map((_, i) => (
        <Container27 key={i} />
      ))}
      <Container30 />
    </div>
  );
}

function Paragraph10() {
  return (
    <div className="absolute h-[42px] left-[24px] top-[25px] w-[296px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#383838] text-[14px] top-[-2px] w-[294px]">您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢</p>
    </div>
  );
}

function Paragraph11() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[344px] top-[35.5px] w-[254.8px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[21px] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">觸發關鍵字</p>
    </div>
  );
}

function Paragraph12() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[32px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">飯店</p>
    </div>
  );
}

function Container32() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[12px] rounded-[8px] top-0 w-[40px]" data-name="Container">
      <Paragraph12 />
    </div>
  );
}

function Paragraph13() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[32px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">房型</p>
    </div>
  );
}

function Container33() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[56px] rounded-[8px] top-0 w-[40px]" data-name="Container">
      <Paragraph13 />
    </div>
  );
}

function Paragraph14() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[32px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">空房</p>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[100px] rounded-[8px] top-0 w-[40px]" data-name="Container">
      <Paragraph14 />
    </div>
  );
}

function Paragraph15() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[64px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">飯店位置</p>
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[144px] rounded-[8px] top-0 w-[72px]" data-name="Container">
      <Paragraph15 />
    </div>
  );
}

function Paragraph16() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[32px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">人數</p>
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[220px] rounded-[8px] top-0 w-[40px]" data-name="Container">
      <Paragraph16 />
    </div>
  );
}

function Paragraph17() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[32px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">日期</p>
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[12px] rounded-[8px] top-[36px] w-[40px]" data-name="Container">
      <Paragraph17 />
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute h-[68px] left-[524px] top-[12px] w-[280px]" data-name="Container">
      <Container32 />
      <Container33 />
      <Container34 />
      <Container35 />
      <Container36 />
      <Container37 />
    </div>
  );
}

function Icon14() {
  return (
    <div className="h-[16.675px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[1.96%] left-0 right-[1.96%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 17">
          <path d={svgPaths.p87eb200} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex flex-col h-[16.675px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon14 />
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[816px] overflow-clip pb-0 pt-[11.662px] px-[3.325px] size-[40px] top-[26px]" data-name="Button">
      <Container39 />
    </div>
  );
}

function Paragraph18() {
  return (
    <div className="absolute h-[24px] left-[996px] top-[34px] w-[116px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#383838] text-[14px] text-nowrap top-[0.2px] tracking-[0.22px] whitespace-pre">LINE</p>
    </div>
  );
}

function Paragraph19() {
  return (
    <div className="absolute h-[24px] left-[1136px] top-[34px] w-[90px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#383838] text-[14px] text-nowrap top-[0.2px] tracking-[0.22px] whitespace-pre">-</p>
    </div>
  );
}

function Paragraph20() {
  return (
    <div className="absolute h-[42px] left-[1276px] top-[25px] w-[72px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#383838] text-[14px] top-[-2px] w-[72px]">2026-10-02 22:47</p>
    </div>
  );
}

function Icon15() {
  return <div className="absolute left-0 size-[16.8px] top-0" data-name="Icon" />;
}

function Group() {
  return (
    <div className="absolute bottom-[5.75%] contents left-0 right-[5.75%] top-0" data-name="Group">
      <div className="absolute bottom-[5.75%] left-0 right-[5.75%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p32e271f2} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon16() {
  return (
    <div className="h-[10.375px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group />
    </div>
  );
}

function Container40() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1687.7px] size-[10.375px] top-[381.73px]" data-name="Container">
      <Icon16 />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute bottom-[17.79%] contents left-0 right-[17.79%] top-0" data-name="Group">
      <div className="absolute bottom-[17.79%] left-0 right-[17.79%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 4">
          <path d={svgPaths.p20ae14b0} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon17() {
  return (
    <div className="h-[4.125px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group1 />
    </div>
  );
}

function Container41() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1696.19px] size-[4.125px] top-[379.49px]" data-name="Container">
      <Icon17 />
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute left-[-1685.6px] size-0 top-[-377.4px]" data-name="Container">
      <Container40 />
      <Container41 />
    </div>
  );
}

function Container43() {
  return (
    <div className="h-[16.8px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Icon15 />
      <Container42 />
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[1360px] pb-0 pt-[5.6px] px-[5.6px] rounded-[12px] size-[28px] top-[32px]" data-name="Button">
      <Container43 />
    </div>
  );
}

function Container44() {
  return (
    <div className="absolute bg-white h-[92px] left-0 top-[52.8px] w-[1400px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0px_0px_0.8px] border-black border-solid inset-0 pointer-events-none" />
      <Paragraph10 />
      <Paragraph11 />
      <Container38 />
      <Button2 />
      <Paragraph18 />
      <Paragraph19 />
      <Paragraph20 />
      <Button3 />
    </div>
  );
}

function Paragraph21() {
  return (
    <div className="absolute h-[42px] left-[24px] top-[12px] w-[296px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#383838] text-[14px] top-[-2px] w-[294px]">您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢</p>
    </div>
  );
}

function Paragraph22() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[344px] top-[22.5px] w-[254.8px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[21px] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">一鍵回應</p>
    </div>
  );
}

function Paragraph23() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[536px] top-[22.5px] w-[256px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[21px] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">-</p>
    </div>
  );
}

function Icon18() {
  return (
    <div className="h-[16.675px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[1.96%] left-0 right-[1.96%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 17">
          <path d={svgPaths.p87eb200} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="content-stretch flex flex-col h-[16.675px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon18 />
    </div>
  );
}

function Button4() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[816px] overflow-clip pb-0 pt-[11.663px] px-[3.325px] size-[40px] top-[13px]" data-name="Button">
      <Container45 />
    </div>
  );
}

function Paragraph24() {
  return (
    <div className="absolute h-[24px] left-[996px] top-[21px] w-[116px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#383838] text-[14px] text-nowrap top-[0.2px] tracking-[0.22px] whitespace-pre">LINE</p>
    </div>
  );
}

function Paragraph25() {
  return (
    <div className="absolute h-[24px] left-[1136px] top-[21px] w-[90px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#383838] text-[14px] text-nowrap top-[0.2px] tracking-[0.22px] whitespace-pre">-</p>
    </div>
  );
}

function Paragraph26() {
  return (
    <div className="absolute h-[42px] left-[1276px] top-[12px] w-[72px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#383838] text-[14px] top-[-2px] w-[72px]">2026-10-02 22:47</p>
    </div>
  );
}

function Icon19() {
  return <div className="absolute left-0 size-[16.8px] top-0" data-name="Icon" />;
}

function Group2() {
  return (
    <div className="absolute bottom-[5.75%] contents left-0 right-[5.75%] top-0" data-name="Group">
      <div className="absolute bottom-[5.75%] left-0 right-[5.75%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p32e271f2} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon20() {
  return (
    <div className="h-[10.375px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group2 />
    </div>
  );
}

function Container46() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1687.7px] size-[10.375px] top-[461.52px]" data-name="Container">
      <Icon20 />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute bottom-[17.79%] contents left-0 right-[17.79%] top-0" data-name="Group">
      <div className="absolute bottom-[17.79%] left-0 right-[17.79%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 4">
          <path d={svgPaths.p20ae14b0} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon21() {
  return (
    <div className="h-[4.125px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group3 />
    </div>
  );
}

function Container47() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1696.19px] size-[4.125px] top-[459.29px]" data-name="Container">
      <Icon21 />
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute left-[-1685.6px] size-0 top-[-457.2px]" data-name="Container">
      <Container46 />
      <Container47 />
    </div>
  );
}

function Container49() {
  return (
    <div className="h-[16.8px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Icon19 />
      <Container48 />
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[1360px] pb-0 pt-[5.6px] px-[5.6px] rounded-[12px] size-[28px] top-[19px]" data-name="Button">
      <Container49 />
    </div>
  );
}

function Container50() {
  return (
    <div className="absolute bg-white h-[66px] left-0 top-[145.6px] w-[1400px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0px_0px_0.8px] border-black border-solid inset-0 pointer-events-none" />
      <Paragraph21 />
      <Paragraph22 />
      <Paragraph23 />
      <Button4 />
      <Paragraph24 />
      <Paragraph25 />
      <Paragraph26 />
      <Button5 />
    </div>
  );
}

function Paragraph27() {
  return (
    <div className="absolute h-[42px] left-[24px] top-[12px] w-[296px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#383838] text-[14px] top-[-2px] w-[284px]">Hi [User Name] 歡迎加入好友～請告訴我們您的需求我司將即時為您解答好問題</p>
    </div>
  );
}

function Paragraph28() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[344px] top-[22.5px] w-[254.8px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[21px] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">歡迎訊息</p>
    </div>
  );
}

function Paragraph29() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[536px] top-[22.5px] w-[256px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[21px] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">-</p>
    </div>
  );
}

function Icon22() {
  return (
    <div className="h-[16.675px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[1.96%] left-0 right-[1.96%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 17">
          <path d={svgPaths.p87eb200} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="content-stretch flex flex-col h-[16.675px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon22 />
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[816px] overflow-clip pb-0 pt-[11.662px] px-[3.325px] size-[40px] top-[13px]" data-name="Button">
      <Container51 />
    </div>
  );
}

function Paragraph30() {
  return (
    <div className="absolute h-[24px] left-[996px] top-[21px] w-[116px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#383838] text-[14px] text-nowrap top-[0.2px] tracking-[0.22px] whitespace-pre">LINE</p>
    </div>
  );
}

function Paragraph31() {
  return (
    <div className="absolute h-[24px] left-[1136px] top-[21px] w-[90px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#383838] text-[14px] text-nowrap top-[0.2px] tracking-[0.22px] whitespace-pre">-</p>
    </div>
  );
}

function Paragraph32() {
  return (
    <div className="absolute h-[42px] left-[1276px] top-[12px] w-[72px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#383838] text-[14px] top-[-2px] w-[72px]">2026-10-02 22:47</p>
    </div>
  );
}

function Icon23() {
  return <div className="absolute left-0 size-[16.8px] top-0" data-name="Icon" />;
}

function Group4() {
  return (
    <div className="absolute bottom-[5.75%] contents left-0 right-[5.75%] top-0" data-name="Group">
      <div className="absolute bottom-[5.75%] left-0 right-[5.75%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p32e271f2} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon24() {
  return (
    <div className="h-[10.375px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group4 />
    </div>
  );
}

function Container52() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1687.7px] size-[10.375px] top-[528.33px]" data-name="Container">
      <Icon24 />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute bottom-[17.79%] contents left-0 right-[17.79%] top-0" data-name="Group">
      <div className="absolute bottom-[17.79%] left-0 right-[17.79%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 4">
          <path d={svgPaths.p20ae14b0} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon25() {
  return (
    <div className="h-[4.125px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group5 />
    </div>
  );
}

function Container53() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1696.19px] size-[4.125px] top-[526.09px]" data-name="Container">
      <Icon25 />
    </div>
  );
}

function Container54() {
  return (
    <div className="absolute left-[-1685.6px] size-0 top-[-524px]" data-name="Container">
      <Container52 />
      <Container53 />
    </div>
  );
}

function Container55() {
  return (
    <div className="h-[16.8px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Icon23 />
      <Container54 />
    </div>
  );
}

function Button7() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[1360px] pb-0 pt-[5.6px] px-[5.6px] rounded-[12px] size-[28px] top-[19px]" data-name="Button">
      <Container55 />
    </div>
  );
}

function Container56() {
  return (
    <div className="absolute bg-white h-[66px] left-0 top-[212.4px] w-[1400px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0px_0px_0.8px] border-black border-solid inset-0 pointer-events-none" />
      <Paragraph27 />
      <Paragraph28 />
      <Paragraph29 />
      <Button6 />
      <Paragraph30 />
      <Paragraph31 />
      <Paragraph32 />
      <Button7 />
    </div>
  );
}

function Paragraph33() {
  return (
    <div className="absolute h-[42px] left-[24px] top-[12px] w-[296px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#383838] text-[14px] top-[-2px] w-[294px]">您好～目前今晚仍有部分房型可預訂，方便告訴我們入住人數與日期嗎？我們將立即為您查詢</p>
    </div>
  );
}

function Paragraph34() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[344px] top-[22.5px] w-[254.8px]" data-name="Paragraph">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[21px] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">觸發關鍵字</p>
    </div>
  );
}

function Paragraph35() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[32px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">在哪</p>
    </div>
  );
}

function Container57() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[12px] rounded-[8px] top-0 w-[40px]" data-name="Container">
      <Paragraph35 />
    </div>
  );
}

function Paragraph36() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[64px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">飯店位置</p>
    </div>
  );
}

function Container58() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[56px] rounded-[8px] top-0 w-[72px]" data-name="Container">
      <Paragraph36 />
    </div>
  );
}

function Paragraph37() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[32px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">地址</p>
    </div>
  );
}

function Container59() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[132px] rounded-[8px] top-0 w-[40px]" data-name="Container">
      <Paragraph37 />
    </div>
  );
}

function Paragraph38() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[4px] top-[4px] w-[48px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">怎麼去</p>
    </div>
  );
}

function Container60() {
  return (
    <div className="absolute bg-[#f0f6ff] h-[32px] left-[176px] rounded-[8px] top-0 w-[56px]" data-name="Container">
      <Paragraph38 />
    </div>
  );
}

function Container61() {
  return (
    <div className="absolute h-[32px] left-[524px] top-[17px] w-[280px]" data-name="Container">
      <Container57 />
      <Container58 />
      <Container59 />
      <Container60 />
    </div>
  );
}

function Icon26() {
  return (
    <div className="h-[16.675px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[1.96%] left-0 right-[1.96%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 17">
          <path d={svgPaths.p3d49d700} fill="var(--fill-0, #DDDDDD)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="content-stretch flex flex-col h-[16.675px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon26 />
    </div>
  );
}

function Button8() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[816px] overflow-clip pb-0 pt-[11.662px] px-[3.325px] size-[40px] top-[13px]" data-name="Button">
      <Container62 />
    </div>
  );
}

function Paragraph39() {
  return (
    <div className="absolute h-[24px] left-[996px] top-[21px] w-[116px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#383838] text-[14px] text-nowrap top-[0.2px] tracking-[0.22px] whitespace-pre">LINE</p>
    </div>
  );
}

function Paragraph40() {
  return (
    <div className="absolute h-[24px] left-[1136px] top-[21px] w-[90px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#383838] text-[14px] text-nowrap top-[0.2px] tracking-[0.22px] whitespace-pre">-</p>
    </div>
  );
}

function Paragraph41() {
  return (
    <div className="absolute h-[42px] left-[1276px] top-[12px] w-[72px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#383838] text-[14px] top-[-2px] w-[72px]">2026-10-02 22:47</p>
    </div>
  );
}

function Icon27() {
  return <div className="absolute left-0 size-[16.8px] top-0" data-name="Icon" />;
}

function Group6() {
  return (
    <div className="absolute bottom-[5.75%] contents left-0 right-[5.75%] top-0" data-name="Group">
      <div className="absolute bottom-[5.75%] left-0 right-[5.75%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p32e271f2} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon28() {
  return (
    <div className="h-[10.375px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group6 />
    </div>
  );
}

function Container63() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1687.7px] size-[10.375px] top-[595.13px]" data-name="Container">
      <Icon28 />
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute bottom-[17.79%] contents left-0 right-[17.79%] top-0" data-name="Group">
      <div className="absolute bottom-[17.79%] left-0 right-[17.79%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 4">
          <path d={svgPaths.p20ae14b0} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon29() {
  return (
    <div className="h-[4.125px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Group7 />
    </div>
  );
}

function Container64() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1696.19px] size-[4.125px] top-[592.89px]" data-name="Container">
      <Icon29 />
    </div>
  );
}

function Container65() {
  return (
    <div className="absolute left-[-1685.6px] size-0 top-[-590.8px]" data-name="Container">
      <Container63 />
      <Container64 />
    </div>
  );
}

function Container66() {
  return (
    <div className="h-[16.8px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Icon27 />
      <Container65 />
    </div>
  );
}

function Button9() {
  return (
    <div className="absolute box-border content-stretch flex flex-col items-start left-[1360px] pb-0 pt-[5.6px] px-[5.6px] rounded-[12px] size-[28px] top-[19px]" data-name="Button">
      <Container66 />
    </div>
  );
}

function Container67() {
  return (
    <div className="absolute bg-white h-[66px] left-0 top-[279.2px] w-[1400px]" data-name="Container">
      <Paragraph33 />
      <Paragraph34 />
      <Container61 />
      <Button8 />
      <Paragraph39 />
      <Paragraph40 />
      <Paragraph41 />
      <Button9 />
    </div>
  );
}

function Container68() {
  return (
    <div className="absolute bg-white h-[360.4px] left-[40px] overflow-clip rounded-[16px] top-[287px] w-[924px]" data-name="Container">
      <Container31 />
      <Container44 />
      <Container50 />
      <Container56 />
      <Container67 />
    </div>
  );
}

function Paragraph42() {
  return (
    <div className="absolute content-stretch flex h-[21px] items-start left-[44px] top-[52px] w-[84px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[21px] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">自動回應訊息</p>
    </div>
  );
}

function Paragraph43() {
  return (
    <div className="absolute h-[48px] left-[44px] top-[12px] w-[192px]" data-name="Paragraph">
      <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[48px] left-[96px] text-[#383838] text-[32px] text-center text-nowrap top-[-4.2px] translate-x-[-50%] whitespace-pre">自動回應訊息</p>
    </div>
  );
}

function Paragraph44() {
  return (
    <div className="absolute content-stretch flex h-[24px] items-start left-[44px] top-[68px] w-[592px]" data-name="Paragraph">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#6e6e6e] text-[16px] text-nowrap whitespace-pre">當用戶加入好友或發送訊息時，自動觸發系統回覆，以確保能在第一時間與用戶互動</p>
    </div>
  );
}

function Container69() {
  return (
    <div className="absolute h-[92px] left-0 top-[77px] w-[1004px]" data-name="Container">
      <Paragraph43 />
      <Paragraph44 />
    </div>
  );
}

function AutoResponseList() {
  return (
    <div className="bg-slate-50 h-[687.4px] relative shrink-0 w-[1004px]" data-name="AutoResponseList">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[687.4px] overflow-clip relative rounded-[inherit] w-[1004px]">
        <Container5 />
        <Paragraph2 />
        <Container68 />
        <Paragraph42 />
        <Container69 />
      </div>
    </div>
  );
}

function MessageList() {
  return (
    <div className="absolute bg-slate-50 box-border content-stretch flex h-[687.4px] items-start left-0 pl-[280px] pr-0 py-0 top-0 w-[1284px]" data-name="MessageList">
      <AutoResponseList />
    </div>
  );
}

function Icon30() {
  return (
    <div className="h-[15.938px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[0.48%] left-0 right-[2.92%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
          <path clipRule="evenodd" d={svgPaths.p2b6e45c0} fill="var(--fill-0, #189AEB)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container70() {
  return (
    <div className="absolute content-stretch flex flex-col h-[15.938px] items-start left-[44.14px] top-[12.19px] w-[11.662px]" data-name="Container">
      <Icon30 />
    </div>
  );
}

function Icon31() {
  return (
    <div className="h-[21.325px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[3.09%] left-0 right-[5.29%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 21">
          <path d={svgPaths.p2db96300} fill="var(--fill-0, #189AEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container71() {
  return (
    <div className="absolute content-stretch flex flex-col h-[21.325px] items-start left-[41.45px] top-[9.49px] w-[17.063px]" data-name="Container">
      <Icon31 />
    </div>
  );
}

function Icon32() {
  return (
    <div className="h-[14.813px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[1.3%] left-0 right-[6.8%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 15">
          <path clipRule="evenodd" d={svgPaths.p298e8f40} fill="var(--fill-0, #189AEB)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container72() {
  return (
    <div className="absolute content-stretch flex flex-col h-[14.813px] items-start left-[57.13px] top-[13.01px] w-[12.113px]" data-name="Container">
      <Icon32 />
    </div>
  );
}

function Icon33() {
  return (
    <div className="h-[20.212px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[3.78%] left-0 right-[2.68%] top-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
          <path d={svgPaths.p32f79a00} fill="var(--fill-0, #189AEB)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container73() {
  return (
    <div className="absolute content-stretch flex flex-col h-[20.212px] items-start left-[54.41px] top-[10.31px] w-[17.538px]" data-name="Container">
      <Icon33 />
    </div>
  );
}

function Icon34() {
  return <div className="h-[15.363px] shrink-0 w-full" data-name="Icon" />;
}

function Container74() {
  return (
    <div className="absolute content-stretch flex flex-col h-[15.363px] items-start left-[68.86px] top-[12.46px] w-[13.95px]" data-name="Container">
      <Icon34 />
    </div>
  );
}

function Icon35() {
  return <div className="h-[20.725px] shrink-0 w-full" data-name="Icon" />;
}

function Container75() {
  return (
    <div className="absolute content-stretch flex flex-col h-[20.725px] items-start left-[66.14px] top-[9.78px] w-[19.363px]" data-name="Container">
      <Icon35 />
    </div>
  );
}

function Icon36() {
  return <div className="h-[14.813px] shrink-0 w-full" data-name="Icon" />;
}

function Container76() {
  return (
    <div className="absolute content-stretch flex flex-col h-[14.813px] items-start left-[82.74px] top-[13.01px] w-[13.662px]" data-name="Container">
      <Icon36 />
    </div>
  );
}

function Icon37() {
  return <div className="h-[20.212px] shrink-0 w-full" data-name="Icon" />;
}

function Container77() {
  return (
    <div className="absolute content-stretch flex flex-col h-[20.212px] items-start left-[80.05px] top-[10.31px] w-[19.075px]" data-name="Container">
      <Icon37 />
    </div>
  );
}

function Icon38() {
  return <div className="h-[15.363px] shrink-0 w-full" data-name="Icon" />;
}

function Container78() {
  return (
    <div className="absolute content-stretch flex flex-col h-[15.363px] items-start left-[96.34px] top-[12.46px] w-[13.662px]" data-name="Container">
      <Icon38 />
    </div>
  );
}

function Icon39() {
  return <div className="h-[20.725px] shrink-0 w-full" data-name="Icon" />;
}

function Container79() {
  return (
    <div className="absolute content-stretch flex flex-col h-[20.725px] items-start left-[93.65px] top-[9.78px] w-[19.038px]" data-name="Container">
      <Icon39 />
    </div>
  );
}

function Icon40() {
  return <div className="h-[15.938px] shrink-0 w-full" data-name="Icon" />;
}

function Container80() {
  return (
    <div className="absolute content-stretch flex flex-col h-[15.938px] items-start left-[112.01px] top-[12.19px] w-[13.063px]" data-name="Container">
      <Icon40 />
    </div>
  );
}

function Icon41() {
  return <div className="h-[21.325px] shrink-0 w-full" data-name="Icon" />;
}

function Container81() {
  return (
    <div className="absolute content-stretch flex flex-col h-[21.325px] items-start left-[109.29px] top-[9.49px] w-[18.488px]" data-name="Container">
      <Icon41 />
    </div>
  );
}

function Icon42() {
  return <div className="h-[14.813px] shrink-0 w-full" data-name="Icon" />;
}

function Container82() {
  return (
    <div className="absolute content-stretch flex flex-col h-[14.813px] items-start left-[125px] top-[13.01px] w-[13.637px]" data-name="Container">
      <Icon42 />
    </div>
  );
}

function Icon43() {
  return <div className="h-[20.212px] shrink-0 w-full" data-name="Icon" />;
}

function Container83() {
  return (
    <div className="absolute content-stretch flex flex-col h-[20.212px] items-start left-[122.29px] top-[10.31px] w-[19.075px]" data-name="Container">
      <Icon43 />
    </div>
  );
}

function StarbitLogo() {
  return (
    <div className="absolute h-[49.325px] left-0 overflow-clip top-[3.34px] w-[148px]" data-name="StarbitLogo">
      <Container70 />
      <Container71 />
      <Container72 />
      <Container73 />
      <Container74 />
      <Container75 />
      <Container76 />
      <Container77 />
      <Container78 />
      <Container79 />
      <Container80 />
      <Container81 />
      <Container82 />
      <Container83 />
    </div>
  );
}

function Container84() {
  return (
    <div className="absolute h-[56px] left-[16px] overflow-clip top-[16px] w-[148px]" data-name="Container">
      <StarbitLogo />
    </div>
  );
}

function Icon44() {
  return (
    <div className="h-[32px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[9.26%_4.94%_9.26%_3.7%]" data-name="Vector">
        <div className="absolute inset-[-4.55%_-4.05%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 29">
            <path d={svgPaths.p60f2f00} id="Vector" stroke="var(--stroke-0, #B6C8F1)" strokeWidth="2.37037" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[5.56%_62.96%_5.56%_37.04%]" data-name="Vector">
        <div className="absolute bottom-0 left-[-1.19px] right-[-1.19px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 29">
            <path d="M1.18519 0V28.4444" id="Vector" stroke="var(--stroke-0, #B6C8F1)" strokeWidth="2.37037" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[232px] overflow-clip size-[32px] top-[28px]" data-name="Button">
      <Icon44 />
    </div>
  );
}

function Container85() {
  return (
    <div className="h-[88px] relative shrink-0 w-[280px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[88px] relative w-[280px]">
        <Container84 />
        <Button10 />
      </div>
    </div>
  );
}

function Icon45() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon">
          <path d={svgPaths.p2cdeb840} fill="var(--fill-0, #6E6E6E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Paragraph45() {
  return (
    <div className="h-[21px] relative shrink-0 w-[56px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[56px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#6e6e6e] text-[14px] text-nowrap top-[-0.4px] whitespace-pre">群發訊息</p>
      </div>
    </div>
  );
}

function Container86() {
  return (
    <div className="h-[29px] relative shrink-0 w-[248px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[4px] h-[29px] items-center pl-[4px] pr-0 py-0 relative w-[248px]">
        <Icon45 />
        <Paragraph45 />
      </div>
    </div>
  );
}

function Paragraph46() {
  return (
    <div className="h-[24px] relative shrink-0 w-[112px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative w-[112px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#383838] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">活動與訊息推播</p>
      </div>
    </div>
  );
}

function Button11() {
  return (
    <div className="h-[40px] relative rounded-[8px] shrink-0 w-[248px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[40px] items-center pl-[28px] pr-0 py-0 relative w-[248px]">
        <Paragraph46 />
      </div>
    </div>
  );
}

function Paragraph47() {
  return (
    <div className="h-[24px] relative shrink-0 w-[64px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative w-[64px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#0f6beb] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">自動回應</p>
      </div>
    </div>
  );
}

function Button12() {
  return (
    <div className="basis-0 bg-[#e1ebf9] grow min-h-px min-w-px relative rounded-[8px] shrink-0 w-[248px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-full items-center pl-[28px] pr-0 py-0 relative w-[248px]">
        <Paragraph47 />
      </div>
    </div>
  );
}

function Container87() {
  return (
    <div className="h-[117px] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] h-[117px] items-start pl-[16px] pr-0 py-0 relative w-full">
          <Container86 />
          <Button11 />
          <Button12 />
        </div>
      </div>
    </div>
  );
}

function Icon46() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p32ddb600} fill="var(--fill-0, #6E6E6E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Paragraph48() {
  return (
    <div className="h-[21px] relative shrink-0 w-[28px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[28px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#6e6e6e] text-[14px] text-nowrap top-[-0.4px] whitespace-pre">會員</p>
      </div>
    </div>
  );
}

function Container88() {
  return (
    <div className="h-[29px] relative shrink-0 w-[248px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[4px] h-[29px] items-center pl-[4px] pr-0 py-0 relative w-[248px]">
        <Icon46 />
        <Paragraph48 />
      </div>
    </div>
  );
}

function Paragraph49() {
  return (
    <div className="h-[24px] relative shrink-0 w-[64px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative w-[64px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#383838] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">會員管理</p>
      </div>
    </div>
  );
}

function Button13() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative rounded-[8px] shrink-0 w-[248px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-full items-center pl-[28px] pr-0 py-0 relative w-[248px]">
        <Paragraph49 />
      </div>
    </div>
  );
}

function Container89() {
  return (
    <div className="h-[73px] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] h-[73px] items-start pl-[16px] pr-0 py-0 relative w-full">
          <Container88 />
          <Button13 />
        </div>
      </div>
    </div>
  );
}

function Icon47() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p16734900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Paragraph50() {
  return (
    <div className="h-[21px] relative shrink-0 w-[28px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[21px] relative w-[28px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#6e6e6e] text-[14px] text-nowrap top-[-0.4px] whitespace-pre">設定</p>
      </div>
    </div>
  );
}

function Container90() {
  return (
    <div className="h-[29px] relative shrink-0 w-[248px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[4px] h-[29px] items-center pl-[4px] pr-0 py-0 relative w-[248px]">
        <Icon47 />
        <Paragraph50 />
      </div>
    </div>
  );
}

function Paragraph51() {
  return (
    <div className="h-[24px] relative shrink-0 w-[64px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[24px] relative w-[64px]">
        <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#383838] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">標籤管理</p>
      </div>
    </div>
  );
}

function Button14() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative rounded-[8px] shrink-0 w-[248px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-full items-center pl-[28px] pr-0 py-0 relative w-[248px]">
        <Paragraph51 />
      </div>
    </div>
  );
}

function Container91() {
  return (
    <div className="h-[73px] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[4px] h-[73px] items-start pl-[16px] pr-0 py-0 relative w-full">
          <Container90 />
          <Button14 />
        </div>
      </div>
    </div>
  );
}

function Container92() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[280px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[20px] h-full items-start overflow-clip relative rounded-[inherit] w-[280px]">
        <Container87 />
        <Container89 />
        <Container91 />
      </div>
    </div>
  );
}

function Paragraph52() {
  return (
    <div className="absolute h-[24px] left-[40px] top-[4px] w-[168px]" data-name="Paragraph">
      <p className="absolute font-['Arimo:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#383838] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">Daisy Yang</p>
    </div>
  );
}

function Button15() {
  return (
    <div className="absolute h-[24px] left-[216px] top-[4px] w-[32px]" data-name="Button">
      <p className="absolute font-['Arimo:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] left-0 text-[#0f6beb] text-[16px] text-nowrap top-[-1.4px] whitespace-pre">登出</p>
    </div>
  );
}

function Icon48() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p1c72d580} fill="var(--fill-0, #7A9FFF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container93() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-0 rounded-[2.68435e+07px] size-[32px] top-0" data-name="Container">
      <Icon48 />
    </div>
  );
}

function Container94() {
  return (
    <div className="h-[32px] relative shrink-0 w-[248px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[32px] relative w-[248px]">
        <Paragraph52 />
        <Button15 />
        <Container93 />
      </div>
    </div>
  );
}

function Container95() {
  return (
    <div className="bg-slate-100 h-[88.8px] relative shrink-0 w-[280px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#b6c8f1] border-[0.8px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[88.8px] items-start pb-0 pl-[16px] pr-0 pt-[12.8px] relative w-[280px]">
        <Container94 />
      </div>
    </div>
  );
}

function MessageList1() {
  return (
    <div className="absolute bg-slate-100 content-stretch flex flex-col h-[610.4px] items-start left-0 top-0 w-[280px]" data-name="MessageList">
      <Container85 />
      <Container92 />
      <Container95 />
    </div>
  );
}

export default function ReplyMessageV() {
  return (
    <div className="bg-white relative size-full" data-name="自動回應_Reply Message_v0.1">
      <MessageList />
      <MessageList1 />
    </div>
  );
}