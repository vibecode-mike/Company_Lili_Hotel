/**
 * 触发时间选项组件
 * 用于自动回应页面的触发时间设置
 * 支持「立即回覆」和「指定日期或時間」两种选项
 * 使用 date-fns 处理日期和时间
 */

import { useState } from 'react';
import svgPaths from '../imports/svg-qyn0laeroz';
import { parse, isBefore, startOfDay, format } from 'date-fns';
import { toast } from 'sonner';
import { DatePicker, TimePicker } from './DateTimePicker';

// ========== 类型定义 ==========

export type TriggerTimeType = 'immediate' | 'scheduled';

export type ScheduleModeType = 'date' | 'time';

export interface TriggerTimeOptionsProps {
  triggerTime: TriggerTimeType;
  setTriggerTime: (value: TriggerTimeType) => void;
  scheduledDateTime: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  setScheduledDateTime: (value: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  }) => void;
  showScheduledOption?: boolean; // 新增：是否显示"指定日期或时间"选项，默认为 false
  scheduleMode?: ScheduleModeType; // 新增：日期或時間模式（二擇一）
  onScheduleModeChange?: (mode: ScheduleModeType) => void; // 新增：模式切換回調
}

// ========== 主组件 ==========

export default function TriggerTimeOptions({
  triggerTime,
  setTriggerTime,
  scheduledDateTime,
  setScheduledDateTime,
  showScheduledOption = false, // 默认不显示"指定日期或时间"
  scheduleMode = 'time', // 默認為時間模式
  onScheduleModeChange,
}: TriggerTimeOptionsProps) {
  // 获取今天的日期字符串（格式: yyyy/MM/dd）
  const today = format(new Date(), 'yyyy/MM/dd');

  // 验证日期范围
  const validateDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return true;
    
    try {
      const start = parse(startDate, 'yyyy/MM/dd', new Date());
      const end = parse(endDate, 'yyyy/MM/dd', new Date());
      
      if (isBefore(end, startOfDay(start))) {
        toast.error('結束日期不能早於開始日期');
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  // 处理日期更新
  const handleDateUpdate = (field: 'startDate' | 'endDate', value: string) => {
    const newDateTime = {
      ...scheduledDateTime,
      [field]: value,
    };
    
    // 验证日期范围
    if (field === 'startDate' && newDateTime.endDate) {
      validateDateRange(value, newDateTime.endDate);
    } else if (field === 'endDate' && newDateTime.startDate) {
      validateDateRange(newDateTime.startDate, value);
    }
    
    setScheduledDateTime(newDateTime);
  };

  // 处理时间更新
  const handleTimeUpdate = (field: 'startTime' | 'endTime', value: string) => {
    setScheduledDateTime({
      ...scheduledDateTime,
      [field]: value,
    });
  };

  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative w-full">
      {/* 当只有"立即回覆"选项时，显示纯文字 */}
      {!showScheduledOption ? (
        <div className="content-stretch flex items-center relative shrink-0">
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
            <p className="leading-[1.5] whitespace-pre">立即回覆</p>
          </div>
        </div>
      ) : (
        <>
          {/* 立即回覆選項 - 带 radio button */}
          <div 
            className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
            onClick={() => setTriggerTime('immediate')}
          >
            <div className="relative shrink-0 size-[24px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <g clipPath={triggerTime === 'immediate' ? "url(#clip0_8268_528)" : "url(#clip0_8268_533)"}>
                  <g id="Vector"></g>
                  <path 
                    d={svgPaths.p26f9ce00} 
                    fill={triggerTime === 'immediate' ? '#0F6BEB' : '#383838'} 
                    id="Vector_2" 
                  />
                  {triggerTime === 'immediate' && (
                    <path d={svgPaths.pee04100} fill="#0F6BEB" id="Vector_3" />
                  )}
                </g>
                <defs>
                  <clipPath id={triggerTime === 'immediate' ? "clip0_8268_528" : "clip0_8268_533"}>
                    <rect fill="white" height="24" width="24" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="content-stretch flex items-center relative shrink-0">
              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                <p className="leading-[1.5] whitespace-pre">立即回覆</p>
              </div>
            </div>
          </div>

          {/* 指定日期或時間選項容器 - 只在 showScheduledOption 为 true 时显示 */}
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            {/* 主選項 */}
            <div 
              className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
              onClick={() => setTriggerTime('scheduled')}
            >
              <div className="relative shrink-0 size-[24px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <g clipPath={triggerTime === 'scheduled' ? "url(#clip0_8268_528_2)" : "url(#clip0_8268_533_2)"}>
                    <g id="Vector"></g>
                    <path 
                      d={svgPaths.p26f9ce00} 
                      fill={triggerTime === 'scheduled' ? '#0F6BEB' : '#383838'} 
                      id="Vector_2" 
                    />
                    {triggerTime === 'scheduled' && (
                      <path d={svgPaths.pee04100} fill="#0F6BEB" id="Vector_3" />
                    )}
                  </g>
                  <defs>
                    <clipPath id={triggerTime === 'scheduled' ? "clip0_8268_528_2" : "clip0_8268_533_2"}>
                      <rect fill="white" height="24" width="24" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="content-stretch flex items-center relative shrink-0">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">指定日期或時間</p>
                </div>
              </div>
            </div>

            {/* 當選擇「指定日期或時間」時顯示的子選項 */}
            {triggerTime === 'scheduled' && (
              <div className="relative shrink-0 w-full">
                <div className="size-full">
                  <div className="box-border content-stretch flex flex-col gap-[8px] items-start pl-0 md:pl-[32px] pr-0 py-0 relative w-full">
                    {/* 子 Radio Button：按日期 / 按時間 二擇一 */}
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                      {/* 按日期選項 */}
                      <div className="content-stretch flex flex-col md:flex-row gap-[8px] md:gap-[12px] items-start md:items-center relative shrink-0 w-full">
                        <div
                          className="flex flex-row items-center self-stretch cursor-pointer"
                          onClick={() => onScheduleModeChange?.('date')}
                        >
                          <div className="relative shrink-0 size-[24px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                              <g clipPath="url(#clip_date_mode)">
                                <path
                                  d={svgPaths.p26f9ce00}
                                  fill={scheduleMode === 'date' ? '#0F6BEB' : '#383838'}
                                />
                                {scheduleMode === 'date' && (
                                  <path d={svgPaths.pee04100} fill="#0F6BEB" />
                                )}
                              </g>
                              <defs>
                                <clipPath id="clip_date_mode">
                                  <rect fill="white" height="24" width="24" />
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                          <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                            <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                              <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">按日期</p>
                            </div>
                          </div>
                        </div>
                        {/* 日期選擇器 - 只在「按日期」模式時顯示 */}
                        {scheduleMode === 'date' && (
                          <div className="flex flex-col md:flex-row items-stretch md:items-center self-stretch w-full md:w-auto">
                            <div className="w-full md:max-w-[160px] md:min-w-[160px] md:w-[160px]">
                              <DatePicker
                                value={scheduledDateTime.startDate}
                                onChange={(value) => handleDateUpdate('startDate', value)}
                                minDate={today}
                                maxDate={scheduledDateTime.endDate}
                                placeholder="年/月/日"
                              />
                            </div>
                            <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-center justify-center p-[8px] relative rounded-[8px] shrink-0">
                              <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">~</p>
                              </div>
                            </div>
                            <div className="w-full md:max-w-[160px] md:min-w-[160px] md:w-[160px]">
                              <DatePicker
                                value={scheduledDateTime.endDate}
                                onChange={(value) => handleDateUpdate('endDate', value)}
                                minDate={scheduledDateTime.startDate}
                                placeholder="年/月/日"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 按時間選項 */}
                      <div className="content-stretch flex flex-col md:flex-row gap-[8px] md:gap-[12px] items-start md:items-center relative shrink-0 w-full">
                        <div
                          className="flex flex-row items-center self-stretch cursor-pointer"
                          onClick={() => onScheduleModeChange?.('time')}
                        >
                          <div className="relative shrink-0 size-[24px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                              <g clipPath="url(#clip_time_mode)">
                                <path
                                  d={svgPaths.p26f9ce00}
                                  fill={scheduleMode === 'time' ? '#0F6BEB' : '#383838'}
                                />
                                {scheduleMode === 'time' && (
                                  <path d={svgPaths.pee04100} fill="#0F6BEB" />
                                )}
                              </g>
                              <defs>
                                <clipPath id="clip_time_mode">
                                  <rect fill="white" height="24" width="24" />
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                          <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                            <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                              <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">按時間</p>
                            </div>
                          </div>
                        </div>
                        {/* 時間選擇器 - 只在「按時間」模式時顯示 */}
                        {scheduleMode === 'time' && (
                          <div className="flex flex-col md:flex-row items-stretch md:items-center self-stretch w-full md:w-auto">
                            <div className="w-full md:max-w-[160px] md:min-w-[160px] md:w-[160px]">
                              <TimePicker
                                value={scheduledDateTime.startTime}
                                onChange={(value) => handleTimeUpdate('startTime', value)}
                                placeholder="時：分"
                              />
                            </div>
                            <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-center justify-center p-[8px] relative rounded-[8px] shrink-0">
                              <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">~</p>
                              </div>
                            </div>
                            <div className="w-full md:max-w-[160px] md:min-w-[160px] md:w-[160px]">
                              <TimePicker
                                value={scheduledDateTime.endTime}
                                onChange={(value) => handleTimeUpdate('endTime', value)}
                                placeholder="時：分"
                              />
                            </div>
                            <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-center justify-center p-[8px] relative rounded-[8px] shrink-0">
                              <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">（每天）</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}