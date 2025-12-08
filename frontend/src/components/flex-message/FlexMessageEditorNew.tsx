import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Upload, Copy, X } from 'lucide-react';
import { BubbleConfig, FlexBubble, FlexCarousel } from './types';

interface FlexMessageEditorNewProps {
  onFlexMessageChange?: (flexMessage: FlexCarousel) => void;
}

export default function FlexMessageEditorNew({ onFlexMessageChange }: FlexMessageEditorNewProps) {
  const [activeBubbleIndex, setActiveBubbleIndex] = useState(0);
  const [bubbles, setBubbles] = useState<BubbleConfig[]>([
    {
      showImage: true,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      imageAction: '',
      imageActionLabel: '',
      showTitle: true,
      titleText: '',
      showDescription: true,
      descriptionText: '',
      showPrice: false,
      priceValue: '',
      buttons: [],
    },
  ]);

  const currentBubble = bubbles[activeBubbleIndex];
  const isFirstBubble = activeBubbleIndex === 0;

  // Generate Flex Message JSON
  useEffect(() => {
    const flexBubbles: FlexBubble[] = bubbles.map((config) => {
      const bubble: FlexBubble = {
        type: 'bubble',
      };

      // Hero Image
      if (config.showImage && config.imageUrl) {
        const hasContent = config.showTitle || config.showDescription || config.showPrice || config.buttons.length > 0;
        bubble.hero = {
          type: 'image',
          url: config.imageUrl,
          size: 'full',
          aspectRatio: hasContent ? '1.91:1' : '1:1',
          aspectMode: 'cover',
        };

        if (config.imageAction) {
          bubble.hero.action = {
            type: 'uri',
            uri: config.imageAction,
          };
        }

        if (config.imageActionLabel) {
          bubble._metadata = {
            ...bubble._metadata,
            heroActionLabel: config.imageActionLabel,
          };
        }
      }

      // Body
      const bodyContents: any[] = [];
      if (config.showTitle && config.titleText) {
        bodyContents.push({
          type: 'text',
          text: config.titleText,
          weight: 'bold',
          size: 'xl',
        });
      }
      if (config.showDescription && config.descriptionText) {
        bodyContents.push({
          type: 'text',
          text: config.descriptionText,
          color: '#666666',
          size: 'sm',
        });
      }
      if (config.showPrice && config.priceValue) {
        bodyContents.push({
          type: 'text',
          text: `NT$ ${config.priceValue}`,
          weight: 'bold',
          size: 'xl',
        });
      }

      if (bodyContents.length > 0) {
        bubble.body = {
          type: 'box',
          layout: 'vertical',
          contents: bodyContents,
        };
      }

      // Footer Buttons
      if (config.buttons.length > 0) {
        const buttonContents = config.buttons
          .filter((btn) => btn.label && btn.url)
          .map((btn) => ({
            type: 'button' as const,
            style: btn.style,
            action: {
              type: 'uri' as const,
              label: btn.label,
              uri: btn.url,
            },
          }));

        if (buttonContents.length > 0) {
          bubble.footer = {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: buttonContents,
          };

          const buttonLabels: { [index: number]: string } = {};
          config.buttons.forEach((btn, index) => {
            if (btn.actionLabel) {
              buttonLabels[index] = btn.actionLabel;
            }
          });
          if (Object.keys(buttonLabels).length > 0) {
            bubble._metadata = {
              ...bubble._metadata,
              buttonLabels,
            };
          }
        }
      }

      return bubble;
    });

    const flexMessage: FlexCarousel = {
      type: 'carousel',
      contents: flexBubbles,
    };

    if (onFlexMessageChange) {
      onFlexMessageChange(flexMessage);
    }
  }, [bubbles, onFlexMessageChange]);

  const updateBubble = (updates: Partial<BubbleConfig>) => {
    setBubbles((prev) => {
      const newBubbles = [...prev];
      newBubbles[activeBubbleIndex] = { ...currentBubble, ...updates };

      // Sync structure to all bubbles if updating first bubble
      if (activeBubbleIndex === 0) {
        const structureUpdates = {
          showImage: updates.showImage !== undefined ? updates.showImage : currentBubble.showImage,
          showTitle: updates.showTitle !== undefined ? updates.showTitle : currentBubble.showTitle,
          showDescription: updates.showDescription !== undefined ? updates.showDescription : currentBubble.showDescription,
          showPrice: updates.showPrice !== undefined ? updates.showPrice : currentBubble.showPrice,
          buttons: updates.buttons !== undefined ? updates.buttons.map((btn) => ({
            style: btn.style,
            label: '',
            url: '',
            actionLabel: '',
          })) : currentBubble.buttons.map((btn) => ({
            style: btn.style,
            label: '',
            url: '',
            actionLabel: '',
          })),
        };

        for (let i = 1; i < newBubbles.length; i++) {
          newBubbles[i] = {
            ...newBubbles[i],
            ...structureUpdates,
            buttons: structureUpdates.buttons.map((templateBtn, btnIndex) => ({
              style: templateBtn.style,
              label: newBubbles[i].buttons[btnIndex]?.label || '',
              url: newBubbles[i].buttons[btnIndex]?.url || '',
              actionLabel: newBubbles[i].buttons[btnIndex]?.actionLabel || '',
            })),
          };
        }
      }

      return newBubbles;
    });
  };

  const handleAddBubble = () => {
    if (bubbles.length >= 9) {
      toast.error('輪播最多只能設定 9 個');
      return;
    }

    const firstBubble = bubbles[0];
    const newBubble: BubbleConfig = {
      showImage: firstBubble.showImage,
      imageUrl: '',
      imageAction: '',
      imageActionLabel: '',
      showTitle: firstBubble.showTitle,
      titleText: '',
      showDescription: firstBubble.showDescription,
      descriptionText: '',
      showPrice: firstBubble.showPrice,
      priceValue: '',
      buttons: firstBubble.buttons.map((btn) => ({
        style: btn.style,
        label: '',
        url: '',
        actionLabel: '',
      })),
    };

    setBubbles([...bubbles, newBubble]);
    setActiveBubbleIndex(bubbles.length);
    toast.success('已新增圖卡');
  };

  const handleCopyBubble = () => {
    if (bubbles.length >= 9) {
      toast.error('輪播最多只能設定 9 個');
      return;
    }

    const copiedBubble = { ...currentBubble };
    setBubbles([...bubbles, copiedBubble]);
    setActiveBubbleIndex(bubbles.length);
    toast.success('已複製圖卡');
  };

  const handleDeleteBubble = (index: number) => {
    if (bubbles.length === 1) {
      toast.error('至少需要保留一張圖卡');
      return;
    }

    setBubbles(bubbles.filter((_, i) => i !== index));
    setActiveBubbleIndex(Math.max(0, index === activeBubbleIndex ? index - 1 : activeBubbleIndex));
    toast.success('已刪除圖卡');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('圖片檔案大小不可超過 5 MB');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('僅支援 JPG、JPEG、PNG 格式');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateBubble({ imageUrl: e.target?.result as string });
        toast.success('圖片已上傳');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('圖片上傳失敗');
    }
  };

  const addButton = () => {
    if (currentBubble.buttons.length >= 4) {
      toast.error('最多只能新增 4 個按鈕');
      return;
    }
    updateBubble({
      buttons: [...currentBubble.buttons, { style: 'primary', label: '', url: '', actionLabel: '' }],
    });
  };

  const updateButton = (index: number, updates: Partial<BubbleConfig['buttons'][0]>) => {
    const newButtons = [...currentBubble.buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    updateBubble({ buttons: newButtons });
  };

  const deleteButton = (index: number) => {
    updateBubble({
      buttons: currentBubble.buttons.filter((_, i) => i !== index),
    });
  };

  // Preview bubble
  const previewBubble: FlexBubble = {
    type: 'bubble',
  };

  if (currentBubble.showImage) {
    const hasContent = currentBubble.showTitle || currentBubble.showDescription || currentBubble.showPrice || currentBubble.buttons.length > 0;
    previewBubble.hero = {
      type: 'image',
      url: currentBubble.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      size: 'full',
      aspectRatio: hasContent ? '1.91:1' : '1:1',
      aspectMode: 'cover',
    };
  }

  const bodyContents: any[] = [];
  if (currentBubble.showTitle) {
    bodyContents.push({
      type: 'text',
      text: currentBubble.titleText || '標題文字',
      weight: 'bold',
      size: 'xl',
    });
  }
  if (currentBubble.showDescription) {
    bodyContents.push({
      type: 'text',
      text: currentBubble.descriptionText || '內文文字說明',
      wrap: true,
      color: '#666666',
      size: 'sm',
      margin: 'md',
    });
  }
  if (currentBubble.showPrice) {
    bodyContents.push({
      type: 'text',
      text: currentBubble.priceValue ? `NT$ ${currentBubble.priceValue}` : 'NT$ 0',
      weight: 'bold',
      size: 'xl',
      margin: 'md',
    });
  }

  if (bodyContents.length > 0) {
    previewBubble.body = {
      type: 'box',
      layout: 'vertical',
      contents: bodyContents,
    };
  }

  if (currentBubble.buttons.length > 0) {
    const buttonContents = currentBubble.buttons.map((btn, index) => ({
      type: 'button' as const,
      style: btn.style || 'primary',
      height: 'sm',
      margin: index === 0 ? 'md' : undefined,
      action: {
        type: 'uri' as const,
        label: btn.label || `動作按鈕${['一', '二', '三', '四'][index]}`,
        uri: btn.url || 'https://example.com',
      },
    }));

    previewBubble.footer = {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: buttonContents,
    };
  }

  const renderFlexBubble = (bubble: FlexBubble) => {
    const hasImageAction = currentBubble.imageAction && currentBubble.imageAction !== '';
    
    return (
      <div className="bg-white w-[300px] rounded-[10px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden">
        {bubble.hero && (
          <div className="relative">
            <img
              src={bubble.hero.url}
              alt="Hero"
              className="w-full object-cover"
              style={{ aspectRatio: bubble.hero.aspectRatio }}
            />
            {hasImageAction && (
              <div className="absolute top-2 right-2 bg-white/90 rounded px-2 py-0.5 shadow-md flex items-center gap-1">
                <svg className="size-3" fill="none" viewBox="0 0 12 12">
                  <path d="M10.5 5.25L6.75 1.5L3 5.25" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.75 10.5V1.5" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-[#364153]">可點擊</span>
              </div>
            )}
          </div>
        )}
        {bubble.body && (
          <div className="px-4 pt-4 pb-2">
            {bubble.body.contents.map((content: any, index: number) => {
              // 標題文字
              if (content.weight === 'bold' && content.size === 'xl') {
                return (
                  <div key={index} className="mb-2">
                    <p className="text-[18px] leading-[27px] font-bold text-black" style={{ fontFamily: 'Arimo, Noto Sans JP, sans-serif' }}>
                      {content.text}
                    </p>
                  </div>
                );
              }
              // 內文文字說明
              if (content.color === '#666666') {
                return (
                  <div key={index} className="mb-2">
                    <p className="text-[12px] leading-[18px] text-[#666666]" style={{ fontFamily: 'Arimo, Noto Sans JP, sans-serif' }}>
                      {content.text}
                    </p>
                  </div>
                );
              }
              // 金額
              if (content.text && content.text.startsWith('NT$')) {
                return (
                  <div key={index} className="mb-2">
                    <p className="text-[18px] leading-[27px] font-bold text-black" style={{ fontFamily: 'Arimo, Noto Sans JP, sans-serif' }}>
                      {content.text}
                    </p>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
        {bubble.footer && (
          <div className="px-4 pb-4 pt-2 space-y-2">
            {bubble.footer.contents.map((btn: any, index: number) => (
              <button
                key={index}
                className={`w-full h-[44px] rounded text-[14px] leading-[20px] font-normal transition-opacity hover:opacity-90 flex items-center justify-center ${
                  btn.style === 'primary'
                    ? 'bg-[#06c755] text-white'
                    : btn.style === 'secondary'
                    ? 'bg-white border border-[#d0d0d0] text-black'
                    : 'bg-transparent text-[#0F6BEB]'
                }`}
                style={{ fontFamily: 'Arimo, Noto Sans JP, sans-serif' }}
              >
                {btn.action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Preview Panel */}
        <div 
          className="w-[350px] flex items-center justify-center pl-[40px] shrink-0"
          style={{ background: 'linear-gradient(180deg, #A5D8FF 0%, #D0EBFF 100%)' }}
        >
          {renderFlexBubble(previewBubble)}
        </div>

        {/* Right Config Panel */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="pr-[40px] pl-[32px] py-[24px]">
            <div className="max-w-[588px] space-y-3">
              {/* Carousel Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {bubbles.map((_, index) => (
                  <div
                    key={index}
                    className="bg-[#f5f5f5] rounded-[10px] h-10 px-1 py-1 shrink-0"
                  >
                    <div
                      className={`rounded-lg h-8 px-4 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        index === activeBubbleIndex 
                          ? 'bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]' 
                          : 'bg-transparent'
                      }`}
                    >
                      <span 
                        onClick={() => setActiveBubbleIndex(index)}
                        className="text-sm leading-[20px] text-[#101828]" 
                        style={{ fontFamily: 'Arimo, Noto Sans JP, sans-serif' }}
                      >
                        輪播 {index + 1}
                      </span>
                      {bubbles.length > 1 && index === activeBubbleIndex && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBubble(index);
                          }}
                          className="text-[#99a1af] hover:text-red-600 transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddBubble}
                  disabled={bubbles.length >= 9}
                  className="flex items-center gap-1.5 text-[#0f6beb] hover:text-[#0a4fa8] disabled:opacity-50 h-8 px-2 shrink-0 whitespace-nowrap"
                >
                  <Plus className="size-4" strokeWidth={1.33} />
                  <span className="text-sm leading-[20px]" style={{ fontFamily: 'Arimo, Noto Sans JP, sans-serif' }}>新增輪播</span>
                </button>
              </div>

              {/* Image Section */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBubble.showImage}
                    onChange={(e) => {
                      if (e.target.checked && !currentBubble.imageUrl) {
                        updateBubble({ 
                          showImage: true,
                          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'
                        });
                      } else {
                        updateBubble({ showImage: e.target.checked });
                      }
                    }}
                    disabled={!isFirstBubble}
                    className="size-4 rounded border-[1.6px] border-[#2b7fff] checked:bg-[#2b7fff] checked:border-[#2b7fff]"
                  />
                  <span className="text-sm text-neutral-950">選擇圖片</span>
                </label>

                {currentBubble.showImage && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label 
                        htmlFor="image-upload" 
                        className="flex-1 w-full h-9 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg flex items-center justify-center gap-2 text-sm text-neutral-950 hover:border-gray-300 cursor-pointer"
                      >
                        <Upload className="size-4" />
                        上傳圖片
                      </label>
                      <button
                        onClick={handleCopyBubble}
                        disabled={bubbles.length >= 9}
                        className="flex-1 h-9 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg flex items-center justify-center gap-2 text-sm text-neutral-950 hover:border-gray-300 disabled:opacity-50"
                      >
                        <Copy className="size-4" />
                        複製圖卡
                      </button>
                    </div>

                    <div className="text-xs text-[#6a7282] space-y-0">
                      <p>• 圖片格式 JPG, JPEG, PNG</p>
                      <p>• 檔案最大不可超過 5 MB</p>
                      <p>• 圖片會自動調整為 1.91:1 或 1:1 比例</p>
                    </div>

                    <div className="border-t border-[rgba(0,0,0,0.1)] pt-2.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!currentBubble.imageAction}
                          onChange={(e) => updateBubble({ imageAction: e.target.checked ? 'https://' : '' })}
                          className="size-4 rounded border-[1.6px] border-[#99a1af] checked:bg-[#2b7fff] checked:border-[#2b7fff]"
                        />
                        <span className="text-sm text-neutral-950">點擊圖片觸發 URL</span>
                      </label>
                      
                      {currentBubble.imageAction && (
                        <div className="mt-3 space-y-3">
                          {/* 點擊後跳轉網址 */}
                          <div className="space-y-1.5">
                            <label className="text-xs text-[#4a5565]">點擊後跳轉網址</label>
                            <input
                              type="text"
                              placeholder="https://example.com"
                              value={currentBubble.imageAction}
                              onChange={(e) => updateBubble({ imageAction: e.target.value })}
                              className="w-full h-9 px-3 border border-neutral-100 rounded-lg text-sm placeholder:text-[#717182] focus:outline-none focus:border-[#0f6beb] transition-colors"
                            />
                            <p className="text-xs text-[#6a7282]">使用者點擊圖片時會開啟此網址</p>
                          </div>
                          
                          {/* 互動標籤 */}
                          <div className="space-y-1.5">
                            <label className="text-xs text-[#4a5565]">互動標籤</label>
                            <input
                              type="text"
                              placeholder="輸入互動標籤（僅供後台紀錄）"
                              value={currentBubble.imageActionLabel}
                              onChange={(e) => updateBubble({ imageActionLabel: e.target.value })}
                              className="w-full h-9 px-3 border border-neutral-100 rounded-lg text-sm placeholder:text-[#717182] focus:outline-none focus:border-[#0f6beb] transition-colors"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Title Section */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBubble.showTitle}
                    onChange={(e) => updateBubble({ showTitle: e.target.checked })}
                    disabled={!isFirstBubble}
                    className="size-4 rounded border-[1.6px] border-[#2b7fff] checked:bg-[#2b7fff] checked:border-[#2b7fff]"
                  />
                  <span className="text-sm text-neutral-950">標題文字</span>
                </label>

                {currentBubble.showTitle && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="標題文字"
                      value={currentBubble.titleText}
                      onChange={(e) => updateBubble({ titleText: e.target.value })}
                      maxLength={20}
                      className="w-full h-9 px-3 border border-neutral-100 rounded-lg text-sm placeholder:text-[#717182] focus:outline-none focus:border-[#0f6beb] transition-colors"
                    />
                    <span className="absolute right-3 bottom-2 text-xs text-[#6a7282]">
                      {currentBubble.titleText.length}/20
                    </span>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBubble.showDescription}
                    onChange={(e) => updateBubble({ showDescription: e.target.checked })}
                    disabled={!isFirstBubble}
                    className="size-4 rounded border-[1.6px] border-[#2b7fff] checked:bg-[#2b7fff] checked:border-[#2b7fff]"
                  />
                  <span className="text-sm text-neutral-950">內文文字說明</span>
                </label>

                {currentBubble.showDescription && (
                  <div className="relative">
                    <textarea
                      placeholder="輸入內文文字說明"
                      value={currentBubble.descriptionText}
                      onChange={(e) => updateBubble({ descriptionText: e.target.value })}
                      maxLength={60}
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-100 rounded-lg text-sm resize-none placeholder:text-[#717182] pr-14 focus:outline-none focus:border-[#0f6beb] transition-colors"
                    />
                    <span className="absolute right-3 bottom-2 text-xs text-[#6a7282]">
                      {currentBubble.descriptionText.length}/60
                    </span>
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBubble.showPrice}
                    onChange={(e) => updateBubble({ showPrice: e.target.checked })}
                    disabled={!isFirstBubble}
                    className="size-4 rounded border-[1.6px] border-[#2b7fff] checked:bg-[#2b7fff] checked:border-[#2b7fff]"
                  />
                  <span className="text-sm text-neutral-950">金額</span>
                </label>

                {currentBubble.showPrice && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="NT$ 0"
                      value={currentBubble.priceValue ? `NT$ ${currentBubble.priceValue}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/NT\$\s*/g, '').replace(/\D/g, '');
                        updateBubble({ priceValue: value });
                      }}
                      maxLength={15}
                      className="w-full h-9 px-3 border border-neutral-100 rounded-lg text-sm placeholder:text-[#717182] focus:outline-none focus:border-[#0f6beb] transition-colors"
                    />
                    <span className="absolute right-3 bottom-2 text-xs text-[#6a7282]">
                      {currentBubble.priceValue.length}/15
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-neutral-950">動作按鈕</span>
                    <svg className="size-3" fill="none" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="5.5" stroke="#2B7FFF" />
                      <path d="M6 8V6" stroke="#2B7FFF" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 4H6.005" stroke="#2B7FFF" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <button
                    onClick={addButton}
                    disabled={!isFirstBubble || currentBubble.buttons.length >= 4}
                    className="h-8 px-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg flex items-center gap-1.5 text-sm text-neutral-950 hover:border-gray-300 disabled:opacity-50"
                  >
                    <Plus className="size-4" strokeWidth={1.33} />
                    新增按鈕
                  </button>
                </div>

                {currentBubble.buttons.map((button, index) => (
                  <div key={index} className="bg-[#f9fafb] border border-neutral-100 rounded-[10px] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#101828]">按鈕 {index + 1}</span>
                      {isFirstBubble && (
                        <button
                          onClick={() => deleteButton(index)}
                          className="size-6 flex items-center justify-center text-[#99a1af] hover:text-red-600 transition-colors"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 16 16">
                            <path d="M6.66667 7.33333V11.3333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                            <path d="M9.33333 7.33333V11.3333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                            <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                            <path d="M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* 按鈕文字 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#4a5565]">按鈕文字</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="動作按鈕一"
                          value={button.label}
                          onChange={(e) => updateButton(index, { label: e.target.value })}
                          maxLength={12}
                          className="w-full h-9 px-3 border border-neutral-100 rounded-lg text-sm placeholder:text-[#717182] focus:outline-none focus:border-[#0f6beb] transition-colors"
                        />
                        <span className="absolute right-3 bottom-2 text-xs text-[#99a1af]">
                          {button.label.length}/12
                        </span>
                      </div>
                    </div>

                    {/* 連結網址 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#4a5565]">連結網址</label>
                      <input
                        type="text"
                        placeholder="https://example.com"
                        value={button.url}
                        onChange={(e) => updateButton(index, { url: e.target.value })}
                        className="w-full h-9 px-3 border border-neutral-100 rounded-lg text-sm placeholder:text-[#717182] focus:outline-none focus:border-[#0f6beb] transition-colors"
                      />
                    </div>

                    {/* 互動標籤 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#4a5565]">互動標籤</label>
                      <input
                        type="text"
                        placeholder="輸入互動標籤（僅供後台紀錄）"
                        value={button.actionLabel}
                        onChange={(e) => updateButton(index, { actionLabel: e.target.value })}
                        className="w-full h-9 px-3 border border-neutral-100 rounded-lg text-sm placeholder:text-[#717182] focus:outline-none focus:border-[#0f6beb] transition-colors"
                      />
                    </div>

                    {/* 按鈕樣式 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#4a5565]">按鈕樣式</label>
                      <div className="relative">
                        <select
                          value={button.style}
                          onChange={(e) => updateButton(index, { style: e.target.value as any })}
                          disabled={!isFirstBubble}
                          className="w-full h-9 px-3 pr-8 border border-neutral-100 rounded-lg text-sm bg-white appearance-none cursor-pointer disabled:opacity-50 focus:outline-none focus:border-[#0f6beb] transition-colors"
                        >
                          <option value="primary">Primary（綠色實心）</option>
                          <option value="secondary">Secondary（灰色外框）</option>
                          <option value="link">Link（藍色文字）</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none opacity-50" fill="none" viewBox="0 0 16 16">
                          <path d="M4 6L8 10L12 6" stroke="#717182" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}