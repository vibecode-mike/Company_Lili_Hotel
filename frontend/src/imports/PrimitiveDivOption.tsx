interface OptionProps {
  text: string;
}

export function Option({ text }: OptionProps) {
  return (
    <div className="h-0 relative shrink-0 w-full" data-name="Option">
      <p className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[normal] left-0 not-italic text-[14px] text-neutral-950 top-0 tracking-[-0.1504px] w-0">
        {text}
      </p>
    </div>
  );
}
