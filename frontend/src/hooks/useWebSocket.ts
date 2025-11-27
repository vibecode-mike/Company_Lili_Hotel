/**
 * WebSocket Hook
 * 用於建立和管理與 Backend 的 WebSocket 連線,接收即時訊息推送
 */
import { useEffect, useRef, useCallback, useState } from 'react';

export interface WebSocketMessage {
  type: 'new_message' | 'pong';
  data?: {
    id: number | string;
    type: 'user' | 'official';
    text: string;
    time: string;
    isRead: boolean;
  };
}

interface UseWebSocketResult {
  isConnected: boolean;
}

export function useWebSocket(
  memberId: string | undefined,
  onMessage: (message: WebSocketMessage) => void
): UseWebSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!memberId) {
      setIsConnected(false);
      return;
    }

    // 清理舊連線
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/chat/${memberId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      wsRef.current = ws;
      setIsConnected(true);

      // 啟動 ping/pong 保活機制 (每 30 秒)
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'pong') {
          // 收到 pong 回應,連線正常
          return;
        }
        onMessage(message);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      setIsConnected(false);

      // 清理 ping 定時器
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = undefined;
      }

      // 自動重連 (3秒後)
      if (!event.wasClean) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    return ws;
  }, [memberId, onMessage]);

  useEffect(() => {
    const ws = connect();

    return () => {
      // 清理重連定時器
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // 清理 ping 定時器
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // 關閉 WebSocket 連線
      if (ws) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  return { isConnected };
}
