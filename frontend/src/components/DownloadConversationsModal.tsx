/**
 * 下載對話紀錄 Modal
 * ============================
 * 從會員列表的「下載對話紀錄」按鈕觸發。
 * 選擇平台、日期區間後，呼叫
 * GET /api/v1/conversations/export.csv 並讓瀏覽器下載 CSV。
 */
import { useEffect, useMemo, useState } from 'react';
import type { DisplayMember } from '../types/member';
import {
  PlatformFilterDropdown,
  type BoundChannel,
} from '../imports/MainContainer-6001-1415';

interface Props {
  open: boolean;
  onClose: () => void;
  members: DisplayMember[];
  boundChannels: BoundChannel[];
  // 外層會員列表的平台篩選值，開啟 Modal 時帶入作為初始值（內外對齊）
  initialPlatformFilter?: string;
}

export default function DownloadConversationsModal({
  open,
  onClose,
  members,
  boundChannels,
  initialPlatformFilter = 'all',
}: Props) {
  // 平台篩選：'all' = 所有平台；其餘為 `${channel}|${channelName}`
  const [platformFilter, setPlatformFilter] = useState<string>(initialPlatformFilter);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 每次開啟 Modal 時，將平台篩選同步為外層列表當前的值
  useEffect(() => {
    if (open) setPlatformFilter(initialPlatformFilter);
  }, [open, initialPlatformFilter]);

  // ESC 關閉
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // 平台篩選顯示名稱（給 UI 即時看到目前選了哪個帳號）
  const selectedPlatformLabel = useMemo(() => {
    if (platformFilter === 'all') return '所有平台';
    const found = boundChannels.find((c) => c.key === platformFilter);
    return found?.label || '所有平台';
  }, [platformFilter, boundChannels]);

  // 預計下載人數：依「平台 + 起始/結束日期」過濾 displayMembers
  const expectedCount = useMemo(() => {
    let result = members;

    // 平台篩選：精準比對 channel + channelName
    if (platformFilter !== 'all') {
      const sepIdx = platformFilter.indexOf('|');
      const filterChannel = sepIdx >= 0 ? platformFilter.slice(0, sepIdx) : platformFilter;
      const filterName = sepIdx >= 0 ? platformFilter.slice(sepIdx + 1) : '';
      result = result.filter(
        (m) => m.channel === filterChannel && (m.channelName || '') === filterName,
      );
    }

    // 日期篩選：lastChatTime 落在 [date_from 00:00, date_to 23:59:59] 區間內
    if (dateFrom || dateTo) {
      const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
      const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
      result = result.filter((m) => {
        if (!m.lastChatTime) return false;
        const normalized = m.lastChatTime.includes('T')
          ? m.lastChatTime
          : m.lastChatTime.replace(' ', 'T');
        const ts = Date.parse(normalized);
        if (Number.isNaN(ts)) return false;
        return ts >= fromTs && ts <= toTs;
      });
    }

    return result.length;
  }, [members, platformFilter, dateFrom, dateTo]);

  if (!open) return null;

  const buildUrl = () => {
    const params = new URLSearchParams();
    // 平台篩選 → 取出 channel 部分送給後端（後端僅支援 LINE/Facebook/Webchat 層級）
    if (platformFilter !== 'all') {
      const sepIdx = platformFilter.indexOf('|');
      const filterChannel = sepIdx >= 0 ? platformFilter.slice(0, sepIdx) : platformFilter;
      if (filterChannel) params.set('channel', filterChannel);
    }
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return `/api/v1/conversations/export.csv?${params.toString()}`;
  };

  const handleDownload = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const url = buildUrl();
      // 直接讓瀏覽器處理下載：開新分頁
      // （StreamingResponse + Content-Disposition: attachment 會觸發下載而非顯示）
      const a = document.createElement('a');
      a.href = url;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] w-[480px] max-w-[92vw] p-[24px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-[20px]">
          <h2 className="text-[18px] font-medium text-[#242424]">下載對話紀錄</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6e6e6e] hover:text-[#242424] text-[24px] leading-none"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        {/* 平台：dropdown options 與 UI 對齊會員列表表頭的「平台」欄位 */}
        <div className="mb-[16px]">
          <label className="block text-[14px] text-[#6e6e6e] mb-[6px]">平台</label>
          <div className="flex items-center gap-[8px]">
            <span className="text-[14px] text-[#383838] truncate">{selectedPlatformLabel}</span>
            <PlatformFilterDropdown
              selected={platformFilter}
              onChange={setPlatformFilter}
              boundChannels={boundChannels}
            />
          </div>
        </div>

        {/* 日期區間（不更動） */}
        <div className="mb-[16px] flex gap-[8px]">
          <div className="flex-1">
            <label className="block text-[14px] text-[#6e6e6e] mb-[6px]">起始日期</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-[12px] h-[40px] border border-[#dddddd] rounded-[10px] text-[14px] outline-none focus:border-[#0f6beb]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[14px] text-[#6e6e6e] mb-[6px]">結束日期</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-[12px] h-[40px] border border-[#dddddd] rounded-[10px] text-[14px] outline-none focus:border-[#0f6beb]"
            />
          </div>
        </div>

        {/* 預計下載：依平台 + 日期範圍計算 */}
        <div className="mb-[20px]">
          <p className="text-[14px] text-[#6e6e6e]">
            預計下載：共 <span className="text-[#0f6beb] font-medium">{expectedCount}</span> 位會員
          </p>
        </div>

        {/* 動作按鈕（不更動） */}
        <div className="flex justify-end gap-[8px]">
          <button
            type="button"
            onClick={onClose}
            className="px-[16px] h-[40px] rounded-[10px] border border-[#dddddd] text-[#6e6e6e] hover:bg-[#f5f5f5] text-[14px]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={submitting}
            className="px-[16px] h-[40px] rounded-[10px] bg-[#0f6beb] text-white hover:bg-[#0d5bcc] disabled:opacity-50 text-[14px]"
          >
            {submitting ? '下載中…' : '下載 CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
