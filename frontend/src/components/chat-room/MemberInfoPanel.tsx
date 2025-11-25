/**
 * 会员信息面板组件
 * 显示和编辑会员的详细信息
 */

import React, { useState, useEffect } from 'react';
import type { Member } from '../../types/member';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import ButtonEditAvatar from '../../imports/ButtonEdit-8025-230';
import ButtonEditIcon from '../../imports/ButtonEdit';
import svgPathsAvatar from '../../imports/svg-sfzq97zmp3';
import { useToast } from '../ToastProvider';

// ========== 类型定义 ==========

export interface MemberInfoPanelProps {
  member: Member;
}

// ========== 主组件 ==========

export default function MemberInfoPanel({ member }: MemberInfoPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [birthdayPopoverOpen, setBirthdayPopoverOpen] = useState(false);
  const [realName, setRealName] = useState(member?.realName || '');
  const [birthday, setBirthday] = useState<Date | undefined>(
    member?.birthday ? new Date(member.birthday) : new Date(2000, 11, 12)
  );
  const [gender, setGender] = useState<'male' | 'female' | 'undisclosed'>('female');
  const [location, setLocation] = useState(member?.location || '台北市');
  const [phone, setPhone] = useState(member?.phone || '');
  const [email, setEmail] = useState(member?.email || '');
  const [idNumber, setIdNumber] = useState(member?.idNumber || 'IDDDDD090909');
  const [passportNumber, setPassportNumber] = useState(member?.passportNumber || '399999999');
  const { showToast } = useToast();

  // 当 member 变化时更新表单数据
  useEffect(() => {
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

  const handleEditToggle = () => {
    if (isEditing) {
      showToast('已儲存變更', 'success');
    }
    setIsEditing(!isEditing);
  };

  const handleBirthdayConfirm = (date: Date | undefined) => {
    if (date) {
      setBirthday(date);
      setBirthdayPopoverOpen(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-[28px] flex flex-col gap-[20px]">
        {/* 头像部分 */}
        <div className="flex flex-col items-center gap-[12px]">
          <div className="relative">
            <div className="bg-white border-[3px] border-white overflow-clip relative rounded-full shrink-0 size-[100px]">
              <img
                src={member.lineAvatar}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0">
              <ButtonEditAvatar />
            </div>
          </div>
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[20px] leading-[1.5] text-[#383838]">
            {member.name}
          </p>
        </div>

        {/* 编辑按钮 */}
        <div className="flex justify-center">
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-[4px] px-[12px] py-[8px] hover:bg-gray-50 rounded-[8px] transition-colors"
          >
            <ButtonEditIcon />
            <span className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#0f6beb]">
              {isEditing ? '儲存' : '編輯'}
            </span>
          </button>
        </div>

        {/* 会员信息表单 */}
        <div className="flex flex-col gap-[16px]">
          {/* 真实姓名 */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838]">
              真實姓名
            </label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              disabled={!isEditing}
              placeholder="請輸入真實姓名"
              className="bg-white border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#717182] disabled:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent"
            />
          </div>

          {/* 生日 */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838]">
              生日
            </label>
            {isEditing ? (
              <Popover open={birthdayPopoverOpen} onOpenChange={setBirthdayPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="bg-white border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-left text-[16px] leading-[1.5] text-[#383838] hover:border-gray-300 transition-colors">
                    {birthday ? format(birthday, 'yyyy/MM/dd') : '選擇日期'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthday}
                    onSelect={handleBirthdayConfirm}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838]">
                {birthday ? format(birthday, 'yyyy/MM/dd') : '-'}
              </div>
            )}
          </div>

          {/* 性别 */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838]">
              性別
            </label>
            {isEditing ? (
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'undisclosed')}
                className="bg-white border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent"
              >
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="undisclosed">不透露</option>
              </select>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838]">
                {gender === 'male' ? '男' : gender === 'female' ? '女' : '不透露'}
              </div>
            )}
          </div>

          {/* 地区 */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838]">
              地區
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={!isEditing}
              placeholder="請輸入地區"
              className="bg-white border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#717182] disabled:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent"
            />
          </div>

          {/* 电话 */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838]">
              電話
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditing}
              placeholder="請輸入電話"
              className="bg-white border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#717182] disabled:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent"
            />
          </div>

          {/* 邮箱 */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838]">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
              placeholder="請輸入 E-mail"
              className="bg-white border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#717182] disabled:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent"
            />
          </div>

          {/* 身份证号 */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838]">
              身分證字號
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              disabled={!isEditing}
              placeholder="請輸入身分證字號"
              className="bg-white border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#717182] disabled:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent"
            />
          </div>

          {/* 护照号 */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838]">
              護照號碼
            </label>
            <input
              type="text"
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value)}
              disabled={!isEditing}
              placeholder="請輸入護照號碼"
              className="bg-white border border-gray-200 rounded-[8px] px-[12px] py-[8px] text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#717182] disabled:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}