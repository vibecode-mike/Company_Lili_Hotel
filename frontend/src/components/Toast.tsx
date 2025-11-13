import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed top-[120px] left-1/2 -translate-x-1/2 
        px-6 py-3 rounded-2xl shadow-lg 
        transition-all duration-300 z-[1000]
        ${type === 'success' ? 'bg-[#E6F7E9] text-[#1B873E]' : 'bg-[#FFECEC] text-[#D93025]'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-[20px]">
          {type === 'success' ? '✅' : '⚠️'}
        </span>
        <span className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px]">
          {message}
        </span>
      </div>
    </div>
  );
}
