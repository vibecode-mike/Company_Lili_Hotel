import { FlexBubble } from "./types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect } from "react";

interface PreviewPanelProps {
  bubbles: FlexBubble[];
  activeBubbleIndex: number;
  onBubbleChange: (index: number) => void;
}

export default function PreviewPanel({ bubbles, activeBubbleIndex, onBubbleChange }: PreviewPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to active bubble
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 300 + 24; // card width + gap
      const scrollPosition = activeBubbleIndex * cardWidth;
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  }, [activeBubbleIndex]);

  const handlePrevious = () => {
    if (activeBubbleIndex > 0) {
      onBubbleChange(activeBubbleIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeBubbleIndex < bubbles.length - 1) {
      onBubbleChange(activeBubbleIndex + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full">
      <div className="relative w-full max-w-[380px]">
        {/* Navigation Buttons */}
        {bubbles.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              disabled={activeBubbleIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed rounded-full p-2.5 shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{ transform: "translate(-50%, -50%)" }}
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={handleNext}
              disabled={activeBubbleIndex === bubbles.length - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed rounded-full p-2.5 shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{ transform: "translate(50%, -50%)" }}
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Scrollable Preview Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-6 px-[25px]">
            {bubbles.map((bubble, index) => (
              <div
                key={index}
                className={`flex-shrink-0 snap-center transition-all duration-300 ${
                  index === activeBubbleIndex ? "opacity-100 scale-100" : "opacity-40 scale-95"
                }`}
                style={{ width: "300px" }}
              >
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                  <FlexBubblePreview bubble={bubble} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel indicators */}
        {bubbles.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {bubbles.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  index === activeBubbleIndex
                    ? "w-6 bg-white shadow-md"
                    : "w-2 bg-white/60 hover:bg-white/80"
                }`}
                onClick={() => onBubbleChange(index)}
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
    <div>
      {/* Hero Image */}
      {bubble.hero && bubble.hero.type === "image" && (
        <div className="w-full bg-gray-200 flex items-center justify-center overflow-hidden relative group">
          <img
            src={bubble.hero.url}
            alt="Hero"
            className="w-full h-auto object-cover"
            style={{
              aspectRatio: bubble.hero.aspectRatio || "1.92:1",
            }}
            onError={(e) => {
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='sans-serif' font-size='14'%3E選擇圖片%3C/text%3E%3C/svg%3E";
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
        <div className="p-4">
          {bubble.body.contents.map((content: any, index: number) => {
            if (content.type === "text") {
              return (
                <div
                  key={index}
                  style={{
                    color: content.color || "#000000",
                    fontSize: content.size === "xl" ? "18px" : content.size === "lg" ? "16px" : content.size === "md" ? "14px" : "12px",
                    fontWeight: content.weight === "bold" ? "bold" : "normal",
                    marginTop: content.margin === "md" ? "8px" : content.margin === "lg" ? "16px" : "0",
                    whiteSpace: content.wrap ? "normal" : "nowrap",
                    wordWrap: content.wrap ? "break-word" : "normal",
                    textAlign: content.align === "end" ? "right" : content.align === "center" ? "center" : "left",
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

      {/* Footer */}
      {bubble.footer && bubble.footer.contents.length > 0 && (
        <div className="px-4 pb-4" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {bubble.footer.contents.map((content: any, index: number) => {
            if (content.type === "button") {
              const isPrimary = content.style === "primary";
              const isSecondary = content.style === "secondary";
              const isLink = content.style === "link";
              const heightClass = content.height === "sm" ? "py-3" : "py-2";

              return (
                <button
                  key={index}
                  className={`w-full ${heightClass} px-4 rounded text-sm transition-colors text-center ${
                    isPrimary
                      ? "bg-[#06C755] text-white hover:bg-[#05b34d]"
                      : isSecondary
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-transparent text-[#06C755] hover:bg-gray-50 border border-gray-200"
                  }`}
                  style={{
                    marginTop: content.margin === "xl" ? "24px" : content.margin === "lg" ? "16px" : content.margin === "md" ? "16px" : content.margin === "sm" ? "8px" : "0",
                  }}
                >
                  {content.action.label}
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