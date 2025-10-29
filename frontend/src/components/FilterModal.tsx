import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import svgPaths from '../imports/svg-er211vihwc';

interface Tag {
  id: string;
  name: string;
}

interface FilterModalProps {
  onClose?: () => void;
  onConfirm?: (selectedTags: Tag[], isInclude: boolean) => void;
}

const initialTags: Tag[] = [
  // { id: '1', name: '中秋' },
  // { id: '2', name: '送禮' },
  // { id: '3', name: 'KOL' },
  // { id: '4', name: '旅遊' },
  // { id: '5', name: '減醣' },
  // { id: '6', name: '有機' },
];

export default function FilterModal({ onClose, onConfirm }: FilterModalProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [isInclude, setIsInclude] = useState(true);
  const [filteredTags, setFilteredTags] = useState<Tag[]>(initialTags);
  const [scrollTop, setScrollTop] = useState(0);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const [scrollbarStyles, setScrollbarStyles] = useState({ top: 225, height: 60 });
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (value.trim()) {
      const filtered = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(value.toLowerCase()) &&
        !selectedTags.find(st => st.id === tag.id)
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(availableTags.filter(tag => !selectedTags.find(st => st.id === tag.id)));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      // Check if tag already exists
      const existingTag = availableTags.find(t => t.name === searchInput.trim());
      if (existingTag && !selectedTags.find(st => st.id === existingTag.id)) {
        setSelectedTags([...selectedTags, existingTag]);
      } else if (!existingTag) {
        // Create new tag
        const newTag: Tag = {
          id: Date.now().toString(),
          name: searchInput.trim()
        };
        // Add to both selected tags and available tags
        setSelectedTags([...selectedTags, newTag]);
        setAvailableTags([...availableTags, newTag]);
      }
      setSearchInput('');
      setFilteredTags(availableTags.filter(tag => !selectedTags.find(st => st.id === tag.id)));
    }
  };

  // Handle Enter key to confirm selection
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Only trigger confirm if Enter is pressed and not from the input field (which handles its own Enter)
      if (e.key === 'Enter' && !searchInput.trim()) {
        onConfirm?.(selectedTags, isInclude);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedTags, isInclude, searchInput, onConfirm]);

  const handleTagClick = (tag: Tag) => {
    if (!selectedTags.find(st => st.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
      setSearchInput('');
      setFilteredTags(availableTags.filter(t => t.id !== tag.id && !selectedTags.find(st => st.id === t.id)));
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId));
  };

  const isActionState = selectedTags.length > 0 || searchInput.trim().length > 0;
  const showScrollbar = availableTags.length >= 5;

  // Handle scroll
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
      updateScrollbarStyles();
    }
  };

  // Calculate scrollbar position and height
  const updateScrollbarStyles = () => {
    if (!scrollContainerRef.current) {
      setScrollbarStyles({ top: 200, height: 60 });
      return;
    }

    const container = scrollContainerRef.current;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollTop = container.scrollTop;

    // Calculate the actual position of the scroll container from the top of the modal
    const containerRect = container.getBoundingClientRect();
    const modalElement = container.closest('.box-border.content-stretch');
    const modalRect = modalElement?.getBoundingClientRect();
    const scrollbarStartTop = modalRect ? containerRect.top - modalRect.top : 200;

    if (scrollHeight <= clientHeight) {
      setScrollbarStyles({ top: scrollbarStartTop, height: 60 });
      return;
    }

    const scrollbarTrackHeight = clientHeight;
    const scrollbarHeight = Math.max((clientHeight / scrollHeight) * scrollbarTrackHeight, 40);
    const maxScrollTop = scrollHeight - clientHeight;
    const scrollPercentage = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
    const scrollbarTop = scrollbarStartTop + scrollPercentage * (scrollbarTrackHeight - scrollbarHeight);

    setScrollbarStyles({ top: scrollbarTop, height: scrollbarHeight });
  };

  // Handle scrollbar drag
  const handleScrollbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingScrollbar(true);
  };

  // Update scrollbar when tags change
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      updateScrollbarStyles();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [availableTags.length, scrollTop]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingScrollbar || !scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const scrollbarTrackHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;
      const maxScrollTop = scrollHeight - container.clientHeight;

      // Calculate relative position within the scrollable area
      const mouseY = e.clientY - containerRect.top;
      const scrollableRange = scrollbarTrackHeight - scrollbarStyles.height;
      const scrollPercentage = Math.max(0, Math.min(1, mouseY / scrollableRange));
      const newScrollTop = scrollPercentage * maxScrollTop;

      container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
    };

    const handleMouseUp = () => {
      setIsDraggingScrollbar(false);
    };

    if (isDraggingScrollbar) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingScrollbar, scrollbarStyles.height]);

  const IconSearch = () => (
    <div className="relative shrink-0 size-[32px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <path d={svgPaths.p2bfa9080} fill="var(--fill-0, #A8A8A8)" />
      </svg>
    </div>
  );

  const CloseIcon = () => (
    <div className="relative shrink-0 size-[16px] cursor-pointer">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_1_413)">
          <path d="M11.1361 4.76248C10.9354 4.56173 10.6111 4.56173 10.4103 4.76248L7.89333 7.27434L5.37632 4.75733C5.17558 4.55659 4.8513 4.55659 4.65056 4.75733C4.44981 4.95807 4.44981 5.28235 4.65056 5.48309L7.16757 8.0001L4.65056 10.5171C4.44981 10.7179 4.44981 11.0421 4.65056 11.2429C4.8513 11.4436 5.17558 11.4436 5.37632 11.2429L7.89333 8.72587L10.4103 11.2429C10.6111 11.4436 10.9354 11.4436 11.1361 11.2429C11.3369 11.0421 11.3369 10.7179 11.1361 10.5171L8.6191 8.0001L11.1361 5.48309C11.3317 5.2875 11.3317 4.95807 11.1361 4.76248Z" fill="var(--fill-0, #A8A8A8)" />
        </g>
        <defs>
          <clipPath id="clip0_1_413">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );

  const TagComponent = ({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) => (
    <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0">
      <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">{tag.name}</p>
      {onRemove && (
        <div onClick={onRemove}>
          <CloseIcon />
        </div>
      )}
    </div>
  );

  const showNewTagCreation = searchInput.trim() && !availableTags.find(t => t.name.toLowerCase() === searchInput.toLowerCase());

  return (
    <div className="bg-white relative rounded-[16px] w-[700px] h-full overflow-hidden flex flex-col">
      <div className="w-[700px] h-full flex flex-col">
        <div className="box-border flex flex-col items-start p-[40px] relative flex-1 overflow-visible w-[700px]">
          {/* Main Content */}
          <div className="flex flex-col gap-[20px] items-start w-full flex-1">
            {/* Title */}
            <div className="content-stretch flex items-center relative shrink-0 w-full">
              <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[32px]">
                <p className="leading-[1.5]">篩選目標對象</p>
              </div>
            </div>

            {/* Search Bar and Toggle */}
            <div className="flex gap-[60px] items-center relative shrink-0 w-full overflow-visible">
              {/* Search Bar */}
              <div className="bg-white border border-neutral-200 min-h-px relative rounded-[16px] w-[280px]">
                <div className="flex flex-row items-center size-full">
                  <div className="box-border flex gap-[12px] items-center px-[12px] py-[8px] w-full">
                    <div className="flex gap-[4px] items-center flex-wrap flex-1">
                      <IconSearch />
                      {selectedTags.map(tag => (
                        <TagComponent key={tag.id} tag={tag} onRemove={() => handleRemoveTag(tag.id)} />
                      ))}
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedTags.length === 0 ? "點擊 Enter 新增標籤" : ""}
                        className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] flex-1 min-w-[150px] outline-none text-[#383838] text-[20px] placeholder:text-[#a8a8a8] bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Section */}
              <div className="flex items-center gap-[28px] relative shrink-0 w-[220px]">
                <div className="flex gap-[4px] items-center">
                  <span className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5] whitespace-nowrap">條件</span>
                  <span className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal text-[#f44336] text-[16px] leading-[1.5]">*</span>
                </div>
                <div className="flex gap-[16px] items-center whitespace-nowrap">
                  <span className={`font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[16px] whitespace-nowrap ${!isInclude ? 'text-[#383838]' : 'text-[#a8a8a8]'}`}>不包含</span>
                  <div className="relative shrink-0 size-[40px] cursor-pointer" onClick={() => setIsInclude(!isInclude)}>
                    <svg className="block size-full transition-transform duration-200" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40" style={{ transform: isInclude ? 'scaleX(1)' : 'scaleX(-1)' }}>
                      <g clipPath="url(#clip0_15_501)">
                        <path d={svgPaths.p13e42a00} fill="var(--fill-0, #0F6BEB)" />
                      </g>
                      <defs>
                        <clipPath id="clip0_15_501">
                          <rect fill="white" height="40" width="40" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <span className={`font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[16px] whitespace-nowrap ${isInclude ? 'text-[#383838]' : 'text-[#a8a8a8]'}`}>包含</span>
                </div>
              </div>
            </div>

            {/* Tags List */}
            <div className="flex flex-col gap-[12px] items-start w-full flex-1 overflow-hidden">
              <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[14px]">
                <p className="leading-[1.5]">選擇或建立標籤</p>
              </div>

              {/* Scrollable container */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className={`flex gap-[10px] items-start justify-start w-full flex-1 overflow-y-auto pr-2`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {!isActionState && availableTags.length === 0 ? (
                  // Blank state
                  <div className="flex items-center justify-center w-full h-full">
                    <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[#a8a8a8] text-[20px] text-center text-nowrap whitespace-pre">
                      尚無標<span className="tracking-[-0.2px]">籤，於上方輸入並</span>開始建立
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-[12px] w-full min-h-full">
                    {/* Show available tags or filtered results */}
                    {!isActionState ? (
                      // Normal state - show all available tags with dividers
                      <>
                        {availableTags.map((tag, index) => (
                          <div key={tag.id}>
                            <div className="content-stretch flex flex-col gap-[10px] items-start justify-center relative shrink-0 w-full cursor-pointer" onClick={() => handleTagClick(tag)}>
                              <TagComponent tag={tag} />
                            </div>
                            {index < availableTags.length - 1 && (
                              <div className="w-full h-[1px] bg-neutral-200 my-[8px]" />
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      // Action state - show filtered results and create option
                      <>
                        {filteredTags.map(tag => (
                          <div key={tag.id} className="content-stretch flex flex-col gap-[10px] items-start justify-center relative shrink-0 w-full cursor-pointer" onClick={() => handleTagClick(tag)}>
                            <TagComponent tag={tag} />
                          </div>
                        ))}
                        {showNewTagCreation && (
                          <div className="bg-slate-50 relative rounded-[4px] shrink-0 w-full">
                            <div className="flex flex-row items-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center px-[8px] py-[4px] relative w-full">
                                <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[20px] text-center text-nowrap whitespace-pre">建立</p>
                                <div className="bg-[floralwhite] box-border content-stretch flex gap-[2px] items-center justify-center min-w-[32px] p-[4px] relative rounded-[8px] shrink-0">
                                  <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#eba20f] text-[16px] text-center">{searchInput}</p>
                                </div>
                                <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[20px] text-center text-nowrap whitespace-pre">的標籤</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-[8px] items-center justify-end relative shrink-0 w-full mt-[24px]">
            <div className="flex gap-[8px] items-center justify-end">
              <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-neutral-200 transition-colors" onClick={onClose}>
                <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">取消</p>
              </div>
              <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors" onClick={() => onConfirm?.(selectedTags, isInclude)}>
                <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">確認</p>
              </div>
            </div>
          </div>

          {/* Scrollbar - only show when >= 6 tags */}
          {showScrollbar && (
            <div 
              ref={scrollbarRef}
              className="absolute bg-[#dddddd] right-[32px] rounded-[4px] w-[4px] cursor-pointer hover:bg-[#b8b8b8] transition-colors"
              style={{ 
                top: `${scrollbarStyles.top}px`, 
                height: `${scrollbarStyles.height}px` 
              }}
              onMouseDown={handleScrollbarMouseDown}
            />
          )}
        </div>
      </div>
    </div>
  );
}
