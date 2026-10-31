"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

/* The buttons from DESIGN.md (Buttons), always fully rounded:
   - primary: baltic-600, white label. The one filled button of a dialog.
   - secondary: white with a 1px lavender-200 edge and a baltic-700 label.
   - ghost: steel-600 text (Cancel, Done).
   - danger: quiet steel-600 text that turns red on hover, like Focus's
     Discard. A destructive action is never the loudest thing on screen.
   Focus is the app's shared outline (2px baltic-500, offset 2px). */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "press inline-flex items-center justify-center rounded-full font-medium transition-smooth disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" &&
            "bg-baltic-600 text-white hover:bg-baltic-700 active:bg-baltic-800 dark:bg-baltic-500 dark:hover:bg-baltic-600",
          variant === "secondary" &&
            "bg-white border border-lavender-200 text-baltic-700 hover:bg-lavender-50 dark:bg-lavender-900 dark:border-lavender-700 dark:text-baltic-200 dark:hover:bg-lavender-800/60",
          variant === "ghost" &&
            "text-steel-600 hover:text-baltic-700 hover:bg-lavender-50 dark:text-steel-400 dark:hover:text-baltic-300 dark:hover:bg-lavender-900",
          variant === "danger" &&
            "text-steel-600 hover:text-red-700 hover:bg-red-50 dark:text-steel-400 dark:hover:text-red-400 dark:hover:bg-red-950/40",
          size === "sm" && "text-sm px-4 py-1.5 gap-1.5",
          size === "md" && "text-sm px-5 py-2 gap-2",
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
