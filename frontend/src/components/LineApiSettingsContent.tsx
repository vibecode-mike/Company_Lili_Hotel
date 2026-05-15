import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, X, Check, ArrowLeft, Copy, Wifi, Loader2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useToast } from './ToastProvider';
import { useLineChannelStatus } from '../contexts/LineChannelStatusContext';
import { useNavigation } from '../contexts/NavigationContext';
import imgStep1 from "figma:asset/bf4ffd108c2e836b466874e959531fdf5c9bd8b1.png";
import imgStep1New from "figma:asset/146d0c4e38c1dc2f05fd32c9740151e0eaaee326.png";
import imgStep2 from "figma:asset/88076181b402df2ffcba98c51345afaaa2165468.png";
import imgStep2New from "figma:asset/bf4ffd108c2e836b466874e959531fdf5c9bd8b1.png";
import imgStep3 from "figma:asset/e859f2896aa57670db9ed9933eb059d29ffaf7c7.png";
import imgStep4 from "figma:asset/e0079245ea67343450871e33ff689154160aa2bb.png";
import imgStep5Webhook from "../assets/step5-webhook.png";
import imgStep6 from "figma:asset/e9db79d0f3507f2a61e25dfa2f8f638bbcaf8b9d.png";
import imgStep7 from "figma:asset/f05dee67f2743d5c7b8183a074546e987c63f567.png";
import imgStep8 from "figma:asset/9c06d369cd4b66fb5b16a4209259f1271ce88ec7.png";
import svgPaths from "../imports/svg-587iyatkp7";

interface LineApiSettingsContentProps {
  /** 設定完成後的回調，若提供則不顯示內建完成頁面 */
  onComplete?: () => void;
  /** 返回上一頁的回調，若提供則顯示返回按鈕 */
  onBack?: () => void;
  /**
   * 編輯既有 LINE OA 的 DB id；
   *  - undefined / null  → 新增模式（POST 建立新帳號）
   *  - number            → 編輯模式（載入該帳號資料、PATCH 更新）
   */
  editingChannelId?: number;
}

// 欄位格式驗證規則（LINE Developers Console 規範）
const VALIDATION = {
  channel_id: /^\d{10}$/,                 // 10 位數字
  channel_secret: /^[0-9a-f]{32}$/,       // 32 位十六進位
  login_channel_id: /^\d{10}$/,           // 10 位數字
  login_channel_secret: /^[0-9a-f]{32}$/, // 32 位十六進位
} as const;

const FORMAT_ERROR = {
  channel_id: 'Channel ID 必須為 10 位數字',
  channel_secret: 'Channel Secret 格式不正確，請從 LINE 後台重新複製',
  login_channel_id: 'Channel ID 必須為 10 位數字',
  login_channel_secret: 'Channel Secret 格式不正確，請從 LINE 後台重新複製',
} as const;

const FIELD_LABEL = {
  channel_id: 'Channel ID',
  channel_secret: 'Channel Secret',
  channel_access_token: 'Channel Access Token',
  login_channel_id: 'Login Channel ID',
  login_channel_secret: 'Login Channel Secret',
} as const;

const DRAFT_STORAGE_KEY = 'line_setup_draft';

const webhookBaseUrl = (
  import.meta.env.VITE_WEBHOOK_BASE_URL?.trim() || 'https://console.star-bit.io'
).replace(/\/+$/, '');

