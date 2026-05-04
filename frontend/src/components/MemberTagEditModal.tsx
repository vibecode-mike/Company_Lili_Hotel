import { useState, useEffect, useMemo, useRef, useLayoutEffect, KeyboardEvent, RefObject } from 'react';
import svgPaths from '../imports/svg-pen3bccldb';
import { useToast } from './ToastProvider';
import { Tag } from './common';

/**
 * Custom scrollbar：以 absolute div 自繪 scrollbar，避免依賴瀏覽器/作業系統原生 scrollbar 的可見性。
 * thumb 位置走 ref + 直接寫 style + requestAnimationFrame，避免 React 每幀 reconciliation
 * 造成的 thumb 跟不上 native scroll，視覺上能 1:1 同步 60fps。
 * 純視覺呈現（track 為 pointer-events-none，thumb 接管 mouseDown 才能拖）。
 */
function CustomScrollbar({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  const thumbRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;

    let rafId = 0;

    const apply = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (clientHeight === 0) return;
      const trackH = clientHeight;
      const thumbH = trackH / 3;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const thumbTop = maxScroll > 0 ? (scrollTop / maxScroll) * (trackH - thumbH) : 0;
      // 直接寫 DOM style 跳過 React reconciliation
      thumb.style.transform = `translateY(${thumbTop}px)`;
      thumb.style.height = `${thumbH}px`;
    };

    const schedule = () => {
      if (rafId) return; // 同一幀內多次 scroll event 合併成一次寫
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        apply();
      });
    };

    apply();
    el.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    const mo = new MutationObserver(apply);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener('scroll', schedule);
      ro.disconnect();
      mo.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [scrollRef]);

  // Drag thumb：mouseDown 起算 delta，mouseMove 即時改 scrollTop，scroll 事件再驅動 thumb 視覺更新
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = scrollRef.current;
    if (!el) return;
    const startY = e.clientY;
    const startScrollTop = el.scrollTop;
    const trackH = el.clientHeight;
    const thumbH = trackH / 3;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return; // 無 overflow 不可拖
    const ratio = maxScroll / (trackH - thumbH);

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      el.scrollTop = startScrollTop + delta * ratio;
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    // track 不接管事件（避免擋到底層 chip 點擊），thumb 自己 pointer-events-auto 才能拖
    <div
      className="absolute top-0 right-0 bottom-0"
      style={{ width: '4px', zIndex: 10, pointerEvents: 'none' }}
    >
      <div
        ref={thumbRef}
        className="absolute right-0 top-0 rounded-[4px] cursor-grab active:cursor-grabbing"
        style={{
          height: '100%',
          width: '4px',
          background: '#dddddd',
          pointerEvents: 'auto',
          willChange: 'transform',
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

interface MemberTagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberTags: string[];
  initialInteractionTags: string[];
  onSave: (memberTags: string[], interactionTags: string[]) => Promise<boolean>;
}

const MAX_TAG_LENGTH = 20; // 標籤名稱字數上限

export default function MemberTagEditModal({
  isOpen,
  onClose,
  initialMemberTags,
  initialInteractionTags,
  onSave,
}: MemberTagEditModalProps) {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const isComposingRef = useRef(false);
  const [selectedMemberTags, setSelectedMemberTags] = useState<string[]>([]);
  // interaction tags 不在此 modal 編輯，僅原值收進 state、儲存時原樣回送 backend
  const [selectedInteractionTags, setSelectedInteractionTags] = useState<string[]>([]);

  // 後端可選標籤池（會員 + 互動），互動只是接住 API 回應，不在此編輯
  const [allMemberTags, setAllMemberTags] = useState<string[]>([]);
  const [, setAllInteractionTags] = useState<string[]>([]);

  // Modal 開啟時拉取可選標籤池並重置本地狀態
  useEffect(() => {
    const fetchAvailableTags = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('請先登入', 'error');
        return;
      }

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
        setAllMemberTags([]);
        setAllInteractionTags([]);
      }
    };

    if (isOpen) {
      setSelectedMemberTags([...initialMemberTags]);
      setSelectedInteractionTags([...initialInteractionTags]);
      setSearchInput('');
      fetchAvailableTags();
    }
  }, [isOpen, initialMemberTags, initialInteractionTags, showToast]);

  // 模糊比對：子字串 case-insensitive
  const fuzzyMatch = (str: string, pattern: string): boolean => {
    if (!pattern) return true;
    return str.toLowerCase().includes(pattern.toLowerCase());
  };

  // 過濾後的可選標籤池（排除已選 + 模糊比對）
  const availableTags = useMemo(() => {
    return allMemberTags.filter(
      tag => !selectedMemberTags.includes(tag) && fuzzyMatch(tag, searchInput)
    );
  }, [allMemberTags, selectedMemberTags, searchInput]);

  // 是否要顯示「建立 X 的會員標籤」CTA
  const showCreateOption = useMemo(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    const existsInPool = allMemberTags.some(t => t.toLowerCase() === lower);
    const alreadySelected = selectedMemberTags.some(t => t.toLowerCase() === lower);
    return !existsInPool && !alreadySelected;
  }, [searchInput, allMemberTags, selectedMemberTags]);

  // 共用 scroll 容器 ref（Selected + Pool + CTA 合併成單一可滾動區，由 CustomScrollbar 自繪 thumb）
  const scrollRef = useRef<HTMLDivElement>(null);

  // 背景 scroll lock：modal 開啟時禁用 body 滾動
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleSelectTag = (tag: string) => {
    if (selectedMemberTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
      showToast('此標籤已存在', 'error');
      return;
    }
    if (selectedMemberTags.length >= 200) {
      showToast('會員標籤數量已達上限', 'error');
      return;
    }
    if (selectedMemberTags.length + selectedInteractionTags.length >= 400) {
      showToast('標籤總數已達上限', 'error');
      return;
    }
    setSelectedMemberTags([...selectedMemberTags, tag]);
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedMemberTags(selectedMemberTags.filter(t => t !== tag));
  };

  const handleCreateTag = () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_TAG_LENGTH) {
      showToast(`標籤名稱不得超過 ${MAX_TAG_LENGTH} 個字元`, 'error');
      return;
    }

    const lower = trimmed.toLowerCase();
    if (selectedMemberTags.some(t => t.toLowerCase() === lower)) {
      showToast('此標籤已存在', 'error');
      setSearchInput('');
      return;
    }
    if (allMemberTags.some(t => t.toLowerCase() === lower)) {
      showToast('此標籤已存在', 'error');
      setSearchInput('');
      return;
    }
    if (selectedMemberTags.length >= 200) {
      showToast('會員標籤數量已達上限', 'error');
      return;
    }
    if (selectedMemberTags.length + selectedInteractionTags.length >= 400) {
      showToast('標籤總數已達上限', 'error');
      return;
    }
    setSelectedMemberTags([...selectedMemberTags, trimmed]);
    setSearchInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isImeComposing = isComposingRef.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;
    if (e.key === 'Enter' && !isImeComposing && searchInput.trim()) {
      handleCreateTag();
    }
  };

  const handleConfirm = async () => {
    const success = await onSave(selectedMemberTags, selectedInteractionTags);
    if (success) {
      showToast('儲存成功', 'success');
      onClose();
    } else {
      showToast('儲存失敗', 'error');
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  // State A：全站尚無標籤池 → 只顯示單一 section（label 為「選擇或建立標籤」）
  const isStateA = allMemberTags.length === 0;
  const sectionLabel = isStateA ? '選擇或建立標籤' : '已選擇的標籤';
  const emptyPlaceholderText = isStateA
    ? '尚無標籤，於上方輸入並開始建立'
    : '尚無標籤，於上方建立標籤或下方選擇標籤';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleCancel}
      />

      {/* Modal */}
      {/* 預設 800×625；視窗不夠時兩軸都跟著縮（各保留 16px 邊距）。
          inline style 取代 Tailwind arbitrary，因為 Tailwind v4 對 min(..,calc(..)) 的 arbitrary class 不會編出 CSS。
          onWheel：補強 wheel 行為，無論游標在 modal 任何位置（Header/Search/Footer/scroll 區）都能滾。 */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] flex flex-col"
        style={{
          width: 'min(800px, calc(100vw - 32px))',
          height: 'min(625px, calc(100vh - 32px))',
        }}
        onWheel={(e) => {
          const el = scrollRef.current;
          if (!el) return;
          const maxScroll = el.scrollHeight - el.clientHeight;
          if (maxScroll <= 0) return;
          // 若游標已在 scroll 區內，瀏覽器會原生處理；這裡只補強 scroll 區外的情況
          if (el.contains(e.target as Node)) return;
          el.scrollTop = Math.max(0, Math.min(maxScroll, el.scrollTop + e.deltaY));
        }}
      >
        <div className="bg-white relative rounded-[16px] flex flex-col h-full overflow-hidden" data-name="Member Tag#Modal">
          <div className="box-border flex flex-col p-[32px] h-full overflow-hidden min-w-0">
            {/* 內容區（Header + Search + Selected + Pool）— flex-1 撐到剩餘空間，footer 用 mt-auto 釘底 */}
            <div className="flex flex-col gap-[24px] w-full flex-1 min-h-0 min-w-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center w-full" data-name="Header">
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#383838] text-[24px] leading-[1.5] flex-1">
                  編輯會員標籤
                </p>
              </div>

              {/* Search Bar — 純輸入欄，不在欄內塞 chip 以避免輸入時 input 寬度跳動 */}
              <div
                className="bg-[#f6f9fd] rounded-[8px] w-full min-h-[48px] flex items-center gap-[4px] p-[8px]"
                data-name="Search Bar"
              >
                {/* Figma 1819:29991：24×24 frame，內含 17.6×17.575 magnifier，flex 置中、保留 aspect */}
                <div className="shrink-0 flex items-center justify-center size-[24px]" data-name="Search Icon">
                  <svg
                    className="block w-[17.6px] h-[17.575px]"
                    fill="none"
                    preserveAspectRatio="xMidYMid meet"
                    viewBox="0 0 18 18"
                    data-name="Vector"
                  >
                    <path d={svgPaths.p29b263c0} fill="#A8A8A8" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  placeholder="輸入或按 Enter 新增標籤，可多組輸入"
                  maxLength={20}
                  className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] flex-1 bg-transparent text-[#383838] text-[16px] outline-none placeholder:text-[#a8a8a8] min-w-0"
                />
              </div>

              {/* 共用 scroll 容器：Selected + Pool + CTA 同一個 scroll。
                  flex-1 + maxHeight 320px：撐滿剩餘空間但不超過 320px，確保 chip 多時就會 overflow → 可拉動。 */}
              <div
                className="relative w-full"
                style={{ flex: '1 1 0%', minHeight: 0, maxHeight: '320px' }}
              >
                <div
                  ref={scrollRef}
                  className="flex flex-col gap-[24px] w-full h-full overflow-y-auto pr-[8px] no-native-scrollbar"
                >
                  {/* Selected / 單一 section（State A 顯示「選擇或建立標籤」、其餘顯示「已選擇的標籤」） */}
                  <div className="flex flex-col gap-[12px] w-full">
                    <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#6e6e6e] text-[14px] leading-[1.5]">
                      {sectionLabel}
                    </p>
                    {selectedMemberTags.length === 0 ? (
                      <div className="flex items-center justify-center min-h-[104px] w-full">
                        <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#a8a8a8] text-[16px] leading-[1.5] text-center">
                          {emptyPlaceholderText}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-[4px] w-full">
                        {selectedMemberTags.map((tag, index) => (
                          <Tag key={index} variant="blue" onRemove={() => handleRemoveTag(tag)}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pool section — 只有 State B/C/D 才出現，內含 chips + 條件 CTA */}
                  {!isStateA && (
                    <div className="flex flex-col gap-[12px] w-full">
                      <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#6e6e6e] text-[14px] leading-[1.5]">
                        選擇或建立標籤
                      </p>
                      <div className="flex flex-wrap gap-[4px] w-full">
                        {availableTags.map((tag, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectTag(tag)}
                            className="cursor-pointer"
                          >
                            <Tag variant="blue">{tag}</Tag>
                          </div>
                        ))}
                        {availableTags.length === 0 && !showCreateOption && (
                          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#a8a8a8] text-[14px] leading-[1.5] py-[8px]">
                            {searchInput ? '沒有符合的標籤' : '所有標籤已選擇'}
                          </p>
                        )}
                      </div>

                      {/* 建立 CTA：只有 showCreateOption=true 才顯示 */}
                      {showCreateOption && (
                        <div
                          onClick={handleCreateTag}
                          className="flex flex-wrap items-center gap-[4px] bg-[#fafafa] rounded-[8px] px-[8px] py-[4px] cursor-pointer hover:bg-slate-100 transition-colors min-w-0"
                          data-name="Create Tag CTA"
                        >
                          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5] shrink-0">
                            建立
                          </p>
                          <div className="min-w-0 max-w-full">
                            <Tag variant="blue">{searchInput.trim()}</Tag>
                          </div>
                          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5] shrink-0">
                            的會員標籤
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <CustomScrollbar scrollRef={scrollRef} />
                {/* 底部 mask 漸層：依 Figma 1819:30575。48px 高，180deg 由上而下：上半 50.48% 全透明，下半 49.52% 漸層至底部 #fff。 */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0"
                  style={{
                    height: '48px',
                    background:
                      'linear-gradient(180deg, rgba(255, 255, 255, 0.00) 50.48%, #FFF 100%)',
                    zIndex: 5,
                  }}
                />
              </div>
            </div>

            {/* Footer：取消 + 確認；mt-auto 釘到 modal 底部 */}
            <div className="flex items-center justify-end gap-[8px] w-full shrink-0 mt-[24px]" data-name="Footer">
              <div
                className="box-border flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={handleCancel}
              >
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-[#383838] text-[16px] leading-[1.5] text-center">
                  取消
                </p>
              </div>
              <div
                className="bg-[#242424] box-border flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] rounded-[16px] cursor-pointer hover:bg-[#383838] transition-colors"
                onClick={handleConfirm}
              >
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal text-white text-[16px] leading-[1.5] text-center">
                  確認
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
