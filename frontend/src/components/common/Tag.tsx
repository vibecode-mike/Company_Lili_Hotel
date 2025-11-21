/**
 * 通用标签组件
 *
 * 支持多种颜色变体和可选的关闭按钮
 * 用于替换项目中的内联标签实现
 */

import { memo, ReactNode } from 'react';

export interface TagProps {
  /** 标签内容 */
  children: ReactNode;
  /** 颜色变体 */
  variant?: 'blue' | 'yellow' | 'gray';
  /** 关闭按钮回调 */
  onRemove?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 点击回调 */
  onClick?: () => void;
}

/**
 * Tag 组件 - 使用 memo 优化性能
 *
 * @example
 * // 蓝色标签
 * <Tag variant="blue">优惠活动</Tag>
 *
 * @example
 * // 黄色标签（带关闭按钮）
 * <Tag variant="yellow" onRemove={() => console.log('remove')}>送礼</Tag>
 *
 * @example
 * // 灰色标签
 * <Tag variant="gray">KOL</Tag>
 */
const Tag = memo(function Tag({
  children,
  variant = 'blue',
  onRemove,
  className = '',
  onClick
}: TagProps) {

  // 根据变体获取样式
  const getVariantStyles = () => {
    switch (variant) {
      case 'blue':
        return 'bg-[#f0f6ff] text-[#0f6beb]';
      case 'yellow':
        return 'bg-[floralwhite] text-[#eba20f]';
      case 'gray':
        return 'bg-neutral-100 text-neutral-700';
      default:
        return 'bg-[#f0f6ff] text-[#0f6beb]';
    }
  };

  // 获取关闭图标颜色
  const getCloseIconColor = () => {
    switch (variant) {
      case 'blue':
        return '#0f6beb';
      case 'yellow':
        return '#eba20f';
      case 'gray':
        return '#404040';
      default:
        return '#0f6beb';
    }
  };

  return (
    <div
      className={`
        box-border content-stretch flex gap-[2px] items-center justify-center
        min-w-[32px] p-[4px] relative rounded-[8px] shrink-0
        ${getVariantStyles()}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        transition-opacity
        ${className}
      `}
      onClick={onClick}
      data-name="Tag"
    >
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center">
        {children}
      </p>
      {onRemove && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="cursor-pointer hover:opacity-70 transition-opacity"
          aria-label="移除标签"
        >
          <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke={getCloseIconColor()}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
});

export default Tag;
