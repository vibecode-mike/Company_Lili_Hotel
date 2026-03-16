import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import svgPathsSuccess from '../imports/svg-zsmss3rzwc';
import svgPathsError from '../imports/svg-zvk2z161dz';

type ToastType = 'success' | 'error';

interface ToastMessage {
  message: React.ReactNode;
  type: ToastType;
  id: number;
}

interface ToastContextType {
  showToast: (message: React.ReactNode, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

function CheckCircleIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[16.667px]" data-name="Check circle">
      <div className="absolute inset-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector"></g>
        </svg>
      </div>
      <div className="absolute inset-[8.333%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
          <path d={svgPathsSuccess.p3f8b2200} fill="#00C853" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function CancelCircleIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[16.667px]" data-name="Cancel circle">
      <div className="absolute inset-0" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector" opacity="0.87"></g>
        </svg>
      </div>
      <div className="absolute inset-[8.333%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
          <path d={svgPathsError.p3442ad80} fill="#F44336" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Toast({ message, type, index, onClose }: { message: React.ReactNode; type: ToastType; index: number; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`bg-[#383838] rounded-[8px] cursor-pointer z-[9999] transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        boxShadow: '0px 0px 4px 0px rgba(168,168,168,0.25), 0px 1px 4px 0px rgba(221,221,221,0.25)',
        marginTop: index > 0 ? '12px' : undefined,
      }}
      data-name="Toast"
    >
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-center flex flex-wrap gap-0 items-center p-[12px] relative size-full">
          <div className="content-center flex flex-wrap gap-[8px] items-center relative shrink-0">
            {type === 'success' ? <CheckCircleIcon /> : <CancelCircleIcon />}
            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextIdRef = useRef(0);

  const showToast = useCallback((message: React.ReactNode, type: ToastType) => {
    const id = nextIdRef.current++;
    setToasts(prev => [...prev, { message, type, id }]);
  }, []);

  const handleClose = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center">
          {toasts.map((t, i) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              index={i}
              onClose={() => handleClose(t.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
