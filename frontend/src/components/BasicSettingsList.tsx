import { memo, useState, useMemo } from 'react';
import { ChannelStatusBadge } from './ChannelStatusBadge';

export interface ChannelAccount {
  id: string;
  platform: 'line' | 'facebook';
  name: string;
  channelId: string;
  status: 'connected' | 'expired';
  lastVerified: string;
}

interface BasicSettingsListProps {
  accounts: ChannelAccount[];
  onAddAccount: () => void;
  onReauthorize?: (account: ChannelAccount) => void;
}

// LINE Icon Component
const LineIcon = memo(function LineIcon() {
  return (
    <svg className="block size-[24px]" fill="none" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="6" fill="#00C300" />
      <path
        d="M19.108 12.6371C19.108 9.77206 16.168 7.5 12.554 7.5C8.9405 7.5 6 9.77206 6 12.6371C6 15.266 8.3315 17.466 11.481 17.933C11.6945 17.979 11.985 18.074 12.0585 18.256C12.1245 18.4216 12.1016 18.6811 12.0795 18.8485L12.003 19.3096C11.9745 19.4751 11.8715 19.9576 12.5705 19.663C13.27 19.3686 16.345 17.4406 17.7196 15.8576C18.67 14.8166 19.125 13.7591 19.125 12.5185L19.108 12.6371ZM9.9885 14.4806H8.6865C8.497 14.4806 8.343 14.3266 8.343 14.1366V11.532C8.343 11.3426 8.497 11.1886 8.6865 11.1886C8.876 11.1886 9.03 11.3426 9.03 11.532V13.7926H9.9885C10.178 13.7926 10.332 13.9466 10.332 14.1366C10.332 14.3266 10.178 14.4806 9.9885 14.4806ZM11.335 14.1366C11.335 14.3266 11.181 14.4806 10.9915 14.4806C10.802 14.4806 10.648 14.3266 10.648 14.1366V11.532C10.648 11.3426 10.802 11.1886 10.9915 11.1886C11.181 11.1886 11.335 11.3426 11.335 11.532V14.1366ZM14.47 14.1366C14.47 14.2851 14.376 14.4161 14.235 14.4626C14.1995 14.4746 14.1625 14.4806 14.126 14.4806C14.0185 14.4806 13.916 14.4291 13.8515 14.3431L12.517 12.5256V14.1366C12.517 14.3266 12.363 14.4806 12.173 14.4806C11.9835 14.4806 11.829 14.3266 11.829 14.1366V11.532C11.829 11.3841 11.9235 11.2531 12.0641 11.2061C12.0995 11.1941 12.1361 11.1886 12.173 11.1886C12.28 11.1886 12.383 11.2401 12.4475 11.3261L13.7825 13.1436V11.532C13.7825 11.3426 13.937 11.1886 14.1265 11.1886C14.316 11.1886 14.47 11.3426 14.47 11.532V14.1366ZM16.577 12.4906C16.7665 12.4906 16.921 12.6446 16.921 12.8346C16.921 13.0241 16.767 13.1781 16.577 13.1781H15.6185V13.7931H16.577C16.7665 13.7931 16.921 13.9471 16.921 14.1366C16.921 14.3261 16.7665 14.4806 16.577 14.4806H15.275C15.086 14.4806 14.9315 14.3266 14.9315 14.1366V12.8351V12.8341V11.5336C14.9315 11.5331 14.9315 11.5331 14.9315 11.5326C14.9315 11.3431 15.0855 11.1891 15.275 11.1891H16.577C16.7665 11.1891 16.921 11.3431 16.921 11.5326C16.921 11.7221 16.767 11.8761 16.577 11.8761H15.6185V12.4911L16.577 12.4906Z"
        fill="white"
      />
    </svg>
  );
});

