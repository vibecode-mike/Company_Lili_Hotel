import { memo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

type ChannelStatus = 'connected' | 'expired' | 'pending';
type ChannelPlatform = 'line' | 'facebook' | 'webchat';

interface ChannelStatusBadgeProps {
  status: ChannelStatus;
  platform: ChannelPlatform;
}

/**
 * 頻道帳號狀態徽章（三平台通用）
 * - 已開通 (綠色)：LINE/FB 憑證有效；官網彈窗曾被載入過（一次性開通）
 * - 待開通 (灰色)：官網彈窗尚未偵測到載入；或平台尚未完成設定
 * - 需重新授權 (紅色)：LINE/FB 憑證過期（官網彈窗無 token，不會出現）
 */
export const ChannelStatusBadge = memo(function ChannelStatusBadge({
  status,
  platform
}: ChannelStatusBadgeProps) {
  if (status === 'expired') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="status-badge-expired content-stretch flex items-center justify-center min-w-[32px] px-[8px] py-[4px] relative rounded-md shrink-0 cursor-default">
            <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[16px] text-center whitespace-nowrap">
              需重新授權
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={8} className="max-w-[204px] break-words">
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[12px] w-full text-left">
            {platform === 'facebook'
              ? 'Messenger 安全憑證過期將失去連接您的 Facebook 頁面的權限，請點擊重新授權按鈕'
              : 'LINE Channel 憑證已失效，請重新授權以恢復功能'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (status === 'pending') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="status-badge-pending content-stretch flex items-center justify-center min-w-[32px] px-[8px] py-[4px] relative rounded-md shrink-0 cursor-default">
            <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[16px] text-center whitespace-nowrap">
              待開通
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={8} className="max-w-[228px] break-words">
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[12px] w-full text-left">
            {platform === 'webchat'
              ? '尚未偵測到官網載入客服彈窗。請確認嵌入碼已貼上，並有訪客造訪該頁面後即會自動變為「已開通」'
              : '尚未完成設定，請先填入頻道參數'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="status-badge-connected content-stretch flex items-center justify-center min-w-[32px] px-[8px] py-[4px] relative rounded-md shrink-0 cursor-default">
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[16px] text-center whitespace-nowrap">
            已開通
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={8} className="max-w-[228px] break-words">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[12px] w-full text-left">
          {platform === 'webchat'
            ? '已偵測到官網載入客服彈窗，服務運作中'
            : '如需重新設定或解除連結，請洽系統服務商協助處理'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
});

export default ChannelStatusBadge;
