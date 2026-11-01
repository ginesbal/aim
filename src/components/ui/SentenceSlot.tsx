"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn, formatTime } from "@/lib/utils";
import {
  DURATION_MAX,
  DURATION_MIN,
  DURATION_PRESETS,
  GOAL_MAX,
  GOAL_MIN,
  GOAL_PRESETS,
  parseMinutes,
  rangeError,
} from "@/lib/durations";
import Button from "./Button";
import { FIELD, FIELD_EDGE } from "./Input";

/* ─────────────────────────────────────────────────────────────
   SENTENCE SLOTS — the "25m" and the task in the launcher
   sentence, as real controls. Each is a word of the sentence,
   underlined like a blank you can fill in, that opens a short list
   under itself. A small disclosure like the subject picker:
   opening moves focus to the current choice, Esc closes and hands
   focus back, a click outside or tabbing away closes. The list
   renders in listParent, outside the heading, so the heading still
   reads as one sentence; a slot that wraps across two lines opens
   its list under the last one. Shared by the dashboard's launcher
   and Settings ("aim for [2h] a day, [25m] at a time").
   ───────────────────────────────────────────────────────────── */

export interface SlotChoice {
  key: string;
  content: ReactNode;
  current: boolean;
  onPick: () => void;
}

export function SentenceSlot({
  children,
  title,
  listLabel,
  choices,
  listParent,
  listClassName,
  footer,
}: {
  children: ReactNode;
  /** Tooltip on the slot, also its hint for what clicking does. */
  title: string;
  listLabel: string;
  choices: SlotChoice[];
  /** Where the open list renders: outside the heading the slot sits in. */
  listParent: React.RefObject<HTMLElement>;
  listClassName?: string;
  /** A last row under the choices (Settings' "Other…"), given the
   *  function that closes the list and hands focus back. */
  footer?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Where to place the list: under the slot, in listParent's coordinates,
  // kept inside listParent's width.
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLSpanElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Measured once the list exists, so a wide list near the right edge
  // shifts left instead of spilling out of the card.
  useLayoutEffect(() => {
    if (!open) return;
    const t = triggerRef.current;
    const parent = listParent.current;
    if (!t || !parent) return;
    const box = parent.getBoundingClientRect();
    // The last line the slot is set on: a task title can wrap.
    const lines = t.getClientRects();
    const last = lines[lines.length - 1] ?? t.getBoundingClientRect();
    const width = listRef.current?.offsetWidth ?? 0;
    setPos({
      left: Math.max(0, Math.min(last.left - box.left, box.width - width)),
      top: last.bottom - box.top + 8,
    });
  }, [open, listParent]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    // Keys and focus events from the portalled list still bubble here
    // through React.
    <span
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          close();
        }
      }}
      // Tabbing out of the slot or its list closes it, so it can't be
      // left open over Begin with focus somewhere else.
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (open && !triggerRef.current?.contains(next) && !listRef.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        title={title}
        // Inline, so a long task wraps with the sentence; the underline
        // and the hover wash follow it onto each line.
        className={cn(
          "rounded-lg px-1 -mx-1 text-left box-decoration-clone underline decoration-lavender-400 decoration-[0.06em] underline-offset-[0.16em] hover:bg-lavender-100 hover:decoration-baltic-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500 dark:hover:bg-lavender-800/60 transition-[background-color,text-decoration-color] duration-150",
          open && "bg-lavender-100 decoration-baltic-500 dark:bg-lavender-800/60"
        )}
      >
        {children}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className={cn(
            "inline-block ml-1 w-[0.42em] h-[0.42em] align-[0.12em] text-steel-500 transition-transform duration-150",
            open && "rotate-180"
          )}
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      {open &&
        listParent.current &&
        createPortal(
          <span
            ref={listRef}
            id={listId}
            role="group"
            aria-label={listLabel}
            className={cn(
              "absolute z-20 flex flex-col rounded-2xl border border-lavender-200 bg-white py-1 text-left text-base font-normal tracking-normal leading-normal shadow-[0_16px_36px_-12px_rgba(38,45,64,0.28)] dropdown-enter dark:border-lavender-700 dark:bg-lavender-900",
              listClassName
            )}
            style={{ left: pos.left, top: pos.top, transformOrigin: "top left" }}
          >
            {choices.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={c.current}
                onClick={() => {
                  c.onPick();
                  close();
                }}
                className="flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-baltic-700 dark:text-baltic-200 hover:bg-lavender-50 dark:hover:bg-lavender-800/60 focus:outline-none focus-visible:bg-lavender-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-baltic-500"
              >
                <span className="min-w-0 flex-1">{c.content}</span>
                {/* Every row keeps the check's room, so the days line up. */}
                <svg aria-hidden width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cn("flex-shrink-0 text-baltic-600", !c.current && "invisible")}>
                  <path d="M2.5 7.5L6 11l5.5-7" />
                </svg>
              </button>
            ))}
            {footer?.(close)}
          </span>,
          listParent.current
        )}
    </span>
  );
}

