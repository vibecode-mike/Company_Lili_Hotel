/**
 * 會員相關類型定義
 */

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

export type Gender = typeof Gender[keyof typeof Gender];

export const MemberSource = {
  LINE: 'line',
  CRM: 'crm',
  SYSTEM: 'system',
} as const;

export type MemberSource = typeof MemberSource[keyof typeof MemberSource];

export interface TagInfo {
  id: number;
  name: string;
  type: 'member' | 'interaction';
}

export interface MemberListItem {
  id: number;
  line_uid?: string;
  line_display_name?: string;
  line_picture_url?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  tags: TagInfo[];
  created_at: string;
  last_interaction_at?: string;
}

export interface MemberDetail extends MemberListItem {
  gender?: Gender;
  birthday?: string;
  id_number?: string;
  source: MemberSource;
  accept_marketing: boolean;
  notes?: string;
}

export interface MemberSearchParams {
  search?: string;
  tags?: string;
  source?: MemberSource;
  sort_by?: string;
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface MemberCreate {
  first_name?: string;
  last_name?: string;
  gender?: Gender;
  birthday?: string;
  email?: string;
  phone?: string;
  id_number?: string;
  accept_marketing?: boolean;
}

export interface MemberUpdate extends MemberCreate {
  notes?: string;
}
