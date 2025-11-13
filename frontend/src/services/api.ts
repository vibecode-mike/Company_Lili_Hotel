/**
 * API 基礎配置
 * 配置 axios 實例，包含攔截器和錯誤處理
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// 創建 axios 實例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8700/api/v1',
  timeout: 30000, // 30 秒超時
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器：添加 auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 如果有 token，添加到請求頭
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ 請求錯誤:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器：統一錯誤處理
api.interceptors.response.use(
  (response) => {
    // 成功響應直接返回數據
    return response;
  },
  (error: AxiosError) => {
    // 錯誤處理
    const status = error.response?.status;
    const message = (error.response?.data as any)?.detail || error.message;

    // 根據 HTTP 狀態碼顯示不同錯誤
    switch (status) {
      case 400:
        toast.error('請求參數錯誤', {
          description: message,
        });
        break;

      case 401:
        toast.error('未授權', {
          description: '請重新登入',
        });
        // 可選：清除 token 並跳轉到登入頁
        localStorage.removeItem('auth_token');
        // window.location.href = '/login';
        break;

      case 403:
        toast.error('無權限訪問', {
          description: message,
        });
        break;

      case 404:
        toast.error('資源不存在', {
          description: message,
        });
        break;

      case 500:
        toast.error('伺服器錯誤', {
          description: '請稍後再試',
        });
        break;

      case 503:
        toast.error('服務暫時不可用', {
          description: '請稍後再試',
        });
        break;

      default:
        // 網絡錯誤或其他未知錯誤
        if (!error.response) {
          toast.error('網絡錯誤', {
            description: '無法連接到伺服器，請檢查網絡連接',
          });
        } else {
          toast.error('發生錯誤', {
            description: message,
          });
        }
    }

    console.error('❌ API 錯誤:', {
      url: error.config?.url,
      status,
      message,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;
