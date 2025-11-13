/**
 * 目标受众选择器组件
 * 用于选择消息发送的目标受众（全部会员或特定标签）
 */

import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { X } from 'lucide-react';
import svgPaths from '../../imports/svg-jb10q6lg6b';

// ========== 类型定义 ==========

export interface Tag {
  id: string;
  name: string;
}

export interface TargetAudienceSelectorProps {
  targetType: 'all' | 'tags';
  selectedTags: Tag[];
  filterCondition: 'include' | 'exclude';
  onTargetTypeChange: (type: 'all' | 'tags') => void;
  onFilterConditionChange: (condition: 'include' | 'exclude') => void;
  onRemoveTag: (tagId: string) => void;
  onOpenFilterModal: () => void;
}

// ========== 主组件 ==========

export default function TargetAudienceSelector({
  targetType,
  selectedTags,
  filterCondition,
  onTargetTypeChange,
  onFilterConditionChange,
  onRemoveTag,
  onOpenFilterModal,
}: TargetAudienceSelectorProps) {
  return (
    <div className="flex items-start gap-4 w-full">
      {/* 标签 */}
      <Label className="min-w-[160px] pt-1 flex items-center gap-1">
        <span className="text-[16px] text-[#383838]">發送對象</span>
        <span className="text-[16px] text-[#f44336]">*</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
              <path d={svgPaths.p2cd5ff00} fill="#0F6BEB" />
            </svg>
          </TooltipTrigger>
          <TooltipContent>
            <p>選擇訊息發送對象</p>
          </TooltipContent>
        </Tooltip>
      </Label>

      {/* 选项 */}
      <RadioGroup value={targetType} onValueChange={onTargetTypeChange} className="space-y-2">
        {/* 全部会员 */}
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id="all-members" />
          <Label htmlFor="all-members" className="cursor-pointer text-[16px] text-[#383838]">
            全部會員
          </Label>
        </div>

        {/* 特定标签 */}
        <div className="flex items-start gap-2">
          <RadioGroupItem value="tags" id="specific-tags" className="mt-1" />
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="specific-tags" className="cursor-pointer text-[16px] text-[#383838]">
              指定標籤
            </Label>
            
            {targetType === 'tags' && (
              <div className="flex flex-col gap-3">
                {/* 包含/排除选择 */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filterCondition"
                      value="include"
                      checked={filterCondition === 'include'}
                      onChange={() => onFilterConditionChange('include')}
                      className="w-[16px] h-[16px]"
                    />
                    <span className="text-[16px] text-[#383838]">包含</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filterCondition"
                      value="exclude"
                      checked={filterCondition === 'exclude'}
                      onChange={() => onFilterConditionChange('exclude')}
                      className="w-[16px] h-[16px]"
                    />
                    <span className="text-[16px] text-[#383838]">排除</span>
                  </label>
                </div>

                {/* 选择标签按钮 */}
                <button
                  onClick={onOpenFilterModal}
                  className="bg-white border border-neutral-100 rounded-[8px] px-[12px] py-[8px] h-[48px] text-left hover:border-neutral-200 transition-colors"
                >
                  <span className="text-[16px] text-[#717182]">選擇標籤</span>
                </button>

                {/* 已选择的标签 */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="bg-[#f0f6ff] text-[#0f6beb] px-[8px] py-[4px] rounded-[8px] flex items-center gap-2 text-[16px] leading-[1.5]"
                      >
                        <span>{tag.name}</span>
                        <button
                          onClick={() => onRemoveTag(tag.id)}
                          className="hover:opacity-70 transition-opacity"
                          aria-label={`移除標籤 ${tag.name}`}
                        >
                          <X className="size-[16px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
