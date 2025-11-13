import React, { useState, useEffect, useRef } from 'react';
import type { Member } from '../types/member';
import Toast from './Toast';
import svgPaths from "../imports/svg-9tjcfsdo1d";
import svgPathsInfo from "../imports/svg-k0rlkn3s4y";
import { useToast } from './ToastProvider';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import ButtonEditAvatar from '../imports/ButtonEdit-8025-230';
import svgPathsAvatar from "../imports/svg-sfzq97zmp3";
import MemberTagEditModal from './MemberTagEditModal';
import ButtonEdit from '../imports/ButtonEdit';

interface ChatRoomFixedProps {
  member: Member | undefined;
  onBack: () => void;
}

interface ChatMessage {
  id: number;
  type: 'user' | 'official';
  text: string;
  time: string;
  isRead: boolean;
}

const mockMessages: ChatMessage[] = [
  { id: 1, type: 'user', text: '文字訊息', time: '下午 03:30', isRead: false },
  { id: 2, type: 'official', text: '官方文字訊息', time: '下午 03:40', isRead: true },
  { id: 3, type: 'user', text: '文字訊息', time: '下午 04:30', isRead: false },
  { id: 4, type: 'official', text: '官方文字訊息', time: '下午 04:50', isRead: true },
];

// Title components for tags sections
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

