/**
 * 会员标签区域组件
 * 显示和管理会员的标签和互动标签
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import svgPaths from '../../imports/svg-9tjcfsdo1d';
import MemberTagEditModal from '../MemberTagEditModal';

// ========== 类型定义 ==========

export interface Tag {
  id: string;
  name: string;
}

export interface MemberTagSectionProps {
  memberTags?: Tag[];
  interactionTags?: Tag[];
  onUpdateMemberTags?: (tags: Tag[]) => void;
  onUpdateInteractionTags?: (tags: Tag[]) => void;
}

// ========== 标题组件 ==========

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[120px] relative shrink-0">
      <div className="content-stretch flex items-center relative shrink-0">
        <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
          <p className="leading-[1.5] whitespace-pre">{title}</p>
        </div>
      </div>
      <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
        <div className="absolute inset-[16.667%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ========== 标签列表组件 ==========

function TagList({ 
  tags, 
  onRemove, 
  emptyMessage = '尚無標籤' 
}: { 
  tags: Tag[]; 
  onRemove?: (tagId: string) => void;
  emptyMessage?: string;
}) {
  if (tags.length === 0) {
    return (
      <div className="flex items-center justify-center py-[16px]">
        <p className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#717182]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // 所有標籤統一使用藍色
  const tagStyle = 'bg-[#f0f6ff] text-[#0f6beb]';

  return (
    <div className="flex flex-wrap gap-[8px]">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className={`${tagStyle} px-[8px] py-[4px] rounded-[8px] flex items-center gap-[4px] text-[16px] leading-[1.5]`}
        >
          <span>{tag.name}</span>
          {onRemove && (
            <button
              onClick={() => onRemove(tag.id)}
              className="hover:opacity-70 transition-opacity"
              aria-label={`移除標籤 ${tag.name}`}
            >
              <X className="size-[16px]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ========== 主组件 ==========

export default function MemberTagSection({
  memberTags = [],
  interactionTags = [],
  onUpdateMemberTags,
  onUpdateInteractionTags,
}: MemberTagSectionProps) {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTagType, setEditingTagType] = useState<'member' | 'interaction'>('member');

  const handleOpenTagModal = (type: 'member' | 'interaction') => {
    setEditingTagType(type);
    setIsTagModalOpen(true);
  };

  const handleSaveTags = (tags: Tag[]) => {
    if (editingTagType === 'member') {
      onUpdateMemberTags?.(tags);
    } else {
      onUpdateInteractionTags?.(tags);
    }
    setIsTagModalOpen(false);
  };

  const handleRemoveMemberTag = (tagId: string) => {
    const updatedTags = memberTags.filter(tag => tag.id !== tagId);
    onUpdateMemberTags?.(updatedTags);
  };

  const handleRemoveInteractionTag = (tagId: string) => {
    const updatedTags = interactionTags.filter(tag => tag.id !== tagId);
    onUpdateInteractionTags?.(updatedTags);
  };

  return (
    <div className="p-[28px] flex flex-col gap-[24px]">
      {/* 会员标签 */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <SectionTitle title="會員標籤" />
          <button
            onClick={() => handleOpenTagModal('member')}
            className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#0f6beb] hover:underline"
          >
            編輯
          </button>
        </div>
        <TagList
          tags={memberTags}
          onRemove={handleRemoveMemberTag}
          emptyMessage="尚無會員標籤"
        />
      </div>

      {/* 分隔线 */}
      <div className="h-[1px] bg-gray-200" />

      {/* 互动标签 */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <SectionTitle title="互動標籤" />
          <button
            onClick={() => handleOpenTagModal('interaction')}
            className="font-['Noto_Sans_TC:Regular',sans-serif] text-[16px] leading-[1.5] text-[#0f6beb] hover:underline"
          >
            編輯
          </button>
        </div>
        <TagList
          tags={interactionTags}
          onRemove={handleRemoveInteractionTag}
          emptyMessage="尚無互動標籤"
        />
      </div>

      {/* 标签编辑模态框 */}
      <MemberTagEditModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSave={handleSaveTags}
        initialTags={editingTagType === 'member' ? memberTags : interactionTags}
        title={editingTagType === 'member' ? '編輯會員標籤' : '編輯互動標籤'}
      />
    </div>
  );
}