// Facebook Messenger Icon Component
const MessengerIcon = memo(function MessengerIcon() {
  return (
    <svg className="block size-[24px]" fill="none" viewBox="0 0 24 24">
      <defs>
        <radialGradient
          id="fb_icon_gradient"
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(6.19 20.54) scale(21.43)"
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
        d="M21 11.775C21 16.6215 16.9725 20.55 12 20.55C11.257 20.55 10.5375 20.4627 9.8472 20.2962C9.6379 20.2458 9.4192 20.2651 9.2266 20.3614L7.257 21.3465C6.7485 21.6008 6.15 21.2309 6.15 20.6621V18.8508C6.15 18.5921 6.0344 18.3509 5.8435 18.1762C4.0913 16.5742 3 14.2995 3 11.775C3 6.9285 7.0275 3 12 3C16.9725 3 21 6.9285 21 11.775Z"
        fill="url(#fb_icon_gradient)"
      />
      <path
        d="M16.68 9.52785L14.115 11.4269C13.8406 11.6339 13.4671 11.6339 13.1971 11.4314L11.4088 10.0854C10.6528 9.52285 9.5818 9.71635 9.0733 10.5084L8.5288 11.3589L6.67935 14.3649C6.40935 14.7879 6.92685 15.2694 7.32735 14.9679L9.8923 13.0689C10.1668 12.8619 10.5403 12.8619 10.8103 13.0644L12.5986 14.4104C13.3546 14.9729 14.4256 14.7794 14.9341 13.9874L15.4786 13.1369L17.3281 10.1309C17.5981 9.70785 17.0806 9.22635 16.68 9.52785Z"
        fill="white"
      />
    </svg>
  );
});

// Sort order type
type SortOrder = 'asc' | 'desc';

// 排序圖標組件 — 16x16 SVG from Figma, both arrows always visible
const SortIcon = memo(function SortIcon({ order }: { order: SortOrder }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
      <g transform="translate(1.34, 2.67)">
        <path d="M2.85381 0.195333C2.97883 0.0703528 3.14837 0.000142415 3.32514 0.000142415C3.50192 0.000142415 3.67146 0.0703528 3.79647 0.195333L6.46314 2.862C6.58458 2.98774 6.65178 3.15614 6.65026 3.33093C6.64874 3.50573 6.57863 3.67294 6.45502 3.79655C6.33142 3.92015 6.16421 3.99026 5.98941 3.99178C5.81461 3.9933 5.64621 3.92611 5.52047 3.80467L3.99181 2.276V10C3.99181 10.1768 3.92157 10.3464 3.79655 10.4714C3.67152 10.5964 3.50195 10.6667 3.32514 10.6667C3.14833 10.6667 2.97876 10.5964 2.85374 10.4714C2.72871 10.3464 2.65847 10.1768 2.65847 10V2.276L1.12981 3.80467C1.00407 3.92611 0.835672 3.9933 0.660874 3.99178C0.486076 3.99026 0.318868 3.92015 0.195262 3.79655C0.0716568 3.67294 0.00154415 3.50573 2.52018e-05 3.33093C-0.00149374 3.15614 0.0657025 2.98774 0.187141 2.862L2.85381 0.195333Z" fill={order === "asc" ? "#0f6beb" : "#9CA3AF"} />
        <path d="M9.32514 8.39067V0.666667C9.32514 0.489856 9.39538 0.320287 9.5204 0.195262C9.64543 0.070238 9.815 0 9.99181 0C10.1686 0 10.3382 0.070238 10.4632 0.195262C10.5882 0.320287 10.6585 0.489856 10.6585 0.666667V8.39067L12.1871 6.862C12.3129 6.74056 12.4813 6.67337 12.6561 6.67488C12.8309 6.6764 12.9981 6.74652 13.1217 6.87012C13.2453 6.99373 13.3154 7.16094 13.3169 7.33573C13.3184 7.51053 13.2512 7.67893 13.1298 7.80467L10.4631 10.4713C10.3381 10.5963 10.1686 10.6665 9.99181 10.6665C9.81503 10.6665 9.64549 10.5963 9.52047 10.4713L6.85381 7.80467C6.73237 7.67893 6.66517 7.51053 6.66669 7.33573C6.66821 7.16094 6.73832 6.99373 6.86193 6.87012C6.98553 6.74652 7.15274 6.6764 7.32754 6.67488C7.50234 6.67337 7.67074 6.74056 7.79647 6.862L9.32514 8.39067Z" fill={order === "desc" ? "#0f6beb" : "#9CA3AF"} />
      </g>
    </svg>
  );
});

/**
 * 基本設定帳號列表表格
 * 設計來源: Member Management_v0.1/3.png, 4.png, 6.jpg
 */
