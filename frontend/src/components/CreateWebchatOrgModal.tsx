import { useState } from 'react';
import { createPortal } from 'react-dom';
import { apiPost } from '../utils/apiClient';

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
  const [copied, setCopied] = useState(false);

  // 即時嵌入碼預覽：跟著「站點代號」輸入即時變動（widget 與 CRM 同網域）
  const embedCode = siteId.trim()
    ? `<script src="${window.location.origin}/widget/loader.js?site_id=${siteId.trim()}" async></script>`
    : '';

  const handleCopy = () => {
    if (!embedCode) return;
    navigator.clipboard?.writeText(embedCode).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
      () => {},
    );
  };

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
      setSuccess(`「${trimmed}」已建立${siteId.trim() ? '，官網聊天視窗已啟用' : ''}。`);
      // 不清空 siteId，讓下方嵌入碼留著供複製給前端工程師
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : '建立失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-[440px] p-[28px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-['Noto_Sans_TC',sans-serif] text-[20px] text-[#242424] mb-[4px]">
          官網彈窗客服
        </h2>
        <p className="font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#6e6e6e] leading-[20px] mb-[20px]">
          於官方網站嵌入即時線上客服視窗。訪客瀏覽網站時可直接開啟對話，向客服人員或自動客服諮詢，無需另外安裝任何軟體。
        </p>

        <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
          名稱 <span className="text-[#d33]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：台北館"
          maxLength={100}
          className="w-full border border-[#b6c8f1] rounded-[8px] px-3 py-2 text-[14px] mb-[6px] outline-none focus:border-[#0f6beb]"
        />
        <p className="text-[12px] text-[#9aa0ab] mb-[16px]">用於後台識別此組織，例如館別或客戶名稱。</p>

        <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
          官網代號（選填）
        </label>
        <input
          type="text"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          placeholder="例：taipei"
          maxLength={50}
          className="w-full border border-[#b6c8f1] rounded-[8px] px-3 py-2 text-[14px] mb-[6px] outline-none focus:border-[#0f6beb]"
        />
        <p className="text-[12px] text-[#9aa0ab] mb-[16px] leading-[18px]">
          由英文或數字組成，用於識別要安裝客服視窗的官網。填寫後系統會自動產生對應的安裝程式碼。
        </p>

        {error && <p className="text-[13px] text-[#d33] mb-[12px]">{error}</p>}
        {success && <p className="text-[13px] text-[#1a7f37] mb-[12px]">{success}</p>}

        {embedCode && (
          <div className="mb-[12px]">
            <div className="flex items-center justify-between mb-[6px]">
              <p className="text-[14px] text-[#383838]">安裝程式碼</p>
              <button
                type="button"
                onClick={handleCopy}
                title="複製"
                className="shrink-0 p-[4px] rounded hover:bg-[#eef2ff] text-[#0f6beb]"
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
              </button>
            </div>
            <textarea
              readOnly
              value={embedCode}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="w-full h-[64px] border border-[#b6c8f1] rounded-[8px] px-3 py-2 text-[12px] font-mono bg-[#f6f9fd] outline-none resize-none"
            />
            <p className="text-[12px] text-[#9aa0ab] mt-[6px] leading-[18px]">
              請將此程式碼提供給貴公司的網站維護人員，安裝至官網後即可在網站上顯示客服視窗。
            </p>
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
