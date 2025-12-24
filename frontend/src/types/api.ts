/**
 * API 相關類型定義
 */

/**
 * 後端標籤物件
 */
export interface BackendTag {
  id?: number;
  name: string;
  type: 'member' | 'interaction';
}

/**
 * 後端會員物件（從 API 返回的原始格式）
 */
export interface BackendMember {
  id: string;
  username: string;
  real_name: string;
  tags?: BackendTag[];
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
  created_at: string;
  last_chat_time?: string;
  last_interaction_at?: string;
  line_uid?: string;
  line_display_name?: string;
  line_avatar?: string;
  channel_id?: string;
  join_source?: string;
  id_number?: string;
  residence?: string;
  passport_number?: string;
  internal_note?: string;
  name?: string;
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
  content?: string;
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
  thumbnail?: string;
  template?: {
    name?: string;
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
