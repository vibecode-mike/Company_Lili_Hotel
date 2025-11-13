/**
 * 样式工具函数库
 * 提取重复的样式类为可复用的工具函数
 */

// ========== 颜色常量 ==========

export const COLORS = {
  // 主色
  primary: '#0f6beb',
  primaryLight: '#f0f6ff',
  
  // 文字颜色
  text: {
    primary: '#383838',
    secondary: '#717182',
    placeholder: '#dddddd',
    white: '#ffffff',
  },
  
  // 背景色
  background: {
    white: '#ffffff',
    light: '#f6f9fd',
    lightBlue: '#edf0f8',
    gradient: {
      from: '#a5d8ff',
      to: '#d0ebff',
    },
  },
  
  // 边框颜色
  border: {
    light: '#e1ebf9',
    gray: '#e5e7eb', // gray-200
  },
  
  // 标签颜色
  tag: {
    background: '#f0f6ff',
    text: '#0f6beb',
  },
} as const;

// ========== 字体样式 ==========

export const FONTS = {
  notoSans: "font-['Noto_Sans_TC:Regular',sans-serif]",
  inter: "font-['Inter:Regular',sans-serif]",
  notoSansJP: "font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif]",
} as const;

// ========== 通用样式类 ==========

/**
 * 标签样式
 */
export const tagStyles = {
  base: 'bg-[#f0f6ff] text-[#0f6beb] px-[8px] py-[4px] rounded-[8px] text-[16px] leading-[1.5]',
  inline: 'inline-flex items-center gap-[2px]',
  block: 'flex items-center gap-[2px]',
  small: 'text-[14px] px-[6px] py-[2px]',
} as const;

/**
 * 按钮样式
 */
export const buttonStyles = {
  primary: 'bg-[#242424] text-white px-[12px] py-[8px] rounded-[16px] min-h-[48px] min-w-[72px] hover:bg-[#333333] transition-colors',
  secondary: 'bg-white text-[#383838] px-[12px] py-[8px] rounded-[16px] border border-gray-200 hover:bg-gray-50 transition-colors',
  text: 'text-[#0f6beb] hover:bg-[#f0f6ff] px-[8px] py-[12px] rounded-[12px] transition-colors',
  icon: 'p-[8px] hover:bg-gray-100 rounded-[8px] transition-colors',
} as const;

/**
 * 输入框样式
 */
export const inputStyles = {
  base: `${FONTS.notoSans} text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#717182] border border-gray-200 rounded-[12px] px-[12px] py-[8px] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent`,
  search: `${FONTS.notoSans} text-[20px] leading-[1.5] text-[#383838] placeholder:text-[#dddddd] bg-transparent border-none outline-none`,
  textarea: `${FONTS.notoSans} text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#717182] border border-gray-200 rounded-[12px] px-[12px] py-[8px] resize-none focus:outline-none focus:ring-2 focus:ring-[#0f6beb] focus:border-transparent`,
} as const;

/**
 * 卡片样式
 */
export const cardStyles = {
  base: 'bg-white rounded-[20px] border border-[#e1ebf9]',
  shadow: 'bg-white rounded-[20px] shadow-sm',
  elevated: 'bg-white rounded-[20px] shadow-md',
} as const;

/**
 * 容器样式
 */
export const containerStyles = {
  page: 'flex flex-col gap-[32px] p-[28px] size-full',
  section: 'flex flex-col gap-[20px]',
  header: 'flex flex-col gap-[8px]',
  scrollable: 'overflow-auto rounded-[20px]',
} as const;

/**
 * 表格样式
 */
export const tableStyles = {
  container: 'relative rounded-[20px] border border-[#e1ebf9] overflow-hidden',
  scrollContainer: 'overflow-auto max-h-[600px]',
  header: `${FONTS.notoSans} text-[16px] leading-[1.5] text-[#383838] font-normal`,
  cell: `${FONTS.notoSans} text-[16px] leading-[1.5] text-[#383838]`,
  row: 'hover:bg-gray-50 transition-colors',
} as const;

/**
 * 文字样式
 */
export const textStyles = {
  title: `${FONTS.notoSans} text-[28px] leading-[1.5] text-[#383838]`,
  heading: `${FONTS.notoSans} text-[20px] leading-[1.5] text-[#383838]`,
  body: `${FONTS.notoSans} text-[16px] leading-[1.5] text-[#383838]`,
  caption: `${FONTS.notoSans} text-[14px] leading-[1.5] text-[#717182]`,
  label: `${FONTS.notoSans} text-[16px] leading-[1.5] text-[#383838]`,
} as const;

/**
 * 间距样式
 */
export const spacingStyles = {
  gap: {
    xs: 'gap-[4px]',
    sm: 'gap-[8px]',
    md: 'gap-[12px]',
    lg: 'gap-[20px]',
    xl: 'gap-[32px]',
  },
  padding: {
    xs: 'p-[4px]',
    sm: 'p-[8px]',
    md: 'p-[12px]',
    lg: 'p-[20px]',
    xl: 'p-[28px]',
  },
} as const;

// ========== 工具函数 ==========

/**
 * 合并样式类
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 生成标签样式
 */
export function getTagClassName(variant: 'inline' | 'block' | 'small' = 'block'): string {
  return cn(tagStyles.base, variant === 'small' ? tagStyles.small : tagStyles[variant]);
}

/**
 * 生成按钮样式
 */
export function getButtonClassName(variant: 'primary' | 'secondary' | 'text' | 'icon' = 'primary'): string {
  return cn(buttonStyles[variant], `${FONTS.notoSans} text-center`);
}

/**
 * 生成输入框样式
 */
export function getInputClassName(variant: 'base' | 'search' | 'textarea' = 'base'): string {
  return inputStyles[variant];
}

/**
 * 生成卡片样式
 */
export function getCardClassName(variant: 'base' | 'shadow' | 'elevated' = 'base'): string {
  return cardStyles[variant];
}

/**
 * 生成文字样式
 */
export function getTextClassName(variant: 'title' | 'heading' | 'body' | 'caption' | 'label' = 'body'): string {
  return textStyles[variant];
}

/**
 * 生成间距样式
 */
export function getSpacingClassName(
  type: 'gap' | 'padding',
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'
): string {
  return spacingStyles[type][size];
}
