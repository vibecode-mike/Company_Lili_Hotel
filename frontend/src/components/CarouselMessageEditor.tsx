import { useState, useRef, memo } from 'react';
import { Plus, Upload, Copy, Trash2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import svgPaths from '../imports/svg-708vqjfcuf';
import imgImageHero from "figma:asset/68b289cb927cef11d11501fd420bb560ad25c667.png";

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
  image: string;
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
  button2Action: string;
  button2Url: string;
  button2Tag: string;
  button2Text: string;
  button2TriggerImage: File | null;
  button2Mode: 'primary' | 'secondary' | 'link';
  button3Action: string;
  button3Url: string;
  button3Tag: string;
  button3Text: string;
  button3TriggerImage: File | null;
  button3Mode: 'primary' | 'secondary' | 'link';
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

interface CarouselMessageEditorProps {
  cards: CarouselCard[];
  activeTab: number;
  onTabChange: (tabId: number) => void;
  onAddCarousel: () => void;
  onUpdateCard: (updates: Partial<CarouselCard>) => void;
  onCopyCard?: () => void;
  onImageUpload?: (file: File) => Promise<string | null>;
}

// LINE Flex Message 風格的卡片預覽組件
export const FlexMessageCardPreview = memo(function FlexMessageCardPreview({ card }: { card: CarouselCard }) {
  return (
    <div className="bg-white rounded-[10px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] w-[300px] overflow-hidden">
      {/* Hero Image */}
      {card.enableImage && (
        <div className="w-full bg-gray-200 flex items-center justify-center overflow-hidden">
          <img
            src={card.image || imgImageHero}
            alt="卡片圖片"
            className="w-full h-auto object-cover"
            style={{ aspectRatio: "1.92:1" }}
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
      {(card.enableButton1 || card.enableButton2 || card.enableButton3 || card.enableButton4) && (
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
          {card.enableButton4 && (
            <button
              className={`w-full rounded-[4px] text-[14px] transition-colors text-center py-[10px] px-[16px] ${
                card.button4Mode === 'primary' 
                  ? 'bg-[#06C755] text-white hover:bg-[#05b34d]' 
                  : card.button4Mode === 'secondary'
                  ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  : 'bg-white text-[#06C755] border-2 border-[#06C755] hover:bg-gray-50'
              }`}
            >
              {card.button4 || "動作按鈕四"}
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
  onImageUpload
}: CarouselMessageEditorProps) {
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const currentCard = cards.find(c => c.id === activeTab) || cards[0];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onImageUpload) {
        // Use parent's upload handler (uploads to backend)
        const imageUrl = await onImageUpload(file);
        if (imageUrl) {
          onUpdateCard({ image: imageUrl });
        }
      } else {
        // Fallback to base64 if no upload handler provided
        const reader = new FileReader();
        reader.onloadend = () => {
          onUpdateCard({ image: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCheckboxChange = (field: keyof CarouselCard, checked: boolean) => {
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

  return (
    <div className="w-full h-full bg-[#F8FAFC] overflow-y-auto">
      <div className="flex gap-[32px] items-start p-[40px] w-full">
        {/* Left: Preview Card */}
        <div className="shrink-0">
          <div className="bg-gradient-to-b from-[#a5d8ff] to-[#d0ebff] rounded-[20px] p-[24px] w-[460px] flex items-center justify-center">
            <FlexMessageCardPreview card={currentCard} />
          </div>
        </div>

        {/* Right: Form Section */}
        <div className="flex-1 flex flex-col gap-[12px]">
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
                      輪播 {card.id}
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
                  <p className="text-[12px] leading-[16px] text-[#6a7282]">• 圖片會自動調整為 1.92:1 或 1:1 比例</p>
                </div>

                {/* Click Image Trigger URL */}
                <div className="pt-[11px]">
                  <div className="flex items-center gap-[8px]">
                    <Checkbox
                      checked={currentCard.enableImageUrl}
                      onCheckedChange={(checked) => onUpdateCard({ enableImageUrl: checked as boolean })}
                      className="size-[16px]"
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
                          className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                        />
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
              />
              <span className="text-[14px] leading-[20px] text-neutral-950">標題文字</span>
            </div>

            {currentCard.enableTitle && (
              <div className="relative">
                <input
                  type="text"
                  value={currentCard.cardTitle}
                  onChange={(e) => onUpdateCard({ cardTitle: e.target.value })}
                  placeholder="標題文字"
                  maxLength={20}
                  className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                />
                <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                  {currentCard.cardTitle.length}/20
                </span>
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
              />
              <span className="text-[14px] leading-[20px] text-neutral-950">內文文字說明</span>
            </div>

            {currentCard.enableContent && (
              <div className="relative">
                <textarea
                  value={currentCard.content}
                  onChange={(e) => onUpdateCard({ content: e.target.value })}
                  placeholder="輸入內文文字說明"
                  maxLength={60}
                  className="w-full h-[78px] px-[12px] py-[8px] rounded-[10px] border border-neutral-100 text-[14px] leading-[20px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all resize-none"
                />
                <span className="absolute right-[12px] bottom-[8px] text-[12px] leading-[16px] text-[#6a7282]">
                  {currentCard.content.length}/60
                </span>
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
              />
              <span className="text-[14px] leading-[20px] text-neutral-950">金額</span>
            </div>

            {currentCard.enablePrice && (
              <div className="relative">
                <span className="absolute left-[12px] top-[10px] text-[14px] text-[#6a7282] pointer-events-none">
                  NT$
                </span>
                <input
                  type="number"
                  value={currentCard.price}
                  onChange={(e) => onUpdateCard({ price: e.target.value })}
                  placeholder="0"
                  className="w-full h-[36px] pl-[50px] pr-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                />
              </div>
            )}
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[12px]">
              <div className="flex items-center gap-[4px]">
                <span className="text-[14px] leading-[20px] text-neutral-950">動作按鈕</span>
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
              </div>
              
              {!currentCard.enableButton1 && (
                <button
                  onClick={() => onUpdateCard({ enableButton1: true, button1Mode: 'primary' })}
                  className="bg-white h-[32px] px-[13px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center gap-[6px] hover:bg-gray-50 transition-colors"
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
                  <span className="text-[14px] leading-[20px] text-neutral-950 font-medium">動作按鈕一</span>
                  <button
                    onClick={() => {
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
                          enableButton3: currentCard.enableButton4,
                          button3: currentCard.button4,
                          button3Url: currentCard.button4Url,
                          button3Tag: currentCard.button4Tag,
                          button3Mode: currentCard.button4Mode,
                          enableButton4: false,
                          button4: '',
                          button4Url: '',
                          button4Tag: '',
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
                    className="text-[12px] text-[#f44336] hover:underline"
                  >
                    刪除
                  </button>
                </div>
                
                {/* 按鈕文字 */}
                <div className="relative">
                  <input
                    type="text"
                    value={currentCard.button1}
                    onChange={(e) => onUpdateCard({ button1: e.target.value })}
                    placeholder="按鈕文字"
                    maxLength={12}
                    className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                  <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                    {currentCard.button1.length}/12
                  </span>
                </div>

                {/* 連結網址 */}
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                  <input
                    type="text"
                    value={currentCard.button1Url}
                    onChange={(e) => onUpdateCard({ button1Url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* 互動標籤 */}
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                  <input
                    type="text"
                    value={currentCard.button1Tag}
                    onChange={(e) => onUpdateCard({ button1Tag: e.target.value })}
                    placeholder="輸入互動標籤（僅供後台紀錄）"
                    className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                  <p className="text-xs text-gray-500">此欄位不影響 Flex Message，僅供後台紀錄使用</p>
                </div>

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
                onClick={() => onUpdateCard({ enableButton2: true, button2Mode: 'secondary' })}
                className="bg-white h-[32px] px-[13px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center gap-[6px] hover:bg-gray-50 transition-colors ml-[24px]"
              >
                <Plus className="size-[16px]" strokeWidth={1.33} />
                <span className="text-[14px] leading-[20px] text-neutral-950">新增按鈕二</span>
              </button>
            )}

            {currentCard.enableButton2 && (
              <div className="flex flex-col gap-[12px] pl-[24px] border-l-2 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] leading-[20px] text-neutral-950 font-medium">動作按鈕二</span>
                  <button
                    onClick={() => {
                      if (currentCard.enableButton3) {
                        // Move button3 to button2
                        onUpdateCard({
                          enableButton2: true,
                          button2: currentCard.button3,
                          button2Url: currentCard.button3Url,
                          button2Tag: currentCard.button3Tag,
                          button2Mode: currentCard.button3Mode,
                          enableButton3: currentCard.enableButton4,
                          button3: currentCard.button4,
                          button3Url: currentCard.button4Url,
                          button3Tag: currentCard.button4Tag,
                          button3Mode: currentCard.button4Mode,
                          enableButton4: false,
                          button4: '',
                          button4Url: '',
                          button4Tag: '',
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
                    className="text-[12px] text-[#f44336] hover:underline"
                  >
                    刪除
                  </button>
                </div>
                
                {/* 按鈕文字 */}
                <div className="relative">
                  <input
                    type="text"
                    value={currentCard.button2}
                    onChange={(e) => onUpdateCard({ button2: e.target.value })}
                    placeholder="按鈕文字"
                    maxLength={12}
                    className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                  <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                    {currentCard.button2.length}/12
                  </span>
                </div>

                {/* 連結網址 */}
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                  <input
                    type="text"
                    value={currentCard.button2Url}
                    onChange={(e) => onUpdateCard({ button2Url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* 互動標籤 */}
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                  <input
                    type="text"
                    value={currentCard.button2Tag}
                    onChange={(e) => onUpdateCard({ button2Tag: e.target.value })}
                    placeholder="輸入互動標籤（僅供後台紀錄）"
                    className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                  <p className="text-xs text-gray-500">此欄位不影響 Flex Message，僅供後台紀錄使用</p>
                </div>

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
                onClick={() => onUpdateCard({ enableButton3: true, button3Mode: 'secondary' })}
                className="bg-white h-[32px] px-[13px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center gap-[6px] hover:bg-gray-50 transition-colors ml-[24px]"
              >
                <Plus className="size-[16px]" strokeWidth={1.33} />
                <span className="text-[14px] leading-[20px] text-neutral-950">新增按鈕三</span>
              </button>
            )}

            {currentCard.enableButton3 && (
              <div className="flex flex-col gap-[12px] pl-[24px] border-l-2 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] leading-[20px] text-neutral-950 font-medium">動作按鈕三</span>
                  <button
                    onClick={() => {
                      if (currentCard.enableButton4) {
                        // Move button4 to button3
                        onUpdateCard({
                          enableButton3: true,
                          button3: currentCard.button4,
                          button3Url: currentCard.button4Url,
                          button3Tag: currentCard.button4Tag,
                          button3Mode: currentCard.button4Mode,
                          enableButton4: false,
                          button4: '',
                          button4Url: '',
                          button4Tag: '',
                        });
                      } else {
                        onUpdateCard({ 
                          enableButton3: false, 
                          button3: '', 
                          button3Url: '', 
                          button3Tag: '' 
                        });
                      }
                    }}
                    className="text-[12px] text-[#f44336] hover:underline"
                  >
                    刪除
                  </button>
                </div>
                
                {/* 按鈕文字 */}
                <div className="relative">
                  <input
                    type="text"
                    value={currentCard.button3}
                    onChange={(e) => onUpdateCard({ button3: e.target.value })}
                    placeholder="按鈕文字"
                    maxLength={12}
                    className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                  <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                    {currentCard.button3.length}/12
                  </span>
                </div>

                {/* 連結網址 */}
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                  <input
                    type="text"
                    value={currentCard.button3Url}
                    onChange={(e) => onUpdateCard({ button3Url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* 互動標籤 */}
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                  <input
                    type="text"
                    value={currentCard.button3Tag}
                    onChange={(e) => onUpdateCard({ button3Tag: e.target.value })}
                    placeholder="輸入互動標籤（僅供後台紀錄）"
                    className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                  <p className="text-xs text-gray-500">此欄位不影響 Flex Message，僅供後台紀錄使用</p>
                </div>

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

            {/* Button 4 Config */}
            {currentCard.enableButton3 && !currentCard.enableButton4 && (
              <button
                onClick={() => onUpdateCard({ enableButton4: true, button4Mode: 'secondary' })}
                className="bg-white h-[32px] px-[13px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center gap-[6px] hover:bg-gray-50 transition-colors ml-[24px]"
              >
                <Plus className="size-[16px]" strokeWidth={1.33} />
                <span className="text-[14px] leading-[20px] text-neutral-950">新增按鈕四</span>
              </button>
            )}

            {currentCard.enableButton4 && (
              <div className="flex flex-col gap-[12px] pl-[24px] border-l-2 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] leading-[20px] text-neutral-950 font-medium">動作按鈕四</span>
                  <button
                    onClick={() => onUpdateCard({ 
                      enableButton4: false, 
                      button4: '', 
                      button4Url: '', 
                      button4Tag: '' 
                    })}
                    className="text-[12px] text-[#f44336] hover:underline"
                  >
                    刪除
                  </button>
                </div>
                
                {/* 按鈕文字 */}
                <div className="relative">
                  <input
                    type="text"
                    value={currentCard.button4}
                    onChange={(e) => onUpdateCard({ button4: e.target.value })}
                    placeholder="按鈕文字"
                    maxLength={12}
                    className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                  <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                    {currentCard.button4.length}/12
                  </span>
                </div>

                {/* 連結網址 */}
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                  <input
                    type="text"
                    value={currentCard.button4Url}
                    onChange={(e) => onUpdateCard({ button4Url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* 互動標籤 */}
                <div className="flex flex-col gap-[4px]">
                  <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                  <input
                    type="text"
                    value={currentCard.button4Tag}
                    onChange={(e) => onUpdateCard({ button4Tag: e.target.value })}
                    placeholder="輸入互動標籤（僅供後台紀錄）"
                    className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                  <p className="text-xs text-gray-500">此欄位不影響 Flex Message，僅供後台紀錄使用</p>
                </div>

                {/* 按鈕樣式 */}
                <div className="flex flex-col gap-[4px]">
                  <Label className="text-xs">按鈕樣式</Label>
                  <Select
                    value={currentCard.button4Mode}
                    onValueChange={(value: 'primary' | 'secondary' | 'link') => onUpdateCard({ button4Mode: value })}
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