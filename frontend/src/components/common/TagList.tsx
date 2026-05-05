/**
 * 標籤列表
 *
 * UI 復用「編輯會員標籤」modal 內無 close button 的標籤樣式：
 * - 內部 chip：Tag component（bg-[#f0f6ff] / text-[#0f6beb]、p-[4px]、rounded-[8px]、text-[16px]）
 * - 外層容器：flex-wrap + gap-[4px]，與 modal 的標籤池相同間距
 *
 * 純展示元件，不含 onRemove/編輯互動
 */

import Tag from './Tag';

export interface TagListProps {
  /** 標籤字串陣列 */
  tags: string[];
  /** 標籤色系（預設 blue，沿用 Tag 既有定義） */
  variant?: 'blue' | 'yellow' | 'gray';
  /** 額外 class，會接到外層容器末尾 */
  className?: string;
}

export function TagList({ tags, variant = 'blue', className = '' }: TagListProps) {
  return (
    <div className={`flex flex-wrap gap-[4px] ${className}`}>
      {tags.map((tag, index) => (
        <Tag key={index} variant={variant}>{tag}</Tag>
      ))}
    </div>
  );
}

export default TagList;