export default function LineApiSettingsContent({ onComplete, onBack, editingChannelId }: LineApiSettingsContentProps = {}) {
  const [expandedCard, setExpandedCard] = useState<number>(1);
  const [channelId, setChannelId] = useState<string>('');
  const [channelSecret, setChannelSecret] = useState<string>('');
  const [channelAccessToken, setChannelAccessToken] = useState<string>('');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [loginChannelId, setLoginChannelId] = useState<string>('');
  const [loginChannelSecret, setLoginChannelSecret] = useState<string>('');
  const { isConfigured, refreshStatus } = useLineChannelStatus();
  const { navigate } = useNavigation();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(isConfigured);
  const [lineChannelDbId, setLineChannelDbId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [basicId, setBasicId] = useState<string>('');
  const [isFetchingBasicId, setIsFetchingBasicId] = useState<boolean>(false);
  const [basicIdError, setBasicIdError] = useState<string>('');
  const [isStep5Confirmed, setIsStep5Confirmed] = useState<boolean>(false);
  const [isVerifyingUsage, setIsVerifyingUsage] = useState<boolean>(false);
  const { showToast } = useToast();

  // Phase E Card 10：Webchat 站點 + PMS Hotel Code（皆選填）
  const [siteId, setSiteId] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('');
  const [hotelcode, setHotelcode] = useState<string>('');
  const [pmsSkip, setPmsSkip] = useState<boolean>(false);
  const [hotelcodeTestResult, setHotelcodeTestResult] = useState<
    { ok: boolean; message: string } | null
  >(null);
  const [isTestingHotelcode, setIsTestingHotelcode] = useState<boolean>(false);

  // Phase E Card 11：完成後的嵌入碼
  const [embedCode, setEmbedCode] = useState<string>('');
  const [embedSiteId, setEmbedSiteId] = useState<string>('');
  const [embedCopied, setEmbedCopied] = useState<boolean>(false);

  // Refs for each card
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);
  const card5Ref = useRef<HTMLDivElement>(null);
  const card6Ref = useRef<HTMLDivElement>(null);
  const card7Ref = useRef<HTMLDivElement>(null);
  const card8Ref = useRef<HTMLDivElement>(null);
  const card9Ref = useRef<HTMLDivElement>(null);
  const card10Ref = useRef<HTMLDivElement>(null);

  // 載入現有設定：
  //  - 編輯模式（editingChannelId 有值）→ 抓 /line_channels/{id}
  //  - 新增模式 → 不抓 DB（避免拉到第一筆 active 帳號），完全用 localStorage 草稿
  useEffect(() => {
    const loadSettings = async () => {
      let hasDbData = false;
      if (editingChannelId) {
        try {
          const response = await fetch(`/api/v1/line_channels/${editingChannelId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.id) {
              setLineChannelDbId(data.id);
              setChannelId(data.channel_id || '');
              setChannelSecret(data.channel_secret || '');
              setChannelAccessToken(data.channel_access_token || '');
              setLoginChannelId(data.login_channel_id || '');
              setLoginChannelSecret(data.login_channel_secret || '');
              setBasicId(data.basic_id || '');
              hasDbData = true;

              if (data.channel_id && data.channel_secret && data.channel_access_token &&
                  data.login_channel_id && data.login_channel_secret) {
                setIsSetupComplete(true);
              }
            }
          }
        } catch (error) {
          console.error('載入 LINE 頻道設定失敗:', error);
        }
      }

      // DB 無資料（新增模式或編輯模式 fetch 失敗）→ 從 localStorage 恢復草稿
      if (!hasDbData) {
        try {
          const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
          if (raw) {
            const draft = JSON.parse(raw);
            if (draft.channelId) setChannelId(draft.channelId);
            if (draft.channelSecret) setChannelSecret(draft.channelSecret);
            if (draft.channelAccessToken) setChannelAccessToken(draft.channelAccessToken);
            if (draft.loginChannelId) setLoginChannelId(draft.loginChannelId);
            if (draft.loginChannelSecret) setLoginChannelSecret(draft.loginChannelSecret);
            if (draft.basicId) setBasicId(draft.basicId);
          }
        } catch (error) {
          console.error('恢復草稿失敗:', error);
        }
      }

      setIsLoading(false);
    };

    loadSettings();
  }, []);

  // 欄位變動時同步寫入 localStorage 草稿（只在尚未完成設定時）
  useEffect(() => {
    if (isLoading || isSetupComplete) return;
    try {
      const draft = {
        channelId,
        channelSecret,
        channelAccessToken,
        loginChannelId,
        loginChannelSecret,
        basicId,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('寫入草稿失敗:', error);
    }
  }, [channelId, channelSecret, channelAccessToken, loginChannelId, loginChannelSecret, basicId, isLoading, isSetupComplete]);

  useEffect(() => {
    setIsSetupComplete(isConfigured);
  }, [isConfigured]);

  // 保存設定到資料庫
  const saveSettings = async (data: any) => {
    try {
      let response;
      if (lineChannelDbId) {
        // 更新現有設定
        response = await fetch(`/api/v1/line_channels/${lineChannelDbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        // 創建新設定
        response = await fetch('/api/v1/line_channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel_secret: data.channel_secret || '',
            channel_access_token: data.channel_access_token || '',
            ...data
          })
        });
      }

      // 多帳號模式下，POST 失敗一律報錯，不再隱式 PATCH 現有第一筆
      // （舊版單帳號邏輯會在這裡 fallback 到 /current 改 PATCH，會誤覆蓋其他帳號）

      if (!response.ok) {
        throw new Error('保存失敗');
      }

      const result = await response.json();
      if (!lineChannelDbId) {
        setLineChannelDbId(result.id);
      }

      await refreshStatus();
      // Phase E：回傳 channel DB id 給 caller，避免 setState 非同步問題
      return { ok: true, id: result.id };
    } catch (error) {
      console.error('保存 LINE 頻道設定失敗:', error);
      showToast('保存失敗，請稍後再試', 'error');
      return { ok: false, id: null };
    }
  };

  // 🆕 自動獲取 LINE Bot Basic ID
  const fetchBasicId = async (token: string): Promise<boolean> => {
    if (!token || token.trim().length === 0) {
      return false;
    }

    setIsFetchingBasicId(true);
    setBasicIdError('');

    try {
      // 調用 backend 轉接 endpoint
      const response = await fetch('/api/v1/line_channels/basic-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_access_token: token,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok && data.basicId) {
        setBasicId(data.basicId);
        return true;
      } else {
        throw new Error(data.error?.message || data.error || 'Channel Access Token 無效');
      }
    } catch (error) {
      console.error('[ERROR] 驗證 Channel Access Token 失敗:', error);
      setBasicIdError('Channel Access Token 無效，請確認後重新貼上');
      return false;
    } finally {
      setIsFetchingBasicId(false);
    }
  };

  const toggleCard = (cardNumber: number) => {
    setExpandedCard(expandedCard === cardNumber ? 0 : cardNumber);
  };

  const scrollToCard = (cardNumber: number) => {
    const refs = [null, card1Ref, card2Ref, card3Ref, card4Ref, card5Ref, card6Ref, card7Ref, card8Ref, card9Ref];
    const targetRef = refs[cardNumber];
    
    if (targetRef?.current) {
      setTimeout(() => {
        targetRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  };

  const goToNextCard = (nextCardNumber: number) => {
    setExpandedCard(nextCardNumber);
    scrollToCard(nextCardNumber);
  };

  // 驗證所有必填欄位（格式 + 非空）
  const validateAllFields = () => {
    const errors: string[] = [];
    if (!VALIDATION.channel_id.test(channelId.trim())) {
      errors.push(FIELD_LABEL.channel_id);
    }
    if (!VALIDATION.channel_secret.test(channelSecret.trim())) {
      errors.push(FIELD_LABEL.channel_secret);
    }
    if (!channelAccessToken.trim()) {
      errors.push(FIELD_LABEL.channel_access_token);
    }
    if (!VALIDATION.login_channel_id.test(loginChannelId.trim())) {
      errors.push(FIELD_LABEL.login_channel_id);
    }
    if (!VALIDATION.login_channel_secret.test(loginChannelSecret.trim())) {
      errors.push(FIELD_LABEL.login_channel_secret);
    }
    if (errors.length > 0) {
      showToast(`以下欄位格式錯誤：${errors.join('、')}`, 'error');
      return false;
    }
    return true;
  };

  // 處理建立連結：先驗證 → 再寫 DB
  const handleCreateConnection = async () => {
    // 1. 格式 + 非空檢查
    if (!validateAllFields()) {
      return;
    }

    setIsVerifyingUsage(true);
    try {
      // 2. 最終驗證：用當下 state 的 token 重新打 LINE API
      const tokenValid = await fetchBasicId(channelAccessToken);
      if (!tokenValid) {
        showToast('Channel Access Token 無效或已過期，請回步驟 4 重新確認', 'error');
        return;
      }

      // 3. 驗證通過才一次寫入 DB（Phase E：site_id / site_name / hotelcode 一條龍一次帶）
      const savePayload: Record<string, string> = {
        channel_id: channelId,
        channel_secret: channelSecret,
        channel_access_token: channelAccessToken,
        login_channel_id: loginChannelId,
        login_channel_secret: loginChannelSecret,
      };
      if (siteId.trim()) savePayload.site_id = siteId.trim();
      if (siteName.trim()) savePayload.site_name = siteName.trim();
      // 勾「暫不需 PMS」→ 不送 hotelcode（DB 留 NULL）
      if (!pmsSkip && hotelcode.trim()) savePayload.hotelcode = hotelcode.trim();

      const saveResult = await saveSettings(savePayload);
      if (!saveResult.ok) {
        return;
      }
      const newChannelDbId = saveResult.id ?? lineChannelDbId;

      // 4. 清除草稿
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (error) {
        console.error('清除草稿失敗:', error);
      }

      // 5. 若有填 site_id，抓嵌入碼供 Card 11 顯示
      if (siteId.trim() && newChannelDbId) {
        try {
          const resp = await fetch(
            `/api/v1/line_channels/${newChannelDbId}/embed-code`,
          );
          if (resp.ok) {
            const data = await resp.json();
            setEmbedCode(data.embed_code || '');
            setEmbedSiteId(data.site_id || '');
          }
        } catch (err) {
          console.error('取得嵌入碼失敗:', err);
        }
      }

      setIsSetupComplete(true);

      // 如果有提供 onComplete 回調，則使用它；否則使用內建導航
      // 注意：填了 site_id 時，希望 admin 先看到嵌入碼 → 不自動跳走
      if (onComplete && !siteId.trim()) {
        onComplete();
      } else if (!siteId.trim()) {
        showToast('設定完成，帶您前往會員管理頁', 'success');
        navigate('member-management');
      } else {
        showToast('設定完成！請複製下方嵌入碼給對方工程師', 'success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '建立連結失敗，請稍後再試';
      showToast(message, 'error');
    } finally {
      setIsVerifyingUsage(false);
    }
  };

  // Phase E：「測試連線」按鈕 — 直接打閎運 PMS API 驗證 hotelcode
  const handleTestHotelcode = async () => {
    const code = hotelcode.trim();
    if (!code) {
      setHotelcodeTestResult({ ok: false, message: '請先輸入 Hotel Code' });
      return;
    }
    setIsTestingHotelcode(true);
    setHotelcodeTestResult(null);
    try {
      const resp = await fetch('/api/v1/line_channels/test-hotelcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelcode: code }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setHotelcodeTestResult({
          ok: false,
          message: json.detail || '測試連線失敗',
        });
        return;
      }
      setHotelcodeTestResult({
        ok: Boolean(json.success),
        message: json.message || (json.success ? '連線成功' : '連線失敗'),
      });
    } catch (err) {
      setHotelcodeTestResult({
        ok: false,
        message: err instanceof Error ? err.message : '測試連線失敗',
      });
    } finally {
      setIsTestingHotelcode(false);
    }
  };

  // 按鈕 disabled 邏輯：5 個欄位格式都通過才能按
  const canSubmitConnection =
    VALIDATION.channel_id.test(channelId.trim()) &&
    VALIDATION.channel_secret.test(channelSecret.trim()) &&
    Boolean(channelAccessToken.trim()) &&
    VALIDATION.login_channel_id.test(loginChannelId.trim()) &&
    VALIDATION.login_channel_secret.test(loginChannelSecret.trim()) &&
    !isVerifyingUsage;

  // 如果已完成設定且沒有提供 onComplete（獨立使用模式），顯示完成頁面
  // 當有 onComplete 時，由父元件控制流程，這裡顯示設定精靈讓用戶重新設定
  if (isSetupComplete && !onComplete) {
    return (
      <div className="bg-[#f6f9fd] min-h-screen w-full">
        <div className="max-w-[1240px] mx-auto px-[20px] sm:px-[40px] pt-[48px] pb-[80px]">
          {/* 成功提示區塊 */}
          <div className="flex flex-col items-center gap-[24px] mb-[40px]">
            {/* 標題與副標題 */}
            <div className="flex flex-col gap-[8px]">
              <h1 className="text-[24px] leading-[36px] text-[#00C853] text-center">
                LINE 官方帳號 API 串接設定
              </h1>
              <p className="text-[16px] leading-[24px] text-[#4a5565] text-center">
                顧客可以使用 LINE 官方帳號與您聊天，群發訊息、會員功能模組已啟用！
              </p>
            </div>
          </div>

          {/* 主要內容卡片 - 淡藍色背景 */}
          <div className="relative bg-blue-50 rounded-[14px] border border-[#bedbff] p-[20px] sm:p-[24px]">
            {/* 頂部：勾選圖標 + 文字 */}
            <div className="flex items-center gap-[8px] mb-[24px]">
              <div className="relative shrink-0 size-[24px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <g>
                    <path d={svgPaths.pace200} stroke="#0F6BEB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M9 12L11 14L15 10" stroke="#0F6BEB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </g>
                </svg>
              </div>
              <p className="text-[16px] leading-[24px] text-[#0f6beb] tracking-[-0.3125px]">
                您目前已與 LINE 官方帳號連結
              </p>
            </div>

            {/* LINE 官方帳號資訊卡片 - 白色背景，藍色邊框 */}
            <div className="relative bg-white rounded-[10px] border-2 border-[#0f6beb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-[18px] mb-[16px]">
              <div className="flex items-center justify-between gap-[12px] flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-[12px] flex-1 min-w-0">
                  {/* LINE Logo */}
                  <div className="size-[48px] rounded-full bg-[#06c755] flex items-center justify-center shrink-0">
                    <span className="text-white text-[20px]">L</span>
                  </div>
                  <div className="flex flex-col gap-0 min-w-0 flex-1">
                    <p className="text-[16px] leading-[24px] text-[#101828] font-medium tracking-[-0.3125px]">LINE 官方帳號</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] leading-[20px] text-[#6a7282] tracking-[-0.1504px]">
                        {basicId || '@ˇˇˇˇ'}
                      </p>
                      {isFetchingBasicId && (
                        <span className="text-xs text-gray-500">驗證中...</span>
                      )}
                      {basicIdError && (
                        <span className="text-xs text-red-500">{basicIdError}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 px-[12px] py-[4px] rounded-full shrink-0">
                  <span className="text-[12px] leading-[16px] text-[#008236]">已連結</span>
                </div>
              </div>
            </div>

            {/* API 資訊卡片組 */}
            <div className="flex flex-col gap-[12px] mb-[16px]">
              {/* Channel ID 卡片 */}
              <div className="relative bg-white rounded-[10px] border border-[#bedbff] p-[13px]">
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[14px] leading-[20px] text-[#4a5565] tracking-[-0.1504px]">Channel ID</p>
                  <p className="text-[16px] leading-[24px] text-[#101828] tracking-[-0.3125px] font-mono break-all">{channelId || 'ˇˇˇˇ'}</p>
                </div>
              </div>

              {/* Channel Secret 卡片 */}
              <div className="relative bg-white rounded-[10px] border border-[#bedbff] p-[13px]">
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[14px] leading-[20px] text-[#4a5565] tracking-[-0.1504px]">Channel Secret</p>
                  <p className="text-[16px] leading-[24px] text-[#101828] tracking-[-0.3125px]">
                    {channelSecret ? '•'.repeat(Math.min(channelSecret.length, 32)) : '••••••••'}
                  </p>
                </div>
              </div>

              {/* Access Token 卡片 */}
              <div className="relative bg-white rounded-[10px] border border-[#bedbff] p-[13px]">
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[14px] leading-[20px] text-[#4a5565] tracking-[-0.1504px]">Access Token</p>
                  <p className="text-[16px] leading-[24px] text-[#101828] tracking-[-0.3125px]">
                    {channelAccessToken ? '•'.repeat(Math.min(channelAccessToken.length, 40)) : '••••••••'}
                  </p>
                </div>
              </div>

              {/* Login Channel ID 卡片 */}
              <div className="relative bg-white rounded-[10px] border border-[#bedbff] p-[13px]">
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[14px] leading-[20px] text-[#4a5565] tracking-[-0.1504px]">Login Channel ID</p>
                  <p className="text-[16px] leading-[24px] text-[#101828] tracking-[-0.3125px] font-mono break-all">{loginChannelId || 'ˇˇˇˇ'}</p>
                </div>
              </div>

              {/* Login Channel Secret 卡片 */}
              <div className="relative bg-white rounded-[10px] border border-[#bedbff] p-[13px]">
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[14px] leading-[20px] text-[#4a5565] tracking-[-0.1504px]">Login Channel Secret</p>
                  <p className="text-[16px] leading-[24px] text-[#101828] tracking-[-0.3125px]">
                    {loginChannelSecret ? '•'.repeat(Math.min(loginChannelSecret.length, 32)) : '•••••'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-[14px] leading-[20px] text-[#717182]">
              如需重新設定或解除連結，請洽系統服務商協助處理。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f6f9fd] min-h-screen w-full">
      <div className="max-w-[1240px] mx-auto px-[40px] pt-[48px] pb-[80px]">
        {/* 返回按鈕 - 僅在 onBack 提供時顯示 */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-[8px] text-[#6e6e6e] hover:text-[#383838] mb-[24px] transition-colors"
          >
            <ArrowLeft className="size-[20px]" />
            <span className="text-[14px] leading-[20px]">返回</span>
          </button>
        )}

        {/* Header Section */}
        <div className="flex flex-col gap-[8px] mb-[32px]">
          <h1 className="text-[24px] leading-[36px] text-[#0f6beb] text-center">
            LINE 官方帳號 API 串接設定
          </h1>
          <p className="text-[16px] leading-[24px] text-[#4a5565] text-center">
            顧客可以使用 LINE 官方帳號與您聊天，群發訊息、會員功能模組已啟用！
          </p>
        </div>

        {/* Cards Section */}
        <div className="flex flex-col gap-[16px] mb-[32px]">
          {/* Card 1: Duplicate Card */}
          <div 
            ref={card1Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 1 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            {/* Card Header */}
            <button
              onClick={() => toggleCard(1)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">1</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">建立並啟用 Messaging API Channel</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">建立 Messaging API Channel</p>
                </div>
              </div>
              {expandedCard === 1 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 1 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep1New} 
                        alt="LINE Developers Console Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep1New)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          使用管理員帳號登入{' '}
                          <a 
                            href="https://developers.line.biz/en/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-[4px] bg-[#0f6beb] text-white px-[8px] py-[1px] rounded-[4px] text-[12px] leading-[16px] hover:bg-[#0d5bbf] transition-colors"
                          >
                            LINE Developers Console
                            <ExternalLink className="size-[12px]" />
                          </a>
                          ，選擇您的 Provider。
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊 「Create a Messaging API channel」。
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊 「Create a LINE Official Account」，系統會開啟外部頁面。
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">4.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          使用您的 LINE 個人帳號或商業帳號登入，填寫必要資訊後，點擊 「Confirm and Complete」 建立官方帳號。
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">5.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          若跳出「申請已驗證帳號」提示，請選擇 「Proceed later」。
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">6.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          完成後，點擊 「Go to LINE Official Account Manager」 並同意政策聲明。
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">7.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          前往{' '}
                          <a 
                            href="https://account.line.biz/login?redirectUri=https%3A%2F%2Faccount.line.biz%2Foauth2%2Fcallback%3Fclient_id%3D10%26code_challenge%3DQRWU3NlqNfuAHKIf61Lav9XdqFw90xQ_yw0n_PwZJZ4%26code_challenge_method%3DS256%26redirect_uri%3Dhttps%253A%252F%252Fmanager.line.biz%252Fapi%252Foauth2%252FbizId%252Fcallback%26response_type%3Dcode%26state%3DdN6GnGuQU6OqkM3dKqLo6b5uAhJp6idd" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-[4px] bg-[#0f6beb] text-white px-[8px] py-[1px] rounded-[4px] text-[12px] leading-[16px] hover:bg-[#0d5bbf] transition-colors"
                          >
                            LINE 官方帳號後台
                            <ExternalLink className="size-[12px]" />
                          </a>
                          ，選擇您的官方帳號後，點擊右上角的「齒輪」圖示（⚙️）進入設定 ＞ Messaging API
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">8.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊 「Enable Messaging API」，選擇要綁定的 Provider，確認後啟用。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => goToNextCard(2)}
                  className="bg-[#0f6beb] h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] hover:bg-[#0d5bbf] transition-colors flex items-center justify-center"
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Channel ID */}
          <div 
            ref={card2Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 2 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            {/* Card Header */}
            <button
              onClick={() => toggleCard(2)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">2</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Channel ID</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 Basic Settings 取得</p>
                </div>
              </div>
              {expandedCard === 2 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 2 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep1}
                        alt="LINE Developers Console Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep1)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          前往{' '}
                          <a 
                            href="https://developers.line.biz/console/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-[4px] bg-[#0f6beb] text-white px-[8px] py-[1px] rounded-[4px] text-[12px] leading-[16px] hover:bg-[#0d5bbf] transition-colors"
                          >
                            LINE Developers Console
                            <ExternalLink className="size-[12px]" />
                          </a>
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          選擇您的 Provider 和 Messaging API Channel
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          找到 Channel ID 並複製貼上至系統設定欄位
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[14px] text-neutral-950">
                    Channel ID
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入 Channel ID"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value.trim())}
                    className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* 格式錯誤提示 */}
                {channelId.trim() && !VALIDATION.channel_id.test(channelId.trim()) && (
                  <p className="text-[12px] text-red-500">{FORMAT_ERROR.channel_id}</p>
                )}

                {/* Next Button */}
                <button
                  disabled={!VALIDATION.channel_id.test(channelId.trim())}
                  onClick={() => {
                    if (VALIDATION.channel_id.test(channelId.trim())) {
                      goToNextCard(3);
                    }
                  }}
                  className={`h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] flex items-center justify-center transition-colors ${
                    VALIDATION.channel_id.test(channelId.trim())
                      ? 'bg-[#0f6beb] hover:bg-[#0d5bbf]'
                      : 'bg-[#d1d5dc] opacity-50 cursor-not-allowed'
                  }`}
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Channel Secret */}
          <div 
            ref={card3Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 3 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            <button
              onClick={() => toggleCard(3)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">3</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Channel Secret</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 Basic Settings 取得</p>
                </div>
              </div>
              {expandedCard === 3 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 3 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep2} 
                        alt="LINE Basic Settings Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep2)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start pt-[8px]">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          在同一個 Channel 的「Basic Settings」分頁中
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          找到「Channel secret」欄位
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          複製 Secret，貼入系統設定欄位
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[14px] text-neutral-950">
                    Channel Secret
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入 Channel Secret"
                    value={channelSecret}
                    onChange={(e) => setChannelSecret(e.target.value)}
                    className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* 格式錯誤提示 */}
                {channelSecret.trim() && !VALIDATION.channel_secret.test(channelSecret.trim()) && (
                  <p className="text-[12px] text-red-500">{FORMAT_ERROR.channel_secret}</p>
                )}

                {/* Next Button */}
                <button
                  disabled={!VALIDATION.channel_secret.test(channelSecret.trim())}
                  onClick={() => {
                    if (VALIDATION.channel_secret.test(channelSecret.trim())) {
                      goToNextCard(4);
                    }
                  }}
                  className={`h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] flex items-center justify-center transition-colors ${
                    VALIDATION.channel_secret.test(channelSecret.trim())
                      ? 'bg-[#0f6beb] hover:bg-[#0d5bbf]'
                      : 'bg-[#d1d5dc] opacity-50 cursor-not-allowed'
                  }`}
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 4: Channel Access Token */}
          <div 
            ref={card4Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 4 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            <button
              onClick={() => toggleCard(4)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">4</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Channel Access Token</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 Messaging API 分頁取得</p>
                </div>
              </div>
              {expandedCard === 4 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 4 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep3} 
                        alt="LINE Messaging API Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep3)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start pt-[8px]">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          切換到「Messaging API」分頁
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          找到「Channel access token (long-lived)」區塊
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊 Issue（產生）或 Reissue（重新產生）
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">4.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          複製 Token，貼入系統設定欄位完成綁定
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[14px] text-neutral-950">
                    Channel Access Token
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入 Access Token"
                    value={channelAccessToken}
                    onChange={(e) => {
                      setChannelAccessToken(e.target.value);
                      setBasicIdError(''); // 清除錯誤訊息
                    }}
                    className={`bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all ${basicIdError ? 'ring-2 ring-red-500' : ''}`}
                  />
                  {basicIdError && (
                    <p className="text-[12px] text-red-500">{basicIdError}</p>
                  )}
                </div>

                {/* Next Button */}
                <button
                  disabled={!channelAccessToken.trim() || isFetchingBasicId}
                  onClick={async () => {
                    if (channelAccessToken.trim()) {
                      // 呼叫 LINE API 驗證 token（早期回饋，不寫 DB）
                      const success = await fetchBasicId(channelAccessToken);
                      if (success) {
                        goToNextCard(5);
                      }
                    }
                  }}
                  className={`h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] flex items-center justify-center transition-colors ${
                    channelAccessToken.trim() && !isFetchingBasicId
                      ? 'bg-[#0f6beb] hover:bg-[#0d5bbf]'
                      : 'bg-[#d1d5dc] opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isFetchingBasicId ? '驗證中...' : '下一步'}
                </button>
              </div>
            )}
          </div>

          {/* Card 5: Webhook URL - 截圖待替換 */}
          <div
            ref={card5Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 5 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            <button
              onClick={() => toggleCard(5)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">5</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Line Webhook 網址</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 LINE 官方帳號後台設定</p>
                </div>
              </div>
              {expandedCard === 5 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {expandedCard === 5 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>

                  <div className="flex gap-[16px]">
                    {/* Screenshot - 待替換 */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep5Webhook}
                        alt="LINE Webhook URL Settings"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep5Webhook)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start pt-[8px]">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          回到{' '}
                          <a
                            href="https://account.line.biz/login?redirectUri=https%3A%2F%2Faccount.line.biz%2Foauth2%2Fcallback%3Fclient_id%3D10%26code_challenge%3DQRWU3NlqNfuAHKIf61Lav9XdqFw90xQ_yw0n_PwZJZ4%26code_challenge_method%3DS256%26redirect_uri%3Dhttps%253A%252F%252Fmanager.line.biz%252Fapi%252Foauth2%252FbizId%252Fcallback%26response_type%3Dcode%26state%3DdN6GnGuQU6OqkM3dKqLo6b5uAhJp6idd"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-[4px] bg-[#0f6beb] text-white px-[8px] py-[1px] rounded-[4px] text-[12px] leading-[16px] hover:bg-[#0d5bbf] transition-colors"
                          >
                            LINE 官方帳號後台
                            <ExternalLink className="size-[12px]" />
                          </a>
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊右上角的「齒輪」圖示（⚙️）進入設定
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          在左側選單中選擇「Messaging API」
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">4.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          將下方的 Webhook 網址貼入對應欄位
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">5.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊右方「儲存」完成設定
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Webhook URL with copy button */}
                <div className="bg-white border-[0.8px] border-[#bedbff] rounded-[10px] px-[12.8px] py-[12.8px]">
                  <p className="text-[14px] leading-[20px] text-[#364153] mb-[8px]">你的 Webhook 網址：</p>
                  {channelId.trim() ? (
                    <div className="flex items-center gap-[8px]">
                      <code className="flex-1 bg-[#f3f3f5] px-[12px] py-[8px] rounded-[8px] text-[14px] text-[#383838] break-all">
                        {`${webhookBaseUrl}/callback/${channelId.trim()}`}
                      </code>
                      <button
                        onClick={() => {
                          const url = `${webhookBaseUrl}/callback/${channelId.trim()}`;
                          navigator.clipboard.writeText(url);
                          showToast('已複製 Webhook 網址', 'success');
                        }}
                        className="shrink-0 bg-[#0f6beb] hover:bg-[#0d5bbf] text-white px-[12px] py-[8px] rounded-[8px] text-[12px] leading-[16px] flex items-center gap-[4px] transition-colors"
                      >
                        <Copy className="size-[14px]" />
                        複製
                      </button>
                    </div>
                  ) : (
                    <p className="text-[14px] leading-[20px] text-[#717182] bg-[#f3f3f5] px-[12px] py-[8px] rounded-[8px]">
                      請先完成前面步驟
                    </p>
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => goToNextCard(6)}
                  className="bg-[#0f6beb] h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] hover:bg-[#0d5bbf] transition-colors flex items-center justify-center"
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 6: Webhook confirmation */}
          <div
            ref={card6Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 6 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            <button
              onClick={() => toggleCard(6)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">6</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">啟用聊天機器人與 Webhook</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 LINE 官方帳號後台設定</p>
                </div>
              </div>
              {expandedCard === 6 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 6 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep4} 
                        alt="LINE OA Backend Settings"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep4)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start pt-[8px]">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          在 LINE 官方帳號後台（LINE Official Account Manager）的設定
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          在左側選單中選擇「回應模式」
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <div className="flex flex-col gap-[4px]">
                          <p className="text-[14px] leading-[20px] text-[#364153]">
                            將回應功能中的以下選項開啟：
                          </p>
                          <p className="text-[14px] leading-[20px] text-[#364153] pl-[16px]">
                            - 聊天
                          </p>
                          <p className="text-[14px] leading-[20px] text-[#364153] pl-[16px]">
                            - Webhook（若無法開啟請回上一步確認是否成功設定 Webhook 網址）
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">4.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          將聊天的回應方式改為「手動聊天」，以便系統自動處理訊息互動
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="bg-white border-[0.8px] border-[#bedbff] rounded-[10px] px-[12.8px] py-[12.8px]">
                  <div className="flex items-center gap-[8px]">
                    <Checkbox
                      checked={isStep5Confirmed}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        setIsStep5Confirmed(isChecked);
                        if (isChecked) {
                          goToNextCard(7);
                        }
                      }}
                      className="size-[16px]"
                    />
                    <span className="text-[14px] leading-[14px] text-neutral-950">我已完成聊天機器人與 Webhook 設定</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  disabled
                  className="hidden bg-[#d1d5dc] opacity-50 h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] cursor-not-allowed flex items-center justify-center"
                >
                  建立連結
                </button>
              </div>
            )}
          </div>

          {/* Card 7: LINE Login Channel */}
          <div
            ref={card7Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 7 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            {/* Card Header */}
            <button
              onClick={() => toggleCard(7)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">7</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">連結 LINE Login Channel</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">建立 LINE Login Channel</p>
                </div>
              </div>
              {expandedCard === 7 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 7 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep6} 
                        alt="LINE Developers Console Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep6)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          到{' '}
                          <a
                            href="https://developers.line.biz/console/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-[4px] bg-[#0f6beb] text-white px-[8px] py-[1px] rounded-[4px] text-[12px] leading-[16px] hover:bg-[#0d5bbf] transition-colors"
                          >
                            LINE Developers Console
                            <ExternalLink className="size-[12px]" />
                          </a>
                          ，左側 Providers 選單下選擇和先前相同的 Provider
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊「Create a new channel」，並選擇「LINE Login」
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          完成基本資訊及 icon 設置後，將 App types 勾選為「Web app」
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">4.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          閱讀並同意相關條款後，點擊「Create」按鈕完成 Channel 建立
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => goToNextCard(8)}
                  className="bg-[#0f6beb] h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] hover:bg-[#0d5bbf] transition-colors flex items-center justify-center"
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 8: Login Channel ID */}
          <div
            ref={card8Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 8 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            {/* Card Header */}
            <button
              onClick={() => toggleCard(8)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">8</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Channel ID</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 Basic Settings 取得</p>
                </div>
              </div>
              {expandedCard === 8 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 8 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep7} 
                        alt="LINE Developers Console Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep7)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start flex-1">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          在 LINE Login Channel 的「Basic Settings」分頁中
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          找到 Channel ID 並複製貼上至系統設定欄位
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[14px] text-neutral-950">
                    Channel ID
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入 Channel ID"
                    value={loginChannelId}
                    onChange={(e) => setLoginChannelId(e.target.value)}
                    className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* 格式錯誤提示 */}
                {loginChannelId.trim() && !VALIDATION.login_channel_id.test(loginChannelId.trim()) && (
                  <p className="text-[12px] text-red-500">{FORMAT_ERROR.login_channel_id}</p>
                )}

                {/* Next Button */}
                <button
                  disabled={!VALIDATION.login_channel_id.test(loginChannelId.trim())}
                  onClick={() => {
                    if (VALIDATION.login_channel_id.test(loginChannelId.trim())) {
                      goToNextCard(9);
                    }
                  }}
                  className={`h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] flex items-center justify-center transition-colors ${
                    VALIDATION.login_channel_id.test(loginChannelId.trim())
                      ? 'bg-[#0f6beb] hover:bg-[#0d5bbf]'
                      : 'bg-[#d1d5dc] opacity-50 cursor-not-allowed'
                  }`}
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 9: Login Channel Secret */}
          <div
            ref={card9Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 9 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            <button
              onClick={() => toggleCard(9)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">9</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Channel Secret</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 Basic Settings 取得</p>
                </div>
              </div>
              {expandedCard === 9 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 9 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <ImageWithFallback
                        src={imgStep8} 
                        alt="Placeholder Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                        onClick={() => setEnlargedImage(imgStep8)}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start pt-[8px]">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          在 LINE Login Channel 的「Basic Settings」分頁中
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          找到「Channel secret」欄位
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          複製 Secret，貼入系統設定欄位
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[14px] text-neutral-950">
                    Channel Secret
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入 Channel Secret"
                    value={loginChannelSecret}
                    onChange={(e) => setLoginChannelSecret(e.target.value)}
                    className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* 格式錯誤提示 */}
                {loginChannelSecret.trim() && !VALIDATION.login_channel_secret.test(loginChannelSecret.trim()) && (
                  <p className="text-[12px] text-red-500">{FORMAT_ERROR.login_channel_secret}</p>
                )}

                {/* 建立連結按鈕 disabled 的提示 */}
                {!canSubmitConnection && !isVerifyingUsage && (
                  <p className="text-[12px] text-orange-500">
                    尚有欄位未填寫或格式錯誤，請檢查各步驟設定
                  </p>
                )}

                {/* Next Button */}
                <button
                  disabled={!canSubmitConnection}
                  onClick={canSubmitConnection ? handleCreateConnection : undefined}
                  className={`h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] flex items-center justify-center transition-colors ${
                    canSubmitConnection
                      ? 'bg-[#0f6beb] hover:bg-[#0d5bbf]'
                      : 'bg-[#d1d5dc] opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isVerifyingUsage ? '驗證中...' : '建立連結'}
                </button>
              </div>
            )}
          </div>

          {/* Card 10: Webchat 站點 + PMS Hotel Code（選填，Phase E） */}
          <div
            ref={card10Ref}
            className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 10 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}
          >
            <button
              onClick={() => toggleCard(10)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">10</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">
                    官網彈窗機器人 + PMS 串接（選填）
                  </p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">
                    對接官網聊天視窗、客房查詢系統
                  </p>
                </div>
              </div>
              {expandedCard === 10 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {expandedCard === 10 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[20px]">
                <p className="text-[14px] leading-[20px] text-[#4a5565]">
                  以下兩個區塊都是選填。若該 LINE 帳號要對接官網聊天視窗或客房查詢，請填寫對應欄位；不填可直接跳過。
                </p>

                {/* ① 官網機器人部署 */}
                <div className="border border-gray-200 rounded-[10px] p-[16px] flex flex-col gap-[12px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153]">
                    ① 官網機器人部署
                  </p>
                  <p className="text-[12px] leading-[18px] text-[#6A7282]">
                    填寫完資料將會自動生成程式碼。請將下方生成的程式碼交付給工程師嵌入在官網內即可生成彈窗聊天機器人。
                  </p>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[14px] leading-[14px] text-neutral-950">
                      Site ID（英文代號，例：starbit-ryan）
                    </label>
                    <input
                      type="text"
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                      placeholder="starbit-ryan"
                      className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[14px] leading-[14px] text-neutral-950">
                      站點顯示名稱（給後台識別用）
                    </label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="思偉達飯店｜雷恩館"
                      className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                    />
                  </div>

                  {/* 即時嵌入碼預覽 */}
                  {siteId.trim() && (() => {
                    const previewCode = `<script src="${(import.meta.env.VITE_WEBHOOK_BASE_URL || 'https://crmpoc.star-bit.io').replace(/\/+$/, '')}/widget/loader.js?site_id=${siteId.trim()}" async></script>`;
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-[8px] p-[12px] flex flex-col gap-[8px]">
                        <p className="text-[12px] leading-[18px] text-[#6A7282]">
                          嵌入碼預覽（建立連結後生效）
                        </p>
                        <div className="bg-gray-900 text-green-400 rounded-[6px] p-[10px] font-mono text-[11px] leading-[16px] break-all">
                          {previewCode}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(previewCode);
                            showToast('嵌入碼已複製到剪貼簿', 'success');
                          }}
                          className="self-start h-[26px] px-[6px] bg-white border border-[#0f6beb] text-[#0f6beb] hover:bg-blue-50 text-[12px] rounded-[4px] inline-flex items-center gap-[4px] w-fit"
                        >
                          <Copy className="size-[12px]" />
                          複製嵌入碼
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* ② PMS Hotel Code */}
                <div className="border border-gray-200 rounded-[10px] p-[16px] flex flex-col gap-[12px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153]">
                    ② PMS Hotel Code（接客房查詢、訂房用）
                  </p>
                  <p className="text-[12px] leading-[18px] text-[#6A7282]">
                    若此 LINE 帳號要接客房即時查詢/訂房流程，請填入 Hotel Code（例：ZH01）。
                  </p>
                  <div className="flex items-center gap-[8px]">
                    <Checkbox
                      checked={pmsSkip}
                      onCheckedChange={(v) => {
                        const next = Boolean(v);
                        setPmsSkip(next);
                        if (next) {
                          setHotelcode('');
                          setHotelcodeTestResult(null);
                        }
                      }}
                      className="size-[16px]"
                    />
                    <span className="text-[13px] leading-[18px] text-[#364153]">
                      此 LINE 帳號暫不需 PMS（純客服機器人）
                    </span>
                  </div>
                  {!pmsSkip && (
                    <>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[14px] leading-[14px] text-neutral-950">
                          Hotel Code
                        </label>
                        <div className="flex gap-[8px]">
                          <input
                            type="text"
                            value={hotelcode}
                            onChange={(e) => {
                              setHotelcode(e.target.value);
                              setHotelcodeTestResult(null);
                            }}
                            placeholder="ZH01"
                            className="flex-1 bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                          />
                          <button
                            onClick={handleTestHotelcode}
                            disabled={!hotelcode.trim() || isTestingHotelcode}
                            className={`h-[36px] px-[16px] rounded-[8px] text-[14px] border transition-colors inline-flex items-center justify-center gap-[6px] shrink-0 ${
                              hotelcode.trim() && !isTestingHotelcode
                                ? 'bg-white border-[#0f6beb] text-[#0f6beb] hover:bg-blue-50'
                                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isTestingHotelcode ? (
                              <>
                                <Loader2 className="size-[14px] animate-spin" />
                                測試中
                              </>
                            ) : (
                              <>
                                <Wifi className="size-[14px]" />
                                測試連線
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      {hotelcodeTestResult && (
                        <div
                          className={`p-[12px] rounded-[6px] text-[13px] leading-[18px] ${
                            hotelcodeTestResult.ok
                              ? 'bg-green-50 border border-green-200 text-green-700'
                              : 'bg-red-50 border border-red-200 text-red-700'
                          }`}
                        >
                          {hotelcodeTestResult.ok ? '✅ ' : '❌ '}
                          {hotelcodeTestResult.message}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <p className="text-[12px] leading-[18px] text-[#6A7282]">
                  💡 此卡片可全部留空，直接按下方「完成設定」即可。
                </p>

                {/* Card 10 完成按鈕 — 等同於 Card 9 的「建立連結」 */}
                <div className="flex justify-end pt-[8px]">
                  <button
                    disabled={!canSubmitConnection}
                    onClick={canSubmitConnection ? handleCreateConnection : undefined}
                    className={`h-[40px] px-[24px] rounded-[8px] text-white text-[14px] leading-[20px] flex items-center justify-center transition-colors ${
                      canSubmitConnection
                        ? 'bg-[#0f6beb] hover:bg-[#0d5bbf]'
                        : 'bg-[#d1d5dc] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isVerifyingUsage ? '驗證中...' : '完成設定'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 11: 嵌入碼（建立連結成功且有填 site_id 時顯示） */}
          {embedCode && (
            <div className="bg-white rounded-[14px] border-[1.6px] border-green-300">
              <div className="px-[24px] py-[16px] flex items-center gap-[12px]">
                <div className="bg-green-600 rounded-full size-[32px] flex items-center justify-center">
                  <Check className="size-[18px] text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-[18px] leading-[28px] text-neutral-950">
                    Widget 嵌入碼已就緒
                  </p>
                  <p className="text-[14px] leading-[20px] text-[#717182]">
                    請將以下程式碼寄給對方工程師貼到網站
                  </p>
                </div>
              </div>
              <div className="px-[24px] pb-[24px] flex flex-col gap-[12px]">
                <div className="bg-gray-900 text-green-400 rounded-[8px] p-[16px] font-mono text-[12px] leading-[18px] break-all">
                  {embedCode}
                </div>
                <div className="flex items-center gap-[12px]">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(embedCode);
                      setEmbedCopied(true);
                      setTimeout(() => setEmbedCopied(false), 2000);
                      showToast('嵌入碼已複製到剪貼簿', 'success');
                    }}
                    className="h-[36px] px-[16px] bg-[#0f6beb] hover:bg-[#0d5bbf] text-white text-[14px] rounded-[6px] flex items-center gap-[6px]"
                  >
                    <Copy className="size-[14px]" />
                    {embedCopied ? '已複製' : '複製嵌入碼'}
                  </button>
                  <span className="text-[12px] leading-[18px] text-[#6A7282]">
                    站點 ID：<code className="bg-gray-100 px-[6px] py-[2px] rounded">{embedSiteId}</code>
                  </span>
                </div>
                <div className="bg-blue-50 border border-[#bedbff] rounded-[6px] p-[12px] text-[12px] leading-[18px] text-[#193cb8]">
                  💡 部署小提示：
                  <ul className="list-disc pl-[18px] mt-[4px] space-y-[2px]">
                    <li>貼到官網 HTML 的 <code className="bg-blue-100 px-[4px] rounded">&lt;/body&gt;</code> 標籤之前</li>
                    <li>若官網有 CDN（Cloudflare 等），記得清除快取</li>
                    <li>部署後用無痕視窗驗證視窗是否出現</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Warning Section */}
        <div className="bg-blue-50 border-[0.8px] border-[#bedbff] rounded-[10px] px-[16.8px] py-[16.8px]">
          <p className="text-[14px] leading-[20px] text-[#193cb8]">
            <span className="font-bold">💡 提醒：</span>
            妥善保管您的 Channel Secret 和 Access Token，切勿公開分享。 這些資料將用於與 LINE 平台進行安全通訊。
          </p>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-16"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={enlargedImage}
              alt="Enlarged Screenshot"
              className="max-w-[900px] max-h-[600px] rounded-[10px] object-contain shadow-2xl"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full w-8 h-8 flex items-center justify-center shadow-lg cursor-pointer z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
