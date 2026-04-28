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

// Webchat 專用 SVG（與左側選單「自動回應」icon 一致：chat bubble + 星星）
const WEBCHAT_ICON_PATH =
  "M10.002 3.3334C8.7996 3.3334 7.59712 3.38045 6.40337 3.47337C4.88253 3.5917 3.59972 4.5209 2.97889 5.8334H2.50037C2.04037 5.8334 1.66704 6.20673 1.66704 6.66673V8.3334C1.66704 8.7934 2.04037 9.16673 2.50037 9.16673H2.502C2.502 9.8259 2.53386 10.4844 2.59803 11.1394C2.79719 13.1386 4.39995 14.7034 6.40662 14.8601C7.60162 14.9526 8.80609 15.0001 10.0053 15.0001C10.5719 15.0001 11.1355 14.99 11.698 14.9691C12.158 14.9516 12.5154 14.5649 12.4987 14.1049C12.4821 13.6449 12.0919 13.2758 11.6361 13.3041C9.94695 13.3641 8.23183 13.3291 6.53683 13.1983C5.336 13.105 4.37572 12.17 4.25656 10.975C4.13739 9.77417 4.13818 8.55683 4.25818 7.35683C4.37735 6.16183 5.33441 5.22849 6.53357 5.13515C8.83691 4.95515 11.1687 4.95515 13.472 5.13515C14.6479 5.22599 15.6234 6.16837 15.7409 7.32754C15.7768 7.67504 15.8016 8.0225 15.8174 8.37083C15.8383 8.82417 16.2228 9.16851 16.6687 9.16185V9.16673H17.502C17.962 9.16673 18.3353 8.7934 18.3353 8.3334V6.66673C18.3345 6.20673 17.9604 5.8334 17.5004 5.8334H17.0267C16.4101 4.52256 15.1256 3.5917 13.6006 3.47337C12.4073 3.38045 11.2044 3.3334 10.002 3.3334ZM10.0004 6.66673C9.38735 6.66673 8.77451 6.68226 8.16118 6.71393C6.86451 6.78143 5.83787 7.84561 5.8337 9.14394V9.18952C5.83787 10.4879 6.86451 11.5504 8.16118 11.6179C9.38784 11.6812 10.6146 11.6812 11.8396 11.6179C13.1362 11.5504 14.1629 10.4879 14.167 9.18952V9.14394C14.1629 7.84561 13.1362 6.78143 11.8396 6.71393C11.2266 6.68226 10.6134 6.66673 10.0004 6.66673ZM8.3337 8.3334C8.7937 8.3334 9.16704 8.70673 9.16704 9.16673C9.16704 9.62673 8.7937 10.0001 8.3337 10.0001C7.8737 10.0001 7.50037 9.62673 7.50037 9.16673C7.50037 8.70673 7.8737 8.3334 8.3337 8.3334ZM11.667 8.3334C12.127 8.3334 12.5004 8.70673 12.5004 9.16673C12.5004 9.62673 12.127 10.0001 11.667 10.0001C11.207 10.0001 10.8337 9.62673 10.8337 9.16673C10.8337 8.70673 11.207 8.3334 11.667 8.3334ZM15.8337 10.0001C15.7695 10.0001 15.7057 10.0459 15.6791 10.1384C15.0007 12.4976 14.502 12.7524 13.4411 13.1658C13.2978 13.2216 13.2978 13.442 13.4411 13.4978C14.5011 13.9111 15.0007 14.1643 15.6791 16.5235C15.7324 16.7085 15.935 16.7085 15.9883 16.5235C16.6667 14.1643 17.1654 13.9111 18.2263 13.4978C18.3696 13.442 18.3696 13.2216 18.2263 13.1658C17.1663 12.7524 16.6667 12.4976 15.9883 10.1384C15.9617 10.0459 15.8979 10.0001 15.8337 10.0001Z";

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

  // Webchat：用左側選單「自動回應」同款 chat-bot SVG（避免 emoji 風格不一致）
  if (source === 'Webchat') {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg width={size} height={size} fill="none" viewBox="0 0 20 20">
          <path fill="#6E6E6E" d={WEBCHAT_ICON_PATH} />
        </svg>
      </span>
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
