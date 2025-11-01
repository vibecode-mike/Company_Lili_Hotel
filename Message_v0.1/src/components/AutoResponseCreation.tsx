import { useState } from 'react';
import svgPaths from "../imports/svg-5k1pwt7x5m";
import svgPaths2 from "../imports/svg-20k1bhrsry";
import svgPaths3 from "../imports/svg-0dk9oa70za";
import svgPaths4 from "../imports/svg-x8lrqvdcbi";
import svgPaths5 from "../imports/svg-i0s4b3eetb";

interface AutoResponseCreationProps {
  onBack: () => void;
}

export default function AutoResponseCreation({ onBack }: AutoResponseCreationProps) {
  const [responseType, setResponseType] = useState('歡迎訊息');
  const [triggerTime, setTriggerTime] = useState('immediate'); // 'immediate' or 'scheduled'
  const [messageText, setMessageText] = useState('');
  const [showResponseTypeDropdown, setShowResponseTypeDropdown] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [messageCount, setMessageCount] = useState(1); // Track number of message tabs (1-5)
  const [activeTab, setActiveTab] = useState(1); // Track which tab is active
  const [keywordTags, setKeywordTags] = useState(''); // For keyword tags input
  const [alwaysReplyTags, setAlwaysReplyTags] = useState(''); // For 一律回應 keyword tags input

  const responseTypes = ['歡迎訊息', '觸發關鍵字', '一律回應'];

  const handleAddMessage = () => {
    if (messageCount < 5) {
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      setActiveTab(newCount); // Auto-select the newly added tab
    }
  };

  const handleDelete = () => {
    // Cannot delete if only 1 tab remains
    if (messageCount <= 1) {
      return;
    }
    
    // If deleting the last tab, switch to the previous tab
    if (activeTab === messageCount) {
      setActiveTab(messageCount - 1);
    }
    // If deleting a tab before the active one, adjust active tab index
    else if (activeTab > 1) {
      // Keep the same visual position by staying on the same tab number
      // (the content will shift, but we maintain focus on the same position)
    }
    
    // Decrease the total count
    setMessageCount(messageCount - 1);
  };

  const handleCreate = () => {
    // Handle create logic
    console.log('Creating auto response:', {
      responseType,
      triggerTime,
      messageText
    });
    onBack();
  };

  return (
    <div className="bg-slate-50 content-stretch flex flex-col items-start relative size-full">
      {/* Breadcrumb */}
      <div className="relative shrink-0 w-full">
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex gap-[4px] items-center pb-0 pt-[48px] px-[40px] relative w-full">
            <div className="box-border content-stretch flex gap-[4px] items-center p-[4px] relative shrink-0">
              <div className="content-stretch flex items-center justify-center relative shrink-0">
                <button 
                  onClick={onBack}
                  className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[14px] text-nowrap whitespace-pre hover:text-[#383838] cursor-pointer"
                >
                  自動回應訊息
                </button>
              </div>
              <div className="overflow-clip relative shrink-0 size-[12px]">
                <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.9510564804077148)+(var(--transform-inner-height)*0.30901697278022766)))] items-center justify-center left-[calc(50%-0.313px)] top-[calc(50%+0.542px)] translate-x-[-50%] translate-y-[-50%] w-[calc(1px*((var(--transform-inner-height)*0.9510564804077148)+(var(--transform-inner-width)*0.30901697278022766)))]" style={{ "--transform-inner-width": "8.5", "--transform-inner-height": "0" } as React.CSSProperties}>
                  <div className="flex-none rotate-[108deg]">
                    <div className="h-0 relative w-[8.5px]">
                      <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 1">
                          <line stroke="var(--stroke-0, #6E6E6E)" strokeLinecap="round" x1="0.5" x2="8" y1="0.5" y2="0.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-center justify-center relative shrink-0">
                <p className="font-['Noto_Sans_TC:Medium',sans-serif] font-medium leading-[1.5] relative shrink-0 text-[#383838] text-[14px] text-nowrap whitespace-pre">建立自動回應訊息</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Header */}
      <div className="relative shrink-0 w-full">
        <div className="size-full">
          <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
            <div className="content-stretch flex items-start relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[32px] text-nowrap">
                  <p className="leading-[1.5] whitespace-pre">建立自動回應訊息</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0">
                <button 
                  onClick={handleCreate}
                  className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 hover:bg-[#383838] transition-colors"
                >
                  <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">建立</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative shrink-0 w-full">
        <div className="size-full">
          <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
            {/* Switch Container */}
            <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
              <div className="bg-slate-50 box-border content-stretch flex gap-[4px] items-center p-[4px] relative rounded-[12px] shrink-0">
                <div className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                  <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                    <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">訊息排序</p>
                  </div>
                </div>
              </div>
              <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                <div aria-hidden="true" className="absolute border-[#e1ebf9] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
                {/* Render tab buttons dynamically */}
                {Array.from({ length: messageCount }, (_, i) => i + 1).map((tabNumber) => (
                  <div key={tabNumber} className="flex flex-row items-center self-stretch">
                    <button
                      onClick={() => setActiveTab(tabNumber)}
                      className="aspect-[48/48] content-stretch flex gap-[4px] h-full items-center justify-center relative shrink-0"
                    >
                      {activeTab === tabNumber && (
                        <div aria-hidden="true" className="absolute border-[#0f6beb] border-[0px_0px_2px] border-solid inset-0 pointer-events-none" />
                      )}
                      <div className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] px-[12px] py-[8px] relative rounded-[16px] shrink-0">
                        <p className={`basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center ${
                          activeTab === tabNumber ? 'text-[#383838]' : 'text-[#6e6e6e]'
                        }`}>
                          {tabNumber}
                        </p>
                      </div>
                    </button>
                  </div>
                ))}
                {/* Show "新增訊息內容" button only if less than 5 messages */}
                {messageCount < 5 && (
                  <div className="flex flex-row items-center self-stretch">
                    <button 
                      onClick={handleAddMessage}
                      className="box-border content-stretch flex h-full items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 group transition-colors"
                    >
                      <div className="content-stretch flex gap-[2px] items-center justify-center min-w-[32px] relative rounded-[8px] shrink-0">
                        <div className="overflow-clip relative shrink-0 size-[16px]">
                          <div className="absolute inset-0">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                              <g></g>
                            </svg>
                          </div>
                          <div className="absolute inset-[20.833%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                              <path d={svgPaths2.pb4c0180} fill="var(--fill-0, #A8A8A8)" className="group-hover:fill-[#383838] transition-colors" />
                            </svg>
                          </div>
                        </div>
                        <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] group-hover:text-[#383838] text-[16px] transition-colors">新增訊息內容</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full">
              {/* Preview Container */}
              <div className="bg-gradient-to-b box-border content-stretch flex from-[#a5d8ff] gap-[20px] items-start overflow-clip p-[24px] relative rounded-[20px] self-stretch shrink-0 to-[#d0ebff] w-[460px]">
                <div className="bg-white relative rounded-[3.35544e+07px] shrink-0 size-[45px]">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[45px]">
                    <div className="h-[18px] relative shrink-0 w-[16.938px]">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18px] relative w-[16.938px]">
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">OA</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative shrink-0 w-[288px]">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip relative rounded-[inherit] w-[288px]">
                    <div className="bg-[#383838] max-w-[288px] relative rounded-[15px] shrink-0 w-[288px]">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-center max-w-inherit overflow-clip relative rounded-[inherit] w-[288px]">
                        <div className="relative shrink-0 w-full">
                          <div className="flex flex-row items-center size-full">
                            <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-white">
                                {messageText || '輸入訊息文字'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Container */}
              <div className="basis-0 content-stretch flex flex-col gap-[24px] grow items-start min-h-px min-w-px relative shrink-0">
                {/* Navigation Arrows and Delete */}
                <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
                  <button className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0 hover:bg-slate-200 transition-colors">
                    <div className="overflow-clip relative shrink-0 size-[24px]">
                      <div className="absolute inset-[37.49%_26.74%_35.07%_26.7%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                          <path d={svgPaths.pc951b80} fill="var(--fill-0, #6E6E6E)" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  <button className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0 hover:bg-slate-200 transition-colors">
                    <div className="flex items-center justify-center relative shrink-0">
                      <div className="flex-none rotate-[180deg]">
                        <div className="overflow-clip relative size-[24px]">
                          <div className="absolute inset-[37.49%_26.74%_35.07%_26.7%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                              <path d={svgPaths.pc951b80} fill="var(--fill-0, #6E6E6E)" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={messageCount <= 1}
                    className="box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[48px] p-[8px] relative rounded-[16px] shrink-0 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="box-border content-stretch flex items-center justify-between overflow-clip p-[7px] relative shrink-0 size-[32px]">
                      <div className="absolute aspect-[24/24] left-0 right-0 top-1/2 translate-y-[-50%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                          <g></g>
                        </svg>
                      </div>
                      <div className="absolute h-[18px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[16px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
                          <path d={svgPaths.p2248ae00} fill="var(--fill-0, #6E6E6E)" />
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Form Body */}
                <div className="content-stretch flex flex-col gap-[40px] items-end min-h-[200px] relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col gap-[32px] items-end relative shrink-0 w-full">
                    {/* Response Type */}
                    <div className="content-stretch flex items-start relative shrink-0 w-full">
                      <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0">
                        <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]">
                          <div className="overflow-clip relative shrink-0 size-[20px]">
                            <div className="absolute inset-0">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                <g></g>
                              </svg>
                            </div>
                            <div className="absolute inset-[12.5%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                                <path d={svgPaths.p2f710980} fill="var(--fill-0, #0F6BEB)" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex items-center relative shrink-0">
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                              <p className="leading-[1.5] whitespace-pre">回應類型</p>
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
                              <p className="leading-[1.5] whitespace-pre">*</p>
                            </div>
                          </div>
                        </div>
                        <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
                          <div className="absolute inset-[16.667%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                              <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[8px] shrink-0">
                        <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                        <div className="flex flex-col justify-center min-h-inherit size-full">
                          <button 
                            onClick={() => setShowResponseTypeDropdown(!showResponseTypeDropdown)}
                            className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[8px] relative w-full hover:bg-slate-50 transition-colors"
                          >
                            <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{responseType}</p>
                              <div className="overflow-clip relative shrink-0 size-[24px]">
                                <div className="absolute inset-[37.49%_26.74%_35.07%_26.7%]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                                    <path d={svgPaths.pc951b80} fill="var(--fill-0, #6E6E6E)" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                        {showResponseTypeDropdown && (
                          <div className="absolute bg-white border border-neutral-100 rounded-[8px] mt-1 shadow-lg w-full z-10">
                            {responseTypes.map((type) => (
                              <button
                                key={type}
                                onClick={() => {
                                  setResponseType(type);
                                  setShowResponseTypeDropdown(false);
                                }}
                                className="w-full text-left p-[8px] hover:bg-slate-50 transition-colors first:rounded-t-[8px] last:rounded-b-[8px]"
                              >
                                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px]">{type}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trigger Time */}
                    <div className="content-stretch flex items-start relative shrink-0 w-full">
                      <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0">
                        <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]">
                          <div className="overflow-clip relative shrink-0 size-[20px]">
                            <div className="absolute inset-0">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                <g></g>
                              </svg>
                            </div>
                            <div className="absolute inset-[12.5%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                                <path d={svgPaths.p2f710980} fill="var(--fill-0, #0F6BEB)" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex items-center relative shrink-0">
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                              <p className="leading-[1.5] whitespace-pre">觸發時間</p>
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
                              <p className="leading-[1.5] whitespace-pre">*</p>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-clip relative shrink-0 size-[24px]">
                          <div className="absolute inset-[16.667%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                              <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                        <button 
                          onClick={() => setTriggerTime('immediate')}
                          className="content-stretch flex gap-[8px] items-center relative shrink-0"
                        >
                          <div className="overflow-clip relative shrink-0 size-[24px]">
                            <div className="absolute inset-0">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                <g></g>
                              </svg>
                            </div>
                            <div className="absolute inset-[8.333%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                <path d={svgPaths3.p3a58b490} fill={triggerTime === 'immediate' ? "var(--fill-0, #0F6BEB)" : "var(--fill-0, #383838)"} />
                              </svg>
                            </div>
                            {triggerTime === 'immediate' && (
                              <div className="absolute inset-[29.167%]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                                  <path d={svgPaths3.p46c6500} fill="var(--fill-0, #0F6BEB)" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                              <p className="leading-[1.5] whitespace-pre">立即回覆</p>
                            </div>
                          </div>
                        </button>
                        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                          <button 
                            onClick={() => setTriggerTime('scheduled')}
                            className="content-stretch flex gap-[8px] items-center relative shrink-0"
                          >
                            <div className="overflow-clip relative shrink-0 size-[24px]">
                              <div className="absolute inset-0">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                  <g></g>
                                </svg>
                              </div>
                              <div className="absolute inset-[8.333%]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                  <path d={svgPaths3.p3a58b490} fill={triggerTime === 'scheduled' ? "var(--fill-0, #0F6BEB)" : "var(--fill-0, #383838)"} />
                                </svg>
                              </div>
                              {triggerTime === 'scheduled' && (
                                <div className="absolute inset-[29.167%]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                                    <path d={svgPaths3.p46c6500} fill="var(--fill-0, #0F6BEB)" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="content-stretch flex items-center relative shrink-0">
                              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                                <p className="leading-[1.5] whitespace-pre">指定日期或時間</p>
                              </div>
                            </div>
                          </button>

                          {/* Expanded Date/Time Pickers when 'scheduled' is selected */}
                          {triggerTime === 'scheduled' && (
                            <div className="relative shrink-0 w-full">
                              <div className="size-full">
                                <div className="box-border content-stretch flex flex-col gap-[4px] items-start pl-[32px] pr-0 py-0 relative w-full">
                                  {/* Date Picker Row */}
                                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
                                    <div className="flex flex-row items-center self-stretch">
                                      <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                                        <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                                          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">指定日期</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-row items-center self-stretch">
                                      <div className="content-stretch flex gap-[4px] h-full items-center relative shrink-0">
                                        {/* First Date Input */}
                                        <div className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center max-w-[160px] min-w-[160px] p-[8px] relative rounded-[8px] shrink-0 w-[160px]">
                                          <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                                          <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
                                            <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
                                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">年/月/日</p>
                                            </div>
                                            <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] relative rounded-[8px] shrink-0 size-[28px]">
                                              <div className="relative shrink-0 size-[24px]">
                                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                                  <g>
                                                    <path d={svgPaths3.p22990f00} fill="var(--fill-0, #0F6BEB)" />
                                                  </g>
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Tilde Separator */}
                                        <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                                          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">~</p>
                                          </div>
                                        </div>
                                        {/* Second Date Input */}
                                        <div className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center max-w-[160px] min-w-[160px] p-[8px] relative rounded-[8px] shrink-0 w-[160px]">
                                          <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                                          <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
                                            <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
                                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">年/月/日</p>
                                            </div>
                                            <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] relative rounded-[8px] shrink-0 size-[28px]">
                                              <div className="relative shrink-0 size-[24px]">
                                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                                  <g>
                                                    <path d={svgPaths3.p22990f00} fill="var(--fill-0, #0F6BEB)" />
                                                  </g>
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Time Picker Row */}
                                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
                                    <div className="flex flex-row items-center self-stretch">
                                      <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                                        <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                                          <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">指定時間</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-row items-center self-stretch">
                                      <div className="content-stretch flex gap-[4px] h-full items-center relative shrink-0">
                                        {/* First Time Input */}
                                        <div className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center max-w-[160px] min-w-[160px] p-[8px] relative rounded-[8px] shrink-0 w-[160px]">
                                          <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                                          <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
                                            <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
                                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">時：分</p>
                                            </div>
                                            <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] relative rounded-[8px] shrink-0 size-[28px]">
                                              <div className="relative shrink-0 size-[24px]">
                                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                                  <g>
                                                    <path d={svgPaths3.p22990f00} fill="var(--fill-0, #0F6BEB)" />
                                                  </g>
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Tilde Separator */}
                                        <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                                          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">~</p>
                                          </div>
                                        </div>
                                        {/* Second Time Input */}
                                        <div className="bg-white box-border content-stretch flex flex-col gap-[4px] items-start justify-center max-w-[160px] min-w-[160px] p-[8px] relative rounded-[8px] shrink-0 w-[160px]">
                                          <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                                          <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
                                            <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
                                              <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#a8a8a8] text-[16px]">時：分</p>
                                            </div>
                                            <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] relative rounded-[8px] shrink-0 size-[28px]">
                                              <div className="relative shrink-0 size-[24px]">
                                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                                  <g>
                                                    <path d={svgPaths3.p22990f00} fill="var(--fill-0, #0F6BEB)" />
                                                  </g>
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Every Day Label */}
                                        <div className="box-border content-stretch flex flex-col gap-[4px] h-full items-start justify-center p-[8px] relative rounded-[8px] shrink-0">
                                          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                                            <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[16px] text-center text-nowrap whitespace-pre">（每天）</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Keyword Tags - Only shown when responseType is '觸發關鍵字' */}
                    {responseType === '觸發關鍵字' && (
                      <div className="content-stretch flex items-start relative shrink-0 w-full">
                        <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0">
                          <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]">
                            <div className="overflow-clip relative shrink-0 size-[20px]">
                              <div className="absolute inset-0">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                  <g></g>
                                </svg>
                              </div>
                              <div className="absolute inset-[12.5%]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                                  <path d={svgPaths4.p2f710980} fill="var(--fill-0, #0F6BEB)" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="content-stretch flex items-center relative shrink-0">
                              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                                <p className="leading-[1.5] whitespace-pre">關鍵字標籤</p>
                              </div>
                            </div>
                            <div className="content-stretch flex items-center relative shrink-0">
                              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
                                <p className="leading-[1.5] whitespace-pre">*</p>
                              </div>
                            </div>
                          </div>
                          <div className="overflow-clip relative shrink-0 size-[24px]">
                            <div className="absolute inset-[16.667%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                <path d={svgPaths4.p2d577a80} fill="var(--fill-0, #0F6BEB)" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
                          <div className="bg-white min-h-[48px] relative rounded-[8px] shrink-0 w-full">
                            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                            <div className="flex flex-col justify-center min-h-inherit size-full">
                              <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[16px] relative w-full">
                                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                                  <input
                                    type="text"
                                    value={keywordTags}
                                    onChange={(e) => setKeywordTags(e.target.value.slice(0, 20))}
                                    placeholder="點擊 Enter 即可新增關鍵字標籤"
                                    className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] bg-transparent border-none outline-none placeholder:text-[#717182]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="h-[18px] relative shrink-0 w-full">
                            <div className="absolute flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 justify-center leading-[0] text-[#6e6e6e] text-[12px] text-nowrap text-right">
                              <p className="leading-[1.5] whitespace-pre">
                                {keywordTags.length}<span className="text-[#383838]">/20</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Keyword Tags - Only shown when responseType is '一律回應' */}
                    {responseType === '一律回應' && (
                      <div className="content-stretch flex items-start relative shrink-0 w-full">
                        <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0">
                          <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]">
                            <div className="overflow-clip relative shrink-0 size-[20px]">
                              <div className="absolute inset-0">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                  <g></g>
                                </svg>
                              </div>
                              <div className="absolute inset-[12.5%]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                                  <path d={svgPaths4.p2f710980} fill="var(--fill-0, #0F6BEB)" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="content-stretch flex items-center relative shrink-0">
                              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                                <p className="leading-[1.5] whitespace-pre">關鍵字標籤</p>
                              </div>
                            </div>
                            <div className="content-stretch flex items-center relative shrink-0">
                              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
                                <p className="leading-[1.5] whitespace-pre">*</p>
                              </div>
                            </div>
                          </div>
                          <div className="overflow-clip relative shrink-0 size-[24px]">
                            <div className="absolute inset-[16.667%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                <path d={svgPaths4.p2d577a80} fill="var(--fill-0, #0F6BEB)" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
                          <div className="bg-white min-h-[48px] relative rounded-[8px] shrink-0 w-full">
                            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                            <div className="flex flex-col justify-center min-h-inherit size-full">
                              <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[16px] relative w-full">
                                <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
                                  <input
                                    type="text"
                                    value={alwaysReplyTags}
                                    onChange={(e) => setAlwaysReplyTags(e.target.value.slice(0, 20))}
                                    placeholder="點擊 Enter 即可新增關鍵字標籤"
                                    className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] bg-transparent border-none outline-none placeholder:text-[#717182]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="h-[18px] relative shrink-0 w-full">
                            <div className="absolute flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 justify-center leading-[0] text-[#6e6e6e] text-[12px] text-nowrap text-right">
                              <p className="leading-[1.5] whitespace-pre">
                                {alwaysReplyTags.length}<span className="text-[#383838]">/20</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="h-0 relative shrink-0 w-full">
                      <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1018 1">
                          <line stroke="var(--stroke-0, #E1EBF9)" strokeLinecap="round" x1="0.5" x2="1017.5" y1="0.5" y2="0.5" />
                        </svg>
                      </div>
                    </div>

                    {/* Message Text */}
                    <div className="content-stretch flex flex-col gap-[10px] items-end relative shrink-0 w-full">
                      <div className="content-stretch flex items-start relative shrink-0 w-full">
                        <div className="content-stretch flex gap-[2px] items-center min-w-[160px] relative shrink-0">
                          <div className="content-stretch flex gap-[10px] items-center justify-center opacity-0 relative shrink-0 size-[24px]">
                            <div className="overflow-clip relative shrink-0 size-[20px]">
                              <div className="absolute inset-0">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                  <g></g>
                                </svg>
                              </div>
                              <div className="absolute inset-[12.5%]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                                  <path d={svgPaths.p2f710980} fill="var(--fill-0, #0F6BEB)" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0">
                            <div className="content-stretch flex items-center relative shrink-0">
                              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#383838] text-[16px] text-nowrap">
                                <p className="leading-[1.5] whitespace-pre">訊息文字</p>
                              </div>
                            </div>
                            <div className="content-stretch flex items-center relative shrink-0">
                              <div className="flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#f44336] text-[16px] text-nowrap">
                                <p className="leading-[1.5] whitespace-pre">*</p>
                              </div>
                            </div>
                          </div>
                          <div className="opacity-0 overflow-clip relative shrink-0 size-[24px]">
                            <div className="absolute inset-[16.667%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                <path d={svgPaths.p2d577a80} fill="var(--fill-0, #0F6BEB)" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
                          <div className="bg-white min-h-[48px] relative rounded-[8px] shrink-0 w-full">
                            <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                            <div className="flex flex-col justify-center min-h-inherit size-full">
                              <div className="box-border content-stretch flex flex-col gap-[4px] items-start justify-center min-h-inherit p-[16px] relative w-full">
                                <textarea
                                  value={messageText}
                                  onChange={(e) => setMessageText(e.target.value.slice(0, 100))}
                                  placeholder="輸入訊息文字"
                                  className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-[84px] min-w-px relative shrink-0 text-[#383838] text-[16px] bg-transparent border-none outline-none placeholder:text-[#a8a8a8] resize-none w-full"
                                />
                                <button className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 hover:bg-neutral-200 transition-colors">
                                  <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">好友的顯示名稱</p>
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="h-[18px] relative shrink-0 w-full">
                            <div className="absolute flex flex-col font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 justify-center leading-[0] text-[#6e6e6e] text-[12px] text-nowrap text-right">
                              <p className="leading-[1.5] whitespace-pre">
                                {messageText.length}<span className="text-[#383838]">/100</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}