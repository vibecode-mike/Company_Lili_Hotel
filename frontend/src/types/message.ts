/**
 * 群發訊息相關 TypeScript 類型定義
 */

// ========== 配額相關 ==========

export interface QuotaStatusRequest {
  target_type: 'all_friends' | 'filtered';
  target_filter?: {
    include?: string[];
    exclude?: string[];
  };
}

export interface QuotaStatusResponse {
  estimated_send_count: number; // 預計發送人數
  available_quota: number; // 可用配額
  is_sufficient: boolean; // 配額是否充足
  quota_type: 'none' | 'limited'; // 配額類型
  monthly_limit: number | null; // 月度限額
  used: number; // 已使用配額
  quota_consumption: number; // 本次將消耗的配額
}

// ========== 訊息創建/更新 ==========

export interface MessageCreateRequest {
  // 模板相關
  template_id: number;
  flex_message_json: string; // Flex Message JSON 字串

  // 訊息內容
  message_content?: string; // 訊息內容摘要（用於列表顯示）
  thumbnail?: string; // 縮圖 URL
  notification_text?: string; // 推送通知文字

  // 發送對象
  target_type: 'all_friends' | 'filtered';
  target_filter?: {
    include?: string[];
    exclude?: string[];
  };

  // 排程設定
  schedule_type: 'immediate' | 'scheduled' | 'draft';
  scheduled_at?: string; // ISO 8601 格式 datetime
  scheduled_date?: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:MM:SS

  // 關聯活動（選填）
  campaign_id?: number;

  // 系統欄位
  estimated_send_count?: number;
  available_quota?: number;
}

export interface MessageUpdateRequest {
  template_id?: number;
  flex_message_json?: string;
  message_content?: string;
  thumbnail?: string;
  notification_text?: string;
  target_type?: 'all_friends' | 'filtered';
  target_filter?: {
    include?: string[];
    exclude?: string[];
  };
  schedule_type?: 'immediate' | 'scheduled' | 'draft';
  scheduled_at?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  failure_reason?: string;
}

// ========== 訊息發送 ==========

export interface MessageSendRequest {
  line_channel_id?: string;
}

export interface MessageSendResponse {
  message: string;
  sent_count: number;
  failed_count: number;
  errors?: string[];
}

// ========== 訊息詳情 ==========

export interface TemplateInfo {
  id: number;
  type: string;
  name: string | null;
}

export interface UserInfo {
  id: number;
  username: string;
  full_name: string | null;
}

export interface MessageDetail {
  id: number;
  template_id: number;
  template: TemplateInfo;

  // 內容
  message_content: string | null;
  thumbnail: string | null;
  notification_text?: string;

  // 發送對象
  target_type: string;
  target_filter: Record<string, any> | null;

  // 狀態
  send_status: '草稿' | '待發送' | '排程發送' | '已發送' | '發送失敗';

  // 統計
  send_count: number;
  open_count: number;
  click_count: number;
  open_rate: number | null;
  click_rate: number | null;

  // 時間
  scheduled_date: string | null;
  scheduled_time: string | null;
  send_time: string | null;
  created_at: string;

  // 其他
  interaction_tags: string[] | null;
  platform: string;
  trigger_condition: Record<string, any> | null;
  failure_reason: string | null;
  campaign_id: number | null;
  created_by: UserInfo | null;
  estimated_send_count: number;
  available_quota: number;
}

// ========== 前端表單數據 ==========

export interface MessageFormData {
  // 基本資訊
  title: string;
  notificationMsg: string;

  // Flex Message
  flexMessageJson: any; // LINE Flex Message 格式

  // 發送對象
  targetType: 'all' | 'include' | 'exclude';
  selectedFilterTags: Array<{ id: number; name: string }>;

  // 排程
  scheduleType: 'immediate' | 'scheduled' | 'draft';
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:MM

  // 輪播卡片數據（用於生成 Flex Message）
  cards: Array<{
    id: number;
    imageUrl: string;
    title: string;
    description: string;
    price: string;
    actionUrl: string;
    interactionTag: string;
    // ... 其他卡片欄位
  }>;

  // 縮圖
  thumbnail?: string;
}
