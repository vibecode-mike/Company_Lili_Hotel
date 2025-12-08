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
import { MemberSourceIconSmall } from '../common/icons';
import ButtonEdit from '../../imports/ButtonEdit';
import { formatMemberDateTime, getLatestMemberChatTimestamp } from '../../utils/memberTime';

export interface MemberInfoPanelCompleteProps {
  member: Member;
  memberTags?: string[];
  interactionTags?: string[];
  onEditTags?: () => void;
}

const normalizeGender = (value?: string | null): 'male' | 'female' | 'undisclosed' => {
  if (!value) return 'undisclosed';
  const normalized = value.toString().toLowerCase();
  if (normalized === '1' || normalized === 'male') return 'male';
  if (normalized === '2' || normalized === 'female') return 'female';
  if (normalized === 'undisclosed' || normalized === '0') return 'undisclosed';
  return 'undisclosed';
};

const getMemberString = (member?: Member, keys: string[] = [], fallback = ''): string => {
  if (!member) return fallback;
  for (const key of keys) {
    const value = (member as any)?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return fallback;
};

export default function MemberInfoPanelComplete({ member, memberTags, interactionTags, onEditTags }: MemberInfoPanelCompleteProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [birthdayPopoverOpen, setBirthdayPopoverOpen] = React.useState(false);
  const [realName, setRealName] = React.useState(
    member?.realName || (member as any)?.name || ''
  );
  const [birthday, setBirthday] = React.useState<Date | undefined>(
    member?.birthday ? new Date(member.birthday) : undefined
  );
  const [gender, setGender] = React.useState<'male' | 'female' | 'undisclosed'>(normalizeGender(member?.gender));
  const [location, setLocation] = React.useState(
    getMemberString(member, ['location', 'residence'], '')
  );
  const [phone, setPhone] = React.useState(member?.phone || '');
  const [email, setEmail] = React.useState(member?.email || '');
  const [idNumber, setIdNumber] = React.useState(
    getMemberString(member, ['idNumber', 'id_number'], '')
  );
  const [passportNumber, setPassportNumber] = React.useState(
    getMemberString(member, ['passportNumber', 'passport_number'], '')
  );
  const { showToast } = useToast();

  const hasMemberTags = Boolean(memberTags && memberTags.length > 0);
  const hasInteractionTags = Boolean(interactionTags && interactionTags.length > 0);
  const shouldShowTagSection = hasMemberTags || hasInteractionTags || Boolean(onEditTags);

  const createdTimeDisplay = formatMemberDateTime(
    member?.createTime || (member as any)?.created_at || (member as any)?.create_time || (member as any)?.createdAt
  );
  const latestChatTimeDisplay = formatMemberDateTime(getLatestMemberChatTimestamp(member));

  // 錯誤狀態
  const [errors, setErrors] = React.useState<{
    realName?: string;
    location?: string;
    phone?: string;
    email?: string;
    idNumber?: string;
    passportNumber?: string;
  }>({});

  // 驗證函數
  const validateNoSpecialChars = (value: string): boolean => {
    return /^[\u4e00-\u9fa5a-zA-Z0-9\s]*$/.test(value);
  };

  const validatePhone = (value: string): boolean => {
    return /^09\d{8}$/.test(value);
  };

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // 身分證字號驗證（1 英文字母 + 9 數字）
  const validateIdNumber = (value: string): boolean => {
    return /^[A-Za-z]\d{9}$/.test(value);
  };

  // 護照號碼驗證（英文字母與數字組合）
  const validatePassport = (value: string): boolean => {
    return /^[A-Za-z0-9]+$/.test(value);
  };

  const lineUid = getMemberString(member, ['lineUid', 'line_uid'], '');
  const joinSource = getMemberString(member, ['join_source'], 'LINE');
  const lineName = getMemberString(member, ['lineName', 'line_name'], '');
  const [channelName, setChannelName] = React.useState<string>('LINE');

  React.useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch('/api/v1/line_channels/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const result = await response.json();
        // 優先使用 channel_name，如果沒有則使用 channel_id，最後使用 'LINE'
        if (result?.channel_name) {
          setChannelName(result.channel_name);
        } else if (result?.channel_id) {
          setChannelName(result.channel_id);
        }
      } catch (error) {
        console.error('Failed to fetch channel info:', error);
      }
    };

    fetchChannelInfo();
  }, []);

  React.useEffect(() => {
    if (member) {
      setRealName(member.realName || (member as any)?.name || '');
      setBirthday(member.birthday ? new Date(member.birthday) : undefined);
      setLocation(getMemberString(member, ['location', 'residence'], ''));
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setIdNumber(getMemberString(member, ['idNumber', 'id_number'], ''));
      setPassportNumber(getMemberString(member, ['passportNumber', 'passport_number'], ''));
      setGender(normalizeGender(member.gender));
    }
  }, [member]);

  const handleSave = async () => {
    const newErrors: typeof errors = {};

    // 檢查必填欄位
    if (!realName) {
      newErrors.realName = '姓名為必填';
    } else if (!validateNoSpecialChars(realName)) {
      newErrors.realName = '姓名格式錯誤，請避免使用特殊符號';
    }

    if (!phone) {
      newErrors.phone = '手機號碼為必填';
    } else if (!validatePhone(phone)) {
      newErrors.phone = '手機號碼格式錯誤，請輸入 09 開頭的 10 位數字';
    }

    if (!email) {
      newErrors.email = 'Email 為必填';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email 格式錯誤，格式如：starbit@gmail.com';
    }

    // 居住地驗證（必填）
    if (!location || !location.trim()) {
      newErrors.location = '居住地為必填';
    } else if (!validateNoSpecialChars(location)) {
      newErrors.location = '居住地格式錯誤，請避免使用特殊符號';
    }

    // 身分證字號驗證（非必填，只檢查格式）
    if (idNumber && !validateIdNumber(idNumber)) {
      newErrors.idNumber = '身分證字號格式錯誤，請輸入正確的英文字母與 9 碼數字組合';
    }

    // 護照號碼驗證（非必填，只檢查格式）
    if (passportNumber && !validatePassport(passportNumber)) {
      newErrors.passportNumber = '護照號碼格式錯誤，請輸入正確的英文字母與數字組合';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsEditing(false);
      setBirthdayPopoverOpen(false);
      setErrors({});
      showToast('儲存成功', 'success');
    } catch (error) {
      showToast('儲存失敗', 'error');
    }
  };

  const handleCancel = () => {
    if (member) {
      setRealName(member.realName || (member as any)?.name || '');
      setBirthday(member.birthday ? new Date(member.birthday) : undefined);
      setLocation(getMemberString(member, ['location', 'residence'], ''));
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setIdNumber(getMemberString(member, ['idNumber', 'id_number'], ''));
      setPassportNumber(getMemberString(member, ['passportNumber', 'passport_number'], ''));
      setGender(normalizeGender(member.gender));
    }
    setIsEditing(false);
    setBirthdayPopoverOpen(false);
    setErrors({});
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
            <div
              aria-hidden="true"
              className="absolute border border-solid border-neutral-100 group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]"
              style={errors.realName ? { border: '2px solid #f44336' } : undefined}
            />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={realName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRealName(value);
                        if (!value || !value.trim()) {
                          setErrors(prev => ({ ...prev, realName: '姓名為必填' }));
                        } else if (!validateNoSpecialChars(value)) {
                          setErrors(prev => ({ ...prev, realName: '姓名格式錯誤，請避免使用特殊符號' }));
                        } else {
                          setErrors(prev => ({ ...prev, realName: undefined }));
                        }
                      }}
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
          {errors.realName && (
            <p className="text-[12px] leading-[16px] text-[#f44336]">{errors.realName}</p>
          )}
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
            <div
              aria-hidden="true"
              className="absolute border border-solid border-neutral-100 group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]"
              style={errors.location ? { border: '2px solid #f44336' } : undefined}
            />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLocation(value);
                        if (!value || !value.trim()) {
                          setErrors(prev => ({ ...prev, location: '居住地為必填' }));
                        } else if (!validateNoSpecialChars(value)) {
                          setErrors(prev => ({ ...prev, location: '居住地格式錯誤，請避免使用特殊符號' }));
                        } else {
                          setErrors(prev => ({ ...prev, location: undefined }));
                        }
                      }}
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
          {errors.location && (
            <p className="text-[12px] leading-[16px] text-[#f44336]">{errors.location}</p>
          )}
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
            <div
              aria-hidden="true"
              className="absolute border border-solid border-neutral-100 group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]"
              style={errors.phone ? { border: '2px solid #f44336' } : undefined}
            />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPhone(value);
                        if (!value || !value.trim()) {
                          setErrors(prev => ({ ...prev, phone: '手機號碼為必填' }));
                        } else if (!validatePhone(value)) {
                          setErrors(prev => ({ ...prev, phone: '手機號碼格式錯誤，請輸入 09 開頭的 10 位數字' }));
                        } else {
                          setErrors(prev => ({ ...prev, phone: undefined }));
                        }
                      }}
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
          {errors.phone && (
            <p className="text-[12px] leading-[16px] text-[#f44336]">{errors.phone}</p>
          )}
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
            <div
              aria-hidden="true"
              className="absolute border border-solid border-neutral-100 group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]"
              style={errors.email ? { border: '2px solid #f44336' } : undefined}
            />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEmail(value);
                        if (!value || !value.trim()) {
                          setErrors(prev => ({ ...prev, email: 'Email 為必填' }));
                        } else if (!validateEmail(value)) {
                          setErrors(prev => ({ ...prev, email: 'Email 格式錯誤，格式如：starbit@gmail.com' }));
                        } else {
                          setErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
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
          {errors.email && (
            <p className="text-[12px] leading-[16px] text-[#f44336]">{errors.email}</p>
          )}
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
            <div
              aria-hidden="true"
              className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]"
              style={errors.idNumber ? { border: '2px solid #f44336' } : undefined}
            />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        setIdNumber(value);
                        if (value && !validateIdNumber(value)) {
                          setErrors(prev => ({ ...prev, idNumber: '身分證字號格式錯誤，請輸入正確的英文字母與 9 碼數字組合' }));
                        } else {
                          setErrors(prev => ({ ...prev, idNumber: undefined }));
                        }
                      }}
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
          {errors.idNumber && (
            <p className="text-[12px] leading-[16px] text-[#f44336]">{errors.idNumber}</p>
          )}
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
            <div
              aria-hidden="true"
              className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]"
              style={errors.passportNumber ? { border: '2px solid #f44336' } : undefined}
            />
            <div className="flex flex-col justify-center min-h-inherit size-full">
              <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPassportNumber(value);
                        if (value && !validatePassport(value)) {
                          setErrors(prev => ({ ...prev, passportNumber: '護照號碼格式錯誤，請輸入正確的英文字母與數字組合' }));
                        } else {
                          setErrors(prev => ({ ...prev, passportNumber: undefined }));
                        }
                      }}
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
          {errors.passportNumber && (
            <p className="text-[12px] leading-[16px] text-[#f44336]">{errors.passportNumber}</p>
          )}
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
      {shouldShowTagSection && (
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
            <div className="flex flex-col gap-[8px] w-full">
              <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#383838]">
                會員標籤
              </p>
              {hasMemberTags && memberTags && (
                <div className="flex flex-wrap gap-[8px]">
                  {memberTags.map((tag, index) => (
                    <span
                      key={`member-${index}`}
                      className="bg-[#f0f6ff] text-[#0f6beb] px-[12px] py-[4px] rounded-[8px] text-[14px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Interaction Tags */}
            <div className="flex flex-col gap-[8px] w-full relative pb-[4px]">
              <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#383838]">
                互動標籤
              </p>
              {hasInteractionTags && interactionTags ? (
                <div className="flex flex-wrap gap-[8px]">
                  {interactionTags.map((tag, index) => (
                    <span
                      key={`interaction-${index}`}
                      className="bg-[#f0f6ff] text-[#0f6beb] px-[12px] py-[4px] rounded-[8px] text-[14px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#6e6e6e] text-[14px]">尚未設定互動標籤</p>
              )}
              {onEditTags && (
                <button
                  type="button"
                  onClick={onEditTags}
                  aria-label="編輯會員標籤"
                  className="absolute bottom-0 right-0 translate-y-[50%] shrink-0 size-[28px] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <ButtonEdit />
                </button>
              )}
            </div>
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
            <div className="flex items-center gap-2 font-['Noto_Sans_TC:Regular',sans-serif] font-normal relative">
              <MemberSourceIconSmall source={joinSource} />
              <span className="text-[14px] text-[#383838]">
                {channelName}
              </span>
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
              <p className="leading-[1.5] whitespace-pre">{createdTimeDisplay}</p>
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
              <p className="leading-[1.5] whitespace-pre">{latestChatTimeDisplay}</p>
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
