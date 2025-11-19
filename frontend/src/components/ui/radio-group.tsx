"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
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
      {/* Outer circle */}
      <div className="absolute inset-0 rounded-full border-2 border-[#4A4A4A] group-data-[state=checked]:border-[#0F6BEB] transition-colors" />
      
      {/* Inner dot - only visible when checked */}
      <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center size-full">
        <div className="size-2.5 rounded-full bg-[#0F6BEB]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };