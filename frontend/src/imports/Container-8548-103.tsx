import svgPaths from "./svg-wbwsye31ry";

/**
 * 官方頭像容器（45 x 45）
 * - 背景：外圈 #edf0f8，內圈 #f6f9fd
 * - 圖示：Figma 匯出的會員人形圖（#383838）
 */
export default function Container() {
  return (
    <div
      className="relative shrink-0 size-[45px]"
      data-name="Container-8548-103"
    >
      <div className="absolute inset-0 rounded-full bg-[#edf0f8]" />
      <div className="absolute inset-[4px] rounded-full bg-[#f6f9fd]" />
      <div className="relative flex items-center justify-center size-full">
        <div className="relative size-[28px]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 19 19"
          >
            <path
              d={svgPaths.p17f8c200}
              fill="#383838"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
