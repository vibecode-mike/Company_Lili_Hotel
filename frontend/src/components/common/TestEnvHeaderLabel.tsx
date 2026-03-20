import { useState, memo } from "react";

const TestEnvHeaderLabel = memo(function TestEnvHeaderLabel() {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex items-center gap-[2px] cursor-default"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="whitespace-nowrap">加入測試環境</span>
      <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
        <circle cx="12" cy="12" r="10" fill="#9ca3af" />
        <path d="M11 7h2v2h-2zm0 4h2v6h-2z" fill="white" />
      </svg>
      {show && (
        <div
          className="absolute right-0 top-full mt-[6px] bg-[#383838] text-white text-[12px] leading-[1.5] font-['Noto_Sans_TC',sans-serif] font-normal rounded-[8px] p-[8px] w-[260px] whitespace-normal pointer-events-none"
          style={{ zIndex: 100 }}
        >
          開啟後同步至測試環境。請進行 AI Chatbot 對話測試，確認回覆正確後，再點擊「發佈」按鈕，將同步發佈至前台。
        </div>
      )}
    </div>
  );
});

export default TestEnvHeaderLabel;
