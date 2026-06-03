import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiGet, apiPost } from '../utils/apiClient';
import { useChannel } from '../contexts/ChannelContext';

interface CreateWebchatOrgModalProps {
  onClose: () => void;
  /** 建立成功後回呼（父層用來刷新帳號列表 / 組織切換器）*/
  onCreated?: () => void;
}

/**
 * 「官網彈窗（免 LINE）」建立組織視窗。
 *
 * 從「新增帳號 → 平台選擇 → 官網彈窗」進入。
 * 只需要組織名稱即可建立一個沒有 LINE 的組織；可選填官網彈窗站點代號。
 */
export function CreateWebchatOrgModal({ onClose, onCreated }: CreateWebchatOrgModalProps) {
  const [name, setName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [embedCode, setEmbedCode] = useState('');

  // 開啟時：若「當前選中的組織」已有官網站點，直接顯示其部署嵌入碼（給前端工程師）
  const { selectedChannel } = useChannel();
  useEffect(() => {
    const scopeQ = selectedChannel?.tenant_id
      ? `tenant_id=${selectedChannel.tenant_id}`
      : selectedChannel?.channel_id
      ? `line_channel_id=${encodeURIComponent(selectedChannel.channel_id)}`
      : '';
    if (!scopeQ) return;
    apiGet(`/api/v1/chatbot/widget-embed?${scopeQ}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.has_site && d.embed_code) setEmbedCode(d.embed_code);
      })
      .catch(() => {});
  }, [selectedChannel?.tenant_id, selectedChannel?.channel_id]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('請輸入組織名稱');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const body: Record<string, unknown> = { name: trimmed };
      if (siteId.trim()) body.webchat_site_id = siteId.trim();
      const res = await apiPost('/api/v1/tenants', body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      setSuccess(`組織「${trimmed}」已建立${siteId.trim() ? '，並綁定官網彈窗站點' : ''}。`);
      if (data?.webchat_embed_code) setEmbedCode(data.webchat_embed_code);
      setName('');
      setSiteId('');
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : '建立失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-[440px] p-[28px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-['Noto_Sans_TC',sans-serif] text-[20px] text-[#242424] mb-[4px]">
          官網彈窗客服
        </h2>
        <p className="font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#6e6e6e] mb-[20px]">
          建立一個不需要 LINE 的組織，只用官網彈窗客服。只需填組織名稱即可，
          可選填官網彈窗站點代號以立即啟用。
        </p>

        <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
          組織名稱 <span className="text-[#d33]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：海景館"
          maxLength={100}
          className="w-full border border-[#b6c8f1] rounded-[8px] px-3 py-2 text-[14px] mb-[16px] outline-none focus:border-[#0f6beb]"
        />

        <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
          官網彈窗站點代號（選填）
        </label>
        <input
          type="text"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          placeholder="例：seaview（用於官網嵌入 widget）"
          maxLength={50}
          className="w-full border border-[#b6c8f1] rounded-[8px] px-3 py-2 text-[14px] mb-[16px] outline-none focus:border-[#0f6beb]"
        />

        {error && <p className="text-[13px] text-[#d33] mb-[12px]">{error}</p>}
        {success && <p className="text-[13px] text-[#1a7f37] mb-[12px]">{success}</p>}

        {embedCode && (
          <div className="mb-[12px]">
            <p className="text-[13px] text-[#383838] mb-[6px]">官網機器人佈署 — 把這段嵌入碼貼到官網 &lt;/body&gt; 前：</p>
            <textarea
              readOnly
              value={embedCode}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="w-full h-[64px] border border-[#b6c8f1] rounded-[8px] px-3 py-2 text-[12px] font-mono bg-[#f6f9fd] outline-none resize-none"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-[12px] mt-[8px]">
          <button
            onClick={onClose}
            className="px-[16px] py-[8px] rounded-[12px] text-[14px] text-[#6e6e6e] hover:bg-[#f0f0f0] transition-colors"
          >
            {success ? '完成' : '取消'}
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="bg-[#242424] px-[20px] py-[8px] rounded-[12px] text-[14px] text-white hover:bg-[#383838] transition-colors disabled:opacity-60"
          >
            {submitting ? '建立中…' : '建立組織'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CreateWebchatOrgModal;
