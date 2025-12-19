import { memo } from 'react';

interface BasicSettingsEmptyProps {
  onLineClick: () => void;
  onFacebookClick: () => void;
}

/**
 * 基本設定初始狀態 - 平台選擇卡片
 * 設計來源: Member Management_v0.1/1.png
 */
export const BasicSettingsEmpty = memo(function BasicSettingsEmpty({
  onLineClick,
  onFacebookClick
}: BasicSettingsEmptyProps) {
  return (
    <div className="bg-[#f6f9fd] min-h-screen w-full">
      <div className="max-w-[1240px] mx-auto px-[40px] pt-[48px] pb-[80px]">
        {/* Breadcrumb */}
        <div className="mb-[16px]">
          <p className="text-[14px] leading-[1.5] text-[#383838] font-medium">基本設定</p>
        </div>

        {/* Header */}
        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full mb-[24px]">
          <div className="content-stretch flex items-center relative shrink-0 w-full">
            <div className="content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0">
              <h1 className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[32px] whitespace-nowrap">
                基本設定
              </h1>
            </div>
          </div>
          <div className="content-stretch flex items-center relative shrink-0 w-full">
            <div className="content-stretch flex items-center pl-[4px] pr-0 py-0 relative shrink-0">
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[16px] whitespace-nowrap">
                完成平台設定後，即可使用該平台的訊息推播與會員管理
              </p>
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="flex gap-[12px]">
          {/* LINE Card */}
          <button
            onClick={onLineClick}
            className="platform-card basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0 p-[20px] group text-left border border-[#e5e7eb]"
          >
            <div className="flex flex-row items-center justify-center size-full">
              {/* LINE Icon */}
              <div className="relative shrink-0 size-[48px]">
                <svg className="block size-full" fill="none" viewBox="0 0 48 48">
                  <rect width="36" height="36" x="6" y="6" rx="8" fill="#06C755" />
                  {/* 對話泡泡外框 */}
                  <path
                    d="M24 13C17.373 13 12 17.373 12 22.5C12 27.018 16.149 30.758 21.558 31.644C21.912 31.719 22.399 31.877 22.521 32.178C22.631 32.452 22.597 32.877 22.564 33.156L22.444 33.885C22.397 34.159 22.228 34.918 24.012 34.168C25.796 33.418 30.703 30.377 32.892 27.858C34.4 26.195 35.238 24.421 35.238 22.5C35.238 17.373 30.627 13 24 13Z"
                    fill="white"
                  />
                  {/* LINE 文字 */}
                  <g fill="#06C755">
                    {/* L */}
                    <path d="M16.5 19.5V25.5H19V26.5H15.5V19.5H16.5Z" />
                    {/* I */}
                    <path d="M20 19.5H21V26.5H20V19.5Z" />
                    {/* N */}
                    <path d="M22.5 19.5H23.5L26 24.5V19.5H27V26.5H26L23.5 21.5V26.5H22.5V19.5Z" />
                    {/* E */}
                    <path d="M28.5 19.5H32V20.5H29.5V22.5H31.5V23.5H29.5V25.5H32V26.5H28.5V19.5Z" />
                  </g>
                </svg>
              </div>
              <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[24px] py-0 relative w-full">
                    <div className="h-[52px] relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col h-full items-start justify-center relative">
                        <div className="relative shrink-0 w-full">
                          <p className="font-['Inter',sans-serif] font-normal leading-[28px] relative shrink-0 text-[#0a0a0a] text-[18px] tracking-[-0.44px]">
                            LINE
                          </p>
                        </div>
                        <div className="relative shrink-0 w-full">
                          <p className="font-['Inter',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#6e6e6e] text-[16px] whitespace-nowrap tracking-[-0.31px]">
                            連接 LINE 官方帳號
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>

          {/* Facebook Card */}
          <button
            onClick={onFacebookClick}
            className="platform-card basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0 p-[20px] group text-left border border-[#e5e7eb]"
          >
            <div className="flex flex-row items-center justify-center size-full">
              {/* Facebook Messenger Icon */}
              <div className="relative shrink-0 size-[48px] overflow-hidden">
                <svg className="block size-full" fill="none" viewBox="0 0 48 48">
                  <defs>
                    <radialGradient
                      id="fb_gradient"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientTransform="translate(12.38 41.08) scale(42.85)"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#1292FF" />
                      <stop offset="0.079" stopColor="#2982FF" />
                      <stop offset="0.23" stopColor="#4E69FF" />
                      <stop offset="0.351" stopColor="#6559FF" />
                      <stop offset="0.428" stopColor="#6D53FF" />
                      <stop offset="0.754" stopColor="#DF47AA" />
                      <stop offset="0.946" stopColor="#FF6257" />
                    </radialGradient>
                  </defs>
                  <path
                    d="M42 23.55C42 33.243 33.945 41.1 24 41.1C22.5141 41.1 21.075 40.9254 19.6944 40.5924C19.2759 40.4916 18.8385 40.5303 18.4533 40.7229L14.514 42.693C13.497 43.2015 12.3 42.4617 12.3 41.3241V37.7016C12.3 37.1841 12.0687 36.7017 11.6871 36.3525C8.1825 33.1485 6 28.599 6 23.55C6 13.857 14.055 6 24 6C33.945 6 42 13.857 42 23.55Z"
                    fill="url(#fb_gradient)"
                  />
                  <path
                    d="M33.36 19.0557L28.23 22.8537C27.6812 23.2677 26.9342 23.2677 26.3942 22.8627L22.8176 20.1708C21.3056 19.0458 19.1636 19.4328 18.1466 21.0168L17.0576 22.7178L13.3587 28.7298C12.8187 29.5758 13.8537 30.5388 14.6547 29.9358L19.7846 26.1378C20.3336 25.7238 21.0806 25.7238 21.6206 26.1288L25.1972 28.8207C26.7092 29.9457 28.8512 29.5587 29.8682 27.9747L30.9572 26.2737L34.6562 20.2617C35.1962 19.4157 34.1612 18.4527 33.36 19.0557Z"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[24px] py-0 relative w-full">
                    <div className="h-[52px] relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col h-full items-start justify-center relative">
                        <div className="relative shrink-0 w-full">
                          <p className="font-['Inter',sans-serif] font-normal leading-[28px] relative shrink-0 text-[#0a0a0a] text-[18px] tracking-[-0.44px]">
                            Facebook
                          </p>
                        </div>
                        <div className="relative shrink-0 w-full">
                          <p className="font-['Inter',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#6e6e6e] text-[16px] whitespace-nowrap tracking-[-0.31px]">
                            連接 Facebook 帳號
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});

export default BasicSettingsEmpty;
