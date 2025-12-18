import { memo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

interface ChannelStatusBadgeProps {
  status: 'connected' | 'expired';
  platform: 'line' | 'facebook';
}

/**
 * 頻道連結狀態徽章
 * - 已連結 (綠色): #e4fcea 背景 + #00470c 文字
 * - 連結已失效 (紅色): #ffebee 背景 + #b71c1c 文字
 */
export const ChannelStatusBadge = memo(function ChannelStatusBadge({
  status,
  platform
}: ChannelStatusBadgeProps) {
  if (status === 'expired') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-[#ffebee] content-stretch flex items-center justify-center min-w-[32px] px-[8px] py-[4px] relative rounded-[8px] shrink-0 cursor-default">
            <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#b71c1c] text-[16px] text-center whitespace-nowrap">
              連結已失效
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={8} className="max-w-[204px] break-words">
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[12px] w-full text-left">
            {platform === 'facebook'
              ? 'Messenger 安全憑證過期將失去連接您的 Facebook 頁面的權限，請點擊重新授權按鈕'
              : 'LINE Channel 連結已失效，請重新設定以恢復功能'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-[#e4fcea] content-stretch flex items-center justify-center min-w-[32px] px-[8px] py-[4px] relative rounded-[8px] shrink-0 cursor-default">
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#00470c] text-[16px] text-center whitespace-nowrap">
            已連結
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[12px]">
          如需重新設定或解除連結，請洽系統服務商協助處理
        </p>
      </TooltipContent>
    </Tooltip>
  );
});

export default ChannelStatusBadge;
