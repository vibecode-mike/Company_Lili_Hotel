import { useState, useRef, useEffect, useCallback } from "react";
import { FBConfigPanel } from "./FBConfigPanel";
import { FBPreviewPanel } from "./FBPreviewPanel";
import { FlexBubble, FlexMessage } from "./fb-types";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// FB 預設圖片佔位符
export const FB_PLACEHOLDER_IMAGE = "/images/fb-placeholder.png";

interface FacebookMessageEditorProps {
  onJsonChange?: (json: FlexMessage | null) => void;
  initialJson?: FlexMessage | null;
}

const createDefaultBubble = (): FlexBubble => ({
  type: "bubble",
  hero: {
    type: "image",
    url: FB_PLACEHOLDER_IMAGE,
    size: "full",
    aspectRatio: "1.91:1",
    aspectMode: "cover",
  },
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: "",
        weight: "bold",
        size: "xl",
      },
      {
        type: "text",
        text: "內文文字說明",
        wrap: true,
        color: "#666666",
        size: "sm",
        margin: "md",
      },
    ],
  },
  footer: {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: [],
  },
  _metadata: {
    buttonLabels: {}
  }
});

// Initialize editor from Flex Message format
const initFromFlexFormat = (json: FlexMessage): FlexBubble[] => {
  if (json.type === "carousel" && json.contents) {
    return json.contents.map(bubble => ({
      ...bubble,
      _metadata: bubble._metadata || { buttonLabels: {} }
    }));
  } else if (json.type === "bubble") {
    return [{
      type: "bubble",
      hero: json.hero as any,
      body: json.body,
      footer: json.footer,
      styles: json.styles,
      _metadata: (json as any)._metadata || { buttonLabels: {} }
    }];
  }
  return [createDefaultBubble()];
};

