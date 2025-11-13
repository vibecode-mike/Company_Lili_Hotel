import { ReactNode } from 'react';

/**
 * 共享的容器组件库
 * 用于消除代码重复，提供统一的布局容器
 */

// ========== 标题容器 ==========

interface TitleContainerProps {
  children: ReactNode;
  onBack?: () => void;
}

/**
 * 标题容器 - 用于包裹页面标题区域
 */
export function TitleContainer({ children, onBack }: TitleContainerProps) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Title Container">
      {onBack && (
        <div 
          onClick={onBack}
          className="relative shrink-0 size-[24px] cursor-pointer hover:opacity-70 transition-opacity" 
          data-name="Icon/Arrow Left"
        >
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#383838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {children}
    </div>
  );
}

// ========== 头部容器 ==========

interface HeaderContainerProps {
  children: ReactNode;
}

/**
 * 头部容器 - 用于包裹页面头部区域（标题+描述）
 */
export function HeaderContainer({ children }: HeaderContainerProps) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Header Container">
      {children}
    </div>
  );
}

// ========== 描述容器 ==========

interface DescriptionContainerProps {
  children: ReactNode;
}

/**
 * 描述容器 - 用于包裹页面描述文本
 */
export function DescriptionContainer({ children }: DescriptionContainerProps) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Description Container">
      {children}
    </div>
  );
}

// ========== 按钮容器 ==========

interface ButtonContainerProps {
  children: ReactNode;
  justify?: 'start' | 'center' | 'end' | 'between';
  gap?: number;
}

/**
 * 按钮容器 - 用于包裹一组按钮
 */
export function ButtonContainer({ children, justify = 'start', gap = 8 }: ButtonContainerProps) {
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  }[justify];

  return (
    <div 
      className={`content-stretch flex items-center relative shrink-0 ${justifyClass}`} 
      style={{ gap: `${gap}px` }}
      data-name="Button Container"
    >
      {children}
    </div>
  );
}

// ========== 搜索栏容器 ==========

interface SearchBarContainerProps {
  children: ReactNode;
}

/**
 * 搜索栏容器 - 用于包裹搜索栏和相关操作
 */
export function SearchBarContainer({ children }: SearchBarContainerProps) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Search Bar Container">
      {children}
    </div>
  );
}

// ========== 内容容器 ==========

interface ContentContainerProps {
  children: ReactNode;
  padding?: string;
}

/**
 * 内容容器 - 用于包裹主要内容区域
 */
export function ContentContainer({ children, padding = '40px' }: ContentContainerProps) {
  return (
    <div 
      className="content-stretch flex flex-col items-start relative w-full" 
      style={{ padding }}
      data-name="Content Container"
    >
      {children}
    </div>
  );
}

// ========== 表格容器 ==========

interface TableContainerProps {
  children: ReactNode;
}

/**
 * 表格容器 - 用于包裹表格区域
 */
export function TableContainer({ children }: TableContainerProps) {
  return (
    <div className="w-full" data-name="Table Container">
      {children}
    </div>
  );
}

// ========== 标签容器 ==========

interface TagContainerProps {
  children: ReactNode;
  gap?: number;
}

/**
 * 标签容器 - 用于包裹一组标签
 */
export function TagContainer({ children, gap = 4 }: TagContainerProps) {
  return (
    <div 
      className="flex flex-wrap items-center" 
      style={{ gap: `${gap}px` }}
      data-name="Tag Container"
    >
      {children}
    </div>
  );
}

// ========== 卡片容器 ==========

interface CardContainerProps {
  children: ReactNode;
  padding?: string;
  background?: string;
  rounded?: string;
}

/**
 * 卡片容器 - 用于包裹卡片式内容
 */
export function CardContainer({ 
  children, 
  padding = '16px', 
  background = '#ffffff',
  rounded = '12px'
}: CardContainerProps) {
  return (
    <div 
      className="box-border flex flex-col relative"
      style={{ 
        padding,
        background,
        borderRadius: rounded
      }}
      data-name="Card Container"
    >
      {children}
    </div>
  );
}

// ========== 表单容器 ==========

interface FormContainerProps {
  children: ReactNode;
  gap?: number;
}

/**
 * 表单容器 - 用于包裹表单字段
 */
export function FormContainer({ children, gap = 16 }: FormContainerProps) {
  return (
    <div 
      className="flex flex-col w-full"
      style={{ gap: `${gap}px` }}
      data-name="Form Container"
    >
      {children}
    </div>
  );
}

// ========== 主容器 ==========

interface MainContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * 主容器 - 用于包裹整个页面内容
 */
export function MainContainer({ children, className = '' }: MainContainerProps) {
  return (
    <div 
      className={`bg-slate-50 content-stretch flex flex-col items-start relative w-full ${className}`}
      data-name="Main Container"
    >
      {children}
    </div>
  );
}
