/**
 * 搜索容器组件库
 * 统一管理所有搜索相关的容器组件
 */

import React from 'react';
import svgPaths from '../../imports/svg-2wnb18j5t0';

// ========== 类型定义 ==========

export interface SearchContainerProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

// ========== 搜索输入框 ==========

function SearchInput({ 
  value, 
  onChange, 
  onSearch,
  placeholder = '以會員資訊或標籤搜尋' 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  onSearch: () => void;
  placeholder?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
      {/* 搜索图标 */}
      <div className="overflow-clip relative shrink-0 size-[32px]" data-name="Icon/Search">
        <div className="absolute h-[17.575px] left-[calc(50%-0.2px)] top-[calc(50%-0.212px)] translate-x-[-50%] translate-y-[-50%] w-[17.6px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
            <path d={svgPaths.p29b263c0} fill="var(--fill-0, #A8A8A8)" />
          </svg>
        </div>
      </div>
      
      {/* 输入框 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="font-['Noto_Sans_TC:Regular',sans-serif] leading-[1.5] flex-1 text-[#383838] text-[20px] bg-transparent border-none outline-none placeholder:text-[#dddddd]"
      />
    </div>
  );
}

// ========== 清除按钮 ==========

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="overflow-clip relative shrink-0 size-[24px] cursor-pointer hover:opacity-70 transition-opacity" 
      data-name="Cancel circle"
    >
      <div className="absolute inset-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g opacity="0.87"></g>
        </svg>
      </div>
      <div className="absolute inset-[8.333%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
          <path d={svgPaths.pb584900} fill="var(--fill-0, #DDDDDD)" />
        </svg>
      </div>
    </div>
  );
}

// ========== 主搜索容器 ==========

/**
 * 搜索容器组件
 * 包含搜索输入框和清除条件按钮
 */
export function SearchContainer({ 
  value, 
  onChange, 
  onSearch, 
  onClear,
  placeholder,
  className = '' 
}: SearchContainerProps) {
  return (
    <div className={`content-stretch flex gap-[4px] items-center relative size-full ${className}`}>
      {/* 搜索栏 */}
      <div className="bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 w-[292px]">
        <SearchInput 
          value={value} 
          onChange={onChange} 
          onSearch={onSearch}
          placeholder={placeholder}
        />
        {value && <ClearButton onClick={onClear} />}
      </div>
      
      {/* 清除全部条件按钮 */}
      <div 
        onClick={onClear}
        className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] px-[8px] py-[12px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors h-[48px]"
      >
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">
          清除全部條件
        </p>
      </div>
    </div>
  );
}

// ========== 简化搜索栏 ==========

/**
 * 简化搜索栏 - 只包含输入框和内部清除按钮
 */
export function SimpleSearchBar({ 
  value, 
  onChange, 
  onSearch, 
  onClear,
  placeholder,
  className = '' 
}: SearchContainerProps) {
  return (
    <div className={`bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 w-[292px] ${className}`}>
      <SearchInput 
        value={value} 
        onChange={onChange} 
        onSearch={onSearch}
        placeholder={placeholder}
      />
      {value && <ClearButton onClick={onClear} />}
    </div>
  );
}
