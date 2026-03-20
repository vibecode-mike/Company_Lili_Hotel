import React, { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../ui/alert-dialog";

interface CategoryTitleDropdownProps {
  onImport?: (file: File) => void;
  onExport?: (format: "csv" | "xls" | "xlsx") => void;
}

const ACCEPTED_FORMATS = ".csv,.xls,.xlsx";

const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M6.59 8.59L12 14.17l5.41-5.58L19 10l-7 7-7-7z"
      fill="#0f6beb"
    />
  </svg>
);

const ChevronUp = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M6.59 15.41L12 9.83l5.41 5.58L19 14l-7-7-7 7z"
      fill="#0f6beb"
    />
  </svg>
);

const EXPORT_OPTIONS: { label: string; value: "csv" | "xls" | "xlsx" }[] = [
  { label: "逗號分隔值檔案 (.csv)", value: "csv" },
  { label: "(.xls)", value: "xls" },
  { label: "(.xlsx)", value: "xlsx" },
];

export default function CategoryTitleDropdown({
  onImport,
  onExport,
}: CategoryTitleDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setConfirmOpen(true);
    }
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    if (pendingFile) {
      onImport?.(pendingFile);
    }
    setPendingFile(null);
    setConfirmOpen(false);
  };

  const handleCancelImport = () => {
    setPendingFile(null);
    setConfirmOpen(false);
  };

  const btnClass =
    "flex items-center justify-center px-[12px] py-[8px] rounded-[16px] shrink-0 self-stretch cursor-pointer hover:bg-[#f0f6ff] active:bg-[#dce8fc] transition-colors duration-150";
  const btnTextClass =
    "font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#0f6beb] text-center whitespace-nowrap";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 匯入 button */}
      <button type="button" onClick={handleImportClick} className={btnClass}>
        <span className={btnTextClass}>匯入</span>
      </button>

      {/* 匯出 button + dropdown for format */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" className={`${btnClass} gap-[2px]`}>
            <span className={btnTextClass}>匯出</span>
            {open ? <ChevronUp /> : <ChevronDown />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="min-w-[200px] bg-white rounded-[8px] border border-[#ddd] shadow-[0px_4px_12px_rgba(0,0,0,0.08)] p-[4px] z-50"
        >
          {EXPORT_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={`export-${opt.value}`}
              onClick={() => onExport?.(opt.value)}
              className="px-[12px] py-[8px] text-[14px] font-['Noto_Sans_TC',sans-serif] font-normal text-[#383838] leading-[1.5] rounded-[4px] cursor-pointer hover:bg-[#f5f5f5] outline-none"
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 匯入確認彈窗 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認匯入規則？</AlertDialogTitle>
            <AlertDialogDescription>
              匯入後將完全覆蓋並刪除目前該分類下的所有規則。此動作無法還原，請確認是否繼續？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelImport}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              確認匯入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
