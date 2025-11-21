import { useState, useEffect, useMemo, KeyboardEvent } from 'react';
import svgPaths from '../imports/svg-pen3bccldb';
import { useToast } from './ToastProvider';
import { Tag } from './common';

interface MemberTagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberTags: string[];
  initialInteractionTags: string[];
  onSave: (memberTags: string[], interactionTags: string[]) => Promise<boolean>;
}

type TabType = 'member' | 'interaction';

const MAX_TAG_LENGTH = 20; // 标签名称字符数上限

export default function MemberTagEditModal({
  isOpen,
  onClose,
  initialMemberTags,
  initialInteractionTags,
  onSave,
}: MemberTagEditModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('member');
  const [searchInput, setSearchInput] = useState('');
  const [selectedMemberTags, setSelectedMemberTags] = useState<string[]>([]);
  const [selectedInteractionTags, setSelectedInteractionTags] = useState<string[]>([]);

  // Available tags from backend (dynamically loaded)
  const [allMemberTags, setAllMemberTags] = useState<string[]>([]);
  const [allInteractionTags, setAllInteractionTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Fetch available tags from backend when modal opens
  useEffect(() => {
    const fetchAvailableTags = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('請先登入', 'error');
        return;
      }

      setIsLoadingTags(true);
      try {
        const response = await fetch('/api/v1/tags/available-options', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('獲取標籤選項失敗');
        }

        const result = await response.json();
        setAllMemberTags(result.data.memberTags || []);
        setAllInteractionTags(result.data.interactionTags || []);
      } catch (error) {
        console.error('獲取標籤選項失敗:', error);
        showToast('獲取標籤選項失敗', 'error');
        // Fallback to empty arrays if API fails
        setAllMemberTags([]);
        setAllInteractionTags([]);
      } finally {
        setIsLoadingTags(false);
      }
    };

    if (isOpen) {
      setSelectedMemberTags([...initialMemberTags]);
      setSelectedInteractionTags([...initialInteractionTags]);
      setSearchInput('');
      setActiveTab('member');
      fetchAvailableTags();
    }
  }, [isOpen, initialMemberTags, initialInteractionTags, showToast]);

  const currentSelectedTags = activeTab === 'member' ? selectedMemberTags : selectedInteractionTags;
  const currentAllTags = activeTab === 'member' ? allMemberTags : allInteractionTags;

  // Fuzzy search matching
  const fuzzyMatch = (str: string, pattern: string): boolean => {
    if (!pattern) return true;
    const lowerStr = str.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    return lowerStr.includes(lowerPattern);
  };

  // Filter available tags (excluding already selected ones)
  const availableTags = useMemo(() => {
    const filteredTags = currentAllTags.filter(
      tag => !currentSelectedTags.includes(tag) && fuzzyMatch(tag, searchInput)
    );
    return filteredTags;
  }, [currentAllTags, currentSelectedTags, searchInput]);

  // Show create tag option if search input doesn't match any existing tag
  const showCreateOption = useMemo(() => {
    if (!searchInput.trim()) return false;
    const trimmedInput = searchInput.trim().toLowerCase();
    // Check if tag exists in all available tags
    const existsInAllTags = currentAllTags.some(tag => tag.toLowerCase() === trimmedInput);
    // Check if tag already selected
    const alreadySelected = currentSelectedTags.some(tag => tag.toLowerCase() === trimmedInput);
    return !existsInAllTags && !alreadySelected;
  }, [searchInput, currentAllTags, currentSelectedTags]);

  // Handle tag selection
  const handleSelectTag = (tag: string) => {
    // Double-check for duplicates (defensive programming)
    if (currentSelectedTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
      showToast('此標籤已存在', 'error');
      return;
    }
    
    if (activeTab === 'member') {
      if (selectedMemberTags.length >= 200) return;
      if (selectedMemberTags.length + selectedInteractionTags.length >= 400) return;
      setSelectedMemberTags([...selectedMemberTags, tag]);
    } else {
      if (selectedInteractionTags.length >= 200) return;
      if (selectedMemberTags.length + selectedInteractionTags.length >= 400) return;
      setSelectedInteractionTags([...selectedInteractionTags, tag]);
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tag: string) => {
    if (activeTab === 'member') {
      setSelectedMemberTags(selectedMemberTags.filter(t => t !== tag));
    } else {
      setSelectedInteractionTags(selectedInteractionTags.filter(t => t !== tag));
    }
  };

  // Handle tag creation
  const handleCreateTag = () => {
    if (!searchInput.trim()) return;

    const trimmedInput = searchInput.trim();

    // Check tag name length
    if (trimmedInput.length > MAX_TAG_LENGTH) {
      showToast(`標籤名稱不得超過 ${MAX_TAG_LENGTH} 個字元`, 'error');
      return;
    }

    // Check for duplicates (case-insensitive)
    if (currentSelectedTags.some(t => t.toLowerCase() === trimmedInput.toLowerCase())) {
      showToast('此標籤已存在', 'error');
      setSearchInput('');
      return;
    }
    
    // Check if tag exists in available tags (case-insensitive)
    if (currentAllTags.some(t => t.toLowerCase() === trimmedInput.toLowerCase())) {
      showToast('此標籤已存在', 'error');
      setSearchInput('');
      return;
    }
    
    if (activeTab === 'member') {
      if (selectedMemberTags.length >= 200) {
        showToast('會員標籤數量已達上限', 'error');
        return;
      }
      if (selectedMemberTags.length + selectedInteractionTags.length >= 400) {
        showToast('標籤總數已達上限', 'error');
        return;
      }
      setSelectedMemberTags([...selectedMemberTags, trimmedInput]);
    } else {
      if (selectedInteractionTags.length >= 200) {
        showToast('互動標籤數量已達上限', 'error');
        return;
      }
      if (selectedMemberTags.length + selectedInteractionTags.length >= 400) {
        showToast('標籤總數已達上限', 'error');
        return;
      }
      setSelectedInteractionTags([...selectedInteractionTags, trimmedInput]);
    }
    setSearchInput('');
  };

  // Handle Enter key in search input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      handleCreateTag();
    }
  };

  // Handle confirm
  const handleConfirm = async () => {
    const success = await onSave(selectedMemberTags, selectedInteractionTags);
    if (success) {
      showToast('儲存成功', 'success');
      onClose();
    } else {
      showToast('儲存失敗', 'error');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[836px] max-h-[90vh]">
        <div className="bg-white relative rounded-[16px] size-full" data-name="Member Tag#Modal">
          <div className="min-h-inherit min-w-inherit size-full">
            <div className="box-border content-stretch flex flex-col gap-[60px] items-start min-h-inherit min-w-inherit p-[32px] relative size-full">
              {/* Header */}
              <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Header">
                  <div className="basis-0 flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#383838] text-[32px]">
                    <p className="leading-[1.5]">編輯會員標籤</p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="content-stretch flex gap-[36px] items-center relative shrink-0 w-full" data-name="Container">
                  <div className="basis-0 bg-white grow min-h-px min-w-[292px] relative rounded-[16px] shrink-0" data-name="Search Bar">
                    <div className="flex flex-row items-center min-w-inherit size-full">
                      <div className="box-border content-stretch flex gap-[28px] items-center min-w-inherit px-[12px] py-[8px] relative w-full">
                        <div className="content-stretch flex gap-[4px] items-center relative grow" data-name="Search Container">
                          <div className="overflow-clip relative shrink-0 size-[32px]" data-name="Search Icon">
                            <div className="absolute h-[17.575px] left-[calc(50%-0.2px)] top-[calc(50%-0.212px)] translate-x-[-50%] translate-y-[-50%] w-[17.6px]" data-name="Vector">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                                <path d={svgPaths.p29b263c0} fill="var(--fill-0, #A8A8A8)" id="Vector" />
                              </svg>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="輸入或按 Enter 新增標籤，可多組輸入"
                            maxLength={20}
                            className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative grow text-[#383838] text-[20px] outline-none placeholder:text-[#a8a8a8]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs and Selected Tags */}
                <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
                  {/* Tabs */}
                  <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
                    
                    {/* Member Tags Tab */}
                    <div 
                      className="content-stretch flex gap-[4px] items-center relative shrink-0 cursor-pointer" 
                      data-name="Button Container"
                      onClick={() => setActiveTab('member')}
                    >
                      {activeTab === 'member' && (
                        <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
                      )}
                      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
                        <p className={`basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${activeTab === 'member' ? 'text-[#383838]' : 'text-[#6e6e6e]'}`}>
                          會員標籤
                        </p>
                      </div>
                    </div>

                    {/* Interaction Tags Tab */}
                    <div 
                      className="content-stretch flex gap-[4px] items-center relative shrink-0 cursor-pointer" 
                      data-name="Container"
                      onClick={() => setActiveTab('interaction')}
                    >
                      {activeTab === 'interaction' && (
                        <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
                      )}
                      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0" data-name="Button">
                        <p className={`basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${activeTab === 'interaction' ? 'text-[#383838]' : 'text-[#6e6e6e]'}`}>
                          互動標籤
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Tags */}
                  <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
                    <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6e6e6e] text-[14px] w-full">
                      <p className="leading-[1.5]">已選擇的標籤</p>
                    </div>
                    <div className="content-center flex flex-wrap gap-[4px] items-center relative shrink-0 w-full" data-name="Selected Tags Container">
                      {currentSelectedTags.length === 0 ? (
                        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#a8a8a8] text-[16px]">
                          尚未選擇標籤
                        </p>
                      ) : (
                        currentSelectedTags.map((tag, index) => (
                          <Tag key={index} variant="blue" onRemove={() => handleRemoveTag(tag)}>
                            {tag}
                          </Tag>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Available Tags */}
                <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
                  <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[#6e6e6e] text-[14px] w-[min-content]">
                    <p className="leading-[1.5]">選擇或建立標籤</p>
                  </div>

                  {/* Scrollable area */}
                  <div className="w-full max-h-[240px] overflow-y-auto pr-[8px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#dddddd transparent' }}>
                    <div className="content-stretch flex flex-col gap-[10px] items-start justify-center relative shrink-0 w-full">
                      {/* Create Tag Option */}
                      {showCreateOption && (
                        <div 
                          className="bg-slate-50 relative rounded-[4px] shrink-0 w-full cursor-pointer hover:bg-slate-100 transition-colors" 
                          data-name="Create Tags Container"
                          onClick={handleCreateTag}
                        >
                          <div className="flex flex-row items-center size-full">
                            <div className="box-border content-stretch flex gap-[10px] items-center px-[8px] py-[4px] relative w-full">
                              <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[20px] text-center text-nowrap whitespace-pre">
                                建立
                              </p>
                              <Tag variant="blue">{searchInput.trim()}</Tag>
                              <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[20px] text-center text-nowrap whitespace-pre">
                                的標籤
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Available Tags List */}
                      {availableTags.map((tag, index) => (
                        <div key={index}>
                          <div
                            className="content-stretch flex flex-col gap-[10px] items-start justify-center relative shrink-0 w-full cursor-pointer"
                            data-name="Tag Container"
                            onClick={() => handleSelectTag(tag)}
                          >
                            <Tag variant="blue">{tag}</Tag>
                          </div>
                          {index < availableTags.length - 1 && (
                            <div className="flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center relative shrink-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "736" } as React.CSSProperties}>
                              <div className="flex-none rotate-[270deg]">
                                <div className="h-[736px] relative w-0" data-name="Divier">
                                  <div className="absolute inset-[-0.05%_-0.4px]">
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 737">
                                      <path d="M0.4 0.4V736.4" id="Divier" stroke="var(--stroke-0, #DDDDDD)" strokeLinecap="round" strokeWidth="0.8" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {availableTags.length === 0 && !showCreateOption && (
                        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#a8a8a8] text-[16px] py-[20px]">
                          {searchInput ? '沒有符合的標籤' : '所有標籤已選擇'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="Container">
                <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-end min-h-px min-w-px relative shrink-0" data-name="Button Container">
                  <div 
                    className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-neutral-200 transition-colors" 
                    data-name="Button"
                    onClick={handleCancel}
                  >
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">
                      取消
                    </p>
                  </div>
                  <div 
                    className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:bg-[#383838] transition-colors" 
                    data-name="Button"
                    onClick={handleConfirm}
                  >
                    <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">
                      確認
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}