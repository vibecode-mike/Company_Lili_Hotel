import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiGet, apiPatch } from '../utils/apiClient';

interface BindWebchatToLineModalProps {
  /** 要綁定的官網站點代號（= site_id）*/
  siteId: string;
  /** 官網顯示名稱（標題用）*/
  siteName?: string;
  onClose: () => void;
  /** 綁定成功後回呼（父層刷新列表 / 切換器）*/
  onBound?: () => void;
}

interface LineOption {
  channel_id: string;
  channel_name: string;
}

/**
 * 把一個「獨立官網」站點重新綁定到某個既有 LINE OA。
 * 下拉只列「還沒綁官網」的 LINE（1 LINE 1 官網）。
 * 綁定 → PATCH /api/v1/webchat_sites/{siteId}/bind，後端會把既有訪客一起搬到該組織。
 */
export function BindWebchatToLineModal({ siteId, siteName, onClose, onBound }: BindWebchatToLineModalProps) {
  const [lineOptions, setLineOptions] = useState<LineOption[]>([]);
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [lineRes, siteRes] = await Promise.all([
          apiGet('/api/v1/line_channels/list'),
          apiGet('/api/v1/webchat_sites/list'),
        ]);
        const lines = lineRes.ok ? await lineRes.json() : [];
        const sites = siteRes.ok ? await siteRes.json() : [];
        const boundChannelIds = new Set(
          (Array.isArray(sites) ? sites : [])
            .map((s: { line_channel_id?: string | null }) => s.line_channel_id)
            .filter(Boolean),
        );
        const available: LineOption[] = (Array.isArray(lines) ? lines : [])
          .filter((c: { channel_id?: string }) => c.channel_id && !boundChannelIds.has(c.channel_id))
          .map((c: { channel_id: string; channel_name?: string }) => ({
            channel_id: c.channel_id,
            channel_name: c.channel_name || c.channel_id,
          }));
        setLineOptions(available);
        if (available.length > 0) setTarget(available[0].channel_id);
      } catch {
        setError('載入 LINE 帳號清單失敗');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBind = async () => {
    if (!target) {
      setError('請選擇要綁定的 LINE 帳號');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiPatch(`/api/v1/webchat_sites/${encodeURIComponent(siteId)}/bind`, {
        line_channel_id: target,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const lineName = lineOptions.find((o) => o.channel_id === target)?.channel_name || 'LINE';
      setSuccess(`已綁定至「${lineName}」，原有對話已併入同一組織。`);
      onBound?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : '綁定失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const noLine = !loading && lineOptions.length === 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[420px] p-[28px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-['Noto_Sans_TC',sans-serif] text-[20px] text-[#242424] mb-[4px]">
          綁定到 LINE 帳號
        </h2>
        <p className="font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#6e6e6e] leading-[20px] mb-[20px]">
          將官網彈窗「{siteName || siteId}」併入某個 LINE 帳號的組織，數據洞察將合併統計，原有對話也會一起轉移。
        </p>

        {loading ? (
          <p className="text-[14px] text-[#9aa0ab] mb-[16px]">載入中…</p>
        ) : noLine ? (
          <p className="text-[14px] text-[#d33] mb-[16px] leading-[20px]">
            目前沒有「尚未綁定官網」的 LINE 帳號可綁。請先到基本設定新增一個 LINE，或確認現有 LINE 是否都已綁過官網。
          </p>
        ) : (
          <>
            <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
              選擇 LINE 帳號
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full border border-[#b6c8f1] rounded-md px-3 py-2 text-[14px] mb-[16px] outline-none focus:border-[#0f6beb] bg-white"
            >
              {lineOptions.map((o) => (
                <option key={o.channel_id} value={o.channel_id}>
                  {o.channel_name}
                </option>
              ))}
            </select>
          </>
        )}

        {error && <p className="text-[13px] text-[#d33] mb-[12px]">{error}</p>}
        {success && <p className="text-[13px] text-[#1a7f37] mb-[12px]">{success}</p>}

        <div className="flex items-center justify-end gap-[12px] mt-[8px]">
          <button
            onClick={onClose}
            className="px-[16px] py-[8px] rounded-xl text-[14px] text-[#6e6e6e] hover:bg-[#f0f0f0] transition-colors"
          >
            {success ? '完成' : '取消'}
          </button>
          {!success && (
            <button
              onClick={handleBind}
              disabled={submitting || loading || noLine}
              className="bg-[#242424] px-[20px] py-[8px] rounded-xl text-[14px] text-white hover:bg-[#383838] transition-colors disabled:opacity-60"
            >
              {submitting ? '綁定中…' : '確認綁定'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default BindWebchatToLineModal;
