import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useLineChannels, LineChannelInfo } from '../hooks/useLineChannels';

export const CHANNEL_STORAGE_KEY = 'selected_channel_id';

interface ChannelContextValue {
  /** 當前選中的 channel（可能為 null：載入中 / 系統還沒設定任何 LINE OA）*/
  selectedChannel: LineChannelInfo | null;
  /** 所有可選的 channels（未來 staff 權限會在這層做過濾）*/
  availableChannels: LineChannelInfo[];
  /** 切換 channel（同步寫入 sessionStorage）*/
  setSelectedChannel: (channel: LineChannelInfo) => void;
  /** 載入狀態（第一次抓 channel 清單）*/
  loading: boolean;
  /** channel 清單抓取錯誤 */
  error: string | null;
}

const ChannelContext = createContext<ChannelContextValue | null>(null);

interface ChannelProviderProps {
  children: ReactNode;
}

/**
 * 全站當前操作分館 (LINE OA / 之後加 FB / Webchat) 的上下文。
 *
 * 行為規格：
 * - 首次掛載：抓 /api/v1/line_channels/list，sessionStorage 有值優先用，否則用 list[0]
 * - sessionStorage 儲存 channel_id，**換頁/重整保留，關瀏覽器/登出清除**
 * - sessionStorage 上的 id 已不在清單時（被刪除/停用）自動 fallback 到 list[0]
 *
 * 之後權限模組會在這層做過濾（只給 staff 看他被授權的 channel）。
 */
export function ChannelProvider({ children }: ChannelProviderProps) {
  const { channels, loading, error } = useLineChannels();
  const [selectedChannelId, setSelectedChannelIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(CHANNEL_STORAGE_KEY);
    } catch {
      return null;
    }
  });

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

  const value = useMemo<ChannelContextValue>(
    () => ({
      selectedChannel,
      availableChannels: channels,
      setSelectedChannel,
      loading,
      error,
    }),
    [selectedChannel, channels, setSelectedChannel, loading, error]
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
