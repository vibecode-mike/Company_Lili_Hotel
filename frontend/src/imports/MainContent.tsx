import svgPaths from "./svg-h3553bgu6p";
import { TitleContainer as SharedTitleContainer, HeaderContainer as SharedHeaderContainer } from "../components/common/Containers";

function TitleTextContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Title Text Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[32px] text-center text-nowrap whitespace-pre">會員資訊</p>
    </div>
  );
}

function TitleWrapper() {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Title Wrapper">
      <TitleTextContainer />
    </div>
  );
}

// 使用共享容器组件替代本地定义

function Icons8Account1() {
  return (
    <div className="absolute left-1/2 size-[49.412px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="icons8-account 1">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
        <g id="icons8-account 1">
          <path d={svgPaths.p32b39980} fill="var(--fill-0, #383838)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame3468593() {
  return (
    <div className="basis-0 bg-[#edf0f8] content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full">
      <div className="relative shrink-0 size-[28px]" data-name="Avatar">
        <Icons8Account1 />
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="absolute bg-[#f6f9fd] content-stretch flex flex-col items-center left-1/2 overflow-clip rounded-[60px] size-[158.824px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Avatar">
      <Frame3468593 />
    </div>
  );
}

function UserName() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="User Name">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">User Name</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="Container">
      <div className="overflow-clip relative shrink-0 size-[180px]" data-name="Avatar">
        <Avatar />
      </div>
      <UserName />
    </div>
  );
}

function Container1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[24px] grow items-center max-w-[360px] min-h-px min-w-px relative self-stretch shrink-0" data-name="Container">
      <Container />
      <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">聊天</p>
      </div>
    </div>
  );
}

function ModalTitle() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">姓名</p>
      </div>
    </div>
  );
}

function Hint() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle />
        <Hint />
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame4815() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">Real Name</p>
    </div>
  );
}

function DropdownItem() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame4815 />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent />
      <DropdownItem />
    </div>
  );
}

function ModalTitleContent1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">生日</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame3468307() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-nowrap whitespace-pre">2000-12-12</p>
    </div>
  );
}

function IconCalendar() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon/Calendar">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon/Calendar">
          <path d={svgPaths.p22990f00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame3468301() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-[282px]">
      <Frame3468307 />
      <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] relative rounded-[8px] shrink-0 size-[28px]" data-name="Tertiary Button/Sizing 28">
        <IconCalendar />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Container">
      <ModalTitleContent1 />
      <div className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-w-[298px] p-[8px] relative rounded-[8px] shrink-0 w-[298px]" data-name="Date-range-picker">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <Frame3468301 />
      </div>
    </div>
  );
}

function ModalTitleContent2() {
  return (
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">生理性別</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Option() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Option">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Radio Button">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[8.333%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p3a58b490} fill="var(--fill-0, #383838)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">男性</p>
        </div>
      </div>
    </div>
  );
}

function Option1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Option">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Radio Button">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[8.333%]" data-name="Vector">
          <div className="absolute inset-0" style={{ "--fill-0": "rgba(15, 107, 235, 1)" } as React.CSSProperties}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <path d={svgPaths.p3a58b490} fill="var(--fill-0, #0F6BEB)" id="Vector" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-[29.167%]" data-name="Vector">
          <div className="absolute inset-0" style={{ "--fill-0": "rgba(15, 107, 235, 1)" } as React.CSSProperties}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
              <path d={svgPaths.p46c6500} fill="var(--fill-0, #0F6BEB)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">女性</p>
        </div>
      </div>
    </div>
  );
}

function Option2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Option">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Radio Button">
        <div className="absolute inset-0" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector"></g>
          </svg>
        </div>
        <div className="absolute inset-[8.333%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p3a58b490} fill="var(--fill-0, #383838)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">不透露</p>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="basis-0 content-center flex flex-wrap gap-[16px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Container">
      <Option />
      <Option1 />
      <Option2 />
    </div>
  );
}

