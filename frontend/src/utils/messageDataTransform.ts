/**
 * 訊息數據轉換工具
 * 負責前端表單數據與後端 API 數據格式之間的轉換
 */
import type { MessageFormData, MessageCreateRequest } from '../types/message';

/**
 * 將前端表單數據轉換為後端 API 創建請求格式
 */
export function transformToBackendFormat(
  formData: MessageFormData,
  templateId: number = 1
): MessageCreateRequest {
  // 1. 轉換 target_type
  let targetType: 'all_friends' | 'filtered';
  let targetFilter: { include?: string[]; exclude?: string[] } | undefined;

  if (formData.targetType === 'all') {
    targetType = 'all_friends';
    targetFilter = undefined;
  } else {
    targetType = 'filtered';
    const tagNames = formData.selectedFilterTags.map((tag) => tag.name);

    if (formData.targetType === 'include') {
      targetFilter = { include: tagNames };
    } else {
      // exclude
      targetFilter = { exclude: tagNames };
    }
  }

  // 2. 轉換排程時間
  let scheduledAt: string | undefined;
  if (
    formData.scheduleType === 'scheduled' &&
    formData.scheduledDate &&
    formData.scheduledTime
  ) {
    // 組合日期和時間為 ISO 8601 格式
    scheduledAt = `${formData.scheduledDate}T${formData.scheduledTime}:00`;
  }

  // 3. 轉換 Flex Message JSON
  const flexMessageJson = JSON.stringify(formData.flexMessageJson);

  // 4. 提取縮圖（使用第一張卡片的圖片）
  let thumbnail: string | undefined;
  if (formData.cards && formData.cards.length > 0) {
    thumbnail = formData.cards[0].imageUrl;
  }

  // 5. 生成訊息內容摘要（用於列表顯示）
  let messageContent = formData.title || '';
  if (formData.cards && formData.cards.length > 0) {
    const firstCard = formData.cards[0];
    messageContent = firstCard.title || formData.title || '群發訊息';
  }

  // 6. 構建後端請求
  return {
    template_id: templateId,
    flex_message_json: flexMessageJson,
    message_content: messageContent,
    thumbnail,
    notification_text: formData.notificationMsg || '您收到一則新消息',
    target_type: targetType,
    target_filter: targetFilter,
    schedule_type: formData.scheduleType,
    scheduled_at: scheduledAt,
    scheduled_date: formData.scheduledDate,
    scheduled_time: formData.scheduledTime,
  };
}

/**
 * 將後端 target_type 轉換為前端表單格式
 */
export function transformTargetTypeToFrontend(
  targetType: string,
  targetFilter?: { include?: string[]; exclude?: string[] } | null
): {
  targetType: 'all' | 'include' | 'exclude';
  selectedTags: string[];
} {
  if (targetType === 'all_friends' || targetType === '所有好友') {
    return {
      targetType: 'all',
      selectedTags: [],
    };
  }

  if (targetFilter?.include) {
    return {
      targetType: 'include',
      selectedTags: targetFilter.include,
    };
  }

  if (targetFilter?.exclude) {
    return {
      targetType: 'exclude',
      selectedTags: targetFilter.exclude,
    };
  }

  // 默認
  return {
    targetType: 'all',
    selectedTags: [],
  };
}

/**
 * 組合日期和時間為 ISO 8601 格式
 */
export function combineDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * 拆分 ISO 8601 datetime 為日期和時間
 */
export function splitDateTime(datetime: string): {
  date: string;
  time: string;
} {
  const [date, timeWithSeconds] = datetime.split('T');
  const time = timeWithSeconds?.substring(0, 5) || '00:00'; // HH:MM
  return { date, time };
}

/**
 * 驗證表單數據完整性
 */
export function validateMessageForm(formData: MessageFormData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. 檢查 Flex Message JSON
  if (!formData.flexMessageJson) {
    errors.push('請完成訊息內容設定');
  }

  // 2. 檢查推送通知文字
  if (!formData.notificationMsg || formData.notificationMsg.trim() === '') {
    errors.push('請填寫推送通知文字');
  }

  // 3. 檢查發送對象
  if (formData.targetType !== 'all') {
    if (
      !formData.selectedFilterTags ||
      formData.selectedFilterTags.length === 0
    ) {
      errors.push('請選擇篩選標籤');
    }
  }

  // 4. 檢查排程時間
  if (formData.scheduleType === 'scheduled') {
    if (!formData.scheduledDate || !formData.scheduledTime) {
      errors.push('請選擇排程發送時間');
    } else {
      // 檢查排程時間是否在未來
      const scheduledDateTime = new Date(
        `${formData.scheduledDate}T${formData.scheduledTime}:00`
      );
      if (scheduledDateTime <= new Date()) {
        errors.push('排程時間必須晚於目前時間');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
