interface ButtonProps {
  onClick?: () => void;
}

export default function Button({ onClick }: ButtonProps = {}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-[#242424] relative rounded-[16px] size-full cursor-pointer hover:bg-[#383838] active:bg-[#181818] transition-colors" 
      data-name="Button"
    >
      <div className="flex flex-row items-center justify-center min-h-inherit min-w-inherit size-full">
        <div className="box-border content-stretch flex items-center justify-center min-h-inherit min-w-inherit px-[12px] py-[8px] relative size-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">聊天</p>
        </div>
      </div>
    </div>
  );
}