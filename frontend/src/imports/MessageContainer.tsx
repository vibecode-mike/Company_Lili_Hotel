export default function MessageContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative size-full" data-name="Message Container">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
        <span>{`Hi {好友的顯示名稱`}</span>
        <span>{`}`}</span>
        <span>{` 歡迎加入好友～ 要給你一份首次加入會員的好友禮物呦！`}</span>
      </p>
    </div>
  );
}