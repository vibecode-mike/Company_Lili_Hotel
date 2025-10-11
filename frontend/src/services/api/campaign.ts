/**
 * 群發訊息 API
 */
import { apiClient } from './client';
import type { CampaignCreate, CampaignListItem } from '@/types/campaign';

/**
 * 創建群發訊息
 */
export const createCampaign = async (data: CampaignCreate): Promise<any> => {
  return apiClient.post('/campaigns', data);
};

/**
 * 獲取群發訊息列表
 */
export const getCampaigns = async (): Promise<CampaignListItem[]> => {
  return apiClient.get('/campaigns');
};

/**
 * 獲取單個群發訊息詳情
 */
export const getCampaignById = async (id: number) => {
  return apiClient.get(`/campaigns/${id}`);
};

/**
 * 更新群發訊息
 */
export const updateCampaign = async (id: number, data: Partial<CampaignCreate>) => {
  return apiClient.put(`/campaigns/${id}`, data);
};

/**
 * 刪除群發訊息
 */
export const deleteCampaign = async (id: number) => {
  return apiClient.delete(`/campaigns/${id}`);
};
