/**
 * 刪除確認彈窗組件 - 全站統一
 *
 * UI 規格：
 * - 位置：水平垂直置中（fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2）
 * - 寬度：w-[90vw] max-w-[800px]（RWD 適應）
 * - 背景遮罩：bg-black/50
 * - 確認按鈕：紅色 #f44336
 * - 取消按鈕：灰色邊框樣式
 *
 * 使用場景：
 * - 刪除群發訊息（草稿/已排程）
 * - 刪除自動回應
 * - 其他需要確認的刪除操作
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../ui/alert-dialog';

export interface DeleteConfirmationModalProps {
  /** 控制彈窗顯示 */
  open: boolean;
  /** 控制彈窗關閉 */
  onOpenChange: (open: boolean) => void;
  /** 確認刪除回調 */
  onConfirm: () => void;
  /** 標題（預設：確認刪除） */
  title?: string;
  /** 描述（預設：刪除後將無法復原，確定要刪除嗎？） */
  description?: string;
  /** 確認按鈕文字（預設：刪除） */
  confirmText?: string;
  /** 取消按鈕文字（預設：取消） */
  cancelText?: string;
  /** 是否正在刪除 */
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = '確認刪除',
  description = '刪除後將無法復原，確定要刪除嗎？',
  confirmText = '刪除',
  cancelText = '取消',
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[800px] bg-white rounded-[16px] p-[32px] shadow-lg"
      >
        <AlertDialogHeader className="gap-[16px]">
          <AlertDialogTitle className="text-[24px] font-semibold text-[#383838] text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[16px] text-[#6e6e6e] text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-center gap-[16px] mt-[24px]">
          <AlertDialogCancel
            className="h-[48px] px-[24px] min-w-[120px] rounded-[16px] border border-[#d0d5dd] bg-white text-[#383838] text-[16px] font-medium hover:bg-[#f9fafb] transition-colors"
            disabled={isLoading}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="h-[48px] px-[24px] min-w-[120px] rounded-[16px] bg-[#f44336] text-white text-[16px] font-medium hover:bg-[#d32f2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-[8px]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                刪除中...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
