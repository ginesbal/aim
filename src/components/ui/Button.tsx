"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "pill";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          // Shape
          variant === "pill" ? "rounded-full" : "rounded-xl",
          // Variants
          variant === "primary" &&
            "bg-baltic-600 text-white hover:bg-baltic-700 active:bg-baltic-800 focus:ring-baltic-400 dark:bg-baltic-500 dark:hover:bg-baltic-600",
          variant === "secondary" &&
            "bg-lavender-100 text-baltic-700 hover:bg-lavender-200 active:bg-lavender-300 focus:ring-lavender-400 dark:bg-lavender-800 dark:text-lavender-200 dark:hover:bg-lavender-700",
          variant === "ghost" &&
            "text-steel-500 hover:text-baltic-600 hover:bg-lavender-50 focus:ring-lavender-300 dark:text-steel-400 dark:hover:text-baltic-300 dark:hover:bg-lavender-900",
          variant === "danger" &&
            "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-300 dark:bg-red-950 dark:text-red-400",
          variant === "pill" &&
            "bg-baltic-100 text-baltic-700 hover:bg-baltic-200 focus:ring-baltic-400 dark:bg-baltic-800 dark:text-baltic-200 dark:hover:bg-baltic-700",
          // Sizes
          size === "sm" && "text-xs px-3.5 py-1.5 gap-1.5",
          size === "md" && "text-sm px-5 py-2.5 gap-2",
          size === "lg" && "text-sm px-7 py-3 gap-2",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
