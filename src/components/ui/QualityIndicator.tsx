"use client";

import { cn } from "@/lib/utils";
import { FocusQuality, QUALITY_LEVELS } from "@/lib/types";

interface QualityIndicatorProps {
  quality: FocusQuality;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

/* One rating's circle: the fill to its level (none, a quarter, half,
   full), then the outline over it so the edge stays crisp. Drawn the
   same on the ending card and in the Journal. */
function RatingGlyph({
  quality,
  size,
  fillClassName,
  strokeClassName,
}: {
  quality: FocusQuality;
  size: number;
  fillClassName: string;
  strokeClassName: string;
}) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" className="flex-shrink-0">
      <g className={fillClassName}>
        {quality === 2 && <path d="M8 15 A7 7 0 0 1 1 8 L8 8 Z" />}
        {quality === 3 && <path d="M8 1 A7 7 0 0 0 8 15 L8 8 Z" />}
        {quality === 4 && <circle cx="8" cy="8" r="7" />}
      </g>
      <circle cx="8" cy="8" r="7" fill="none" strokeWidth="1.5" className={strokeClassName} />
    </svg>
  );
}

/**
 * A saved rating, as the Journal lists it: the circle exactly as it was
 * picked on the ending card, in one ink (baltic-600 fill, baltic-500
 * edge) whatever the level. Its three shades, darker for more focus,
 * made a deep-focus day look like a different thing from a distracted
 * one rather than the same mark filled further (critique, 2026-11-02).
 * More fill = more focus, read without a key.
 */
export default function QualityIndicator({
  quality,
  size = 16,
  showLabel = false,
  className,
}: QualityIndicatorProps) {
  const level = QUALITY_LEVELS[quality];

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <RatingGlyph
        quality={quality}
        size={size}
        fillClassName="fill-baltic-600 dark:fill-baltic-400"
        strokeClassName="stroke-baltic-500 dark:stroke-baltic-400"
      />
      {/* Sized by the line it sits in; steel-600 is the lightest text
          colour that holds 4.5:1 on white. Without the visible label the
          name is still there for screen readers. */}
      <span className={showLabel ? "text-steel-600 dark:text-steel-400" : "sr-only"}>{level.label}</span>
    </div>
  );
}

interface QualitySelectorProps {
  value: FocusQuality | null;
  /** null when the chosen level is clicked again: the rating is optional. */
  onChange: (quality: FocusQuality | null) => void;
  size?: number;
}

/**
 * Interactive quality selector — 4 circles in a row.
 * Clicking selects, label appears below selected state.
 * Design rationale: 4 states is the sweet spot — fewer is too coarse, more causes decision fatigue.
 */
export function QualitySelector({ value, onChange, size = 32 }: QualitySelectorProps) {
  const qualities: FocusQuality[] = [1, 2, 3, 4];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="group"
        aria-label="Focus rating"
        className="flex items-center gap-4"
        // 1–4 pick a level while focus is on the scale, and focus follows
        // the pick. Scoped to the scale on purpose: a bare number key that
        // acted anywhere on the page couldn't be switched off (WCAG 2.1.4).
        onKeyDown={(e) => {
          const q = Number(e.key);
          if (e.ctrlKey || e.metaKey || e.altKey || !(q >= 1 && q <= 4)) return;
          onChange(q as FocusQuality);
          (e.currentTarget.children[q - 1] as HTMLElement).focus();
        }}
      >
        {qualities.map((q) => {
          const selected = value === q;
          // Each level's fill, unpicked, is pale ink, like the ghost in
          // the dashboard's "a": what it would be, not what it is. It deepens
          // on hover, and the pick fills in full ink. Unpicked fills were
          // lavender-400, so "Deep focus" sat there as a solid grey disc and
          // read as already chosen (critique, 2026-10-28). The outline stays
          // lavender-400, 3:1 against the card.
          const fill = selected
            ? "fill-baltic-600"
            : "fill-baltic-700/[0.14] group-hover:fill-baltic-700/30";
          return (
            <button
              key={q}
              type="button"
              onClick={() => onChange(selected ? null : q)}
              aria-label={QUALITY_LEVELS[q].label}
              aria-pressed={selected}
              aria-keyshortcuts={String(q)}
              title={`${QUALITY_LEVELS[q].label} (${q})`}
              className={cn(
                "group relative rounded-full p-2 transition-[background-color,transform] duration-150 ease-out press",
                selected
                  ? "bg-baltic-50 ring-1 ring-baltic-400/40"
                  : "hover:bg-lavender-50"
              )}
            >
              <RatingGlyph
                quality={q}
                size={size}
                fillClassName={cn(fill, "transition-[fill] duration-150 ease-out")}
                strokeClassName={selected ? "stroke-baltic-500" : "stroke-lavender-400"}
              />
            </button>
          );
        })}
      </div>
      {/* Before a choice, this line names the two ends of the scale; after
          one, it describes the choice. (Each circle has its own label for
          screen readers, so the end labels are visual only.) */}
      <div className="h-5 self-stretch">
        {value ? (
          <p className="text-xs text-baltic-700 text-center">
            <span className="font-medium">{QUALITY_LEVELS[value].label}</span>
            <span className="text-steel-600"> · {QUALITY_LEVELS[value].description}</span>
          </p>
        ) : (
          <p aria-hidden className="flex justify-between text-xs text-steel-600">
            <span>{QUALITY_LEVELS[1].label}</span>
            <span>{QUALITY_LEVELS[4].label}</span>
          </p>
        )}
      </div>
    </div>
  );
}
