import React, { useRef, useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

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
      <div
        className="relative rounded-[4px] overflow-hidden w-full shrink-0"
        style={{ aspectRatio }}
      >
        <ImageWithFallback
          src={value || ""}
          alt={label}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="flex gap-[8px] items-center">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || uploading}
          className="flex-1 min-w-0 h-[48px] px-[8px] rounded-[8px] bg-[#f6f9fd] border-none outline-none focus:outline-none font-['Noto_Sans_TC',sans-serif] font-normal text-[16px] leading-[1.5] text-[#383838] placeholder:text-[#a8a8a8] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="shrink-0 h-[48px] px-[12px] rounded-[8px] border border-[#d9d9d9] bg-white text-[14px] text-[#333] hover:border-[#1677ff] hover:text-[#1677ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
