import React from 'react';

export interface ArrowIconProps {
  /** 箭头方向 */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** 箭头颜色 */
  color?: string;
  /** 图标大小 */
  size?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * ArrowIcon - 箭头图标组件
 * 
 * 根据 Figma 设计稿完全重构的箭头图标
 * 支持四个方向的箭头显示，可配置颜色和大小
 * 使用 SVG 路径渲染，保持 Figma 导入的原始样式
 * 
 * @example
 * ```tsx
 * <ArrowIcon direction="right" color="#0F6BEB" />
 * <ArrowIcon direction="left" color="#383838" size={20} />
 * ```
 */
export function ArrowIcon({
  direction = 'right',
  color = '#0F6BEB',
  size = 16,
  className = ''
}: ArrowIconProps) {
  // 方向到旋转角度的映射（基于向右箭头）
  const rotationMap = {
    right: '0deg',      // 默认向右，不旋转
    down: '90deg',      // 顺时针 90 度
    left: '180deg',     // 顺时针 180 度
    up: '270deg'        // 顺时针 270 度（或逆时针 90 度）
  };

  // SVG 路径（从 Figma 设计稿导入 - 向右箭头）
  const svgPath = 'M5.99836 4.91167L8.58503 7.49833L5.99836 10.085C5.73836 10.345 5.73836 10.765 5.99836 11.025C6.25836 11.285 6.67836 11.285 6.93836 11.025L9.99836 7.965C10.2584 7.705 10.2584 7.285 9.99836 7.025L6.93836 3.965C6.67836 3.705 6.25836 3.705 5.99836 3.965C5.74503 4.225 5.73836 4.65167 5.99836 4.91167Z';

  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: size,
        height: size,
        transform: `rotate(${rotationMap[direction]})`
      }}
      data-name="Arrow"
    >
      <svg 
        className="block size-full" 
        fill="none" 
        preserveAspectRatio="none" 
        viewBox="0 0 16 16"
      >
        <path 
          d={svgPath} 
          fill={color}
          id="Vector" 
        />
      </svg>
    </div>
  );
}

/**
 * ArrowRightIcon - 向右箭头的快捷组件
 */
export function ArrowRightIcon(props: Omit<ArrowIconProps, 'direction'>) {
  return <ArrowIcon {...props} direction="right" />;
}

/**
 * ArrowLeftIcon - 向左箭头的快捷组件
 */
export function ArrowLeftIcon(props: Omit<ArrowIconProps, 'direction'>) {
  return <ArrowIcon {...props} direction="left" />;
}

/**
 * ArrowUpIcon - 向上箭头的快捷组件
 */
export function ArrowUpIcon(props: Omit<ArrowIconProps, 'direction'>) {
  return <ArrowIcon {...props} direction="up" />;
}

/**
 * ArrowDownIcon - 向下箭头的快捷组件
 */
export function ArrowDownIcon(props: Omit<ArrowIconProps, 'direction'>) {
  return <ArrowIcon {...props} direction="down" />;
}
