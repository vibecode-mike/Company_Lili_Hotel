/**
 * 單選 Radio Option（Figma node 1780-34648 unchecked / 1780-34641 checked）
 *
 * 視覺規格：
 * - 24×24 圓圈 wrapper
 * - Ring：r=9 strokeWidth=2（外緣 r=10，剛好對齊 Figma 的 inset-[8.33%] = 20×20 區域）
 * - Inner dot（checked）：r=5（對齊 Figma inset-[29.17%] = 10×10）
 * - 顏色：unchecked stroke #D1D1D1；checked stroke + fill #0F6BEB（Primary/50）
 * - 標籤：text-[#383838] 16px Noto Sans TC Regular
 *
 * 互動：
 * - disabled：cursor-not-allowed + opacity-60，不觸發 onClick
 * - 預設 cursor-pointer + hover:opacity-80
 */

import React from 'react';

export interface RadioOptionProps {
  /** 是否選中 */
  selected: boolean;
  /** 點擊回調（disabled 時不觸發） */
  onClick?: () => void;
  /** 顯示文字 */
  label: string;
  /** 禁用狀態，預設 false */
  disabled?: boolean;
}

export function RadioOption({ selected, onClick, label, disabled = false }: RadioOptionProps) {
  return (
    <div
      className={`content-stretch flex gap-[8px] items-center relative shrink-0 transition-opacity ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'
      }`}
      data-name="Radio Option"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
    >
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Radio Button">
        {selected ? (
          <>
            <div className="absolute inset-0">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="#0F6BEB" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div className="absolute inset-0">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" fill="#0F6BEB" />
              </svg>
            </div>
          </>
        ) : (
          <div className="absolute inset-0">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke="#D1D1D1" strokeWidth="2" fill="none" />
            </svg>
          </div>
        )}
      </div>
      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-nowrap whitespace-pre">
        {label}
      </p>
    </div>
  );
}

export default RadioOption;
