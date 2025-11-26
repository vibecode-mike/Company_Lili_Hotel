/**
 * 聊天室主组件
 * 使用 ChatRoomLayout 构建完整的聊天室界面
 */

import type { Member } from "../types/member";
import svgPaths from "../imports/svg-9tjcfsdo1d";
import Breadcrumb from "./common/Breadcrumb";
import { ChatRoomLayout } from './chat-room';

interface ChatRoomProps {
  member: Member | undefined;
  memberId?: string;  // 支援直接傳入 memberId，用於 WebSocket 連線
  memberName?: string; // 會員名稱（用於麵包屑顯示）
  onBack: () => void;
  onNavigateToMemberDetail?: () => void; // 導航到會員詳情頁
}

// 返回按钮组件
function BackButtonWithArrow({ onClick }: { onClick: () => void }) {
  const handleClick = () => {
    console.log('[BackButton] Clicked!');
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className="content-stretch flex gap-[4px] items-center relative shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
      data-name="Button_Icon 24+Typo H6"
    >
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Arrow">
        <div className="absolute flex inset-[25.02%_36.3%_28.42%_36.27%] items-center justify-center">
          <div className="flex-none h-[6.585px] rotate-[90deg] w-[11.175px]">
            <div className="relative size-full" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                <path d={svgPaths.pc951b80} fill="var(--fill-0, #6E6E6E)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[16px] text-center text-nowrap whitespace-pre">返回</p>
      </div>
    </div>
  );
}

export default function ChatRoom({ member, memberId, memberName, onBack, onNavigateToMemberDetail }: ChatRoomProps) {
  // 顯示名稱優先順序：傳入的 memberName > member.username > member.realName > '會員'
  const displayName = memberName || member?.username || member?.realName || '會員';

  // Debug log
  console.log('[ChatRoom] Props:', {
    memberId,
    memberName,
    displayName,
    hasOnBack: !!onBack,
    hasOnNavigateToMemberDetail: !!onNavigateToMemberDetail
  });

  // 只有當 member 和 memberId 都沒有時，才顯示錯誤頁面
  // 有 memberId 時，即使 member 還沒載入，也可以先建立 WebSocket 連線
  if (!member && !memberId) {
    return (
      <div className="bg-slate-50 content-stretch flex flex-col items-start relative w-full h-full overflow-y-auto" data-name="Main Container">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[20px] text-[#383838] mb-[8px]">找不到會員資料</p>
            <p className="text-[16px] text-[#6e6e6e] mb-[20px]">請返回會員列表重新選擇</p>
            <button
              onClick={onBack}
              className="bg-[#242424] hover:bg-[#383838] text-white rounded-[16px] h-[48px] px-[24px] transition-colors"
            >
              返回會員列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 content-stretch flex flex-col items-start relative w-full h-full overflow-y-auto" data-name="Main Container">
      {/* Breadcrumb - 三層：會員管理 > 會員資訊 > 聊天 */}
      <div className="relative shrink-0 w-full">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
            <Breadcrumb
              items={[
                {
                  label: '會員管理',
                  onClick: () => {
                    console.log('[ChatRoom Breadcrumb] 會員管理 clicked');
                    onBack();
                  }
                },
                {
                  label: displayName,
                  onClick: onNavigateToMemberDetail ? () => {
                    console.log('[ChatRoom Breadcrumb] 會員詳情 clicked');
                    onNavigateToMemberDetail();
                  } : undefined
                },
                { label: '聊天', active: true }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Content - 移除返回按鈕 */}
      <div className="relative shrink-0 w-full">
        <div className="size-full">
          <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
            {/* Chat Room Layout */}
            <ChatRoomLayout member={member} memberId={memberId} onBack={onBack} />
          </div>
        </div>
      </div>
    </div>
  );
}