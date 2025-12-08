/**
 * 平台切換器
 *
 * 下拉選擇器切換 LINE / Facebook / Web Chat
 *
 * Figma v1087 規格：
 * - 按鈕 gap: 8px
 * - 按鈕 padding: 8px / 2px
 * - 按鈕圓角: 16px
 * - 懸停背景: #e2edfd
 * - 下拉選單圓角: 12px
 * - 下拉選單陰影: 0px 4px 16px rgba(0,0,0,0.12)
 * - 點擊外部自動關閉
 *
 * @example
 * <PlatformSwitcher
 *   value={currentPlatform}
 *   onChange={setCurrentPlatform}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import { PlatformIcon } from '../common/icons/PlatformIcon';
import type { ChatPlatform } from './types';

// Props 定義
export interface PlatformSwitcherProps {
  /** 當前選中的平台 */
  value: ChatPlatform;
  /** 平台變更回調 */
  onChange: (platform: ChatPlatform) => void;
  /** 自定義 CSS 類名 */
  className?: string;
}

// 可選平台列表
const PLATFORMS: { value: ChatPlatform; label: string }[] = [
  { value: 'LINE', label: 'LINE' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'WebChat', label: 'Web Chat' }
];

/**
 * 下拉箭頭圖標
 */
function ChevronDownIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${
        isOpen ? 'rotate-180' : ''
      }`}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="#6E6E6E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 勾選圖標
 */
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M13.5 4.5L6 12L2.5 8.5"
        stroke="#0f6beb"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 平台切換器組件
 */
export function PlatformSwitcher({
  value,
  onChange,
  className = ''
}: PlatformSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 當前選中的平台配置
  const currentPlatform = PLATFORMS.find((p) => p.value === value) || PLATFORMS[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 觸發按鈕 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center justify-between gap-[8px] px-[8px] py-[2px] rounded-[16px] transition-colors focus:outline-none ${
          isHovered && !isOpen ? 'bg-[#e2edfd]' : ''
        }`}
      >
        <PlatformIcon platform={value} size={28} />
        <span className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] text-[#6e6e6e] whitespace-nowrap">
          {currentPlatform.label}
        </span>
        <ChevronDownIcon isOpen={isOpen} />
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 bg-white rounded-[12px] overflow-hidden z-50 min-w-[140px]"
          style={{ boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)' }}
        >
          <div className="flex flex-col gap-[8px] py-[8px]">
            {PLATFORMS.map((platform) => {
              const isSelected = platform.value === value;
              return (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => {
                    onChange(platform.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-[8px] w-full px-[8px] py-[4px] transition-colors hover:bg-[#f6f9fd] ${
                    isSelected ? 'bg-[#f6f9fd]' : ''
                  }`}
                >
                  <PlatformIcon platform={platform.value} size={20} />
                  <span className="font-['Noto_Sans_TC:Regular',sans-serif] text-[14px] text-[#383838] flex-1 text-left">
                    {platform.label}
                  </span>
                  {isSelected && <CheckIcon />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlatformSwitcher;