/* The quick picks, plus the current value if it isn't one of them (a
   length of 35m set in Settings, a stored goal of 100m), so the list
   always shows what's picked. */
function withCurrent(presets: number[], minutes: number): number[] {
  return presets.includes(minutes) ? presets : [...presets, minutes].sort((a, b) => a - b);
}

function minuteChoices(presets: number[], minutes: number, onChange: (minutes: number) => void): SlotChoice[] {
  return withCurrent(presets, minutes).map((m) => ({
    key: String(m),
    content: <span className="tabular-nums">{formatTime(m)}</span>,
    current: m === minutes,
    onPick: () => onChange(m),
  }));
}

/* The length slot offers the same quick lengths as Focus, and a pick
   becomes the default session length, so the launcher keeps offering it.
   In Settings it also takes any other length in Focus's range. */
export function LengthSlot({
  minutes,
  onChange,
  listParent,
  other = false,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
  listParent: React.RefObject<HTMLElement>;
  /** Add "Other length…" for a length that isn't a quick pick. */
  other?: boolean;
}) {
  return (
    <SentenceSlot
      title="Change session length"
      listLabel="Session length"
      listParent={listParent}
      listClassName={other ? "w-52" : "w-36"}
      choices={minuteChoices(DURATION_PRESETS, minutes, onChange)}
      footer={
        other
          ? (close) => (
              <OtherMinutes
                label="Other length"
                min={DURATION_MIN}
                max={DURATION_MAX}
                onSet={(m) => {
                  onChange(m);
                  close();
                }}
              />
            )
          : undefined
      }
    >
      <span className="tabular-nums">{formatTime(minutes)}</span>
    </SentenceSlot>
  );
}

/* The daily goal the "a" on the dashboard fills toward. The dashboard's
   "Adjust goal" leads here; it used to be a number field in minutes. */
export function GoalSlot({
  minutes,
  onChange,
  listParent,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
  listParent: React.RefObject<HTMLElement>;
}) {
  return (
    <SentenceSlot
      title="Change daily goal"
      listLabel="Daily goal"
      listParent={listParent}
      listClassName="w-52"
      choices={minuteChoices(GOAL_PRESETS, minutes, onChange)}
      footer={(close) => (
        <OtherMinutes
          label="Other goal"
          min={GOAL_MIN}
          max={GOAL_MAX}
          onSet={(m) => {
            onChange(m);
            close();
          }}
        />
      )}
    >
      <span className="tabular-nums">{formatTime(minutes)}</span>
    </SentenceSlot>
  );
}

/* "Other…", the last row of a list: any whole number of minutes in the
   range, typed. The row stays mounted while its field is open, so focus
   never drops out of the list (which would close it). Enter sets the
   value and closes the list; Esc closes it unchanged. */
function OtherMinutes({
  label,
  min,
  max,
  onSet,
}: {
  label: string;
  min: number;
  max: number;
  onSet: (minutes: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <span className="block border-t border-lavender-200/70 dark:border-lavender-700/70">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? `${id}-form` : undefined}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-steel-600 dark:text-steel-400 hover:bg-lavender-50 hover:text-baltic-700 dark:hover:bg-lavender-800/60 focus:outline-none focus-visible:bg-lavender-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-baltic-500"
      >
        {label}…
      </button>
      {open && (
        <form
          id={`${id}-form`}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const minutes = parseMinutes(value, min, max);
            if (minutes === null) {
              setError(rangeError(min, max));
              inputRef.current?.focus();
              return;
            }
            onSet(minutes);
          }}
          className="block px-4 pb-3"
        >
          <span className="flex items-center gap-2">
            <input
              ref={inputRef}
              id={`${id}-input`}
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              value={value}
              aria-label={`${label}, in minutes`}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-message`}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              className={cn(FIELD, error ? "border-red-600" : FIELD_EDGE, "w-24 tabular-nums")}
            />
            <span className="text-sm text-steel-600 dark:text-steel-400">min</span>
            <Button type="submit" variant="secondary" size="sm" className="ml-auto">
              Set
            </Button>
          </span>
          {/* The range up front; the same line turns into the error. */}
          {error ? (
            <span id={`${id}-message`} role="alert" className="mt-1.5 block text-xs text-red-600 dark:text-red-400">
              {error}
            </span>
          ) : (
            <span id={`${id}-message`} className="mt-1.5 block text-xs text-steel-600 dark:text-steel-400">
              From {min} to {max} ({formatTime(max)}).
            </span>
          )}
        </form>
      )}
    </span>
  );
}
