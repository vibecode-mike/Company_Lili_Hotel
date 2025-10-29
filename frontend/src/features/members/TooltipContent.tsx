export default function TooltipContent() {
  return (
    <div className="bg-[#383838] relative rounded-[8px] size-full" data-name="Tooltip">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[12px] text-center text-nowrap text-white whitespace-pre">
            依據用戶在訊息或按鈕上的互動行為自動生成，或是自行設定
          </p>
        </div>
      </div>
    </div>
  );
}

