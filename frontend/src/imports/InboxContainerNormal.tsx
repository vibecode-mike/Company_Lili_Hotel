import { useState, useRef, useEffect } from "react";
import CaptionComponent from "./Caption";

function Paragraph() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16.938px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[18px] relative w-[16.938px]">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">OA</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-white content-stretch flex items-center justify-center relative rounded-[3.35544e+07px] shrink-0 size-[45px]" data-name="Container">
      <Paragraph />
    </div>
  );
}

function CardDescription({ text }: { text: string }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Card Description">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">{text}</p>
        </div>
      </div>
    </div>
  );
}

function TemplateTextOnly({ text }: { text: string }) {
  return (
    <div className="bg-[#f6f9fd] content-stretch flex flex-col items-center max-w-[288px] overflow-clip relative rounded-[15px] shrink-0 w-[288px]" data-name="Template#Text only">
      <CardDescription text={text} />
    </div>
  );
}

function UserMessage({ text, time }: { text: string; time: string }) {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full">
      <Container />
      <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0">
        <TemplateTextOnly text={text} />
        <div className="h-[18px] relative shrink-0 w-full" data-name="caption">
          <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 leading-[1.5] text-[12px] text-white">{time}</p>
        </div>
      </div>
    </div>
  );
}

function CardDescription1({ text }: { text: string }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Card Description">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-center flex flex-wrap gap-0 items-center p-[16px] relative w-full">
          <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-right text-white">{text}</p>
        </div>
      </div>
    </div>
  );
}

function TemplateTextOnly1({ text }: { text: string }) {
  return (
    <div className="bg-[#383838] content-stretch flex flex-col items-center max-w-[288px] overflow-clip relative rounded-[15px] shrink-0 w-[288px]" data-name="Template#Text only">
      <CardDescription1 text={text} />
    </div>
  );
}

function OfficialMessage({ text, time }: { text: string; time: string }) {
  return (
    <div className="content-stretch flex gap-[20px] items-start justify-end relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0">
        <TemplateTextOnly1 text={text} />
        <div className="h-[18px] relative shrink-0 w-full" data-name="caption">
          <p className="absolute font-['Noto_Sans_TC:Regular',sans-serif] font-normal inset-0 leading-[1.5] text-[12px] text-right text-white">{time}</p>
        </div>
      </div>
      <Container />
    </div>
  );
}

interface Message {
  id: number;
  type: 'user' | 'official';
  text: string;
  time: string;
}

