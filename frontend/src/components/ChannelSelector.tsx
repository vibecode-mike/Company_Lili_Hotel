/**
 * 回應渠道選擇器組件
 * 支援單選和複選模式
 */

import { useState } from 'react';
import { ChannelIcon } from './common/icons/ChannelIcon';
import type { AutoReplyChannel } from '../types/channel';
import { AUTO_REPLY_CHANNELS, getChannelConfig } from '../types/channel';

/**
 * 渠道類型別名（向後兼容）
 * 實際定義在 ../types/channel.ts
 */
export type ChannelType = AutoReplyChannel;

interface ChannelOption {
  value: AutoReplyChannel;
  label: string;
}

interface ChannelSelectorProps {
  /** 已選擇的渠道 */
  selectedChannels: AutoReplyChannel[];
  /** 渠道變更回調 */
  onChange: (channels: AutoReplyChannel[]) => void;
  /** 是否支援多選，預設為 true */
  multiSelect?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** 自定義可選渠道列表 */
  availableChannels?: ChannelOption[];
  /** 圖標尺寸（px），預設 28 */
  iconSize?: number;
  /** 自定義標籤文字，預設「回應渠道」 */
  label?: string;
  /** 自定義說明文字（複選模式下顯示） */
  helpText?: string;
}

// 使用統一配置生成默認渠道選項
const DEFAULT_CHANNELS: ChannelOption[] = AUTO_REPLY_CHANNELS.map(channel => ({
  value: channel,
  label: getChannelConfig(channel).label,
}));

export default function ChannelSelector({
  selectedChannels,
  onChange,
  multiSelect = true,
  required = false,
  availableChannels = DEFAULT_CHANNELS,
  iconSize = 28,
  label = '回應渠道',
  helpText,
}: ChannelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChannelToggle = (channel: AutoReplyChannel) => {
    if (multiSelect) {
      // 複選模式
      if (selectedChannels.includes(channel)) {
        // 取消選擇（如果不是必填或者還有其他選項）
        if (!required || selectedChannels.length > 1) {
          onChange(selectedChannels.filter(c => c !== channel));
        }
      } else {
        // 新增選擇
        onChange([...selectedChannels, channel]);
      }
    } else {
      // 單選模式
      onChange([channel]);
      setIsExpanded(false);
    }
  };

  const isSelected = (channel: AutoReplyChannel) => selectedChannels.includes(channel);

  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full flex-col xl:flex-row gap-[8px] xl:gap-0">
      {/* 標籤區域 */}
      <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0 w-full xl:w-auto">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] whitespace-nowrap">
          {label}
        </p>
        {required && (
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#f44336] text-[16px] whitespace-nowrap">
            *
          </p>
        )}
      </div>

      {/* 選擇器區域 */}
      <div className="basis-0 grow min-h-px relative shrink-0 w-full xl:w-auto">
        {multiSelect ? (
          // 複選模式：展示所有選項，使用 checkbox 樣式
          <div className="content-stretch flex flex-wrap gap-[12px] items-start relative shrink-0 w-full">
            {availableChannels.map((channel) => (
              <button
                key={channel.value}
                type="button"
                onClick={() => handleChannelToggle(channel.value)}
                className={`
                  box-border content-stretch flex gap-[8px] items-center px-[16px] py-[12px]
                  relative rounded-[12px] shrink-0 transition-all duration-200
                  ${
                    isSelected(channel.value)
                      ? 'bg-[#0f6beb] border-[2px] border-[#0f6beb]'
                      : 'bg-white border-[2px] border-[#dddddd] hover:border-[#0f6beb]'
                  }
                `}
              >
                <ChannelIcon channel={channel.value} size={iconSize} />
                <p
                  className={`
                    font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5]
                    text-[16px] whitespace-nowrap
                    ${isSelected(channel.value) ? 'text-white' : 'text-[#383838]'}
                  `}
                >
                  {channel.label}
                </p>
                {isSelected(channel.value) && (
                  <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                    <path
                      d="M7.5 10.5L9.5 12.5L12.5 7.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        ) : (
          // 單選模式：下拉選擇器
          <div className="relative">
            <div
              className="bg-white box-border content-stretch flex gap-[12px] items-center min-h-[48px] px-[12px] py-[8px] relative rounded-[8px] shrink-0 cursor-pointer border border-neutral-100 hover:border-[#0f6beb] transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {selectedChannels.length > 0 ? (
                <div className="flex items-center gap-[8px] flex-1">
                  <ChannelIcon channel={selectedChannels[0]} size={iconSize} />
                  <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px]">
                    {availableChannels.find(c => c.value === selectedChannels[0])?.label}
                  </p>
                </div>
              ) : (
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#a8a8a8] text-[16px] flex-1">
                  請選擇渠道
                </p>
              )}
              <svg className="size-[28px]" fill="none" viewBox="0 0 28 28">
                <path
                  d="M8.17 11.67L14 17.5L19.83 11.67"
                  stroke="#6E6E6E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {isExpanded && (
              <div className="absolute top-full left-0 right-0 mt-[4px] bg-white border border-neutral-100 rounded-[8px] shadow-lg z-10 overflow-hidden">
                {availableChannels.map((channel) => (
                  <div
                    key={channel.value}
                    className={`
                      py-[12px] px-[12px] hover:bg-slate-50 cursor-pointer flex items-center gap-[8px]
                      ${isSelected(channel.value) ? 'bg-[#f0f6ff]' : ''}
                    `}
                    onClick={() => handleChannelToggle(channel.value)}
                  >
                    <ChannelIcon channel={channel.value} size={iconSize} />
                    <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5]">
                      {channel.label}
                    </p>
                    {isSelected(channel.value) && (
                      <svg className="size-[20px] ml-auto" fill="none" viewBox="0 0 20 20">
                        <path
                          d="M7.5 10.5L9.5 12.5L12.5 7.5"
                          stroke="#0f6beb"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 說明文字 */}
        {multiSelect && (
          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#6e6e6e] text-[12px] mt-[8px]">
            {helpText || '可選擇多個渠道，自動回應將在所選渠道上觸發'}
          </p>
        )}
      </div>
    </div>
  );
}
