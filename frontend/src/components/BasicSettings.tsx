import { useState, useEffect, useCallback } from 'react';
import { useLineChannelStatus } from '../contexts/LineChannelStatusContext';
import { useToast } from './ToastProvider';
import { BasicSettingsEmpty } from './BasicSettingsEmpty';
import { BasicSettingsList, ChannelAccount } from './BasicSettingsList';
import LineApiSettingsContent from './LineApiSettingsContent';

type ViewState = 'loading' | 'empty' | 'line-setup' | 'list';

interface BasicSettingsProps {
  onSetupComplete?: () => void;
}

/**
 * 基本設定主元件
 * 整合平台選擇、LINE 設定精靈、帳號列表等子元件
 */
export default function BasicSettings({ onSetupComplete }: BasicSettingsProps) {
  const { isConfigured, refreshStatus } = useLineChannelStatus();
  const { showToast } = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);

  // 初始化: 載入現有帳號狀態，但一律顯示平台選擇卡片
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        // 嘗試從 API 載入 LINE 頻道資訊
        const response = await fetch('/api/v1/line_channels/current');
        if (response.ok) {
          const data = await response.json();
          if (data && data.channel_id) {
            // 有已設定的 LINE 帳號，載入到 state
            const lineAccount: ChannelAccount = {
              id: data.id?.toString() || 'line-1',
              platform: 'line',
              name: '官方帳號名稱',
              accountId: data.basic_id ? `@${data.basic_id}` : undefined,
              channelId: data.channel_id,
              status: 'connected',
              lastVerified: new Date().toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }).replace(/\//g, '-')
            };
            setAccounts([lineAccount]);
          }
        }
      } catch (error) {
        console.error('載入帳號資訊失敗:', error);
      }
      // 一律顯示平台選擇卡片
      setViewState('empty');
    };

    loadAccounts();
  }, [isConfigured]);

  // LINE 設定完成後的回調
  const handleLineSetupComplete = useCallback(async () => {
    await refreshStatus();

    // 重新載入帳號列表
    try {
      const response = await fetch('/api/v1/line_channels/current');
      if (response.ok) {
        const data = await response.json();
        if (data && data.channel_id) {
          const lineAccount: ChannelAccount = {
            id: data.id?.toString() || 'line-1',
            platform: 'line',
            name: '官方帳號名稱',
            accountId: data.basic_id ? `@${data.basic_id}` : undefined,
            channelId: data.channel_id,
            status: 'connected',
            lastVerified: new Date().toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).replace(/\//g, '-')
          };

          // 保留已存在的 Facebook 帳號
          const fbAccounts = accounts.filter(a => a.platform === 'facebook');
          setAccounts([lineAccount, ...fbAccounts]);
        }
      }
    } catch (error) {
      console.error('載入 LINE 帳號資訊失敗:', error);
    }

    setViewState('list');
    showToast('已成功連結 LINE 官方帳號', 'success');
    onSetupComplete?.();
  }, [accounts, refreshStatus, showToast, onSetupComplete]);

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

  // 點擊 Facebook 卡片 - 模擬連結成功
  const handleFacebookClick = useCallback(() => {
    const existingFb = accounts.filter(a => a.platform === 'facebook');

    // 限制最多 2 個 Facebook 帳號 (用於展示失效狀態)
    if (existingFb.length >= 2) {
      showToast('目前只能綁定兩組 Facebook 帳號', 'error');
      return;
    }

    // 第一次: 模擬成功連結, 第二次: 模擬失效狀態
    const newFbAccount: ChannelAccount = {
      id: `fb-${Date.now()}`,
      platform: 'facebook',
      name: '粉絲專頁名稱',
      channelId: '561254424301156',
      status: existingFb.length > 0 ? 'expired' : 'connected',
      lastVerified: new Date().toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
    };

    setAccounts([...accounts, newFbAccount]);
    setViewState('list');
    showToast(
      existingFb.length > 0
        ? '已加入失效的 Facebook 帳號 (測試用)'
        : '已成功連結 Facebook 粉絲專頁',
      'success'
    );
  }, [accounts, showToast]);

  // 點擊新增帳號按鈕 - 直接回到平台選擇卡片
  const handleAddAccount = useCallback(() => {
    setViewState('empty');
  }, []);

  // 重新授權
  const handleReauthorize = useCallback((account: ChannelAccount) => {
    if (account.platform === 'line') {
      setViewState('line-setup');
    } else {
      // Facebook 重新授權 - 模擬更新狀態
      const updatedAccounts = accounts.map(a =>
        a.id === account.id ? { ...a, status: 'connected' as const, lastVerified: new Date().toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\//g, '-') } : a
      );
      setAccounts(updatedAccounts);
      showToast('已重新連結 Facebook 粉絲專頁', 'success');
    }
  }, [accounts, showToast]);

  // 返回列表
  const handleBackToList = useCallback(() => {
    if (accounts.length > 0) {
      setViewState('list');
    } else {
      setViewState('empty');
    }
  }, [accounts]);

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
    <BasicSettingsList
      accounts={accounts}
      onAddAccount={handleAddAccount}
      onReauthorize={handleReauthorize}
    />
  );
}
