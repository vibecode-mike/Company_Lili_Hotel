import svgPaths from "./svg-medgmjzcf9";

function HeaderText() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Header Text">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">編輯自動回應</p>
      </div>
    </div>
  );
}

function DeleteIcon() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Delete Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_8254_74)" id="Delete Icon">
          <g id="Vector"></g>
          <path d={svgPaths.pcbf700} fill="var(--fill-0, #6E6E6E)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8254_74">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconButton() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center p-[8px] relative rounded-[16px] shrink-0" data-name="Icon Button">
      <DeleteIcon />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">儲存</p>
    </div>
  );
}

function ModalFooter() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0" data-name="Modal Footer">
      <Button />
    </div>
  );
}

export default function HeaderContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-start relative size-full" data-name="Header Container">
      <HeaderText />
      <IconButton />
      <ModalFooter />
    </div>
  );
}