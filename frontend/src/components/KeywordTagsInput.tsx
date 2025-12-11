/**
 * 关键字标签输入组件
 * 用于自动回应页面的关键字标签管理
 */

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import svgPaths from '../imports/svg-12t3cmqk9i';
import { toast } from 'sonner';

// ========== 类型定义 ==========

export interface KeywordTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  required?: boolean;
}

// ========== 主组件 ==========

export default function KeywordTagsInput({
  tags,
  onChange,
  maxTags = 20,
  maxTagLength = 20,
  required = true,
}: KeywordTagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    
    // 验证
    if (!trimmedValue) return;
    
    if (tags.length >= maxTags) {
      toast.error(`最多只能添加 ${maxTags} 個關鍵字標籤`);
      return;
    }
    
    if (trimmedValue.length > maxTagLength) {
      toast.error(`關鍵字標籤最多 ${maxTagLength} 個字元`);
      return;
    }
    
    if (tags.includes(trimmedValue)) {
      toast.error('此關鍵字標籤已存在，請勿重複添加');
      setInputValue('');
      return;
    }

    // 添加标签
    onChange([...tags, trimmedValue]);
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full flex-col xl:flex-row gap-[8px] xl:gap-0">
      {/* 标签和必填标识 */}
      <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0 w-full xl:w-auto">
        {/* 标题 */}
        <div className="content-stretch flex items-center relative shrink-0">
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
            <p className="leading-[1.5] whitespace-pre">關鍵字標籤</p>
          </div>
        </div>
        
        {/* 必填标识 */}
        {required && (
          <div className="content-stretch flex items-center relative shrink-0">
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
              <p className="leading-[1.5] whitespace-pre">*</p>
            </div>
          </div>
        )}
        
        {/* 信息图标 */}
        <div className="relative shrink-0 size-[24px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
            <g id="Action Button Info Icon">
              <path d={svgPaths.p2cd5ff00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
            </g>
          </svg>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="content-stretch flex flex-col gap-[2px] items-start min-h-px min-w-px relative shrink-0 w-full xl:basis-0 xl:grow xl:w-auto">
        {/* 输入框 */}
        <div 
          className="bg-white min-h-[48px] relative rounded-[8px] shrink-0 w-full cursor-text"
          onClick={handleContainerClick}
        >
          <div 
            aria-hidden="true" 
            className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]"
          />
          <div className="flex flex-col justify-center min-h-inherit size-full">
            <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[16px] relative w-full">
              {/* 标签容器 */}
              <div className="content-center flex flex-wrap gap-[4px] items-center relative shrink-0 w-full">
                {/* 已有标签 */}
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-[#f0f6ff] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0"
                  >
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px]">
                      {tag}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(index);
                      }}
                      className="relative shrink-0 size-[16px] hover:opacity-70 transition-opacity"
                      aria-label={`移除標籤 ${tag}`}
                    >
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                        <g clipPath="url(#clip0_8264_2722)">
                          <g id="Vector"></g>
                          <path d={svgPaths.p2e85a380} fill="var(--fill-0, #A8A8A8)" id="Vector_2" />
                        </g>
                        <defs>
                          <clipPath id="clip0_8264_2722">
                            <rect fill="white" height="16" width="16" />
                          </clipPath>
                        </defs>
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* 输入框 */}
                {tags.length < maxTags && (
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false);
                      // 失去焦点时如果有内容也添加
                      if (inputValue.trim()) {
                        addTag();
                      }
                    }}
                    placeholder={tags.length === 0 ? '點擊 Enter 即可新增關鍵字標籤' : ''}
                    maxLength={maxTagLength}
                    className="flex-1 min-w-[200px] outline-none bg-transparent font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] placeholder:text-[#a8a8a8]"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 字数统计 */}
        <div className="content-stretch flex items-end justify-end relative shrink-0 w-full">
          <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center text-[#6e6e6e] text-[12px] text-right">
            <p className="leading-[1.5]">
              {tags.length}
              <span className="text-[#383838]">/{maxTags}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}