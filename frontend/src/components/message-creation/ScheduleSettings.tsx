/**
 * 排程发送设置组件
 * 用于设置消息的发送时间（立即发送或自定义时间）
 */

import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import svgPaths from '../../imports/svg-jb10q6lg6b';

// ========== 类型定义 ==========

export interface ScheduleSettingsProps {
  scheduleType: 'immediate' | 'scheduled';
  scheduledDate?: Date;
  scheduledTime: { hours: string; minutes: string };
  onScheduleTypeChange: (type: 'immediate' | 'scheduled') => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: { hours: string; minutes: string }) => void;
  onConfirm?: () => void;
}

// ========== 辅助函数 ==========

function formatDate(date: Date | undefined): string {
  if (!date) return '選擇日期';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
}

// ========== 主组件 ==========

export default function ScheduleSettings({
  scheduleType,
  scheduledDate,
  scheduledTime,
  onScheduleTypeChange,
  onDateChange,
  onTimeChange,
  onConfirm,
}: ScheduleSettingsProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleDateTimeConfirm = () => {
    setDatePickerOpen(false);
    onConfirm?.();
  };

  const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
    onTimeChange({
      ...scheduledTime,
      [type]: value,
    });
  };

  return (
    <div className="flex items-start gap-4 w-full">
      {/* 标签 */}
      <Label className="min-w-[160px] pt-1 flex items-center gap-1">
        <span className="text-[16px] text-[#383838]">排程發送</span>
        <span className="text-[16px] text-[#f44336]">*</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
              <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
            </svg>
          </TooltipTrigger>
          <TooltipContent>
            <p>選擇發送時間</p>
          </TooltipContent>
        </Tooltip>
      </Label>

      {/* 选项 */}
      <RadioGroup value={scheduleType} onValueChange={onScheduleTypeChange} className="space-y-2">
        {/* 立即发送 */}
        <div className="flex items-center gap-2">
          <RadioGroupItem value="immediate" id="immediate" />
          <Label htmlFor="immediate" className="cursor-pointer text-[16px] text-[#383838]">
            立即發送
          </Label>
        </div>

        {/* 自定义时间 */}
        <div className="flex items-center gap-3">
          <RadioGroupItem value="scheduled" id="scheduled" />
          <Label htmlFor="scheduled" className="cursor-pointer text-[16px] text-[#383838]">
            自訂時間
          </Label>
          
          {/* 日期时间选择器 */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild disabled={scheduleType === 'immediate'}>
              <div 
                className={`bg-white border border-neutral-100 rounded-[8px] px-[8px] py-[8px] w-[298px] flex items-center gap-6 transition-colors ${
                  scheduleType === 'immediate' 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'cursor-pointer hover:border-neutral-200'
                }`}
              >
                <span className={`text-[16px] ${scheduledDate ? 'text-[#383838]' : 'text-[#a8a8a8]'}`}>
                  {formatDate(scheduledDate)}
                </span>
                <span className={`text-[16px] ${scheduledDate ? 'text-[#383838]' : 'text-[#a8a8a8]'}`}>
                  {scheduledDate ? `${scheduledTime.hours}:${scheduledTime.minutes}` : '時：分'}
                </span>
                <button className="ml-auto" disabled={scheduleType === 'immediate'}>
                  <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                    <path d={svgPaths.p22990f00} fill="#0F6BEB" />
                  </svg>
                </button>
              </div>
            </PopoverTrigger>
            
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col gap-4 p-4">
                {/* 日期选择 */}
                <div className="space-y-2">
                  <Label className="text-[14px] text-[#383838]">選擇日期</Label>
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={onDateChange}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </div>
                
                {/* 时间选择 */}
                <div className="space-y-2">
                  <Label className="text-[14px] text-[#383838]">選擇時間</Label>
                  <div className="flex items-center gap-2">
                    {/* 小时 */}
                    <Select 
                      value={scheduledTime.hours} 
                      onValueChange={(value) => handleTimeChange('hours', value)}
                    >
                      <SelectTrigger className="w-[80px] h-[40px] rounded-[8px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(hour => (
                          <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-[16px] text-[#383838]">:</span>
                    
                    {/* 分钟 */}
                    <Select 
                      value={scheduledTime.minutes} 
                      onValueChange={(value) => handleTimeChange('minutes', value)}
                    >
                      <SelectTrigger className="w-[80px] h-[40px] rounded-[8px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(minute => (
                          <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* 按钮 */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDatePickerOpen(false)}
                    className="h-[40px] rounded-[8px]"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleDateTimeConfirm}
                    className="h-[40px] rounded-[8px] bg-[#242424] hover:bg-[#383838]"
                  >
                    確認
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </RadioGroup>
    </div>
  );
}
