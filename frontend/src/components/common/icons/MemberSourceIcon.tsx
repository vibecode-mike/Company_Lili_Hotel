/**
 * 會員來源圖標組件
 *
 * 使用 SVG 圖標顯示會員的加入來源（LINE, CRM, PMS, ERP, 系統）
 * 當 SVG 不可用時自動降級為 Emoji 圖標
 *
 * @example
 * // 使用 20px 圖標（詳情頁）
 * <MemberSourceIconSmall source="LINE" />
 *
 * @example
 * // 使用 28px 圖標（列表頁）
 * <MemberSourceIconLarge source="LINE" />
 *
 * @example
 * // 自定義尺寸
 * <MemberSourceIcon source="LINE" size={24} className="custom-class" />
 */

import React from 'react';
import type { MemberSourceType, ChannelPlatform } from '../../../types/channel';
import { getMemberSourceConfig, isChannelPlatform } from '../../../types/channel';
import { ChannelIcon } from './ChannelIcon';

// 重新導出類型（向後兼容）
export type { MemberSourceType };

// 圖標尺寸類型 - 現在支持任意數值
export type IconSize = number;

// 組件 Props 定義
export interface MemberSourceIconProps {
  /** 會員來源類型 */
  source: MemberSourceType;
  /** 圖標尺寸（px），預設 20 */
  size?: IconSize;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 無障礙標籤（覆蓋預設值） */
  alt?: string;
}

/**
 * 會員來源圖標組件
 *
 * - 渠道來源（LINE, Facebook, Instagram）：使用 ChannelIcon 組件
 * - 非渠道來源（CRM, PMS, ERP, 系統）：直接使用 Emoji
 */
export function MemberSourceIcon({
  source,
  size = 20,
  className = '',
  alt
}: MemberSourceIconProps): React.ReactElement {
  const config = getMemberSourceConfig(source);
  const displayName = alt || config.label;
  const ariaLabel = `會員來源：${displayName}`;

  // 如果是渠道平台，使用 ChannelIcon
  if (isChannelPlatform(source)) {
    return (
      <ChannelIcon
        channel={source as ChannelPlatform}
        size={size}
        className={className}
        alt={displayName}
      />
    );
  }

  // 非渠道來源（CRM, PMS, ERP, 系統），直接使用 Emoji
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

/**
 * 小尺寸圖標組件（20px）
 * 用於會員詳情頁和聊天室會員資訊面板
 */
export function MemberSourceIconSmall(
  props: Omit<MemberSourceIconProps, 'size'>
): React.ReactElement {
  return <MemberSourceIcon {...props} size={20} />;
}

/**
 * 大尺寸圖標組件（28px）
 * 用於會員管理列表頁
 */
export function MemberSourceIconLarge(
  props: Omit<MemberSourceIconProps, 'size'>
): React.ReactElement {
  return <MemberSourceIcon {...props} size={28} />;
}

// 預設導出主組件
export default MemberSourceIcon;
