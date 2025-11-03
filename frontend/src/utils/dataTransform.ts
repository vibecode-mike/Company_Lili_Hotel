/**
 * Data Transformation Utilities
 * 前端与后端数据转换工具
 */

import {
  MessageCreationForm,
  Message,
  CreateCampaignRequest,
  CampaignResponse,
  ApiCampaignCard,
  ApiButtonConfig,
  CardConfig,
  ButtonConfig,
  CampaignListParams,
} from '../types/campaign';

import {
  STATUS_FROM_API,
  STATUS_TO_API,
  TEMPLATE_TYPE_FROM_API,
  TEMPLATE_TYPE_TO_API,
  TARGET_TYPE_TO_API,
  PLATFORM_DISPLAY,
  SORT_FIELD_TO_API,
} from '../constants/mappings';

// ===== 前端 → 后端转换 Frontend to Backend =====

/**
 * 将按钮配置转换为 API 格式
 */
function transformButtonToApi(button: ButtonConfig): ApiButtonConfig {
  const apiButton: ApiButtonConfig = {
    text: button.text,
    type: button.action,
  };

  // 根据按钮动作类型设置相应的字段
  if (button.action === 'url') {
    apiButton.url = button.value;
  } else if (button.action === 'image') {
    apiButton.data = button.triggerImageUrl;
  } else {
    apiButton.data = button.value;
  }

  return apiButton;
}

/**
 * 将卡片配置转换为 API 格式
 */
function transformCardToApi(card: CardConfig): ApiCampaignCard {
  const apiCard: ApiCampaignCard = {
    image_url: card.imageUrl || '', // 文字按钮确认型可能没有图片
  };

  if (card.title) {
    apiCard.title = card.title;
  }

  // 优先使用 messageText（文字按钮确认型），否则使用 description
  if (card.messageText) {
    apiCard.text = card.messageText;
  } else if (card.description) {
    apiCard.text = card.description;
  }

  // 转换按钮（目前后端只支持一个按钮，优先使用 button1）
  const actions: ApiButtonConfig[] = [];
  if (card.button1) {
    actions.push(transformButtonToApi(card.button1));
  }
  // 预留 button2 支持（后端未来扩展）
  if (card.button2) {
    actions.push(transformButtonToApi(card.button2));
  }

  if (actions.length > 0) {
    apiCard.actions = actions;
  }

  return apiCard;
}

/**
 * 将表单数据转换为创建活动请求
 * 匹配后端 CampaignCreate schema
 */
export function transformFormToCreateRequest(
  form: MessageCreationForm,
  isDraft: boolean = false
): CreateCampaignRequest {
  const isFiltered = form.targetType === 'tags' || form.targetType === 'filtered';

  const collectedInteractionTags: string[] = [];

  // 基本信息
  const request: CreateCampaignRequest = {
    title: form.title,
    template_type: TEMPLATE_TYPE_TO_API[form.templateType] || form.templateType,
    notification_text: form.notificationMsg,
    preview_text: form.previewMsg || form.notificationMsg, // 预览文本，默认使用通知文本

    // 发送类型
    schedule_type: isDraft ? 'draft' : (form.scheduleType === 'scheduled' ? 'scheduled' : 'immediate'),

    // 目标受众
    target_audience: isFiltered ? 'filtered' : 'all',
    target_condition: form.targetCondition || 'include',
    target_tags: isFiltered ? form.targetTags?.map((id) => id.toString()) || [] : [],

    // 轮播项目（匹配后端 carousel_items 格式）
    carousel_items: form.cards.map((card, index) => {
      const apiCard: ApiCampaignCard & {
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
        interaction_tag?: string;
        image_aspect_ratio?: string;
        image_click_action_type?: string;
        image_click_action_value?: string;
        sort_order?: number;
      } = {
        image_url: card.imageUrl || '',
        title: card.title || '',
        text: card.messageText || card.description || '',
        image_aspect_ratio: '1:1',
        image_click_action_type: 'open_image',
        sort_order: index,
      };

      const button = card.button1;
      if (button && button.action !== undefined) {
        apiCard.action_button_enabled = true;
        apiCard.action_button_text = button.text || '查看詳情';
        apiCard.action_button_interaction_type = 'none';

        if (button.tag) {
          apiCard.interaction_tag = button.tag;
          collectedInteractionTags.push(button.tag);
        }

        switch (button.action) {
          case 'url':
            apiCard.action_button_interaction_type = 'open_url';
            apiCard.action_button_url = button.value || '';
            break;
          case 'message':
          case 'postback':
            apiCard.action_button_interaction_type = 'trigger_message';
            apiCard.action_button_trigger_message = button.value || '';
            break;
          case 'image':
            apiCard.action_button_interaction_type = 'trigger_image';
            apiCard.action_button_trigger_image_url = button.triggerImageUrl || '';
            break;
          default:
            apiCard.action_button_enabled = false;
            apiCard.action_button_text = undefined;
            break;
        }
      } else {
        apiCard.action_button_enabled = false;
      }

      // Button 2 處理
      const button2 = card.button2;
      if (button2 && button2.action !== undefined) {
        apiCard.action_button2_enabled = true;
        apiCard.action_button2_text = button2.text || '更多資訊';
        apiCard.action_button2_interaction_type = 'none';

        if (button2.tag) {
          // button2 也可以收集互動標籤
          collectedInteractionTags.push(button2.tag);
        }

        switch (button2.action) {
          case 'url':
            apiCard.action_button2_interaction_type = 'open_url';
            apiCard.action_button2_url = button2.value || '';
            break;
          case 'message':
          case 'postback':
            apiCard.action_button2_interaction_type = 'trigger_message';
            apiCard.action_button2_trigger_message = button2.value || '';
            break;
          case 'image':
            apiCard.action_button2_interaction_type = 'trigger_image';
            apiCard.action_button2_trigger_image_url = button2.triggerImageUrl || '';
            break;
          default:
            apiCard.action_button2_enabled = false;
            apiCard.action_button2_text = undefined;
            break;
        }
      } else {
        apiCard.action_button2_enabled = false;
      }

      return apiCard;
    }),

    // 互动标签（如果有）
    interaction_tags: [],
  };

  if (collectedInteractionTags.length > 0) {
    request.interaction_tags = Array.from(new Set(collectedInteractionTags));
  }

  // 排程时间（如果是排程发送）
  if (form.scheduleType === 'scheduled' && form.scheduledTime) {
    request.scheduled_at = form.scheduledTime.toISOString();
  }

  return request;
}

