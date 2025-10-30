/**
 * Member Service
 * 會員管理相關的 API 服務
 */

import { apiClient } from './apiClient';
import { ApiResponse } from '../types/campaign';

/**
 * 標籤信息
 */
export interface TagInfo {
  id: number;
  name: string;
  type: string;
}

/**
 * 會員列表項
 */
export interface MemberListItem {
  id: number;
  line_uid: string | null;
  line_display_name: string | null;
  line_picture_url: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  tags: TagInfo[];
  created_at: string;
  last_interaction_at: string | null;
}

/**
 * 會員列表響應
 */
export interface MemberListResponse {
  success: boolean;
  data: {
    items: MemberListItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

/**
 * 會員搜索參數
 */
export interface MemberSearchParams {
  search?: string;
  tags?: string;
  source?: string;
  sort_by?: string;
  order?: string;
  page?: number;
  page_size?: number;
}

/**
 * 獲取會員列表
 */
export async function getMembers(
  params?: MemberSearchParams
): Promise<ApiResponse<MemberListResponse>> {
  return apiClient.get<MemberListResponse>('/members', params);
}

/**
 * 獲取單個會員詳情
 */
export async function getMemberById(
  id: number
): Promise<ApiResponse<any>> {
  return apiClient.get<any>(`/members/${id}`);
}

/**
 * 獲取會員數量
 */
export async function getMemberCount(
  targetAudience: string = 'all',
  tagIds?: string
): Promise<ApiResponse<{ count: number }>> {
  return apiClient.get<{ count: number }>('/members/count', {
    target_audience: targetAudience,
    tag_ids: tagIds,
  });
}
