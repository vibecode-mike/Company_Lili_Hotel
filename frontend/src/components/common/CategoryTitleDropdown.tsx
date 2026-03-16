import React, { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

interface CategoryTitleDropdownProps {
  onImport?: (file: File) => void;
  onExport?: (format: "csv" | "xls" | "xlsx") => void;
}

const ACCEPTED_FORMATS = ".csv,.xls,.xlsx";

const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M6.59 8.59L12 14.17l5.41-5.58L19 10l-7 7-7-7z"
      fill="#383838"
    />
  </svg>
);

const ChevronUp = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M6.59 15.41L12 9.83l5.41 5.58L19 14l-7-7-7 7z"
      fill="#383838"
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    setOpen(false);
    // Small delay so the dropdown closes before the file dialog opens
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport?.(file);
    }
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        className="hidden"
        onChange={handleFileChange}
      />
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center cursor-pointer bg-transparent border-none p-0 outline-none"
            aria-label="匯入匯出選單"
          >
            {open ? <ChevronUp /> : <ChevronDown />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={4}
          className="min-w-[120px] bg-white rounded-[8px] border border-[#ddd] shadow-[0px_4px_12px_rgba(0,0,0,0.08)] p-[4px] z-50"
        >
          {/* 匯入 — directly opens file picker, no sub-menu */}
          <DropdownMenuItem
            onClick={handleImportClick}
            className="flex items-center justify-between w-full px-[12px] py-[8px] text-[14px] font-['Noto_Sans_TC',sans-serif] font-normal text-[#383838] leading-[1.5] rounded-[4px] cursor-pointer hover:bg-[#f5f5f5] outline-none"
          >
            匯入
          </DropdownMenuItem>

          {/* 匯出 — sub-menu with format options */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-[12px] py-[8px] text-[14px] font-['Noto_Sans_TC',sans-serif] font-normal text-[#383838] leading-[1.5] rounded-[4px] cursor-pointer hover:bg-[#f5f5f5] outline-none data-[state=open]:bg-[#f5f5f5]">
              匯出
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
