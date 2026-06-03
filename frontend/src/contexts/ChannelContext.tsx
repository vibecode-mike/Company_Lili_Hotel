import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { apiGet } from '../utils/apiClient';
import { LineChannelInfo } from '../hooks/useLineChannels';
import { useAuth } from '../components/auth/AuthContext';

export const CHANNEL_STORAGE_KEY = 'selected_channel_id';

interface ChannelContextValue {
  /** 當前選中的 channel（可能為 null：載入中 / 系統還沒設定 LINE OA / 沒被指派任何館別）*/
  selectedChannel: LineChannelInfo | null;
  /** 此 user 被指派可看的 channels（admin 為全部，一般 user 為被指派的）*/
  availableChannels: LineChannelInfo[];
  /** 切換 channel（同步寫入 sessionStorage）*/
  setSelectedChannel: (channel: LineChannelInfo) => void;
  /** 載入狀態（第一次抓 my-channels）*/
  loading: boolean;
  /** channel 清單抓取錯誤 */
  error: string | null;
  /** user 未被指派任何 channel — UI 用這個顯示空狀態提示 */
  hasNoChannels: boolean;
  /** 手動重新抓 my-channels（例如 admin 剛在帳號管理頁改了自己的指派）*/
  refetch: () => Promise<void>;
}

const ChannelContext = createContext<ChannelContextValue | null>(null);

interface ChannelProviderProps {
  children: ReactNode;
}

/**
 * 全站當前操作分館 (LINE OA / 之後加 FB / Webchat) 的上下文。
 *
 * 行為規格：
 * - 首次掛載：抓 /api/v1/staff/my-channels（admin 拿全部，一般 user 拿被指派的）
 * - sessionStorage 儲存 channel_id，**換頁/重整保留，關瀏覽器/登出清除**
 * - sessionStorage 上的 id 已不在清單時（被刪除/未授權）自動 fallback 到 list[0]
 * - user 沒被指派任何 channel 時 selectedChannel = null + hasNoChannels = true
 */
export function ChannelProvider({ children }: ChannelProviderProps) {
  const { isAuthenticated, user } = useAuth();
  const [channels, setChannels] = useState<LineChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(CHANNEL_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const fetchMyChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet('/api/v1/staff/my-channels');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const lineChannels: LineChannelInfo[] = Array.isArray(data) ? data : [];

      // 組織重構：admin 額外把「無 LINE 的組織」附加進清單（讓純官網彈窗組織也能在切換器看到）。
      // LINE 組織的載入完全不動（零風險）；無 LINE 組織用 `tenant:<id>` 哨符當 channel_id。
      let noLineOrgs: LineChannelInfo[] = [];
      if ((user?.role || '').toLowerCase() === 'admin') {
        try {
          const tRes = await apiGet('/api/v1/tenants');
          if (tRes.ok) {
            const tenants = await tRes.json();
            if (Array.isArray(tenants)) {
              noLineOrgs = tenants
                .filter((t) => (t.line_channel_count ?? 0) === 0)
                .map((t) => ({
                  id: -Number(t.id), // 避免與 LINE channel 的 id 撞號
                  channel_id: `tenant:${t.id}`,
                  channel_name: t.name,
                  basic_id: '（官網彈窗・無 LINE）',
                  is_active: !!t.is_active,
                  tenant_id: Number(t.id),
                  is_no_line_org: true,
                }));
            }
          }
        } catch {
          // 取組織清單失敗不影響 LINE 主清單
        }
      }
      setChannels([...lineChannels, ...noLineOrgs]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得可用 LINE OA 失敗';
      setError(message);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!isAuthenticated) {
      setChannels([]);
      setLoading(false);
      return;
    }
    fetchMyChannels();
  }, [isAuthenticated, fetchMyChannels]);

  // channels 載入後：若 sessionStorage 的 id 不在清單裡，回退到第一個
  useEffect(() => {
    if (channels.length === 0) return;
    const exists = channels.some((c) => c.channel_id === selectedChannelId);
    if (!exists) {
      const fallback = channels[0];
      setSelectedChannelIdState(fallback.channel_id);
      try {
        sessionStorage.setItem(CHANNEL_STORAGE_KEY, fallback.channel_id);
      } catch {
        // sessionStorage 可能被禁用，忽略
      }
    }
  }, [channels, selectedChannelId]);

  const setSelectedChannel = useCallback((channel: LineChannelInfo) => {
    setSelectedChannelIdState(channel.channel_id);
    try {
      sessionStorage.setItem(CHANNEL_STORAGE_KEY, channel.channel_id);
    } catch {
      // 忽略
    }
  }, []);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.channel_id === selectedChannelId) ?? null,
    [channels, selectedChannelId]
  );

  const hasNoChannels = !loading && channels.length === 0;

  const value = useMemo<ChannelContextValue>(
    () => ({
      selectedChannel,
      availableChannels: channels,
      setSelectedChannel,
      loading,
      error,
      hasNoChannels,
      refetch: fetchMyChannels,
    }),
    [selectedChannel, channels, setSelectedChannel, loading, error, hasNoChannels, fetchMyChannels]
  );

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export function useChannel(): ChannelContextValue {
  const ctx = useContext(ChannelContext);
  if (!ctx) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return ctx;
}

/**
 * 便利 hook：直接拿 channel_id 字串，未設定時回傳 undefined。
 * 多數 API 呼叫只需要 channel_id 字串，用這個比較簡潔。
 */
export function useSelectedChannelId(): string | undefined {
  const { selectedChannel } = useChannel();
  return selectedChannel?.channel_id;
}