// Member Info Components (from Figma design Container-8047-470)
function MemberInfoContainer({ member }: { member: Member }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [birthdayPopoverOpen, setBirthdayPopoverOpen] = React.useState(false);
  const [realName, setRealName] = React.useState(member?.realName || '');
  const [birthday, setBirthday] = React.useState<Date | undefined>(
    member?.birthday ? new Date(member.birthday) : new Date(2000, 11, 12)
  );
  const [gender, setGender] = React.useState<'male' | 'female' | 'undisclosed'>('female');
  const [location, setLocation] = React.useState(member?.location || '台北市');
  const [phone, setPhone] = React.useState(member?.phone || '');
  const [email, setEmail] = React.useState(member?.email || '');
  const [idNumber, setIdNumber] = React.useState(member?.idNumber || 'IDDDDD090909');
  const [passportNumber, setPassportNumber] = React.useState(member?.passportNumber || '399999999');
  const { showToast } = useToast();

  React.useEffect(() => {
    if (member) {
      setRealName(member.realName || '');
      setBirthday(member.birthday ? new Date(member.birthday) : new Date(2000, 11, 12));
      setLocation(member.location || '台北市');
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setIdNumber(member.idNumber || 'IDDDDD090909');
      setPassportNumber(member.passportNumber || '399999999');
    }
  }, [member]);

  const handleSave = async () => {
    try {
      // Simulate backend API call
      setIsEditing(false);
      setBirthdayPopoverOpen(false);
      showToast('儲存成功', 'success');
    } catch (error) {
      showToast('儲存失敗', 'error');
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (member) {
      setRealName(member.realName || '');
      setBirthday(member.birthday || '2000-12-12');
      setLocation(member.location || '台北市');
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setIdNumber(member.idNumber || 'IDDDDD090909');
      setPassportNumber(member.passportNumber || '399999999');
    }
    setIsEditing(false);
    setBirthdayPopoverOpen(false);
  };

  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" onClick={() => !isEditing && setIsEditing(true)}>
      {/* 姓名 */}
      <div className="content-stretch flex items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">姓名</p>
            </div>
          </div>
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">*</p>
            </div>
          </div>
          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[16.667%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
          <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      placeholder="輸入姓名"
                      className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{realName}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 生日 */}
      <div className="content-stretch flex items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">生日</p>
            </div>
          </div>
          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[16.667%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
          <Popover open={birthdayPopoverOpen} onOpenChange={setBirthdayPopoverOpen}>
            <PopoverTrigger asChild>
              <div 
                className="bg-white cursor-pointer hover:border-[#0f6beb] box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center p-[8px] relative rounded-[8px] shrink-0 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isEditing) {
                    setIsEditing(true);
                  }
                  setBirthdayPopoverOpen(true);
                }}
              >
                <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                <div className="content-stretch flex items-center relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-0 relative shrink-0 pr-10">
                    <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[16px] text-nowrap whitespace-pre" style={{ color: birthday ? '#383838' : '#a8a8a8' }}>
                      {birthday ? format(birthday, "yyyy/MM/dd") : "選擇年/月/日"}
                    </p>
                  </div>
                  <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] absolute right-2 top-1/2 -translate-y-1/2 rounded-[8px] shrink-0 size-[28px]">
                    <div className="relative shrink-0 size-[24px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                        <g id="Icon/Calendar">
                          <path d={svgPathsInfo.p22990f00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={birthday}
                onSelect={setBirthday}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 生理性別 */}
      <div className="content-stretch flex items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">生理性別</p>
            </div>
          </div>
          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[16.667%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="basis-0 content-stretch flex gap-[20px] grow items-center min-h-px min-w-px relative self-stretch shrink-0">
          <div className="flex flex-wrap gap-[16px] items-center content-center justify-start relative min-w-0 max-w-full">
            {/* 男性 */}
            <div 
              className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer" 
              onClick={(e) => {
                if (isEditing) {
                  e.stopPropagation();
                  setGender('male');
                }
              }}
            >
              <div className="overflow-clip relative shrink-0 size-[24px]">
                <div className="absolute inset-0">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector"></g>
                  </svg>
                </div>
                <div className="absolute inset-[8.333%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                    <path d={svgPathsInfo.p3a58b490} fill={gender === 'male' ? 'var(--fill-0, #0F6BEB)' : 'var(--fill-0, #383838)'} id="Vector" />
                  </svg>
                </div>
                {gender === 'male' && (
                  <div className="absolute inset-[29.167%]">
                    <div className="absolute inset-0" style={{ "--fill-0": "rgba(15, 107, 235, 1)" } as React.CSSProperties}>
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                        <path d={svgPathsInfo.p46c6500} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="content-stretch flex items-center relative shrink-0">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">男性</p>
                </div>
              </div>
            </div>
            {/* 女性 */}
            <div 
              className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer" 
              onClick={(e) => {
                if (isEditing) {
                  e.stopPropagation();
                  setGender('female');
                }
              }}
            >
              <div className="overflow-clip relative shrink-0 size-[24px]">
                <div className="absolute inset-0">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector"></g>
                  </svg>
                </div>
                <div className="absolute inset-[8.333%]">
                  <div className="absolute inset-0" style={{ "--fill-0": gender === 'female' ? "rgba(15, 107, 235, 1)" : "rgba(56, 56, 56, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <path d={svgPathsInfo.p3a58b490} fill={gender === 'female' ? 'var(--fill-0, #0F6BEB)' : 'var(--fill-0, #383838)'} id="Vector" />
                    </svg>
                  </div>
                </div>
                {gender === 'female' && (
                  <div className="absolute inset-[29.167%]">
                    <div className="absolute inset-0" style={{ "--fill-0": "rgba(15, 107, 235, 1)" } as React.CSSProperties}>
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                        <path d={svgPathsInfo.p46c6500} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="content-stretch flex items-center relative shrink-0">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">女性</p>
                </div>
              </div>
            </div>
            {/* 不透露 */}
            <div 
              className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer" 
              onClick={(e) => {
                if (isEditing) {
                  e.stopPropagation();
                  setGender('undisclosed');
                }
              }}
            >
              <div className="overflow-clip relative shrink-0 size-[24px]">
                <div className="absolute inset-0">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector"></g>
                  </svg>
                </div>
                <div className="absolute inset-[8.333%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                    <path d={svgPathsInfo.p3a58b490} fill={gender === 'undisclosed' ? 'var(--fill-0, #0F6BEB)' : 'var(--fill-0, #383838)'} id="Vector" />
                  </svg>
                </div>
                {gender === 'undisclosed' && (
                  <div className="absolute inset-[29.167%]">
                    <div className="absolute inset-0" style={{ "--fill-0": "rgba(15, 107, 235, 1)" } as React.CSSProperties}>
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                        <path d={svgPathsInfo.p46c6500} fill="var(--fill-0, #0F6BEB)" id="Vector" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="content-stretch flex items-center relative shrink-0">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">不透露</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 居住地 */}
      <div className="content-stretch flex items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">居住地</p>
            </div>
          </div>
          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[16.667%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
          <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="輸入居住地"
                      className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{location}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 手機號碼 */}
      <div className="content-stretch flex items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">手機號碼</p>
            </div>
          </div>
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">*</p>
            </div>
          </div>
          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[16.667%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
          <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="輸入手機號碼"
                      className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="content-stretch flex items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">Email</p>
            </div>
          </div>
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">*</p>
            </div>
          </div>
          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[16.667%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
          <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] overflow-hidden text-ellipsis whitespace-nowrap">{email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 身分證字號 */}
      <div className="content-stretch flex items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">身分證字號</p>
            </div>
          </div>
          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[16.667%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
          <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="輸入身分證字號"
                      className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{idNumber}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 護照號碼 */}
      <div className="content-stretch flex items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">護照號碼</p>
            </div>
          </div>
          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[16.667%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPathsInfo.p2d577a80} fill="var(--fill-0, #0F6BEB)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
          <div className="bg-white group h-[48px] min-h-[48px] relative rounded-[8px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="輸入外籍人士護照號碼"
                      className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{passportNumber}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit buttons - only show when editing */}
      {isEditing && (
        <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-full" data-name="Modal Footer">
          <div 
            className="bg-[#f0f6ff] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
            data-name="Modal Button"
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
          >
            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">取消</p>
          </div>
          <div 
            className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
            data-name="Modal Button"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
          >
            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">儲存變更</p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 502 1">
            <line id="Line 3" stroke="var(--stroke-0, #E1EBF9)" strokeLinecap="round" x1="0.5" x2="501.5" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>

      {/* Read-only fields */}
      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" onClick={(e) => e.stopPropagation()}>
        {/* 加入來源 */}
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <div className="content-stretch flex items-center min-w-[120px] relative shrink-0">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
              <p className="leading-[1.5]">加入來源</p>
            </div>
          </div>
          <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">LINE (LINE UID: 000000000)</p>
            </div>
          </div>
        </div>

        {/* 建立時間 */}
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <div className="content-stretch flex items-center min-w-[120px] relative shrink-0">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
              <p className="leading-[1.5]">建立時間</p>
            </div>
          </div>
          <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">2025-01-01</p>
            </div>
          </div>
        </div>

        {/* 最近聊天時間 */}
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <div className="content-stretch flex items-center min-w-[120px] relative shrink-0">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
              <p className="leading-[1.5]">最近聊天時間</p>
            </div>
          </div>
          <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">2025-08-08</p>
            </div>
          </div>
        </div>

        {/* 會員 ID */}
        <div className="content-stretch flex items-center relative shrink-0 w-full">
          <div className="content-stretch flex items-center min-w-[120px] relative shrink-0">
            <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
              <p className="leading-[1.5]">會員 ID</p>
            </div>
          </div>
          <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[14px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">{member.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Avatar Icon Component
function Icons8Account3() {
  return (
    <div className="absolute left-1/2 size-[49.412px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="icons8-account 1">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
        <g id="icons8-account 1">
          <path d={svgPaths.p3c081b00} fill="var(--fill-0, #383838)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isOfficial = message.type === 'official';

  return (
    <div className={`flex gap-[20px] items-start ${isOfficial ? 'justify-end' : 'justify-start'} w-full`}>
      {!isOfficial && (
        <div className="bg-white content-stretch flex items-center justify-center relative rounded-[3.35544e+07px] shrink-0 size-[45px]">
          <div className="h-[18px] relative shrink-0 w-[16.938px]">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18px] relative w-[16.938px]">
              <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">OA</p>
            </div>
          </div>
        </div>
      )}
      
      <div className={`content-stretch flex flex-col gap-[2px] items-${isOfficial ? 'end' : 'start'} relative shrink-0`}>
        <div className={`bg-${isOfficial ? '[#383838]' : '[#f6f9fd]'} content-stretch flex flex-col items-center max-w-[288px] relative rounded-[15px] shrink-0`}>
          <div className="relative shrink-0">
            <div className="flex flex-row items-center">
              <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative">
                <p className={`font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative text-[16px] break-all ${isOfficial ? 'text-right text-white' : 'text-[#383838]'}`} style={{ overflowWrap: 'anywhere' }}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[18px] relative shrink-0 w-full">
          <p className={`absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 leading-[1.5] text-[12px] ${isOfficial ? 'text-right' : 'text-left'} text-white`}>
            {message.time}{message.isRead ? ' 已讀' : ''}
          </p>
        </div>
      </div>

      {isOfficial && (
        <div className="bg-white content-stretch flex items-center justify-center relative rounded-[3.35544e+07px] shrink-0 size-[45px]">
          <div className="h-[18px] relative shrink-0 w-[16.938px]">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18px] relative w-[16.938px]">
              <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">OA</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatRoomFixed({ member, onBack }: ChatRoomFixedProps) {
  // Early return if member is undefined
  if (!member) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-[20px] text-[#383838] mb-[8px]">找不到會員資料</p>
          <p className="text-[16px] text-[#6e6e6e]">請返回會員列表重新選擇</p>
        </div>
      </div>
    );
  }

  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [messageInput, setMessageInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isAvatarPressed, setIsAvatarPressed] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  
  // Member Tags State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [memberTags, setMemberTags] = useState<string[]>(member?.tags || ['消費力高', 'VIP']);
  const [interactionTags, setInteractionTags] = useState<string[]>(['優惠活動', '限時折扣', '滿額贈品', '會員專屬優惠']);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleEditNote = () => {
    setNoteInput(savedNote);
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    try {
      setSavedNote(noteInput);
      setIsEditingNote(false);
      showToast('備註儲存成功', 'success');
    } catch (err) {
      showToast('備註儲存失敗', 'error');
    }
  };

  const handleCancelNote = () => {
    setNoteInput(savedNote);
    setIsEditingNote(false);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'official',
      text: messageInput,
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true }),
      isRead: false
    };
    
    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAvatarImage(e.target?.result as string);
          showToast('頭像上傳成功', 'success');
        };
        reader.readAsDataURL(file);
      } else {
        showToast('請選擇圖片檔案', 'error');
      }
    }
  };

  const handleEditTags = () => {
    setIsTagModalOpen(true);
  };

  const handleSaveTags = async (newMemberTags: string[], newInteractionTags: string[]): Promise<boolean> => {
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
    <div className="content-stretch flex gap-[32px] items-start relative w-full">
      {/* Left Column: Member Info (50% width) */}
      <div className="content-stretch flex flex-col gap-[24px] items-center min-h-px relative self-stretch flex-1">
        {/* Avatar and Username */}
        <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div 
            className="relative flex items-center justify-center rounded-full bg-[#EDF2F8] size-[180px] overflow-hidden cursor-pointer transition-all duration-300 ease-in-out"
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => {
              setIsAvatarHovered(false);
              setIsAvatarPressed(false);
            }}
            onMouseDown={() => setIsAvatarPressed(true)}
            onMouseUp={() => setIsAvatarPressed(false)}
            onClick={handleAvatarClick}
          >
            {/* Avatar content layer */}
            {avatarImage ? (
              <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="relative shrink-0 size-[100px]">
                <div className="absolute left-1/2 size-[49.412px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                    <g>
                      <path d={svgPathsAvatar.p3c081b00} fill="#383838" />
                    </g>
                  </svg>
                </div>
              </div>
            )}

            {/* Hover & Pressed interaction overlay */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
                  isAvatarHovered ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  backgroundColor: isAvatarPressed
                    ? 'rgba(56, 56, 56, 0.5)'
                    : 'rgba(56, 56, 56, 0.3)',
                }}
              >
                <div
                  className={`flex items-center justify-center size-[100px] transition-transform duration-150 ease-in-out ${
                    isAvatarPressed ? 'scale-95' : isAvatarHovered ? 'scale-[2]' : 'scale-100'
                  }`}
                >
                  <ButtonEditAvatar className="w-[100px] h-[100px]" />
                </div>
              </div>
          </div>
          <div className="content-stretch flex items-center justify-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">{member.username}</p>
            </div>
          </div>
        </div>

        {/* Member Info Card */}
        <div className="relative rounded-[20px] shrink-0 w-full">
          <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
          <div className="size-full">
            <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[28px] relative w-full">
              <MemberInfoContainer member={member} />
            </div>
          </div>
        </div>

        {/* Member Tags Card */}
        <div className="relative rounded-[20px] shrink-0 w-full h-auto overflow-visible">
          <div aria-hidden="true" className="absolute border border-[#e1ebf9] border-solid inset-0 pointer-events-none rounded-[20px]" />
          <div className="size-full">
            <div className="box-border content-stretch flex flex-col h-auto items-start p-[28px] pb-[72px] relative w-full">
              <div className="basis-0 content-stretch flex flex-col gap-[20px] grow h-auto items-start min-w-0 relative shrink-0 w-full" data-name="Container">
                {/* Member Tags Section */}
                <div className="grid gap-y-4 lg:grid-cols-[auto,1fr] items-start w-full min-w-0" data-name="Container">
                  <ModalTitleContent8 />
                  <div className="flex flex-wrap gap-x-3 gap-y-2 items-start content-start relative min-w-0 max-w-full pr-[60px] lg:pr-0" data-name="Container">
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
                  <div className="flex flex-wrap gap-x-3 gap-y-2 items-start content-start relative min-w-0 max-w-full pr-[60px] lg:pr-0" data-name="Container">
                    {interactionTags.map((tag, index) => (
                      <div key={index} className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0" data-name="Tag">
                        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-medium grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[14px] text-center">{tag}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Edit Button */}
              <div className="absolute bottom-[28px] right-[28px]" data-name="Container">
                <div 
                  onClick={handleEditTags}
                  className="relative shrink-0 size-[28px] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <ButtonEdit />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note Card */}
        <div className="content-stretch flex gap-[32px] items-start relative rounded-[20px] shrink-0 w-full">
          <div className="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[20px] shrink-0">
            <div className="flex flex-row justify-end min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] items-start min-h-inherit p-[20px] pb-[72px] relative w-full">
                <textarea
                  value={isEditingNote ? noteInput : savedNote}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="輸入會員備註，如：喜好、重要紀錄或追蹤事項。"
                  readOnly={!isEditingNote}
                  className="w-full min-h-[96px] font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] resize-none outline-none bg-transparent placeholder:text-[#A8A8A8] overflow-y-auto"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'transparent transparent'
                  }}
                />
                
                {/* Save/Cancel Buttons - Only show when editing */}
                {isEditingNote && (
                  <div className="absolute bottom-[20px] right-[20px]">
                    <div className="content-stretch flex gap-[8px] items-end relative shrink-0">
                      <div 
                        onClick={handleCancelNote}
                        className="bg-[#f4f8ff] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[16px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-90 transition-opacity" 
                        data-name="Modal Button"
                      >
                        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">取消</p>
                      </div>
                      <div 
                        onClick={handleSaveNote}
                        className="bg-[#1e1e1e] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[16px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:brightness-110 transition-all" 
                        data-name="Modal Button"
                      >
                        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">儲存</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Button - Only show when not editing */}
                {!isEditingNote && (
                  <div className="absolute bottom-[28px] right-[28px]" data-name="Container">
                    <div 
                      onClick={handleEditNote}
                      className="relative shrink-0 size-[28px] cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <ButtonEdit />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Chatroom (50% width) */}
      <div className="bg-gradient-to-b box-border content-stretch flex flex-col from-[#a5d8ff] gap-[60px] items-start overflow-clip p-[24px] relative rounded-[20px] self-stretch to-[#d0ebff] flex-1">
        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full overflow-y-auto scroll-smooth chat-messages-scroll"
        >
          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[20px] h-full items-start relative w-full">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="relative rounded-[20px] shrink-0 w-full">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[32px] items-end relative w-full">
            <div className="basis-0 content-stretch flex gap-[32px] grow items-start min-h-px min-w-px relative rounded-[20px] shrink-0">
              <div className="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[20px] shrink-0">
                <div className="flex flex-row justify-end min-h-inherit size-full">
                  <div className="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] relative w-full">
                    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow h-[168px] items-start min-h-[96px] min-w-px relative shrink-0">
                      <div className="basis-0 content-stretch flex flex-wrap gap-[10px] grow items-center justify-center min-h-[108px] min-w-px relative shrink-0 w-full">
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="輸入訊息文字"
                          className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow h-full leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] placeholder:text-[#a8a8a8] text-[16px] resize-none outline-none bg-transparent chat-input-textarea"
                        />
                      </div>
                      <div className="content-stretch flex gap-[4px] items-start justify-end relative shrink-0 w-full">
                        <div onClick={handleSendMessage} className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] active:bg-[#181818] transition-colors">
                          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">傳送</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* Member Tag Edit Modal */}
      <MemberTagEditModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        initialMemberTags={memberTags}
        initialInteractionTags={interactionTags}
        onSave={handleSaveTags}
      />
    </div>
  );
}
