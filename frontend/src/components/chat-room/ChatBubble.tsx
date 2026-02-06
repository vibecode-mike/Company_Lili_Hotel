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
import Container from '../../imports/Container-8548-103';
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
 * 聊天氣泡組件
 */
export function ChatBubble({
  message,
  memberAvatar,
  platform = 'LINE'
}: ChatBubbleProps) {
  const isOfficial = message.type === 'official';

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
        {/* 氣泡 - Figma 3.png 規格 */}
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
