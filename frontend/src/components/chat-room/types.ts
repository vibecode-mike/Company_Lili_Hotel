/**
 * Chat Room 模块共享类型定义
 * 统一的接口和类型，便于维护和扩展
 */

import type { Member } from '../../types/member';

// ========== 聊天消息相关 ==========

export interface ChatMessage {
  id: string;  // ✅ 修正：API 返回 UUID string，非 number
  type: 'user' | 'official';
  text: string;
  time: string;
  timestamp?: string | null;  // ✅ 新增：ISO 格式完整時間戳，用於日期顯示
  isRead: boolean;
  source?: string | null;  // ✅ 新增：message_source 欄位 ('manual' | 'gpt' | 'keyword' | 'welcome' | 'always' | null)
  senderName?: string | null;  // ✅ 新增：發送人員名稱（manual 顯示人員名稱，其他顯示「系統」）
}

// ========== 组件 Props 接口 ==========

export interface MemberAvatarProps {
  member: Member;
}

export interface MemberInfoPanelProps {
  member: Member;
}

export interface MemberTagSectionProps {
  tags: string[];
  emptyMessage?: string;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export interface MemberNoteEditorProps {
  initialNote?: string;
  onSave?: (note: string) => void;
}

export interface ChatMessageListProps {
  messages: ChatMessage[];
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  maxLength?: number;
}

export interface ChatRoomLayoutProps {
  member?: Member;
  memberId?: string;  // 支援直接傳入 memberId，用於 WebSocket 連線
  chatSessionApiBase?: string; // 可覆寫 API 基底路徑（預設 /api/v1）
  onPlatformChange?: (platform: ChatPlatform) => void;
}

// ========== 标签相关 ==========

export interface TagData {
  memberTags: string[];
  interactionTags: string[];
}

// ========== 事件处理器类型 ==========

export type MessageSendHandler = (message: string) => void;
export type TagSaveHandler = (memberTags: string[], interactionTags: string[]) => Promise<boolean>;
export type NoteSaveHandler = (note: string) => void;
export type AvatarUploadHandler = (file: File) => void;

// ========== 回覆模式相關 ==========

export type ResponseMode = 'manual' | 'ai_auto' | 'auto';

// ========== 聊天平台相關 ==========

export type ChatPlatform = 'LINE' | 'Facebook' | 'WebChat';
