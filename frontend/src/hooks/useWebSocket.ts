/**
 * SSE (Server-Sent Events) Hook
 * 用於建立和管理與 Backend 的 SSE 連線,接收即時訊息推送
 * 兼容 HTTP/2 環境（取代 WebSocket）
 */
import { useEffect, useRef, useState } from 'react';

export interface SSEMessageData {
  type: 'new_message';
  data?: {
    id: number | string;
    type: 'user' | 'official';
    text: string;
    time: string;
    isRead: boolean;
  };
}

interface UseSSEResult {
  isConnected: boolean;
}

export function useSSE(
  threadId: string | undefined,
  onMessage: (message: SSEMessageData) => void
): UseSSEResult {
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!threadId) {
      setIsConnected(false);
      return;
    }

    const url = `/api/v1/sse/chat/${threadId}`;
    const es = new EventSource(url);

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const message: SSEMessageData = JSON.parse(event.data);
        if (message.type === 'new_message') {
          onMessageRef.current(message);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      // EventSource 會自動重連，不需手動處理
    };

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [threadId]);

  return { isConnected };
}
