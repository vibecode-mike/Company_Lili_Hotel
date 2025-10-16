import { apiClient } from './client';

interface TagParams {
  type?: 'member' | 'interaction';
  search?: string;
  page?: number;
  page_size?: number;
}

interface Tag {
  id: number;
  name: string;
  type: string;
  member_count?: number;
  trigger_count?: number;
  created_at: string;
}

interface TagResponse {
  code: number;
  message: string;
  data: {
    items: Tag[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

/**
 * 獲取標籤列表
 */
export const fetchTags = async (params: TagParams = {}): Promise<TagResponse> => {
  const queryParams = new URLSearchParams();

  if (params.type) {
    queryParams.append('type', params.type);
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }

  const response = await apiClient.get(`/tags?${queryParams.toString()}`);
  return response.data;
};
