"use client";

import { SUBJECT_COLORS, SUBJECT_COLOR_NAMES } from "@/lib/types";
import { cn } from "@/lib/utils";

/* The subject palette as a row of swatches, one pick. Shared by every
   place a subject gets a colour (the New subject and Manage subjects
   dialogs, the New task dialog, the Focus card's subject list), which
   each used to draw their own; three of them read the colours out to
   screen readers as hex codes. Each swatch is named, "Colour 3" until
   the palette is named in types.ts. The picked one wears a ring; the
   keyboard outline sits further out, so the two never overlap. */
export default function ColorSwatches({
  value,
  onChange,
  label = "Subject colour",
  size = "md",
  className,
}: {
  value: string;
  onChange: (color: string) => void;
  /** Names the group for screen readers. */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-2", className)}>
      {SUBJECT_COLORS.map((c, i) => {
        const picked = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={SUBJECT_COLOR_NAMES[c] ?? `Colour ${i + 1}`}
            aria-pressed={picked}
            className={cn(
              "press rounded-full focus-visible:outline-offset-[5px]",
              size === "sm" ? "w-6 h-6" : "w-7 h-7",
              picked
                ? "ring-2 ring-offset-2 ring-baltic-500 ring-offset-white dark:ring-baltic-400 dark:ring-offset-lavender-900"
                : "hover:scale-110"
            )}
            style={{
              backgroundColor: c,
              transition: "transform 160ms var(--ease-out), box-shadow 160ms ease",
            }}
          />
        );
      })}
    </div>
  );
}
