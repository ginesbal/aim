"use client";

import { useId } from "react";
import Link from "next/link";
import { cn, formatTime } from "@/lib/utils";
import type { FocusSession } from "@/lib/types";
import {
  A_BOWL_CX,
  A_BOWL_CY,
  A_BOWL_R,
  A_TAIL_PATH,
  A_COUNTER_CX,
  A_COUNTER_CY,
  A_COUNTER_R,
  A_VB_X,
  A_VB_Y,
  A_VB_SIZE,
  A_BOTTOM,
  inkLevel,
} from "@/lib/aimLetter";

/* ─────────────────────────────────────────────────────────────
   WEEK OF "a"s — the last seven days as seven small "a"s, oldest
   on the left, today on the right, each inked (by area, like the
   dashboard's meter) to that day's share of the goal. A full "a"
   is a day the goal was hit; an outline is a day with no focus.
   It replaces the Journal's bar chart and its row of stat tiles,
   and the dashboard's parked streak chips: one motif for "how the
   days went" across the app (critique, 2026-10-27).
   ───────────────────────────────────────────────────────────── */

export interface DayTotal {
  /** The local calendar date, "YYYY-MM-DD". */
  key: string;
  date: Date;
  minutes: number;
  isToday: boolean;
}

/** "YYYY-MM-DD" for a date's local calendar day. */
export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Focus minutes for each of the last seven days, oldest first. */
export function lastSevenDays(sessions: FocusSession[]): DayTotal[] {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const key = localDayKey(new Date(s.completedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + s.duration);
  }
  const days: DayTotal[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = localDayKey(date);
    days.push({ key, date, minutes: byDay.get(key) ?? 0, isToday: i === 0 });
  }
  return days;
}

/* One small "a": the same outline, ink and counter as the dashboard's
   meter, without its layers. The outline is stroked and then painted
   over in white, which hides the inner half of the stroke and leaves
   one clean outline of the letter. */
function MiniA({ share }: { share: number }) {
  // useId's colons are awkward inside url(#…); drop them.
  const id = useId().replace(/:/g, "");
  const top = inkLevel(share);
  return (
    <svg aria-hidden viewBox={`${A_VB_X} ${A_VB_Y} ${A_VB_SIZE} ${A_VB_SIZE}`} className="w-full h-full">
      <defs>
        <clipPath id={`${id}-letter`}>
          <circle cx={A_BOWL_CX} cy={A_BOWL_CY} r={A_BOWL_R} />
          <path d={A_TAIL_PATH} />
        </clipPath>
        <clipPath id={`${id}-open`}>
          <rect x={A_VB_X} y={A_VB_Y} width={A_VB_SIZE} height={Math.max(top - A_VB_Y, 0)} />
        </clipPath>
      </defs>
      <g fill="none" strokeWidth={2} className="stroke-lavender-400 dark:stroke-lavender-600">
        <circle cx={A_BOWL_CX} cy={A_BOWL_CY} r={A_BOWL_R} vectorEffect="non-scaling-stroke" />
        <path d={A_TAIL_PATH} vectorEffect="non-scaling-stroke" />
      </g>
      <g className="fill-white dark:fill-lavender-900">
        <circle cx={A_BOWL_CX} cy={A_BOWL_CY} r={A_BOWL_R} />
        <path d={A_TAIL_PATH} />
      </g>
      {share > 0 && (
        <rect
          clipPath={`url(#${id}-letter)`}
          x={A_VB_X}
          y={top}
          width={A_VB_SIZE}
          height={A_BOTTOM - top}
          className="fill-baltic-700 dark:fill-baltic-200"
        />
      )}
      <circle cx={A_COUNTER_CX} cy={A_COUNTER_CY} r={A_COUNTER_R} className="fill-white dark:fill-lavender-900" />
      <circle
        cx={A_COUNTER_CX}
        cy={A_COUNTER_CY}
        r={A_COUNTER_R}
        fill="none"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        clipPath={`url(#${id}-open)`}
        className="stroke-lavender-400 dark:stroke-lavender-600"
      />
    </svg>
  );
}

export default function WeekOfAs({
  days,
  dailyGoal,
  dayHref,
  className,
}: {
  days: DayTotal[];
  dailyGoal: number;
  /** Where a day with focus links to (its entries in the Journal). */
  dayHref?: (key: string) => string;
  className?: string;
}) {
  return (
    <ol aria-label="Last 7 days" className={cn("flex items-start gap-1.5 sm:gap-3", className)}>
      {days.map((day) => {
        const share = Math.min(day.minutes / Math.max(dailyGoal, 1), 1);
        const weekday = day.date.toLocaleDateString("en-US", { weekday: "short" });
        const longDay = day.isToday ? "Today" : day.date.toLocaleDateString("en-US", { weekday: "long" });
        const body = (
          <>
            <span className="block w-9 h-9 sm:w-10 sm:h-10">
              <MiniA share={share} />
            </span>
            {/* Read as one line by screen readers; the short labels are
                for the eye. */}
            <span className="sr-only">
              {longDay}:{" "}
              {day.minutes > 0
                ? `${formatTime(day.minutes)} of ${formatTime(dailyGoal)}${share >= 1 ? ", goal hit" : ""}`
                : "no focus"}
            </span>
            <span
              aria-hidden
              className={cn(
                "mt-1.5 text-xs",
                day.isToday ? "font-semibold text-baltic-800 dark:text-baltic-100" : "text-steel-600 dark:text-steel-400"
              )}
            >
              {day.isToday ? "Today" : weekday}
            </span>
            <span aria-hidden className="mt-0.5 h-4 text-xs tabular-nums text-steel-600 dark:text-steel-400">
              {day.minutes > 0 ? formatTime(day.minutes) : ""}
            </span>
          </>
        );
        return (
          <li key={day.key} className="w-11 sm:w-14">
            {dayHref && day.minutes > 0 ? (
              <Link
                href={dayHref(day.key)}
                className="flex flex-col items-center rounded-xl py-1.5 hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500 dark:hover:bg-lavender-900/40 transition-colors duration-150"
              >
                {body}
              </Link>
            ) : (
              <div className="flex flex-col items-center py-1.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
