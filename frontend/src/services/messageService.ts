/**
 * 群發訊息 API Service
 * 提供所有群發訊息相關的 API 調用方法
 */
import api from './api';
import type {
  QuotaStatusRequest,
  QuotaStatusResponse,
  MessageCreateRequest,
  MessageUpdateRequest,
  MessageDetail,
  MessageSendRequest,
  MessageSendResponse,
} from '../types/message';

/**
 * 獲取配額狀態（真實數據）
 *
 * @param request 配額查詢請求
 * @param lineChannelId LINE 頻道 ID（可選）
 * @returns 配額狀態響應
 */
export async function getQuota(
  request: QuotaStatusRequest,
  lineChannelId?: string
): Promise<QuotaStatusResponse> {
  const params = lineChannelId ? { line_channel_id: lineChannelId } : {};

  const response = await api.post<QuotaStatusResponse>(
    '/messages/quota',
    request,
    { params }
  );

  return response.data;
}

/**
 * 創建群發訊息
 *
 * @param data 訊息創建請求
 * @returns 創建的訊息詳情
 */
export async function createMessage(
  data: MessageCreateRequest
): Promise<MessageDetail> {
  const response = await api.post<MessageDetail>('/messages', data);
  return response.data;
}

/**
 * 更新群發訊息（草稿編輯）
 *
 * @param messageId 訊息 ID
 * @param data 訊息更新請求
 * @returns 更新後的訊息詳情
 */
export async function updateMessage(
  messageId: number,
  data: MessageUpdateRequest
): Promise<MessageDetail> {
  const response = await api.put<MessageDetail>(`/messages/${messageId}`, data);
  return response.data;
}

/**
 * 獲取訊息詳情
 *
 * @param messageId 訊息 ID
 * @returns 訊息詳情
 */
export async function getMessage(messageId: number): Promise<MessageDetail> {
  const response = await api.get<MessageDetail>(`/messages/${messageId}`);
  return response.data;
}

/**
 * 發送群發訊息
 *
 * @param messageId 訊息 ID
 * @param request 發送請求（可選）
 * @returns 發送結果
 */
export async function sendMessage(
  messageId: number,
  request?: MessageSendRequest
): Promise<MessageSendResponse> {
  const response = await api.post<MessageSendResponse>(
    `/messages/${messageId}/send`,
    request || {}
  );
  return response.data;
}

// ========== 導出所有方法 ==========

const messageService = {
  getQuota,
  createMessage,
  updateMessage,
  getMessage,
  sendMessage,
};

export default messageService;
