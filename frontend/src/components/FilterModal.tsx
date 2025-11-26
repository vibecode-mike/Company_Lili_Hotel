import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import svgPaths from '../imports/svg-er211vihwc';
import toggleSvgPaths from '../imports/svg-eulbcts4ba';
import { Tag as TagComponent } from './common';

interface Tag {
  id: string;
  name: string;
  type?: 'member' | 'interaction';
}

interface FilterModalProps {
  onClose?: () => void;
  onConfirm?: (selectedTags: Tag[], isInclude: boolean) => void;
  initialSelectedTags?: Tag[];
  initialIsInclude?: boolean;
}

const MAX_TAGS = 20; // 标签数量上限
const MAX_TAG_LENGTH = 20; // 标签名称字符数上限

export default function FilterModal({ onClose, onConfirm, initialSelectedTags, initialIsInclude }: FilterModalProps) {
  const [memberTags, setMemberTags] = useState<Tag[]>([]);
  const [interactionTags, setInteractionTags] = useState<Tag[]>([]);
  const [activeTab, setActiveTab] = useState<'member' | 'interaction'>('member');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialSelectedTags || []);
  const [searchInput, setSearchInput] = useState('');
  const [isInclude, setIsInclude] = useState(initialIsInclude ?? true);
  const [scrollTop, setScrollTop] = useState(0);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const [scrollbarStyles, setScrollbarStyles] = useState({ top: 225, height: 60 });

  // 獲取可用標籤 API
  useEffect(() => {
    const fetchAvailableTags = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/v1/tags/available-options', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Tags API response:', result);
          const memberTagsData = result.data?.memberTags || [];
          const interactionTagsData = result.data?.interactionTags || [];

          setMemberTags(memberTagsData.map((name: string) => ({
            id: `member-${name}`,
            name,
            type: 'member' as const
          })));
          setInteractionTags(interactionTagsData.map((name: string) => ({
            id: `interaction-${name}`,
            name,
            type: 'interaction' as const
          })));
        } else {
          console.error('Tags API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableTags();
  }, []);

  // 根據當前 Tab 獲取顯示的標籤
  const displayTags = activeTab === 'member' ? memberTags : interactionTags;
  const availableTags = [...memberTags, ...interactionTags];
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  // 計算過濾後的標籤（基於當前 Tab 和搜尋條件）
  const filteredTags = searchInput.trim()
    ? displayTags.filter(tag =>
        tag.name.toLowerCase().includes(searchInput.toLowerCase()) &&
        !selectedTags.find(st => st.id === tag.id)
      )
    : displayTags.filter(tag => !selectedTags.find(st => st.id === tag.id));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchInput.trim()) {
        // Check if reached tag limit
        if (selectedTags.length >= MAX_TAGS) {
          alert(`最多只能選擇 ${MAX_TAGS} 個標籤`);
          return;
        }

        // Check tag name length
        if (searchInput.trim().length > MAX_TAG_LENGTH) {
          alert(`標籤名稱不得超過 ${MAX_TAG_LENGTH} 個字元`);
          return;
        }

        // Check if tag already exists in all available tags
        const existingTag = availableTags.find(t => t.name === searchInput.trim());
        if (existingTag && !selectedTags.find(st => st.id === existingTag.id)) {
          setSelectedTags([...selectedTags, existingTag]);
        } else if (!existingTag) {
          // Create new tag - add to current tab's type
          const newTag: Tag = {
            id: `${activeTab}-${Date.now()}`,
            name: searchInput.trim(),
            type: activeTab
          };
          // Add to both selected tags and corresponding tag list
          setSelectedTags([...selectedTags, newTag]);
          if (activeTab === 'member') {
            setMemberTags([...memberTags, newTag]);
          } else {
            setInteractionTags([...interactionTags, newTag]);
          }
        }
        setSearchInput('');
      } else {
        // If input is empty, confirm the selection
        onConfirm?.(selectedTags, isInclude);
      }
    }
  };

  // Handle Enter key to confirm selection when not in input field
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Only trigger if Enter is pressed and the input field is not focused
      const target = e.target as HTMLElement;
      if (e.key === 'Enter' && target.tagName !== 'INPUT' && !searchInput.trim()) {
        onConfirm?.(selectedTags, isInclude);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedTags, isInclude, searchInput, onConfirm]);

  const handleTagClick = (tag: Tag) => {
    // Check if reached tag limit
    if (selectedTags.length >= MAX_TAGS) {
      alert(`最多只能選擇 ${MAX_TAGS} 個標籤`);
      return;
    }

    if (!selectedTags.find(st => st.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
      setSearchInput('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId));
  };

  const isActionState = selectedTags.length > 0 || searchInput.trim().length > 0;
  const showScrollbar = displayTags.length >= 6;

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
      setScrollbarStyles({ top: 225, height: 60 });
      return;
    }
    
    const container = scrollContainerRef.current;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    
    if (scrollHeight <= clientHeight) {
      setScrollbarStyles({ top: 225, height: 60 });
      return;
    }
    
    const scrollbarTrackHeight = clientHeight;
    const scrollbarHeight = Math.max((clientHeight / scrollHeight) * scrollbarTrackHeight, 40);
    const maxScrollTop = scrollHeight - clientHeight;
    const scrollPercentage = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
    const scrollbarTop = 225 + scrollPercentage * (scrollbarTrackHeight - scrollbarHeight);
    
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
  }, [displayTags.length, scrollTop, activeTab]);

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
      const scrollPercentage = Math.max(0, Math.min(1, (mouseY - 225) / scrollableRange));
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

  const showNewTagCreation = searchInput.trim() && !displayTags.find(t => t.name.toLowerCase() === searchInput.toLowerCase());

  return (
    <div
      className="bg-white relative rounded-[16px] flex flex-col"
      style={{
        width: 'min(800px, 95vw)',
        height: 'min(600px, 85vh)',
        minHeight: '500px',
        maxHeight: '85vh'
      }}
    >
      <div className="flex flex-col h-full rounded-[16px]">
        <div className="box-border flex flex-col items-start p-[32px] relative h-full overflow-hidden">
          {/* Header Content - Fixed, never shrinks */}
          <div className="flex flex-col gap-[20px] items-start w-full flex-shrink-0 flex-grow-0">
            {/* Title */}
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[24px]">
                <p className="leading-[1.5]">篩選目標對象</p>
              </div>
              <div className="flex items-center gap-2">
                <p className={`font-['Noto_Sans_TC:Regular',_sans-serif] font-normal text-[14px] ${selectedTags.length >= MAX_TAGS ? 'text-[#f44336]' : 'text-[#6e6e6e]'}`}>
                  已選擇 {selectedTags.length} / {MAX_TAGS}
                </p>
              </div>
            </div>

            {/* Search Bar and Toggle */}
            <div className="flex flex-col sm:flex-row gap-[16px] items-stretch sm:items-start w-full">
              {/* Search Bar */}
              <div className="bg-white flex-1 min-w-0 rounded-[16px] border border-[#e1ebf9]">
                <div className="flex flex-wrap gap-[4px] items-center px-[12px] py-[8px] min-h-[48px]">
                  <IconSearch />
                  {selectedTags.map(tag => (
                    <TagComponent key={tag.id} variant="blue" onRemove={() => handleRemoveTag(tag.id)}>
                      {tag.name}
                    </TagComponent>
                  ))}
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedTags.length === 0 ? "輸入或按 Enter 新增標籤" : ""}
                    maxLength={20}
                    className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] flex-1 min-w-[120px] outline-none text-[#383838] text-[16px] placeholder:text-[#a8a8a8] bg-transparent"
                  />
                </div>
              </div>

              {/* Toggle Section */}
              <div className="flex items-center shrink-0 h-[48px]">
                <div className="flex gap-[2px] items-center">
                  <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px]">條件</p>
                  <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[#f44336] text-[16px]">*</p>
                </div>
                <div className="flex gap-[4px] items-center ml-[8px]">
                  <p className={`font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[16px] ${!isInclude ? 'text-[#383838]' : 'text-[#a8a8a8]'}`}>排除</p>
                  <div className="relative size-[40px] cursor-pointer" onClick={() => setIsInclude(!isInclude)}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
                      <g clipPath="url(#clip0_8236_31)">
                        <path
                          d={isInclude ? toggleSvgPaths.p13e42a00 : "M28.3333 11.6667H11.6667C7.06667 11.6667 3.33333 15.4 3.33333 20C3.33333 24.6 7.06667 28.3333 11.6667 28.3333H28.3333C32.9333 28.3333 36.6667 24.6 36.6667 20C36.6667 15.4 32.9333 11.6667 28.3333 11.6667ZM11.6667 25C8.9 25 6.66667 22.7667 6.66667 20C6.66667 17.2333 8.9 15 11.6667 15C14.4333 15 16.6667 17.2333 16.6667 20C16.6667 22.7667 14.4333 25 11.6667 25Z"}
                          fill="var(--fill-0, #0F6BEB)"
                          className="transition-all duration-300 ease-in-out"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_8236_31">
                          <rect fill="white" height="40" width="40" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <p className={`font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[16px] ${isInclude ? 'text-[#383838]' : 'text-[#a8a8a8]'}`}>符合</p>
                </div>
              </div>
            </div>

            {/* Tags List Label */}
            <div className="flex flex-col font-['Noto_Sans_TC:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[14px] w-full">
              <p className="leading-[1.5]">選擇或建立標籤</p>
            </div>

            {/* Tab 切換 */}
            <div className="flex gap-[24px] border-b border-[#e1ebf9] w-full">
              <button
                type="button"
                className={`pb-[8px] text-[14px] font-['Noto_Sans_TC:Regular',_sans-serif] transition-colors ${
                  activeTab === 'member'
                    ? 'text-[#0F6BEB] border-b-2 border-[#0F6BEB] -mb-[1px]'
                    : 'text-[#6e6e6e] hover:text-[#383838]'
                }`}
                onClick={() => setActiveTab('member')}
              >
                會員標籤 ({memberTags.length})
              </button>
              <button
                type="button"
                className={`pb-[8px] text-[14px] font-['Noto_Sans_TC:Regular',_sans-serif] transition-colors ${
                  activeTab === 'interaction'
                    ? 'text-[#0F6BEB] border-b-2 border-[#0F6BEB] -mb-[1px]'
                    : 'text-[#6e6e6e] hover:text-[#383838]'
                }`}
                onClick={() => setActiveTab('interaction')}
              >
                互動標籤 ({interactionTags.length})
              </button>
            </div>
          </div>

          {/* Scrollable Tags Container - fills remaining space, fixed layout */}
          <div className="flex-1 w-full mt-[12px] mb-[20px] overflow-hidden relative min-h-0">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className={`flex gap-[10px] items-start justify-start w-full h-full overflow-y-auto ${showScrollbar ? 'pr-2' : ''}`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {isLoading ? (
                // Loading state
                <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#a8a8a8] text-[16px] text-center">
                  載入中...
                </p>
              ) : displayTags.length === 0 && !searchInput.trim() ? (
                // Blank state
                <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#a8a8a8] text-[16px] text-center">
                  尚無{activeTab === 'member' ? '會員' : '互動'}標籤，於上方輸入並開始建立
                </p>
              ) : (
                <div className="flex flex-col gap-[12px] w-full">
                  {/* Show filtered tags based on current tab - wrap layout */}
                  <div className="flex flex-wrap gap-[8px] w-full">
                    {filteredTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleTagClick(tag)}
                      >
                        <TagComponent variant="blue">{tag.name}</TagComponent>
                      </div>
                    ))}
                  </div>
                  {/* Show create new tag option */}
                  {showNewTagCreation && (
                    <div className="bg-slate-50 relative rounded-[4px] shrink-0 w-full mt-[4px]">
                      <div className="flex flex-row items-center size-full">
                        <div className="box-border content-stretch flex gap-[10px] items-center px-[8px] py-[6px] relative w-full">
                          <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-center text-nowrap whitespace-pre">建立</p>
                          <TagComponent variant="blue">{searchInput}</TagComponent>
                          <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-center text-nowrap whitespace-pre">的{activeTab === 'member' ? '會員' : '互動'}標籤</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Show message when no matches found */}
                  {filteredTags.length === 0 && searchInput.trim() && !showNewTagCreation && (
                    <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] text-[#a8a8a8] text-[14px] text-center py-[16px]">
                      找不到符合的標籤
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Scrollbar - only show when >= 6 tags */}
            {showScrollbar && (
              <div 
                ref={scrollbarRef}
                className="absolute bg-[#dddddd] right-0 rounded-[4px] w-[4px] cursor-pointer hover:bg-[#b8b8b8] transition-colors"
                style={{ 
                  top: `${scrollbarStyles.top - 225}px`, 
                  height: `${scrollbarStyles.height}px` 
                }}
                onMouseDown={handleScrollbarMouseDown}
              />
            )}
          </div>

          {/* Buttons - Fixed at bottom, never shrinks */}
          <div className="content-stretch flex gap-[8px] items-center justify-center relative flex-shrink-0 flex-grow-0 w-full">
            <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-end min-h-px min-w-px relative shrink-0">
              <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-neutral-200 transition-colors" onClick={onClose}>
                <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">取消</p>
              </div>
              <div className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors" onClick={() => onConfirm?.(selectedTags, isInclude)}>
                <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">確認</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}