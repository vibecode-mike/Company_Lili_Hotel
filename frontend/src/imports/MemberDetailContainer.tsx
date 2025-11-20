import React, { useState } from "react";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format } from "date-fns";
import svgPaths from "./svg-xineuqq0wy";
import svgPathsConsumption from "./svg-h3553bgu6p";
import ModeEdit from "./ModeEdit";
import ButtonEdit from "./ButtonEdit";
import ButtonEditAvatar from "./ButtonEdit-8025-230";
import ChatButton from "./Button-8027-97";
import MemberNoteEditor from "../components/shared/MemberNoteEditor";
import { toast } from "sonner";
import { useToast } from "../components/ToastProvider";
import MemberTagEditModal from "../components/MemberTagEditModal";
import { TitleContainer as SharedTitleContainer, HeaderContainer as SharedHeaderContainer } from "../components/common/Containers";
import { SimpleBreadcrumb } from "../components/common/Breadcrumb";
import { useMembers } from "../contexts/MembersContext";
import { useAuth } from "../components/auth/AuthContext";

/**
 * 會員詳情頁面組件
 * 
 * 用途：顯示和編輯單個會員的詳細資訊
 * 功能：頭像上傳、標籤編輯、備註、消費記錄等
 * 使用位置：
 * - App.tsx (作為 MainContainer - 需重構命名)
 * - MessageList.tsx (作為 AddMemberContainer)
 * 
 * 注意：此文件名為 Figma 導入時自動生成的名稱
 */



function TitleTextContainer() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Title Text Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[32px] text-center text-nowrap whitespace-pre">會員資訊</p>
    </div>
  );
}

function TitleWrapper() {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Title Wrapper">
      <TitleTextContainer />
    </div>
  );
}

// 使用共享容器组件替代本地定义

