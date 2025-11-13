/**
 * 会员头像组件
 * - 头像显示和上传
 * - 交互效果（悬停/点击）
 * - 文件验证
 */

import { useState, useRef } from 'react';
import type { MemberAvatarProps } from './types';
import ButtonEditAvatar from '../../imports/ButtonEdit-8025-230';
import svgPathsAvatar from '../../imports/svg-sfzq97zmp3';
import { useToast } from '../ToastProvider';

export default function MemberAvatar({ member }: MemberAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 文件验证
    if (!file.type.startsWith('image/')) {
      showToast('請選擇圖片檔案', 'error');
      return;
    }

    // 文件大小验证（最大 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('圖片大小不能超過 5MB', 'error');
      return;
    }

    // 读取并显示图片
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarImage(e.target?.result as string);
      showToast('頭像上傳成功', 'success');
    };
    reader.onerror = () => {
      showToast('圖片讀取失敗', 'error');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="上傳頭像"
      />
      
      {/* Avatar Container */}
      <div 
        className="relative flex items-center justify-center rounded-full bg-[#EDF2F8] size-[180px] overflow-hidden cursor-pointer transition-all duration-300 ease-in-out"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onClick={handleAvatarClick}
        role="button"
        aria-label="點擊上傳頭像"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleAvatarClick();
          }
        }}
      >
        {/* Avatar Image */}
        {avatarImage ? (
          <img 
            src={avatarImage} 
            alt="會員頭像" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative shrink-0 size-[100px]">
            <div className="absolute left-1/2 size-[49.412px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                <g>
                  <path d={svgPathsAvatar.p3c081b00} fill="#383838" />
                </g>
              </svg>
            </div>
          </div>
        )}
        
        {/* Overlay for hover/press states */}
        {(isHovered || isPressed) && (
          <div 
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isPressed 
                ? 'bg-black/60' 
                : isHovered 
                ? 'bg-black/40' 
                : 'bg-transparent'
            }`}
          >
            <div className={`transition-all duration-300 ${isPressed ? 'scale-90' : 'scale-100'}`}>
              <ButtonEditAvatar />
            </div>
          </div>
        )}
      </div>
      
      {/* Username */}
      <div className="content-stretch flex items-center relative shrink-0">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[20px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{member.username}</p>
        </div>
      </div>
    </div>
  );
}