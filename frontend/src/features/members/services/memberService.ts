/**
 * 會員服務 API
 */
import { apiClient } from '@/services/api/client';
import type {
  MemberListItem,
  MemberDetail,
  MemberSearchParams,
  MemberCreate,
  MemberUpdate,
} from '@/types/member';
import type { ApiResponse, PageResponse } from '@/types/common';

export const memberService = {
  /**
   * 獲取會員列表
   */
  async getMembers(
    params: MemberSearchParams
  ): Promise<ApiResponse<PageResponse<MemberListItem>>> {
    return apiClient.get('/members', { params });
  },

  /**
   * 獲取會員詳情
   */
  async getMemberById(id: number): Promise<ApiResponse<MemberDetail>> {
    return apiClient.get(`/members/${id}`);
  },

  /**
   * 創建會員
   */
  async createMember(data: MemberCreate): Promise<ApiResponse<MemberDetail>> {
    return apiClient.post('/members', data);
  },

  /**
   * 更新會員
   */
  async updateMember(
    id: number,
    data: MemberUpdate
  ): Promise<ApiResponse<MemberDetail>> {
    return apiClient.put(`/members/${id}`, data);
  },

  /**
   * 刪除會員
   */
  async deleteMember(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/members/${id}`);
  },

  /**
   * 添加標籤
   */
  async addTags(id: number, tag_ids: number[]): Promise<ApiResponse<void>> {
    return apiClient.post(`/members/${id}/tags`, { tag_ids });
  },

  /**
   * 移除標籤
   */
  async removeTag(id: number, tagId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/members/${id}/tags/${tagId}`);
  },

  /**
   * 更新備註
   */
  async updateNotes(id: number, notes: string): Promise<ApiResponse<void>> {
    return apiClient.put(`/members/${id}/notes`, { notes });
  },
};
