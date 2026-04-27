/**
 * 渠道和平台類型定義
 *
 * 這個文件是所有渠道相關類型的單一真實來源 (Single Source of Truth)
 *
 * 類型層次結構：
 * - ChannelPlatform: 核心渠道平台（LINE, Facebook, Instagram）
 * - AutoReplyChannel: 自動回應支持的渠道（LINE, Facebook）
 * - MessagePlatform: 訊息推播支持的平台（LINE, Facebook, Instagram）
 * - MemberSourceType: 會員來源類型（包含渠道 + CRM/PMS/ERP/系統）
 */

// ============================================================================
// 核心類型定義
// ============================================================================

/**
 * 核心渠道平台類型
 * 定義所有可能的渠道平台
 */
export type ChannelPlatform = 'LINE' | 'Facebook' | 'Instagram';

/**
 * 自動回應渠道類型
 * 當前自動回應功能支持的渠道（ChannelPlatform 的子集）
 */
export type AutoReplyChannel = Extract<ChannelPlatform, 'LINE' | 'Facebook'>;

/**
 * 訊息推播平台類型
 * 當前訊息推播功能支持的平台（ChannelPlatform 的子集）
 */
export type MessagePlatform = Extract<ChannelPlatform, 'LINE' | 'Facebook' | 'Instagram'>;

/**
 * 會員來源類型
 * 包含渠道平台 + 其他來源（CRM, PMS, ERP, 系統）
 */
export type MemberSourceType = ChannelPlatform | 'Webchat' | 'CRM' | 'PMS' | 'ERP' | '系統';

// ============================================================================
// 類型守衛函數
// ============================================================================

/**
 * 檢查值是否為有效的 ChannelPlatform
 */
export function isChannelPlatform(value: unknown): value is ChannelPlatform {
  return (
    typeof value === 'string' &&
    (value === 'LINE' || value === 'Facebook' || value === 'Instagram')
  );
}

/**
 * 檢查值是否為有效的 AutoReplyChannel
 */
export function isAutoReplyChannel(value: unknown): value is AutoReplyChannel {
  return typeof value === 'string' && (value === 'LINE' || value === 'Facebook');
}

/**
 * 檢查值是否為有效的 MessagePlatform
 */
export function isMessagePlatform(value: unknown): value is MessagePlatform {
  return (
    typeof value === 'string' &&
    (value === 'LINE' || value === 'Facebook' || value === 'Instagram')
  );
}

/**
 * 檢查值是否為有效的 MemberSourceType
 */
export function isMemberSourceType(value: unknown): value is MemberSourceType {
  return (
    typeof value === 'string' &&
    (value === 'LINE' ||
      value === 'Facebook' ||
      value === 'Instagram' ||
      value === 'Webchat' ||
      value === 'CRM' ||
      value === 'PMS' ||
      value === 'ERP' ||
      value === '系統')
  );
}

// ============================================================================
// 常量定義
// ============================================================================

/**
 * 所有渠道平台列表
 */
export const ALL_CHANNELS: readonly ChannelPlatform[] = [
  'LINE',
  'Facebook',
  'Instagram',
] as const;

/**
 * 自動回應支持的渠道列表
 */
export const AUTO_REPLY_CHANNELS: readonly AutoReplyChannel[] = ['LINE', 'Facebook'] as const;

/**
 * 訊息推播支持的平台列表
 */
export const MESSAGE_PLATFORMS: readonly MessagePlatform[] = [
  'LINE',
  'Facebook',
  'Instagram',
] as const;

/**
 * 所有會員來源列表
 */
export const MEMBER_SOURCES: readonly MemberSourceType[] = [
  'LINE',
  'Facebook',
  'Instagram',
  'Webchat',
  'CRM',
  'PMS',
  'ERP',
  '系統',
] as const;

// ============================================================================
// 配置對象
// ============================================================================

/**
 * 渠道配置接口
 */
export interface ChannelConfig {
  /** 渠道值 */
  value: ChannelPlatform;
  /** 顯示標籤 */
  label: string;
  /** Emoji 圖標（降級方案） */
  emoji: string;
  /** 描述文字 */
  description?: string;
}