function Icons8Account() {
  return (
    <div className="size-12" data-name="icons8-account 1">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
        <g id="icons8-account 1">
          <path d={svgPaths.p32b39980} fill="var(--fill-0, #383838)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame8({ lineAvatar }: { lineAvatar?: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast('圖片大小不能超過 5MB', 'error');
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          showToast('請選擇圖片檔案', 'error');
          return;
        }

        // Simulate backend API call
        // await uploadAvatar(file);
        showToast('儲存成功', 'success');
      } catch (error) {
        showToast('儲存失敗', 'error');
      }
    }
  };

  return (
    <div
      className="relative flex items-center justify-center size-[180px] rounded-full bg-[#EDF2F8] cursor-pointer overflow-hidden transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Display LINE Avatar or Default Icon */}
      {lineAvatar ? (
        <img
          src={lineAvatar}
          alt="會員頭像"
          className="w-full h-full object-cover"
        />
      ) : (
        <Icons8Account />
      )}

      {/* Hover/Pressed Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: isPressed
            ? 'rgba(56, 56, 56, 0.5)'
            : 'rgba(56, 56, 56, 0.3)',
        }}
      >
        <div
          className={`flex items-center justify-center size-[60px] transition-transform duration-150 ease-in-out ${
            isPressed ? 'scale-95' : isHovered ? 'scale-[2]' : 'scale-100'
          }`}
        >
          <ButtonEditAvatar className="w-[60px] h-[60px]" />
        </div>
      </div>
    </div>
  );
}

function Avatar({ member }: { member?: MemberData }) {
  return <Frame8 lineAvatar={member?.lineAvatar} />;
}

function Container({ member }: { member?: MemberData }) {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">{member?.username || 'User Name'}</p>
      </div>
    </div>
  );
}

function Container1({ member, onNavigate }: { member?: MemberData; onNavigate?: (page: string, params?: { memberId?: string }) => void }) {
  const handleChatClick = () => {
    onNavigate?.("chat-room", { memberId: member?.id });
  };

  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="Container">
      <div className="relative shrink-0 size-[180px] rounded-full" data-name="Avatar">
        <Avatar member={member} />
      </div>
      <Container member={member} />
      <div 
        className="relative shrink-0 h-[48px] w-[72px] mt-[8px]"
      >
        <ChatButton onClick={handleChatClick} />
      </div>
    </div>
  );
}

function Container2({ member, onNavigate }: { member?: MemberData; onNavigate?: (page: string, params?: { memberId?: string }) => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[24px] grow items-center max-w-[360px] min-h-px min-w-px relative self-stretch shrink-0" data-name="Container">
      <Container1 member={member} onNavigate={onNavigate} />
    </div>
  );
}

function ModalTitle() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">姓名</p>
      </div>
    </div>
  );
}

function Hint() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle />
        <Hint />
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <input 
        type="text"
        placeholder="輸入姓名"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
      />
    </div>
  );
}

function DropdownItem({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame value={value} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem1({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[auto_1fr] gap-[8px] 2xl:gap-x-2 2xl:gap-y-0 relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent />
      <DropdownItem value={value} onChange={onChange} />
    </div>
  );
}

function ModalTitleContent1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">生日</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function IconCalendar() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon/Calendar">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon/Calendar">
          <path d={svgPaths.p22990f00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container3({ value, onChange }: { value?: string; onChange: (value?: string) => void }) {
  const parseDate = (input?: string) => {
    if (!input) return undefined;
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const [date, setDate] = useState<Date | undefined>(parseDate(value));

  React.useEffect(() => {
    setDate(parseDate(value));
  }, [value]);

  const handleSelect = (selectedDate?: Date) => {
    setDate(selectedDate);
    if (selectedDate) {
      onChange(selectedDate.toISOString().split("T")[0]);
    } else {
      onChange(undefined);
    }
  };

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[auto_1fr] gap-[8px] 2xl:gap-x-2 2xl:gap-y-0 relative shrink-0 w-full md:w-auto" data-name="Container">
      <ModalTitleContent1 />
      <Popover>
        <PopoverTrigger asChild>
          <div className="bg-white cursor-pointer hover:border-[#0f6beb] box-border content-stretch flex flex-col gap-[4px] items-start justify-center p-[8px] relative rounded-[8px] shrink-0 w-full max-w-[298px]" data-name="Date-range-picker">
            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
            <div className="content-stretch flex items-center relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-0 relative shrink-0 pr-10">
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[16px] text-nowrap whitespace-pre" style={{ color: date ? '#383838' : '#a8a8a8' }}>
                  {date ? format(date, "yyyy/MM/dd") : "選擇年/月/日"}
                </p>
              </div>
              <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] absolute right-2 top-1/2 -translate-y-1/2 rounded-[8px] shrink-0 size-[28px]" data-name="Tertiary Button/Sizing 28">
                <IconCalendar />
              </div>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={(currentDate) => currentDate > new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ModalTitleContent2() {
  return (
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">生理性別</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Option({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <div 
      className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
      data-name="Option"
      onClick={onClick}
    >
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Radio Button">
        {selected ? (
          <>
            <div className="absolute inset-0" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="11" stroke="#0F6BEB" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div className="absolute inset-0" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" fill="#0F6BEB" />
              </svg>
            </div>
          </>
        ) : (
          <div className="absolute inset-0" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" stroke="#D1D1D1" strokeWidth="2" fill="none" />
            </svg>
          </div>
        )}
      </div>
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{label}</p>
        </div>
      </div>
    </div>
  );
}

function Container4({ value, onChange }: { value?: string | null; onChange: (value: string) => void }) {
  const normalized = value ?? 'undisclosed';

  return (
    <div className="flex flex-wrap gap-[16px] items-center content-center justify-start relative min-w-0 max-w-full" data-name="Container">
      <Option
        selected={normalized === 'male'}
        onClick={() => onChange('male')}
        label="男性"
      />
      <Option
        selected={normalized === 'female'}
        onClick={() => onChange('female')}
        label="女性"
      />
      <Option
        selected={normalized === 'undisclosed'}
        onClick={() => onChange('undisclosed')}
        label="不透露"
      />
    </div>
  );
}

function DropdownItem2({ value, onChange }: { value?: string | null; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[auto_1fr] gap-[8px] 2xl:gap-x-2 2xl:gap-y-0 min-h-px min-w-px relative" data-name="Dropdown Item">
      <ModalTitleContent2 />
      <Container4 value={value} onChange={onChange} />
    </div>
  );
}

function Container5({ gender, onChange }: { gender?: string | null; onChange: (value: string) => void }) {
  return (
    <div className="basis-0 content-stretch flex gap-[20px] grow items-center min-h-px min-w-px relative self-stretch shrink-0" data-name="Container">
      <DropdownItem2 value={gender} onChange={onChange} />
    </div>
  );
}

function DropdownItem3({
  birthday,
  onBirthdayChange,
  gender,
  onGenderChange,
}: {
  birthday?: string;
  onBirthdayChange: (value?: string) => void;
  gender?: string | null;
  onGenderChange: (value: string) => void;
}) {
  return (
    <div className="content-stretch flex flex-wrap gap-[20px] md:gap-[40px] items-start relative shrink-0 w-full" data-name="Dropdown Item">
      <Container3 value={birthday} onChange={onBirthdayChange} />
      <Container5 gender={gender} onChange={onGenderChange} />
    </div>
  );
}

function ModalTitleContent3() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">居住地</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame1({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <input
        type="text"
        placeholder="輸入居住縣市"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
      />
    </div>
  );
}

function DropdownItem4({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame1 value={value} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem5({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[auto_1fr] gap-[8px] 2xl:gap-x-2 2xl:gap-y-0 relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent3 />
      <DropdownItem4 value={value} onChange={onChange} />
    </div>
  );
}

function ModalTitle1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">手機號碼</p>
      </div>
    </div>
  );
}

function Hint1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent4() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle1 />
        <Hint1 />
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame2({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <input 
        type="tel"
        placeholder="輸入手機號碼"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
      />
    </div>
  );
}

function DropdownItem6({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame2 value={value} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem7({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[auto_1fr] gap-[8px] 2xl:gap-x-2 2xl:gap-y-0 relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent4 />
      <DropdownItem6 value={value} onChange={onChange} />
    </div>
  );
}

function ModalTitle2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">Email</p>
      </div>
    </div>
  );
}

function Hint2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Hint">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
        <p className="leading-[1.5] whitespace-pre">*</p>
      </div>
    </div>
  );
}

function ModalTitleContent5() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <ModalTitle2 />
        <Hint2 />
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame3({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <input 
        type="email"
        placeholder="example@mail.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
      />
    </div>
  );
}

function DropdownItem8({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame3 value={value} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem9({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[auto_1fr] gap-[8px] 2xl:gap-x-2 2xl:gap-y-0 relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent5 />
      <DropdownItem8 value={value} onChange={onChange} />
    </div>
  );
}

function ModalTitleContent6() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">身分證字號</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame4({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <input
        type="text"
        placeholder="輸入身分證字號"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
      />
    </div>
  );
}

function DropdownItem10({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame4 value={value} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem11({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[auto_1fr] gap-[8px] 2xl:gap-x-2 2xl:gap-y-0 relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent6 />
      <DropdownItem10 value={value} onChange={onChange} />
    </div>
  );
}

function ModalTitleContent7() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">護照號碼</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame5({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <input
        type="text"
        placeholder="輸入外籍人士護照號碼"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
      />
    </div>
  );
}

function DropdownItem12({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Dropdown Item">
      <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full" data-name="Text area">
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-col justify-center min-h-inherit size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
            <Frame5 value={value} onChange={onChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem13({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[auto_1fr] gap-[8px] 2xl:gap-x-2 2xl:gap-y-0 relative shrink-0 w-full" data-name="Dropdown Item">
      <ModalTitleContent7 />
      <DropdownItem12 value={value} onChange={onChange} />
    </div>
  );
}

function Container6({ member, onMemberUpdate }: { member?: MemberData; onMemberUpdate?: (member: MemberData) => void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [realName, setRealName] = React.useState(member?.realName || "");
  const [phone, setPhone] = React.useState(member?.phone || "");
  const [email, setEmail] = React.useState(member?.email || "");
  const [idNumber, setIdNumber] = React.useState(member?.id_number || "");
  const [residence, setResidence] = React.useState(member?.residence || "");
  const [passportNumber, setPassportNumber] = React.useState(member?.passport_number || "");
  const [birthday, setBirthday] = React.useState<string | undefined>(member?.birthday || undefined);
  const normalizeGender = (gender?: string | null): string | null => {
    if (!gender) return null;
    if (gender === "1" || gender === "male") return "male";
    if (gender === "2" || gender === "female") return "female";
    if (gender === "0" || gender === "undisclosed") return "undisclosed";
    return null;
  };
  const [gender, setGender] = React.useState<string | null>(normalizeGender(member?.gender));
  const { showToast } = useToast();
  const { fetchMemberById } = useMembers();
  const { logout } = useAuth();

  React.useEffect(() => {
    console.log('=== useEffect triggered, member prop changed ===');
    console.log('member.gender:', member?.gender);
    if (member) {
      setRealName(member.realName);
      setPhone(member.phone);
      setEmail(member.email);
      setIdNumber(member.id_number || "");
      setResidence(member.residence || "");
      setPassportNumber(member.passport_number || "");
      setBirthday(member.birthday || undefined);
      const normalized = normalizeGender(member.gender);
      console.log('Setting gender from useEffect:', { raw: member.gender, normalized });
      setGender(normalized);
    }
  }, [member]);

  const handleCancel = () => {
    if (member) {
      setRealName(member.realName);
      setPhone(member.phone);
      setEmail(member.email);
      setIdNumber(member.id_number || "");
      setResidence(member.residence || "");
      setPassportNumber(member.passport_number || "");
      setBirthday(member.birthday || undefined);
      setGender(normalizeGender(member.gender));
    }
    setIsEditing(false);
  };

  const mapGenderToPayload = (value: string | null): string | undefined => {
    if (!value) return undefined;
    if (value === "male") return "1";
    if (value === "female") return "2";
    if (value === "undisclosed") return "0";
    return undefined;
  };

  const sanitize = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  };

  const handleSave = async () => {
    if (!member?.id) {
      showToast("找不到會員資料，無法儲存", "error");
      return;
    }

    if (!realName.trim()) {
      showToast("請輸入姓名", "error");
      return;
    }

    const token = localStorage.getItem("auth_token");

    const payload: Record<string, any> = {
      name: realName.trim(),
      phone: sanitize(phone),
      email: sanitize(email),
      id_number: sanitize(idNumber),
      residence: sanitize(residence),
      passport_number: sanitize(passportNumber),
      birthday: birthday || null,
      gender: mapGenderToPayload(gender),
    };

    setIsSaving(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/v1/members/${member.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        showToast("登入已過期，請重新登入", "error");
        logout();
        return;
      }

      if (!response.ok) {
        let errorMessage = "儲存失敗";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }

      // 直接使用本地狀態更新,不重新抓取資料
      const updatedMember = {
        ...member,
        name: realName.trim(),
        realName: realName.trim(),
        phone: phone || null,
        email: email || null,
        id_number: idNumber || null,
        residence: residence || null,
        passport_number: passportNumber || null,
        birthday: birthday || null,
        gender: mapGenderToPayload(gender) || member.gender,
      };

      onMemberUpdate?.(updatedMember);

      setIsEditing(false);
      showToast("儲存成功", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "儲存失敗";
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full"
      data-name="Container"
      onClick={() => !isSaving && setIsEditing(true)}
    >
      <DropdownItem1 value={realName} onChange={setRealName} />
      <DropdownItem3
        birthday={birthday}
        onBirthdayChange={setBirthday}
        gender={gender}
        onGenderChange={setGender}
      />
      <DropdownItem5 value={residence} onChange={setResidence} />
      <DropdownItem7 value={phone} onChange={setPhone} />
      <DropdownItem9 value={email} onChange={setEmail} />
      <DropdownItem11 value={idNumber} onChange={setIdNumber} />
      <DropdownItem13 value={passportNumber} onChange={setPassportNumber} />

      {isEditing && (
        <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-full" data-name="Modal Footer">
          <button
                type="button"
            className="bg-[#f0f6ff] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-60"
            data-name="Modal Button"
            onClick={(e) => {
              e.stopPropagation();
              if (isSaving) return;
              handleCancel();
            }}
            disabled={isSaving}
          >
            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">取消</p>
          </button>
          <button
                type="button"
            className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-60"
            data-name="Modal Button"
            onClick={(e) => {
              e.stopPropagation();
              if (isSaving) return;
              handleSave();
            }}
            disabled={isSaving}
          >
            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">
              {isSaving ? "儲存中..." : "儲存變更"}
            </p>
          </button>
        </div>
      )}
    </div>
  );
}

function Container7({ member }: { member?: MemberData }) {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">加入來源</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">LINE (LINE UID: {member?.lineUid || '未提供'})</p>
        </div>
      </div>
    </div>
  );
}

function Container8({ member }: { member?: MemberData }) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    try {
      return new Date(dateString).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '無效日期';
    }
  };

  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">建立時間</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{formatDate(member?.createTime)}</p>
        </div>
      </div>
    </div>
  );
}

function Container9({ member }: { member?: MemberData }) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    try {
      return new Date(dateString).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '無效日期';
    }
  };

  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">最近聊天時間</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{formatDate(member?.lastChatTime)}</p>
        </div>
      </div>
    </div>
  );
}

function Container10({ member }: { member?: MemberData }) {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
        <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
          <p className="leading-[1.5]">會員 ID</p>
        </div>
      </div>
      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{member?.id || '未提供'}</p>
        </div>
      </div>
    </div>
  );
}

function Container11({ member }: { member?: MemberData }) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Container7 member={member} />
      <Container8 member={member} />
      <Container9 member={member} />
      <Container10 member={member} />
    </div>
  );
}

function Container12({ member, onMemberUpdate }: { member?: MemberData; onMemberUpdate?: (member: MemberData) => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-name="Container">
      <Container6 member={member} onMemberUpdate={onMemberUpdate} />
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1062 1">
            <line id="Line 3" stroke="var(--stroke-0, #E1EBF9)" strokeLinecap="round" x1="0.5" x2="1061.5" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <Container11 member={member} />
    </div>
  );
}

function Container13({ member, onMemberUpdate }: { member?: MemberData; onMemberUpdate?: (member: MemberData) => void }) {
  return (
    <div className="relative rounded-[20px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[16px] md:p-[28px] relative w-full">
          <Container12 member={member} onMemberUpdate={onMemberUpdate} />
        </div>
      </div>
    </div>
  );
}

function ModalTitleContent8() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">會員標籤</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2 items-start content-start relative min-w-0 max-w-full" data-name="Container">
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[14px] text-center">消費力高</p>
      </div>
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[14px] text-center">VIP</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="grid gap-y-4 lg:grid-cols-[auto,1fr] items-start w-full min-w-0" data-name="Container">
      <ModalTitleContent8 />
      <Container14 />
    </div>
  );
}

function ModalTitleContent9() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0" data-name="Modal/Title&Content">
      <div className="content-stretch flex items-center relative shrink-0" data-name="Modal/Title&Content">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">互動標籤</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]" data-name="Action Button Info Icon">
        <div className="absolute inset-[16.667%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2 items-start content-start relative min-w-0 max-w-full" data-name="Container">
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[14px] text-center">優惠活動</p>
      </div>
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[14px] text-center">限時折扣</p>
      </div>
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[14px] text-center">滿額贈品</p>
      </div>
      <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[14px] text-center">會員專屬優惠</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="grid gap-y-4 lg:grid-cols-[auto,1fr] items-start w-full min-w-0" data-name="Container">
      <ModalTitleContent9 />
      <Container16 />
    </div>
  );
}

function Container18() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[20px] grow h-auto items-start min-w-0 relative shrink-0" data-name="Container">
      <Container15 />
      <Container17 />
    </div>
  );
}

function Group() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <div className="absolute bottom-0 left-[-0.03%] right-0 top-[-0.01%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group1 />
      <Group2 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group3 />
    </div>
  );
}

function ModeEdit() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group />
      <Group4 />
    </div>
  );
}

function Container19({ onClick, isEditing }: { onClick?: () => void; isEditing?: boolean }) {
  if (isEditing) return null;
  
  return (
    <div className="absolute bottom-[28px] right-[28px]" data-name="Container">
      <div 
        onClick={onClick}
        className="relative shrink-0 size-[28px] cursor-pointer hover:opacity-80 transition-opacity"
      >
        <ButtonEdit />
      </div>
    </div>
  );
}

function SaveCancelButtonsTags({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-[8px] items-center justify-end mt-[20px] w-full" data-name="Modal Footer">
      <div 
        className="bg-[#f0f6ff] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
        data-name="Modal Button"
        onClick={onCancel}
      >
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">取消</p>
      </div>
      <div 
        className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
        data-name="Modal Button"
        onClick={onSave}
      >
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">儲存變更</p>
      </div>
    </div>
  );
}

function Container20({ member }: { member?: MemberData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberTags, setMemberTags] = useState<string[]>(member?.memberTags || []); // ✅ 使用真實數據
  const [interactionTags, setInteractionTags] = useState<string[]>(member?.interactionTags || []); // ✅ 使用真實數據
  const { showToast } = useToast();

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleSave = async (newMemberTags: string[], newInteractionTags: string[]): Promise<boolean> => {
    try {
      // Simulate backend API call
      // await saveMemberTags(member?.id, newMemberTags, newInteractionTags);
      setMemberTags(newMemberTags);
      setInteractionTags(newInteractionTags);
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <>
      <div className="relative rounded-[20px] shrink-0 w-full h-auto overflow-visible" data-name="Container">
        <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
        <div className="size-full">
          <div className="box-border content-stretch flex flex-col h-auto items-start p-[28px] relative w-full">
            <div className="basis-0 content-stretch flex flex-col gap-[20px] grow h-auto items-start min-w-0 relative shrink-0" data-name="Container">
              {/* Member Tags Section */}
              <div className="grid gap-y-4 lg:grid-cols-[auto,1fr] items-start w-full min-w-0" data-name="Container">
                <ModalTitleContent8 />
                <div className="flex flex-wrap gap-x-3 gap-y-2 items-start content-start relative min-w-0 max-w-full" data-name="Container">
                  {memberTags.map((tag, index) => (
                    <div key={index} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
                      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[14px] text-center">{tag}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interaction Tags Section */}
              <div className="grid gap-y-4 lg:grid-cols-[auto,1fr] items-start w-full min-w-0" data-name="Container">
                <ModalTitleContent9 />
                <div className="flex flex-wrap gap-x-3 gap-y-2 items-start content-start relative min-w-0 max-w-full" data-name="Container">
                  {interactionTags.map((tag, index) => (
                    <div key={index} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
                      <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[14px] text-center">{tag}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Container19 onClick={handleEdit} isEditing={false} />
          </div>
        </div>
      </div>
      
      <MemberTagEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMemberTags={memberTags}
        initialInteractionTags={interactionTags}
        onSave={handleSave}
      />
    </>
  );
}

function Group5() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <div className="absolute bottom-0 left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <div className="absolute bottom-0 left-[-0.03%] right-0 top-[-0.01%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group6 />
      <Group7 />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group8 />
    </div>
  );
}

function ModeEdit1() {
  return (
    <div className="absolute left-[5.6px] overflow-clip size-[16.8px] top-[5.6px]" data-name="Mode edit">
      <Group5 />
      <Group9 />
    </div>
  );
}

function Container23({ member }: { member?: MemberData }) {
  return (
    <div className="basis-0 content-stretch flex gap-[32px] grow items-start min-h-px min-w-px relative rounded-[20px] shrink-0" data-name="Container">
      <MemberNoteEditor initialValue={member?.internal_note || ''} />
    </div>
  );
}

function Container24({ member }: { member?: MemberData }) {
  return (
    <div className="content-stretch flex gap-[32px] items-start relative rounded-[20px] shrink-0 w-full" data-name="Container">
      <Container23 member={member} />
    </div>
  );
}

function Container25({ member, onMemberUpdate }: { member?: MemberData; onMemberUpdate?: (member: MemberData) => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[32px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container13 member={member} onMemberUpdate={onMemberUpdate} />
      <Container20 member={member} />
      <Container24 member={member} />
    </div>
  );
}

function Container26({ member, onNavigate, onMemberUpdate }: { member?: MemberData; onNavigate?: (page: string, params?: { memberId?: string }) => void; onMemberUpdate?: (member: MemberData) => void }) {
  return (
    <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full" data-name="Container">
      <Container2 member={member} onNavigate={onNavigate} />
      <Container25 member={member} onMemberUpdate={onMemberUpdate} />
    </div>
  );
}

// Consumption Records Section Components
function ConsumptionRecordCount({ count }: { count: number }) {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Container">
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[0px] text-[12px] text-center text-nowrap whitespace-pre">
        <span>{`共 ${count} `}</span>
        <span className="tracking-[-0.12px]">筆</span>
      </p>
    </div>
  );
}

function ConsumptionRecordCountWrapper({ count }: { count: number }) {
  return (
    <div className="box-border content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0" data-name="Container">
      <ConsumptionRecordCount count={count} />
    </div>
  );
}

function ConsumptionRecordTitle({ count }: { count: number }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <ConsumptionRecordCountWrapper count={count} />
    </div>
  );
}

type SortField = 'amount' | 'package' | 'source' | null;
type SortOrder = 'asc' | 'desc';

function ConsumptionTableHeader({ 
  sortField, 
  sortOrder, 
  onSort 
}: { 
  sortField: SortField; 
  sortOrder: SortOrder; 
  onSort: (field: SortField) => void;
}) {
  const renderSortIcon = (field: SortField, active: boolean) => (
    <div className="overflow-clip relative shrink-0 size-[20px] cursor-pointer" data-name="Sorting" onClick={() => onSort(field)}>
      <div className="absolute inset-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector"></g>
        </svg>
      </div>
      <div className="absolute h-[8px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 8">
          <path d={svgPathsConsumption.p24dcb900} fill={active ? "var(--fill-0, #0F6BEB)" : "var(--fill-0, #6E6E6E)"} id="Vector" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="bg-white relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#dddddd] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[14px]">
                  <p className="leading-[1.5]">消費時間</p>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">金額</p>
                </div>
                {renderSortIcon('amount', sortField === 'amount')}
              </div>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">房型或套餐</p>
                </div>
                {renderSortIcon('package', sortField === 'package')}
              </div>
            </div>
          </div>
          <div className="h-[12px] relative shrink-0 w-0" data-name="Divier">
            <div className="absolute inset-[-3.33%_-0.4px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[12px] relative shrink-0 w-0" data-name="Divier">
              <div className="absolute inset-[-3.33%_-0.4px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 13">
                  <path d="M0.4 0.4V12.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                </svg>
              </div>
            </div>
          ))}
          <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Table/Title-atomic">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">業務來源</p>
                </div>
                {renderSortIcon('source', sortField === 'source')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectSystemButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative shrink-0 w-full" data-name="Container">
      <div 
        className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 opacity-50 cursor-not-allowed transition-colors" 
        data-name="Button"
      >
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">串接系統</p>
      </div>
    </div>
  );
}

function EmptyConsumptionState({ onConnectSystem }: { onConnectSystem: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start justify-center min-h-[200px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#a8a8a8] text-[14px] text-center w-full">
        <p className="leading-[1.5]">尚無消費紀錄</p>
      </div>
      <ConnectSystemButton onClick={onConnectSystem} />
    </div>
  );
}

function ConsumptionTableBody({ onConnectSystem }: { onConnectSystem: () => void }) {
  return (
    <div className="bg-white relative rounded-bl-[16px] rounded-br-[16px] shrink-0 w-full" data-name="Container">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-center pb-[16px] pt-[12px] px-[12px] relative w-full">
          <EmptyConsumptionState onConnectSystem={onConnectSystem} />
        </div>
      </div>
    </div>
  );
}

function ConsumptionTable({ 
  sortField, 
  sortOrder, 
  onSort,
  onConnectSystem
}: { 
  sortField: SortField; 
  sortOrder: SortOrder; 
  onSort: (field: SortField) => void;
  onConnectSystem: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-name="Table/8 Columns+3 Actions">
      <ConsumptionTableHeader sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
      <ConsumptionTableBody onConnectSystem={onConnectSystem} />
    </div>
  );
}

function ConsumptionRecordsSection() {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const recordCount = 0; // Mock data - would come from props/state in real implementation

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    toast.info(`排序：${field} (${sortOrder === 'asc' ? '遞增' : '遞減'})`);
  };

  const handleConnectSystem = () => {
    toast.success('串接系統', {
      description: '準備連接外部系統以同步消費紀錄...'
    });
  };

  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <ConsumptionRecordTitle count={recordCount} />
      <ConsumptionTable 
        sortField={sortField} 
        sortOrder={sortOrder} 
        onSort={handleSort}
        onConnectSystem={handleConnectSystem}
      />
    </div>
  );
}

