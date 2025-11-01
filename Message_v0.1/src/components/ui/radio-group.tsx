"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group@1.2.3";
import svgPaths from "../../imports/svg-o8fnigttzs";

import { cn } from "./utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "group relative size-6 shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0f6beb]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <svg className="block size-full pointer-events-none" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g clipPath="url(#clip0_radio_6_62)">
          <g></g>
          <path d={svgPaths.p26f9ce00} fill="#4A4A4A" className="group-data-[state=checked]:fill-[#0F6BEB] transition-colors" />
          <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator">
            <path d={svgPaths.pee04100} fill="#0F6BEB" />
          </RadioGroupPrimitive.Indicator>
        </g>
        <defs>
          <clipPath id="clip0_radio_6_62">
            <rect fill="white" height="24" width="24" />
          </clipPath>
        </defs>
      </svg>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
