"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// The one place the app explains itself: the keys, the three ways a
// session can end, and two facts worth knowing. On Tasks it explains
// that page instead: what a tab is and its keys, since the session keys
// don't apply there (it was the same panel on every page, with nothing
// on tabs; critique, 2026-11-02). A disclosure popover like
// the profile and backdrop menus, not a dialog: it answers a glance
// without taking over the screen, even mid-session. It opens from its
// button only; a bare "?" key working anywhere on the page couldn't be
// switched off (WCAG 2.1.4).
// Each key says where it works. Enter takes the screen's one step when
// no control has focus; on a control it acts on that control. 1–4 only
// work on the rating.
const KEYS: [string, string][] = [
  ["Enter", "Begins the session the dashboard or Focus card proposes"],
  ["Space", "Pause or resume"],
  ["Esc", "Pause and leave; the session is kept"],
  ["1–4", "On the rating, picks how focused you were"],
  ["Enter", "On the ending card or in the note, saves the session"],
];

// Tasks' own keys: the tab row is a tablist, and a task row a button.
const TASK_KEYS: [string, string][] = [
  ["← →", "Move between tabs"],
  ["F2", "Renames the open tab (or double-click its name)"],
  ["Enter", "On a task, opens it"],
];

const ENDINGS: [string, string][] = [
  ["Pause & leave", "Stops the clock and keeps the session to come back to."],
  ["Finish early", "Stops the timer now. You save it, or discard it, on the next screen."],
  ["Discard", "Throws the session away. Nothing is logged."],
];

const HEADING = "text-[11px] uppercase tracking-[0.18em] text-steel-600";

export default function HelpButton({ className }: { className?: string }) {
  const onTasks = usePathname() === "/tasks";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Opening moves focus into the panel, so a screen reader reads it and
  // Esc lands here rather than on the page behind.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      // Esc closes and hands focus back to the button. Stopped here so
      // Focus's own Esc (pause and leave) doesn't also fire.
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }}
    >
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Help and keyboard shortcuts"
        title="Help"
        className={className}
      >
        <svg aria-hidden width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.75 5.75a2.25 2.25 0 1 1 3.4 1.95c-.65.38-1.15.9-1.15 1.65v.4" />
          <circle cx="8" cy="12.25" r=".4" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-label="Help"
          // Anchored under its button; on phones it spans the screen
          // instead, since a button near the middle would push a
          // right-anchored panel off the left edge.
          className="absolute right-0 top-full mt-2 max-sm:fixed max-sm:inset-x-4 max-sm:top-[4.5rem] max-sm:w-auto z-50 w-72 rounded-2xl bg-white border border-lavender-200 shadow-[0_16px_36px_-12px_rgba(38,45,64,0.28)] p-4 text-left dropdown-enter focus:outline-none"
          style={{ transformOrigin: "top right" }}
        >
          {onTasks ? (
            <>
              <p className={HEADING}>Tabs</p>
              <p className="mt-2 text-sm text-baltic-700">
                Each tab is a saved view of your tasks: one subject, or All. Closing a tab deletes nothing, and Undo brings it back for five seconds. Add a tab with the + at the end of the row.
              </p>
              <p className={cn(HEADING, "mt-4")}>Keys</p>
              <KeyList keys={TASK_KEYS} />
            </>
          ) : (
            <>
              <p className={HEADING}>Keys</p>
              <KeyList keys={KEYS} />

              <p className={cn(HEADING, "mt-4")}>Ending a session</p>
              <dl className="mt-2 space-y-1.5 text-sm">
                {ENDINGS.map(([name, what]) => (
                  <div key={name}>
                    <dt className="inline font-semibold text-baltic-800">{name}</dt>{" "}
                    <dd className="inline text-baltic-700">{what}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <p className={cn(HEADING, "mt-4")}>Good to know</p>
          <p className="mt-2 text-sm text-baltic-700">
            Every session you finish fills in the “a” on the dashboard. Your tasks and sessions stay in this browser; there’s no account.
          </p>
        </div>
      )}
    </div>
  );
}

function KeyList({ keys }: { keys: [string, string][] }) {
  return (
    <dl className="mt-2 space-y-1.5 text-sm">
      {keys.map(([key, what]) => (
        <div key={key + what} className="flex items-baseline gap-3">
          <dt className="w-14 flex-shrink-0">
            <kbd className="rounded-md border border-lavender-400 bg-lavender-50 px-1.5 py-0.5 font-sans text-xs text-baltic-700">{key}</kbd>
          </dt>
          <dd className="text-baltic-700">{what}</dd>
        </div>
      ))}
    </dl>
  );
}
