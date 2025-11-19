/**
 * 日期时间选择器组件
 * 使用 date-fns 处理日期和时间
 */

import { useState, useRef, useEffect, memo } from 'react';
import { format, parse, isValid, isBefore, isAfter, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// ========== 类型定义 ==========

export interface DatePickerProps {
  value: string; // 格式: YYYY/MM/DD
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  onClose?: () => void;
}

export interface TimePickerProps {
  value: string; // 格式: HH:mm
  onChange: (value: string) => void;
  placeholder?: string;
  onClose?: () => void;
}

// ========== 日期选择器组件 ==========

export function DatePicker({ value, onChange, minDate, maxDate, placeholder = '選擇日期', onClose }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  // 解析日期字符串
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
      const parsed = parse(dateStr, 'yyyy/MM/dd', new Date());
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const selectedDate = parseDate(value);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 获取月份的所有日期
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  // 获取月份第一天是星期几
  const getFirstDayOfMonth = () => {
    return getDay(startOfMonth(currentMonth));
  };

  // 处理日期选择
  const handleDateSelect = (date: Date) => {
    const formatted = format(date, 'yyyy/MM/dd');
    onChange(formatted);
    setIsOpen(false);
    onClose?.();
  };

  // 检查日期是否可选
  const isDateDisabled = (date: Date) => {
    if (minDate) {
      const min = parseDate(minDate);
      if (min && isBefore(date, startOfDay(min))) return true;
    }
    if (maxDate) {
      const max = parseDate(maxDate);
      if (max && isAfter(date, startOfDay(max))) return true;
    }
    return false;
  };

  const days = getDaysInMonth();
  const firstDayOfWeek = getFirstDayOfMonth();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="relative w-full" ref={pickerRef}>
      {/* 输入框 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center p-[8px] relative rounded-[8px] shrink-0 w-full cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px]" style={{ color: value ? '#383838' : '#a8a8a8' }}>
            {value || placeholder}
          </p>
          <div className="relative shrink-0 size-[24px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" fill="#0F6BEB" />
            </svg>
          </div>
        </div>
      </div>

      {/* 日历弹窗 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-neutral-100 rounded-[12px] shadow-lg z-50 p-4 min-w-[280px]">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-[8px] transition-colors"
            >
              <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                <path d="M10 12L6 8L10 4" stroke="#383838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium text-[16px] text-[#383838]">
              {format(currentMonth, 'yyyy年 MM月', { locale: zhTW })}
            </p>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-[8px] transition-colors"
            >
              <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                <path d="M6 12L10 8L6 4" stroke="#383838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center">
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[12px] text-[#6e6e6e]">{day}</p>
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-1">
            {/* 填充月初空白 */}
            {Array.from({ length: firstDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* 日期 */}
            {days.map((day) => {
              const disabled = isDateDisabled(day);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    aspect-square p-2 rounded-[8px] font-['Noto_Sans_TC:Regular',sans-serif] text-[14px]
                    ${selected ? 'bg-[#0F6BEB] text-white' : ''}
                    ${!selected && isCurrentMonth && !disabled ? 'hover:bg-slate-100 text-[#383838]' : ''}
                    ${!isCurrentMonth ? 'text-[#bdbdbd]' : ''}
                    ${disabled ? 'text-[#e0e0e0] cursor-not-allowed' : 'cursor-pointer'}
                    transition-colors
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== 时间选择器组件 ==========

export function TimePicker({ value, onChange, placeholder = '選擇時間', onClose }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const pickerRef = useRef<HTMLDivElement>(null);

  // 解析时间字符串
  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length === 2) {
        setHours(parts[0].padStart(2, '0'));
        setMinutes(parts[1].padStart(2, '0'));
      }
    }
  }, [value]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 生成小时和分钟选项
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // 处理确认
  const handleConfirm = () => {
    const timeStr = `${hours}:${minutes}`;
    onChange(timeStr);
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="relative w-full" ref={pickerRef}>
      {/* 输入框 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center p-[8px] relative rounded-[8px] shrink-0 w-full cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px]" style={{ color: value ? '#383838' : '#a8a8a8' }}>
            {value || placeholder}
          </p>
          <div className="relative shrink-0 size-[24px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#0F6BEB" />
            </svg>
          </div>
        </div>
      </div>

      {/* 时间选择弹窗 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-neutral-100 rounded-[12px] shadow-lg z-50 p-4 min-w-[200px]">
          <div className="flex items-center justify-center gap-2 mb-4">
            {/* 小时选择 */}
            <select
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="bg-white border border-neutral-100 rounded-[8px] p-2 font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#383838] cursor-pointer outline-none hover:border-[#0F6BEB] focus:border-[#0F6BEB]"
            >
              {hourOptions.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>

            <span className="font-['Noto_Sans_TC:Regular',sans-serif] text-[20px] text-[#383838]">:</span>

            {/* 分钟选择 */}
            <select
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="bg-white border border-neutral-100 rounded-[8px] p-2 font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#383838] cursor-pointer outline-none hover:border-[#0F6BEB] focus:border-[#0F6BEB]"
            >
              {minuteOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* 确认按钮 */}
          <button
            onClick={handleConfirm}
            className="w-full bg-[#0F6BEB] text-white rounded-[8px] py-2 px-4 font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] hover:bg-[#0d5ac4] transition-colors"
          >
            確認
          </button>
        </div>
      )}
    </div>
  );
}