export default function InboxContainerNormal() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'user', text: '文字訊息', time: '下午 03:30' },
    { id: 2, type: 'official', text: '官方文字訊息', time: '下午 03:40 已讀' },
    { id: 3, type: 'user', text: '文字訊息', time: '下午 04:30' },
    { id: 4, type: 'official', text: '官方文字訊息', time: '下午 04:50 已讀' },
    { id: 5, type: 'user', text: '文字訊息', time: '下午 05:30' },
    { id: 6, type: 'official', text: '官方文字訊息', time: '下午 05:50 已讀' },
    { id: 7, type: 'user', text: '文字訊息', time: '下午 06:30' },
    { id: 8, type: 'official', text: '官方文字訊息', time: '下午 06:50 已讀' },
    { id: 9, type: 'user', text: '文字訊息', time: '下午 07:30' },
    { id: 10, type: 'official', text: '官方文字訊息', time: '下午 07:50 已讀' },
    { id: 11, type: 'official', text: '官方文字訊息', time: '下午 08:50 已讀' },
    { id: 12, type: 'user', text: '文字訊息', time: '下午 09:30' },
    { id: 13, type: 'official', text: '官方文字訊息', time: '下午 10:00 已讀' },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [showDateCaption, setShowDateCaption] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 處理滾動事件
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      // 當滾動超過 50px 時顯示日期標籤
      setShowDateCaption(scrollTop > 50);
    }
  };

  // 滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 當新訊息添加時滾動到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 發送訊息
  const handleSendMessage = () => {
    if (inputText.trim()) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const period = hours >= 12 ? '下午' : '上午';
      const displayHours = hours % 12 || 12;
      const timeString = `${period} ${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} 已讀`;
      
      const newMessage: Message = {
        id: messages.length + 1,
        type: 'official',
        text: inputText,
        time: timeString,
      };
      
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  // 處理 Enter 鍵發送
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#a5d8ff] relative rounded-[20px] size-full to-[#d0ebff]" data-name="Inbox Container#Normal">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[60px] items-start overflow-clip p-[24px] relative size-full">
          {/* 訊息滾動容器 */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto relative shrink-0 w-full"
          >
            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[20px] items-start relative w-full">
              {messages.map((message) => (
                message.type === 'user' ? (
                  <UserMessage key={message.id} text={message.text} time={message.time} />
                ) : (
                  <OfficialMessage key={message.id} text={message.text} time={message.time} />
                )
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 輸入區域 */}
          <div className="relative rounded-[20px] shrink-0 w-full" data-name="Container">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[32px] items-end relative w-full">
              <div className="basis-0 content-stretch flex gap-[32px] grow items-start min-h-px min-w-px relative rounded-[20px] shrink-0" data-name="Container">
                <div className="basis-0 bg-white grow min-h-[48px] min-w-px relative rounded-[20px] shrink-0" data-name="Text area">
                  <div className="flex flex-row justify-end min-h-inherit size-full">
                    <div className="box-border content-stretch flex gap-[4px] items-start justify-end min-h-inherit p-[20px] relative w-full">
                      <div className="basis-0 content-stretch flex flex-col gap-[12px] grow h-[168px] items-start min-h-[96px] min-w-px relative shrink-0" data-name="Container">
                        {/* 輸入框 */}
                        <div className="basis-0 content-stretch flex flex-wrap gap-[10px] grow items-center justify-center min-h-[108px] min-w-px relative shrink-0 w-full">
                          <div className="relative w-full h-full flex items-center">
                            <textarea
                              ref={inputRef}
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              onKeyPress={handleKeyPress}
                              onFocus={() => setIsInputFocused(true)}
                              onBlur={() => setIsInputFocused(false)}
                              placeholder="輸入訊息文字"
                              className="w-full h-full font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] text-[#383838] text-[16px] bg-transparent border-0 outline-none resize-none placeholder:text-[#a8a8a8]"
                              style={{ caretColor: inputText && isInputFocused ? 'transparent' : 'auto' }}
                            />
                            {/* 閃爍游標 - 只在有內容且聚焦時顯示 */}
                            {inputText && isInputFocused && (
                              <span 
                                className="blinking-cursor absolute pointer-events-none text-[#383838] text-[16px] font-['Noto_Sans_TC:Regular',sans-serif]"
                                style={{
                                  left: `${Math.min(inputText.length * 9, 100)}px`,
                                  top: '50%',
                                  transform: 'translateY(-50%)'
                                }}
                              >
                                ｜
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* 按鈕區域 */}
                        <div className="content-stretch flex gap-[4px] items-start justify-end relative shrink-0 w-full">
                          <div className="bg-neutral-100 box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity" data-name="Button/Filled Button">
                            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px] text-center">排程傳送</p>
                          </div>
                          <div 
                            onClick={handleSendMessage}
                            className="bg-[#242424] box-border content-stretch flex items-center justify-center min-h-[48px] min-w-[72px] px-[12px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                            data-name="Button/Filled Button"
                          >
                            <p className="basis-0 font-['Noto_Sans_TC:Regular',sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[16px] text-center text-white">傳送</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 日期標籤 - 滾動時顯示 */}
          <div 
            className={`absolute left-[calc(50%+0.5px)] rounded-[28px] top-[16px] translate-x-[-50%] transition-opacity duration-300 ${showDateCaption ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
            data-name="caption"
          >
            <div className="bg-[rgba(246,249,253,0.7)] relative rounded-[28px]" data-name="caption">
              <div aria-hidden="true" className="absolute border-[#e8e8e8] border-[0.4px] border-solid inset-0 pointer-events-none rounded-[28px]" />
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[2px] relative">
                <p className="font-['Noto_Sans_TC:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#6e6e6e] text-[12px] text-center text-nowrap whitespace-pre">2025/10/08（三）</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