/**
 * 将查询参数转换为 API 格式
 */
export function transformListParamsToApi(params: {
  status?: string;
  templateType?: string;
  tagId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): CampaignListParams {
  const apiParams: CampaignListParams = {};

  // 状态转换
  if (params.status && params.status in STATUS_TO_API) {
    apiParams.status = STATUS_TO_API[params.status];
  }

  // 模板类型转换
  if (params.templateType && params.templateType in TEMPLATE_TYPE_TO_API) {
    apiParams.template_type = TEMPLATE_TYPE_TO_API[params.templateType];
  }

  // 其他参数直接传递
  if (params.tagId !== undefined) {
    apiParams.tag_id = params.tagId;
  }

  if (params.search) {
    apiParams.search = params.search;
  }

  if (params.page !== undefined) {
    apiParams.page = params.page;
  }

  if (params.pageSize !== undefined) {
    apiParams.page_size = params.pageSize;
  }

  // 排序字段转换
  if (params.sortBy && params.sortBy in SORT_FIELD_TO_API) {
    apiParams.sort_by = SORT_FIELD_TO_API[params.sortBy];
  }

  if (params.sortOrder) {
    apiParams.sort_order = params.sortOrder;
  }

  return apiParams;
}

// ===== 后端 → 前端转换 Backend to Frontend =====

/**
 * 将 API 按钮转换为前端格式
 */
function transformButtonFromApi(button: ApiButtonConfig): ButtonConfig {
  const config: ButtonConfig = {
    text: button.text,
    action: button.type,
  };

  if (button.type === 'url') {
    config.value = button.url || '';
  } else if (button.type === 'image') {
    config.triggerImageUrl = button.data || '';
  } else {
    config.value = button.data || '';
  }

  return config;
}

/**
 * 将 API 卡片转换为前端格式
 */
function transformCardFromApi(card: ApiCampaignCard): CardConfig {
  const frontendCard: CardConfig = {
    imageUrl: card.image_url,
    title: card.title,
    description: card.text,
  };

  // 转换按钮
  if (card.actions && card.actions.length > 0) {
    frontendCard.button1 = transformButtonFromApi(card.actions[0]);
    if (card.actions.length > 1) {
      frontendCard.button2 = transformButtonFromApi(card.actions[1]);
    }
  }

  return frontendCard;
}

/**
 * 将活动响应转换为表单数据
 */
export function transformResponseToForm(response: CampaignResponse): MessageCreationForm {
  const form: MessageCreationForm = {
    title: response.name,
    templateType: response.template_type,
    notificationMsg: response.notification_text,
    previewMsg: response.preview_image_url || '',
    scheduleType: response.scheduled_at ? 'scheduled' : 'immediate',
    targetType: response.target_type,
    targetCondition: 'include',
    cards: response.cards.map(transformCardFromApi),
  };

  // 排程时间
  if (response.scheduled_at) {
    form.scheduledTime = new Date(response.scheduled_at);
  }

  // 目标标签
  if (response.tag_ids && response.tag_ids.length > 0) {
    form.targetTags = response.tag_ids;
  }

  return form;
}

/**
 * 格式化数字为字符串（添加千分位）
 */
function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || num === 0) {
    return '-';
  }
  return num.toLocaleString('en-US');
}

