import { Plus, Copy, Trash2, Upload, Info, X, HelpCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { BubbleConfig } from './types';
import { useState } from 'react';

interface ConfigPanelProps {
  bubbles: BubbleConfig[];
  activeBubbleIndex: number;
  onBubbleChange: (index: number) => void;
  onBubbleUpdate: (index: number, config: BubbleConfig) => void;
  onBubbleAdd: () => void;
  onBubbleCopy: () => void;
  onBubbleDelete: () => void;
}

export default function ConfigPanel({
  bubbles,
  activeBubbleIndex,
  onBubbleChange,
  onBubbleUpdate,
  onBubbleAdd,
  onBubbleCopy,
  onBubbleDelete,
}: ConfigPanelProps) {
  const currentBubble = bubbles[activeBubbleIndex];
  const isFirstBubble = activeBubbleIndex === 0;
  const canAddMore = bubbles.length < 9;
  const [showHelp, setShowHelp] = useState(false);

  const updateBubble = (updates: Partial<BubbleConfig>) => {
    onBubbleUpdate(activeBubbleIndex, { ...currentBubble, ...updates });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片檔案大小不可超過 5 MB');
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('僅支援 JPG、JPEG、PNG 格式');
      return;
    }

    try {
      const hasContent = currentBubble.showTitle || currentBubble.showDescription || currentBubble.showPrice || currentBubble.buttons.length > 0;
      const targetRatio = hasContent ? 1.92 : 1;
      
      const processedImage = await processImage(file, targetRatio);
      updateBubble({ imageUrl: processedImage });
      
      const ratioText = hasContent ? '1.91:1' : '1:1';
      alert(`圖片已自動調整為 ${ratioText} 比例並上傳`);
    } catch (error) {
      alert('圖片處理失敗，請重試');
    }
  };

  const processImage = (file: File, targetRatio: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          const currentRatio = img.width / img.height;
          const tolerance = 0.05;

          if (Math.abs(currentRatio - targetRatio) / targetRatio < tolerance) {
            resolve(e.target?.result as string);
            return;
          }

          let sourceWidth, sourceHeight, sourceX, sourceY;

          if (currentRatio > targetRatio) {
            sourceHeight = img.height;
            sourceWidth = img.height * targetRatio;
            sourceX = (img.width - sourceWidth) / 2;
            sourceY = 0;
          } else {
            sourceWidth = img.width;
            sourceHeight = img.width / targetRatio;
            sourceX = 0;
            sourceY = (img.height - sourceHeight) / 2;
          }

          canvas.width = 1040;
          canvas.height = canvas.width / targetRatio;

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addButton = () => {
    if (currentBubble.buttons.length >= 3) return;
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

  const buttonLabels = ['一', '二', '三', '四'];

  return (
    <div className="relative h-full bg-white overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* Carousel Tabs */}
        <div className="flex items-center gap-2">
          {bubbles.map((_, index) => (
            <button
              key={index}
              onClick={() => onBubbleChange(index)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                index === activeBubbleIndex
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>輪播 {index + 1}</span>
              {bubbles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (bubbles.length === 1) return;
                    onBubbleDelete();
                  }}
                  className="hover:text-red-600 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </button>
          ))}
          <button
            onClick={onBubbleAdd}
            disabled={!canAddMore}
            className="flex items-center gap-1 px-3 py-2 text-[#0F6BEB] hover:text-[#0a4fa8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="size-4" />
            <span>新增輪播</span>
          </button>
        </div>

        {/* Lock Notice */}
        {!isFirstBubble && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
            🔒 此輪播已鎖定結構，僅可修改內容
          </div>
        )}

        {/* Image Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-image"
              checked={currentBubble.showImage}
              onCheckedChange={(checked) => {
                if (checked && !currentBubble.imageUrl) {
                  updateBubble({ 
                    showImage: true,
                    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'
                  });
                } else {
                  updateBubble({ showImage: checked as boolean });
                }
              }}
              disabled={!isFirstBubble}
            />
            <Label htmlFor="show-image">選擇圖片</Label>
          </div>

          {currentBubble.showImage && (
            <div className="space-y-3">
              {/* Upload and Copy Buttons */}
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full hover:text-[#0F6BEB] hover:border-[#0F6BEB]"
                    asChild
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="size-4" />
                      上傳圖片
                    </span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  onClick={onBubbleCopy}
                  disabled={!canAddMore}
                  className="flex-1 hover:text-[#0F6BEB] hover:border-[#0F6BEB]"
                >
                  <Copy className="size-4 mr-2" />
                  複製圖卡
                </Button>
              </div>

              {/* Image Info */}
              <div className="space-y-0.5 text-xs text-gray-500">
                <p>• 圖片格式 JPG, JPEG, PNG</p>
                <p>• 檔案最大不可超過 5 MB</p>
                <p>• 圖片會自動調整為 1.91:1 或 1:1 比例</p>
              </div>

              {/* Image Action Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="image-action"
                  checked={!!currentBubble.imageAction}
                  onCheckedChange={(checked) => updateBubble({ imageAction: checked ? 'https://' : '' })}
                />
                <Label htmlFor="image-action">點擊圖片傳送 URL</Label>
              </div>

              {currentBubble.imageAction && (
                <div className="pl-6 space-y-2">
                  <Input
                    placeholder="https://example.com"
                    value={currentBubble.imageAction}
                    onChange={(e) => updateBubble({ imageAction: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="動作標籤"
                      value={currentBubble.imageActionLabel}
                      onChange={(e) => updateBubble({ imageActionLabel: e.target.value })}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-4 text-[#0F6BEB] cursor-help flex-shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>輸入用戶點擊圖片後，在 LINE 後台紀錄的標籤（供追蹤用途）</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-title"
              checked={currentBubble.showTitle}
              onCheckedChange={(checked) => updateBubble({ showTitle: checked as boolean })}
              disabled={!isFirstBubble}
            />
            <Label htmlFor="show-title">標題文字</Label>
          </div>

          {currentBubble.showTitle && (
            <div className="relative">
              <Input
                placeholder="標題文字"
                value={currentBubble.titleText}
                onChange={(e) => updateBubble({ titleText: e.target.value })}
                maxLength={20}
              />
              <div className="absolute right-3 bottom-2 text-xs text-gray-400">
                {currentBubble.titleText.length}/20
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-description"
              checked={currentBubble.showDescription}
              onCheckedChange={(checked) => updateBubble({ showDescription: checked as boolean })}
              disabled={!isFirstBubble}
            />
            <Label htmlFor="show-description">內文文字說明</Label>
          </div>

          {currentBubble.showDescription && (
            <div className="relative">
              <Textarea
                placeholder="內文文字說明"
                value={currentBubble.descriptionText}
                onChange={(e) => updateBubble({ descriptionText: e.target.value })}
                rows={3}
                maxLength={60}
                className="resize-none pr-16"
              />
              <div className="absolute right-3 bottom-2 text-xs text-gray-400">
                {currentBubble.descriptionText.length}/60
              </div>
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-price"
              checked={currentBubble.showPrice}
              onCheckedChange={(checked) => updateBubble({ showPrice: checked as boolean })}
              disabled={!isFirstBubble}
            />
            <Label htmlFor="show-price">金額</Label>
          </div>

          {currentBubble.showPrice && (
            <Input
              type="number"
              placeholder="0"
              value={currentBubble.priceValue}
              onChange={(e) => updateBubble({ priceValue: e.target.value })}
            />
          )}
        </div>

        {/* Buttons Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>動作按鈕</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-[#0F6BEB] cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>設定用戶觸發按鈕產生的互動標籤</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {currentBubble.buttons.map((button, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">按鈕{buttonLabels[index]}</span>
                {isFirstBubble && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteButton(index)}
                    className="h-7 px-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">按鈕樣式</Label>
                <Select
                  value={button.style}
                  onValueChange={(value: any) => updateButton(index, { style: value })}
                  disabled={!isFirstBubble}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">
                      <div className="flex items-center gap-2">
                        <div className="size-3 bg-[#0F6BEB] rounded" />
                        <span>Primary</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="secondary">
                      <div className="flex items-center gap-2">
                        <div className="size-3 border-2 border-gray-400 rounded" />
                        <span>Secondary</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="link">
                      <div className="flex items-center gap-2">
                        <div className="size-3 flex items-center justify-center">
                          <div className="w-2 h-px bg-[#0F6BEB]" />
                        </div>
                        <span>Link</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">按鈕文字</Label>
                <Input
                  placeholder="輸入按鈕文字"
                  value={button.label}
                  onChange={(e) => updateButton(index, { label: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">按鈕 URL</Label>
                <Input
                  placeholder="https://example.com"
                  value={button.url}
                  onChange={(e) => updateButton(index, { url: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">動作標籤</Label>
                <Input
                  placeholder="輸入動作標籤"
                  value={button.actionLabel}
                  onChange={(e) => updateButton(index, { actionLabel: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          ))}

          {/* Add Button */}
          {isFirstBubble && currentBubble.buttons.length < 3 && (
            <button
              onClick={addButton}
              className="flex items-center gap-1 text-[#0F6BEB] hover:text-[#0a4fa8] transition-colors"
            >
              <Plus className="size-4" />
              <span>新增按鈕</span>
            </button>
          )}
        </div>
      </div>

      {/* Help Button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="fixed bottom-8 right-8 bg-gray-800 hover:bg-gray-900 text-white rounded-full p-3 shadow-xl transition-all hover:scale-105"
      >
        <HelpCircle className="size-5" />
      </button>

      {/* Help Tooltip */}
      {showHelp && (
        <div className="fixed bottom-20 right-8 bg-gray-800 text-white text-sm rounded-lg p-4 shadow-xl max-w-xs">
          <p className="mb-2">💡 使用提示：</p>
          <ul className="space-y-1 text-xs">
            <li>• 第一個輪播的結構會同步到所有輪播</li>
            <li>• 最多可建立 9 個輪播圖卡</li>
            <li>• 圖片會自動調整為最佳比例</li>
            <li>• 標題限制 20 字，內文限制 60 字</li>
          </ul>
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 text-white/60 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
