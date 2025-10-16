// Survey Status Constants
export const SurveyStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type SurveyStatus = typeof SurveyStatus[keyof typeof SurveyStatus];

// Question Type Constants
export const QuestionType = {
  NAME: 'name',
  PHONE: 'phone',
  EMAIL: 'email',
  BIRTHDAY: 'birthday',
  ADDRESS: 'address',
  GENDER: 'gender',
  ID_NUMBER: 'id_number',
  LINK: 'link',
  VIDEO: 'video',
  IMAGE: 'image',
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

// Survey Template Interface
export interface SurveyTemplate {
  id: number;
  name: string;
  description: string;
  icon?: string;
  category: string;
  default_questions?: SurveyQuestion[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Survey Question Interface
export interface SurveyQuestion {
  id?: number;
  question_type: QuestionType;
  question_text: string;
  font_size?: number;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  is_required: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  order: number;
  // 影片題型欄位
  video_description?: string; // 影片描述
  video_link?: string; // 影片超連結
  // 圖片題型欄位
  image_description?: string; // 圖片描述
  image_link?: string; // 圖片連結（編輯階段使用，方便預覽）
  image_base64?: string; // 圖片Base64（發送給用戶時使用）
}

// Survey Create/Update Interface
export interface SurveyCreate {
  name: string;
  template_id: number;
  description?: string;
  target_audience: 'all' | 'filtered';
  target_tags?: string[];
  schedule_type: 'immediate' | 'scheduled';
  scheduled_at?: string;
  questions: SurveyQuestion[];
}

// Survey Full Interface
export interface Survey extends Omit<SurveyCreate, 'questions'> {
  id: number;
  status: SurveyStatus;
  response_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  template?: SurveyTemplate;
  questions?: SurveyQuestion[];
}

// Survey Response Interface
export interface SurveyResponse {
  id: number;
  survey_id: number;
  member_id: number;
  answers: Record<string, any>;
  is_completed: boolean;
  completed_at?: string;
  source?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

// Survey Statistics Interface
export interface SurveyStatistics {
  total_responses: number;
  total_views: number;
  completion_rate: number;
  average_time: number;
  question_stats: Array<{
    question_id: number;
    question_text: string;
    responses: Record<string, number>;
  }>;
}
