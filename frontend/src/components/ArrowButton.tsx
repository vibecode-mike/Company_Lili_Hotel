/**
 * ArrowButton Component - Pagination navigation arrows
 *
 * Used in message detail drawer for navigating between carousel cards
 *
 * Props:
 * - direction: "left" | "right" - Arrow direction
 * - onClick: Function to handle click
 * - disabled: Boolean to disable button
 * - aria-label: Accessibility label
 */

import React from "react";
import svgPathsPagination from "../imports/svg-0m1jkx8owp";

export interface ArrowButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function ArrowButton({
  direction,
  onClick,
  disabled = false,
  "aria-label": ariaLabel
}: ArrowButtonProps) {
  const svgPath = direction === "left" ? svgPathsPagination.p1fb6d4c0 : svgPathsPagination.p30296c80;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`relative shrink-0 size-[32px] rounded-full bg-[#F5F5F5] flex items-center justify-center transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-200'
      }`}
      data-name={`Arrow/${direction === "left" ? "Left" : "Right"}`}
    >
      <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
        <path d={svgPath} fill="#6E6E6E" />
      </svg>
    </button>
  );
}
