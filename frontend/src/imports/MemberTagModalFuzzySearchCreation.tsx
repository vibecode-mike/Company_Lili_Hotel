import svgPaths from "./svg-k8zk0i4lar";
import { ButtonContainer as SharedButtonContainer } from "../components/common/Containers";

function Header() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Header">
      <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[32px]">
        <p className="leading-[1.5]">編輯會員標籤</p>
      </div>
    </div>
  );
}

function SearchContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Search Container">
      <div className="overflow-clip relative shrink-0 size-[32px]" data-name="Search Icon">
        <div className="absolute h-[17.575px] left-[calc(50%-0.2px)] top-[calc(50%-0.212px)] translate-x-[-50%] translate-y-[-50%] w-[17.6px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
            <path d={svgPaths.p29b263c0} fill="var(--fill-0, #A8A8A8)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[20px] text-center text-nowrap whitespace-pre">總統套房｜</p>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-[292px] relative rounded-[16px] shrink-0" data-name="Search Bar">
      <div className="flex flex-row items-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[28px] items-center min-w-inherit px-[12px] py-[8px] relative w-full">
          <SearchContainer />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[36px] items-center relative shrink-0 w-full" data-name="Container">
      <SearchBar />
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Button Container">
      <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">會員標籤</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#6e6e6e] text-[16px] text-center">互動標籤</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <ButtonContainer />
      <Container1 />
    </div>
  );
}

function SelectedTagsContainer() {
  return (
    <div className="content-center flex flex-wrap gap-[4px] items-center relative shrink-0 w-full" data-name="Selected Tags Container">
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px]">消費力高</p>
        <div className="box-border content-stretch flex items-center justify-between overflow-clip p-[3.5px] relative shrink-0 size-[16px]" data-name="Close">
          <div className="absolute aspect-[24/24] left-0 right-0 top-1/2 translate-y-[-50%]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Vector"></g>
            </svg>
          </div>
          <div className="absolute left-[4.5px] size-[6.787px] top-[4.61px]" data-name="Vector">
            <div className="absolute inset-0" style={{ "--fill-0": "rgba(168, 168, 168, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
                <path d={svgPaths.p38a549b0} fill="var(--fill-0, #A8A8A8)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px]">VIP</p>
        <div className="box-border content-stretch flex items-center justify-between overflow-clip p-[3.5px] relative shrink-0 size-[16px]" data-name="Close">
          <div className="absolute aspect-[24/24] left-0 right-0 top-1/2 translate-y-[-50%]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Vector"></g>
            </svg>
          </div>
          <div className="absolute left-[4.5px] size-[6.787px] top-[4.61px]" data-name="Vector">
            <div className="absolute inset-0" style={{ "--fill-0": "rgba(168, 168, 168, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
                <path d={svgPaths.p38a549b0} fill="var(--fill-0, #A8A8A8)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[14px] w-full">
        <p className="leading-[1.5]">已選擇的標籤</p>
      </div>
      <SelectedTagsContainer />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Container2 />
      <Container3 />
    </div>
  );
}

function TagsContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start justify-center relative shrink-0 w-full" data-name="Tags Container">
      <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">總統</p>
      </div>
    </div>
  );
}

function CreateTagsContainer() {
  return (
    <div className="bg-slate-50 relative rounded-[4px] shrink-0 w-full" data-name="Create Tags Container">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center px-[8px] py-[4px] relative w-full">
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[20px] text-center text-nowrap whitespace-pre">建立</p>
          <div className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">總統套房</p>
          </div>
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[20px] text-center text-nowrap whitespace-pre">的標籤</p>
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[14px] w-[410px]">
        <p className="leading-[1.5]">選擇或建立標籤</p>
      </div>
      <TagsContainer />
      <CreateTagsContainer />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-name="Container">
      <Header />
      <Container />
      <Container4 />
      <Container5 />
    </div>
  );
}

// 使用共享 ButtonContainer 组件
function ButtonContainer1() {
  return (
    <SharedButtonContainer justify="end" gap={8}>
      <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">取消</p>
      </div>
      <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">確認</p>
      </div>
    </SharedButtonContainer>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="Container">
      <ButtonContainer1 />
    </div>
  );
}

export default function MemberTagModalFuzzySearchCreation() {
  return (
    <div className="bg-white relative rounded-[16px] size-full" data-name="Member Tag#Modal#Fuzzy Search & Creation">
      <div className="min-h-inherit min-w-inherit size-full">
        <div className="box-border content-stretch flex flex-col gap-[60px] items-start min-h-inherit min-w-inherit p-[32px] relative size-full">
          <Container6 />
          <Container7 />
        </div>
      </div>
    </div>
  );
}