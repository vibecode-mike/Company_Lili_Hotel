/**
 * 刪除按鈕組件 - 全站統一
 *
 * UI 規格：
 * - 高度：48px
 * - 圓角：16px
 * - 背景：#fff5f5（淺紅色）
 * - 文字顏色：#f44336（紅色）
 * - Hover 背景：#ffebeb
 *
 * 使用場景：
 * - 刪除群發訊息（草稿/已排程）
 * - 刪除自動回應
 * - 其他需要刪除確認的場景
 *
 * 特性：
 * - 內置確認彈窗邏輯
 * - 支持異步刪除操作
 * - 支持 loading 狀態
 */

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export interface DeleteButtonProps {
  /** 刪除操作回調 */
  onDelete: () => Promise<void> | void;
  /** 被刪除項目名稱（用於彈窗描述） */
  itemName?: string;
  /** 彈窗標題 */
  title?: string;
  /** 彈窗描述 */
  description?: string;
  /** 按鈕文字（預設：刪除） */
  buttonText?: string;
  /** 自訂樣式 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

export function DeleteButton({
  onDelete,
  itemName,
  title = '確認刪除',
  description,
  buttonText = '刪除',
  className = '',
  disabled = false,
}: DeleteButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 生成預設描述
  const defaultDescription = itemName
    ? `確定要刪除「${itemName}」嗎？刪除後將無法復原。`
    : '刪除後將無法復原，確定要刪除嗎？';

  const handleClick = () => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setIsModalOpen(false);
    } catch (error) {
      // 錯誤處理由調用方處理
      console.error('刪除操作失敗:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isDeleting}
        className={`h-[48px] px-3 min-w-[72px] rounded-[16px] bg-[#fff5f5] text-[#f44336] text-[16px] font-medium transition-colors hover:bg-[#ffebeb] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-[6px] ${className}`}
      >
        <Trash2 className="h-5 w-5" />
        {buttonText}
      </button>

      <DeleteConfirmationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleConfirm}
        title={title}
        description={description || defaultDescription}
        isLoading={isDeleting}
      />
    </>
  );
}
