import { FlexBubble } from "./fb-types";

interface FBPreviewPanelProps {
  bubbles: FlexBubble[];
  activeBubbleIndex: number;
  onBubbleChange: (index: number) => void;
}

export function FBPreviewPanel({ bubbles, activeBubbleIndex }: FBPreviewPanelProps) {
  const currentBubble = bubbles[activeBubbleIndex];

  if (!currentBubble) {
    return null;
  }

  return <FlexBubblePreview bubble={currentBubble} />;
}

function FlexBubblePreview({ bubble }: { bubble: FlexBubble }) {
  // Check if bubble has any content besides hero
  const hasTextContent = bubble.body && bubble.body.contents.some((c: any) => c.type === "text" && c.text && c.text.trim() !== "");
  const hasButtons = bubble.footer && bubble.footer.contents.length > 0;
  const hasOnlyHero = bubble.hero && !hasTextContent && !hasButtons;

  return (
    <div className="bg-white rounded-[10px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] w-[300px] overflow-hidden">
      {/* Hero Image */}
      {bubble.hero && bubble.hero.type === "image" && (
        <div className="w-full bg-gray-200 flex items-center justify-center overflow-hidden relative group">
          <img
            src={bubble.hero.url}
            alt="Hero"
            className="w-full h-auto object-cover block"
            style={{
              aspectRatio: bubble.hero.aspectRatio || "1.91:1",
            }}
            onError={(e) => {
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='157'%3E%3Crect fill='%23f0f0f0' width='300' height='157'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='sans-serif' font-size='14'%3E選擇圖片%3C/text%3E%3C/svg%3E";
            }}
          />
          {bubble.hero.action && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span className="text-gray-700">可點擊</span>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      {bubble.body && bubble.body.contents.some((c: any) => c.type === "text" && c.text && c.text.trim() !== "") && (
        <div className="px-3 pt-3 pb-2">
          {bubble.body.contents.map((content: any, index: number) => {
            if (content.type === "text") {
              return (
                <div
                  key={index}
                  style={{
                    color: content.color || "#000000",
                    fontSize: content.size === "xl" ? "16px" : content.size === "lg" ? "14px" : content.size === "md" ? "13px" : "12px",
                    fontWeight: content.weight === "bold" ? "bold" : "normal",
                    marginTop: content.margin === "md" ? "6px" : content.margin === "lg" ? "12px" : "0",
                    whiteSpace: content.wrap ? "pre-line" : "nowrap",
                    wordWrap: content.wrap ? "break-word" : "normal",
                    textAlign: content.align === "end" ? "right" : content.align === "center" ? "center" : "left",
                    lineHeight: content.size === "xl" ? "1.3" : "1.4",
                  }}
                >
                  {(() => {
                    const lines = content.text.split('\n');
                    if (lines.length > 1) {
                      return lines.map((line: string, idx: number) => (
                        <span key={idx} style={{ color: line.includes('NT$') ? '#0F6BEB' : undefined }}>
                          {line}
                          {idx < lines.length - 1 && '\n'}
                        </span>
                      ));
                    }
                    return content.text;
                  })()}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Footer */}
      {bubble.footer && bubble.footer.contents.length > 0 && (() => {
        const buttonContents = bubble.footer.contents.filter((c: any) => c.type === "button");
        const firstButtonMargin = buttonContents[0]?.margin;
        const containerMarginTop = firstButtonMargin === "xl" ? "24px" : firstButtonMargin === "lg" ? "12px" : firstButtonMargin === "md" ? "6px" : firstButtonMargin === "sm" ? "4px" : "0";

        return (
          <div className="px-3 pb-3">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: containerMarginTop }}>
              {buttonContents.map((content: any, index: number) => (
                <button
                  key={index}
                  className="w-full rounded-md text-sm font-medium transition-colors text-center text-gray-900"
                  style={{
                    backgroundColor: "#F2F3F7",
                    padding: "10px 12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: "1.2",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8e9ef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#F2F3F7";
                  }}
                  title={content.action.label}
                >
                  {content.action.label}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Bottom padding for hero-only cards */}
      {hasOnlyHero && <div className="pb-8" />}
    </div>
  );
}
