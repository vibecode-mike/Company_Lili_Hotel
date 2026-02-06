/**
 * 前端應用配置
 * 統一管理所有環境變數和配置項
 */

// 環境判斷
export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;
export const mode = import.meta.env.MODE;

// API 配置
export const config = {
  // API 基礎路徑
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',

  // WebSocket 配置
  ws: {
    // WebSocket 埠號（開發環境直連後端，生產環境走 nginx 代理）
    port: import.meta.env.VITE_WS_PORT || '',

    // 取得 WebSocket 主機
    getHost: () => {
      const wsPort = config.ws.port;
      return wsPort ? `${window.location.hostname}:${wsPort}` : window.location.host;
    },

    // 取得 WebSocket 協議
    getProtocol: () => {
      return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    },

    // 取得完整 WebSocket URL
    getUrl: (path: string) => {
      return `${config.ws.getProtocol()}//${config.ws.getHost()}${path}`;
    },
  },

  // 重連配置
  reconnect: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },

  // 心跳配置
  heartbeat: {
    interval: 30000, // 30 秒
  },
} as const;

export default config;
