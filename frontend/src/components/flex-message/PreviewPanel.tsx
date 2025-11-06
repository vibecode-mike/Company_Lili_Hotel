import { FlexBubble } from "./types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

interface PreviewPanelProps {
  bubbles: FlexBubble[];
  activeBubbleIndex: number;
  onBubbleChange: (index: number) => void;
}

export function PreviewPanel({ bubbles, activeBubbleIndex, onBubbleChange }: PreviewPanelProps) {
  const total = bubbles.length > 0 ? bubbles.length : 1;
  const safeIndex = Math.min(activeBubbleIndex, total - 1);
  const currentBubble = useMemo(() => bubbles[safeIndex] ?? bubbles[0], [bubbles, safeIndex]);
  const canNavigate = total > 1 && currentBubble;

  const handlePrevious = () => {
    if (!canNavigate || safeIndex === 0) return;
    onBubbleChange(safeIndex - 1);
  };

  const handleNext = () => {
    if (!canNavigate || safeIndex >= total - 1) return;
    onBubbleChange(safeIndex + 1);
  };

  if (!currentBubble) {
    return null;
  }

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-8 py-12"
    >
      <div
        className="relative w-full max-w-[600px]"
        style={{ minWidth: "600px" }}
      >
        {total > 1 && (
          <>
            <button
              onClick={handlePrevious}
              disabled={safeIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/95 p-2.5 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-30"
              style={{ transform: "translate(-50%, -50%)" }}
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={handleNext}
              disabled={safeIndex === total - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/95 p-2.5 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-30"
              style={{ transform: "translate(50%, -50%)" }}
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        <div className="flex items-center justify-center px-4">
          <div
            key={safeIndex}
            className="overflow-hidden bg-white transition-all duration-300 ease-out"
            style={{
              width: "100%",
              maxWidth: "400px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)"
            }}
          >
            <FlexBubblePreview bubble={currentBubble} />
          </div>
        </div>

        {total > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {bubbles.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === safeIndex ? "w-6 bg-[#06C755]" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => onBubbleChange(index)}
                aria-label={`預覽輪播 ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlexBubblePreview({ bubble }: { bubble: FlexBubble }) {
  return (
    <div style={{ backgroundColor: "#FFFFFF" }}>
      {bubble.hero && bubble.hero.type === "image" && (
        <div className="relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#F0F0F0" }}>
          <img
            src={bubble.hero.url}
            alt="Hero"
            className="h-auto w-full object-cover"
            style={{
              aspectRatio: bubble.hero.aspectRatio || "1.92:1",
              display: "block",
            }}
            onError={(e) => {
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='sans-serif' font-size='14'%3E選擇圖片%3C/text%3E%3C/svg%3E";
            }}
          />
          {bubble.hero.action && (
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs shadow-sm"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(4px)",
                color: "#424242",
                fontWeight: "500"
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>可點擊</span>
            </div>
          )}
        </div>
      )}

      {bubble.body && bubble.body.contents.some((c: any) => c.type === "text" && c.text && c.text.trim() !== "") && (
        <div style={{ padding: "16px 20px" }}>
          {bubble.body.contents.map((content: any, index: number) => {
            if (content.type === "text") {
              const fontSize =
                content.size === "xxl" ? "22px" :
                content.size === "xl" ? "20px" :
                content.size === "lg" ? "18px" :
                content.size === "md" ? "16px" :
                content.size === "sm" ? "14px" :
                content.size === "xs" ? "12px" :
                content.size === "xxs" ? "11px" : "16px";

              return (
                <div
                  key={index}
                  style={{
                    color: content.color || "#111111",
                    fontSize: fontSize,
                    fontWeight: content.weight === "bold" ? "600" : "normal",
                    lineHeight: "1.5",
                    marginTop:
                      content.margin === "xxl" ? "24px" :
                      content.margin === "xl" ? "20px" :
                      content.margin === "lg" ? "16px" :
                      content.margin === "md" ? "12px" :
                      content.margin === "sm" ? "8px" :
                      content.margin === "xs" ? "4px" :
                      index > 0 ? "4px" : "0",
                    whiteSpace: content.wrap ? "normal" : "nowrap",
                    wordWrap: content.wrap ? "break-word" : "normal",
                    textAlign:
                      content.align === "end" ? "right" :
                      content.align === "center" ? "center" : "left",
                  }}
                >
                  {content.text}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {bubble.footer && bubble.footer.contents && bubble.footer.contents.length > 0 && (
        <div className="flex flex-col" style={{ padding: "0 20px 16px 20px", gap: "8px" }}>
          {bubble.footer.contents.map((content: any, index: number) => {
            if (content.type === "button") {
              const isPrimary = content.style === "primary";
              const isSecondary = content.style === "secondary";
              const isLink = content.style === "link";
              const buttonLabel = content.action?.label || "按鈕";

              // 計算按鈕的上邊距
              const getMarginTop = () => {
                if (index === 0 && content.margin) {
                  switch (content.margin) {
                    case "xxl": return "24px";
                    case "xl": return "20px";
                    case "lg": return "16px";
                    case "md": return "12px";
                    case "sm": return "8px";
                    case "xs": return "4px";
                    default: return "0";
                  }
                }
                return "0";
              };

              // 決定按鈕樣式 - 使用內聯樣式確保顏色正確顯示
              let buttonStyle: any = {
                marginTop: getMarginTop(),
                height: content.height === "sm" ? "40px" : "48px",
                minHeight: content.height === "sm" ? "40px" : "48px",
                letterSpacing: "0.015em",
                width: "100%",
                borderRadius: "8px",
                padding: "0 16px",
                fontSize: "15px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
                outline: "none",
              };

              if (isPrimary) {
                buttonStyle = {
                  ...buttonStyle,
                  backgroundColor: "#06C755",
                  color: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 1px 2px rgba(6, 199, 85, 0.15)",
                };
              } else if (isSecondary) {
                buttonStyle = {
                  ...buttonStyle,
                  backgroundColor: "#EBEBEB",
                  color: "#111111",
                  border: "none",
                  boxShadow: "0 1px 1px rgba(0, 0, 0, 0.05)",
                };
              } else {
                buttonStyle = {
                  ...buttonStyle,
                  backgroundColor: "#FFFFFF",
                  color: "#06C755",
                  border: "1px solid #DADADA",
                  boxShadow: "0 1px 1px rgba(0, 0, 0, 0.04)",
                };
              }

              return (
                <button
                  key={index}
                  style={buttonStyle}
                  onMouseEnter={(e) => {
                    if (isPrimary) {
                      e.currentTarget.style.backgroundColor = "#05b34d";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(6, 199, 85, 0.2)";
                    } else if (isSecondary) {
                      e.currentTarget.style.backgroundColor = "#DDDDDD";
                    } else {
                      e.currentTarget.style.backgroundColor = "#F7F7F7";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isPrimary) {
                      e.currentTarget.style.backgroundColor = "#06C755";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(6, 199, 85, 0.15)";
                    } else if (isSecondary) {
                      e.currentTarget.style.backgroundColor = "#EBEBEB";
                    } else {
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }
                  }}
                >
                  {buttonLabel}
                </button>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
