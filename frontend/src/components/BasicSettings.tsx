import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLineChannelStatus } from '../contexts/LineChannelStatusContext';
import { useToast } from './ToastProvider';
import { BasicSettingsEmpty } from './BasicSettingsEmpty';
import { BasicSettingsList, ChannelAccount } from './BasicSettingsList';
import LineApiSettingsContent from './LineApiSettingsContent';
import {
  ensureFacebookSdkLoaded,
  fbGetBusinesses,
  fbGetBusinessPages,
  fbGetPageAccessToken,
  fbLogin,
} from '../utils/facebookSdk';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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

type FbBusinessOption = {
  id: string;
  name: string;
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
  const [facebookDialogOpen, setFacebookDialogOpen] = useState(false);
  const [facebookAuthorizing, setFacebookAuthorizing] = useState(false);
  const [facebookSdkLoading, setFacebookSdkLoading] = useState(false);
  const [facebookSdkReady, setFacebookSdkReady] = useState(false);
  const [facebookSdkError, setFacebookSdkError] = useState<string | null>(null);
  const [facebookBusinesses, setFacebookBusinesses] = useState<FbBusinessOption[]>([]);
  const [selectedFacebookBusinessId, setSelectedFacebookBusinessId] = useState<string>('');
  const [facebookPages, setFacebookPages] = useState<FbPageOption[]>([]);
  const [selectedFacebookPageId, setSelectedFacebookPageId] = useState<string>('');
  const [facebookLoadingPages, setFacebookLoadingPages] = useState(false);
  const [facebookSubmitting, setFacebookSubmitting] = useState(false);
  const [facebookTargetChannelId, setFacebookTargetChannelId] = useState<string | null>(null);

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

  const facebookLoginScope = useMemo(() => {
    return 'public_profile,email,business_management,pages_show_list,pages_read_engagement';
  }, []);

  const resetFacebookDialog = useCallback(() => {
    setFacebookAuthorizing(false);
    setFacebookSubmitting(false);
    setFacebookLoadingPages(false);
    setFacebookBusinesses([]);
    setSelectedFacebookBusinessId('');
    setFacebookPages([]);
    setSelectedFacebookPageId('');
    setFacebookTargetChannelId(null);
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

  const loadFacebookPagesForBusiness = useCallback(async (businessId: string, preferredPageId?: string | null) => {
    const id = businessId.trim();
    if (!id) return;

    setFacebookLoadingPages(true);
    try {
      const pages = await fbGetBusinessPages(id);
      const normalized: FbPageOption[] = (Array.isArray(pages) ? pages : [])
        .filter(p => typeof p.id === 'string' && p.id)
        .map(p => ({
          id: p.id,
          name: typeof p.name === 'string' && p.name.trim() ? p.name : p.id,
        }));

      setFacebookPages(normalized);
      if (!normalized.length) {
        setSelectedFacebookPageId('');
        return;
      }

      const defaultSelected =
        preferredPageId && normalized.some(p => p.id === preferredPageId) ? preferredPageId : normalized[0].id;
      setSelectedFacebookPageId(defaultSelected);
    } finally {
      setFacebookLoadingPages(false);
    }
  }, []);

  const handleFacebookDialogOpenChange = useCallback((open: boolean) => {
    setFacebookDialogOpen(open);
    if (!open) resetFacebookDialog();
  }, [resetFacebookDialog]);

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

  const handleFacebookAuthorize = useCallback(async (targetChannelId: string | null): Promise<boolean> => {
    setFacebookAuthorizing(true);
    try {
      if (facebookSdkError) {
        throw new Error(facebookSdkError);
      }
      if (!facebookSdkReady || !window.FB) {
        throw new Error('Facebook SDK 尚未載入完成，請稍候再試');
      }

      const loginResponse = await fbLogin(facebookLoginScope);
      if (loginResponse.status !== 'connected' || !loginResponse.authResponse?.accessToken) {
        throw new Error('Facebook 登入未完成（可能已取消授權）');
      }

      const businesses = await fbGetBusinesses();
      const normalizedBusinesses: FbBusinessOption[] = (Array.isArray(businesses) ? businesses : [])
        .filter(b => typeof b.id === 'string' && b.id)
        .map(b => ({
          id: b.id,
          name: typeof b.name === 'string' && b.name.trim() ? b.name : b.id,
        }));

      if (normalizedBusinesses.length === 0) {
        throw new Error('找不到可管理的商家（請確認已授權 business_management，且帳號有 BM 權限）');
      }

      setFacebookBusinesses(normalizedBusinesses);

      const preferredPageId = targetChannelId ? accounts.find(a => a.id === targetChannelId)?.channelId : null;
      let selectedBusinessId = normalizedBusinesses[0].id;

      if (preferredPageId) {
        for (const business of normalizedBusinesses) {
          const pages = await fbGetBusinessPages(business.id);
          if ((Array.isArray(pages) ? pages : []).some(p => p?.id === preferredPageId)) {
            selectedBusinessId = business.id;
            break;
          }
        }
      }

      setSelectedFacebookBusinessId(selectedBusinessId);
      await loadFacebookPagesForBusiness(selectedBusinessId, preferredPageId);
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
    loadFacebookPagesForBusiness,
    showToast,
  ]);

  const handleFacebookBusinessChange = useCallback(
    async (businessId: string) => {
      setSelectedFacebookBusinessId(businessId);
      await loadFacebookPagesForBusiness(businessId, null);
    },
    [loadFacebookPagesForBusiness]
  );

  // 點擊 Facebook 卡片 - FB OAuth → meta_login → 存 JWT → 帳號列表
  const handleFacebookClick = useCallback(async () => {
    setFacebookAuthorizing(true);
    try {
      if (facebookSdkError) {
        throw new Error(facebookSdkError);
      }
      await prepareFacebookSdk();

      // FB OAuth 對話框
      const loginResponse = await fbLogin(facebookLoginScope);
      if (loginResponse.status !== 'connected' || !loginResponse.authResponse?.accessToken) {
        throw new Error('Facebook 登入未完成（可能已取消授權）');
      }

      // 呼叫 meta_login API
      const fbAccessToken = loginResponse.authResponse.accessToken;
      const metaLoginResponse = await fetch('https://api-youth-tycg.star-bit.io/api/v1/admin/meta_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: fbAccessToken }),
      });
      const metaLoginPayload = await metaLoginResponse.json().catch(() => null);
      const metaJwt = metaLoginPayload?.data?.access_token;
      if (!metaLoginResponse.ok || !metaJwt) {
        throw new Error(metaLoginPayload?.msg || `meta_login 失敗（HTTP ${metaLoginResponse.status}）`);
      }

      // 存 JWT → 帳號列表
      localStorage.setItem('meta_jwt_token', metaJwt);
      await reloadAccounts();
      setViewState('list');
      showToast('已完成 Facebook 連結', 'success');
    } catch (error) {
      console.error('Facebook 連結失敗:', error);
      showToast(error instanceof Error ? error.message : 'Facebook 連結失敗', 'error');
    } finally {
      setFacebookAuthorizing(false);
    }
  }, [facebookLoginScope, facebookSdkError, prepareFacebookSdk, reloadAccounts, showToast]);

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
      // Facebook: FB OAuth → meta_login → 存 JWT → 帳號列表
      setFacebookAuthorizing(true);
      try {
        if (facebookSdkError) {
          throw new Error(facebookSdkError);
        }
        await prepareFacebookSdk();

        const loginResponse = await fbLogin(facebookLoginScope);
        if (loginResponse.status !== 'connected' || !loginResponse.authResponse?.accessToken) {
          throw new Error('Facebook 登入未完成（可能已取消授權）');
        }

        const fbAccessToken = loginResponse.authResponse.accessToken;
        const metaLoginResponse = await fetch('https://api-youth-tycg.star-bit.io/api/v1/admin/meta_login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: fbAccessToken }),
        });
        const metaLoginPayload = await metaLoginResponse.json().catch(() => null);
        const metaJwt = metaLoginPayload?.data?.access_token;
        if (!metaLoginResponse.ok || !metaJwt) {
          throw new Error(metaLoginPayload?.msg || `meta_login 失敗（HTTP ${metaLoginResponse.status}）`);
        }

        localStorage.setItem('meta_jwt_token', metaJwt);
        await reloadAccounts();
        showToast('已完成 Facebook 重新連結', 'success');
      } catch (error) {
        console.error('Facebook 重新連結失敗:', error);
        showToast(error instanceof Error ? error.message : 'Facebook 重新連結失敗', 'error');
      } finally {
        setFacebookAuthorizing(false);
      }
    }
  }, [facebookLoginScope, facebookSdkError, prepareFacebookSdk, reloadAccounts, showToast]);

  // 返回列表
  const handleBackToList = useCallback(() => {
    if (hasAccounts) {
      setViewState('list');
    } else {
      setViewState('empty');
    }
  }, [hasAccounts]);

  const handleConfirmFacebookPage = useCallback(async () => {
    const selected = facebookPages.find(p => p.id === selectedFacebookPageId);
    if (!selected) return;

    setFacebookSubmitting(true);
    try {
      const tokenInfo = selected.accessToken
        ? { access_token: selected.accessToken, name: selected.name }
        : await fbGetPageAccessToken(selected.id);
      const pageAccessToken = tokenInfo.access_token;
      const pageName = tokenInfo.name || selected.name;

      const endpoint = facebookTargetChannelId
        ? `/api/v1/fb_channels/${encodeURIComponent(facebookTargetChannelId)}`
        : '/api/v1/fb_channels';

      const method = facebookTargetChannelId ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: selected.id,
          page_access_token: pageAccessToken,
          channel_name: pageName,
          is_active: true,
        }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        const message =
          typeof detail?.detail === 'string'
            ? detail.detail
            : '無法保存 Facebook 粉絲專頁設定';
        throw new Error(message);
      }

      setFacebookDialogOpen(false);
      resetFacebookDialog();
      await reloadAccounts();
      setViewState('list');
      showToast(
        facebookTargetChannelId ? '已重新授權 Facebook 粉絲專頁' : '已成功連結 Facebook 粉絲專頁',
        'success'
      );
    } catch (error) {
      console.error('保存 Facebook 粉絲專頁失敗:', error);
      showToast(error instanceof Error ? error.message : '保存 Facebook 粉絲專頁失敗', 'error');
    } finally {
      setFacebookSubmitting(false);
    }
  }, [
    facebookPages,
    selectedFacebookPageId,
    facebookTargetChannelId,
    reloadAccounts,
    resetFacebookDialog,
    showToast,
  ]);

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
      <>
        <BasicSettingsEmpty
          onLineClick={handleLineClick}
          onFacebookClick={handleFacebookClick}
          hasAccounts={hasAccounts}
          onViewAccounts={hasAccounts ? handleViewAccounts : undefined}
        />
        <Dialog open={facebookDialogOpen} onOpenChange={handleFacebookDialogOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>連接 Facebook 帳號</DialogTitle>
              <DialogDescription>
                透過官方授權流程取得可管理的粉絲專頁，驗證成功後會自動保存。
              </DialogDescription>
            </DialogHeader>
            {!facebookBusinesses.length ? (
              <div className="flex flex-col gap-2">
	                <button
	                  type="button"
	                  className="bg-[#242424] text-white rounded-[12px] px-[12px] py-[10px] hover:bg-[#383838] transition-colors disabled:opacity-60"
	                  onClick={
	                    facebookSdkReady ? () => handleFacebookAuthorize(facebookTargetChannelId) : prepareFacebookSdk
	                  }
	                  disabled={facebookAuthorizing || facebookSubmitting || facebookSdkLoading}
	                >
	                  {facebookAuthorizing ? '授權中...' : facebookSdkLoading ? '載入 Facebook...' : '使用 Facebook 登入/授權'}
	                </button>
                <p className="text-[12px] text-[#6e6e6e]">
                  若未出現登入視窗，請確認瀏覽器未阻擋彈出視窗或第三方 Cookie。
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Select value={selectedFacebookBusinessId} onValueChange={handleFacebookBusinessChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選擇使用的商家" />
                  </SelectTrigger>
                  <SelectContent>
                    {facebookBusinesses.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedFacebookPageId}
                  onValueChange={setSelectedFacebookPageId}
                  disabled={facebookLoadingPages}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={facebookLoadingPages ? '載入粉絲專頁中...' : '選擇粉絲專頁'} />
                  </SelectTrigger>
                  <SelectContent>
                    {facebookPages.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <button
                type="button"
                className="border border-[#ddd] rounded-[12px] px-[12px] py-[8px] hover:bg-[#f5f5f5] transition-colors"
                onClick={() => handleFacebookDialogOpenChange(false)}
                disabled={facebookAuthorizing || facebookSubmitting}
              >
                取消
              </button>
              <button
                type="button"
                className="bg-[#242424] text-white rounded-[12px] px-[12px] py-[8px] hover:bg-[#383838] transition-colors disabled:opacity-60"
                onClick={handleConfirmFacebookPage}
                disabled={
                  !selectedFacebookBusinessId ||
                  !selectedFacebookPageId ||
                  facebookAuthorizing ||
                  facebookSubmitting ||
                  facebookLoadingPages
                }
              >
                {facebookSubmitting ? '驗證並保存中...' : '確認連結'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
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
    <>
      <BasicSettingsList accounts={accounts} onAddAccount={handleAddAccount} onReauthorize={handleReauthorize} />
      <Dialog open={facebookDialogOpen} onOpenChange={handleFacebookDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>連接 Facebook 帳號</DialogTitle>
            <DialogDescription>
              透過官方授權流程取得可管理的粉絲專頁，驗證成功後會自動保存。
            </DialogDescription>
          </DialogHeader>
          {!facebookBusinesses.length ? (
            <div className="flex flex-col gap-2">
	              <button
	                type="button"
	                className="bg-[#242424] text-white rounded-[12px] px-[12px] py-[10px] hover:bg-[#383838] transition-colors disabled:opacity-60"
	                onClick={
	                  facebookSdkReady ? () => handleFacebookAuthorize(facebookTargetChannelId) : prepareFacebookSdk
	                }
	                disabled={facebookAuthorizing || facebookSubmitting || facebookSdkLoading}
	              >
	                {facebookAuthorizing ? '授權中...' : facebookSdkLoading ? '載入 Facebook...' : '使用 Facebook 登入/授權'}
	              </button>
              <p className="text-[12px] text-[#6e6e6e]">
                若未出現登入視窗，請確認瀏覽器未阻擋彈出視窗或第三方 Cookie。
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Select value={selectedFacebookBusinessId} onValueChange={handleFacebookBusinessChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選擇使用的商家" />
                </SelectTrigger>
                <SelectContent>
                  {facebookBusinesses.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFacebookPageId} onValueChange={setSelectedFacebookPageId} disabled={facebookLoadingPages}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={facebookLoadingPages ? '載入粉絲專頁中...' : '選擇粉絲專頁'} />
                </SelectTrigger>
                <SelectContent>
                  {facebookPages.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              className="border border-[#ddd] rounded-[12px] px-[12px] py-[8px] hover:bg-[#f5f5f5] transition-colors"
              onClick={() => handleFacebookDialogOpenChange(false)}
              disabled={facebookAuthorizing || facebookSubmitting}
            >
              取消
            </button>
            <button
              type="button"
              className="bg-[#242424] text-white rounded-[12px] px-[12px] py-[8px] hover:bg-[#383838] transition-colors disabled:opacity-60"
              onClick={handleConfirmFacebookPage}
              disabled={
                !selectedFacebookBusinessId ||
                !selectedFacebookPageId ||
                facebookAuthorizing ||
                facebookSubmitting ||
                facebookLoadingPages
              }
            >
              {facebookSubmitting ? '驗證並保存中...' : '確認連結'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
