/**
 * 下載對話紀錄 Modal
 * ============================
 * 從會員列表的「下載對話紀錄」按鈕觸發。
 * 選擇渠道、日期區間、會員/非會員/特定對象後，呼叫
 * GET /api/v1/conversations/export.csv 並讓瀏覽器下載 CSV。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DisplayMember } from '../types/member';

type ChannelOpt = 'all' | 'LINE' | 'Facebook' | 'Webchat';
type MemberTypeOpt = 'all' | 'member' | 'guest';

interface Props {
  open: boolean;
  onClose: () => void;
  members: DisplayMember[];
}

export default function DownloadConversationsModal({ open, onClose, members }: Props) {
  const [channel, setChannel] = useState<ChannelOpt>('all');
  const [memberType, setMemberType] = useState<MemberTypeOpt>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberId, setMemberId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ESC 關閉
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // 候選會員：依輸入文字快速搜尋（最多顯示 8 筆）
  const memberCandidates = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((m) => {
        const name = (m.displayName || '').toLowerCase();
        const real = (m.realName || '').toLowerCase();
        return name.includes(q) || real.includes(q);
      })
      .slice(0, 8);
  }, [members, memberQuery]);

  if (!open) return null;

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (channel !== 'all') params.set('channel', channel);
    if (memberType !== 'all') params.set('member_type', memberType);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (memberId !== null) params.set('member_id', String(memberId));
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

        {/* 渠道 */}
        <div className="mb-[16px]">
          <label className="block text-[14px] text-[#6e6e6e] mb-[6px]">渠道</label>
          <div className="flex gap-[8px]">
            {(['all', 'LINE', 'Facebook', 'Webchat'] as ChannelOpt[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setChannel(opt)}
                className={`px-[12px] h-[36px] rounded-[10px] text-[13px] border transition-colors ${
                  channel === opt
                    ? 'bg-[#0f6beb] text-white border-[#0f6beb]'
                    : 'bg-white text-[#6e6e6e] border-[#dddddd] hover:border-[#0f6beb]'
                }`}
              >
                {opt === 'all' ? '全部' : opt}
              </button>
            ))}
          </div>
        </div>

        {/* 會員類型 */}
        <div className="mb-[16px]">
          <label className="block text-[14px] text-[#6e6e6e] mb-[6px]">身份</label>
          <div className="flex gap-[8px]">
            {([
              { k: 'all', label: '全部' },
              { k: 'member', label: '會員' },
              { k: 'guest', label: '非會員' },
            ] as { k: MemberTypeOpt; label: string }[]).map((opt) => (
              <button
                key={opt.k}
                type="button"
                onClick={() => setMemberType(opt.k)}
                className={`px-[12px] h-[36px] rounded-[10px] text-[13px] border transition-colors ${
                  memberType === opt.k
                    ? 'bg-[#0f6beb] text-white border-[#0f6beb]'
                    : 'bg-white text-[#6e6e6e] border-[#dddddd] hover:border-[#0f6beb]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 日期區間 */}
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

        {/* 特定對象（選填） */}
        <div className="mb-[20px]">
          <label className="block text-[14px] text-[#6e6e6e] mb-[6px]">特定對象（選填）</label>
          <input
            type="text"
            value={memberQuery}
            onChange={(e) => {
              setMemberQuery(e.target.value);
              setMemberId(null);
            }}
            placeholder="輸入名稱搜尋…"
            className="w-full px-[12px] h-[40px] border border-[#dddddd] rounded-[10px] text-[14px] outline-none focus:border-[#0f6beb]"
          />
          {memberCandidates.length > 0 && memberId === null && (
            <div className="mt-[6px] border border-[#eef0f3] rounded-[10px] max-h-[160px] overflow-y-auto">
              {memberCandidates.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setMemberId(m.odooMemberId);
                    setMemberQuery(`${m.displayName} (${m.channel})`);
                  }}
                  className="px-[12px] py-[8px] cursor-pointer hover:bg-[#f0f6ff] text-[13px] flex justify-between"
                >
                  <span>{m.displayName}{m.isGuest ? ' [訪客]' : ''}</span>
                  <span className="text-[#6e6e6e]">{m.channel}</span>
                </div>
              ))}
            </div>
          )}
          {memberId !== null && (
            <button
              type="button"
              onClick={() => {
                setMemberId(null);
                setMemberQuery('');
              }}
              className="mt-[6px] text-[12px] text-[#0f6beb] hover:underline"
            >
              清除選擇
            </button>
          )}
        </div>

        {/* 動作按鈕 */}
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
