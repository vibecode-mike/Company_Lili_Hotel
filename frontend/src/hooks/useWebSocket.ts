/**
 * WebSocket Hook
 * 用於建立和管理與 Backend 的 WebSocket 連線,接收即時訊息推送
 */
import { useEffect, useRef, useState } from 'react';
import { config } from '@/config';

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
  threadId: string | undefined,
  onMessage: (message: WebSocketMessage) => void
): UseWebSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);

  // 使用 ref 保存 onMessage 避免依賴變化導致重連
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!threadId) {
      setIsConnected(false);
      return;
    }

    // 清理舊連線
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 使用統一配置取得 WebSocket URL
    const wsUrl = config.ws.getUrl(`/api/v1/ws/chat/${threadId}`);

    let reconnectAttempt = 0;
    const { maxAttempts, baseDelay, maxDelay } = config.reconnect;

    const connect = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        wsRef.current = ws;
        setIsConnected(true);
        reconnectAttempt = 0; // 重置重連計數

        // 啟動 ping/pong 保活機制
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, config.heartbeat.interval);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === 'pong') {
            // 收到 pong 回應,連線正常
            return;
          }
          onMessageRef.current(message);
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

        // 自動重連（指數退避）
        if (!event.wasClean && reconnectAttempt < maxAttempts) {
          reconnectAttempt++;
          const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempt), maxDelay);
          console.log(`🔄 WebSocket 重連中... (${reconnectAttempt}/${maxAttempts})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      return ws;
    };

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
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [threadId]); // 只依賴 threadId，不依賴 onMessage

  return { isConnected };
}
