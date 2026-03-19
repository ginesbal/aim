"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-label text-baltic-600 dark:text-baltic-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full px-4 py-3 text-sm rounded-xl border bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 placeholder:text-steel-400 dark:placeholder:text-steel-600 transition-smooth",
            error
              ? "border-red-300 focus:ring-red-300 focus:border-red-300"
              : "border-lavender-200 dark:border-lavender-700 focus:ring-2 focus:ring-baltic-400/30 focus:border-baltic-400",
            "outline-none",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
