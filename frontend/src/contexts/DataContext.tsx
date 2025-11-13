import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Member, MemberData } from '../types/member';

// 消息类型
export interface Message {
  id: string;
  title: string;
  tags: string[];
  platform: 'LINE' | 'Facebook' | 'Instagram';
  status: '已排程' | '草稿' | '已發送';
  recipientCount: number;
  openCount: number;
  clickCount: number;
  sendTime: string;
  createdAt: string;
  updatedAt: string;
  content?: any; // Flex Message 内容
}

// 自动回复类型
export interface AutoReply {
  id: string;
  keyword: string;
  replyType: '文字' | '圖文' | 'Flex Message';
  replyContent: string;
  enabled: boolean;
  matchType: '完全符合' | '包含關鍵字';
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// 数据上下文类型
interface DataContextType {
  // ===== 会员数据 =====
  members: Member[];
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  
  // ===== 消息数据 =====
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  getMessageById: (id: string) => Message | undefined;
  
  // ===== 自动回复数据 =====
  autoReplies: AutoReply[];
  setAutoReplies: (replies: AutoReply[]) => void;
  addAutoReply: (reply: AutoReply) => void;
  updateAutoReply: (id: string, updates: Partial<AutoReply>) => void;
  deleteAutoReply: (id: string) => void;
  getAutoReplyById: (id: string) => AutoReply | undefined;
  toggleAutoReply: (id: string) => void;
  
  // ===== 标签管理 =====
  allTags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  
  // ===== 数据统计 =====
  stats: {
    totalMembers: number;
    totalMessages: number;
    totalAutoReplies: number;
    activeAutoReplies: number;
  };
  
