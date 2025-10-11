/**
 * Axios 實例配置
 * 統一處理 API 請求
 */
import axios from 'axios';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: '/api/v1', // 使用相對路徑，通過 Vite proxy 轉發
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在這裡添加 token 等認證信息
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 統一錯誤處理
    if (error.response) {
      // 服務器返回錯誤狀態碼
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // 請求已發送但沒有收到響應
      console.error('Network Error:', error.message);
    } else {
      // 其他錯誤
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
