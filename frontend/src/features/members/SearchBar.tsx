import React from 'react';
import svgPaths from './svg-2wnb18j5t0';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

function SearchInput({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
      <div className="overflow-clip relative shrink-0 size-[32px]" data-name="Icon/Search">
        <div
          className="absolute h-[17.575px] left-[calc(50%-0.2px)] top-[calc(50%-0.212px)] translate-x-[-50%] translate-y-[-50%] w-[17.6px]"
          data-name="Vector"
        >
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
            <path d={svgPaths.p29b263c0} fill="var(--fill-0, #A8A8A8)" id="Vector" />
          </svg>
        </div>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="以會員資訊或標籤搜尋"
        className="font-['Noto_Sans_TC:Regular',sans-serif] leading-[1.5] flex-1 text-[#383838] text-[20px] bg-transparent border-none outline-none placeholder:text-[#dddddd]"
      />
    </div>
  );
}

export default function SearchBar({ value, onChange, onSearch, onClear }: SearchBarProps) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative size-full">
      <div className="bg-white box-border content-stretch flex gap-[28px] items-center min-w-[292px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 w-[292px]">
        <SearchInput value={value} onChange={onChange} onSearch={onSearch} />
        {value && (
          <div
            onClick={onClear}
            className="overflow-clip relative shrink-0 size-[24px] cursor-pointer hover:opacity-70 transition-opacity"
            data-name="Cancel circle"
          >
            <div className="absolute inset-0" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                <g id="Vector" opacity="0.87"></g>
              </svg>
            </div>
            <div className="absolute inset-[8.333%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <path d={svgPaths.pb584900} fill="var(--fill-0, #DDDDDD)" id="Vector" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div
        onClick={onClear}
        className="box-border content-stretch flex gap-[2px] items-center justify-center min-w-[72px] p-[8px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#f0f6ff] transition-colors"
        data-name="Button/Reanalyze"
      >
        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#0f6beb] text-[16px] text-center">
          清除全部條件
        </p>
      </div>
    </div>
  );
}

