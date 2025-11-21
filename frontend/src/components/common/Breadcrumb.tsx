import React from 'react';

/**
 * Breadcrumb Item Type
 * 
 * @property label - 面包屑项的显示文本
 * @property onClick - 点击回调（可选）。如果未提供，该项将被视为当前页面（不可点击）
 * @property active - 是否为当前活跃页面（可选）。活跃页面会使用深色文字且不可点击
 */
export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

/**
 * Breadcrumb Props
 */
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb Divider Component
 * 
 * 统一的面包屑分隔符，使用 "/" 斜线符号
 * 颜色：#6E6E6E（中等灰色）
 */
function BreadcrumbDivider() {
  return (
    <div className="flex items-center justify-center px-[2px]" data-name="Breadcrumb Divider">
      <span className="text-[14px] text-[#6e6e6e] select-none">/</span>
    </div>
  );
}

/**
 * Breadcrumb Atomic Component
 * 
 * 单个面包屑项目，支持可点击和激活状态
 * 
 * 颜色规则：
 * - 当前页面（active=true）: #383838（深灰）- 不可点击
 * - 可点击项（有 onClick）:
 *   - 默认: #6e6e6e（中等灰）
 *   - Hover: #0f6beb（蓝色）
 *   - Active/Pressed: #0f6beb（蓝色）
 * - 不可点击项（无 onClick，非 active）: #6e6e6e（中等灰）
 * 
 * 字体规则：
 * - 当前页面（active）: Medium 字重
 * - 其他: Regular 字重
 * 
 * Cursor 规则：
 * - 可点击: pointer
 * - 不可点击: default
 */
function BreadcrumbAtomic({ label, onClick, active = false }: BreadcrumbItem) {
  const isClickable = !!onClick && !active;

  const handleClick = () => {
    console.log('[Breadcrumb] Clicked:', label, 'isClickable:', isClickable);
    if (isClickable && onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`content-stretch flex items-center justify-center relative shrink-0 ${
        isClickable ? 'cursor-pointer group' : 'cursor-default'
      }`}
      data-name="Breadcrumb-atomic"
    >
      <p 
        className={`leading-[1.5] relative shrink-0 text-[14px] text-nowrap whitespace-pre ${
          active 
            ? 'font-medium text-[#383838]' 
            : isClickable
              ? 'font-normal text-[#6e6e6e] group-hover:text-[#0f6beb] group-active:text-[#0f6beb] transition-colors duration-200'
              : 'font-normal text-[#6e6e6e]'
        }`}
      >
        {label}
      </p>
    </div>
  );
}

/**
 * Breadcrumb Module Component
 * 
 * 面包屑导航模块，支持多个层级的导航项目
 * 包含项目之间的分隔符
 */
function BreadcrumbModule({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0" data-name="Breadcrumb Module">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <BreadcrumbAtomic {...item} />
          {index < items.length - 1 && <BreadcrumbDivider />}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Breadcrumb Component
 * 
 * 完整的面包屑导航组件，包含外层容器
 * 
 * 使用规则：
 * - 第一层页面（独立顶级页面）：只有一个面包屑项，标记为 active
 * - 第二层页面（子页面）：第一项是父级（可点击），最后一项是当前页（active）
 * - 分隔符会自动在项目之间添加
 * 
 * 层级示例：
 * - 第一层：活動與訊息推播、自動回應、會員管理
 * - 第二层：會員管理 > 會員資訊、會員管理 > 聊天室
 * 
 * @example
 * // 第一层页面（独立顶级页面）
 * <Breadcrumb items={[{ label: '自動回應', active: true }]} />
 * 
 * @example
 * // 第二层页面（子页面）
 * <Breadcrumb 
 *   items={[
 *     { label: '會員管理', onClick: () => navigate('member-management') },
 *     { label: '會員資訊', active: true }
 *   ]} 
 * />
 * 
 * @example
 * // ❌ 错误：自动回应不是活动与讯息推播的子页面
 * <Breadcrumb 
 *   items={[
 *     { label: '活動與訊息推播', onClick: () => navigate('message-list') },
 *     { label: '自動回應', active: true }  // ❌ 错误的层级
 *   ]} 
 * />
 */
export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <div className={`relative shrink-0 w-full ${className}`.trim()} data-name="Breadcrumb">
      <div className="flex flex-row items-center size-full">
        <BreadcrumbModule items={items} />
      </div>
    </div>
  );
}

/**
 * Simple Breadcrumb Component
 * 
 * 简化版面包屑组件，只包含 BreadcrumbModule 部分
 * 用于不需要外层容器的场景
 * 
 * @example
 * <SimpleBreadcrumb items={[
 *   { label: '會員管理', onClick: () => navigate('member-management') },
 *   { label: '會員資訊', active: true }
 * ]} />
 */
export function SimpleBreadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <div className={className}>
      <BreadcrumbModule items={items} />
    </div>
  );
}

/**
 * Breadcrumb Container Component
 * 
 * 面包屑容器组件，包含标准的 padding 和 margin
 * 适用于页面顶部的面包屑导航
 * 
 * @example
 * <BreadcrumbContainer items={[
 *   { label: '會員管理', active: true }
 * ]} />
 */
export function BreadcrumbContainer({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="mb-[16px]">
      <BreadcrumbModule items={items} />
    </div>
  );
}

/**
 * Page Header with Breadcrumb
 * 
 * 页面标题组件，包含面包屑、标题和描述
 * 这是最常用的页面顶部布局
 * 
 * @example
 * <PageHeaderWithBreadcrumb 
 *   breadcrumbItems={[
 *     { label: '會員管理', onClick: () => navigate('member-management') },
 *     { label: '會員資訊', active: true }
 *   ]}
 *   title="會員資訊"
 *   description="查看和編輯會員的詳細資料"
 * />
 */
export function PageHeaderWithBreadcrumb({
  breadcrumbItems,
  title,
  description,
  hideTitleAndDescription = false
}: {
  breadcrumbItems: BreadcrumbItem[];
  title: string;
  description?: string;
  hideTitleAndDescription?: boolean;
}) {
  return (
    <div className="px-[40px] pt-[48px] pb-0">
      {/* Breadcrumb */}
      <BreadcrumbContainer items={breadcrumbItems} />
      
      {!hideTitleAndDescription && (
        <>
          {/* Title */}
          <div className="mb-[12px]">
            <p className="text-[32px] text-[#383838]">{title}</p>
          </div>
          
          {/* Description */}
          {description && (
            <div className="mb-[24px]">
              <p className="text-[16px] text-[#6e6e6e]">{description}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Helper: Create Breadcrumb Items from Navigation Context
 * 
 * 辅助函数：从导航路径创建 Breadcrumb items
 * 
 * @example
 * import { useNavigate } from '../contexts/NavigationContext';
 * 
 * const navigate = useNavigate();
 * const items = createBreadcrumbItems([
 *   { label: '活動與訊息推播', page: 'message-list' },
 *   { label: '自動回應', page: 'auto-reply' },
 *   { label: '編輯', current: true }
 * ], navigate);
 */
export function createBreadcrumbItems(
  paths: Array<{ label: string; page?: string; current?: boolean }>,
  navigate: (page: string) => void
): BreadcrumbItem[] {
  return paths.map(path => ({
    label: path.label,
    onClick: path.page && !path.current ? () => navigate(path.page) : undefined,
    active: path.current
  }));
}