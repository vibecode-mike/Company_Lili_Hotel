import { memo } from 'react';

interface AccountLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 帳號綁定數量已達上限 Modal
 * 設計來源: Member Management_v0.1/5.png
 */
export const AccountLimitModal = memo(function AccountLimitModal({
  isOpen,
  onClose
}: AccountLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white relative rounded-[16px] w-full max-w-[800px] flex flex-col justify-center shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-[60px] items-start justify-center p-[32px] relative w-full">

          {/* Content Section */}
          <div className="flex flex-col gap-[32px] items-start relative w-full">
            {/* Title */}
            <div className="flex items-center relative w-full">
              <h2 className="font-['Noto_Sans_TC',sans-serif] font-normal text-[#383838] text-[32px] leading-[1.5]">
                帳號綁定數量已達上限
              </h2>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-[16px] items-start relative w-full">
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5]">
                如欲連結新的帳號，請聯繫系統服務商，由專人協助處理。
              </p>
            </div>
          </div>

          {/* Button Section */}
          <div className="flex gap-[8px] h-[48px] items-center justify-end relative w-full">
            <button
              onClick={onClose}
              className="bg-[#242424] flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] hover:bg-[#383838] transition-colors duration-200"
            >
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] text-center text-white leading-[1.5]">
                確定
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AccountLimitModal;
