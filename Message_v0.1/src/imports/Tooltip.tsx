export default function Tooltip() {
  return (
    <div className="bg-[#383838] relative rounded-[8px] size-full" data-name="Tooltip">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[12px] text-center text-nowrap text-white whitespace-pre">建立訊息關鍵字，當顧客提及則觸發系統回覆</p>
        </div>
      </div>
    </div>
  );
}