/**
 * Campaign Service
 * 活动推播相关的 API 服务
 */

import { apiClient } from './apiClient';
import {
  CreateCampaignRequest,
  CampaignResponse,
  CampaignListResponse,
  CampaignListParams,
  AudienceEstimateRequest,
  AudienceEstimateResponse,
  ApiResponse,
} from '../types/campaign';

/**
 * 获取活动列表
 */
export async function getCampaigns(
  params?: CampaignListParams
): Promise<ApiResponse<CampaignListResponse>> {
  return apiClient.get<CampaignListResponse>('/campaigns', params);
}

/**
 * 获取单个活动详情
 */
export async function getCampaignById(
  id: number
): Promise<ApiResponse<CampaignResponse>> {
  return apiClient.get<CampaignResponse>(`/campaigns/${id}`);
}

/**
 * 创建活动
 */
export async function createCampaign(
  data: CreateCampaignRequest
): Promise<ApiResponse<CampaignResponse>> {
  return apiClient.post<CampaignResponse>('/campaigns', data);
}

/**
 * 更新活动
 */
export async function updateCampaign(
  id: number,
  data: Partial<CreateCampaignRequest>
): Promise<ApiResponse<CampaignResponse>> {
  return apiClient.put<CampaignResponse>(`/campaigns/${id}`, data);
}

/**
 * 删除活动
 */
export async function deleteCampaign(
  id: number
): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/campaigns/${id}`);
}

/**
 * 估算受众数量
 */
export async function estimateAudience(
  data: AudienceEstimateRequest
): Promise<ApiResponse<AudienceEstimateResponse>> {
  return apiClient.post<AudienceEstimateResponse>('/campaigns/estimate-recipients', data);
}

/**
 * 发送测试消息
 * 注意：这是预留功能，后端未实现
 */
export async function sendTestMessage(
  id: number,
  userIds: string[]
): Promise<ApiResponse<{ message: string }>> {
  // 这是预留接口，显示"开发中"提示
  return Promise.resolve({
    data: { message: '此功能正在開發中' },
    status: 200,
  });
}

/**
 * 立即发送活动
 */
export async function sendCampaignNow(
  id: number
): Promise<ApiResponse<CampaignResponse>> {
  return apiClient.post<CampaignResponse>(`/campaigns/${id}/send`);
}

/**
 * 取消已排程的活动
 */
export async function cancelScheduledCampaign(
  id: number
): Promise<ApiResponse<CampaignResponse>> {
  return apiClient.post<CampaignResponse>(`/campaigns/${id}/cancel`);
}

/**
 * 复制活动
 */
export async function duplicateCampaign(
  id: number
): Promise<ApiResponse<CampaignResponse>> {
  return apiClient.post<CampaignResponse>(`/campaigns/${id}/duplicate`);
}

/**
 * Campaign Service 导出
 */
export const campaignService = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  estimateAudience,
  sendTestMessage,
  sendCampaignNow,
  cancelScheduledCampaign,
  duplicateCampaign,
};

export default campaignService;
