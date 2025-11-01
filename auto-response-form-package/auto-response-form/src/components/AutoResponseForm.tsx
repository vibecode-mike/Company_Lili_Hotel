import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info, ChevronDown, Trash2, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// 回應類型枚舉
type ResponseType = 'welcome' | 'keyword' | 'always';

// 觸發時間枚舉
type TriggerTime = 'immediate' | 'scheduled';

// 關鍵字標籤介面
interface KeywordTag {
  id: string;
  label: string;
}

// 元件狀態介面
interface FormState {
  responseType: ResponseType;
  triggerTime: TriggerTime;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  keywords: KeywordTag[];
  keywordInput: string;
  messageText: string;
  currentMessageIndex: number;
}

export default function AutoResponseForm() {
  const [state, setState] = useState<FormState>({
    responseType: 'welcome',
    triggerTime: 'immediate',
    startDate: '',
    endDate: '',
    startTime: '12:00',
    endTime: '14:30',
    keywords: [],
    keywordInput: '',
    messageText: 'Hi {好友的顯示名稱} 歡迎加入好友～ 填寫會員資料即可取得精美好禮',
    currentMessageIndex: 0,
  });

  // 處理回應類型變更
  const handleResponseTypeChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      responseType: value as ResponseType,
      keywords: [],
      keywordInput: '',
    }));
  };

  // 處理觸發時間變更
  const handleTriggerTimeChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      triggerTime: value as TriggerTime,
    }));
  };

  // 新增關鍵字標籤
  const addKeywordTag = (keyword: string) => {
    if (keyword.trim() && !state.keywords.find(k => k.label === keyword.trim())) {
      const newTag: KeywordTag = {
        id: `keyword-${Date.now()}`,
        label: keyword.trim(),
      };
      setState((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newTag],
        keywordInput: '',
      }));
    }
  };

  // 移除關鍵字標籤
  const removeKeywordTag = (id: string) => {
    setState((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k.id !== id),
    }));
  };

  // 處理關鍵字輸入的 Enter 鍵
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.keywordInput.trim()) {
      e.preventDefault();
      addKeywordTag(state.keywordInput);
    }
  };

  // 插入好友顯示名稱到訊息文字
  const insertFriendName = () => {
    setState((prev) => ({
      ...prev,
      messageText: prev.messageText + '{好友的顯示名稱}',
    }));
  };

  // 獲取回應類型的顯示文字
  const getResponseTypeLabel = () => {
    switch (state.responseType) {
      case 'welcome':
        return '歡迎訊息';
      case 'keyword':
        return '觸發關鍵字';
      case 'always':
        return '一律回應';
      default:
        return '歡迎訊息';
    }
  };

  // 檢查訊息文字是否包含變數標籤
  const hasVariableTag = () => {
    return state.messageText.includes('{好友的顯示名稱}');
  };

  // 渲染訊息預覽
  const renderMessagePreview = () => {
    const parts = state.messageText.split(/(\{好友的顯示名稱\})/g);
    
    return parts.map((part, index) => {
      if (part === '{好友的顯示名稱}') {
        return (
          <Badge
            key={index}
            variant="secondary"
            className="bg-[#fffaf0] text-[#eba20f] hover:bg-[#fffaf0] border-none mx-1 relative -top-0.5"
          >
            好友的顯示名稱
          </Badge>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // 渲染關鍵字欄位說明
  const renderKeywordDescription = () => {
    if (state.keywords.length === 0 && !state.keywordInput) {
      return (
        <p className="text-sm text-gray-600">
          您好~日前貴單位有申報或新增至協會的會員回函嗎？若想查詢申報日期或新增日期的會員已掃碼與否？我們會提供近期加協會與掃碼情況表~
        </p>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex">
      {/* 左側預覽區 */}
      <div className="w-[460px] p-6 bg-gradient-to-b from-[#a5d8ff] to-[#d0ebff] rounded-[20px] m-6 flex gap-5">
        {/* OA 頭像 */}
        <div className="flex-shrink-0">
          <div className="w-[45px] h-[45px] rounded-full bg-white flex items-center justify-center">
            <span className="text-xs font-medium text-gray-800">OA</span>
          </div>
        </div>

        {/* 訊息列表 */}
        <div className="flex-1 space-y-6">
          {/* 第一則訊息 (包含變數標籤) */}
          <div className="relative">
            <div className="bg-gray-800 text-white p-4 rounded-[15px] max-w-[288px]">
              <p className="text-base leading-6">{renderMessagePreview()}</p>
            </div>
          </div>

          {/* 其他訊息 */}
          {state.responseType === 'keyword' && state.keywords.length > 0 && (
            <div className="bg-gray-800 text-white p-4 rounded-[15px] max-w-[288px]">
              <p className="text-base leading-6">
                您好~日前貴單位有申報或新增至協會的會員回函嗎？若想查詢申報日期或新增日期的會員已掃碼與否？我們會提供近期加協會與掃碼情況表~
              </p>
            </div>
          )}

          {state.responseType === 'always' && (
            <>
              <div className="bg-gray-800 text-white p-4 rounded-[15px] max-w-[288px]">
                <p className="text-base leading-6">
                  您好~日前貴單位有申報或新增至協會的會員回函嗎？若想查詢申報日期或新增日期的會員已掃碼與否？我們會提供近期加協會與掃碼情況表~
                </p>
              </div>
              <div className="bg-gray-800 text-white p-4 rounded-[15px] max-w-[288px]">
                <p className="text-base leading-6">
                  自動合作派遣時間：可以幫我(02) 2766-2177 由能後導人通報。
                </p>
              </div>
            </>
          )}

          {(state.responseType === 'welcome' || (state.responseType === 'keyword' && state.keywords.length === 0)) && (
            <>
              <div className="bg-gray-800 text-white p-4 rounded-[15px] max-w-[288px]">
                <p className="text-base leading-6">輸入訊息文字</p>
              </div>
              {state.responseType === 'welcome' && (
                <>
                  <div className="bg-gray-800 text-white p-4 rounded-[15px] max-w-[288px]">
                    <p className="text-base leading-6">輸入訊息文字</p>
                  </div>
                  <div className="bg-gray-800 text-white p-4 rounded-[15px] max-w-[288px]">
                    <p className="text-base leading-6">輸入訊息文字</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 右側表單區 */}
      <div className="flex-1 p-10 space-y-8">
        {/* 頁首區域 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-normal text-gray-800">建立自動回應</h1>
          <Button className="bg-gray-800 hover:bg-gray-700 text-white rounded-2xl px-6">
            建立
          </Button>
        </div>

        {/* 訊息排序區 */}
        <div className="flex items-center gap-6">
          <div className="bg-white rounded-xl p-1">
            <Button variant="ghost" className="bg-white rounded-lg px-4">
              訊息排序
            </Button>
          </div>

          <div className="flex-1 border-b border-[#e1ebf9] flex items-center">
            <Button
              variant="ghost"
              className={cn(
                'h-12 border-b-2 rounded-none',
                state.currentMessageIndex === 0
                  ? 'border-[#0f6beb] text-gray-800'
                  : 'border-transparent text-gray-600'
              )}
            >
              1
            </Button>
            {state.responseType === 'welcome' && (
              <>
                <Button variant="ghost" className="h-12 border-b-2 border-transparent text-gray-600 rounded-none">
                  2
                </Button>
                <Button variant="ghost" className="h-12 border-b-2 border-transparent text-gray-600 rounded-none">
                  3
                </Button>
                <Button variant="ghost" className="h-12 border-b-2 border-transparent text-gray-600 rounded-none">
                  4
                </Button>
              </>
            )}
            {(state.responseType === 'keyword' || state.responseType === 'always') && (
              <>
                <Button variant="ghost" className="h-12 border-b-2 border-transparent text-gray-600 rounded-none">
                  2
                </Button>
                {state.responseType === 'always' && (
                  <Button variant="ghost" className="h-12 border-b-2 border-transparent text-gray-600 rounded-none">
                    3
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" className="h-12 text-gray-400 rounded-none">
              + 新增訊息內容
            </Button>
          </div>
        </div>

        {/* 表單內容區 */}
        <div className="space-y-8">
          {/* 操作按鈕區 */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" className="h-12 w-12">
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12">
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12">
              <Trash2 className="h-6 w-6 text-gray-600" />
            </Button>
          </div>

          {/* 表單欄位 */}
          <div className="space-y-8">
            {/* 回應類型 */}
            <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
              <div className="flex items-center gap-1 pt-3">
                <Label className="text-base text-gray-800">回應類型</Label>
                <span className="text-red-500">*</span>
              </div>
              <Select value={state.responseType} onValueChange={handleResponseTypeChange}>
                <SelectTrigger className="w-full h-12 bg-white border-gray-200">
                  <SelectValue placeholder="選擇回應類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">歡迎訊息</SelectItem>
                  <SelectItem value="keyword">觸發關鍵字</SelectItem>
                  <SelectItem value="always">一律回應</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 觸發時間 */}
            <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
              <div className="flex items-center gap-1 pt-3">
                <Label className="text-base text-gray-800">觸發時間</Label>
                <span className="text-red-500">*</span>
                <Info className="h-6 w-6 text-gray-600" />
              </div>
              <RadioGroup value={state.triggerTime} onValueChange={handleTriggerTimeChange}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="text-base font-normal cursor-pointer">
                      立即回覆
                    </Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <Label htmlFor="scheduled" className="text-base font-normal cursor-pointer">
                        指定日期或時間
                      </Label>
                    </div>

                    {state.triggerTime === 'scheduled' && (
                      <div className="pl-8 space-y-4">
                        {/* 指定日期 */}
                        <div className="flex items-center gap-3">
                          <span className="text-base text-gray-800">指定日期</span>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="年/月/日"
                                value={state.startDate}
                                onChange={(e) => setState({ ...state, startDate: e.target.value })}
                                className="w-40 h-12 pr-10"
                              />
                              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                            </div>
                            <span className="text-gray-800">~</span>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="年/月/日"
                                value={state.endDate}
                                onChange={(e) => setState({ ...state, endDate: e.target.value })}
                                className="w-40 h-12 pr-10"
                              />
                              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {/* 指定時間 */}
                        <div className="flex items-center gap-3">
                          <span className="text-base text-gray-800">指定時間</span>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="時：分"
                                value={state.startTime}
                                onChange={(e) => setState({ ...state, startTime: e.target.value })}
                                className="w-40 h-12 pr-10"
                              />
                              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                            </div>
                            <span className="text-gray-800">~</span>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="時：分"
                                value={state.endTime}
                                onChange={(e) => setState({ ...state, endTime: e.target.value })}
                                className="w-40 h-12 pr-10"
                              />
                              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                            </div>
                            <span className="text-gray-600">（每天）</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="border-t border-gray-200" />

            {/* 關鍵字標籤 (僅在觸發關鍵字時顯示) */}
            {state.responseType === 'keyword' && (
              <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
                <div className="flex items-center gap-1 pt-3">
                  <Label className="text-base text-gray-800">關鍵字標籤</Label>
                  <span className="text-red-500">*</span>
                  <Info className="h-6 w-6 text-gray-600" />
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={state.keywords.length === 0 ? "點擊 Enter 即可新增關鍵字標籤" : ""}
                      value={state.keywordInput}
                      onChange={(e) => setState({ ...state, keywordInput: e.target.value })}
                      onKeyDown={handleKeywordKeyDown}
                      className="w-full h-12"
                    />
                  </div>
                  {state.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {state.keywords.map((keyword) => (
                        <Badge
                          key={keyword.id}
                          variant="secondary"
                          className="bg-[#fffaf0] text-[#eba20f] hover:bg-[#fffaf0] border-none text-base px-3 py-1"
                        >
                          {keyword.label}
                          <button
                            onClick={() => removeKeywordTag(keyword.id)}
                            className="ml-1 hover:text-[#d89000]"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-right text-xs text-gray-600">
                    {state.keywords.length}/20
                  </div>
                </div>
              </div>
            )}

            {/* 訊息文字 */}
            <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
              <div className="flex items-center gap-1 pt-3">
                <Label className="text-base text-gray-800">訊息文字</Label>
                <span className="text-red-500">*</span>
              </div>
              <div className="space-y-2">
                <div className="relative bg-white border border-gray-200 rounded-lg p-4 min-h-[132px]">
                  <Textarea
                    value={state.messageText}
                    onChange={(e) => setState({ ...state, messageText: e.target.value })}
                    placeholder={
                      state.responseType === 'keyword' && state.keywords.length === 0
                        ? "您好~日前貴單位有申報或新增至協會的會員回函嗎？若想查詢申報日期或新增日期的會員已掃碼與否？我們會提供近期加協會與掃碼情況表~"
                        : state.responseType === 'always'
                        ? "自動合作派遣時間：可以幫我(02) 2766-2177 由能後導人通報。"
                        : "輸入訊息文字"
                    }
                    className="min-h-[84px] border-0 p-0 focus-visible:ring-0 resize-none"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={insertFriendName}
                    className="mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800"
                  >
                    好友的顯示名稱
                  </Button>
                </div>
                <div className="text-right text-xs">
                  <span className="text-gray-600">{state.messageText.length}</span>
                  <span className="text-gray-800">/100</span>
                </div>
                {renderKeywordDescription()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
