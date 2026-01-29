/**
 * API 相關類型定義
 */

/**
 * 後端標籤物件
 * 支援兩種格式:
 * 1. 標準格式: { name, type: 'member' | 'interaction' }
 * 2. Meta 格式: { tag, tag_type: 1=會員標籤 | 2=互動標籤 }
 */
export interface BackendTag {
  id?: number;
  name?: string;
  type?: 'member' | 'interaction';
  // Meta API 格式
  tag?: string;
  tag_type?: 1 | 2;  // 1=會員標籤, 2=互動標籤
  customer_id?: number;
}

/**
 * 後端會員物件（從 API 返回的原始格式）
 * 支援 /api/v1/members/{id} 和 /api/v1/admin/meta_user/profile 兩種 API
 */
export interface BackendMember {
  id: string | number;
  username?: string;
  real_name?: string;
  tags?: BackendTag[];
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
  created_at?: string;
  last_chat_time?: string;
  last_interaction_at?: string;
  // LINE 渠道
  line_uid?: string;
  line_display_name?: string;
  line_avatar?: string;
  channel_id?: string;
  // Facebook 渠道
  fb_customer_id?: string | number;
  fb_customer_name?: string;
  fb_avatar?: string;
  // Webchat 渠道
  webchat_uid?: string;
  webchat_name?: string;
  webchat_avatar?: string;
  // 其他
  join_source?: string;
  id_number?: string;
  residence?: string;
  passport_number?: string;
  internal_note?: string;
  name?: string;
  gpt_enabled?: boolean;
  // Meta API 額外欄位
  channel?: {
    customer_id: number;
    channel: string;
    channel_name: string;
    channel_avatar?: string;
    source_name?: string;
  };
}

/**
 * 後端關鍵字物件
 */
export interface BackendKeyword {
  id?: number;  // 關鍵字 ID，用於激活重複關鍵字
  keyword?: string;
  name?: string;
  is_duplicate?: boolean;  // 是否為重複關鍵字
}

/**
 * 後端回應訊息物件
 */
export interface BackendReplyMessage {
  id?: number;  // FB API 的 text id（用於編輯時區分編輯 vs 新增）
  basic_id?: number;  // FB API 的父自動回應 ID
  content?: string;
  count?: number;  // FB API 的觸發計數
  sequence_order?: number;
}

/**
 * 後端自動回應物件
 */
export interface BackendAutoReply {
  id: number;
  keywords: BackendKeyword[];
  reply_messages: BackendReplyMessage[];
  is_enabled: boolean;
}

/**
 * Flex Message Bubble 類型
 */
export interface FlexBubble {
  type: 'bubble';
  hero?: any;
  body?: any;
  footer?: any;
  styles?: any;
  [key: string]: any;
}

/**
 * Flex Message Carousel 類型
 */
export interface FlexCarousel {
  type: 'carousel';
  contents: FlexBubble[];
}

/**
 * Flex Message 類型（可以是單一 bubble 或 carousel）
 */
export type FlexMessage = FlexBubble | FlexCarousel;

/**
 * 後端訊息物件
 */
export interface BackendMessage {
  id: number;
  message_content: string;
  message_title?: string;
  notification_message?: string;
  target_type: string;
  target_filter?: {
    include?: string[];
    exclude?: string[];
  };
  schedule_type: string;
  scheduled_datetime_utc?: string;
  scheduled_at?: string;
  send_status: string;
  send_count?: number;
  send_time?: string;
  open_count?: number;
  click_count?: number;
  flex_message_json?: FlexMessage;
  interaction_tags?: string[];
  interactionTags?: string[];
  tags?: string[];
  platform?: string; // 注意：這裡保持 string 以兼容後端，在 Context 層進行類型守衛
  channel_id?: string; // 渠道ID（LINE channel_id 或 FB page_id）
  channel_name?: string; // 渠道名稱（頻道名/粉專名）
  thumbnail?: string;
  template?: {
    name?: string;
  };
  created_by?: {
    id: number;
    username: string;
    full_name?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * API 錯誤響應
 */
export interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
}

/**
 * API 成功響應基礎類型
 */
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * FB 自動回應關鍵字物件（從外部 FB API 返回）
 */
export interface FbAutoReplyKeyword {
  id: number;
  basic_id?: number;
  name: string;
  enabled: boolean;
}

/**
 * FB 自動回應訊息物件（從外部 FB API 返回）
 */
export interface FbAutoReplyText {
  id: number;
  basic_id?: number;
  text: string;
  count: number;
  enabled: boolean;
}

/**
 * FB 自動回應物件（從外部 FB API 返回）
 */
export interface FbAutoReply {
  id: number;
  channel: string;
  channel_name: string;      // 粉專名稱
  page_id: string;           // 粉專 ID
  response_type: number;     // 2=keyword, 3=follow
  trigger_time: number;
  create_time: number;
  enabled: boolean;
  count: number;
  text: FbAutoReplyText[];   // 訊息陣列
  keywords: FbAutoReplyKeyword[];
}

/**
 * FB 自動回應建立 Payload（用於 POST /api/v1/admin/meta_page/message/auto_template）
 */
export interface FbAutoReplyCreatePayload {
  firm_id: number;
  channel: 'FB';
  page_id: string;
  response_type: 2 | 3;      // 2=keyword, 3=follow
  trigger_time: number;
  tags: string[];            // 關鍵字陣列
  text: string[];            // 回覆訊息陣列
}