  // ===== 重置数据 =====
  resetAllData: () => void;
}

// 创建 Context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock 初始数据
const initialMembers: Member[] = [
  {
    id: '1',
    username: 'User Name',
    realName: 'Real Name',
    tags: ['優惠活動', '伴手禮', 'KOL'],
    memberTags: ['VIP', '消費力高', '忠實顧客'],
    interactionTags: ['優惠活動', '伴手禮', 'KOL'],
    phone: '0987654321',
    email: 'Chox.ox@gmail.com',
    createTime: '2025-10-02 10:40',
    lastChatTime: '2025-10-02 18:40'
  },
  {
    id: '2',
    username: 'JaneDoe88',
    realName: 'Jane Doe',
    tags: ['夏季特惠', '手工皂', 'BeautyBlogger'],
    memberTags: ['新會員', '潛力客戶'],
    interactionTags: ['夏季特惠', '手工皂', 'BeautyBlogger', '美容保養'],
    phone: '0912345678',
    email: 'JaneDoe88@example.com',
    createTime: '2025-10-03 10:00',
    lastChatTime: '2025-10-03 10:30'
  },
  {
    id: '3',
    username: 'ChocLover',
    realName: 'John Smith',
    tags: ['聖誕促銷', '巧克力禮盒', 'Foodie'],
    memberTags: ['常客', '送禮需求', '節日購物'],
    interactionTags: ['聖誕促銷', '巧克力禮盒', 'Foodie'],
    phone: '0923456789',
    email: 'john.smith@example.com',
    createTime: '2025-10-04 14:20',
    lastChatTime: '2025-10-04 16:45'
  }
];

const initialMessages: Message[] = [
  {
    id: '1',
    title: '雙人遊行 獨家優惠',
    tags: ['雙人床', '送禮', 'KOL'],
    platform: 'LINE',
    status: '已排程',
    recipientCount: 0,
    openCount: 0,
    clickCount: 0,
    sendTime: '2026-10-02 22:47',
    createdAt: '2025-10-01 10:00',
    updatedAt: '2025-10-01 10:00'
  }
];

const initialAutoReplies: AutoReply[] = [
  {
    id: '1',
    keyword: '營業時間',
    replyType: '文字',
    replyContent: '我們的營業時間是週一至週五 9:00-18:00',
    enabled: true,
    matchType: '完全符合',
    tags: ['常見問題'],
    usageCount: 45,
    createdAt: '2025-09-01 10:00',
    updatedAt: '2025-09-01 10:00'
  }
];

// Provider Props
interface DataProviderProps {
  children: ReactNode;
}

// Provider 组件
export function DataProvider({ children }: DataProviderProps) {
  // 会员数据
  const [members, setMembers] = useState<Member[]>(initialMembers);
  
  // 消息数据
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  // 自动回复数据
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>(initialAutoReplies);

  // ===== 会员方法 =====
  const addMember = useCallback((member: Member) => {
    setMembers(prev => [...prev, member]);
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const getMemberById = useCallback((id: string) => {
    return members.find(m => m.id === id);
  }, [members]);

  // ===== 消息方法 =====
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const getMessageById = useCallback((id: string) => {
    return messages.find(m => m.id === id);
  }, [messages]);

  // ===== 自动回复方法 =====
  const addAutoReply = useCallback((reply: AutoReply) => {
    setAutoReplies(prev => [...prev, reply]);
  }, []);

  const updateAutoReply = useCallback((id: string, updates: Partial<AutoReply>) => {
    setAutoReplies(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteAutoReply = useCallback((id: string) => {
    setAutoReplies(prev => prev.filter(r => r.id !== id));
  }, []);

  const getAutoReplyById = useCallback((id: string) => {
    return autoReplies.find(r => r.id === id);
  }, [autoReplies]);

  const toggleAutoReply = useCallback((id: string) => {
    setAutoReplies(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  }, []);

  // ===== 标签管理 =====
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    members.forEach(m => m.tags.forEach(t => tagSet.add(t)));
    messages.forEach(m => m.tags.forEach(t => tagSet.add(t)));
    autoReplies.forEach(r => r.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [members, messages, autoReplies]);

  const addTag = useCallback((tag: string) => {
    // 标签会在实际添加到数据时自动出现在 allTags 中
  }, []);

  const removeTag = useCallback((tag: string) => {
    // 从所有数据中移除该标签
    setMembers(prev => prev.map(m => ({
      ...m,
      tags: m.tags.filter(t => t !== tag)
    })));
    setMessages(prev => prev.map(m => ({
      ...m,
      tags: m.tags.filter(t => t !== tag)
    })));
    setAutoReplies(prev => prev.map(r => ({
      ...r,
      tags: r.tags.filter(t => t !== tag)
    })));
  }, []);

  // ===== 数据统计 =====
  const stats = {
    totalMembers: members.length,
    totalMessages: messages.length,
    totalAutoReplies: autoReplies.length,
    activeAutoReplies: autoReplies.filter(r => r.enabled).length,
  };

  // ===== 重置数据 =====
  const resetAllData = useCallback(() => {
    setMembers(initialMembers);
    setMessages(initialMessages);
    setAutoReplies(initialAutoReplies);
  }, []);

  const value: DataContextType = {
    // 会员
    members,
    setMembers,
    addMember,
    updateMember,
    deleteMember,
    getMemberById,
    // 消息
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    getMessageById,
    // 自动回复
    autoReplies,
    setAutoReplies,
    addAutoReply,
    updateAutoReply,
    deleteAutoReply,
    getAutoReplyById,
    toggleAutoReply,
    // 标签
    allTags,
    addTag,
    removeTag,
    // 统计
    stats,
    // 重置
    resetAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Hook
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// 便捷的单一数据类型 Hooks
export function useMembers() {
  const { 
    members, 
    setMembers, 
    addMember, 
    updateMember, 
    deleteMember, 
    getMemberById 
  } = useData();
  return { 
    members, 
    setMembers, 
    addMember, 
    updateMember, 
    deleteMember, 
    getMemberById 
  };
}

export function useMessages() {
  const { 
    messages, 
    setMessages, 
    addMessage, 
    updateMessage, 
    deleteMessage, 
    getMessageById 
  } = useData();
  return { 
    messages, 
    setMessages, 
    addMessage, 
    updateMessage, 
    deleteMessage, 
    getMessageById 
  };
}

export function useAutoReplies() {
  const { 
    autoReplies, 
    setAutoReplies, 
    addAutoReply, 
    updateAutoReply, 
    deleteAutoReply, 
    getAutoReplyById,
    toggleAutoReply 
  } = useData();
  return { 
    autoReplies, 
    setAutoReplies, 
    addAutoReply, 
    updateAutoReply, 
    deleteAutoReply, 
    getAutoReplyById,
    toggleAutoReply 
  };
}

export function useTags() {
  const { allTags, addTag, removeTag } = useData();
  return { allTags, addTag, removeTag };
}

export function useStats() {
  const { stats } = useData();
  return stats;
}