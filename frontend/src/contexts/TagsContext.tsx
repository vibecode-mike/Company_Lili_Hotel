import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useMembers } from './MembersContext';
import { useMessages } from './MessagesContext';
import { useAutoReplies } from './AutoRepliesContext';

/**
 * 標籤管理 Context
 * 
 * 聚合所有數據源的標籤，提供統一的標籤管理接口
 * 自動從 Members、Messages、AutoReplies 中收集標籤
 */

// Context 類型定義
interface TagsContextType {
  allTags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}

// 創建 Context
const TagsContext = createContext<TagsContextType | undefined>(undefined);

// Provider Props
interface TagsProviderProps {
  children: ReactNode;
}

// Provider 組件
export function TagsProvider({ children }: TagsProviderProps) {
  const { members, updateMember } = useMembers();
  const { messages, updateMessage } = useMessages();
  const { autoReplies, updateAutoReply } = useAutoReplies();

  // 聚合所有標籤
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    
    // 從會員收集標籤
    members.forEach(m => m.tags.forEach(t => tagSet.add(t)));
    
    // 從訊息收集標籤
    messages.forEach(m => m.tags.forEach(t => tagSet.add(t)));
    
    // 從自動回覆收集標籤
    autoReplies.forEach(r => r.tags.forEach(t => tagSet.add(t)));
    
    return Array.from(tagSet).sort();
  }, [members, messages, autoReplies]);

  // 添加標籤（標籤會在實際添加到數據時自動出現在 allTags 中）
  const addTag = useCallback((tag: string) => {
    // 這是一個空操作，因為標籤會在數據更新時自動收集
    // 保留此方法是為了 API 兼容性
  }, []);

  // 從所有數據中移除標籤
  const removeTag = useCallback((tag: string) => {
    // 從會員中移除標籤
    members.forEach(member => {
      if (member.tags.includes(tag)) {
        updateMember(member.id, {
          tags: member.tags.filter(t => t !== tag)
        });
      }
    });

    // 從訊息中移除標籤
    messages.forEach(message => {
      if (message.tags.includes(tag)) {
        updateMessage(message.id, {
          tags: message.tags.filter(t => t !== tag)
        });
      }
    });

    // 從自動回覆中移除標籤
    autoReplies.forEach(reply => {
      if (reply.tags.includes(tag)) {
        updateAutoReply(reply.id, {
          tags: reply.tags.filter(t => t !== tag)
        });
      }
    });
  }, [members, messages, autoReplies, updateMember, updateMessage, updateAutoReply]);

  const value = useMemo<TagsContextType>(() => ({
    allTags,
    addTag,
    removeTag,
  }), [allTags, addTag, removeTag]);

  return (
    <TagsContext.Provider value={value}>
      {children}
    </TagsContext.Provider>
  );
}

// Hook
export function useTags() {
  const context = useContext(TagsContext);
  if (context === undefined) {
    throw new Error('useTags must be used within a TagsProvider');
  }
  return context;
}