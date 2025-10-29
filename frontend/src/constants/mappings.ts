/**
 * Field Mappings - 前端与后端字段映射
 * 
 * 这个文件包含所有前端中文字段与后端英文字段的双向映射
 */

import { 
  TemplateType, 
  CampaignStatus, 
  ScheduleType, 
  TargetType,
  ButtonActionType 
} from '../types/campaign';

// ===== 模板类型映射 Template Type Mapping =====

/**
 * 前端显示名称 → 后端 API 值
 */
export const TEMPLATE_TYPE_TO_API: Record<string, TemplateType> = {
  '圖片點擊型': 'image_click',
  '圖卡按鈕型': 'image_card',
  '文字按鈕確認型': 'text_button',
  '純文字': 'text',
  image_click: 'image_click',
  image_card: 'image_card',
  text_button: 'text_button',
  text: 'text',
};

/**
 * 后端 API 值 → 前端显示名称
 */
export const TEMPLATE_TYPE_FROM_API: Record<TemplateType, string> = {
  image_click: '圖片點擊型',
  image_card: '圖卡按鈕型',
  text_button: '文字按鈕確認型',
  text: '純文字',
};

// ===== 状态映射 Status Mapping =====

/**
 * 前端显示名称 → 后端 API 值
 */
export const STATUS_TO_API: Record<string, CampaignStatus> = {
  '已排程': 'scheduled',
  '草稿': 'draft',
  '已發送': 'sent',
  '失敗': 'failed',
};

/**
 * 后端 API 值 → 前端显示名称
 */
export const STATUS_FROM_API: Record<CampaignStatus, string> = {
  scheduled: '已排程',
  draft: '草稿',
  sent: '已發送',
  failed: '失敗',
};

/**
 * 状态对应的颜色类
 */
export const STATUS_COLOR_CLASS: Record<CampaignStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

// ===== 排程类型映射 Schedule Type Mapping =====

/**
 * 前端显示名称 → 后端 API 值
 */
export const SCHEDULE_TYPE_TO_API: Record<string, ScheduleType> = {
  '立即發送': 'immediate',
  '排程發送': 'scheduled',
};

/**
 * 后端 API 值 → 前端显示名称
 */
export const SCHEDULE_TYPE_FROM_API: Record<ScheduleType, string> = {
  immediate: '立即發送',
  scheduled: '排程發送',
};

// ===== 目标类型映射 Target Type Mapping =====

/**
 * 前端显示名称 → 后端 API 值
 */
export const TARGET_TYPE_TO_API: Record<string, TargetType> = {
  '全部會員': 'all',
  '標籤篩選': 'tags',
};

/**
 * 后端 API 值 → 前端显示名称
 */
export const TARGET_TYPE_FROM_API: Record<TargetType, string> = {
  all: '全部會員',
  tags: '標籤篩選',
};

// ===== 按钮动作类型映射 Button Action Type Mapping =====

/**
 * 前端显示名称 → 后端 API 值
 */
export const BUTTON_ACTION_TO_API: Record<string, ButtonActionType> = {
  '開啟網址': 'url',
  '發送訊息': 'message',
  '回傳資料': 'postback',
};

/**
 * 后端 API 值 → 前端显示名称
 */
export const BUTTON_ACTION_FROM_API: Record<ButtonActionType, string> = {
  url: '開啟網址',
  message: '發送訊息',
  postback: '回傳資料',
};

// ===== 字段名称映射 Field Name Mapping =====

/**
 * 前端表单字段 → 后端 API 字段
 */
export const FIELD_TO_API = {
  // 基本信息
  title: 'name',
  notificationMsg: 'notification_text',
  previewMsg: 'preview_image_url',
  templateType: 'template_type',
  
  // 排程信息
  scheduleType: 'scheduled_at',
  scheduledTime: 'scheduled_at',
  
  // 目标受众
  targetType: 'target_type',
  targetTags: 'tag_ids',
  
  // 卡片信息
  cards: 'cards',
  imageUrl: 'image_url',
  description: 'text',
  
  // 按钮信息
  button1: 'actions[0]',
  button2: 'actions[1]',
  action: 'type',
  value: 'url', // or 'data' depending on type
  
  // 统计信息
  sentCount: 'sent_count',
  openCount: 'opened_count',
  clickCount: 'clicked_count',
  sendTime: 'sent_at',
} as const;

/**
 * 后端 API 字段 → 前端显示字段
 */
export const FIELD_FROM_API = {
  // 基本信息
  name: 'title',
  notification_text: 'notificationMsg',
  preview_image_url: 'previewMsg',
  template_type: 'templateType',
  
  // 排程信息
  scheduled_at: 'scheduledTime',
  
  // 目标受众
  target_type: 'targetType',
  tag_ids: 'targetTags',
  
  // 卡片信息
  cards: 'cards',
  image_url: 'imageUrl',
  text: 'description',
  
  // 按钮信息
  actions: 'buttons',
  type: 'action',
  url: 'value',
  data: 'value',
  
  // 统计信息
  sent_count: 'sentCount',
  opened_count: 'openCount',
  clicked_count: 'clickCount',
  sent_at: 'sendTime',
  
  // 其他
  recipient_count: 'recipientCount',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
} as const;

// ===== 平台显示 Platform Display =====

/**
 * 平台显示名称
 */
export const PLATFORM_DISPLAY: Record<string, string> = {
  line: 'LINE',
  all: '全平台',
};

// ===== 排序字段映射 Sort Field Mapping =====

/**
 * 前端排序字段 → 后端 API 排序字段
 */
export const SORT_FIELD_TO_API: Record<string, string> = {
  sendTime: 'sent_at',
  createdTime: 'created_at',
  updatedTime: 'updated_at',
  sentCount: 'sent_count',
  openCount: 'opened_count',
  clickCount: 'clicked_count',
  title: 'name',
};

/**
 * 后端 API 排序字段 → 前端显示字段
 */
export const SORT_FIELD_FROM_API: Record<string, string> = {
  sent_at: 'sendTime',
  created_at: 'createdTime',
  updated_at: 'updatedTime',
  sent_count: 'sentCount',
  opened_count: 'openCount',
  clicked_count: 'clickCount',
  name: 'title',
};
