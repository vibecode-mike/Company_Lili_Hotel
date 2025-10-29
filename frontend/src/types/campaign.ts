/**
 * Campaign Types - Frontend & Backend Mapping
 * 前端与后端的类型定义和映射
 */

// ===== 枚举类型 Enums =====

/**
 * 模板类型 Template Types
 * 前端 → 后端映射
 */
export type TemplateType = 'image_click' | 'image_card' | 'text_button' | 'text';

export const TemplateTypeDisplay: Record<TemplateType, string> = {
  image_click: '圖片點擊型',
  image_card: '圖卡按鈕型',
  text_button: '文字按鈕確認型',
  text: '純文字',
};

/**
 * 活动状态 Campaign Status
 * 前端 → 后端映射
 */
export type CampaignStatus = 'scheduled' | 'draft' | 'sent' | 'failed';

export const CampaignStatusDisplay: Record<CampaignStatus, string> = {
  scheduled: '已排程',
  draft: '草稿',
  sent: '已發送',
  failed: '失敗',
};

/**
 * 排程类型 Schedule Type
 */
export type ScheduleType = 'immediate' | 'scheduled';

/**
 * 目标类型 Target Type
 */
export type TargetType = 'all' | 'tags' | 'filtered';

/**
 * 按钮动作类型 Button Action Type
 */
export type ButtonActionType = 'url' | 'message' | 'postback' | 'image';

// ===== 前端类型 Frontend Types =====

/**
 * 按钮配置 Button Configuration
 */
export interface ButtonConfig {
  text: string;
  action: ButtonActionType;
  value?: string;
  triggerImageUrl?: string;
  tag?: string;
}

/**
 * 卡片配置 Card Configuration
 */
export interface CardConfig {
  imageUrl: string;
  title?: string;
  description?: string;
  messageText?: string; // 用於文字按鈕確認型
  button1?: ButtonConfig;
  button2?: ButtonConfig;
}

/**
 * 消息创建表单数据 Message Creation Form Data
 */
export interface MessageCreationForm {
  templateType: TemplateType;
  title: string;
  notificationMsg: string;
  previewMsg: string;
  scheduleType: ScheduleType;
  scheduledTime?: Date;
  targetType: TargetType;
  targetCondition: 'include' | 'exclude';
  targetTags?: number[];
  cards: CardConfig[];
}

/**
 * 消息列表项 Message List Item
 */
export interface Message {
  id: number;
  title: string;
  tags: string[];
  platform: string;
  status: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  sendTime: string;
}

// ===== 后端 API 类型 Backend API Types =====

/**
 * 按钮配置 API Button Configuration
 */
export interface ApiButtonConfig {
  text: string;
  type: ButtonActionType;
  url?: string;
  data?: string;
}

/**
 * 活动卡片 API Campaign Card
 */
export interface ApiCampaignCard {
  image_url: string;
  title?: string;
  text?: string;
  actions?: ApiButtonConfig[];
}

/**
 * 轮播项目创建 Carousel Item Create
 */
export interface CarouselItemCreate {
  image_url?: string;
  title?: string;
  description?: string;
  price?: number;
  action_url?: string;
  interaction_tag?: string;
  action_button_enabled?: boolean;
  action_button_text?: string;
  action_button_interaction_type?: string;
  action_button_url?: string;
  action_button_trigger_message?: string;
  action_button_trigger_image_url?: string;
  action_button2_enabled?: boolean;
  action_button2_text?: string;
  action_button2_interaction_type?: string;
  action_button2_url?: string;
  action_button2_trigger_message?: string;
  action_button2_trigger_image_url?: string;
  image_aspect_ratio?: string;
  image_click_action_type?: string;
  image_click_action_value?: string;
  sort_order?: number;
}

/**
 * 创建活动请求 Create Campaign Request
 * 匹配后端 CampaignCreate schema
 */
export interface CreateCampaignRequest {
  // 基本信息
  title: string;
  template_type: TemplateType;
  notification_text: string;
  preview_text: string;

  // 发送类型
  schedule_type: 'immediate' | 'scheduled' | 'draft';
  scheduled_at?: string; // ISO 8601 format

  // 目标受众
  target_audience: 'all' | 'filtered';
  target_condition?: 'include' | 'exclude';
  target_tags?: Array<string | number>;

  // 互动相关
  interaction_type?: string;
  interaction_tags?: string[];
  url?: string;
  trigger_message?: string;
  trigger_image_url?: string;

  // 轮播项目
  carousel_items?: CarouselItemCreate[];

  // 单图模式（兼容）
  image_url?: string;
}

/**
 * 活动响应 Campaign Response
 */
export interface CampaignResponse {
  id: number;
  name: string;
  template_type: TemplateType;
  notification_text: string;
  preview_image_url?: string;
  scheduled_at?: string;
  sent_at?: string;
  target_type: TargetType;
  tag_ids?: number[];
  cards: ApiCampaignCard[];
  status: CampaignStatus;
  recipient_count?: number;
  sent_count?: number;
  opened_count?: number;
  clicked_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 活动列表查询参数 Campaign List Query Params
 */
export interface CampaignListParams {
  status?: CampaignStatus;
  template_type?: TemplateType;
  tag_id?: number;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * 活动列表响应 Campaign List Response
 */
export interface CampaignListResponse {
  items: CampaignResponse[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/**
 * 受众估算请求 Audience Estimate Request
 */
export interface AudienceEstimateRequest {
  type: 'all' | 'filtered';
  condition?: 'include' | 'exclude';
  tags?: number[];
}

/**
 * 受众估算响应 Audience Estimate Response
 */
export interface AudienceEstimateResponse {
  count: number;
}

/**
 * 图片上传响应 Image Upload Response
 */
export interface ImageUploadResponse {
  code: number;
  message: string;
  data: {
    url: string;
    filename: string;
    size: number;
  };
}

/**
 * API 错误响应 API Error Response
 */
export interface ApiErrorResponse {
  detail: string | { loc: string[]; msg: string; type: string }[];
}

/**
 * API 通用响应包装 Generic API Response Wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiErrorResponse;
  status: number;
}
