import { useState, useRef, useEffect, useCallback } from "react";
import { FBConfigPanel } from "./FBConfigPanel";
import { FBPreviewPanel } from "./FBPreviewPanel";
import { FlexBubble, MessengerMessage } from "./fb-types";
import { Plus, Copy, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// FB 預設圖片佔位符
export const FB_PLACEHOLDER_IMAGE = "/images/fb-placeholder.png";

interface FacebookMessageEditorProps {
  onJsonChange?: (json: MessengerMessage | null) => void;
  initialJson?: MessengerMessage | null;
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
        text: "標題文字",
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
    buttonTypes: {},
    buttonPayloads: {},
    buttonLabels: {}
  }
});

// Convert Messenger JSON back to internal FlexBubble format
const convertFromMessengerFormat = (json: MessengerMessage): FlexBubble[] => {
  const elements = json.attachment?.payload?.elements || [];
  return elements.map((element: any) => {
    const bubble: FlexBubble = {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: element.title || "標題文字",
            weight: "bold",
            size: "xl",
          },
          {
            type: "text",
            text: element.subtitle || "",
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
        contents: (element.buttons || []).map((btn: any) => ({
          type: "button",
          action: {
            type: btn.type === "web_url" ? "uri" : "postback",
            label: btn.title || "按鈕",
            uri: btn.url,
            data: btn.payload,
          },
          style: "secondary",
        })),
      },
      _metadata: {
        buttonTypes: {},
        buttonPayloads: {},
        buttonLabels: {}
      }
    };

    if (element.image_url) {
      bubble.hero = {
        type: "image",
        url: element.image_url,
        size: "full",
        aspectRatio: "1.91:1",
        aspectMode: "cover",
      };
      if (element.default_action?.url) {
        bubble.hero.action = {
          type: "uri",
          uri: element.default_action.url,
        };
      }
    }

    return bubble;
  });
};

export function FacebookMessageEditor({ onJsonChange, initialJson }: FacebookMessageEditorProps) {
  const [bubbles, setBubbles] = useState<FlexBubble[]>(() => {
    if (initialJson && initialJson.attachment?.payload?.elements?.length) {
      return convertFromMessengerFormat(initialJson);
    }
    return [createDefaultBubble()];
  });
  const [activeBubbleIndex, setActiveBubbleIndex] = useState(0);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Convert internal format to Facebook Messenger format
  const convertToMessengerFormat = useCallback((): MessengerMessage => {
    const elements = bubbles.map(bubble => {
      const titleText = bubble.body?.contents.find((c: any) => c.type === "text" && c.size === "xl")?.text || "";
      const subtitleText = bubble.body?.contents.find((c: any) => c.type === "text" && c.size === "sm")?.text || "";

      const element: any = {
        title: titleText,
      };

      if (subtitleText) {
        element.subtitle = subtitleText;
      }

      if (bubble.hero?.url && !bubble.hero.url.startsWith("data:image/svg")) {
        element.image_url = bubble.hero.url;
      }

      if (bubble.hero?.action?.uri) {
        element.default_action = {
          type: "web_url",
          url: bubble.hero.action.uri,
        };
      }

      const buttons = bubble.footer?.contents
        .filter((c: any) => c.type === "button")
        .slice(0, 3) // Facebook限制最多3個按鈕
        .map((btn: any) => ({
          type: btn.action.type === "uri" ? "web_url" : "postback",
          title: btn.action.label || "按鈕",
          ...(btn.action.type === "uri" ? { url: btn.action.uri } : { payload: btn.action.data }),
        }));

      if (buttons && buttons.length > 0) {
        element.buttons = buttons;
      }

      return element;
    });

    return {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements,
        },
      },
    };
  }, [bubbles]);

  // Notify parent of JSON changes
  useEffect(() => {
    if (onJsonChange) {
      const json = convertToMessengerFormat();
      onJsonChange(json);
    }
  }, [bubbles, onJsonChange, convertToMessengerFormat]);

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
                return { ...item, text: "標題文字" };
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
      }

      // Copy footer structure (button count and styles) - max 3 buttons for Facebook
      if (firstBubble.footer) {
        const buttonCount = Math.min(firstBubble.footer.contents.length, 3);
        newBubble.footer = {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: firstBubble.footer.contents.slice(0, buttonCount).map((btn: any, idx: number) => {
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
        console.log("Hero status changed:", { newFirstBubbleHasHero, oldFirstBubbleHasHero });

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
            console.log("Removing hero from bubble", i);
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

  const getFlexMessage = () => {
    return convertToMessengerFormat();
  };

  const exportJSON = () => {
    const messengerFormat = convertToMessengerFormat();
    const jsonString = JSON.stringify(messengerFormat, null, 2);

    try {
      navigator.clipboard.writeText(jsonString);
      toast.success("JSON 已複製到剪貼簿");
    } catch (error) {
      // Fallback: download as file
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "messenger-message.json";
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
          <FBConfigPanel
            bubble={bubbles[activeBubbleIndex]}
            onChange={(bubble) => updateBubble(activeBubbleIndex, bubble)}
            bubbleIndex={activeBubbleIndex}
            allBubbles={bubbles}
            onUpdateAllBubbles={setBubbles}
            onDuplicateBubble={duplicateBubble}
            canDuplicate={bubbles.length < 10}
          />
        </div>
      </div>
    </div>
  );
}
