function CardDescription() {
  return (
    <div className="relative shrink-0 w-full" data-name="Card Description">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-white">
            <span>{`Hi {好友的顯示名稱`}</span>
            <span>{`}`}</span>
            <span>{` 歡迎加入好友～ 要給你一份首次加入會員的好友禮物呦！`}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function TemplateTextOnly() {
  return (
    <div className="bg-[#383838] content-stretch flex flex-col items-center max-w-[288px] overflow-clip relative rounded-[15px] shrink-0 w-[288px]" data-name="Template#Text only">
      <CardDescription />
    </div>
  );
}

function MessageCard() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0" data-name="Message Card">
      <TemplateTextOnly />
    </div>
  );
}

function Tag() {
  return (
    <div className="absolute bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center left-[37px] min-w-[32px] px-[4px] py-[2px] rounded-[8px] top-[14px]" data-name="Tag">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">好友的顯示名稱</p>
    </div>
  );
}

function MessageCard1() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0" data-name="Message Card">
      <MessageCard />
      <Tag />
    </div>
  );
}

export default function MessageCard2() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative size-full" data-name="Message Card">
      <MessageCard1 />
    </div>
  );
}