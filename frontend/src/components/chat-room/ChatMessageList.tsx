/**
 * 聊天消息列表组件
 * 显示用户和官方账号之间的聊天消息
 */

import React, { useRef, useEffect } from 'react';

// ========== 类型定义 ==========

export interface ChatMessage {
  id: number;
  type: 'user' | 'official';
  text: string;
  time: string;
  isRead: boolean;
}

export interface ChatMessageListProps {
  messages: ChatMessage[];
  memberName?: string;
  memberAvatar?: string;
}

// ========== OA 徽章组件 ==========

function OABadge() {
  return (
    <div className="bg-white relative rounded-full shrink-0 size-[45px] flex items-center justify-center">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[18px] text-[#383838] text-[12px]">
        OA
      </p>
    </div>
  );
}

// ========== 消息气泡组件 ==========

function UserMessage({ message, avatar }: { message: ChatMessage; avatar?: string }) {
  return (
    <div className="flex gap-[12px] items-start justify-end">
      {/* 时间 */}
      <div className="flex items-end h-full pt-[24px]">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[14px] leading-[1.5] text-[#717182]">
          {message.time}
        </p>
      </div>

      {/* 消息内容 */}
      <div className="bg-white rounded-[12px] px-[16px] py-[12px] max-w-[400px]">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#383838] break-words">
          {message.text}
        </p>
      </div>

      {/* 用户头像 */}
      <div className="shrink-0">
        <div className="bg-white border-2 border-white overflow-clip relative rounded-full shrink-0 size-[45px]">
          {avatar ? (
            <img 
              src={avatar} 
              alt="用户头像"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-[16px] text-gray-500">U</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OfficialMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex gap-[12px] items-start">
      {/* OA 徽章 */}
      <div className="shrink-0">
        <OABadge />
      </div>

      {/* 消息内容 */}
      <div className="bg-[#0f6beb] rounded-[12px] px-[16px] py-[12px] max-w-[400px]">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-white break-words">
          {message.text}
        </p>
      </div>

      {/* 时间 */}
      <div className="flex items-end h-full pt-[24px]">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[14px] leading-[1.5] text-[#717182]">
          {message.time}
        </p>
      </div>
    </div>
  );
}

// ========== 主组件 ==========

export default function ChatMessageList({ messages, memberName, memberAvatar }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#a5d8ff] to-[#d0ebff] p-[24px]">
      <div className="flex flex-col gap-[16px]">
        {messages.map((message) => (
          <React.Fragment key={message.id}>
            {message.type === 'user' ? (
              <UserMessage message={message} avatar={memberAvatar} />
            ) : (
              <OfficialMessage message={message} />
            )}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// ========== 默认消息数据 ==========

export const mockMessages: ChatMessage[] = [
  { id: 1, type: 'user', text: '文字訊息', time: '下午 03:30', isRead: false },
  { id: 2, type: 'official', text: '官方文字訊息', time: '下午 03:40', isRead: true },
  { id: 3, type: 'user', text: '文字訊息', time: '下午 04:30', isRead: false },
  { id: 4, type: 'official', text: '官方文字訊息', time: '下午 04:50', isRead: true },
];
