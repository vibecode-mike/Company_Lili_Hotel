/**
 * 聊天输入框组件
 * - 消息输入框
 * - Enter 快捷键发送
 * - 字数统计（可选）
 */

import { useState } from 'react';
import type { ChatInputProps } from './types';
import svgPaths from '../../imports/svg-9tjcfsdo1d';

export default function ChatInput({ 
  onSendMessage, 
  placeholder = '輸入訊息',
  maxLength = 500
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    onSendMessage(trimmedMessage);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = !message.trim();
  const charCount = message.length;

  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex gap-[8px] items-end relative shrink-0 w-full">
        {/* Input Field */}
        <div className="basis-0 bg-white group grow min-h-[48px] relative rounded-[8px] shrink-0">
          <div aria-hidden="true" className="absolute border border-neutral-100 border-solid group-focus-within:border-[#6e6e6e] group-focus-within:border-2 inset-0 pointer-events-none rounded-[8px]" />
          <div className="flex flex-col justify-center min-h-inherit size-full">
            <div className="box-border content-stretch flex flex-col gap-[4px] h-[48px] items-start justify-center min-h-inherit p-[8px] relative w-full">
              <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full"
                  aria-label="訊息輸入框"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isDisabled}
          className={`box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] relative rounded-[8px] shrink-0 transition-colors ${
            isDisabled 
              ? 'bg-[#dddddd] cursor-not-allowed' 
              : 'bg-[#242424] hover:bg-[#383838] cursor-pointer'
          }`}
          aria-label="發送訊息"
        >
          <div className="relative shrink-0 size-[24px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <g id="Icon/Send">
                <path d={svgPaths.p29b14600} fill={isDisabled ? '#a8a8a8' : 'white'} id="Vector" />
              </g>
            </svg>
          </div>
        </button>
      </div>
      
      {/* Character Counter (optional) */}
      {maxLength && charCount > 0 && (
        <div className="flex justify-end w-full">
          <p className={`text-[12px] ${charCount >= maxLength ? 'text-[#f44336]' : 'text-[#6e6e6e]'}`}>
            {charCount} / {maxLength}
          </p>
        </div>
      )}
    </div>
  );
}
