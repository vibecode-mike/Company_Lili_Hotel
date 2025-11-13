import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import imgStep1 from "figma:asset/bf4ffd108c2e836b466874e959531fdf5c9bd8b1.png";
import imgStep2 from "figma:asset/88076181b402df2ffcba98c51345afaaa2165468.png";
import imgStep3 from "figma:asset/e859f2896aa57670db9ed9933eb059d29ffaf7c7.png";
import imgStep4 from "figma:asset/e0079245ea67343450871e33ff689154160aa2bb.png";

export default function LineApiSettingsContent() {
  const [expandedCard, setExpandedCard] = useState<number>(1);

  const toggleCard = (cardNumber: number) => {
    setExpandedCard(expandedCard === cardNumber ? 0 : cardNumber);
  };

  return (
    <div className="bg-[#f6f9fd] min-h-screen w-full">
      <div className="max-w-[1240px] mx-auto px-[40px] pt-[48px] pb-[80px]">
        {/* Header Section */}
        <div className="flex flex-col gap-[8px] mb-[32px]">
          <h1 className="text-[24px] leading-[36px] text-[#0f6beb] text-center">
            LINE 官方帳號 API 串接設定
          </h1>
          <p className="text-[16px] leading-[24px] text-[#4a5565] text-center">
            顧客可以使用 LINE 官方帳號與您聊天，群發訊息、會員功能模組已啟用！
          </p>
        </div>

        {/* Cards Section */}
        <div className="flex flex-col gap-[16px] mb-[32px]">
          {/* Card 1: Channel ID */}
          <div className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 1 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}>
            {/* Card Header */}
            <button
              onClick={() => toggleCard(1)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">1</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Channel ID</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 Basic Settings 取得</p>
                </div>
              </div>
              {expandedCard === 1 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 1 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <img 
                        src={imgStep1} 
                        alt="LINE Developers Console Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          前往{' '}
                          <a 
                            href="https://developers.line.biz/console/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-[4px] bg-[#0f6beb] text-white px-[8px] py-[1px] rounded-[4px] text-[12px] leading-[16px] hover:bg-[#0d5bbf] transition-colors"
                          >
                            LINE Developers Console
                            <ExternalLink className="size-[12px]" />
                          </a>
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          選擇您的 Provider 和 Messaging API Channel
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          找到 Channel ID 並複製貼上至系統設定欄位
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[14px] text-neutral-950">
                    Channel ID
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入 Channel ID"
                    className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* Next Button */}
                <button
                  disabled
                  className="bg-[#d1d5dc] opacity-50 h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Channel Secret */}
          <div className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 2 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}>
            <button
              onClick={() => toggleCard(2)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">2</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Channel Secret</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 Basic Settings 取得</p>
                </div>
              </div>
              {expandedCard === 2 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 2 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <img 
                        src={imgStep2} 
                        alt="LINE Basic Settings Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start pt-[8px]">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          在同一個 Channel 的「Basic Settings」分頁中
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          找到「Channel secret」欄位
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          複製 Secret，貼入系統設定欄位
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[14px] text-neutral-950">
                    Channel Secret
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入 Channel Secret"
                    className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* Next Button */}
                <button
                  disabled
                  className="bg-[#d1d5dc] opacity-50 h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Channel Access Token */}
          <div className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 3 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}>
            <button
              onClick={() => toggleCard(3)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">3</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">設定 Channel Access Token</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 Messaging API 分頁取得</p>
                </div>
              </div>
              {expandedCard === 3 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 3 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <img 
                        src={imgStep3} 
                        alt="LINE Messaging API Screenshot"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start pt-[8px]">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          切換到「Messaging API」分頁
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          找到「Channel access token (long-lived)」區塊
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊 Issue（產生）或 Reissue（重新產生）
                        </p>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">4.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          複製 Token，貼入系統設定欄位完成綁定
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[14px] text-neutral-950">
                    Channel Access Token
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入 Access Token"
                    className="bg-[#f3f3f5] h-[36px] px-[12px] py-[4px] rounded-[8px] text-[14px] text-[#383838] placeholder:text-[#717182] border-none outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                  />
                </div>

                {/* Next Button */}
                <button
                  disabled
                  className="bg-[#d1d5dc] opacity-50 h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            )}
          </div>

          {/* Card 4: Webhook */}
          <div className={`bg-white rounded-[14px] border-[1.6px] ${expandedCard === 4 ? 'border-[#0f6beb] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]' : 'border-gray-200'}`}>
            <button
              onClick={() => toggleCard(4)}
              className="w-full px-[24px] py-[16px] flex items-center justify-between hover:bg-gray-50 rounded-t-[14px] transition-colors"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-[#0f6beb] rounded-full size-[32px] flex items-center justify-center">
                  <span className="text-[14px] leading-[20px] text-white">4</span>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[18px] leading-[28px] text-neutral-950">啟用聊天機器人與 Webhook</p>
                  <p className="text-[16px] leading-[24px] text-[#717182]">從 LINE 官方帳號後台設定</p>
                </div>
              </div>
              {expandedCard === 4 ? (
                <ChevronUp className="size-[20px] text-[#6A7282]" />
              ) : (
                <ChevronDown className="size-[20px] text-[#6A7282]" />
              )}
            </button>

            {/* Card Content */}
            {expandedCard === 4 && (
              <div className="px-[24px] pb-[24px] flex flex-col gap-[16px]">
                {/* Steps Section */}
                <div className="bg-[#e1edfd] rounded-[10px] p-[16px]">
                  <p className="text-[14px] leading-[20px] font-bold text-[#364153] mb-[16px]">
                    📘 操作步驟
                  </p>
                  
                  <div className="flex gap-[16px]">
                    {/* Screenshot */}
                    <div className="shrink-0">
                      <img 
                        src={imgStep4} 
                        alt="LINE OA Backend Settings"
                        className="w-[398.4px] h-[224.1px] rounded-[10px] border-[1.6px] border-[#0f6beb] object-cover shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-[8px] justify-start pt-[8px]">
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">1.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          點擊右上角的「齒輪」圖示（⚙️）進入設定
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">2.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          在左側選單中選擇「回應模式」
                        </p>
                      </div>
                      
                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">3.</span>
                        <div className="flex flex-col gap-[4px]">
                          <p className="text-[14px] leading-[20px] text-[#364153]">
                            將以下選項開啟：
                          </p>
                          <p className="text-[14px] leading-[20px] text-[#364153] pl-[16px]">
                            - 聊天機器人（Chatbot）
                          </p>
                          <p className="text-[14px] leading-[20px] text-[#364153] pl-[16px]">
                            - Webhook（用於接收外部事件）
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-[8px] items-start">
                        <span className="text-[14px] leading-[21px] text-[#364153]">4.</span>
                        <p className="text-[14px] leading-[20px] text-[#364153]">
                          將回應方式改為「手動回應」，以便系統自動處理訊息互動
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="bg-white border-[0.8px] border-[#bedbff] rounded-[10px] px-[12.8px] py-[12.8px]">
                  <div className="flex items-center gap-[8px]">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => {}}
                      className="size-[16px]"
                    />
                    <span className="text-[14px] leading-[14px] text-neutral-950">我已完成聊天機器人與 Webhook 設定</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  disabled
                  className="bg-[#d1d5dc] opacity-50 h-[36px] rounded-[8px] text-white text-[14px] leading-[20px] cursor-not-allowed"
                >
                  建立連結
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Warning Section */}
        <div className="bg-blue-50 border-[0.8px] border-[#bedbff] rounded-[10px] px-[16.8px] py-[16.8px]">
          <p className="text-[14px] leading-[20px] text-[#193cb8]">
            <span className="font-bold">💡 提醒：</span>
            妥善保管您的 Channel Secret 和 Access Token，切勿公開分享。 這些資料將用於與 LINE 平台進行安全通訊。
          </p>
        </div>
      </div>
    </div>
  );
}