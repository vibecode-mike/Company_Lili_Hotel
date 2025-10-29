function Paragraph() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16.938px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18px] relative w-[16.938px]">
        <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">OA</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-white relative rounded-[3.35544e+07px] shrink-0 size-[45px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[45px]">
        <Paragraph />
      </div>
    </div>
  );
}

function CardImage() {
  return (
    <div className="bg-[#edf0f8] h-[240px] relative rounded-[15px] shrink-0 w-full" data-name="Card Image">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[240px] items-center justify-center relative w-full">
        <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[24px] text-center text-nowrap whitespace-pre">上傳圖片</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-[288px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip relative rounded-[inherit] w-[288px]">
        <CardImage />
      </div>
    </div>
  );
}

export default function Container2() {
  return (
    <div className="bg-gradient-to-b from-[#a5d8ff] relative rounded-[20px] size-full to-[#d0ebff]" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[20px] items-start overflow-clip pb-0 pl-[24px] pr-0 pt-[24px] relative size-full">
          <Container />
          <Container1 />
        </div>
      </div>
    </div>
  );
}