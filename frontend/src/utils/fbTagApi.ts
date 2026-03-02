import { getJwtToken } from './token';

const fbApiBaseUrl = (
  import.meta.env.VITE_FB_API_URL?.trim() || 'https://api-youth-tycg.star-bit.io'
).replace(/\/+$/, '');

interface UpdateFbTagsResult {
  success: boolean;
  error?: string;
}

/**
 * 更新 Facebook 會員的標籤（會員標籤 + 互動標籤）
 */
export async function updateFbTags(
  fbCustomerId: string | number,
  _oldMemberTags: string[],
  newMemberTags: string[],
  _oldInteractionTags: string[],
  newInteractionTags: string[],
): Promise<UpdateFbTagsResult> {
  const jwtToken = getJwtToken();
  if (!jwtToken) {
    return { success: false, error: '請先完成 Facebook 授權' };
  }

  try {
    const tags = [
      ...newMemberTags.map((tag) => ({ customer_id: Number(fbCustomerId), tag, tag_type: 1 as const })),
      ...newInteractionTags.map((tag) => ({ customer_id: Number(fbCustomerId), tag, tag_type: 2 as const })),
    ];

    const response = await fetch(
      `${fbApiBaseUrl}/api/v1/admin/meta_page/customer/${fbCustomerId}/tags`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ tags }),
      },
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return { success: false, error: payload?.msg || `FB API 回傳 ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: '無法連線到 FB API' };
  }
}
