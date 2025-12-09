/**
 * 回覆模式指示器
 *
 * 純 UI 組件（Presentational Component）
 * - 僅負責顯示樣式，不處理任何邏輯
 * - 接收 mode props 決定顯示內容
 * - 不包含任何計時器邏輯
 * - 不直接呼叫 API
 * - 所有狀態管理保留在 ChatRoomLayout.tsx
 *
 * Figma v1087 規格：
 * - 文字: 12px, #6E6E6E
 * - Info 圖標: 20px, #6E6E6E
 * - 內邊距: 8px 水平, 4px 垂直
 * - 圓角: 16px
 * - Tooltip 延遲: 300ms
 *
 * @example
 * <ResponseModeIndicator mode={isGptManualMode ? 'manual' : 'ai_auto'} />
 */

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '../ui/tooltip';
import type { ResponseMode } from './types';
import InfoIconImage from '../../assets/Icon-Info-20.png';

// Props 定義
export interface ResponseModeIndicatorProps {
  /** 回覆模式 */
  mode: ResponseMode;
  /** 自定義 CSS 類名 */
  className?: string;
}

// 模式配置
const MODE_CONFIG: Record<ResponseMode, { label: string; tooltip: string }> = {
  manual: {
    label: '人工回覆',
    tooltip: '離開輸入框或 10 分鐘未輸入後將轉為 AI 回覆'
  },
  ai_auto: {
    label: 'AI 回覆',
    tooltip: '點擊輸入框後將自動轉為人工回覆'
  },
  auto: {
    label: 'AI 回覆',
    tooltip: '點擊輸入框後將自動轉為人工回覆'
  }
};

/**
 * Info 圖標組件
 * 使用 Icon-Info-20.png 圖片
 */
function InfoIcon({ size = 20 }: { size?: number }) {
  return (
    <img
      src={InfoIconImage}
      alt="info"
      width={size}
      height={size}
      className="shrink-0"
    />
  );
}

/**
 * 回覆模式指示器組件
 */
export function ResponseModeIndicator({
  mode,
  className = ''
}: ResponseModeIndicatorProps) {
  const config = MODE_CONFIG[mode];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-[4px] px-[8px] py-[4px] rounded-[16px] cursor-help ${className}`}
          >
            <span className="font-['Noto_Sans_TC:Regular',sans-serif] text-[14px] text-[#A8A8A8] leading-[1.5] whitespace-nowrap">
              {config.label}
            </span>
            <InfoIcon size={20} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={4}>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ResponseModeIndicator;
