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

// 會員來源類型定義
export type MemberSourceType = 'LINE' | 'CRM' | 'PMS' | 'ERP' | '系統' | string;

// 圖標尺寸類型
export type IconSize = 20 | 28;

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
 * 根據來源類型和尺寸獲取 SVG 檔案路徑
 */
function getSourceSvgPath(source: string, size: IconSize): string | null {
  const normalizedSource = source.toUpperCase();

  switch (normalizedSource) {
    case 'LINE':
      return `/src/components/common/icons/assets/source-line-${size}.svg`;
    case 'FACEBOOK':
      return `/src/components/common/icons/assets/source-facebook-${size}.svg`;
    // 未來擴展：
    // case 'CRM':
    //   return `/src/components/common/icons/assets/source-crm-${size}.svg`;
    // case 'PMS':
    //   return `/src/components/common/icons/assets/source-pms-${size}.svg`;
    // case 'ERP':
    //   return `/src/components/common/icons/assets/source-erp-${size}.svg`;
    // case '系統':
    //   return `/src/components/common/icons/assets/source-system-${size}.svg`;
    default:
      return null;
  }
}

/**
 * 獲取來源對應的 Emoji 圖標（降級方案）
 */
function getEmojiIcon(source?: string | null): string {
  if (!source) return '📱';

  const iconMap: Record<string, string> = {
    'LINE': '📱',
    'FACEBOOK': '👥',
    'CRM': '👥',
    'PMS': '🏨',
    'ERP': '💼',
    '系統': '⚙️'
  };

  return iconMap[source.toUpperCase()] || '📱';
}

/**
 * 獲取來源的顯示名稱（用於無障礙標籤）
 */
function getSourceDisplayName(source?: string | null): string {
  if (!source) return 'LINE';

  const nameMap: Record<string, string> = {
    'LINE': 'LINE',
    'FACEBOOK': 'Facebook',
    'CRM': 'CRM 系統',
    'PMS': 'PMS 系統',
    'ERP': 'ERP 系統',
    '系統': '系統'
  };

  return nameMap[source.toUpperCase()] || source;
}

/**
 * 會員來源圖標組件
 *
 * 優先使用 SVG 圖標，不可用時降級為 Emoji
 */
export function MemberSourceIcon({
  source,
  size = 20,
  className = '',
  alt
}: MemberSourceIconProps): React.ReactElement {
  const svgPath = getSourceSvgPath(source, size);
  const displayName = alt || getSourceDisplayName(source);
  const ariaLabel = `會員來源：${displayName}`;

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
          const emoji = getEmojiIcon(source);

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
  const emoji = getEmojiIcon(source);
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
      {emoji}
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
