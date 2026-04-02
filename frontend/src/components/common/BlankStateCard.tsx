import { memo } from "react";

/**
 * File icon — Google Material Design "insert_drive_file" (filled)
 * 36×36 container matching Figma node 1548:32286.
 * Single fill #DEEBFC with narrow rounded fold corner.
 */
function FileIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 0C1.35 0 0.015 1.35 0.015 3L0 27C0 28.65 1.335 30 2.985 30H21C22.65 30 24 28.65 24 27V10.245C24 9.45 23.685 8.685 23.115 8.13L15.87 0.885C15.315 0.315 14.55 0 13.755 0H3ZM13.5 9V2.25L21.75 10.5H15C14.175 10.5 13.5 9.825 13.5 9Z"
        fill="#DEEBFC"
      />
    </svg>
  );
}

/**
 * Action button with hover (#f5f9fe) and pressed states.
 * Matches Figma "Button_Hover&Pressed" nodes.
 */
function BlankActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center px-[8px] py-[8px] rounded-[8px] cursor-pointer bg-transparent border-none hover:bg-[#f5f9fe] active:bg-[#ecf2fb] transition-colors duration-150"
    >
      <span className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#0f6beb] text-[16px] text-center whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

export interface BlankStateCardProps {
  /** Primary description text */
  title: string;
  /** Secondary description in #6E6E6E (same as title) */
  description?: string;
  /** Tertiary hint text in #9C9C9C (e.g. file format hint) */
  subtitle?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
  /** Override vertical padding, e.g. "pt-[68px] pb-[68px]" */
  paddingY?: string;
}

/**
 * Single blank state card — used inside the table container
 * to indicate "no data" for a given source (PMS or FAQ).
 *
 * Matches Figma nodes: 1550:32761, 1550:32520, 1550:33307, etc.
 */
const BlankStateCard = memo(function BlankStateCard({
  title,
  description,
  subtitle,
  actionLabel,
  onAction,
  paddingY,
}: BlankStateCardProps) {
  const pyClass = paddingY || "pt-[40px] pb-[40px]";
  return (
    <div className={`flex flex-1 flex-col items-center ${pyClass} px-[12px] rounded-[4px] border border-dashed border-[#e5e7eb]`}>
      {/* Top: icon */}
      <FileIcon />
      {/* Middle: text — flex-1 so it absorbs height differences */}
      <div className="flex flex-1 flex-col gap-[2px] items-center justify-center max-w-[360px] mt-[16px] mb-[16px]">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#6e6e6e] text-[14px] text-center">
          {title}
        </p>
        {description && (
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#6e6e6e] text-[14px] text-center">
            {description}
          </p>
        )}
        {subtitle && (
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5] text-[#9c9c9c] text-[14px] text-center">
            {subtitle}
          </p>
        )}
      </div>
      {/* Bottom: button (invisible spacer when absent to keep side-by-side alignment) */}
      {actionLabel ? (
        <BlankActionButton label={actionLabel} onClick={onAction} />
      ) : !paddingY ? (
        <div className="h-[40px]" />
      ) : null}
    </div>
  );
});

export interface BlankStateContainerProps {
  children: React.ReactNode;
}

/**
 * White container that wraps one or two BlankStateCard(s).
 * Height matches Figma table blank area (256px).
 *
 * Matches Figma nodes: 1550:32759, 1550:32510, 1550:32382, 1550:33297.
 */
const BlankStateContainer = memo(function BlankStateContainer({
  children,
}: BlankStateContainerProps) {
  return (
    <div className="bg-white flex gap-[12px] items-stretch h-[256px] p-[12px] rounded-[16px] w-full">
      {children}
    </div>
  );
});

export { BlankStateCard, BlankStateContainer, BlankActionButton };