export function FacebookMessageEditor({ onJsonChange, initialJson }: FacebookMessageEditorProps) {
  const [bubbles, setBubbles] = useState<FlexBubble[]>(() => {
    if (initialJson) {
      return initFromFlexFormat(initialJson);
    }
    return [createDefaultBubble()];
  });
  const [activeBubbleIndex, setActiveBubbleIndex] = useState(0);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Convert internal format to Flex Message format (same as LINE)
  const convertToFlexFormat = useCallback((): FlexMessage => {
    if (bubbles.length === 1) {
      const bubble = bubbles[0];
      return {
        type: "bubble",
        hero: bubble.hero,
        body: bubble.body,
        footer: bubble.footer,
        styles: bubble.styles,
      } as FlexMessage;
    }
    return {
      type: "carousel",
      contents: bubbles.map(bubble => ({
        type: "bubble",
        hero: bubble.hero,
        body: bubble.body,
        footer: bubble.footer,
        styles: bubble.styles,
      })),
    };
  }, [bubbles]);

  // Notify parent of JSON changes
  useEffect(() => {
    if (onJsonChange) {
      const json = convertToFlexFormat();
      onJsonChange(json);
    }
  }, [bubbles, onJsonChange, convertToFlexFormat]);

  const addBubble = () => {
    if (bubbles.length >= 10) {
      toast.error("輪播最多只能設定 10 個");
      return;
    }
    const newBubble = createDefaultBubble();

    // Copy structure from first bubble to maintain consistent layout
    if (bubbles.length > 0) {
      const firstBubble = bubbles[0];

      // Copy hero structure - only if first bubble has hero
      if (firstBubble.hero) {
        newBubble.hero = {
          ...firstBubble.hero,
          url: FB_PLACEHOLDER_IMAGE,
        };
      } else {
        // First bubble has no hero, so new bubble shouldn't have one either
        delete newBubble.hero;
      }

      // Copy body structure (which text elements exist)
      if (firstBubble.body) {
        newBubble.body = {
          type: "box",
          layout: "vertical",
          contents: firstBubble.body.contents.map((item: any) => {
            if (item.type === "text") {
              if (item.size === "xl") {
                // Title element
                return { ...item, text: "" };
              } else {
                // Subtitle element - preserve price structure if exists
                const hasPrice = item.text && item.text.includes('\n');
                if (hasPrice) {
                  // Keep the same structure with newline for price
                  const lines = item.text.split('\n');
                  const defaultSubtitle = "內文文字說明";
                  const priceLines = lines.slice(1); // Keep all lines after first (price info)
                  return { ...item, text: `${defaultSubtitle}\n${priceLines.join('\n')}` };
                } else {
                  return { ...item, text: "內文文字說明" };
                }
              }
            }
            return item;
          }),
        };

        const hasTitle = newBubble.body.contents.some((item: any) => item?.type === "text" && item?.size === "xl");
        if (!hasTitle) {
          newBubble.body.contents.unshift({
            type: "text",
            text: "",
            weight: "bold",
            size: "xl",
          });
        }
      }

      // Copy footer structure (button count and styles) - max 3 buttons for Facebook
      if (firstBubble.footer) {
        const buttonCount = Math.min(firstBubble.footer.contents.length, 3);
        newBubble.footer = {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: firstBubble.footer.contents.slice(0, buttonCount).map((btn: any) => {
            return {
              ...btn,
              action: {
                type: "uri",
                label: `動作按鈕`,
                uri: "https://example.com",
              },
            };
          }),
        };
      }
    }

    setBubbles([...bubbles, newBubble]);
    setActiveBubbleIndex(bubbles.length);

    // Scroll to the newly added tab
    setTimeout(() => {
      if (tabScrollRef.current) {
        tabScrollRef.current.scrollTo({
          left: tabScrollRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const updateBubble = (index: number, bubble: FlexBubble) => {
    const newBubbles = [...bubbles];

    // If modifying the first bubble (index 0), sync hero to all other bubbles
    if (index === 0 && bubbles.length > 1) {
      const newFirstBubbleHasHero = !!bubble.hero;
      const oldFirstBubbleHasHero = !!bubbles[0].hero;

      // If hero status changed (added or removed)
      if (newFirstBubbleHasHero !== oldFirstBubbleHasHero) {
        // Update all other bubbles
        for (let i = 1; i < newBubbles.length; i++) {
          const targetBubble = JSON.parse(JSON.stringify(newBubbles[i]));

          if (newFirstBubbleHasHero) {
            // First bubble has hero - ensure all bubbles have hero
            if (!targetBubble.hero) {
              targetBubble.hero = {
                type: "image",
                url: FB_PLACEHOLDER_IMAGE,
                size: "full",
                aspectRatio: bubble.hero.aspectRatio || "1.91:1",
                aspectMode: "cover",
              };
              if (bubble.hero.action) {
                targetBubble.hero.action = JSON.parse(JSON.stringify(bubble.hero.action));
              }
            }
          } else {
            // First bubble has no hero - remove hero from all bubbles
            delete targetBubble.hero;
          }

          newBubbles[i] = targetBubble;
        }
      }
    }

    // Update the bubble that was modified
    newBubbles[index] = bubble;
    setBubbles(newBubbles);
  };

  const duplicateBubble = () => {
    if (bubbles.length >= 10) {
      toast.error("輪播最多只能設定 10 個");
      return;
    }

    const newBubble = JSON.parse(JSON.stringify(bubbles[activeBubbleIndex]));

    // Ensure structure matches first bubble
    const firstBubble = bubbles[0];

    // Copy footer structure (button count and styles) from first bubble - max 3 buttons
    if (firstBubble.footer) {
      const buttonCount = Math.min(firstBubble.footer.contents.length, 3);
      newBubble.footer = {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: firstBubble.footer.contents.slice(0, buttonCount).map((btn: any, idx: number) => {
          // Try to keep current bubble's button content if exists
          const currentBtn = newBubble.footer?.contents?.[idx];
          return {
            ...btn,
            action: {
              type: "uri",
              label: currentBtn?.action?.label || `動作按鈕`,
              uri: currentBtn?.action?.uri || "https://example.com",
            },
          };
        }),
      };
    }

    setBubbles([...bubbles, newBubble]);
    setActiveBubbleIndex(bubbles.length);
    toast.success("已複製圖卡");
  };

  const deleteBubble = (index: number) => {
    if (bubbles.length === 1) {
      toast.error("至少需要保留一張圖卡");
      return;
    }
    const newBubbles = bubbles.filter((_, i) => i !== index);
    setBubbles(newBubbles);
    if (activeBubbleIndex >= newBubbles.length) {
      setActiveBubbleIndex(newBubbles.length - 1);
    }
    toast.success("已刪除圖卡");
  };

  const exportJSON = () => {
    const flexFormat = convertToFlexFormat();
    const jsonString = JSON.stringify(flexFormat, null, 2);

    try {
      navigator.clipboard.writeText(jsonString);
      toast.success("JSON 已複製到剪貼簿");
    } catch (error) {
      // Fallback: download as file
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "flex-message.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("JSON 檔案已下載");
    }
  };

  return (
    <div className="w-full h-full bg-[#F8FAFC] overflow-y-auto">
      <div className="flex gap-[32px] items-start p-[40px] w-full">
        {/* Left: Preview Card */}
        <div className="shrink-0">
          <div className="bg-gradient-to-b from-[#a5d8ff] to-[#d0ebff] rounded-[20px] p-[24px] w-[460px] flex flex-col items-center justify-center">
            <FBPreviewPanel
              bubbles={bubbles}
              activeBubbleIndex={activeBubbleIndex}
              onBubbleChange={setActiveBubbleIndex}
            />
          </div>
        </div>

        {/* Right: Form Section */}
        <div className="flex-1 flex flex-col gap-[12px]">
          {/* Header: 編輯狀態與刪除按鈕 */}
          <div className="flex items-center justify-between h-[40px] px-[4px]">
            {/* 左側：正在編輯狀態 */}
            <div className="flex items-center gap-[8px]">
              <span className="text-[14px] leading-[20px] text-[#383838]">
                正在編輯：輪播 {activeBubbleIndex + 1} / {bubbles.length}
              </span>
            </div>

            {/* 右側：刪除按鈕（僅在 >1 張輪播時顯示）*/}
            {bubbles.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteBubble(activeBubbleIndex)}
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
              <div ref={tabScrollRef} className="bg-neutral-100 rounded-[10px] p-[4px] flex items-center gap-[4px] flex-nowrap shrink-0">
                {bubbles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveBubbleIndex(index)}
                    className={`h-[32px] px-[16px] rounded-[10px] flex items-center transition-all shrink-0 whitespace-nowrap ${
                      index === activeBubbleIndex
                        ? 'bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]'
                        : 'hover:bg-white/50'
                    }`}
                  >
                    <p className={`text-[14px] leading-[20px] whitespace-nowrap ${
                      index === activeBubbleIndex ? 'text-[#101828]' : 'text-[#6a7282]'
                    }`}>
                      輪播 {index + 1}
                    </p>
                  </button>
                ))}
              </div>

              {bubbles.length < 10 && (
                <button
                  onClick={addBubble}
                  className="h-[32px] px-[8px] flex items-center gap-[6px] hover:bg-gray-50 rounded transition-colors shrink-0 whitespace-nowrap"
                >
                  <Plus className="size-[16px] text-[#0f6beb] shrink-0" strokeWidth={1.33} />
                  <span className="text-[14px] leading-[20px] text-[#0f6beb] whitespace-nowrap">新增輪播</span>
                </button>
              )}
            </div>
          </div>

          {/* Config Panel */}
          {bubbles[activeBubbleIndex] && (
            <FBConfigPanel
              bubble={bubbles[activeBubbleIndex]}
              onChange={(bubble) => updateBubble(activeBubbleIndex, bubble)}
              bubbleIndex={activeBubbleIndex}
              allBubbles={bubbles}
              onUpdateAllBubbles={setBubbles}
              onDuplicateBubble={duplicateBubble}
              canDuplicate={bubbles.length < 10}
            />
          )}
        </div>
      </div>
    </div>
  );
}
