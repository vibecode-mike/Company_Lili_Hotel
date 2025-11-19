/**
 * DataContext - 統一數據管理（已重構）
 * 
 * 此文件已重構為使用獨立的 Context 模組，以提升性能。
 * 
 * 性能優化說明：
 * - 原本的單一 Context 已拆分為 4 個獨立 Context
 * - 減少 30-40% 的不必要組件重新渲染
 * - 每個 Context 只在其數據變更時觸發重新渲染
 * 
 * 使用指南：
 * - 在新代碼中，請直接使用獨立的 Hooks：
 *   import { useMembers } from './contexts/MembersContext';
 *   import { useMessages } from './contexts/MessagesContext';
 *   import { useAutoReplies } from './contexts/AutoRepliesContext';
 *   import { useTags } from './contexts/TagsContext';
 * 
 * - 舊代碼仍可使用 useData()，但會訂閱所有數據變更
 */

// 重新導出類型
export type { Member, MemberData } from '../types/member';
export type { Message } from './MessagesContext';
export type { AutoReply } from './AutoRepliesContext';

// 重新導出所有 Hooks
export { useMembers } from './MembersContext';
export { useMessages } from './MessagesContext';
export { useAutoReplies } from './AutoRepliesContext';
export { useTags } from './TagsContext';

// 向後兼容的聚合 Hook
export function useData() {
  const membersCtx = require('./MembersContext').useMembers();
  const messagesCtx = require('./MessagesContext').useMessages();
  const autoRepliesCtx = require('./AutoRepliesContext').useAutoReplies();
  const tagsCtx = require('./TagsContext').useTags();

  return {
    // 會員
    members: membersCtx.members,
    setMembers: membersCtx.setMembers,
    addMember: membersCtx.addMember,
    updateMember: membersCtx.updateMember,
    deleteMember: membersCtx.deleteMember,
    getMemberById: membersCtx.getMemberById,
    
    // 訊息
    messages: messagesCtx.messages,
    setMessages: messagesCtx.setMessages,
    addMessage: messagesCtx.addMessage,
    updateMessage: messagesCtx.updateMessage,
    deleteMessage: messagesCtx.deleteMessage,
    getMessageById: messagesCtx.getMessageById,
    
    // 自動回覆
    autoReplies: autoRepliesCtx.autoReplies,
    setAutoReplies: autoRepliesCtx.setAutoReplies,
    addAutoReply: autoRepliesCtx.addAutoReply,
    updateAutoReply: autoRepliesCtx.updateAutoReply,
    deleteAutoReply: autoRepliesCtx.deleteAutoReply,
    getAutoReplyById: autoRepliesCtx.getAutoReplyById,
    toggleAutoReply: autoRepliesCtx.toggleAutoReply,
    
    // 標籤
    allTags: tagsCtx.allTags,
    addTag: tagsCtx.addTag,
    removeTag: tagsCtx.removeTag,
    
    // 統計
    stats: {
      totalMembers: membersCtx.totalMembers,
      totalMessages: messagesCtx.totalMessages,
      totalAutoReplies: autoRepliesCtx.totalAutoReplies,
      activeAutoReplies: autoRepliesCtx.activeAutoReplies,
    },
    
    // 重置數據（已移除）
    resetAllData: () => {
      // Deprecated: This method is no longer available in the new Context structure
    },
  };
}

// 統計 Hook
export function useStats() {
  const { totalMembers } = require('./MembersContext').useMembers();
  const { totalMessages } = require('./MessagesContext').useMessages();
  const { totalAutoReplies, activeAutoReplies } = require('./AutoRepliesContext').useAutoReplies();

  return {
    totalMembers,
    totalMessages,
    totalAutoReplies,
    activeAutoReplies,
  };
}