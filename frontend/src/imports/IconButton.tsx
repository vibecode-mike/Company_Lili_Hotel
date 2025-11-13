import svgPaths from "./svg-r57x9qnbno";

function DeleteIcon() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Delete Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_8254_138)" id="Delete Icon">
          <g id="Vector"></g>
          <path d={svgPaths.pcbf700} fill="var(--fill-0, #F44336)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_8254_138">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function IconButton() {
  return (
    <div className="bg-[#ffebee] relative rounded-[16px] size-full" data-name="Icon Button">
      <div className="flex flex-row items-center justify-center min-h-inherit min-w-inherit size-full">
        <div className="box-border content-stretch flex items-center justify-center min-h-inherit min-w-inherit p-[8px] relative size-full">
          <DeleteIcon />
        </div>
      </div>
    </div>
  );
}