export const BasicSettingsList = memo(function BasicSettingsList({
  accounts,
  onAddAccount,
  onReauthorize
}: BasicSettingsListProps) {
  // Sort state - default to descending (newest first)
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Toggle sort order
  const handleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Sort accounts by lastVerified
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const timeA = new Date(a.lastVerified).getTime();
      const timeB = new Date(b.lastVerified).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [accounts, sortOrder]);

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

        {/* Add Account Button */}
        <div className="content-stretch flex items-center justify-end relative shrink-0 w-full mb-[24px]">
          <button
            onClick={onAddAccount}
            className="bg-[#242424] content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 hover:bg-[#383838] transition-colors duration-200"
          >
            <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[16px] text-center text-white">
              新增帳號
            </p>
          </button>
        </div>

        {/* Table */}
        <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full overflow-hidden bg-white">
          {/* 垂直滾動容器 + Sticky 表頭 */}
          <div className="max-h-[600px] overflow-y-auto table-scroll w-full">
          {/* Table Header - Sticky */}
          <div className="bg-white relative w-full border-b border-[#ddd] sticky top-0 z-10">
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex items-center pb-[12px] pt-[16px] px-[12px] relative w-full">
                {/* Column: 帳號 */}
                <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                  <div className="flex flex-row items-center size-full">
                    <div className="content-stretch flex items-center px-[12px] py-0 relative w-full">
                      <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#383838] text-[14px]">帳號</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-[12px] w-[1px] bg-[#ddd]" />

                {/* Column: 狀態 */}
                <div className="content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]">
                  <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#383838] text-[14px] whitespace-nowrap">狀態</p>
                </div>

                {/* Divider */}
                <div className="h-[12px] w-[1px] bg-[#ddd]" />

                {/* Column: Channel ID / Page ID */}
                <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                  <div className="flex flex-row items-center size-full">
                    <div className="content-stretch flex items-center px-[12px] py-0 relative w-full">
                      <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#383838] text-[14px] whitespace-nowrap">Channel ID / Page ID</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-[12px] w-[1px] bg-[#ddd]" />

                {/* Column: 最後驗證時間 */}
                <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                  <div className="flex flex-row items-center size-full">
                    <div
                      className="content-stretch flex gap-[4px] items-center px-[12px] py-0 relative w-full cursor-pointer"
                      onClick={handleSort}
                    >
                      <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#383838] text-[14px] whitespace-nowrap">最後驗證時間</p>
                      <SortIcon order={sortOrder} />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-[12px] w-[1px] bg-[#ddd]" />

                {/* Column: Actions (Spacer) */}
                <div className="content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[100px]" />
              </div>
            </div>
          </div>

          {/* Table Rows */}
          {sortedAccounts.map((account, index) => (
            <div
              key={account.id}
              className={`bg-white relative shrink-0 w-full hover:bg-[#f6f9fd] transition-colors cursor-pointer ${
                index !== sortedAccounts.length - 1 ? 'border-b border-[#ddd]' : ''
              }`}
            >
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center pb-[16px] pt-[12px] px-[12px] relative w-full">
                  {/* Account Column */}
                  <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                    <div className="flex flex-row items-center size-full">
                      <div className="content-stretch flex items-center gap-[12px] px-[12px] py-0 relative w-full">
                        {/* Icon */}
                        <div className="relative shrink-0">
                          {account.platform === 'line' ? <LineIcon /> : <MessengerIcon />}
                        </div>
                        {/* Account Info */}
                        <div className="flex flex-col font-['Noto_Sans_TC',sans-serif] font-normal text-[14px]">
                          <p className="leading-[1.5] text-[#383838]">{account.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Column */}
                  <div className="content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[180px]">
                    <ChannelStatusBadge status={account.status} platform={account.platform} />
                  </div>

                  {/* Channel ID Column */}
                  <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                    <div className="flex flex-row items-center size-full">
                      <div className="content-stretch flex items-center px-[12px] py-0 relative w-full">
                        <p className="font-['Inter',sans-serif] font-normal leading-[24px] text-[#383838] text-[14px] tracking-[0.22px]">
                          {account.channelId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Last Verified Column */}
                  <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                    <div className="flex flex-row items-center size-full">
                      <div className="content-stretch flex items-center px-[12px] py-0 relative w-full">
                        <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#383838] text-[14px]">
                          {account.lastVerified}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="content-stretch flex items-center px-[12px] py-0 relative shrink-0 w-[100px]">
                    {account.status === 'expired' && onReauthorize && (
                      <button
                        onClick={() => onReauthorize(account)}
                        className="btn-reauthorize content-stretch flex gap-[4px] items-center px-[12px] py-0 relative shrink-0 hover:opacity-80 transition-opacity"
                      >
                        <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[14px] whitespace-nowrap">
                          重新授權
                        </p>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default BasicSettingsList;
