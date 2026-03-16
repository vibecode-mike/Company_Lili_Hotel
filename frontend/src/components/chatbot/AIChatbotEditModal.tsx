/**
 * AI Chatbot 引用回覆彈窗
 * 4 種狀態：未串接PMS/已串接PMS × 未填FAQ/已填FAQ
 * 含 3 個確認 sub-dialog：儲存成功、PMS無效、確認刪除
 */
import React, { useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { apiPost } from "../../utils/apiClient";
import ImageUploadField from "../common/ImageUploadField";

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────

const IconInfo = memo(function IconInfo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="#6E6E6E"
      className="shrink-0"
    >
      <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </svg>
  );
});

const IconClose = memo(function IconClose() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M13 13l14 14M27 13L13 27"
        stroke="#383838"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomFaqDraft {
  customRoomName: string;
  customImageUrl: string;
  customPrice: string;
  customGuests: string;
  customRemaining: string;
  features: string;
  memberTags: string[];
  bookingUrl: string;
}

export interface FacilityFaqDraft {
  name: string;
  imageUrl: string;
  hours: string;
  fee: string;
  description: string;
  memberTags: string[];
}

export interface RoomPmsData {
  roomType: string;
  priceLabel: string; // e.g. "即時房價"
  guestsLabel: string; // e.g. "即時資料"
  remainingLabel: string;
  imageUrl?: string;
}

type SubDialog = "none" | "saveSuccess" | "saveFailed" | "pmsInvalid" | "confirmDelete" | "confirmLeave";

// ─── Sub-components: Section Field ───────────────────────────────────────────

const FieldLabel = memo(function FieldLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[2px]">
      <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838]">
        {label}
      </span>
      <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#f44336]">
        *
      </span>
    </div>
  );
});

const SubColLabel = memo(function SubColLabel({ label }: { label: string }) {
  return (
    <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px] py-[4px]">
      {label}
    </p>
  );
});

// Read-only PMS cell — white bg, dark text
const PmsReadCell = memo(function PmsReadCell({
  value,
  placeholder,
}: {
  value: string;
  placeholder?: boolean;
}) {
  return (
    <div className="bg-white rounded-[8px] h-[48px] flex items-center px-[8px] w-full">
      <span
        className={`font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] ${
          placeholder ? "text-[#a8a8a8]" : "text-[#383838]"
        }`}
      >
        {value}
      </span>
    </div>
  );
});

// Editable FAQ input — light blue bg
const FaqInput = memo(function FaqInput({
  value,
  placeholder,
  onChange,
  disabled,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-[#f6f9fd] rounded-[8px] h-[48px] flex items-center px-[8px] w-full font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#a8a8a8] border-none outline-none focus:outline-none disabled:opacity-60"
    />
  );
});

// Tag chips display (read + editable)
const TagsField = memo(function TagsField({
  tags,
  hasFaq,
  onChange,
  disabled,
}: {
  tags: string[];
  hasFaq: boolean;
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const [inputVal, setInputVal] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      const newTag = inputVal.trim().replace(/,$/, "");
      if (newTag && !tags.includes(newTag)) onChange([...tags, newTag]);
      setInputVal("");
    }
    if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="bg-white rounded-[8px] min-h-[48px] p-[8px] w-full flex flex-wrap gap-[4px] items-center">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-[2px] bg-[#f0f6ff] rounded-[8px] px-[4px] py-[4px] text-[16px] text-[#0f6beb] font-['Noto_Sans_TC',sans-serif] font-normal leading-[1.5]"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-[#0f6beb] hover:text-[#f44336] transition-colors ml-[1px] leading-none cursor-pointer bg-transparent border-none p-0"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={!hasFaq && tags.length === 0 ? "輸入內容" : ""}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#a8a8a8]"
        />
      )}
    </div>
  );
});

