/**
 * API Client
 * 统一的 HTTP 客户端，处理所有 API 请求
 */

import { ApiResponse, ApiErrorResponse } from '../types/campaign';

// 从环境变量获取 API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * HTTP 请求配置
 */
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
}

/**
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * 处理 API 错误响应
 */
function handleErrorResponse(error: any): ApiErrorResponse {
  if (error.detail) {
    return error;
  }

  return {
    detail: error.message || '未知錯誤',
  };
}

/**
 * 统一的请求方法
 */
async function request<T>(endpoint: string, config: RequestConfig): Promise<ApiResponse<T>> {
  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

  try {
    // 构建完整 URL
    let url = `${API_BASE_URL}${endpoint}`;

    // 添加查询参数
    if (config.params) {
      url += buildQueryString(config.params);
    }

    // 构建请求选项
    const options: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      signal: controller.signal, // 添加 abort signal
    };

    // 添加请求体
    if (config.body && config.method !== 'GET') {
      options.body = JSON.stringify(config.body);
    }

    console.log(`🌐 API Request: ${config.method} ${url}`);

    // 发送请求
    const response = await fetch(url, options);

    // 清除超时定时器
    clearTimeout(timeoutId);

    // 处理响应
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));

      return {
        error: handleErrorResponse(error),
        status: response.status,
      };
    }

    // 解析成功响应
    const data = await response.json();
    console.log(`✅ API Response: ${config.method} ${url}`, data);

    return {
      data,
      status: response.status,
    };
  } catch (error: any) {
    // 清除超时定时器
    clearTimeout(timeoutId);

    console.error('❌ API 请求失败:', error);

    // 处理不同类型的错误
    if (error.name === 'AbortError') {
      return {
        error: {
          detail: '請求超時，請稍後再試',
        },
        status: 408,
      };
    }

    return {
      error: {
        detail: error.message || '網絡請求失敗',
      },
      status: 0,
    };
  }
}

/**
 * GET 请求
 */
export async function get<T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'GET',
    params,
  });
}

/**
 * POST 请求
 */
export async function post<T>(
  endpoint: string,
  body?: any,
  params?: Record<string, any>
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'POST',
    body,
    params,
  });
}

/**
 * PUT 请求
 */
export async function put<T>(
  endpoint: string,
  body?: any,
  params?: Record<string, any>
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'PUT',
    body,
    params,
  });
}

/**
 * PATCH 请求
 */
export async function patch<T>(
  endpoint: string,
  body?: any,
  params?: Record<string, any>
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body,
    params,
  });
}

/**
 * DELETE 请求
 */
export async function del<T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'DELETE',
    params,
  });
}

/**
 * 文件上传（不使用 JSON）
 */
export async function uploadFile(
  endpoint: string,
  file: File
): Promise<ApiResponse<any>> {
  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时（文件上传）

  try {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}${endpoint}`;

    console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
    });

    // 清除超时定时器
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));

      return {
        error: handleErrorResponse(error),
        status: response.status,
      };
    }

    const data = await response.json();
    console.log(`✅ File uploaded successfully:`, data);

    return {
      data,
      status: response.status,
    };
  } catch (error: any) {
    // 清除超时定时器
    clearTimeout(timeoutId);

    console.error('❌ 文件上傳失敗:', error);

    // 处理不同类型的错误
    if (error.name === 'AbortError') {
      return {
        error: {
          detail: '文件上傳超時，請檢查網絡連接或縮小文件大小',
        },
        status: 408,
      };
    }

    return {
      error: {
        detail: error.message || '文件上傳失敗',
      },
      status: 0,
    };
  }
}

/**
 * API 客户端导出
 */
export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  uploadFile,
};

export default apiClient;
