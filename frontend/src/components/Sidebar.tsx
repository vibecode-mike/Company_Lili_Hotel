import { useState, memo } from "react";
import { useAuth } from "./auth/AuthContext";
import sidebarPaths from "../imports/svg-jb10q6lg6b";
import StarbitLogo from "./StarbitLogo";
import { useNavigation } from "../contexts/NavigationContext";
import { SidebarChannelSwitcher } from "./SidebarChannelSwitcher";

const CHAT_ICON_PATH =
  "M10.002 3.3334C8.7996 3.3334 7.59712 3.38045 6.40337 3.47337C4.88253 3.5917 3.59972 4.5209 2.97889 5.8334H2.50037C2.04037 5.8334 1.66704 6.20673 1.66704 6.66673V8.3334C1.66704 8.7934 2.04037 9.16673 2.50037 9.16673H2.502C2.502 9.8259 2.53386 10.4844 2.59803 11.1394C2.79719 13.1386 4.39995 14.7034 6.40662 14.8601C7.60162 14.9526 8.80609 15.0001 10.0053 15.0001C10.5719 15.0001 11.1355 14.99 11.698 14.9691C12.158 14.9516 12.5154 14.5649 12.4987 14.1049C12.4821 13.6449 12.0919 13.2758 11.6361 13.3041C9.94695 13.3641 8.23183 13.3291 6.53683 13.1983C5.336 13.105 4.37572 12.17 4.25656 10.975C4.13739 9.77417 4.13818 8.55683 4.25818 7.35683C4.37735 6.16183 5.33441 5.22849 6.53357 5.13515C8.83691 4.95515 11.1687 4.95515 13.472 5.13515C14.6479 5.22599 15.6234 6.16837 15.7409 7.32754C15.7768 7.67504 15.8016 8.0225 15.8174 8.37083C15.8383 8.82417 16.2228 9.16851 16.6687 9.16185V9.16673H17.502C17.962 9.16673 18.3353 8.7934 18.3353 8.3334V6.66673C18.3345 6.20673 17.9604 5.8334 17.5004 5.8334H17.0267C16.4101 4.52256 15.1256 3.5917 13.6006 3.47337C12.4073 3.38045 11.2044 3.3334 10.002 3.3334ZM10.0004 6.66673C9.38735 6.66673 8.77451 6.68226 8.16118 6.71393C6.86451 6.78143 5.83787 7.84561 5.8337 9.14394V9.18952C5.83787 10.4879 6.86451 11.5504 8.16118 11.6179C9.38784 11.6812 10.6146 11.6812 11.8396 11.6179C13.1362 11.5504 14.1629 10.4879 14.167 9.18952V9.14394C14.1629 7.84561 13.1362 6.78143 11.8396 6.71393C11.2266 6.68226 10.6134 6.66673 10.0004 6.66673ZM8.3337 8.3334C8.7937 8.3334 9.16704 8.70673 9.16704 9.16673C9.16704 9.62673 8.7937 10.0001 8.3337 10.0001C7.8737 10.0001 7.50037 9.62673 7.50037 9.16673C7.50037 8.70673 7.8737 8.3334 8.3337 8.3334ZM11.667 8.3334C12.127 8.3334 12.5004 8.70673 12.5004 9.16673C12.5004 9.62673 12.127 10.0001 11.667 10.0001C11.207 10.0001 10.8337 9.62673 10.8337 9.16673C10.8337 8.70673 11.207 8.3334 11.667 8.3334ZM15.8337 10.0001C15.7695 10.0001 15.7057 10.0459 15.6791 10.1384C15.0007 12.4976 14.502 12.7524 13.4411 13.1658C13.2978 13.2216 13.2978 13.442 13.4411 13.4978C14.5011 13.9111 15.0007 14.1643 15.6791 16.5235C15.7324 16.7085 15.935 16.7085 15.9883 16.5235C16.6667 14.1643 17.1654 13.9111 18.2263 13.4978C18.3696 13.442 18.3696 13.2216 18.2263 13.1658C17.1663 12.7524 16.6667 12.4976 15.9883 10.1384C15.9617 10.0459 15.8979 10.0001 15.8337 10.0001Z";

interface SidebarProps {
  currentPage?: "messages" | "auto-reply" | "members" | "settings" | "pms" | "insights";
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPMS?: () => void;
  onNavigateToInsights?: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
  navigationLocked?: boolean;
  lockedTooltip?: string;
}

