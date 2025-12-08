/**
 * 統一渠道圖標組件
 *
 * 支持任意尺寸的渠道圖標顯示，自動選擇最合適的 SVG 資源
 * 當 SVG 不可用時自動降級為 Emoji 圖標
 *
 * @example
 * // 使用預設尺寸 28px
 * <ChannelIcon channel="LINE" />
 *
 * @example
 * // 自定義尺寸
 * <ChannelIcon channel="Facebook" size={24} />
 *
 * @example
 * // 小尺寸圖標（會自動選擇 20px SVG）
 * <ChannelIcon channel="Instagram" size={16} />
 */

import React from 'react';
import type { ChannelPlatform } from '../../../types/channel';
import { getChannelConfig } from '../../../types/channel';

// 組件 Props 定義
export interface ChannelIconProps {
  /** 渠道平台類型 */
  channel: ChannelPlatform;
  /** 圖標尺寸（px），預設 28，支持任意尺寸 */
  size?: number;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 無障礙標籤（覆蓋預設值） */
  alt?: string;
}

/**
 * 根據渠道類型和期望尺寸，選擇最合適的 SVG 檔案路徑
 *
 * 選擇策略：
 * - size <= 20: 使用 20px SVG
 * - size > 20: 使用 28px SVG
 */
function getChannelSvgPath(channel: ChannelPlatform, size: number): string | null {
  const normalizedChannel = channel.toUpperCase();

  // 智能選擇 SVG 尺寸：小於等於 20px 使用 20px SVG，否則使用 28px SVG
  const svgSize = size <= 20 ? 20 : 28;

  switch (normalizedChannel) {
    case 'LINE':
      return `/src/components/common/icons/assets/source-line-${svgSize}.svg`;
    case 'FACEBOOK':
      return `/src/components/common/icons/assets/source-facebook-${svgSize}.svg`;
    case 'INSTAGRAM':
      // Instagram 圖標目前可能尚未準備，返回 null 將降級為 Emoji
      return null;
    default:
      return null;
  }
}

/**
 * 渠道圖標組件
 *
 * 優先使用 SVG 圖標（智能選擇 20px 或 28px），不可用時降級為 Emoji
 */
export function ChannelIcon({
  channel,
  size = 28,
  className = '',
  alt
}: ChannelIconProps): React.ReactElement {
  const config = getChannelConfig(channel);
  const svgPath = getChannelSvgPath(channel, size);
  const displayName = alt || config.label;
  const ariaLabel = `渠道：${displayName}`;

  // 如果有 SVG 圖標，使用 img 標籤載入
  if (svgPath) {
    return (
      <img
        src={svgPath}
        alt={displayName}
        width={size}
        height={size}
        className={`inline-block ${className}`}
        aria-label={ariaLabel}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: 0
        }}
        onError={(e) => {
          // SVG 載入失敗時，降級為 Emoji
          const target = e.target as HTMLImageElement;
          const emoji = config.emoji;

          // 創建一個包含 Emoji 的臨時元素
          const span = document.createElement('span');
          span.textContent = emoji;
          span.className = `inline-block ${className}`;
          span.setAttribute('aria-label', ariaLabel);
          span.setAttribute('role', 'img');
          span.style.fontSize = `${size}px`;
          span.style.lineHeight = '1';
          span.style.width = `${size}px`;
          span.style.height = `${size}px`;
          span.style.display = 'inline-flex';
          span.style.alignItems = 'center';
          span.style.justifyContent = 'center';

          // 替換 img 為 span
          target.parentNode?.replaceChild(span, target);
        }}
      />
    );
  }

  // 沒有 SVG 圖標，直接使用 Emoji
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0
      }}
    >
      {config.emoji}
    </span>
  );
}

// 預設導出主組件
export default ChannelIcon;
