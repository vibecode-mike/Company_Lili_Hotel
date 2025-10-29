/**
 * Upload Service
 * 文件上传相关的 API 服务
 */

import { apiClient } from './apiClient';
import { ImageUploadResponse, ApiResponse } from '../types/campaign';

/**
 * 上传图片文件
 */
export async function uploadImage(
  file: File
): Promise<ApiResponse<ImageUploadResponse>> {
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      error: {
        detail: '不支持的文件格式。允许的格式: JPG, PNG, GIF',
      },
      status: 400,
    };
  }

  // 验证文件大小（5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      error: {
        detail: `文件大小超过限制。最大允许: ${maxSize / 1024 / 1024}MB`,
      },
      status: 400,
    };
  }

  // 上传文件
  return apiClient.uploadFile('/upload/upload', file);
}

/**
 * 删除已上传的图片
 */
export async function deleteImage(
  filename: string
): Promise<ApiResponse<{ code: number; message: string }>> {
  return apiClient.delete(`/upload/upload/${filename}`);
}

/**
 * 批量上传图片
 */
export async function uploadMultipleImages(
  files: File[]
): Promise<ApiResponse<ImageUploadResponse>[]> {
  const uploadPromises = files.map((file) => uploadImage(file));
  return Promise.all(uploadPromises);
}

/**
 * 从 URL 预加载图片（用于验证图片 URL 是否有效）
 */
export async function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Upload Service 导出
 */
export const uploadService = {
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  preloadImage,
};

export default uploadService;