/**
 * 将活动响应转换为消息列表项
 */
export function transformResponseToMessage(response: any): Message {
  // Handle backend's actual response format
  const backendResponse = response as any;

  // Map backend status to frontend display
  let displayStatus = '未知';
  if (backendResponse.status) {
    const status = backendResponse.status as CampaignStatus;
    displayStatus = STATUS_FROM_API[status] || backendResponse.status;
  }

  return {
    id: backendResponse.id?.toString() || '',
    title: backendResponse.title || backendResponse.name || '未命名活動',
    tags: Array.isArray(backendResponse.interaction_tags)
      ? backendResponse.interaction_tags
      : (backendResponse.tag_ids?.map((id: number) => `Tag ${id}`) || []),
    platform: backendResponse.platform || 'LINE',
    status: displayStatus,
    sentCount: formatNumber(backendResponse.target_count || backendResponse.sent_count),
    openCount: formatNumber(backendResponse.open_count || backendResponse.opened_count),
    clickCount: formatNumber(backendResponse.click_count || backendResponse.clicked_count),
    sendTime: backendResponse.sent_at || backendResponse.scheduled_at || backendResponse.created_at || '-',
  };
}

/**
 * 批量转换活动响应为消息列表
 */
export function transformResponseListToMessages(responses: CampaignResponse[]): Message[] {
  return responses.map(transformResponseToMessage);
}

// ===== 日期时间转换 Date/Time Formatting =====

/**
 * 格式化日期时间为本地显示
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化日期为本地日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 将 Date 对象转换为 ISO 字符串（后端格式）
 */
export function dateToISOString(date: Date): string {
  return date.toISOString();
}

// ===== 数据验证 Data Validation =====

/**
 * 字段级错误状态接口
 */
export interface FieldErrors {
  title?: string;
  notificationMsg?: string;
  previewMsg?: string;
  templateType?: string;
  scheduledTime?: string;
  targetTags?: string;
  cards?: {
    [cardId: number]: {
      image?: string;
      title?: string;
      messageText?: string;
      button1Url?: string;
      button1Text?: string;
      button1TriggerMessage?: string;
      button1TriggerImage?: string;
      button2Url?: string;
      button2Text?: string;
      button2TriggerMessage?: string;
      button2TriggerImage?: string;
    };
  };
}

/**
 * 验证表单数据并返回字段级错误（新版）
 */
export function validateFormWithFieldErrors(form: MessageCreationForm): {
  isValid: boolean;
  fieldErrors: FieldErrors;
  errorCount: number;
} {
  const fieldErrors: FieldErrors = {};
  let errorCount = 0;

  // 验证基本信息
  if (!form.title || form.title.trim() === '') {
    fieldErrors.title = '請輸入活動標題';
    errorCount++;
  }

  if (!form.notificationMsg || form.notificationMsg.trim() === '') {
    fieldErrors.notificationMsg = '請輸入通知訊息';
    errorCount++;
  }

  if (!form.previewMsg || form.previewMsg.trim() === '') {
    fieldErrors.previewMsg = '請輸入通知預覽';
    errorCount++;
  }

  // 验证模板类型（必填）
  if (!form.templateType) {
    fieldErrors.templateType = '請選擇模板類型';
    errorCount++;
  }

  // 验证排程发送：若选择自訂時間，时间字段为必填
  if (form.scheduleType === 'scheduled' && !form.scheduledTime) {
    fieldErrors.scheduledTime = '請選擇排程時間';
    errorCount++;
  }

  return {
    isValid: errorCount === 0,
    fieldErrors,
    errorCount,
  };
}

/**
 * 验证表单数据是否完整（旧版，保留向后兼容）
 */
export function validateForm(form: MessageCreationForm): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 验证基本信息
  if (!form.title || form.title.trim() === '') {
    errors.push('請輸入活動標題');
  }

  if (!form.notificationMsg || form.notificationMsg.trim() === '') {
    errors.push('請輸入通知訊息');
  }

  if (!form.previewMsg || form.previewMsg.trim() === '') {
    errors.push('請輸入通知預覽');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 计算点击率
 */
export function calculateClickRate(clickCount: number, sentCount: number): string {
  if (sentCount === 0) return '0%';
  return `${((clickCount / sentCount) * 100).toFixed(1)}%`;
}

/**
 * 计算开启率
 */
export function calculateOpenRate(openCount: number, sentCount: number): string {
  if (sentCount === 0) return '0%';
  return `${((openCount / sentCount) * 100).toFixed(1)}%`;
}
