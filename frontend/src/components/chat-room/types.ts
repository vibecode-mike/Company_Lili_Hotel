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
  isRead: boolean;
  source?: string | null;  // ✅ 新增：message_source 欄位 ('manual' | 'gpt' | 'keyword' | 'welcome' | 'always' | null)
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
  placeholder?: string;
  maxLength?: number;
}

export interface ChatRoomLayoutProps {
  member: Member;
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