function DropdownItem2() {
  return (
    <div className="basis-0 content-stretch flex grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <ModalTitleContent2 />
      <Container3 />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex gap-[20px] h-[44px] items-center relative shrink-0 w-[604px]" data-name="Container">
      <DropdownItem2 />
    </div>
  );
}

function DropdownItem3() {
  return (
    <div className="content-start flex flex-wrap gap-[40px] items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <Container2 />
      <Container4 />
    </div>
  );
}

function ModalTitleContent3() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">居住地</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame4816() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">台北市</p>
    </div>
  );
}

function DropdownItem4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame4816 />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem5() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent3 />
      <DropdownItem4 />
    </div>
  );
}

function ModalTitle1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">手機號碼</p>
      </div>
    </div>
  );
}

function Hint1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent4() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle1 />
        <Hint1 />
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame4817() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">0909000000</p>
    </div>
  );
}

function DropdownItem6() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame4817 />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem7() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent4 />
      <DropdownItem6 />
    </div>
  );
}

function ModalTitle2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">Email</p>
      </div>
    </div>
  );
}

function Hint2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent5() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle2 />
        <Hint2 />
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame4818() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">info@mail.com</p>
    </div>
  );
}

function DropdownItem8() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame4818 />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem9() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent5 />
      <DropdownItem8 />
    </div>
  );
}

function ModalTitleContent6() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">身分證字號</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame4819() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">IDDDDD090909</p>
    </div>
  );
}

function DropdownItem10() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame4819 />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem11() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent6 />
      <DropdownItem10 />
    </div>
  );
}

function ModalTitleContent7() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">護照號碼</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame4820() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">399999999</p>
    </div>
  );
}

function DropdownItem12() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame4820 />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem13() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent7 />
      <DropdownItem12 />
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-name="Container">
      <DropdownItem1 />
      <DropdownItem3 />
      <DropdownItem5 />
      <DropdownItem7 />
      <DropdownItem9 />
      <DropdownItem11 />
      <DropdownItem13 />
    </div>
  );
}

function TitleAndContent() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Title and Content">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">加入來源</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">LINE (LINE UID: 000000000)</p>
        </div>
      </div>
    </div>
  );
}

function TitleAndContent1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Title and Content">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">建立時間</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">2025-01-01</p>
        </div>
      </div>
    </div>
  );
}

function TitleAndContent2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Title and Content">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">最近聊天時間</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">2025-08-08</p>
        </div>
      </div>
    </div>
  );
}

function TitleAndContent3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Title and Content">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">會員 ID</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">000000001</p>
        </div>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <TitleAndContent />
      <TitleAndContent1 />
      <TitleAndContent2 />
      <TitleAndContent3 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-name="Container">
      <Container5 />
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1062 1">
            <line id="Line 3" stroke="var(--stroke-0, #E1EBF9)" strokeLinecap="round" x1="0.5" x2="1061.5" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <Container6 />
    </div>
  );
}

function Container8() {
  return (
    <div className="relative rounded-[20px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[28px] relative w-full">
          <Container7 />
        </div>
      </div>
    </div>
  );
}

function ModalTitleContent8() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">會員標籤</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-center flex flex-wrap gap-[4px] items-center relative shrink-0" data-name="Container">
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">消費力高</p>
      </div>
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">VIP</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <ModalTitleContent8 />
      <Container9 />
    </div>
  );
}

function ModalTitleContent9() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">互動標籤</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-center flex flex-wrap gap-[4px] items-center relative shrink-0" data-name="Container">
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">優惠活動</p>
      </div>
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">限時折扣</p>
      </div>
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">滿額贈品</p>
      </div>
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">會員專屬優惠</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <ModalTitleContent9 />
      <Container11 />
    </div>
  );
}

function Container13() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[20px] grow h-full items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container10 />
      <Container12 />
    </div>
  );
}

