import { apiClient } from './client';

interface MemberCountParams {
  target_audience: 'all' | 'filtered';
  tag_ids?: string;
}

interface MemberCountResponse {
  code: number;
  message: string;
  data: {
    count: number;
  };
}

/**
 * 獲取符合條件的會員數量
 */
export const fetchMemberCount = async (params: MemberCountParams): Promise<MemberCountResponse> => {
  const queryParams = new URLSearchParams({
    target_audience: params.target_audience,
  });

  if (params.tag_ids) {
    queryParams.append('tag_ids', params.tag_ids);
  }

  const response = await apiClient.get(`/members/count?${queryParams.toString()}`);
  return response;
};
