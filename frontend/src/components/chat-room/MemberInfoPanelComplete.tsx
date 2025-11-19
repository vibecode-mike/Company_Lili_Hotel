/**
 * 完整会员信息面板组件 (使用 Figma 设计稿样式)
 * 显示和编辑会员的详细信息，包含所有表单字段
 */

import React, { useState, useEffect } from 'react';
import type { Member } from '../../types/member';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { format } from 'date-fns';
import svgPathsInfo from '../../imports/svg-k0rlkn3s4y';
import { useToast } from '../ToastProvider';

export interface MemberInfoPanelCompleteProps {
  member: Member;
  memberTags?: string[];
  interactionTags?: string[];
  onEditTags?: () => void;
}

export default function MemberInfoPanelComplete({ member, memberTags, interactionTags, onEditTags }: MemberInfoPanelCompleteProps) {
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
      setIsEditing(false);
      setBirthdayPopoverOpen(false);
      showToast('儲存成功', 'success');
    } catch (error) {
      showToast('儲存失敗', 'error');
    }
  };

  const handleCancel = () => {
    if (member) {
      setRealName(member.realName || '');
      setBirthday(member.birthday ? new Date(member.birthday) : new Date(2000, 11, 12));
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
          <RadioGroup 
            value={gender} 
            onValueChange={(value) => isEditing && setGender(value as 'male' | 'female' | 'undisclosed')}
            className="flex flex-wrap gap-[16px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="male" id="gender-male" disabled={!isEditing} />
              <Label 
                htmlFor="gender-male" 
                className="cursor-pointer text-[16px] text-[#383838] font-['Noto_Sans_TC:Regular',sans-serif] font-normal"
              >
                男性
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="female" id="gender-female" disabled={!isEditing} />
              <Label 
                htmlFor="gender-female" 
                className="cursor-pointer text-[16px] text-[#383838] font-['Noto_Sans_TC:Regular',sans-serif] font-normal"
              >
                女性
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="undisclosed" id="gender-undisclosed" disabled={!isEditing} />
              <Label 
                htmlFor="gender-undisclosed" 
                className="cursor-pointer text-[16px] text-[#383838] font-['Noto_Sans_TC:Regular',sans-serif] font-normal"
              >
                不透露
              </Label>
            </div>
          </RadioGroup>
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

      {/* Tags Section */}
      {((memberTags && memberTags.length > 0) || (interactionTags && interactionTags.length > 0)) && (
        <>
          {/* Divider */}
          <div className="h-0 relative shrink-0 w-full">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 502 1">
                <line stroke="#E1EBF9" strokeLinecap="round" x1="0.5" x2="501.5" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>

          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
            {/* Member Tags */}
            {memberTags && memberTags.length > 0 && (
              <div className="flex flex-col gap-[8px] w-full">
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#383838]">
                  會員標籤
                </p>
                <div className="flex flex-wrap gap-[8px]">
                  {memberTags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-[#f0f6ff] text-[#0f6beb] px-[12px] py-[4px] rounded-[8px] text-[14px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interaction Tags */}
            {interactionTags && interactionTags.length > 0 && (
              <div className="flex flex-col gap-[8px] w-full">
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#383838]">
                  互動標籤
                </p>
                <div className="flex flex-wrap gap-[8px]">
                  {interactionTags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-[#fff4e6] text-[#ff9800] px-[12px] py-[4px] rounded-[8px] text-[14px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Tags Button */}
            {onEditTags && (
              <button
                onClick={onEditTags}
                className="text-[#0f6beb] text-[16px] hover:underline cursor-pointer"
              >
                編輯標籤
              </button>
            )}
          </div>
        </>
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