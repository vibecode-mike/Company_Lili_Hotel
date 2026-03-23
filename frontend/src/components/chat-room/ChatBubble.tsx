/**
 * 聊天氣泡組件
 *
 * Figma 3.png 規格：
 * - 用戶訊息背景: #FFFFFF（白色）
 * - 官方訊息背景: #9ED5FF（淺藍）
 * - 圓角: 16px
 * - 內邊距: 16px
 * - 文字顏色: #383838
 * - 最大寬度: 288px，w-fit（自適應文字）
 * - 用戶頭像: 白色圓形 + "OA" 文字
 * - 官方頭像: 白色圓形 + 人物圖標
 * - 時間戳: 灰色文字 (#6E6E6E)
 *
 * @example
 * <ChatBubble
 *   message={message}
 *   memberAvatar={member?.lineAvatar}
 *   platform="LINE"
 * />
 */

import React from 'react';
import type { ChatMessage, ChatPlatform } from './types';
import type { RoomCard } from '../../utils/chatbotApi';
import { PlatformIcon } from '../common/icons/PlatformIcon';
import WebChatIcon from '../../assets/Icon-web-chat-16.png';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

// Props 定義
export interface ChatBubbleProps {
  /** 聊天訊息 */
  message: ChatMessage;
  /** 會員 LINE 頭像 URL */
  memberAvatar?: string;
  /** 平台類型，用於決定用戶頭像顯示方式 */
  platform?: ChatPlatform;
}

/**
 * 用戶頭像組件（左側）
 * - LINE/Facebook: 優先使用會員頭像，找不到則顯示 OA
 * - WebChat: 顯示專用圖標
 */
function UserAvatar({
  avatar,
  platform = 'LINE'
}: {
  avatar?: string;
  platform?: ChatPlatform;
}) {
  // Webchat 平台：顯示專用圖標
  if (platform === 'Webchat') {
    return (
      <div className="bg-white overflow-clip relative rounded-full shrink-0 size-[45px] flex items-center justify-center shadow-sm">
        <img src={WebChatIcon} alt="WebChat" className="w-[16px] h-[16px]" />
      </div>
    );
  }

  // LINE/Facebook 平台：優先使用頭像，否則顯示 OA
  if (avatar) {
    return (
      <div className="bg-white overflow-clip relative rounded-full shrink-0 size-[45px] shadow-sm">
        <img
          src={avatar}
          alt="用戶頭像"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  // 預設：顯示 OA
  return (
    <div className="bg-white overflow-clip relative rounded-full shrink-0 size-[45px] flex items-center justify-center shadow-sm">
      <span className="font-['Noto_Sans_TC:Regular',sans-serif] text-[14px] text-[#6E6E6E] font-medium">
        OA
      </span>
    </div>
  );
}

/**
 * 官方頭像組件（右側）
 * Figma 3.png: 白色圓形 + 人物圖標
 * Hover 時顯示發送人員名稱（manual 顯示人員名稱，其他顯示「系統」）
 */
function OfficialAvatar({ senderName }: { senderName?: string | null }) {
  const displayName = senderName || '系統';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-white overflow-clip relative rounded-full shrink-0 size-[45px] flex items-center justify-center shadow-sm cursor-default">
            {/* 人物圖標 SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                fill="#6E6E6E"
              />
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={4}>
          {displayName}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * 房卡卡片列表（CRM 聊天室用，樣式完全對齊 ChatFAB RoomCardItem）
 */
function RoomCardList({ cards }: { cards: RoomCard[] }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        overscrollBehaviorX: 'contain',
        padding: '6px 0 8px',
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch',
        maxWidth: 360,
      }}
    >
      {cards.map((card) => (
          <div
            key={card.room_type_code}
            style={{
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0px 1px 4px 0px rgba(56,56,56,0.18)',
              border: '3.1px solid transparent',
              padding: 8,
              width: 'calc(75% - 6px)',
              minWidth: 'calc(75% - 6px)',
              maxWidth: 'calc(75% - 6px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            {/* Image */}
            <div style={{ height: 116, borderRadius: 10, overflow: 'hidden', background: '#f0f0f0', flexShrink: 0 }}>
              {card.image_url && (
                <img
                  src={card.image_url}
                  alt={card.room_type_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 500, fontSize: 16, color: '#383838', lineHeight: 1.5 }}>
                {card.room_type_name}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 500, fontSize: 16, color: '#6e6e6e', lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                  {card.source === 'pms' ? card.price_label : `NT$${card.price.toLocaleString()}`}
                </div>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 500, fontSize: 16, color: '#6e6e6e', lineHeight: 1.5 }}>/</div>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 400, fontSize: 16, color: '#6e6e6e', lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                  {card.available_count != null ? `剩餘 ${card.available_count} 間` : '待確認'}
                </div>
              </div>
            </div>
            {/* Quantity Stepper */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                disabled
                style={{ width: 32, height: 32, background: 'none', border: 'none', padding: 0, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M8 16H24" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 400, fontSize: 16, color: '#383838', lineHeight: 1.5 }}>
                0
              </div>
              <button
                type="button"
                disabled
                style={{ width: 32, height: 32, background: 'none', border: 'none', padding: 0, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 8V24M8 16H24" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
      ))}
    </div>
  );
}

/**
 * 聊天氣泡組件
 */
export function ChatBubble({
  message,
  memberAvatar,
  platform = 'LINE'
}: ChatBubbleProps) {
  const isOfficial = message.type === 'official';
  const isRoomCards = message.messageType === 'room_cards' && message.roomCards?.length;

  return (
    <div
      className={`content-stretch flex gap-[20px] items-start ${
        isOfficial ? 'justify-end' : 'justify-start'
      } relative shrink-0 w-full`}
    >
      {/* 用戶頭像（左側） */}
      {!isOfficial && <UserAvatar avatar={memberAvatar} platform={platform} />}

      {/* 訊息內容 */}
      <div
        className={`content-stretch flex flex-col gap-[2px] ${
          isOfficial ? 'items-end' : 'items-start'
        } relative shrink-0`}
      >
        {isRoomCards ? (
          /* 房卡卡片列表 */
          <RoomCardList cards={message.roomCards!} />
        ) : (
          /* 氣泡 - Figma 3.png 規格 */
          <div
            className="flex flex-col items-center max-w-[288px] w-fit overflow-clip relative rounded-[16px] shrink-0"
            style={{ backgroundColor: isOfficial ? '#9ED5FF' : '#FFFFFF' }}
          >
            <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
              <p
                className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[16px] text-[#383838] break-words whitespace-pre-wrap text-left"
                style={{ overflowWrap: 'anywhere' }}
              >
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* 時間戳 - Figma 3.png: 灰色文字 */}
        <div className="h-[18px] relative shrink-0 w-full">
          <p
            className={`font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[12px] ${
              isOfficial ? 'text-right' : 'text-left'
            } text-[#6E6E6E]`}
          >
            {message.time}
            {message.isRead ? ' 已讀' : ''}
          </p>
        </div>
      </div>

      {/* 官方頭像（右側） */}
      {isOfficial && <OfficialAvatar senderName={message.senderName} />}
    </div>
  );
}

export default ChatBubble;
