/**
 * DataContext 兼容層（已棄用）
 * 
 * 此文件保留了舊的 DataContext API，用於向後兼容。
 * 實際上它是一個聚合層，將新的獨立 Context 組合在一起。
 * 
 * ⚠️ 不建議在新代碼中使用此文件
 * 請直接使用獨立的 Context：
 * - useMembers() from './MembersContext'
 * - useMessages() from './MessagesContext'
 * - useAutoReplies() from './AutoRepliesContext'
 * - useTags() from './TagsContext'
 * 
 * 這樣可以獲得更好的性能，避免不必要的重新渲染。
 */

import { useMembers } from './MembersContext';
import { useMessages } from './MessagesContext';
import { useAutoReplies } from './AutoRepliesContext';
import { useTags } from './TagsContext';

// 重新導出類型
export type { Member, MemberData } from '../types/member';
export type { Message } from './MessagesContext';
export type { AutoReply } from './AutoRepliesContext';

// 舊的 useData Hook（向後兼容）
export function useData() {
  const membersCtx = useMembers();
  const messagesCtx = useMessages();
  const autoRepliesCtx = useAutoReplies();
  const tagsCtx = useTags();

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
    
    // 重置數據（已移除，不建議使用）
    resetAllData: () => {
      // Deprecated: Not available in the new Context structure
    },
  };
}

// 舊的統計 Hook（向後兼容）
export function useStats() {
  const { totalMembers } = useMembers();
  const { totalMessages } = useMessages();
  const { totalAutoReplies, activeAutoReplies } = useAutoReplies();

  return {
    totalMembers,
    totalMessages,
    totalAutoReplies,
    activeAutoReplies,
  };
}

// 重新導出新的 Hooks（推薦使用）
export { useMembers } from './MembersContext';
export { useMessages } from './MessagesContext';
export { useAutoReplies } from './AutoRepliesContext';
export { useTags } from './TagsContext';