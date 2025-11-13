/**
 * 會員備註編輯器 - 共用組件
 * 
 * 功能：
 * - 編輯模式切換（readOnly <-> editable）
 * - 儲存/取消按鈕（編輯時顯示）
 * - Toast 通知
 * - 自動保存本地狀態
 * 
 * Props:
 * - initialValue: 初始備註內容
 * - onSave: 儲存回調（可選，用於 API 調用）
 * - containerClassName: 外層容器自定義樣式（用於適配不同 RWD）
 * - innerClassName: 內層容器自定義樣式
 */

import { useState } from 'react';
import ButtonEdit from '../../imports/ButtonEdit';
import { useToast } from '../ToastProvider';

interface MemberNoteEditorProps {
  initialValue?: string;
  onSave?: (note: string) => Promise<void> | void;
  containerClassName?: string;
  innerClassName?: string;
  editButtonPosition?: string;
  saveButtonPosition?: string;
}

export default function MemberNoteEditor({
  initialValue = '',
  onSave,
  containerClassName = 'basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[20px] shrink-0',
  innerClassName = 'box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] pb-[72px] relative w-full',
  editButtonPosition = 'absolute bottom-[28px] right-[28px]',
  saveButtonPosition = 'absolute bottom-[20px] right-[20px]'
}: MemberNoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteValue, setNoteValue] = useState(initialValue);
  const [savedNote, setSavedNote] = useState(initialValue);
  const { showToast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
    setNoteValue(savedNote);
  };

  const handleSave = async () => {
    try {
      const trimmedNote = noteValue.trim();
      
      // 如果有提供 onSave 回調，則調用
      if (onSave) {
        await onSave(trimmedNote);
      }
      
      setSavedNote(trimmedNote);
      setNoteValue(trimmedNote);
      setIsEditing(false);
      showToast('儲存成功', 'success');
    } catch (error) {
      showToast('儲存失敗', 'error');
    }
  };

  const handleCancel = () => {
    setNoteValue(savedNote);
    setIsEditing(false);
  };

  return (
    <div className={containerClassName} data-name="Member Note Editor">
      <div className="flex flex-row justify-end min-h-inherit size-full">
        <div className={innerClassName}>
          {/* Textarea Container */}
          <div className="basis-0 content-stretch flex gap-[12px] grow items-start min-h-[96px] min-w-px relative shrink-0">
            <textarea
              value={isEditing ? noteValue : savedNote}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="輸入會員備註，如：喜好、重要紀錄或追蹤事項。"
              readOnly={!isEditing}
              className="w-full min-h-[96px] font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] resize-none outline-none bg-transparent placeholder:text-[#A8A8A8] overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'transparent transparent'
              }}
            />
          </div>

          {/* Save/Cancel Buttons - Only show when editing */}
          {isEditing && (
            <div className={saveButtonPosition}>
              <div className="content-stretch flex gap-[8px] items-end relative shrink-0">
                {/* Cancel Button - Pixel Perfect from Figma */}
                <div 
                  onClick={handleCancel}
                  className="bg-[#f0f6ff] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">取消</p>
                </div>
                {/* Save Button - Pixel Perfect from Figma */}
                <div 
                  onClick={handleSave}
                  className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:brightness-110 transition-all"
                >
                  <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">儲存</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Edit Button - Only show when not editing */}
          {!isEditing && (
            <div className={editButtonPosition}>
              <div 
                onClick={handleEdit}
                className="relative shrink-0 size-[28px] cursor-pointer hover:opacity-80 transition-opacity"
              >
                <ButtonEdit />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}