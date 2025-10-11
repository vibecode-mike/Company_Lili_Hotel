/**
 * 群發訊息相關類型定義
 */

export const CampaignStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  ARCHIVED: 'archived',
} as const;

export type CampaignStatus = typeof CampaignStatus[keyof typeof CampaignStatus];

export const TemplateType = {
  IMAGE_CLICK: 'image_click',
  TEXT: 'text',
  TEXT_BUTTON: 'text_button',
  IMAGE_CARD: 'image_card',
} as const;

export type TemplateType = typeof TemplateType[keyof typeof TemplateType];

export const TargetAudience = {
  ALL: 'all',
  FILTERED: 'filtered',
} as const;

export type TargetAudience = typeof TargetAudience[keyof typeof TargetAudience];

export const ScheduleType = {
  IMMEDIATE: 'immediate',
  SCHEDULED: 'scheduled',
} as const;

export type ScheduleType = typeof ScheduleType[keyof typeof ScheduleType];

export const InteractionType = {
  NONE: 'none',
  OPEN_URL: 'open_url',
  TRIGGER_MESSAGE: 'trigger_message',
  TRIGGER_IMAGE: 'trigger_image',
} as const;

export type InteractionType = typeof InteractionType[keyof typeof InteractionType];

export interface CampaignImage {
  url: string;
  filename: string;
  size?: number;
}

export interface CampaignCreate {
  // 圖片相關
  image?: CampaignImage;
  image_path?: string;
  interaction_type?: InteractionType;
  interaction_tag?: string;
  url?: string;
  trigger_message?: string;
  trigger_image?: string;
  trigger_image_path?: string;

  // 訊息相關
  title?: string;
  notification_text: string;
  preview_text: string;
  template_type: TemplateType;

  // 發送相關
  target_audience: TargetAudience;
  target_tags?: string[];
  schedule_type: ScheduleType;
  scheduled_at?: string;
}

export interface CampaignListItem {
  id: number;
  title?: string;
  image?: CampaignImage;
  tags: string[];
  platforms: string[];
  status: CampaignStatus;
  target_count?: number;
  open_count?: number;
  click_count?: number;
  sent_at?: string;
  scheduled_at?: string;
  created_at: string;
}

export interface CampaignDetail extends CampaignListItem {
  notification_text: string;
  preview_text: string;
  template_type: TemplateType;
  target_audience: TargetAudience;
  interaction_tag?: string;
  url?: string;
  trigger?: string;
}

export interface CampaignSearchParams {
  search?: string;
  status?: CampaignStatus;
  tags?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
