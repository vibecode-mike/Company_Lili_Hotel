/**
 * 全局主題配置
 * 基於原型圖設計規範
 */

export const theme = {
  // 主色系
  colors: {
    primary: '#3B82F6',      // 主要藍色
    primaryLight: '#60A5FA', // 淺藍色
    primaryLighter: '#DBEAFE', // 更淺藍色
    primaryBg: '#EFF6FF',    // 藍色背景

    // 灰階
    dark: '#1F2937',         // 深灰（文字主色）
    gray: '#6B7280',         // 灰色（次要文字）
    grayLight: '#9CA3AF',    // 淺灰
    grayLighter: '#D1D5DB',  // 更淺灰（邊框）
    grayBg: '#F9FAFB',       // 淺灰背景
    grayBg2: '#F3F4F6',      // 灰色背景2

    // 背景色
    background: '#F8F9FA',   // 主背景
    white: '#FFFFFF',        // 白色

    // 狀態色
    success: '#059669',      // 成功
    successBg: '#D1FAE5',    // 成功背景
    warning: '#D97706',      // 警告
    warningBg: '#FEF3C7',    // 警告背景
    info: '#2563EB',         // 資訊
    infoBg: '#DBEAFE',       // 資訊背景
    error: '#DC2626',        // 錯誤
    errorBg: '#FEE2E2',      // 錯誤背景

    // 邊框
    border: '#E5E7EB',       // 邊框色
  },

  // 間距
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },

  // 字體
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif',
    fontSize: {
      xs: '10px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '24px',
      xxxl: '28px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // 圓角
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '50%',
  },

  // 陰影
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },

  // 布局
  layout: {
    sidebarWidth: '240px',
    headerHeight: '64px',
  },

  // 轉場動畫
  transition: {
    base: 'all 0.2s ease',
    fast: 'all 0.15s ease',
    slow: 'all 0.3s ease',
  },
};

export type Theme = typeof theme;
