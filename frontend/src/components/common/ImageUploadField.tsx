import React, { useRef, useState } from "react";

export interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label: string;
  aspectRatio?: string;
  placeholder?: string;
}

export default function ImageUploadField({
  value,
  onChange,
  disabled = false,
  label,
  aspectRatio = "3/2",
  placeholder = "輸入圖片 URL",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("檔案大小不可超過 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/upload`,
        { method: "POST", body: formData },
      );
      const json = await res.json();
      if (json.code === 200 && json.data?.url) {
        onChange(json.data.url);
      } else {
        alert(json.message || "上傳失敗");
      }
    } catch {
      alert("上傳失敗，請稍後再試");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-[8px] w-full">
      {value && (
        <div
          className="relative rounded-[4px] overflow-hidden w-full shrink-0"
          style={{ aspectRatio }}
        >
          <img
            src={value}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="flex gap-[8px] items-center">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || uploading}
          className="flex-1 min-w-0 h-[36px] px-[12px] rounded-[4px] border border-[#d9d9d9] text-[14px] outline-none focus:border-[#1677ff] disabled:bg-[#f5f5f5] disabled:text-[#999]"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="shrink-0 h-[36px] px-[12px] rounded-[4px] border border-[#d9d9d9] bg-white text-[14px] text-[#333] hover:border-[#1677ff] hover:text-[#1677ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "上傳中..." : "上傳圖片"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-[12px] leading-[1.5] text-[#6e6e6e] px-[8px]">
        支援 JPG / PNG / GIF，上限 5MB；或直接輸入圖片 URL
      </p>
    </div>
  );
}