function MainContent({ member, onNavigate, onMemberUpdate }: { member?: MemberData; onNavigate?: (page: string, params?: { memberId?: string }) => void; onMemberUpdate?: (member: MemberData) => void }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
          <SharedHeaderContainer>
            <SharedTitleContainer>
              <TitleWrapper />
            </SharedTitleContainer>
          </SharedHeaderContainer>
          <Container26 member={member} onNavigate={onNavigate} onMemberUpdate={onMemberUpdate} />
          <ConsumptionRecordsSection />
        </div>
      </div>
    </div>
  );
}

// 使用共享的 MemberData 类型
export type { MemberData } from "../types/member";
import type { MemberData } from "../types/member";

export default function MainContainer({ 
  onBack, 
  member, 
  onNavigate 
}: { 
  onBack?: () => void; 
  member?: MemberData;
  onNavigate?: (page: string, params?: { memberId?: string }) => void;
} = {}) {
  const [currentMember, setCurrentMember] = useState<MemberData | undefined>(member);

  React.useEffect(() => {
    setCurrentMember(member);
  }, [member]);

  return (
    <div className="bg-slate-50 content-stretch flex flex-col items-start relative size-full" data-name="Main Container">
      {/* Breadcrumb */}
      <div className="relative shrink-0 w-full">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
            <SimpleBreadcrumb 
              items={[
                { label: '會員管理', onClick: onBack },
                { label: '會員資訊', active: true }
              ]} 
            />
          </div>
        </div>
      </div>
      <MainContent
        member={currentMember}
        onNavigate={onNavigate}
        onMemberUpdate={(updatedMember) => setCurrentMember(updatedMember)}
      />
    </div>
  );
}