// Two-column section (PMS | FAQ)
const SplitSection = memo(function SplitSection({
  label,
  pmsValue,
  isPmsConnected,
  faqValue,
  faqPlaceholder,
  faqHint,
  pmsHint,
  onChange,
  disabled,
}: {
  label: string;
  pmsValue: string;
  isPmsConnected: boolean;
  faqValue: string;
  faqPlaceholder: string;
  faqHint?: string;
  pmsHint?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[12px] w-full">
      <FieldLabel label={label} />
      <div className="flex gap-[12px] items-start w-full">
        {/* PMS column */}
        <div className="flex flex-col flex-1 min-w-0">
          <SubColLabel label="PMS" />
          <PmsReadCell
            value={isPmsConnected ? pmsValue : "尚未串接"}
            placeholder={!isPmsConnected}
          />
          {pmsHint && isPmsConnected && (
            <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px] py-[4px]">
              {pmsHint}
            </p>
          )}
        </div>
        {/* FAQ column */}
        <div className="flex flex-col flex-1 min-w-0">
          <SubColLabel label="自訂 FAQ" />
          <FaqInput
            value={faqValue}
            placeholder={faqPlaceholder}
            onChange={onChange}
            disabled={disabled}
          />
          {faqHint && (
            <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px] py-[4px]">
              {faqHint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

// Image section (full width)
const ImageSection = memo(function ImageSection({
  imageUrl,
  inputValue,
  onChange,
  disabled,
}: {
  imageUrl?: string;
  inputValue: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[12px] w-full">
      <FieldLabel label="房型圖片" />
      <ImageUploadField
        value={imageUrl || inputValue}
        onChange={onChange}
        disabled={disabled}
        label="房型圖片"
        aspectRatio="3/2"
      />
    </div>
  );
});

// Textarea FAQ section
const TextareaSection = memo(function TextareaSection({
  label,
  value,
  placeholder,
  hint,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  placeholder: string;
  hint?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[12px] w-full">
      <FieldLabel label={label} />
      <div className="flex flex-col w-full">
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={2}
          className="bg-[#f6f9fd] rounded-[8px] min-h-[48px] px-[8px] py-[12px] w-full font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#a8a8a8] border-none outline-none focus:outline-none resize-none disabled:opacity-60"
        />
        {hint && (
          <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px] py-[4px]">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
});

// ─── Sub-dialogs ──────────────────────────────────────────────────────────────

const SmallDialog = memo(function SmallDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-[20px]"
      style={{ zIndex: 100001, backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-[800px] p-[32px] flex flex-col gap-[60px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
});

const SaveSuccessDialog = memo(function SaveSuccessDialog({
  onLater,
  onTest,
}: {
  onLater: () => void;
  onTest: () => void;
}) {
  return (
    <SmallDialog>
      <div className="flex flex-col gap-[32px]">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[32px] leading-[1.5] text-[#383838]">
          儲存成功
        </p>
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838]">
          AI Chatbot 會引用您已儲存的內容作為回覆
        </p>
      </div>
      <div className="flex gap-[8px] items-center justify-end h-[48px]">
        <button
          type="button"
          onClick={onLater}
          className="bg-[#f5f5f5] flex items-center justify-center min-h-[48px] min-w-[72px] w-[134px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#e8e8e8] transition-colors"
        >
          <span className="flex-1 font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838] text-center">
            稍後再說
          </span>
        </button>
        <button
          type="button"
          onClick={onTest}
          className="bg-[#242424] flex items-center justify-center min-h-[48px] min-w-[72px] w-[114px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#383838] transition-colors"
        >
          <span className="flex-1 font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white text-center">
            立即測試
          </span>
        </button>
      </div>
    </SmallDialog>
  );
});

const SaveFailedDialog = memo(function SaveFailedDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <SmallDialog>
      <div className="flex flex-col gap-[32px]">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[32px] leading-[1.5] text-[#383838]">
          儲存失敗
        </p>
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838]">
          請稍後再試
        </p>
      </div>
      <div className="flex gap-[8px] items-center justify-end h-[48px]">
        <button
          type="button"
          onClick={onClose}
          className="bg-[#242424] flex items-center justify-center min-h-[48px] min-w-[72px] w-[114px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#383838] transition-colors"
        >
          <span className="flex-1 font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white text-center">
            關閉
          </span>
        </button>
      </div>
    </SmallDialog>
  );
});

const ConfirmLeaveDialog = memo(function ConfirmLeaveDialog({
  onSave,
  onLeave,
}: {
  onSave: () => void;
  onLeave: () => void;
}) {
  return (
    <SmallDialog>
      <div className="flex flex-col gap-[32px]">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[32px] leading-[1.5] text-[#383838]">
          尚未儲存，確認離開？
        </p>
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838]">
          關閉此彈窗，<span className="text-[#f44336]">不會儲存此次編輯</span>
        </p>
      </div>
      <div className="flex gap-[8px] items-center justify-end h-[48px]">
        <button
          type="button"
          onClick={onSave}
          className="bg-[#242424] flex items-center justify-center min-h-[48px] min-w-[72px] w-[114px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#383838] transition-colors"
        >
          <span className="flex-1 font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white text-center">
            儲存
          </span>
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="bg-[#ffebee] flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#ffcdd2] transition-colors"
        >
          <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#f44336] text-center whitespace-nowrap">
            確認離開
          </span>
        </button>
      </div>
    </SmallDialog>
  );
});

const PmsInvalidDialog = memo(function PmsInvalidDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <SmallDialog>
      <div className="flex flex-col gap-[32px]">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[32px] leading-[1.5] text-[#383838]">
          PMS 房型代碼無效
        </p>
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5]">
          <span className="text-[#f44336]">無效的房型代碼</span>
          <span className="text-[#383838]">，請洽系統服務商協助處理</span>
        </p>
      </div>
      <div className="flex gap-[8px] items-center justify-end h-[48px]">
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#f5f5f5] flex items-center justify-center min-h-[48px] w-[134px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#e8e8e8] transition-colors"
        >
          <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838]">
            取消
          </span>
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="bg-[#242424] flex items-center justify-center min-h-[48px] w-[114px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#383838] transition-colors"
        >
          <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white">
            確認
          </span>
        </button>
      </div>
    </SmallDialog>
  );
});

const ConfirmDeleteDialog = memo(function ConfirmDeleteDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <SmallDialog>
      <div className="flex flex-col gap-[32px]">
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[32px] leading-[1.5] text-[#383838]">
          確認刪除？
        </p>
        <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5]">
          <span className="text-[#383838]">
            點擊刪除，即刪除此筆 FAQ 內容，
          </span>
          <span className="text-[#f44336]">此動作不可回復</span>
        </p>
      </div>
      <div className="flex gap-[8px] items-center justify-end h-[48px]">
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#f5f5f5] flex items-center justify-center min-h-[48px] w-[134px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#e8e8e8] transition-colors"
        >
          <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838]">
            取消
          </span>
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="bg-[#ffebee] flex items-center justify-center min-h-[48px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#ffd5d8] transition-colors"
        >
          <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#f44336] whitespace-nowrap">
            確認刪除
          </span>
        </button>
      </div>
    </SmallDialog>
  );
});

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const PmsTooltip = memo(function PmsTooltip({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute left-0 top-full mt-[6px] bg-[#383838] text-white text-[12px] leading-[1.5] font-['Noto_Sans_TC',sans-serif] font-normal rounded-[8px] p-[8px] w-[300px] pointer-events-none"
      style={{ zIndex: 100 }}
    >
      {
        "AI Chatbot 回覆將優先引用「PMS 串接」或「PMS 快照」，您仍可編輯「自訂 FAQ」作為備用回覆"
      }
    </div>
  );
});

// ─── Main Room Edit Modal ─────────────────────────────────────────────────────

interface RoomEditModalProps {
  // Data
  pmsData: RoomPmsData | null; // null = not connected
  draft: RoomFaqDraft;
  // hasFaq: determined by caller based on draft content
  hasFaq: boolean;
  // PMS code for validation
  pmsRoomCode: string;
  // Callbacks
  onClose: () => void;
  onChange: (draft: RoomFaqDraft) => void;
  onSave: (draft: RoomFaqDraft) => void;
  onDelete: () => void;
  onNavigateToPMS?: () => void;
  onOpenChatFab?: () => void;
}

export const RoomEditModal = memo(function RoomEditModal({
  pmsData,
  draft,
  hasFaq,
  pmsRoomCode,
  onClose,
  onChange,
  onSave,
  onDelete,
  onNavigateToPMS,
  onOpenChatFab,
}: RoomEditModalProps) {
  const isPmsConnected = pmsData !== null;
  const [subDialog, setSubDialog] = useState<SubDialog>("none");
  const [saving, setSaving] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const field = useCallback(
    <K extends keyof RoomFaqDraft>(key: K) =>
      (v: RoomFaqDraft[K]) =>
        onChange({ ...draft, [key]: v }),
    [draft, onChange],
  );

  const handleSave = async () => {
    setSaving(true);
    let isInvalid = false;
    if (isPmsConnected && pmsRoomCode) {
      try {
        const res = (await apiPost("/api/v1/chatbot/pms-validate-room", {
          room_code: pmsRoomCode,
        })) as any;
        isInvalid = res?.valid === false;
      } catch {
        // API 失敗不擋儲存
      }
    }
    setSaving(false);
    if (isInvalid) {
      setSubDialog("pmsInvalid");
    } else {
      try {
        onSave(draft);
        setSubDialog("saveSuccess");
      } catch {
        setSubDialog("saveFailed");
      }
    }
  };

  const handleRequestClose = () => setSubDialog("confirmLeave");

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleRequestClose();
  };

  // Determine displayed image: PMS image takes priority when connected
  const displayImage = isPmsConnected
    ? pmsData?.imageUrl || draft.customImageUrl
    : draft.customImageUrl;

  return createPortal(
    <>
      {/* Main modal overlay */}
      <div
        className="fixed inset-0 flex items-start justify-center p-[20px] overflow-y-auto"
        style={{ zIndex: 99999, backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={handleBackdrop}
      >
        <div
          className="bg-white rounded-[16px] w-full max-w-[800px] my-auto flex flex-col p-[32px] gap-[60px] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center w-full relative"
            style={{ zIndex: 1 }}
          >
            {/* Title + info icon */}
            <div className="flex items-center gap-[4px] flex-1 min-w-0 relative">
              <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[32px] leading-[1.5] text-[#383838] shrink-0">
                編輯內容
              </p>
              <button
                type="button"
                className="relative shrink-0 cursor-pointer bg-transparent border-none p-0"
                onMouseEnter={() => setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
                onClick={() => setTooltipVisible((v) => !v)}
              >
                <IconInfo />
                <PmsTooltip visible={tooltipVisible} />
              </button>
            </div>

            {/* "前往串接 PMS" — only when NOT connected */}
            {!isPmsConnected && (
              <button
                type="button"
                onClick={onNavigateToPMS}
                className="flex items-center justify-center px-[8px] py-[8px] rounded-[8px] hover:bg-[#f5f9fe] active:bg-[#f5f9fe] transition-colors cursor-pointer border-none bg-transparent shrink-0 mr-[4px]"
              >
                <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#0f6beb] whitespace-nowrap">
                  前往串接 PMS
                </span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={handleRequestClose}
              className="cursor-pointer bg-transparent border-none p-0 flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
            >
              <IconClose />
            </button>
          </div>

          {/* ── Content ── */}
          <div className="flex flex-col gap-[32px] w-full">
            {/* 房型名稱 */}
            <SplitSection
              label="房型名稱"
              isPmsConnected={isPmsConnected}
              pmsValue={pmsData?.roomType ?? ""}
              faqValue={draft.customRoomName}
              faqPlaceholder="輸入房型名稱"
              onChange={field("customRoomName")}
              disabled={saving}
            />

            {/* 房型圖片 */}
            <div className="flex flex-col gap-[12px] w-full">
              <FieldLabel label="房型圖片" />
              <ImageUploadField
                value={displayImage || ""}
                onChange={field("customImageUrl")}
                disabled={saving}
                label="房型圖片"
                aspectRatio="3/2"
              />
            </div>

            {/* 房價 */}
            <SplitSection
              label="房價"
              isPmsConnected={isPmsConnected}
              pmsValue={pmsData?.priceLabel ?? ""}
              faqValue={draft.customPrice}
              faqPlaceholder="輸入房價"
              faqHint="自訂內容為「一般房價」，非隨日期波動的「即時房價」"
              onChange={field("customPrice")}
              disabled={saving}
            />

            {/* 可入住人數 */}
            <SplitSection
              label="可入住人數"
              isPmsConnected={isPmsConnected}
              pmsValue={pmsData?.guestsLabel ?? ""}
              faqValue={draft.customGuests}
              faqPlaceholder="輸入人數"
              faqHint="可輸入 2，表示為雙人房"
              onChange={field("customGuests")}
              disabled={saving}
            />

            {/* 剩餘間數 */}
            <SplitSection
              label="剩餘間數"
              isPmsConnected={isPmsConnected}
              pmsValue={pmsData?.remainingLabel ?? ""}
              faqValue={draft.customRemaining}
              faqPlaceholder="輸入內容"
              faqHint="例：2 間、最後一間"
              onChange={field("customRemaining")}
              disabled={saving}
            />

            {/* 房型特色 */}
            <TextareaSection
              label="房型特色"
              value={draft.features}
              placeholder="輸入內容"
              hint="描述房型特色"
              onChange={field("features")}
              disabled={saving}
            />

            {/* 會員標籤 */}
            <div className="flex flex-col gap-[12px] w-full">
              <FieldLabel label="會員標籤" />
              <div className="flex flex-col w-full">
                <TagsField
                  tags={draft.memberTags}
                  hasFaq={hasFaq}
                  onChange={field("memberTags")}
                  disabled={saving}
                />
                <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px] py-[4px]">
                  為房型行銷方案與亮點建立標籤，根據互動行為對會員做精準行銷
                </p>
              </div>
            </div>

            {/* 訂房 URL */}
            <div className="flex flex-col gap-[12px] w-full">
              <FieldLabel label="訂房 URL" />
              <div className="flex flex-col w-full">
                <FaqInput
                  value={draft.bookingUrl}
                  placeholder="輸入 URL"
                  onChange={field("bookingUrl")}
                  disabled={saving}
                />
                <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px] py-[4px]">
                  輸入該房型的 URL
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex gap-[8px] items-center justify-center w-full">
            {/* Delete */}
            <button
              type="button"
              onClick={() => setSubDialog("confirmDelete")}
              disabled={saving}
              className="bg-[#ffebee] flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#ffd5d8] transition-colors disabled:opacity-50"
            >
              <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#f44336]">
                刪除
              </span>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#242424] flex items-center justify-center min-h-[48px] w-[72px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#383838] transition-colors disabled:opacity-60"
            >
              <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white">
                {saving ? "儲存中" : "儲存"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-dialogs ── */}
      {subDialog === "saveSuccess" && (
        <SaveSuccessDialog
          onLater={() => {
            setSubDialog("none");
            onClose();
          }}
          onTest={() => {
            setSubDialog("none");
            onClose();
            window.dispatchEvent(new CustomEvent("open-chatfab"));
            if (onOpenChatFab) onOpenChatFab();
          }}
        />
      )}
      {subDialog === "saveFailed" && (
        <SaveFailedDialog onClose={() => setSubDialog("none")} />
      )}
      {subDialog === "pmsInvalid" && (
        <PmsInvalidDialog
          onCancel={() => setSubDialog("none")}
          onConfirm={() => setSubDialog("none")}
        />
      )}
      {subDialog === "confirmDelete" && (
        <ConfirmDeleteDialog
          onCancel={() => setSubDialog("none")}
          onConfirm={() => {
            setSubDialog("none");
            onDelete();
            onClose();
          }}
        />
      )}
      {subDialog === "confirmLeave" && (
        <ConfirmLeaveDialog
          onSave={() => {
            setSubDialog("none");
            handleSave();
          }}
          onLeave={() => {
            setSubDialog("none");
            onClose();
          }}
        />
      )}
    </>,
    document.body,
  );
});

// ─── Facility Edit Modal ──────────────────────────────────────────────────────

interface FacilityEditModalProps {
  draft: FacilityFaqDraft;
  hasFaq: boolean;
  onClose: () => void;
  onChange: (draft: FacilityFaqDraft) => void;
  onSave: (draft: FacilityFaqDraft) => void;
  onDelete: () => void;
  onOpenChatFab?: () => void;
}

export const FacilityEditModal = memo(function FacilityEditModal({
  draft,
  hasFaq,
  onClose,
  onChange,
  onSave,
  onDelete,
  onOpenChatFab,
}: FacilityEditModalProps) {
  const [subDialog, setSubDialog] = useState<SubDialog>("none");
  const [saving, setSaving] = useState(false);

  const field = useCallback(
    <K extends keyof FacilityFaqDraft>(key: K) =>
      (v: FacilityFaqDraft[K]) =>
        onChange({ ...draft, [key]: v }),
    [draft, onChange],
  );

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    try {
      onSave(draft);
      setSubDialog("saveSuccess");
    } catch {
      setSubDialog("saveFailed");
    }
  };

  const handleRequestClose = () => setSubDialog("confirmLeave");

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleRequestClose();
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 flex items-start justify-center p-[20px] overflow-y-auto"
        style={{ zIndex: 99999, backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={handleBackdrop}
      >
        <div
          className="bg-white rounded-[16px] w-full max-w-[800px] my-auto flex flex-col p-[32px] gap-[60px] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center w-full">
            <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[32px] leading-[1.5] text-[#383838] flex-1 min-w-0 shrink-0">
              編輯內容
            </p>
            <button
              type="button"
              onClick={handleRequestClose}
              className="cursor-pointer bg-transparent border-none p-0 flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
            >
              <IconClose />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-[32px] w-full">
            {/* 設施名稱 */}
            <div className="flex flex-col gap-[12px] w-full">
              <FieldLabel label="設施名稱" />
              <FaqInput
                value={draft.name}
                placeholder="輸入設施名稱"
                onChange={field("name")}
                disabled={saving}
              />
            </div>

            {/* 設施圖片 */}
            <div className="flex flex-col gap-[12px] w-full">
              <FieldLabel label="設施圖片" />
              <ImageUploadField
                value={draft.imageUrl}
                onChange={field("imageUrl")}
                disabled={saving}
                label="設施圖片"
                aspectRatio="1264/848"
              />
            </div>

            {/* 開放時間 */}
            <div className="flex flex-col gap-[12px] w-full">
              <FieldLabel label="開放時間" />
              <FaqInput
                value={draft.hours}
                placeholder="例：06:00 – 22:00"
                onChange={field("hours")}
                disabled={saving}
              />
            </div>

            {/* 費用 */}
            <div className="flex flex-col gap-[12px] w-full">
              <FieldLabel label="費用" />
              <FaqInput
                value={draft.fee}
                placeholder="例：免費 / NT$1,800"
                onChange={field("fee")}
                disabled={saving}
              />
            </div>

            {/* 簡介 */}
            <TextareaSection
              label="簡介"
              value={draft.description}
              placeholder="輸入內容"
              hint="描述設施特色"
              onChange={field("description")}
              disabled={saving}
            />

            {/* 會員標籤 */}
            <div className="flex flex-col gap-[12px] w-full">
              <FieldLabel label="會員標籤" />
              <div className="flex flex-col w-full">
                <TagsField
                  tags={draft.memberTags}
                  hasFaq={hasFaq}
                  onChange={field("memberTags")}
                  disabled={saving}
                />
                <p className="font-['Noto_Sans_TC',sans-serif] font-normal text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px] py-[4px]">
                  為設施行銷方案與亮點建立標籤，根據互動行為對會員做精準行銷
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-[8px] items-center justify-center w-full">
            <button
              type="button"
              onClick={() => setSubDialog("confirmDelete")}
              disabled={saving}
              className="bg-[#ffebee] flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#ffd5d8] transition-colors disabled:opacity-50"
            >
              <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#f44336]">
                刪除
              </span>
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#242424] flex items-center justify-center min-h-[48px] w-[72px] px-[12px] py-[8px] rounded-[16px] cursor-pointer border-none hover:bg-[#383838] transition-colors disabled:opacity-60"
            >
              <span className="font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-white">
                {saving ? "儲存中" : "儲存"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {subDialog === "saveSuccess" && (
        <SaveSuccessDialog
          onLater={() => {
            setSubDialog("none");
            onClose();
          }}
          onTest={() => {
            setSubDialog("none");
            onClose();
            window.dispatchEvent(new CustomEvent("open-chatfab"));
            if (onOpenChatFab) onOpenChatFab();
          }}
        />
      )}
      {subDialog === "saveFailed" && (
        <SaveFailedDialog onClose={() => setSubDialog("none")} />
      )}
      {subDialog === "confirmDelete" && (
        <ConfirmDeleteDialog
          onCancel={() => setSubDialog("none")}
          onConfirm={() => {
            setSubDialog("none");
            onDelete();
            onClose();
          }}
        />
      )}
      {subDialog === "confirmLeave" && (
        <ConfirmLeaveDialog
          onSave={() => {
            setSubDialog("none");
            handleSave();
          }}
          onLeave={() => {
            setSubDialog("none");
            onClose();
          }}
        />
      )}
    </>,
    document.body,
  );
});
