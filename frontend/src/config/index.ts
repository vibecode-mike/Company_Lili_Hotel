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
} as const;

export default config;