/**
 * 會員來源配置接口
 */
export interface MemberSourceConfig {
  /** 來源值 */
  value: MemberSourceType;
  /** 顯示標籤 */
  label: string;
  /** Emoji 圖標 */
  emoji: string;
  /** 描述文字 */
  description?: string;
}

/**
 * 渠道平台配置表
 */
export const CHANNEL_CONFIGS: Record<ChannelPlatform, ChannelConfig> = {
  LINE: {
    value: 'LINE',
    label: 'LINE',
    emoji: '📱',
    description: 'LINE 官方帳號',
  },
  Facebook: {
    value: 'Facebook',
    label: 'Facebook',
    emoji: '👥',
    description: 'Facebook 粉絲專頁',
  },
  Instagram: {
    value: 'Instagram',
    label: 'Instagram',
    emoji: '📷',
    description: 'Instagram 商業帳號',
  },
};

/**
 * 會員來源配置表
 */
export const MEMBER_SOURCE_CONFIGS: Record<MemberSourceType, MemberSourceConfig> = {
  // 渠道來源（復用 CHANNEL_CONFIGS）
  LINE: {
    value: 'LINE',
    label: 'LINE',
    emoji: '📱',
    description: '透過 LINE 加入',
  },
  Facebook: {
    value: 'Facebook',
    label: 'Facebook',
    emoji: '👥',
    description: '透過 Facebook 加入',
  },
  Instagram: {
    value: 'Instagram',
    label: 'Instagram',
    emoji: '📷',
    description: '透過 Instagram 加入',
  },
  Webchat: {
    value: 'Webchat',
    label: 'Web Chat',
    emoji: '💬',
    description: '透過官網彈窗加入',
  },
  // 其他來源
  CRM: {
    value: 'CRM',
    label: 'CRM',
    emoji: '👥',
    description: 'CRM 系統導入',
  },
  PMS: {
    value: 'PMS',
    label: 'PMS',
    emoji: '🏨',
    description: 'PMS 系統導入',
  },
  ERP: {
    value: 'ERP',
    label: 'ERP',
    emoji: '💼',
    description: 'ERP 系統導入',
  },
  '系統': {
    value: '系統',
    label: '系統',
    emoji: '⚙️',
    description: '系統建立',
  },
};

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 獲取渠道配置
 * @param channel 渠道平台
 * @returns 渠道配置對象
 */
export function getChannelConfig(channel: ChannelPlatform): ChannelConfig {
  return CHANNEL_CONFIGS[channel];
}

/**
 * 獲取會員來源配置
 * @param source 會員來源
 * @returns 會員來源配置對象
 */
export function getMemberSourceConfig(source: MemberSourceType): MemberSourceConfig {
  // 防呆：未知來源 fallback 到「系統」，避免 undefined.label 直接讓畫面崩掉
  return MEMBER_SOURCE_CONFIGS[source] || MEMBER_SOURCE_CONFIGS['系統'];
}

/**
 * 將字符串轉換為 AutoReplyChannel（如果有效）
 * @param platform 平台字符串
 * @returns AutoReplyChannel 或 null
 */
export function toAutoReplyChannel(platform: string): AutoReplyChannel | null {
  return isAutoReplyChannel(platform) ? platform : null;
}

/**
 * 將字符串轉換為 MessagePlatform（如果有效）
 * @param platform 平台字符串
 * @returns MessagePlatform 或 null
 */
export function toMessagePlatform(platform: string): MessagePlatform | null {
  return isMessagePlatform(platform) ? platform : null;
}

/**
 * 將字符串轉換為 MemberSourceType（如果有效）
 * @param source 來源字符串
 * @returns MemberSourceType 或 null
 */
export function toMemberSourceType(source: string): MemberSourceType | null {
  return isMemberSourceType(source) ? source : null;
}

/**
 * 檢查渠道平台是否為渠道來源（用於 MemberSourceIcon）
 */
export function isChannelSource(source: MemberSourceType): source is ChannelPlatform {
  return isChannelPlatform(source);
}
