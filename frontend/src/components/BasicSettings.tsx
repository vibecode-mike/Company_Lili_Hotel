import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLineChannelStatus } from '../contexts/LineChannelStatusContext';
import { useToast } from './ToastProvider';
import { BasicSettingsEmpty } from './BasicSettingsEmpty';
import { BasicSettingsList, ChannelAccount } from './BasicSettingsList';
import LineApiSettingsContent from './LineApiSettingsContent';
import {
  ensureFacebookSdkLoaded,
  fbGetManagedPages,
  fbLogin,
} from '../utils/facebookSdk';

type ViewState = 'loading' | 'empty' | 'line-setup' | 'list';

interface BasicSettingsProps {
  onSetupComplete?: () => void;
}

type FbChannelDto = {
  id: number;
  page_id: string | null;
  channel_name: string | null;
  connection_status: 'connected' | 'expired' | 'disconnected' | null;
  last_verified_at: string | null;
  is_active: boolean | null;
};

type FbPageOption = {
  id: string;
  name: string;
  accessToken?: string;
};

type FacebookSdkConfigDto = {
  app_id: string;
  api_version: string;
};

/**
 * 基本設定主元件
 * 整合平台選擇、LINE 設定精靈、帳號列表等子元件
 */
export default function BasicSettings({ onSetupComplete }: BasicSettingsProps) {
  const { isConfigured, refreshStatus } = useLineChannelStatus();
  const { showToast } = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);
  const [facebookAuthorizing, setFacebookAuthorizing] = useState(false);
  const [facebookSdkLoading, setFacebookSdkLoading] = useState(false);
  const [facebookSdkReady, setFacebookSdkReady] = useState(false);
  const [facebookSdkError, setFacebookSdkError] = useState<string | null>(null);

  const hasAccounts = accounts.length > 0;

  const formatZhDateTime = useCallback((value: string | null | undefined) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date
      .toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-');
  }, []);

  const fbApiBaseUrl = useMemo(
    () => (import.meta.env.VITE_FB_API_URL?.trim() || 'https://api-youth-tycg.star-bit.io').replace(/\/+$/, ''),
    []
  );
  const fbServiceAccount = useMemo(
    () => import.meta.env.VITE_FB_FIRM_ACCOUNT?.trim() || 'tycg-admin',
    []
  );
  const fbServicePassword = useMemo(
    () => import.meta.env.VITE_FB_FIRM_PASSWORD?.trim() || '123456',
    []
  );

  const facebookLoginScope = useMemo(() => {
    return 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_metadata';
  }, []);


  const prepareFacebookSdk = useCallback(async () => {
    if (facebookSdkReady || facebookSdkLoading) return;
    setFacebookSdkLoading(true);
    setFacebookSdkError(null);
    try {
      const sdkConfigRes = await fetch('/api/v1/fb_channels/sdk_config');
      if (!sdkConfigRes.ok) {
        const detail = await sdkConfigRes.json().catch(() => null);
        const message = typeof detail?.detail === 'string' ? detail.detail : '無法取得 Facebook SDK 設定';
        throw new Error(message);
      }
      const sdkConfig = (await sdkConfigRes.json()) as FacebookSdkConfigDto;
      await ensureFacebookSdkLoaded({ appId: sdkConfig.app_id, version: sdkConfig.api_version });
      setFacebookSdkReady(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Facebook SDK 初始化失敗';
      setFacebookSdkError(message);
      setFacebookSdkReady(false);
    } finally {
      setFacebookSdkLoading(false);
    }
  }, [facebookSdkLoading, facebookSdkReady]);

  // 儲存粉專到後端
  const saveFacebookPage = useCallback(async (page: FbPageOption, targetChannelId: string | null) => {
    const endpoint = targetChannelId
      ? `/api/v1/fb_channels/${encodeURIComponent(targetChannelId)}`
      : '/api/v1/fb_channels';
    const method = targetChannelId ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_id: page.id,
        channel_name: page.name,
        is_active: true,
        connection_status: 'connected',
      }),
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(typeof detail?.detail === 'string' ? detail.detail : '無法保存 Facebook 粉絲專頁設定');
    }
  }, []);

  useEffect(() => {
    prepareFacebookSdk();
  }, [prepareFacebookSdk]);

  const reloadAccounts = useCallback(async () => {
    const nextAccounts: ChannelAccount[] = [];

    try {
      const [lineRes, fbRes] = await Promise.all([
        fetch('/api/v1/line_channels/current'),
        fetch('/api/v1/fb_channels'),
      ]);

      if (lineRes.ok) {
        const data = await lineRes.json();
        if (data && data.channel_id) {
          nextAccounts.push({
            id: data.id?.toString() || 'line-1',
            platform: 'line',
            name: '官方帳號名稱',
            accountId: data.basic_id ? `@${data.basic_id}` : undefined,
            channelId: data.channel_id,
            status: (data.connection_status || 'disconnected') as ChannelAccount['status'],
            lastVerified: formatZhDateTime(data.last_verified_at),
          });
        }
      }

      if (fbRes.ok) {
        const fbData = (await fbRes.json()) as FbChannelDto[];
        const fbAccounts: ChannelAccount[] = (Array.isArray(fbData) ? fbData : [])
          .filter(ch => ch?.is_active !== false)
          .map(ch => ({
            id: String(ch.id),
            platform: 'facebook' as const,
            name: ch.channel_name || 'Facebook 粉絲專頁',
            channelId: ch.page_id || '-',
            status: (ch.connection_status || 'disconnected') as ChannelAccount['status'],
            lastVerified: formatZhDateTime(ch.last_verified_at),
          }));

        nextAccounts.push(...fbAccounts);
      }
    } catch (error) {
      console.error('載入帳號資訊失敗:', error);
    }

    setAccounts(nextAccounts);
  }, [formatZhDateTime]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await reloadAccounts();
      if (!cancelled) setViewState('empty');
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadAccounts]);

  // 設定狀態變更時，刷新帳號資料（不改變目前畫面）
  useEffect(() => {
    reloadAccounts();
  }, [isConfigured, reloadAccounts]);

  // LINE 設定完成後的回調
  const handleLineSetupComplete = useCallback(async () => {
    await refreshStatus();
    await reloadAccounts();
    setViewState('list');
    showToast('已成功連結 LINE 官方帳號', 'success');
    onSetupComplete?.();
  }, [refreshStatus, reloadAccounts, showToast, onSetupComplete]);

  // 點擊 LINE 卡片
  const handleLineClick = useCallback(() => {
    // 檢查是否已有 LINE 帳號
    const hasLine = accounts.some(a => a.platform === 'line');
    if (hasLine) {
      showToast('目前只能綁定一組 LINE 官方帳號', 'error');
      return;
    }
    setViewState('line-setup');
  }, [accounts, showToast]);

  const performFirmLogin = useCallback(async (): Promise<string> => {
    const firmLoginResponse = await fetch(`${fbApiBaseUrl}/api/v1/admin/firm_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: fbServiceAccount, password: fbServicePassword }),
    });

    const firmLoginPayload = await firmLoginResponse.json().catch(() => null);
    if (!firmLoginResponse.ok) {
      throw new Error(firmLoginPayload?.msg || `firm_login 失敗（HTTP ${firmLoginResponse.status}）`);
    }

    const firmToken = firmLoginPayload?.data?.access_token;
    if (!firmToken) {
      throw new Error('firm_login 未取得 access_token，無法進行後續授權');
    }

    localStorage.setItem('jwt_token', firmToken);
    return firmToken;
  }, [fbApiBaseUrl, fbServiceAccount, fbServicePassword]);

  const requestMetaLogin = useCallback(
    async (facebookAccessToken: string): Promise<string> => {
      const ensureServiceJwt = async (): Promise<string> => {
        const existing = localStorage.getItem('jwt_token');
        if (existing) return existing;
        return performFirmLogin();
      };

      let serviceJwt = await ensureServiceJwt();

      const metaLoginResponse = await fetch(`${fbApiBaseUrl}/api/v1/admin/meta_page/meta_login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceJwt}`,
        },
        body: JSON.stringify({ access_token: facebookAccessToken }),
      });

      let metaLoginPayload = await metaLoginResponse.json().catch(() => null);

      // 若 JWT 過期，重新進行 firm_login 後再重試一次 meta_login
      if (metaLoginResponse.status === 401) {
        serviceJwt = await performFirmLogin();
        const retryResponse = await fetch(`${fbApiBaseUrl}/api/v1/admin/meta_page/meta_login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceJwt}`,
          },
          body: JSON.stringify({ access_token: facebookAccessToken }),
        });
        metaLoginPayload = await retryResponse.json().catch(() => null);
        if (!retryResponse.ok) {
          throw new Error(metaLoginPayload?.msg || `meta_login 失敗（HTTP ${retryResponse.status}）`);
        }
        // meta_login 成功後，繼續使用 firm_login 的 JWT（不覆蓋）
        return serviceJwt;
      }

      if (!metaLoginResponse.ok) {
        throw new Error(metaLoginPayload?.msg || `meta_login 失敗（HTTP ${metaLoginResponse.status}）`);
      }

      // meta_login 成功後，繼續使用 firm_login 的 JWT（不覆蓋）
      return serviceJwt;
    },
    [fbApiBaseUrl, performFirmLogin]
  );

  // Facebook 授權流程：FB.login → 取得粉專列表 → 自動儲存第一個粉專
  const handleFacebookAuthorize = useCallback(async (targetChannelId: string | null): Promise<boolean> => {
    setFacebookAuthorizing(true);
    try {
      if (facebookSdkError) {
        throw new Error(facebookSdkError);
      }
      if (!facebookSdkReady || !window.FB) {
        throw new Error('Facebook SDK 尚未載入完成，請稍候再試');
      }

      // 1. FB.login（官方彈窗）
      const loginResponse = await fbLogin(facebookLoginScope);
      if (loginResponse.status !== 'connected' || !loginResponse.authResponse?.accessToken) {
        throw new Error('Facebook 登入未完成（可能已取消授權）');
      }

      // 2. 呼叫 meta_login 綁定 FB token 到外部服務
      await requestMetaLogin(loginResponse.authResponse.accessToken);

      // 3. 取得用戶管理的粉專列表（/me/accounts）
      const pages = await fbGetManagedPages();
      const normalizedPages: FbPageOption[] = (Array.isArray(pages) ? pages : [])
        .filter(p => typeof p.id === 'string' && p.id)
        .map(p => ({
          id: p.id,
          name: typeof p.name === 'string' && p.name.trim() ? p.name : p.id,
          accessToken: p.access_token,
        }));

      if (normalizedPages.length === 0) {
        throw new Error('找不到可管理的粉絲專頁（請確認您的 Facebook 帳號有管理粉專的權限）');
      }

      // 4. 使用用戶在官方 FB.login 彈窗中授權的粉專
      const selectedPage = normalizedPages[0];

      // 5. 儲存粉專到本地資料庫
      await saveFacebookPage(selectedPage, targetChannelId);
      await reloadAccounts();
      setViewState('list');
      showToast(
        targetChannelId ? '已重新授權 Facebook 粉絲專頁' : '已成功連結 Facebook 粉絲專頁',
        'success'
      );
      return true;
    } catch (error) {
      console.error('Facebook 授權流程失敗:', error);
      showToast(error instanceof Error ? error.message : 'Facebook 授權失敗', 'error');
      return false;
    } finally {
      setFacebookAuthorizing(false);
    }
  }, [
    accounts,
    facebookLoginScope,
    facebookSdkError,
    facebookSdkReady,
    reloadAccounts,
    requestMetaLogin,
    saveFacebookPage,
    showToast,
  ]);

  // 同步 FB 會員列表到後端（非阻塞，失敗不影響主流程）
  const syncFacebookMembers = useCallback(async () => {
    const jwtToken = localStorage.getItem('jwt_token');
    if (!jwtToken) {
      console.warn('缺少 jwt_token，跳過 FB 會員同步');
      return;
    }

    try {
      const syncResponse = await fetch('/api/v1/fb_channels/sync-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jwt_token: jwtToken }),
      });

      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('FB 會員同步完成:', syncResult.data);
      } else {
        console.warn('FB 會員同步失敗，但不影響主流程');
      }
    } catch (syncError) {
      console.warn('FB 會員同步錯誤:', syncError);
      // 不阻斷主流程
    }
  }, []);

  // 點擊 Facebook 卡片 - FB.login → 取得粉專 → 自動儲存
  const handleFacebookClick = useCallback(async () => {
    if (!facebookSdkReady) {
      await prepareFacebookSdk();
      if (!facebookSdkReady && !window.FB) {
        showToast('Facebook SDK 載入失敗，請重試', 'error');
        return;
      }
    }
    await handleFacebookAuthorize(null);
  }, [facebookSdkReady, handleFacebookAuthorize, prepareFacebookSdk, showToast]);

  // 點擊新增帳號按鈕 - 直接回到平台選擇卡片
  const handleAddAccount = useCallback(() => {
    setViewState('empty');
  }, []);

  const handleViewAccounts = useCallback(async () => {
    setViewState('list');

    const lineAccount = accounts.find(a => a.platform === 'line');
    if (!lineAccount || lineAccount.status === 'connected') return;

    try {
      const response = await fetch('/api/v1/line_channels/verify', { method: 'POST' });
      if (!response.ok) return;
      await reloadAccounts();
      showToast('已驗證 LINE 官方帳號', 'success');
    } catch (error) {
      console.error('驗證 LINE 官方帳號失敗:', error);
    }
  }, [accounts, reloadAccounts, showToast]);

  // 重新授權
  const handleReauthorize = useCallback(async (account: ChannelAccount) => {
    if (account.platform === 'line') {
      try {
        const response = await fetch('/api/v1/line_channels/verify', { method: 'POST' });
        if (response.ok) {
          await reloadAccounts();
          showToast('已重新驗證 LINE 官方帳號', 'success');
          return;
        }
      } catch (error) {
        console.error('驗證 LINE 官方帳號失敗:', error);
      }
      setViewState('line-setup');
    } else {
      // Facebook: FB.login → 取得粉專 → 自動儲存
      if (!facebookSdkReady) {
        await prepareFacebookSdk();
        if (!facebookSdkReady && !window.FB) {
          showToast('Facebook SDK 載入失敗，請重試', 'error');
          return;
        }
      }
      await handleFacebookAuthorize(account.id);
    }
  }, [facebookSdkReady, handleFacebookAuthorize, prepareFacebookSdk, reloadAccounts, showToast]);

  // 返回列表
  const handleBackToList = useCallback(() => {
    if (hasAccounts) {
      setViewState('list');
    } else {
      setViewState('empty');
    }
  }, [hasAccounts]);


  // 渲染不同視圖
  if (viewState === 'loading') {
    return (
      <div className="bg-[#f6f9fd] min-h-screen w-full flex items-center justify-center">
        <div className="text-[#6e6e6e]">載入中...</div>
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <BasicSettingsEmpty
        onLineClick={handleLineClick}
        onFacebookClick={handleFacebookClick}
        hasAccounts={hasAccounts}
        onViewAccounts={hasAccounts ? handleViewAccounts : undefined}
      />
    );
  }

  if (viewState === 'line-setup') {
    return (
      <LineApiSettingsContent
        onComplete={handleLineSetupComplete}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <BasicSettingsList accounts={accounts} onAddAccount={handleAddAccount} onReauthorize={handleReauthorize} />
  );
}
