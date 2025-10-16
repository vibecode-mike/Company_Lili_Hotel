/**
 * Axios 客戶端配置
 */
import axios from 'axios';
import { API_BASE_URL, API_V1_STR } from '@/config/env';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_STR}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期，跳轉登入頁
      localStorage.removeItem('token');
      // 暫時註釋掉跳轉，開發階段使用
      // window.location.href = '/login';
      console.warn('API 返回 401 未認證錯誤，請檢查後端認證設置');
    }
    // 如果有響應數據,也返回 data,保持一致性
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);
