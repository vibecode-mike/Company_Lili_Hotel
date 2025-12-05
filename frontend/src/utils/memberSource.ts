/**
 * 會員來源格式化工具
 * 將資料庫的 join_source 值轉換為顯示用的友善文字，包含圖標和名稱
 */

/**
 * 取得來源對應的圖標
 * @param source - 來源代碼 (LINE, CRM, PMS, ERP, 系統)
 * @returns 來源圖標
 * @deprecated 請使用 MemberSourceIcon 組件代替
 */
export function getSourceIcon(source?: string | null): string {
  if (!source) return '📱';

  const iconMap: Record<string, string> = {
    'LINE': '📱',
    'CRM': '👥',
    'PMS': '🏨',
    'ERP': '💼',
    '系統': '⚙️'
  };

  return iconMap[source.toUpperCase()] || '📱';
}

/**
 * 格式化會員來源顯示（包含圖標和名稱）
 * @param source - 來源代碼 (LINE, CRM, PMS, ERP, 系統)
 * @param displayName - 顯示名稱（如 LINE 名稱）
 * @returns 格式化後的顯示文字（圖標 + 名稱）
 * @deprecated 請使用 MemberSourceIcon 組件配合 formatJoinSourceText 代替
 */
export function formatJoinSource(source?: string | null, displayName?: string | null): string {
  const icon = getSourceIcon(source);

  // 如果有提供顯示名稱，則使用「圖標 名稱」格式
  if (displayName) {
    return `${icon} ${displayName}`;
  }

  // 沒有顯示名稱時，只顯示圖標和來源類型
  const sourceMap: Record<string, string> = {
    'LINE': 'LINE',
    'CRM': 'CRM',
    'PMS': 'PMS',
    'ERP': 'ERP',
    '系統': '系統'
  };

  const sourceText = source ? (sourceMap[source.toUpperCase()] || source) : 'LINE';
  return `${icon} ${sourceText}`;
}

/**
 * 格式化會員來源顯示文字（不含圖標）
 * 配合 MemberSourceIcon 組件使用
 * @param source - 來源代碼 (LINE, CRM, PMS, ERP, 系統)
 * @param displayName - 顯示名稱（如 LINE 名稱）
 * @returns 格式化後的顯示文字（僅文字，不含圖標）
 */
export function formatJoinSourceText(source?: string | null, displayName?: string | null): string {
  // 如果有提供顯示名稱，直接使用
  if (displayName) {
    return displayName;
  }

  // 沒有顯示名稱時，顯示來源類型
  const sourceMap: Record<string, string> = {
    'LINE': 'LINE',
    'CRM': 'CRM',
    'PMS': 'PMS',
    'ERP': 'ERP',
    '系統': '系統'
  };

  return source ? (sourceMap[source.toUpperCase()] || source) : 'LINE';
}
