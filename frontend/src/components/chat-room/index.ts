/**
 * Chat Room 模块统一导出
 * 提供所有子组件和类型定义
 */

// ========== 类型导出 ==========
export type * from './types';

// ========== 组件导出 ==========

// 核心组件
export { default as MemberAvatar } from './MemberAvatar';
export { default as MemberInfoPanel } from './MemberInfoPanel';
export { default as MemberInfoPanelComplete } from './MemberInfoPanelComplete';
export { default as MemberTagSection } from './MemberTagSection';
export { default as MemberNoteEditor } from './MemberNoteEditor';
export { default as ChatMessageList } from './ChatMessageList';
export { default as ChatInput } from './ChatInput';
export { default as ChatRoomLayout } from './ChatRoomLayout';

// ========== 旧组件兼容性导出（标记为废弃） ==========
// 以下导出仅用于向后兼容，建议使用新的组件名称

/** @deprecated 使用 MemberAvatar 替代 */
export { default as MemberAvatarSection } from './MemberAvatar';

/** @deprecated 使用 ChatInput 替代 */
export { default as ChatInputSection } from './ChatInput';

/** @deprecated 使用 MemberNoteEditor 替代 */
export { default as MemberNotesSection } from './MemberNoteEditor';