function Group() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <div className="absolute bottom-0 left-[-0.03%] right-0 top-[-0.01%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group1 />
      <Group2 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group3 />
    </div>
  );
}

function ModeEdit() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group />
      <Group4 />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex gap-[10px] h-full items-end relative shrink-0" data-name="Container">
      <div className="relative rounded-[12px] shrink-0 size-[28px]" data-name="Button/Edit">
        <ModeEdit />
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[140px] relative rounded-[20px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex h-[140px] items-start justify-between p-[28px] relative w-full">
          <Container13 />
          <Container14 />
        </div>
      </div>
    </div>
  );
}

function Group5() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <div className="absolute bottom-0 left-[-0.03%] right-0 top-[-0.01%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group6 />
      <Group7 />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group8 />
    </div>
  );
}

function ModeEdit1() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group5 />
      <Group9 />
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex gap-[10px] items-end relative self-stretch shrink-0" data-name="Container">
      <div className="relative rounded-[12px] shrink-0 size-[28px]" data-name="Button/Edit">
        <ModeEdit1 />
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="basis-0 content-stretch flex gap-[12px] grow items-start min-h-[96px] min-w-px relative shrink-0" data-name="Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">輸入會員備註，如：喜好、重要紀錄或追蹤事項。</p>
      <Container16 />
    </div>
  );
}

function TextArea() {
  return (
    <div className="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[20px] shrink-0" data-name="Text area">
      <div className="flex flex-row justify-end min-h-inherit size-full">
        <div className="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] relative w-full">
          <Container17 />
        </div>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex gap-[32px] items-start relative rounded-[20px] shrink-0 w-full" data-name="Container">
      <TextArea />
    </div>
  );
}

function Container19() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[32px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container8 />
      <Container15 />
      <Container18 />
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Container19 />
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[0px] text-[12px] text-center text-nowrap whitespace-pre">
        <span>{`共 0 `}</span>
        <span className="tracking-[-0.12px]">筆</span>
      </p>
    </div>
  );
}

function Container22() {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Container">
      <Container21 />
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Container22 />
    </div>
  );
}

function Container24() {
  return (
    <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">消費時間</p>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">金額</p>
                </div>
                <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
                  <div className="absolute inset-0" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                      <g id="Vector"></g>
                    </svg>
                  </div>
                  <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                      <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">房型或套餐</p>
                </div>
                <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
                  <div className="absolute inset-0" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                      <g id="Vector"></g>
                    </svg>
                  </div>
                  <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                      <path d={svgPaths.p24dcb900} fill="var(--fill-0, #6E6E6E)" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">業務來源</p>
                </div>
                <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Sorting">
                  <div className="absolute inset-0" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                      <g id="Vector"></g>
                    </svg>
                  </div>
                  <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
                      <path d={svgPaths.p24dcb900} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative shrink-0 w-full" data-name="Container">
      <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">串接系統</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start justify-center min-h-[200px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#a8a8a8] text-[14px] text-center w-full">
        <p className="leading-[1.5]">尚無消費紀錄</p>
      </div>
      <Container25 />
    </div>
  );
}

function Container27() {
  return (
    <div className="bg-white relative rounded-bl-[16px] rounded-br-[16px] shrink-0 w-full" data-name="Container">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-center pb-[16px] pt-[12px] px-[12px] relative w-full">
          <Container26 />
        </div>
      </div>
    </div>
  );
}

function Table8Columns3Actions() {
  return (
    <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[1510px]" data-name="Table/8 Columns+3 Actions">
      <Container24 />
      <Container27 />
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container23 />
      <Table8Columns3Actions />
    </div>
  );
}

export default function MainContent() {
  return (
    <div className="relative size-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative size-full">
          <SharedHeaderContainer>
            <SharedTitleContainer>
              <TitleWrapper />
            </SharedTitleContainer>
          </SharedHeaderContainer>
          <Container20 />
          <Container28 />
        </div>
      </div>
    </div>
  );
}