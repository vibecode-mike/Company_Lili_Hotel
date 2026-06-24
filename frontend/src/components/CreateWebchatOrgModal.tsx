import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiGet, apiPost } from '../utils/apiClient';

interface CreateWebchatOrgModalProps {
  onClose: () => void;
  /** 建立成功後回呼（父層用來刷新帳號列表 / 組織切換器）*/
  onCreated?: () => void;
}

interface LineOption {
  channel_id: string;
  channel_name: string;
  bound: boolean; // 已綁過官網（1 LINE 1 官網）→ 列出但不可選
}

const INDEPENDENT = '__independent__';

/**
 * 「官網彈窗客服」建立視窗。
 *
 * 兩種服務對象：
 * 1) 綁到現有 LINE 帳號 → POST /api/v1/webchat_sites（site 綁該 LINE 的 channel_id，
 *    訪客自動跟 LINE 落在同組織，數據洞察官網 tab 正確歸屬）。
 * 2) 獨立官網（無 LINE）→ POST /api/v1/tenants 建一個免 LINE 的新組織 + 站點。
 *
 * 1 LINE 對 1 官網：下拉自動排除「已綁過官網」的 LINE。
 */
export function CreateWebchatOrgModal({ onClose, onCreated }: CreateWebchatOrgModalProps) {
  const [lineOptions, setLineOptions] = useState<LineOption[]>([]);
  const [target, setTarget] = useState<string>(INDEPENDENT); // channel_id 或 INDEPENDENT
  const [name, setName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdEmbed, setCreatedEmbed] = useState('');
  const [copied, setCopied] = useState(false);

  const bindToLine = target !== INDEPENDENT;

  // 載入可綁定的 LINE 帳號（排除已綁官網者）→ 預設選第一個有 LINE 的，沒有就維持獨立
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
        const options: LineOption[] = (Array.isArray(lines) ? lines : [])
          .filter((c: { channel_id?: string }) => c.channel_id)
          .map((c: { channel_id: string; channel_name?: string }) => ({
            channel_id: c.channel_id,
            channel_name: c.channel_name || c.channel_id,
            bound: boundChannelIds.has(c.channel_id),
          }));
        setLineOptions(options);
        // 預設選第一個「還沒綁官網」的 LINE；全都綁過就維持「獨立官網」
        const firstFree = options.find((o) => !o.bound);
        if (firstFree) {
          setTarget(firstFree.channel_id);
          setName(firstFree.channel_name);
        }
      } catch {
        // 取 LINE 清單失敗：維持「獨立官網」即可，不阻斷
      }
    })();
  }, []);

  // 切換服務對象時，把「名稱」預設帶成該 LINE 名稱（方便使用者）
  const handleTargetChange = (value: string) => {
    setTarget(value);
    setError('');
    if (value !== INDEPENDENT) {
      const opt = lineOptions.find((o) => o.channel_id === value);
      if (opt && !name.trim()) setName(opt.channel_name);
    }
  };

  // 即時嵌入碼預覽：跟著「官網代號」輸入即時變動。
  // widget 實檔在 /api/v1/widget/lili-chatbot.js，只讀 data-site-id / data-site-name 屬性。
  const previewEmbed = siteId.trim()
    ? `<script src="${window.location.origin}/api/v1/widget/lili-chatbot.js" data-site-id="${siteId.trim()}"${name.trim() ? ` data-site-name="${name.trim()}"` : ''}></script>`
    : '';
  const embedCode = createdEmbed || previewEmbed;

  const handleCopy = () => {
    if (!embedCode) return;
    navigator.clipboard?.writeText(embedCode).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
      () => {},
    );
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    const trimmedSite = siteId.trim();

    if (bindToLine) {
      if (!trimmedSite) {
        setError('請輸入官網代號');
        return;
      }
    } else if (!trimmedName) {
      setError('請輸入組織名稱');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (bindToLine) {
        // 綁到既有 LINE：建站點
        const res = await apiPost('/api/v1/webchat_sites', {
          site_id: trimmedSite,
          site_name: trimmedName || undefined,
          line_channel_id: target,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        const lineName = lineOptions.find((o) => o.channel_id === target)?.channel_name || 'LINE';
        setSuccess(`官網彈窗已建立，並綁定至「${lineName}」。`);
        if (data.embed_code) setCreatedEmbed(data.embed_code);
      } else {
        // 獨立官網：建新組織
        const body: Record<string, unknown> = { name: trimmedName };
        if (trimmedSite) body.webchat_site_id = trimmedSite;
        const res = await apiPost('/api/v1/tenants', body);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }
        setSuccess(`「${trimmedName}」已建立${trimmedSite ? '，官網聊天視窗已啟用' : ''}。`);
      }
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
        className="bg-white rounded-2xl w-full max-w-[440px] p-[28px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-['Noto_Sans_TC',sans-serif] text-[20px] text-[#242424] mb-[4px]">
          官網彈窗客服
        </h2>
        <p className="font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#6e6e6e] leading-[20px] mb-[20px]">
          於官方網站嵌入即時線上客服視窗。訪客瀏覽網站時可直接開啟對話，向客服人員或自動客服諮詢，無需另外安裝任何軟體。
        </p>

        <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
          這個官網要服務哪個帳號?
        </label>
        <select
          value={target}
          onChange={(e) => handleTargetChange(e.target.value)}
          className="w-full border border-[#b6c8f1] rounded-md px-3 py-2 text-[14px] mb-[6px] outline-none focus:border-[#0f6beb] bg-white"
        >
          {lineOptions.map((o) => (
            <option key={o.channel_id} value={o.channel_id} disabled={o.bound}>
              {o.channel_name}（LINE）{o.bound ? ' — 已綁定官網' : ''}
            </option>
          ))}
          <option value={INDEPENDENT}>獨立官網（沒有 LINE）</option>
        </select>
        <p className="text-[12px] text-[#9aa0ab] mb-[16px] leading-[18px]">
          {bindToLine
            ? '官網彈窗會與此 LINE 帳號歸於同一組織，數據洞察自動合併統計。'
            : '建立一個沒有 LINE 的獨立組織，只使用官網彈窗客服。'}
        </p>

        <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
          {bindToLine ? '顯示名稱（選填）' : '組織名稱'}
          {!bindToLine && <span className="text-[#d33]"> *</span>}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：台北館"
          maxLength={100}
          className="w-full border border-[#b6c8f1] rounded-md px-3 py-2 text-[14px] mb-[6px] outline-none focus:border-[#0f6beb]"
        />
        <p className="text-[12px] text-[#9aa0ab] mb-[16px]">
          {bindToLine ? '顯示在後台與訪客客服視窗上的名稱。' : '用於後台識別此組織，例如館別或客戶名稱。'}
        </p>

        <label className="block font-['Noto_Sans_TC',sans-serif] text-[14px] text-[#383838] mb-[6px]">
          官網代號{bindToLine ? <span className="text-[#d33]"> *</span> : '（選填）'}
        </label>
        <input
          type="text"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          placeholder="例：taipei"
          maxLength={50}
          className="w-full border border-[#b6c8f1] rounded-md px-3 py-2 text-[14px] mb-[6px] outline-none focus:border-[#0f6beb]"
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
              className="w-full h-[64px] border border-[#b6c8f1] rounded-md px-3 py-2 text-[12px] font-mono bg-[#f6f9fd] outline-none resize-none scrollbar-transparent"
            />
            <p className="text-[12px] text-[#9aa0ab] mt-[6px] leading-[18px]">
              請將此程式碼提供給貴公司的網站維護人員，安裝至官網後即可在網站上顯示客服視窗。
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-[12px] mt-[8px]">
          <button
            onClick={onClose}
            className="px-[16px] py-[8px] rounded-xl text-[14px] text-[#6e6e6e] hover:bg-[#f0f0f0] transition-colors"
          >
            {success ? '完成' : '取消'}
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="bg-[#242424] px-[20px] py-[8px] rounded-xl text-[14px] text-white hover:bg-[#383838] transition-colors disabled:opacity-60"
          >
            {submitting ? '建立中…' : bindToLine ? '建立官網彈窗' : '建立組織'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CreateWebchatOrgModal;
