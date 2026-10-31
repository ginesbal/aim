"use client";

import { useCallback } from "react";
import { cn, formatTime } from "@/lib/utils";

import { DURATION_MIN, DURATION_MAX, DURATION_STEP, DURATION_PRESETS, clampDuration } from "@/lib/durations";

interface DurationPickerProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export default function DurationPicker({ value, onChange, disabled }: DurationPickerProps) {
  const increment = useCallback(() => onChange(clampDuration(value + DURATION_STEP)), [value, onChange]);
  const decrement = useCallback(() => onChange(clampDuration(value - DURATION_STEP)), [value, onChange]);

  const formatDisplay = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
    return `${mins}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stepper row */}
      <div className="flex items-center gap-5">
        <button
          onClick={decrement}
          disabled={disabled || value <= DURATION_MIN}
          className="tap-target w-9 h-9 rounded-full flex items-center justify-center border border-lavender-400 text-baltic-500 hover:bg-lavender-50 hover:border-lavender-500 disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,border-color,transform] duration-150 ease-out press"
          aria-label="Decrease duration"
        >
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M4 8h8" />
          </svg>
        </button>

        <div className="flex flex-col items-center min-w-[4ch]">
          <span className="text-5xl font-extralight tracking-tight tabular-nums text-baltic-800 leading-none">
            {formatDisplay(value)}
          </span>
          {value < 60 && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-steel-600 mt-2">minutes</span>
          )}
        </div>

        <button
          onClick={increment}
          disabled={disabled || value >= DURATION_MAX}
          className="tap-target w-9 h-9 rounded-full flex items-center justify-center border border-lavender-400 text-baltic-500 hover:bg-lavender-50 hover:border-lavender-500 disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,border-color,transform] duration-150 ease-out press"
          aria-label="Increase duration"
        >
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M8 4v8M4 8h8" />
          </svg>
        </button>
      </div>

      {/* Preset chips */}
      <div className="flex items-center gap-1.5" role="group" aria-label="Duration presets">
        {DURATION_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            disabled={disabled}
            aria-pressed={value === p}
            className={cn(
              "tap-target px-3 py-1 rounded-full text-xs font-medium tabular-nums transition-[background-color,color] duration-150 ease-out press",
              value === p
                ? "bg-baltic-100 text-baltic-700"
                : "text-steel-600 hover:text-baltic-600 hover:bg-lavender-50"
            )}
          >
            {/* Same format as everywhere else ("1h 30m", not "1.5h"). */}
            {formatTime(p)}
          </button>
        ))}
      </div>
    </div>
  );
}
