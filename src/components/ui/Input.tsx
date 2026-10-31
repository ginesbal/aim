"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

/* The form pieces from DESIGN.md (Inputs), shared so a textarea, a date
   field or an inline field looks and focuses like this component does. */

/** A field's label: the body font in sentence case, above its field. It
 *  replaced an 11px uppercase label that read as decoration (critique,
 *  2026-10-27). A group of chips (Subject, Priority) is labelled the same. */
export const FIELD_LABEL = "block text-sm font-medium text-baltic-700 dark:text-baltic-200";

/** A text field: white, 6px corners, 14px text, a steel-600 placeholder.
 *  Pair it with FIELD_EDGE, or with the error edge. Focus is the app's
 *  shared outline; the edge also shifts to baltic-400. */
export const FIELD =
  "w-full px-3 py-2 text-sm rounded-md border bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 placeholder:text-steel-600 dark:placeholder:text-steel-400 transition-smooth";

/** lavender-400 is the lightest edge that holds 3:1 on white. */
export const FIELD_EDGE = "border-lavender-400 dark:border-lavender-600 focus:border-baltic-400";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className={FIELD_LABEL}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error && id ? `${id}-error` : undefined}
          className={cn(FIELD, error ? "border-red-600" : FIELD_EDGE, className)}
          {...props}
        />
        {error && (
          <p id={id ? `${id}-error` : undefined} role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
