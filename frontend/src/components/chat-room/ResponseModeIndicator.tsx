/**
 * 回覆模式指示器
 *
 * 純 UI 組件（Presentational Component）
 * - 僅負責顯示樣式，不處理任何邏輯
 * - 接收 mode props 決定顯示內容
 * - 不包含任何計時器邏輯
 * - 不直接呼叫 API
 * - 所有狀態管理保留在 ChatRoomLayout.tsx
 *
 * Figma v1087 規格：
 * - 文字: 12px, #6E6E6E
 * - Info 圖標: 20px, #6E6E6E
 * - 內邊距: 8px 水平, 4px 垂直
 * - 圓角: 16px
 * - Tooltip 延遲: 300ms
 *
 * @example
 * <ResponseModeIndicator mode={isGptManualMode ? 'manual' : 'ai_auto'} />
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ResponseMode } from './types';

// Props 定義
export interface ResponseModeIndicatorProps {
  /** 回覆模式 */
  mode: ResponseMode;
  /** 自定義 CSS 類名 */
  className?: string;
}

// 模式配置
const MODE_CONFIG: Record<ResponseMode, { label: string; tooltip: string }> = {
  manual: {
    label: '人工回覆',
    tooltip: '離開輸入框或 10 分鐘未輸入後將轉為 AI 回覆'
  },
  ai_auto: {
    label: 'AI 回覆',
    tooltip: '點擊輸入框後將自動轉為人工回覆'
  },
  auto: {
    label: 'AI 回覆',
    tooltip: '點擊輸入框後將自動轉為人工回覆'
  }
};

/**
 * Info 圖標（與 InsightsPanel 之 InfoIcon 規格一致：20×20、#9CA3AF）
 */
function InfoIcon() {
  return (
    <svg
      className="shrink-0 size-[20px]"
      fill="none"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <g transform="translate(2 2) scale(1.125)">
        <path
          fill="#9CA3AF"
          d="M5.33333 10.6667C2.38773 10.6667 0 8.27893 0 5.33333C0 2.38773 2.38773 0 5.33333 0C8.27893 0 10.6667 2.38773 10.6667 5.33333C10.6667 8.27893 8.27893 10.6667 5.33333 10.6667ZM5.33333 9.6C6.46492 9.6 7.55017 9.15048 8.35032 8.35032C9.15048 7.55017 9.6 6.46492 9.6 5.33333C9.6 4.20174 9.15048 3.1165 8.35032 2.31634C7.55017 1.51619 6.46492 1.06667 5.33333 1.06667C4.20174 1.06667 3.1165 1.51619 2.31634 2.31634C1.51619 3.1165 1.06667 4.20174 1.06667 5.33333C1.06667 6.46492 1.51619 7.55017 2.31634 8.35032C3.1165 9.15048 4.20174 9.6 5.33333 9.6ZM4.8 2.66667H5.86667V3.73333H4.8V2.66667ZM4.8 4.8H5.86667V8H4.8V4.8Z"
        />
      </g>
    </svg>
  );
}

/**
 * 回覆模式指示器組件
 *
 * Tooltip 採 InsightsPanel 同款：#383838 底、白字、12px、Noto Sans TC、8px 圓角、8px padding。
 * 觸發區維持原有 wrapper（label + icon 整塊都會觸發 tooltip），不更動觸發行為。
 */
export function ResponseModeIndicator({
  mode,
  className = ''
}: ResponseModeIndicatorProps) {
  const config = MODE_CONFIG[mode];
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [visible]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`flex items-center gap-[4px] px-[8px] py-[4px] rounded-[16px] cursor-pointer ${className}`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
      >
        <span className="font-['Noto_Sans_TC:Regular',sans-serif] text-[14px] text-[#A8A8A8] leading-[1.5] whitespace-nowrap">
          {config.label}
        </span>
        <InfoIcon />
      </div>
      {visible &&
        createPortal(
          <div
            className="fixed bg-[#383838] text-white text-[12px] leading-[1.5] font-['Noto_Sans_TC',sans-serif] font-normal rounded-[8px] p-[8px] pointer-events-none"
            style={{ zIndex: 9999, top: pos.top, left: pos.left, maxWidth: 320 }}
          >
            {config.tooltip}
          </div>,
          document.body,
        )}
    </>
  );
}

export default ResponseModeIndicator;
