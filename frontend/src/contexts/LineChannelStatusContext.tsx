import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useAuth } from '../components/auth/AuthContext';

interface LineChannelStatusState {
  isConfigured: boolean;
  hasActiveChannel: boolean;
  missingFields: string[];
  channelDbId: number | null;
}

interface LineChannelStatusContextValue extends LineChannelStatusState {
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  hasFetchedOnce: boolean;
}

const DEFAULT_STATE: LineChannelStatusState = {
  isConfigured: false,
  hasActiveChannel: false,
  missingFields: [],
  channelDbId: null,
};

const LineChannelStatusContext = createContext<LineChannelStatusContextValue | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export function LineChannelStatusProvider({ children }: ProviderProps) {
  const { isAuthenticated } = useAuth();
  const [statusState, setStatusState] = useState<LineChannelStatusState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setStatusState({ ...DEFAULT_STATE });
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/line_channels/status');
      if (!response.ok) {
        throw new Error('無法取得 LINE 基本設定狀態');
      }

      const data = await response.json();
      setStatusState({
        isConfigured: Boolean(data.is_configured),
        hasActiveChannel: Boolean(data.has_active_channel),
        missingFields: Array.isArray(data.missing_fields) ? data.missing_fields : [],
        channelDbId: typeof data.channel_db_id === 'number' ? data.channel_db_id : null,
      });
      setError(null);
      setHasFetchedOnce(true);
    } catch (err) {
      console.error('取得 LINE 頻道設定狀態失敗:', err);
      setError(err instanceof Error ? err.message : '取得狀態時發生錯誤');
      setStatusState({ ...DEFAULT_STATE });
      setHasFetchedOnce(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    } else {
      setStatusState({ ...DEFAULT_STATE });
      setIsLoading(false);
      setHasFetchedOnce(false);
    }
  }, [isAuthenticated, fetchStatus]);

  const value = useMemo<LineChannelStatusContextValue>(() => ({
    ...statusState,
    isLoading,
    error,
    refreshStatus: fetchStatus,
    hasFetchedOnce,
  }), [statusState, isLoading, error, fetchStatus, hasFetchedOnce]);

  return (
    <LineChannelStatusContext.Provider value={value}>
      {children}
    </LineChannelStatusContext.Provider>
  );
}

export function useLineChannelStatus() {
  const context = useContext(LineChannelStatusContext);
  if (!context) {
    throw new Error('useLineChannelStatus 必須搭配 LineChannelStatusProvider 使用');
  }
  return context;
}
