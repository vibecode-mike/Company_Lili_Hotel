import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Filter, Check } from "lucide-react";
import { ChannelIcon as CommonChannelIcon } from "./icons";
import type { ChannelType } from "../../types/member";
import type { LineChannelInfo } from "../../hooks/useLineChannels";

/**
 * 訊息推播頁的 LINE OA 切換器。
 *
 * 設計脈絡（vs 會員頁的 PlatformFilterDropdown）：
 *  - 單選（不像會員頁是 filter 概念）
 *  - 沒有「所有平台」選項
 *  - 預設選第一個（呼叫端負責）
 *  - 未來 FB 進來時擴充 channel/icon 即可
 *
 * 視覺：trigger 為 16px filter icon（永遠藍色 active 狀態，與會員頁一致）；
 * dropdown 用 portal 渲染避免被表頭 overflow 裁切。
 */
export interface ChannelSwitcherItem {
  key: string;            // 對應 LineChannelInfo.channel_id（未來 FB 可用 page_id）
  channel: ChannelType;   // 'LINE' | 'Facebook' | 'Webchat'
  channelName: string;
}

interface Props {
  items: ChannelSwitcherItem[];
  selectedKey: string;
  onChange: (key: string) => void;
}

export function channelItemsFromLineChannels(channels: LineChannelInfo[]): ChannelSwitcherItem[] {
  return channels.map((c) => ({
    key: c.channel_id,
    channel: "LINE",
    channelName: c.channel_name || `LINE 官方帳號 (${c.channel_id})`,
  }));
}

export default function ChannelSwitcher({ items, selectedKey, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrap = wrapRef.current?.contains(target);
      const insideList = listRef.current?.contains(target);
      if (!insideWrap && !insideList) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const dropdownStyle: CSSProperties = {
    top: dropdownPos.top,
    left: dropdownPos.left,
    zIndex: 1000,
    borderColor: "rgba(221, 221, 221, 0.55)",
    boxShadow:
      "0px 2px 2px 0px rgba(221, 221, 221, 0.32), 0px 5px 15px 0px rgba(221, 221, 221, 0.2)",
  };

  return (
    <div ref={wrapRef} className="relative inline-flex items-center shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center justify-center size-[16px] cursor-pointer bg-transparent border-none p-0 m-0"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="切換 LINE 官方帳號"
      >
        <Filter size={16} color="#0f6beb" strokeWidth={2} />
      </button>

      {open && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          className="fixed min-w-[200px] max-w-[360px] bg-white border border-solid rounded-[12px] flex flex-col gap-[4px] p-[4px]"
          style={dropdownStyle}
        >
          {items.map((opt) => {
            const active = opt.key === selectedKey;
            return (
              <li key={opt.key} role="option" aria-selected={active} className="w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.key);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-[8px] min-h-[48px] p-[8px] rounded-[8px] text-[16px] leading-[1.5] text-[#383838] text-left cursor-pointer transition-colors hover:bg-[#f0f6ff] ${
                    active ? "bg-[#f0f6ff]" : "bg-white"
                  }`}
                >
                  <CommonChannelIcon channel={opt.channel} size={20} />
                  <span className="flex-1 min-w-0 truncate">{opt.channelName}</span>
                  {active && (
                    <Check size={24} className="shrink-0 text-[#0f6beb]" strokeWidth={2} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </div>
  );
}
