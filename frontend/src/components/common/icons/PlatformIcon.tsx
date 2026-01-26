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
import WebChatIconImg from '../../../assets/Icon-web-chat-16.png';

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
 * WebChat 圖標
 * 使用 Icon-web-chat-16.png 圖片
 */
function WebChatImg({ size }: { size: number }) {
  return (
    <img
      src={WebChatIconImg}
      alt="WebChat"
      width={size}
      height={size}
      className="shrink-0"
    />
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
  // Webchat 使用圖片圖標
  if (platform === 'Webchat') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label="渠道：Web Chat"
      >
        <WebChatImg size={size} />
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
