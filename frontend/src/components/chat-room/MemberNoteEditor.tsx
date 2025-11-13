/**
 * 会员备注编辑器组件
 * - 备注编辑器
 * - 编辑/保存/取消操作
 * - 独立状态管理
 */

import { useState, useEffect } from 'react';
import type { MemberNoteEditorProps } from './types';
import { useToast } from '../ToastProvider';

export default function MemberNoteEditor({ 
  initialNote = '',
  onSave 
}: MemberNoteEditorProps) {
  const [noteInput, setNoteInput] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToast();

  // 当 initialNote 变化时更新
  useEffect(() => {
    setSavedNote(initialNote);
    setNoteInput(initialNote);
  }, [initialNote]);

  const handleEdit = () => {
    setNoteInput(savedNote);
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      const trimmedNote = noteInput.trim();
      setSavedNote(trimmedNote);
      setIsEditing(false);
      
      // 调用外部保存处理器
      onSave?.(trimmedNote);
      
      showToast('備註儲存成功', 'success');
    } catch (err) {
      showToast('備註儲存失敗', 'error');
    }
  };

  const handleCancel = () => {
    setNoteInput(savedNote);
    setIsEditing(false);
  };

  const hasChanges = noteInput !== savedNote;

  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      {/* Title */}
      <div className="content-stretch flex items-center relative shrink-0">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">備註</p>
        </div>
      </div>
      
      {/* Note textarea */}
      <div className="bg-white group relative rounded-[8px] shrink-0 w-full min-h-[120px]">
        <div 
          aria-hidden="true" 
          className={`absolute border border-solid inset-0 pointer-events-none rounded-[8px] ${
            isEditing 
              ? 'border-[#6e6e6e] border-2 group-focus-within:border-[#0f6beb]' 
              : 'border-neutral-100'
          }`} 
        />
        <div className="flex flex-col justify-start min-h-[120px] size-full">
          <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-start p-[8px] relative w-full min-h-[120px]">
            <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
              <textarea
                value={isEditing ? noteInput : savedNote}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="輸入備註內容"
                readOnly={!isEditing}
                className={`basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-[104px] min-w-px relative shrink-0 text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent border-0 outline-none w-full resize-none ${
                  !isEditing ? 'cursor-default' : ''
                }`}
                aria-label="備註內容"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-full">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="bg-[#f0f6ff] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="編輯備註"
          >
            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">編輯</p>
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="bg-[#f0f6ff] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="取消編輯"
            >
              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">取消</p>
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 transition-colors ${
                hasChanges
                  ? 'bg-[#242424] hover:bg-[#383838] cursor-pointer'
                  : 'bg-[#dddddd] cursor-not-allowed'
              }`}
              aria-label="儲存備註"
            >
              <p className={`basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${
                hasChanges ? 'text-white' : 'text-[#a8a8a8]'
              }`}>儲存</p>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
