import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useChannel } from '../contexts/ChannelContext';

interface SidebarChannelSwitcherProps {
  /** sidebar 收起時隱藏（依現有 Sidebar.tsx 設計）*/
  isOpen: boolean;
}

/**
 * Sidebar 頂部「館別切換」元件。
 *
 * 設計：
 * - 兩行顯示：channel_name（主，深色）+ basic_id（副，灰色）
 * - 點擊展開下拉選單
 * - 選中項打勾
 * - 點外部 / Esc 關閉
 * - sidebar 收起時不顯示
 *
 * 未來權限模組會在 ChannelContext 內過濾可用 channels，
 * 這支元件不用改動。
 */
export function SidebarChannelSwitcher({ isOpen }: SidebarChannelSwitcherProps) {
  const { selectedChannel, availableChannels, setSelectedChannel, loading } = useChannel();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // 點外部關閉 dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [dropdownOpen]);

  if (!isOpen) return null;

  return (
    <div className="box-border flex flex-col gap-1 px-4 mb-4">
      <p className="text-[12px] leading-[16px] text-[#717182] tracking-wide mb-1">館別切換</p>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          disabled={loading || availableChannels.length === 0}
          className="w-full bg-white border border-[#b6c8f1] rounded-[8px] px-3 py-2 flex items-center justify-between gap-2 text-left hover:border-[#0f6beb] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex-1 min-w-0">
            {loading ? (
              <p className="text-[14px] text-[#717182]">載入中…</p>
            ) : selectedChannel ? (
              <>
                <p className="text-[14px] leading-[18px] text-[#383838] truncate">
                  {selectedChannel.channel_name || `LINE OA (${selectedChannel.channel_id})`}
                </p>
                {selectedChannel.basic_id && (
                  <p className="text-[12px] leading-[14px] text-[#717182] truncate mt-[2px]">
                    {selectedChannel.basic_id}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[14px] text-[#717182]">尚未設定館別</p>
            )}
          </div>
          <ChevronDown
            className={`shrink-0 size-4 text-[#717182] transition-transform ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {dropdownOpen && availableChannels.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#b6c8f1] rounded-[8px] shadow-md z-[60] max-h-[320px] overflow-y-auto">
            {availableChannels.map((channel) => {
              const isSelected = selectedChannel?.channel_id === channel.channel_id;
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => {
                    setSelectedChannel(channel);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-[#eaf2ff]' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] leading-[18px] text-[#383838] truncate">
                      {channel.channel_name || `LINE OA (${channel.channel_id})`}
                    </p>
                    {channel.basic_id && (
                      <p className="text-[12px] leading-[14px] text-[#717182] truncate mt-[2px]">
                        {channel.basic_id}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="shrink-0 size-4 text-[#0f6beb] mt-[2px]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
