import React from 'react';

export interface TextIconButtonProps {
  /** 按钮显示的文字 */
  text: string;
  /** 图标组件 */
  icon?: React.ReactNode;
  /** 图标位置 */
  iconPosition?: 'left' | 'right';
  /** 点击事件回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 按钮样式变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 是否禁用 */
  disabled?: boolean;
  /** 文字大小 */
  textSize?: '12px' | '14px' | '16px';
}

/**
 * TextIconButton - 文字+图标按钮组件
 * 
 * 通用的按钮组件，支持文字和图标的组合显示
 * 可配置图标位置、样式变体、文字大小等
 * 
 * @example
 * ```tsx
 * <TextIconButton 
 *   text="詳細"
 *   icon={<ArrowIcon direction="right" />}
 *   onClick={handleView}
 *   variant="primary"
 * />
 * ```
 */
export function TextIconButton({
  text,
  icon,
  iconPosition = 'right',
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
  textSize = '14px'
}: TextIconButtonProps) {
  // 样式变体映射
  const variantStyles = {
    primary: 'text-[#0f6beb]',
    secondary: 'text-[#383838]',
    ghost: 'text-[#6e6e6e]',
    danger: 'text-[#f44336]'
  };

  // 禁用状态样式
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer hover:opacity-70';

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`box-border content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 transition-opacity ${variantStyles[variant]} ${disabledStyles} ${className}`}
      data-name="TextIconButton"
    >
      {/* 左侧图标 */}
      {iconPosition === 'left' && icon && (
        <div className="flex items-center justify-center relative shrink-0">
          {icon}
        </div>
      )}
      
      {/* 文字 */}
      <div 
        className={`flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[${textSize}] text-nowrap`}
        style={{ fontSize: textSize }}
      >
        <p className="leading-[1.5] whitespace-pre">{text}</p>
      </div>
      
      {/* 右侧图标 */}
      {iconPosition === 'right' && icon && (
        <div className="flex items-center justify-center relative shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
}
