function BreadcrumbModule() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0" data-name="Breadcrumb Module">
      <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Breadcrumb-atomic">
        <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">自動回應訊息</p>
      </div>
    </div>
  );
}

export default function Breadcrumb() {
  return (
    <div className="relative size-full" data-name="Breadcrumb">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative size-full">
          <BreadcrumbModule />
        </div>
      </div>
    </div>
  );
}