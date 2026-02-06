/**
 * FB Tag API utilities for editing member/interaction tags
 *
 * POST /api/v1/admin/meta_page/tags - 新增標籤 (需要 type: 1=會員標籤, 2=互動標籤)
 * DELETE /api/v1/admin/meta_page/tags?customer_id=xx&tag=xxxx - 刪除標籤 (不需 type)
 */

const getFbApiBaseUrl = (): string =>
  ((import.meta as any).env?.VITE_FB_API_URL?.trim() || 'https://api-youth-tycg.star-bit.io').replace(/\/+$/, '');

const getJwtToken = (): string | null => localStorage.getItem('jwt_token');

interface FbTagUpdateResult {
  success: boolean;
  error?: string;
  addedTags?: string[];
  deletedTags?: string[];
}

/**
 * 新增標籤 (POST)
 * @param customerId - FB customer_id
 * @param tags - 標籤陣列
 * @param type - 1=會員標籤, 2=互動標籤
 */
export async function addFbTags(
  customerId: string | number,
  tags: string[],
  type: 1 | 2
): Promise<{ success: boolean; error?: string }> {
  const jwtToken = getJwtToken();
  if (!jwtToken) {
    return { success: false, error: '請重新登入' };
  }

  if (tags.length === 0) {
    return { success: true };
  }

  try {
    const response = await fetch(`${getFbApiBaseUrl()}/api/v1/admin/meta_page/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: Number(customerId),
        type,
        tags
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || errorData.message || '新增標籤失敗' };
    }

    return { success: true };
  } catch (error) {
    console.error('addFbTags error:', error);
    return { success: false, error: error instanceof Error ? error.message : '網路錯誤' };
  }
}

/**
 * 刪除單一標籤 (DELETE) - 不需要 type 參數
 * @param customerId - FB customer_id
 * @param tag - 標籤名稱
 */
export async function deleteFbTag(
  customerId: string | number,
  tag: string
): Promise<{ success: boolean; error?: string }> {
  const jwtToken = getJwtToken();
  if (!jwtToken) {
    return { success: false, error: '請重新登入' };
  }

  try {
    const url = `${getFbApiBaseUrl()}/api/v1/admin/meta_page/tags?customer_id=${customerId}&tag=${encodeURIComponent(tag)}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || errorData.message || '刪除標籤失敗' };
    }

    return { success: true };
  } catch (error) {
    console.error('deleteFbTag error:', error);
    return { success: false, error: error instanceof Error ? error.message : '網路錯誤' };
  }
}

/**
 * 比對初始與最終標籤，執行新增/刪除操作
 * @param customerId - FB customer_id
 * @param initialTags - 初始標籤陣列
 * @param finalTags - 最終標籤陣列
 * @param type - 1=會員標籤, 2=互動標籤 (僅新增時使用)
 */
async function updateFbTagsByType(
  customerId: string | number,
  initialTags: string[],
  finalTags: string[],
  type: 1 | 2
): Promise<FbTagUpdateResult> {
  const tagsToAdd = finalTags.filter(tag => !initialTags.includes(tag));
  const tagsToDelete = initialTags.filter(tag => !finalTags.includes(tag));

  const deletedTags: string[] = [];
  const failedDeletes: string[] = [];

  // 刪除標籤 (逐一刪除，不需 type)
  for (const tag of tagsToDelete) {
    const result = await deleteFbTag(customerId, tag);
    if (result.success) {
      deletedTags.push(tag);
    } else {
      console.warn(`刪除標籤失敗: ${tag}`, result.error);
      failedDeletes.push(tag);
    }
  }

  // 新增標籤 (一次 POST，需要 type)
  if (tagsToAdd.length > 0) {
    const addResult = await addFbTags(customerId, tagsToAdd, type);
    if (!addResult.success) {
      return {
        success: false,
        error: addResult.error,
        deletedTags
      };
    }
  }

  return {
    success: true,
    addedTags: tagsToAdd,
    deletedTags
  };
}

/**
 * 更新 FB 會員的會員標籤和互動標籤
 * @param customerId - FB customer_id (fb_customer_id)
 * @param initialMemberTags - 初始會員標籤
 * @param finalMemberTags - 最終會員標籤
 * @param initialInteractionTags - 初始互動標籤
 * @param finalInteractionTags - 最終互動標籤
 */
export async function updateFbTags(
  customerId: string | number,
  initialMemberTags: string[],
  finalMemberTags: string[],
  initialInteractionTags: string[],
  finalInteractionTags: string[]
): Promise<FbTagUpdateResult> {
  if (!customerId) {
    return { success: false, error: '找不到 Facebook 會員 ID' };
  }

  // 更新會員標籤 (type=1)
  const memberResult = await updateFbTagsByType(
    customerId,
    initialMemberTags,
    finalMemberTags,
    1
  );

  if (!memberResult.success) {
    return memberResult;
  }

  // 更新互動標籤 (type=2)
  const interactionResult = await updateFbTagsByType(
    customerId,
    initialInteractionTags,
    finalInteractionTags,
    2
  );

  return {
    success: interactionResult.success,
    error: interactionResult.error,
    addedTags: [...(memberResult.addedTags || []), ...(interactionResult.addedTags || [])],
    deletedTags: [...(memberResult.deletedTags || []), ...(interactionResult.deletedTags || [])]
  };
}