// Memoized menu item component
const MenuItem = memo(function MenuItem({
  isActive,
  label,
  onClick,
  disabled = false,
  tooltip,
}: {
  isActive: boolean;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? tooltip : undefined}
      className={`box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : isActive
            ? "bg-[#e1ebf9] hover:bg-[#d0e0f5]"
            : "hover:bg-slate-200"
      }`}
    >
      <p
        className={`text-[16px] ${isActive ? "text-[#0f6beb]" : "text-[#383838]"}`}
      >
        {label}
      </p>
    </button>
  );
});

// Memoized section header
const SectionHeader = memo(function SectionHeader({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="box-border flex gap-2 items-center p-1 min-h-[29px]">
      <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 20 20">
        <path d={icon} fill="#6E6E6E" />
      </svg>
      <p className="text-[14px] text-[#6e6e6e] leading-[1.5]">{label}</p>
    </div>
  );
});

const Sidebar = memo(
  function Sidebar({
    currentPage = "messages",
    onNavigateToMessages,
    onNavigateToAutoReply,
    onNavigateToMembers,
    onNavigateToSettings,
    onNavigateToPMS,
    onNavigateToInsights,
    sidebarOpen = true,
    onToggleSidebar,
    navigationLocked = false,
    lockedTooltip = "請先完成基本設定",
  }: SidebarProps) {
    const [internalSidebarOpen, setInternalSidebarOpen] = useState(true);
    const { logout, user } = useAuth();
    const { navigate } = useNavigation();

    // PMS navigation: use prop if provided, otherwise navigate to ai-chatbot overview
    const handleNavigateToPMS =
      onNavigateToPMS ?? (() => navigate("ai-chatbot"));

    // Use controlled or uncontrolled state
    const isOpen =
      onToggleSidebar !== undefined ? sidebarOpen : internalSidebarOpen;
    const toggleSidebar = () => {
      if (onToggleSidebar) {
        onToggleSidebar(!isOpen);
      } else {
        setInternalSidebarOpen(!isOpen);
      }
    };

    return (
      <aside
        className={`bg-slate-100 content-stretch flex flex-col h-screen items-start fixed top-0 left-0 shrink-0 ${isOpen ? "w-[330px] lg:w-[280px] md:w-[250px]" : "w-[72px]"} transition-all duration-300`}
        style={{ zIndex: 50 }}
      >
        {/* Logo & Toggle */}
        <div className="box-border flex items-center justify-between p-4 w-full">
          {isOpen && (
            <div className="content-stretch flex flex-col h-[56px] items-start justify-center overflow-clip relative shrink-0 w-[148px]">
              <StarbitLogo onClick={onNavigateToMembers} />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="overflow-clip relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
          >
            <svg className="block size-full" fill="none" viewBox="0 0 27 24">
              <rect
                height="22"
                rx="7"
                stroke="#B6C8F1"
                strokeWidth="2"
                width="24.6667"
                x="1"
                y="1"
              />
              <path
                d="M9.99992 0L9.99992 24"
                stroke="#B6C8F1"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        {/* 館別切換器（sidebar 收起時自動隱藏） */}
        <SidebarChannelSwitcher isOpen={isOpen} />

        {/* Menu Items */}
        <div className="flex-1 w-full overflow-y-auto">
          {isOpen && (
            <>
              {/* 數據洞察 Section */}
              <div className="box-border flex flex-col gap-1 px-4">
                <SectionHeader icon="M3.33333 16.6667V7.50001H6.66667V16.6667H3.33333ZM8.33333 16.6667V3.33334H11.6667V16.6667H8.33333ZM13.3333 16.6667V10.8333H16.6667V16.6667H13.3333Z" label="數據洞察" />
                <MenuItem
                  isActive={currentPage === "insights"}
                  label="數據洞察"
                  onClick={navigationLocked ? undefined : (onNavigateToInsights ?? (() => navigate("insights")))}
                  disabled={navigationLocked}
                  tooltip={lockedTooltip}
                />
              </div>

              {/* 會員 Section */}
              <div className="box-border flex flex-col gap-1 px-4 mt-5">
                <SectionHeader icon={sidebarPaths.pa54d00} label="會員" />
                <MenuItem
                  isActive={currentPage === "members"}
                  label="會員管理"
                  onClick={navigationLocked ? undefined : onNavigateToMembers}
                  disabled={navigationLocked}
                  tooltip={lockedTooltip}
                />
              </div>

              {/* 群發訊息 Section */}
              <div className="box-border flex flex-col gap-1 px-4 mt-5">
                <SectionHeader icon={sidebarPaths.p25432100} label="群發訊息" />
                <MenuItem
                  isActive={currentPage === "messages"}
                  label="活動與訊息推播"
                  onClick={navigationLocked ? undefined : onNavigateToMessages}
                  disabled={navigationLocked}
                  tooltip={lockedTooltip}
                />
              </div>

              {/* AI 功能 Section */}
              <div className="box-border flex flex-col gap-1 px-4 mt-5">
                <SectionHeader icon={CHAT_ICON_PATH} label="自動回應" />
                <MenuItem
                  isActive={
                    currentPage === "ai-chatbot" ||
                    currentPage === "pms" ||
                    currentPage === "facilities"
                  }
                  label="AI Chatbot"
                  onClick={navigationLocked ? undefined : () => navigate("ai-chatbot")}
                  disabled={navigationLocked}
                  tooltip={lockedTooltip}
                />
                <MenuItem
                  isActive={currentPage === "auto-reply"}
                  label="關鍵字回應"
                  onClick={navigationLocked ? undefined : onNavigateToAutoReply}
                  disabled={navigationLocked}
                  tooltip={lockedTooltip}
                />
              </div>

              {/* 設定 Section */}
              <div className="box-border flex flex-col gap-1 px-4 mt-5">
                <SectionHeader icon={sidebarPaths.p16734900} label="設定" />
                <MenuItem
                  isActive={currentPage === "settings"}
                  label="基本設定"
                  onClick={onNavigateToSettings}
                />
                <button
                  className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors"
                  hidden
                >
                  <p className="text-[16px] text-[#383838]">標籤管理</p>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="bg-slate-100 box-border border-t border-[#b6c8f1] flex flex-col items-start pb-[44px] pt-[12px] px-4 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="bg-white relative rounded-full shrink-0 size-[32px] flex items-center justify-center">
              <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                <path d={sidebarPaths.p1c72d580} fill="#7A9FFF" />
              </svg>
            </div>
            {isOpen && (
              <>
                <p className="flex-1 text-[16px] text-[#383838]">
                  {user?.name || "User" || "Daisy Yang"}
                </p>
                <button
                  onClick={logout}
                  className="text-[16px] text-[#0f6beb] hover:underline"
                >
                  登出
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.currentPage === nextProps.currentPage &&
      prevProps.sidebarOpen === nextProps.sidebarOpen &&
      prevProps.onNavigateToMessages === nextProps.onNavigateToMessages &&
      prevProps.onNavigateToAutoReply === nextProps.onNavigateToAutoReply &&
      prevProps.onNavigateToMembers === nextProps.onNavigateToMembers &&
      prevProps.onNavigateToSettings === nextProps.onNavigateToSettings &&
      prevProps.onNavigateToPMS === nextProps.onNavigateToPMS &&
      prevProps.onNavigateToInsights === nextProps.onNavigateToInsights &&
      prevProps.onToggleSidebar === nextProps.onToggleSidebar &&
      prevProps.navigationLocked === nextProps.navigationLocked &&
      prevProps.lockedTooltip === nextProps.lockedTooltip
    );
  },
);

export default Sidebar;

/**
 * Hook to get the margin-left value based on sidebar state
 * Use this in the main content area to offset it properly
 */
export function useSidebarMargin(sidebarOpen: boolean = true): string {
  return sidebarOpen ? "ml-[330px] lg:ml-[280px] md:ml-[250px]" : "ml-[72px]";
}

/**
 * Wrapper component for pages with sidebar
 */
interface PageWithSidebarProps {
  children: React.ReactNode;
  currentPage?: "messages" | "auto-reply" | "members" | "settings" | "pms";
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPMS?: () => void;
}

export function PageWithSidebar({
  children,
  currentPage,
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings,
  onNavigateToPMS,
}: PageWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="bg-slate-50 min-h-screen flex">
      <Sidebar
        currentPage={currentPage}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToAutoReply={onNavigateToAutoReply}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToSettings={onNavigateToSettings}
        onNavigateToPMS={onNavigateToPMS}
        defaultOpen={sidebarOpen}
      />
      <main
        className={`flex-1 bg-slate-50 transition-all duration-300 overflow-x-hidden overflow-y-auto ${sidebarOpen ? "ml-[330px] lg:ml-[280px] md:ml-[250px]" : "ml-[72px]"}`}
      >
        {children}
      </main>
    </div>
  );
}
