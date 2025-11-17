/**
 * 次要按鈕組件 - 全站統一
 * 
 * UI States:
 * - Normal: #f0f6ff background
 * - Hover & Pressed: #f4f8ff background (10% white overlay)
 * 
 * 使用場景：
 * - Drawer 中的操作按鈕
 * - Modal 中的次要操作
 * - 表單中的輔助按鈕
 * 
 * 樣式：
 * - 圓角：32px (pill shape)
 * - 文字顏色：#0f6beb
 * - 內距：12px (左右) x 4px (上下)
 */

import React from "react";

export interface SecondaryButtonProps {
  /** 按鈕文字 */
  text: string;
  /** 點擊事件處理器 */
  onClick: () => void;
  /** 自訂 className */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

export function SecondaryButton({ 
  text, 
  onClick, 
  className = "",
  disabled = false 
}: SecondaryButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  // Calculate background color with 10% white overlay
  const getBackgroundColor = () => {
    if (disabled) {
      return '#f0f6ff';
    }
    if (isPressed || isHovered) {
      // #f0f6ff with 10% white overlay
      return '#f4f8ff';
    }
    return '#f0f6ff';
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      className={`box-border content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[32px] shrink-0 transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`}
      data-name="Icon+Text Button*Secondary"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#0f6beb] text-[16px] text-center text-nowrap whitespace-pre">
        {text}
      </p>
    </button>
  );
}
