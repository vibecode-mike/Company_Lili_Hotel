/**
 * 取消按鈕
 *
 * UI 復用「編輯會員標籤」modal footer 的取消按鈕樣式：
 * - 無底色，hover 時 bg-neutral-100
 * - 文字色 #383838、字級 16px
 * - rounded-[16px]、min-h-[48px]、min-w-[72px]
 *
 * 功能由呼叫端透過 onClick 自行實作（保留 e.stopPropagation() 等需求）
 */

import React from 'react';

export interface CancelButtonProps {
  /** 點擊事件 */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** 按鈕文字，預設「取消」 */
  label?: string;
  /** 額外 class，會接到外層 div 末尾 */
  className?: string;
  /** 禁用狀態：阻擋點擊、移除 hover、降透明度（與既有 disabled:opacity-60 行為一致） */
  disabled?: boolean;
}

export function CancelButton({ onClick, label = '取消', className = '', disabled = false }: CancelButtonProps) {
  return (
    <div
      role="button"
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
      }}
      className={`box-border flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] transition-colors ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:bg-neutral-100'
      } ${className}`}
    >
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5] text-center">
        {label}
      </p>
    </div>
  );
}

export default CancelButton;
