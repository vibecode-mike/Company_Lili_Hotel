/**
 * 平台圖標組件
 *
 * Figma v1087 規格：
 * - 支援 LINE / Facebook / WebChat
 * - 尺寸: 16px / 20px / 28px
 * - 需要包裝器防止圖標壓縮 (shrink-0)
 *
 * @example
 * <PlatformIcon platform="LINE" size={20} />
 * <PlatformIcon platform="WebChat" size={28} />
 */

import React from 'react';
import { ChannelIcon } from './ChannelIcon';
import type { ChannelPlatform } from '../../../types/channel';
import type { ChatPlatform } from '../../chat-room/types';

// 組件 Props 定義
export interface PlatformIconProps {
  /** 平台類型 */
  platform: ChatPlatform;
  /** 圖標尺寸（px），預設 20 */
  size?: number;
  /** 自定義 CSS 類名 */
  className?: string;
}

/**
 * WebChat SVG 圖標
 * 地球+聊天符號，表示網頁聊天
 */
function WebChatSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
        fill="#6E6E6E"
      />
    </svg>
  );
}

/**
 * 平台圖標組件
 *
 * 優先使用現有 ChannelIcon，WebChat 使用自定義 SVG
 */
export function PlatformIcon({
  platform,
  size = 20,
  className = ''
}: PlatformIconProps): React.ReactElement {
  // WebChat 使用自定義 SVG 圖標
  if (platform === 'WebChat') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label="渠道：Web Chat"
      >
        <WebChatSvg size={size} />
      </div>
    );
  }

  // LINE 和 Facebook 使用現有 ChannelIcon
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <ChannelIcon channel={platform as ChannelPlatform} size={size} />
    </div>
  );
}

export default PlatformIcon;
