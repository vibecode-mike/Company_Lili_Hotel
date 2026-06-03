import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiGet, apiPut } from '../utils/apiClient';
import { useChannel } from '../contexts/ChannelContext';

interface PmsConnectModalProps {
  onClose: () => void;
}

/**
 * 「PMS 串接」設定視窗（組織重構）。
 *
 * PMS 綁「組織」層級：設定的是「當前選中組織」的 Hotel Code，
 * 該組織底下的 LINE / 官網彈窗 / FB 全部共用這組 PMS。
 * 從「基本設定 → 新增帳號 → 平台選擇 → PMS 串接」進入。
 */
export function PmsConnectModal({ onClose }: PmsConnectModalProps) {
  const { selectedChannel } = useChannel();
  const orgName = selectedChannel?.channel_name || '（未選組織）';
  // 範圍參數：無 LINE 組織用 tenant_id，否則 line_channel_id
  const scopeQ = selectedChannel?.tenant_id
    ? `tenant_id=${selectedChannel.tenant_id}`
    : selectedChannel?.channel_id
    ? `line_channel_id=${encodeURIComponent(selectedChannel.channel_id)}`
    : '';

  const [hotelcode, setHotelcode] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!scopeQ) {
      setLoading(false);
      setErr('請先在左上角選擇一個組織');
      return;
    }
    setLoading(true);
    apiGet(`/api/v1/chatbot/pms-status?${scopeQ}`)
      .then((r) => r.json())
      .then((d) => {
        setHotelcode(d.hotelcode || '');
        setEnabled(!!d.enabled);
      })
      .catch(() => setErr('載入 PMS 設定失敗'))
      .finally(() => setLoading(false));
  }, [scopeQ]);

  const handleSave = async () => {
    if (!scopeQ) return;
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const res = await apiPut(`/api/v1/chatbot/pms-status?${scopeQ}`, {
        hotelcode: hotelcode.trim(),
        enabled,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `HTTP ${res.status}`);
      }
      setMsg('PMS 設定已儲存。');
    } catch (e) {
      setErr(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-[460px] p-[28px] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-['Noto_Sans_TC',sans-serif] text-[20px] text-[#242424] mb-[4px]">PMS 串接</h2>
        <p className="font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#6e6e6e] mb-[20px]">
          設定「<span className="text-[#0f6beb]">{orgName}</span>」的訂房系統 Hotel Code。
          此組織底下的 LINE / 官網彈窗 / FB 接客房查詢、訂房時都會共用這組 PMS。
        </p>

        {loading ? (
          <p className="text-[14px] text-[#6e6e6e]">載入中…</p>
        ) : (
          <>
            <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
              Hotel Code
            </label>
            <input
              type="text"
              value={hotelcode}
              onChange={(e) => setHotelcode(e.target.value)}
              placeholder="例：ZH01"
              maxLength={50}
              className="w-full border border-[#b6c8f1] rounded-[8px] px-3 py-2 text-[14px] mb-[16px] outline-none focus:border-[#0f6beb]"
            />

            <label className="flex items-center gap-[8px] text-[14px] text-[#383838] mb-[16px] cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              啟用 PMS 即時房況串接
            </label>

            {err && <p className="text-[13px] text-[#d33] mb-[12px]">{err}</p>}
            {msg && <p className="text-[13px] text-[#1a7f37] mb-[12px]">{msg}</p>}

            <div className="flex items-center justify-end gap-[12px] mt-[8px]">
              <button onClick={onClose} className="px-[16px] py-[8px] rounded-[12px] text-[14px] text-[#6e6e6e] hover:bg-[#f0f0f0] transition-colors">
                {msg ? '完成' : '取消'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !scopeQ}
                className="bg-[#242424] px-[20px] py-[8px] rounded-[12px] text-[14px] text-white hover:bg-[#383838] transition-colors disabled:opacity-60"
              >
                {saving ? '儲存中…' : '儲存'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default PmsConnectModal;
