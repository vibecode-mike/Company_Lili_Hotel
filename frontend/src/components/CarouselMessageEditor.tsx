import { useState, useRef, memo, useEffect } from 'react';
import { Plus, Upload, Copy, Trash2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import svgPaths from '../imports/svg-708vqjfcuf';
import imgImageHero from "figma:asset/68b289cb927cef11d11501fd420bb560ad25c667.png";
import { cropImage, createBlobUrl, revokeBlobUrl } from '../utils/imageCropper';
import { CAROUSEL_STRUCTURE_FIELDS } from './carouselStructure';

// Calculate aspect ratio based on card content
const calculateAspectRatio = (card: CarouselCard): "1:1" | "1.91:1" => {
  const hasContent = card.enableTitle || card.enableContent || card.enablePrice ||
                     card.enableButton1 || card.enableButton2 ||
                     card.enableButton3;
  return hasContent ? "1.91:1" : "1:1";
};

const STRUCTURE_FIELD_SET = new Set<string>(CAROUSEL_STRUCTURE_FIELDS);

export interface CarouselCard {
  id: number;
  enableImage: boolean;
  enableTitle: boolean;
  enableContent: boolean;
  enablePrice: boolean;
  enableButton1: boolean;
  enableButton2: boolean;
  enableButton3: boolean;
  enableButton4: boolean;
  image: string;             // 預覽用的 Blob URL 或已上傳的 URL
  originalFile?: File;       // 原始 File 對象（內存暫存，用於重新裁切）
  uploadedImageUrl?: string; // 最終上傳到後端的 URL（保存後才有）
  cardTitle: string;
  content: string;
  price: string;
  currency: string;
  button1: string;
  button2: string;
  button3: string;
  button4: string;
  button1Action: string;
  button1Url: string;
  button1Tag: string;
  button1Text: string;
  button1TriggerImage: File | null;
  button1Mode: 'primary' | 'secondary' | 'link';
  button1ActionType?: 'url' | 'tag';
  button1TriggerMessage?: string;
  button2Action: string;
  button2Url: string;
  button2Tag: string;
  button2Text: string;
  button2TriggerImage: File | null;
  button2Mode: 'primary' | 'secondary' | 'link';
  button2ActionType?: 'url' | 'tag';
  button2TriggerMessage?: string;
  button3Action: string;
  button3Url: string;
  button3Tag: string;
  button3Text: string;
  button3TriggerImage: File | null;
  button3Mode: 'primary' | 'secondary' | 'link';
  button3ActionType?: 'url' | 'tag';
  button3TriggerMessage?: string;
  button4Action: string;
  button4Url: string;
  button4Tag: string;
  button4Text: string;
  button4TriggerImage: File | null;
  button4Mode: 'primary' | 'secondary' | 'link';
  enableImageUrl: boolean;
  imageUrl: string;
  imageTag: string;
}

type TagFieldKey = 'button1Tag' | 'button2Tag' | 'button3Tag';

const splitTags = (value?: string) =>
  (value || '')
    .split(/[\s,，]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const joinTags = (tags: string[]) => tags.join(', ');

interface CardErrors {
  image?: string;
  cardTitle?: string;
  content?: string;
  price?: string;
  button1?: string;
  button1Url?: string;
  button2?: string;
  button2Url?: string;
  button3?: string;
  button3Url?: string;
  button4?: string;
  button4Url?: string;
}

interface CarouselMessageEditorProps {
  cards: CarouselCard[];
  activeTab: number;
  onTabChange: (tabId: number) => void;
  onAddCarousel: () => void;
  onUpdateCard: (updates: Partial<CarouselCard>) => void;
  onCopyCard?: () => void;
  onDeleteCarousel?: () => void; // 刪除輪播回調
  errors?: CardErrors; // 當前卡片的錯誤訊息
  selectedPlatform?: 'LINE' | 'Facebook' | 'Instagram';
}

// LINE Flex Message 風格的卡片預覽組件
export const FlexMessageCardPreview = memo(function FlexMessageCardPreview({ card }: { card: CarouselCard }) {
  const aspectRatio = calculateAspectRatio(card);

  return (
    <div className="bg-white rounded-[10px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] w-[300px] overflow-hidden">
      {/* Hero Image */}
      {card.enableImage && (
        <div className="w-full bg-gray-200 flex items-center justify-center overflow-hidden">
          <img
            src={card.image || imgImageHero}
            alt="卡片圖片"
            className="w-full h-auto object-cover"
            style={{ aspectRatio: aspectRatio }}
          />
        </div>
      )}

      {/* Body - Title, Content, Price */}
      {(card.enableTitle || card.enableContent || card.enablePrice) && (
        <div className="p-[16px]">
          {card.enableTitle && (
            <div
              className="text-black"
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: card.enableContent || card.enablePrice ? "8px" : "0",
                wordWrap: "break-word",
                whiteSpace: "normal"
              }}
            >
              {card.cardTitle || "標題文字"}
            </div>
          )}
          
          {card.enableContent && (
            <div
              className="text-[#666666]"
              style={{
                fontSize: "12px",
                marginBottom: card.enablePrice ? "8px" : "0",
                wordWrap: "break-word",
                whiteSpace: "normal"
              }}
            >
              {card.content || "內文文字說明"}
            </div>
          )}
          
          {card.enablePrice && (
            <div
              className="text-[#0f6beb]"
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "right"
              }}
            >
              {card.currency === 'ntd' ? 'NT$' : '$'} {card.price || "0"}
            </div>
          )}
        </div>
      )}

      {/* Footer - Buttons */}
      {(card.enableButton1 || card.enableButton2 || card.enableButton3) && (
        <div className="px-[16px] pb-[16px]" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {card.enableButton1 && (
            <button
              className={`w-full rounded-[4px] text-[14px] transition-colors text-center py-[10px] px-[16px] ${
                card.button1Mode === 'primary' 
                  ? 'bg-[#06C755] text-white hover:bg-[#05b34d]' 
                  : card.button1Mode === 'secondary'
                  ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  : 'bg-white text-[#06C755] border-2 border-[#06C755] hover:bg-gray-50'
              }`}
            >
              {card.button1 || "動作按鈕一"}
            </button>
          )}
          {card.enableButton2 && (
            <button
              className={`w-full rounded-[4px] text-[14px] transition-colors text-center py-[10px] px-[16px] ${
                card.button2Mode === 'primary' 
                  ? 'bg-[#06C755] text-white hover:bg-[#05b34d]' 
                  : card.button2Mode === 'secondary'
                  ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  : 'bg-white text-[#06C755] border-2 border-[#06C755] hover:bg-gray-50'
              }`}
            >
              {card.button2 || "動作按鈕二"}
            </button>
          )}
          {card.enableButton3 && (
            <button
              className={`w-full rounded-[4px] text-[14px] transition-colors text-center py-[10px] px-[16px] ${
                card.button3Mode === 'primary'
                  ? 'bg-[#06C755] text-white hover:bg-[#05b34d]'
                  : card.button3Mode === 'secondary'
                  ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  : 'bg-white text-[#06C755] border-2 border-[#06C755] hover:bg-gray-50'
              }`}
            >
              {card.button3 || "動作按鈕三"}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default function CarouselMessageEditor({
  cards,
  activeTab,
  onTabChange,
  onAddCarousel,
  onUpdateCard,
  onCopyCard,
  onDeleteCarousel,
  errors,
  selectedPlatform = 'LINE'
}: CarouselMessageEditorProps) {
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const currentCard = cards.find(c => c.id === activeTab) || cards[0];
  const prevAspectRatioRef = useRef<"1:1" | "1.91:1" | null>(null);
  const masterCardId = cards[0]?.id;
  const isMasterCard = currentCard?.id === masterCardId;
  const structureLocked = !isMasterCard;
  const [tagInputState, setTagInputState] = useState<Record<TagFieldKey, string>>({
    button1Tag: '',
    button2Tag: '',
    button3Tag: ''
  });

  useEffect(() => {
    setTagInputState({
      button1Tag: '',
      button2Tag: '',
      button3Tag: ''
    });
  }, [activeTab]);

  const renderTagInput = (
    field: TagFieldKey,
    placeholder: string,
    helperText?: string
  ) => {
    const tags = splitTags(currentCard?.[field]);
    const inputValue = tagInputState[field] || '';

    const addTag = () => {
      const newTag = inputValue.trim();
      if (!newTag) return;

      // 檢查重複標籤
      if (tags.includes(newTag)) {
        toast.warning(`標籤「${newTag}」已存在`);
        setTagInputState(prev => ({ ...prev, [field]: '' }));
        return;
      }

      const nextTags = [...tags, newTag];
      onUpdateCard({ [field]: joinTags(nextTags) } as Partial<CarouselCard>);
      setTagInputState(prev => ({ ...prev, [field]: '' }));
    };

    const removeTag = (tagToRemove: string) => {
      const nextTags = tags.filter(tag => tag !== tagToRemove);
      onUpdateCard({ [field]: joinTags(nextTags) } as Partial<CarouselCard>);
    };

    return (
      <div className="flex flex-col gap-[4px]">
        <div className="flex flex-wrap gap-[6px] items-center min-h-[44px] w-full px-[12px] py-[8px] rounded-[8px] border border-neutral-200 bg-white">
          {tags.map(tag => (
            <div key={tag} className="flex items-center gap-[4px] bg-[#f0f6ff] text-[#0f6beb] text-[12px] px-[8px] py-[4px] rounded-[6px]">
              <span className="leading-[16px]">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-[#a8a8a8] hover:text-[#6a6a6a] leading-none"
                aria-label={`刪除標籤 ${tag}`}
              >
                ×
              </button>
            </div>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setTagInputState(prev => ({ ...prev, [field]: e.target.value }))}
            onKeyDown={(e) => {
              const isImeComposing = isComposingRef.current || (e.nativeEvent as any).isComposing;
              if (e.key === 'Enter' && !isImeComposing) {
                e.preventDefault();
                addTag();
              }
            }}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            placeholder={tags.length === 0 ? placeholder : '按 Enter 新增標籤'}
            maxLength={50}
            className="flex-1 min-w-[120px] bg-transparent text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none"
          />
        </div>
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  };

  const preventStructureEdit = () => {
    if (structureLocked) {
      toast.info('請在輪播 1 調整此欄位');
      return true;
    }
    return false;
  };

  // 計算卡片顯示編號（基於陣列索引）
  const getCardDisplayNumber = (cardId: number): number => {
    const index = cards.findIndex(c => c.id === cardId);
    return index === -1 ? 1 : index + 1;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 驗證文件類型
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('檔案格式錯誤，請上傳 JPG、JPEG 或 PNG 格式的圖片');
        return;
      }

      // 驗證文件大小 (5MB)
      if (file.size > 5242880) {
        toast.error('圖片大小超過 5 MB，請選擇較小的圖片');
        return;
      }

      // 計算當前需要的裁切比例
      const aspectRatio = calculateAspectRatio(currentCard);

      // 前端裁切圖片
      const croppedBlob = await cropImage(file, aspectRatio);

      // 清理舊的 blob URL（如果存在）
      if (currentCard.image && currentCard.image.startsWith('blob:')) {
        revokeBlobUrl(currentCard.image);
      }

      // 生成新的 blob URL 用於預覽
      const blobUrl = createBlobUrl(croppedBlob);

      // 更新卡片狀態
      onUpdateCard({
        originalFile: file,      // 保存原始 File 對象
        image: blobUrl           // 保存 blob URL 用於預覽
      });

      toast.success('圖片上傳成功');
    } catch (error) {
      console.error('圖片處理錯誤:', error);
      toast.error('圖片處理失敗，請重試');
    }
  };

  const handleCheckboxChange = (field: keyof CarouselCard, checked: boolean) => {
    if (STRUCTURE_FIELD_SET.has(field as string) && preventStructureEdit()) {
      return;
    }

    // Check if trying to uncheck one of the three required fields
    const requiredFields: (keyof CarouselCard)[] = ['enableImage', 'enableTitle', 'enableContent'];

    if (!checked && requiredFields.includes(field)) {
      // Count how many of the three required fields are currently checked
      const checkedCount = requiredFields.filter(f => currentCard[f]).length;

      // If only one is checked (the current one), prevent unchecking
      if (checkedCount === 1) {
        toast.error('至少需要保留「選擇圖片」、「標題文字」或「內文文字說明」其中一個選項');
        return;
      }
    }

    onUpdateCard({ [field]: checked });
  };

  // Automatic re-crop when aspect ratio changes (frontend)
  useEffect(() => {
    const handleRecrop = async () => {
      // Only proceed if we have original file
      if (!currentCard.originalFile) {
        return;
      }

      // Calculate current aspect ratio based on card settings
      const newAspectRatio = calculateAspectRatio(currentCard);

      // Check if aspect ratio actually changed
      if (prevAspectRatioRef.current === null) {
        // First render, just store the current ratio
        prevAspectRatioRef.current = newAspectRatio;
        return;
      }

      if (prevAspectRatioRef.current === newAspectRatio) {
        // No change in aspect ratio, skip re-crop
        return;
      }

      // Aspect ratio changed, update ref and trigger re-crop
      prevAspectRatioRef.current = newAspectRatio;

      try {
        // 前端重新裁切
        const croppedBlob = await cropImage(currentCard.originalFile, newAspectRatio);

        // 清理舊的 blob URL
        if (currentCard.image && currentCard.image.startsWith('blob:')) {
          revokeBlobUrl(currentCard.image);
        }

        // 生成新的 blob URL
        const blobUrl = createBlobUrl(croppedBlob);

        // 更新預覽圖片
        onUpdateCard({ image: blobUrl });
      } catch (error) {
        console.error('自動重新裁切錯誤:', error);
        // Don't show toast error for automatic re-crop to avoid annoying users
      }
    };

    // Trigger re-crop when any field that affects aspect ratio changes
    handleRecrop();
  }, [
    currentCard.enableTitle,
    currentCard.enableContent,
    currentCard.enablePrice,
    currentCard.enableButton1,
    currentCard.enableButton2,
    currentCard.enableButton3,
    currentCard.originalFile
  ]);

  // Reset prevAspectRatioRef when switching cards
  useEffect(() => {
    prevAspectRatioRef.current = null;
  }, [activeTab]);

  const isEmpty = (value?: string | null) => {
    if (value === undefined || value === null) return true;
    return value.trim() === '';
  };

  const showTitleInlineError = currentCard.enableTitle && isEmpty(currentCard.cardTitle);
  const showContentInlineError = currentCard.enableContent && isEmpty(currentCard.content);
  const showPriceInlineError = currentCard.enablePrice && isEmpty(currentCard.price);
  const showImageUrlInlineError = currentCard.enableImageUrl && isEmpty(currentCard.imageUrl);

  const showButton1TextError = currentCard.enableButton1 && isEmpty(currentCard.button1);
  const showButton1UrlError = currentCard.enableButton1 && isEmpty(currentCard.button1Url);
  const showButton2TextError = currentCard.enableButton2 && isEmpty(currentCard.button2);
  const showButton2UrlError = currentCard.enableButton2 && isEmpty(currentCard.button2Url);
  const showButton3TextError = currentCard.enableButton3 && isEmpty(currentCard.button3);
  const showButton3UrlError = currentCard.enableButton3 && isEmpty(currentCard.button3Url);

  const requiredFieldClasses = (hasError: boolean) =>
    hasError
      ? 'border-2 border-[#f44336] focus-visible:border-[#f44336] focus-visible:ring-[#f44336]/40 shadow-[0_0_0_1px_rgba(244,67,54,0.25)_inset]'
      : 'border border-neutral-100 focus-visible:border-neutral-300 focus-visible:ring-[#0f6beb]/20';

  const requiredFieldStyle = (hasError: boolean) =>
    hasError
      ? { borderColor: '#f44336', borderWidth: '2px' as const }
      : undefined;

  return (
    <div className="w-full h-full bg-[#F8FAFC] overflow-y-auto">
      <div className="flex gap-[32px] items-start p-[40px] w-full">
        {/* Left: Preview Card */}
        <div className="shrink-0">
          <div className="bg-gradient-to-b from-[#a5d8ff] to-[#d0ebff] rounded-[20px] p-[24px] w-[460px] flex flex-col items-center justify-center">
            <FlexMessageCardPreview card={currentCard} />
          </div>
        </div>

        {/* Right: Form Section */}
        <div className="flex-1 flex flex-col gap-[12px]">
          {/* Header: 編輯狀態與刪除按鈕 */}
          <div className="flex items-center justify-between h-[40px] px-[4px]">
            {/* 左側：正在編輯狀態 */}
            <div className="flex items-center gap-[8px]">
              <span className="text-[14px] leading-[20px] text-[#383838]">
                正在編輯：輪播 {getCardDisplayNumber(activeTab)} / {cards.length}
              </span>
            </div>

            {/* 右側：刪除按鈕（僅在 >1 張輪播時顯示）*/}
            {cards.length > 1 && onDeleteCarousel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteCarousel}
                className="gap-1 h-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                刪除此輪播
              </Button>
            )}
          </div>

          {/* Carousel Tabs */}
          <div className="relative h-[40px] w-full">
            <div className="flex items-center gap-[8px] flex-nowrap overflow-x-auto">
              <div className="bg-neutral-100 rounded-[10px] p-[4px] flex items-center gap-[4px] flex-nowrap shrink-0">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => onTabChange(card.id)}
                    className={`h-[32px] px-[16px] rounded-[10px] flex items-center transition-all shrink-0 whitespace-nowrap ${
                      card.id === activeTab
                        ? 'bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]'
                        : 'hover:bg-white/50'
                    }`}
                  >
                    <p className={`text-[14px] leading-[20px] whitespace-nowrap ${
                      card.id === activeTab ? 'text-[#101828]' : 'text-[#6a7282]'
                    }`}>
                      輪播 {getCardDisplayNumber(card.id)}
                    </p>
                  </button>
                ))}
              </div>
              
              {cards.length < 10 && (
                <button
                  onClick={onAddCarousel}
                  className="h-[32px] px-[8px] flex items-center gap-[6px] hover:bg-gray-50 rounded transition-colors shrink-0 whitespace-nowrap"
                >
                  <Plus className="size-[16px] text-[#0f6beb] shrink-0" strokeWidth={1.33} />
                  <span className="text-[14px] leading-[20px] text-[#0f6beb] whitespace-nowrap">新增輪播</span>
                </button>
              )}
            </div>
          </div>

          {/* Image Section */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[8px]">
                <Checkbox
                  checked={currentCard.enableImage}
                  onCheckedChange={(checked) => handleCheckboxChange('enableImage', checked as boolean)}
                  className="size-[16px]"
                  disabled={structureLocked}
                />
              <span className="text-[14px] leading-[20px] text-neutral-950">選擇圖片</span>
            </div>

            {currentCard.enableImage && (
              <div className="flex flex-col gap-[12px]">
                {/* Upload and Copy Buttons */}
                <div className="flex gap-[8px]">
                  <button
                    onClick={() => imageUploadRef.current?.click()}
                    className="flex-1 bg-white h-[36px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center justify-center gap-[8px] hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="size-[16px]" strokeWidth={1.33} />
                    <span className="text-[14px] leading-[20px] text-neutral-950">上傳圖片</span>
                  </button>
                  <input
                    ref={imageUploadRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={onCopyCard}
                    className="flex-1 bg-white h-[36px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center justify-center gap-[8px] hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="size-[16px]" strokeWidth={1.33} />
                    <span className="text-[14px] leading-[20px] text-neutral-950">複製圖卡</span>
                  </button>
                </div>

                {/* Image Guidelines */}
                <div className="flex flex-col gap-0">
                  <p className="text-[12px] leading-[16px] text-[#6a7282]">• 圖片格式 JPG, JPEG, PNG</p>
                  <p className="text-[12px] leading-[16px] text-[#6a7282]">• 檔案最大不可超過 5 MB</p>
                  <p className="text-[12px] leading-[16px] text-[#6a7282]">• 圖片會自動調整為 1.91:1 或 1:1 比例</p>
                </div>

                {/* Image Error */}
                {errors?.image && (
                  <p className="text-[12px] leading-[16px] text-red-500 mt-2">
                    {errors.image}
                  </p>
                )}

                {/* Click Image Trigger URL */}
                <div className="pt-[11px]">
                  <div className="flex items-center gap-[8px]">
                    <Checkbox
                      checked={currentCard.enableImageUrl}
                      onCheckedChange={(checked) => handleCheckboxChange('enableImageUrl', checked as boolean)}
                      className="size-[16px]"
                      disabled={structureLocked}
                    />
                    <span className="text-[14px] leading-[20px] text-neutral-950">點擊圖片觸發 URL</span>
                  </div>
                  
                  {/* Image URL and Tag Fields */}
                  {currentCard.enableImageUrl && (
                    <div className="flex flex-col gap-[12px] mt-[12px]">
                      {/* URL Field */}
                      <div className="flex flex-col gap-[4px]">
                        <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">點擊後跳轉網址</p>
                        <input
                          type="text"
                          value={currentCard.imageUrl}
                          onChange={(e) => onUpdateCard({ imageUrl: e.target.value })}
                          placeholder="https://example.com"
                          aria-invalid={showImageUrlInlineError}
                          className={`w-full h-[36px] px-[12px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                            requiredFieldClasses(showImageUrlInlineError)
                          }`}
                          style={requiredFieldStyle(showImageUrlInlineError)}
                        />
                        {showImageUrlInlineError && (
                          <p className="text-[12px] leading-[16px] text-[#f44336]">
                            請輸入點擊後跳轉網址
                          </p>
                        )}
                        <p className="text-[12px] leading-[16px] text-[#6a7282]">使用者點擊圖片時會開啟此網址</p>
                      </div>
                      
                      {/* Tag Field */}
                      <div className="flex flex-col gap-[4px]">
                        <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                        <input
                          type="text"
                          value={currentCard.imageTag}
                          onChange={(e) => onUpdateCard({ imageTag: e.target.value })}
                          placeholder="輸入互動標籤（僅供後台紀錄）"
                          className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                        />
                        <p className="text-[12px] leading-[16px] text-[#6a7282]">此欄位不影響 Flex Message，僅供後台紀錄使用</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Title Section */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[8px]">
              <Checkbox
                checked={currentCard.enableTitle}
                onCheckedChange={(checked) => handleCheckboxChange('enableTitle', checked as boolean)}
                className="size-[16px]"
                disabled={structureLocked}
              />
              <span className="text-[14px] leading-[20px] text-neutral-950">標題文字</span>
            </div>

            {currentCard.enableTitle && (
              <div className="flex flex-col gap-[2px]">
                <div className="relative">
                  <input
                    type="text"
                    value={currentCard.cardTitle}
                    onChange={(e) => onUpdateCard({ cardTitle: e.target.value })}
                    placeholder="標題文字"
                    maxLength={20}
                    aria-invalid={showTitleInlineError || Boolean(errors?.cardTitle)}
                    className={`w-full h-[36px] px-[12px] rounded-[10px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                      requiredFieldClasses(showTitleInlineError || Boolean(errors?.cardTitle))
                    }`}
                    style={requiredFieldStyle(showTitleInlineError || Boolean(errors?.cardTitle))}
                  />
                  <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                    {currentCard.cardTitle.length}/20
                  </span>
                </div>
                {(showTitleInlineError || errors?.cardTitle) && (
                  <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                    {showTitleInlineError ? '請輸入標題文字' : errors?.cardTitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[8px]">
              <Checkbox
                checked={currentCard.enableContent}
                onCheckedChange={(checked) => handleCheckboxChange('enableContent', checked as boolean)}
                className="size-[16px]"
                disabled={structureLocked}
              />
              <span className="text-[14px] leading-[20px] text-neutral-950">內文文字說明</span>
            </div>

            {currentCard.enableContent && (
              <div className="flex flex-col gap-[2px]">
                <div className="relative">
                  <textarea
                    value={currentCard.content}
                    onChange={(e) => onUpdateCard({ content: e.target.value })}
                    placeholder="輸入內文文字說明"
                    maxLength={60}
                    aria-invalid={showContentInlineError || Boolean(errors?.content)}
                    className={`w-full h-[78px] px-[12px] py-[8px] rounded-[10px] text-[14px] leading-[20px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all resize-none ${
                      requiredFieldClasses(showContentInlineError || Boolean(errors?.content))
                    }`}
                    style={requiredFieldStyle(showContentInlineError || Boolean(errors?.content))}
                  />
                  <span className="absolute right-[12px] bottom-[8px] text-[12px] leading-[16px] text-[#6a7282]">
                    {currentCard.content.length}/60
                  </span>
                </div>
                {(showContentInlineError || errors?.content) && (
                  <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                    {showContentInlineError ? '請輸入內文' : errors?.content}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[8px]">
              <Checkbox
                checked={currentCard.enablePrice}
                onCheckedChange={(checked) => handleCheckboxChange('enablePrice', checked as boolean)}
                className="size-[16px]"
                disabled={structureLocked}
              />
              <span className="text-[14px] leading-[20px] text-neutral-950">金額</span>
            </div>

            {currentCard.enablePrice && (
              <div className="flex flex-col gap-[2px]">
                <div className="relative">
                  <span className="absolute left-[12px] top-[10px] text-[14px] text-[#6a7282] pointer-events-none">
                    NT$
                  </span>
                  <input
                    type="number"
                    value={currentCard.price}
                    onChange={(e) => onUpdateCard({ price: e.target.value })}
                    placeholder="0"
                    aria-invalid={showPriceInlineError || Boolean(errors?.price)}
                    className={`w-full h-[36px] pl-[50px] pr-[12px] rounded-[10px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                      requiredFieldClasses(showPriceInlineError || Boolean(errors?.price))
                    }`}
                    style={requiredFieldStyle(showPriceInlineError || Boolean(errors?.price))}
                  />
                </div>
                {(showPriceInlineError || errors?.price) && (
                  <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                    {showPriceInlineError ? '請輸入金額' : errors?.price}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[12px]">
              <div className="flex items-center gap-[4px]">
                <span className="text-[14px] leading-[20px] text-neutral-950">動作按鈕</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <svg className="size-[12px]" fill="none" viewBox="0 0 12 12">
                      <g clipPath="url(#clip0_info)">
                        <path d={svgPaths.p1bfb6800} stroke="#2B7FFF" fill="none" />
                        <path d="M6 8V6" stroke="#2B7FFF" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <path d="M6 4H6.005" stroke="#2B7FFF" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </g>
                      <defs>
                        <clipPath id="clip0_info">
                          <rect fill="white" height="12" width="12" />
                        </clipPath>
                      </defs>
                    </svg>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>設定使用者點擊按鈕後要觸發的動作</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {!currentCard.enableButton1 && (
                <button
                  onClick={() => {
                    if (preventStructureEdit()) return;
                    onUpdateCard({
                      enableButton1: true,
                      button1Mode: 'primary',
                      button1ActionType: selectedPlatform === 'Facebook' ? 'url' : undefined
                    });
                  }}
                  className="bg-white h-[32px] px-[13px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center gap-[6px] hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={structureLocked}
                >
                  <Plus className="size-[16px]" strokeWidth={1.33} />
                  <span className="text-[14px] leading-[20px] text-neutral-950">新增按鈕</span>
                </button>
              )}
            </div>

            {/* Button 1 Config */}
            {currentCard.enableButton1 && (
              <div className="flex flex-col gap-[12px] pl-[24px] border-l-2 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] leading-[16px] text-[#4a5565] font-medium">動作按鈕一</span>
                  <button
                    onClick={() => {
                      if (preventStructureEdit()) return;
                      if (currentCard.enableButton2) {
                        // Move button2 to button1
                        onUpdateCard({
                          enableButton1: true,
                          button1: currentCard.button2,
                          button1Url: currentCard.button2Url,
                          button1Tag: currentCard.button2Tag,
                          button1Mode: currentCard.button2Mode,
                          enableButton2: currentCard.enableButton3,
                          button2: currentCard.button3,
                          button2Url: currentCard.button3Url,
                          button2Tag: currentCard.button3Tag,
                          button2Mode: currentCard.button3Mode,
                          enableButton3: false,
                          button3: '',
                          button3Url: '',
                          button3Tag: '',
                        });
                      } else {
                        onUpdateCard({ 
                          enableButton1: false, 
                          button1: '', 
                          button1Url: '', 
                          button1Tag: '' 
                        });
                      }
                    }}
                    className="text-[12px] text-[#f44336] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={structureLocked}
                  >
                    刪除
                  </button>
                </div>
                
                {/* 按鈕文字 */}
                <div className="flex flex-col gap-[2px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={currentCard.button1}
                      onChange={(e) => onUpdateCard({ button1: e.target.value })}
                      placeholder="按鈕文字"
                      maxLength={12}
                      aria-invalid={showButton1TextError || Boolean(errors?.button1)}
                      className={`w-full h-[36px] px-[12px] rounded-[10px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                        requiredFieldClasses(showButton1TextError || Boolean(errors?.button1))
                      }`}
                      style={requiredFieldStyle(showButton1TextError || Boolean(errors?.button1))}
                    />
                    <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                      {currentCard.button1.length}/12
                    </span>
                  </div>
                  {(showButton1TextError || errors?.button1) && (
                    <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                      {showButton1TextError ? '請輸入按鈕文字' : errors?.button1}
                    </p>
                  )}
                </div>

                {/* 按鈕行為選擇器 - 僅 Facebook 顯示 */}
                {selectedPlatform === 'Facebook' && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">按鈕行為</p>
                    <RadioGroup
                      value={currentCard.button1ActionType || 'url'}
                      onValueChange={(value: 'url' | 'tag') => {
                        if (value === 'url') {
                          onUpdateCard({
                            button1ActionType: 'url',
                            button1Tag: '',
                            button1TriggerMessage: ''
                          });
                        } else {
                          onUpdateCard({
                            button1ActionType: 'tag',
                            button1Url: ''
                          });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="url" id="btn1-url" />
                        <Label htmlFor="btn1-url" className="text-[14px] font-normal cursor-pointer">開啟連結網址</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="tag" id="btn1-tag" />
                        <Label htmlFor="btn1-tag" className="text-[14px] font-normal cursor-pointer">貼上互動標籤</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* 連結網址 - 條件顯示 */}
                {(selectedPlatform === 'LINE' || (selectedPlatform === 'Facebook' && currentCard.button1ActionType === 'url')) && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                    <input
                      type="text"
                      value={currentCard.button1Url}
                      onChange={(e) => onUpdateCard({ button1Url: e.target.value })}
                      placeholder="https://example.com"
                      aria-invalid={showButton1UrlError || Boolean(errors?.button1Url)}
                      className={`w-full h-[36px] px-[12px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                        requiredFieldClasses(showButton1UrlError || Boolean(errors?.button1Url))
                      }`}
                      style={requiredFieldStyle(showButton1UrlError || Boolean(errors?.button1Url))}
                    />
                    {(showButton1UrlError || errors?.button1Url) && (
                      <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                        {showButton1UrlError ? '請輸入連結網址' : errors?.button1Url}
                      </p>
                    )}
                  </div>
                )}

                {/* 互動標籤 + 觸發訊息 - Facebook Tag 模式專用 */}
                {selectedPlatform === 'Facebook' && currentCard.button1ActionType === 'tag' && (
                  <>
                    {/* 互動標籤 */}
                    <div className="flex flex-col gap-[4px]">
                      <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                      {renderTagInput('button1Tag', '輸入或按 Enter 新增互動標籤，例如：#訂房行為')}
                    </div>

                    {/* 觸發訊息文字（選填） */}
                    <div className="flex flex-col gap-[4px]">
                      <p className="text-[12px] leading-[16px] text-[#4a5565]">觸發訊息文字（選填）</p>
                      <textarea
                        value={currentCard.button1TriggerMessage || ''}
                        onChange={(e) => onUpdateCard({ button1TriggerMessage: e.target.value })}
                        placeholder="例如：快來看看吧 http://example.com"
                        maxLength={200}
                        className="w-full min-h-[72px] px-[12px] py-[8px] rounded-[8px] border border-neutral-200 text-[14px] resize-none focus:outline-none focus-visible:ring-2 transition-all"
                      />
                      <p className="text-[12px] text-[#6a7282] text-right">
                        {(currentCard.button1TriggerMessage || '').length}/200
                      </p>
                    </div>
                  </>
                )}

                {/* LINE 模式的互動標籤（僅後台記錄用） */}
                {selectedPlatform === 'LINE' && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                    {renderTagInput('button1Tag', '輸入按 Enter 新增互動標籤(僅供後台紀錄)', '此欄位不影響 Flex Message，僅供後台紀錄使用')}
                  </div>
                )}

                {/* 按鈕樣式 */}
                <div className="flex flex-col gap-[4px]">
                  <Label className="text-xs">按鈕樣式</Label>
                  <Select
                    value={currentCard.button1Mode}
                    onValueChange={(value: 'primary' | 'secondary' | 'link') => onUpdateCard({ button1Mode: value })}
                  >
                    <SelectTrigger className="text-sm bg-white border-[#F5F5F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary（綠色實心）</SelectItem>
                      <SelectItem value="secondary">Secondary（灰色實心）</SelectItem>
                      <SelectItem value="link">Link（綠色外框）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Button 2 Config */}
            {currentCard.enableButton1 && !currentCard.enableButton2 && (
              <button
                onClick={() => {
                  if (preventStructureEdit()) return;
                  onUpdateCard({
                    enableButton2: true,
                    button2Mode: 'secondary',
                    button2ActionType: selectedPlatform === 'Facebook' ? 'url' : undefined
                  });
                }}
                className="bg-white h-[32px] px-[13px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center gap-[6px] hover:bg-gray-50 transition-colors ml-[24px] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={structureLocked}
              >
                <Plus className="size-[16px]" strokeWidth={1.33} />
                <span className="text-[14px] leading-[20px] text-neutral-950">新增按鈕二</span>
              </button>
            )}

            {currentCard.enableButton2 && (
              <div className="flex flex-col gap-[12px] pl-[24px] border-l-2 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] leading-[16px] text-[#4a5565] font-medium">動作按鈕二</span>
                  <button
                    onClick={() => {
                      if (preventStructureEdit()) return;
                      if (currentCard.enableButton3) {
                        // Move button3 to button2
                        onUpdateCard({
                          enableButton2: true,
                          button2: currentCard.button3,
                          button2Url: currentCard.button3Url,
                          button2Tag: currentCard.button3Tag,
                          button2Mode: currentCard.button3Mode,
                          enableButton3: false,
                          button3: '',
                          button3Url: '',
                          button3Tag: '',
                        });
                      } else {
                        onUpdateCard({
                          enableButton2: false,
                          button2: '',
                          button2Url: '',
                          button2Tag: ''
                        });
                      }
                    }}
                    className="text-[12px] text-[#f44336] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={structureLocked}
                  >
                    刪除
                  </button>
                </div>
                
                {/* 按鈕文字 */}
                <div className="flex flex-col gap-[2px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={currentCard.button2}
                      onChange={(e) => onUpdateCard({ button2: e.target.value })}
                      placeholder="按鈕文字"
                      maxLength={12}
                      aria-invalid={showButton2TextError || Boolean(errors?.button2)}
                      className={`w-full h-[36px] px-[12px] rounded-[10px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                        requiredFieldClasses(showButton2TextError || Boolean(errors?.button2))
                      }`}
                      style={requiredFieldStyle(showButton2TextError || Boolean(errors?.button2))}
                    />
                    <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                      {currentCard.button2.length}/12
                    </span>
                  </div>
                  {(showButton2TextError || errors?.button2) && (
                    <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                      {showButton2TextError ? '請輸入按鈕文字' : errors?.button2}
                    </p>
                  )}
                </div>

                {/* 按鈕行為選擇器 - 僅 Facebook 顯示 */}
                {selectedPlatform === 'Facebook' && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">按鈕行為</p>
                    <RadioGroup
                      value={currentCard.button2ActionType || 'url'}
                      onValueChange={(value: 'url' | 'tag') => {
                        if (value === 'url') {
                          onUpdateCard({
                            button2ActionType: 'url',
                            button2Tag: '',
                            button2TriggerMessage: ''
                          });
                        } else {
                          onUpdateCard({
                            button2ActionType: 'tag',
                            button2Url: ''
                          });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="url" id="btn2-url" />
                        <Label htmlFor="btn2-url" className="text-[14px] font-normal cursor-pointer">開啟連結網址</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="tag" id="btn2-tag" />
                        <Label htmlFor="btn2-tag" className="text-[14px] font-normal cursor-pointer">貼上互動標籤</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* 連結網址 - 條件顯示 */}
                {(selectedPlatform === 'LINE' || (selectedPlatform === 'Facebook' && currentCard.button2ActionType === 'url')) && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                    <input
                      type="text"
                      value={currentCard.button2Url}
                      onChange={(e) => onUpdateCard({ button2Url: e.target.value })}
                      placeholder="https://example.com"
                      aria-invalid={showButton2UrlError || Boolean(errors?.button2Url)}
                      className={`w-full h-[36px] px-[12px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                        requiredFieldClasses(showButton2UrlError || Boolean(errors?.button2Url))
                      }`}
                      style={requiredFieldStyle(showButton2UrlError || Boolean(errors?.button2Url))}
                    />
                    {(showButton2UrlError || errors?.button2Url) && (
                      <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                        {showButton2UrlError ? '請輸入連結網址' : errors?.button2Url}
                      </p>
                    )}
                  </div>
                )}

                {/* 互動標籤 + 觸發訊息 - Facebook Tag 模式專用 */}
                {selectedPlatform === 'Facebook' && currentCard.button2ActionType === 'tag' && (
                  <>
                    {/* 互動標籤 */}
                    <div className="flex flex-col gap-[4px]">
                      <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                      {renderTagInput('button2Tag', '輸入或按 Enter 新增互動標籤，例如：#訂房行為')}
                    </div>

                    {/* 觸發訊息文字（選填） */}
                    <div className="flex flex-col gap-[4px]">
                      <p className="text-[12px] leading-[16px] text-[#4a5565]">觸發訊息文字（選填）</p>
                      <textarea
                        value={currentCard.button2TriggerMessage || ''}
                        onChange={(e) => onUpdateCard({ button2TriggerMessage: e.target.value })}
                        placeholder="例如：快來看看吧 http://example.com"
                        maxLength={200}
                        className="w-full min-h-[72px] px-[12px] py-[8px] rounded-[8px] border border-neutral-200 text-[14px] resize-none focus:outline-none focus-visible:ring-2 transition-all"
                      />
                      <p className="text-[12px] text-[#6a7282] text-right">
                        {(currentCard.button2TriggerMessage || '').length}/200
                      </p>
                    </div>
                  </>
                )}

                {/* LINE 模式的互動標籤（僅後台記錄用） */}
                {selectedPlatform === 'LINE' && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                    {renderTagInput('button2Tag', '輸入按 Enter 新增互動標籤(僅供後台紀錄)', '此欄位不影響 Flex Message，僅供後台紀錄使用')}
                  </div>
                )}

                {/* 按鈕樣式 */}
                <div className="flex flex-col gap-[4px]">
                  <Label className="text-xs">按鈕樣式</Label>
                  <Select
                    value={currentCard.button2Mode}
                    onValueChange={(value: 'primary' | 'secondary' | 'link') => onUpdateCard({ button2Mode: value })}
                  >
                    <SelectTrigger className="text-sm bg-white border-[#F5F5F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary（綠色實心）</SelectItem>
                      <SelectItem value="secondary">Secondary（灰色實心）</SelectItem>
                      <SelectItem value="link">Link（綠色外框）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Button 3 Config */}
            {currentCard.enableButton2 && !currentCard.enableButton3 && (
              <button
                onClick={() => {
                  if (preventStructureEdit()) return;
                  onUpdateCard({
                    enableButton3: true,
                    button3Mode: 'secondary',
                    button3ActionType: selectedPlatform === 'Facebook' ? 'url' : undefined
                  });
                }}
                className="bg-white h-[32px] px-[13px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center gap-[6px] hover:bg-gray-50 transition-colors ml-[24px] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={structureLocked}
              >
                <Plus className="size-[16px]" strokeWidth={1.33} />
                <span className="text-[14px] leading-[20px] text-neutral-950">新增按鈕三</span>
              </button>
            )}

            {currentCard.enableButton3 && (
              <div className="flex flex-col gap-[12px] pl-[24px] border-l-2 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] leading-[16px] text-[#4a5565] font-medium">動作按鈕三</span>
                  <button
                    onClick={() => {
                      if (preventStructureEdit()) return;
                      onUpdateCard({ 
                        enableButton3: false, 
                        button3: '',
                        button3Url: '',
                        button3Tag: ''
                      });
                    }}
                    className="text-[12px] text-[#f44336] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={structureLocked}
                  >
                    刪除
                  </button>
                </div>
                
                {/* 按鈕文字 */}
                <div className="flex flex-col gap-[2px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={currentCard.button3}
                      onChange={(e) => onUpdateCard({ button3: e.target.value })}
                      placeholder="按鈕文字"
                      maxLength={12}
                      aria-invalid={showButton3TextError || Boolean(errors?.button3)}
                      className={`w-full h-[36px] px-[12px] rounded-[10px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                        requiredFieldClasses(showButton3TextError || Boolean(errors?.button3))
                      }`}
                      style={requiredFieldStyle(showButton3TextError || Boolean(errors?.button3))}
                    />
                    <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                      {currentCard.button3.length}/12
                    </span>
                  </div>
                  {(showButton3TextError || errors?.button3) && (
                    <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                      {showButton3TextError ? '請輸入按鈕文字' : errors?.button3}
                    </p>
                  )}
                </div>

                {/* 按鈕行為選擇器 - 僅 Facebook 顯示 */}
                {selectedPlatform === 'Facebook' && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">按鈕行為</p>
                    <RadioGroup
                      value={currentCard.button3ActionType || 'url'}
                      onValueChange={(value: 'url' | 'tag') => {
                        if (value === 'url') {
                          onUpdateCard({
                            button3ActionType: 'url',
                            button3Tag: '',
                            button3TriggerMessage: ''
                          });
                        } else {
                          onUpdateCard({
                            button3ActionType: 'tag',
                            button3Url: ''
                          });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="url" id="btn3-url" />
                        <Label htmlFor="btn3-url" className="text-[14px] font-normal cursor-pointer">開啟連結網址</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="tag" id="btn3-tag" />
                        <Label htmlFor="btn3-tag" className="text-[14px] font-normal cursor-pointer">貼上互動標籤</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* 連結網址 - 條件顯示 */}
                {(selectedPlatform === 'LINE' || (selectedPlatform === 'Facebook' && currentCard.button3ActionType === 'url')) && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                    <input
                      type="text"
                      value={currentCard.button3Url}
                      onChange={(e) => onUpdateCard({ button3Url: e.target.value })}
                      placeholder="https://example.com"
                      aria-invalid={showButton3UrlError || Boolean(errors?.button3Url)}
                      className={`w-full h-[36px] px-[12px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus-visible:ring-2 transition-all ${
                        requiredFieldClasses(showButton3UrlError || Boolean(errors?.button3Url))
                      }`}
                      style={requiredFieldStyle(showButton3UrlError || Boolean(errors?.button3Url))}
                    />
                    {(showButton3UrlError || errors?.button3Url) && (
                      <p className="text-[12px] leading-[16px] text-[#f44336] mt-2">
                        {showButton3UrlError ? '請輸入連結網址' : errors?.button3Url}
                      </p>
                    )}
                  </div>
                )}

                {/* 互動標籤 + 觸發訊息 - Facebook Tag 模式專用 */}
                {selectedPlatform === 'Facebook' && currentCard.button3ActionType === 'tag' && (
                  <>
                    {/* 互動標籤 */}
                    <div className="flex flex-col gap-[4px]">
                      <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                      {renderTagInput('button3Tag', '輸入或按 Enter 新增互動標籤，例如：#訂房行為')}
                    </div>

                    {/* 觸發訊息文字（選填） */}
                    <div className="flex flex-col gap-[4px]">
                      <p className="text-[12px] leading-[16px] text-[#4a5565]">觸發訊息文字（選填）</p>
                      <textarea
                        value={currentCard.button3TriggerMessage || ''}
                        onChange={(e) => onUpdateCard({ button3TriggerMessage: e.target.value })}
                        placeholder="例如：快來看看吧 http://example.com"
                        maxLength={200}
                        className="w-full min-h-[72px] px-[12px] py-[8px] rounded-[8px] border border-neutral-200 text-[14px] resize-none focus:outline-none focus-visible:ring-2 transition-all"
                      />
                      <p className="text-[12px] text-[#6a7282] text-right">
                        {(currentCard.button3TriggerMessage || '').length}/200
                      </p>
                    </div>
                  </>
                )}

                {/* LINE 模式的互動標籤（僅後台記錄用） */}
                {selectedPlatform === 'LINE' && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                    {renderTagInput('button3Tag', '輸入按 Enter 新增互動標籤(僅供後台紀錄)', '此欄位不影響 Flex Message，僅供後台紀錄使用')}
                  </div>
                )}

                {/* 按鈕樣式 */}
                <div className="flex flex-col gap-[4px]">
                  <Label className="text-xs">按鈕樣式</Label>
                  <Select
                    value={currentCard.button3Mode}
                    onValueChange={(value: 'primary' | 'secondary' | 'link') => onUpdateCard({ button3Mode: value })}
                  >
                    <SelectTrigger className="text-sm bg-white border-[#F5F5F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary（綠色實心）</SelectItem>
                      <SelectItem value="secondary">Secondary（灰色實心）</SelectItem>
                      <SelectItem value="link">Link（綠色外框）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
