"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: "solid" | "subtle";
  className?: string;
}

export default function Badge({
  children,
  color,
  variant = "subtle",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        !color && variant === "subtle" && "bg-lavender-100 text-lavender-600 dark:bg-lavender-800 dark:text-lavender-300",
        !color && variant === "solid" && "bg-baltic-500 text-white",
        className
      )}
      style={
        color
          ? variant === "subtle"
            ? { backgroundColor: `${color}18`, color }
            : { backgroundColor: color, color: "white" }
          : undefined
      }
    >
      {children}
    </span>
  );
}
