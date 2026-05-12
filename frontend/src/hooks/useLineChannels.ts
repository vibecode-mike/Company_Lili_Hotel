import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../utils/apiClient';

export interface LineChannelInfo {
  id: number;
  channel_id: string;
  channel_name: string | null;
  basic_id: string | null;
  is_active: boolean;
}

interface UseLineChannelsResult {
  channels: LineChannelInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 拉所有啟用中的 LINE OA 帳號清單。
 * 供訊息推播頁切換器 / 建立訊息頁 / 基本設定清單 使用。
 * 第一筆為前端切換器的預設選項。
 */
export function useLineChannels(): UseLineChannelsResult {
  const [channels, setChannels] = useState<LineChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet('/api/v1/line_channels/list');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setChannels(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得 LINE 帳號清單失敗';
      setError(message);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return { channels, loading, error, refetch: fetchChannels };
}
