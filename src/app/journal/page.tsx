"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useFocus, useSubjects } from "@/lib/contexts";
import { formatTime, cn } from "@/lib/utils";
import QualityIndicator from "@/components/ui/QualityIndicator";
import { SENTENCE, Connect } from "@/components/ui/Sentence";
import type { FocusSession } from "@/lib/types";

// Small uppercase label for the chart card. The chart is replaced by the
// week of "a"s next (/arrange); until then it keeps its own label.
function CardEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-steel-600 dark:text-steel-400">
      {children}
    </p>
  );
}

export default function JournalPage() {
  const { sessions } = useFocus();
  const { getSubject } = useSubjects();

  const sorted = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    [sessions]
  );

  const grouped = useMemo(() => {
    const groups: {
      label: string;
      dateKey: string;
      sessions: typeof sorted;
      totalMinutes: number;
    }[] = [];
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const map = new Map<string, typeof sorted>();
    for (const s of sorted) {
      const d = new Date(s.completedAt);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }

    for (const [dateKey, items] of Array.from(map.entries())) {
      const d = new Date(dateKey);
      let label: string;
      if (d.toDateString() === now.toDateString()) label = "Today";
      else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
      else
        label = d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      groups.push({
        label,
        dateKey,
        sessions: items,
        totalMinutes: items.reduce((sum, s) => sum + s.duration, 0),
      });
    }

    return groups;
  }, [sorted]);

  // Weekly summary
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = sessions.filter(
      (s) => new Date(s.completedAt) >= weekAgo
    );
    const totalMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const withReflection = weekSessions.filter((s) => s.reflection);
    return {
      count: weekSessions.length,
      totalMinutes,
      avgQuality:
        withReflection.length > 0
          ? withReflection.reduce((sum, s) => sum + s.reflection!.quality, 0) /
            withReflection.length
          : 0,
    };
  }, [sessions]);

  // Last 7 days heatmap data
  const heatmap = useMemo(() => {
    const now = new Date();
    const days: { label: string; dayNum: number; minutes: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const mins = sessions
        .filter((s) => new Date(s.completedAt).toDateString() === key)
        .reduce((sum, s) => sum + s.duration, 0);
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        dayNum: d.getDate(),
        minutes: mins,
        isToday: i === 0,
      });
    }
    const maxMins = Math.max(...days.map((d) => d.minutes), 60);
    return { days, maxMins };
  }, [sessions]);

  function resolveSubject(key: string) {
    const sub = getSubject(key);
    return { label: sub?.label || key, color: sub?.color || "#60729f" };
  }

  return (
    // The dashboard's column: one sentence, then the record. No desk
    // pattern, blobs, tape or tilt (critique, 2026-10-27).
    <div className="mx-auto max-w-4xl pb-4">
      <header className="mb-8">
        {/* One sentence, in the dashboard's voice: the week in numbers. */}
        <h1 className={SENTENCE}>
          <span className="sr-only">Journal: </span>
          {weeklyStats.count > 0 ? (
            <>
              <Connect>this week,</Connect>{" "}
              <span className="whitespace-nowrap tabular-nums">
                {weeklyStats.count} {weeklyStats.count === 1 ? "session" : "sessions"}
              </span>{" "}
              <Connect>for</Connect>{" "}
              <span className="whitespace-nowrap tabular-nums">{formatTime(weeklyStats.totalMinutes)}</span>
            </>
          ) : sessions.length > 0 ? (
            <>
              No sessions <Connect>yet this week</Connect>
            </>
          ) : (
            <>
              Nothing logged <Connect>yet</Connect>
            </>
          )}
        </h1>
        <p className="mt-3 text-sm text-steel-600 dark:text-steel-400 max-w-md">
          {sessions.length > 0
            ? "Every focus session, with what you worked on and how it felt."
            : "Finish a focus session and it lands here, with what you worked on and how it felt."}
        </p>
      </header>

      {sessions.length > 0 && (
        <section className="paper-card relative mb-10 px-6 pt-7 pb-6 border border-lavender-200/60 dark:border-lavender-800/60">
          {/* Eyebrow + one honest line on how to read the chart */}
          <CardEyebrow>Last 7 days</CardEyebrow>
          <p className="mt-1.5 mb-6 text-xs text-steel-500 dark:text-steel-400">
            Each bar is a day&rsquo;s focus total — today is highlighted.
          </p>

          {/* Chart area with y-axis labels */}
          <div className="flex gap-3 mb-2">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between text-[10px] text-steel-400 font-mono tabular-nums w-10 text-right py-1">
              <span>{formatTime(heatmap.maxMins)}</span>
              <span>{formatTime(Math.round(heatmap.maxMins / 2))}</span>
              <span>0m</span>
            </div>

            {/* Bars area */}
            <div className="flex-1 relative">
              {/* Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-dashed border-lavender-200 dark:border-lavender-800" />
                <div className="border-t border-dashed border-lavender-200 dark:border-lavender-800" />
                <div className="border-t-2 border-baltic-300 dark:border-baltic-700" />
              </div>

              {/* Bars */}
              <div className="relative flex items-end justify-between gap-2 h-32 px-1">
                {heatmap.days.map((day, idx) => {
                  const heightPct = (day.minutes / heatmap.maxMins) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group cursor-default"
                    >
                      {/* Always-visible value above bar */}
                      <span
                        className={cn(
                          "text-[10px] font-bold tabular-nums mb-1 transition-colors",
                          day.minutes === 0
                            ? "text-steel-300 dark:text-steel-600"
                            : day.isToday
                            ? "text-baltic-700 dark:text-baltic-200"
                            : "text-steel-500 dark:text-steel-400"
                        )}
                      >
                        {day.minutes === 0 ? "—" : formatTime(day.minutes)}
                      </span>

                      {/* The bar itself */}
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-[height,background-color] duration-500 relative",
                          day.isToday
                            ? "bg-baltic-600 dark:bg-baltic-400 ring-2 ring-baltic-200 dark:ring-baltic-700/60"
                            : day.minutes > 0
                            ? "bg-baltic-300 dark:bg-baltic-700 group-hover:bg-baltic-400 dark:group-hover:bg-baltic-600"
                            : "bg-lavender-100 dark:bg-lavender-800/40"
                        )}
                        style={{
                          height:
                            day.minutes > 0
                              ? `${Math.max(heightPct, 6)}%`
                              : "3px",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex gap-3">
            <div className="w-10" />
            <div className="flex-1 flex justify-between gap-2 px-1">
              {heatmap.days.map((day, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center"
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase",
                      day.isToday
                        ? "text-baltic-700 dark:text-baltic-200"
                        : "text-steel-400"
                    )}
                  >
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] tabular-nums mt-0.5",
                      day.isToday
                        ? "text-baltic-700 dark:text-baltic-200 font-bold"
                        : "text-steel-400"
                    )}
                  >
                    {day.dayNum}
                  </span>
                  {day.isToday && (
                    <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-baltic-600 dark:text-baltic-400 bg-baltic-100 dark:bg-baltic-900/50 px-1.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats row with explainers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-7 pt-5 border-t border-lavender-100 dark:border-lavender-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-baltic-100 dark:bg-baltic-900/40 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-baltic-600 dark:text-baltic-400">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3l2 2" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-baltic-800 dark:text-baltic-100 leading-tight">
                  {weeklyStats.count}
                </p>
                <p className="text-[11px] text-steel-500 dark:text-steel-400">
                  sessions this week
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cream-100 dark:bg-cream-900/40 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-cream-600 dark:text-cream-400">
                  <path d="M8 1.5c2 2.5 4 4.5 4 7a4 4 0 1 1-8 0c0-2.5 2-4.5 4-7Z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-baltic-800 dark:text-baltic-100 leading-tight">
                  {formatTime(weeklyStats.totalMinutes)}
                </p>
                <p className="text-[11px] text-steel-500 dark:text-steel-400">
                  total time focused
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-ash-100 dark:bg-ash-900/40 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ash-600 dark:text-ash-400">
                  <path d="M2 12s2-4 6-4 6 4 6 4" />
                  <circle cx="8" cy="5" r="2" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-baltic-800 dark:text-baltic-100 leading-tight">
                  {weeklyStats.avgQuality >= 3.5
                    ? "Deep"
                    : weeklyStats.avgQuality >= 2.5
                    ? "Good"
                    : weeklyStats.avgQuality > 0
                    ? "Fair"
                    : "—"}
                </p>
                <p className="text-[11px] text-steel-500 dark:text-steel-400">
                  how focused you felt
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Entries: a plain list per day, like the dashboard's "After
            this", not a wall of cards. ── */}
      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((group, gi) => (
            <section key={group.dateKey} aria-labelledby={`journal-day-${gi}`}>
              <div className="flex items-baseline justify-between gap-4 px-1 mb-2">
                <h2 id={`journal-day-${gi}`} className="text-sm font-semibold text-baltic-700 dark:text-baltic-200">
                  {group.label}
                </h2>
                <span className="text-sm text-steel-600 dark:text-steel-400 tabular-nums">
                  {group.sessions.length} {group.sessions.length === 1 ? "session" : "sessions"} ·{" "}
                  {formatTime(group.totalMinutes)}
                </span>
              </div>
              <ul className="divide-y divide-lavender-200/70 dark:divide-lavender-800/60 border-y border-lavender-200/70 dark:border-lavender-800/60">
                {group.sessions.map((session) => (
                  <EntryRow key={session.id} session={session} subject={resolveSubject(session.subject)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <Link
          href="/focus"
          className="press inline-flex items-center gap-2 rounded-full border border-lavender-200 bg-white px-4 py-2 text-sm font-medium text-baltic-700 hover:bg-lavender-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500 dark:border-lavender-700 dark:bg-lavender-900 dark:text-baltic-200"
        >
          Start a focus session
        </Link>
      )}
    </div>
  );
}

/* One logged session: when, how long, what it was for, and how it felt.
   The subject's dot leads the row, as in the dashboard's lists. */
function EntryRow({
  session,
  subject,
}: {
  session: FocusSession;
  subject: { label: string; color: string };
}) {
  const time = new Date(session.completedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const task = session.task?.trim();
  const note = session.reflection?.note?.trim();
  return (
    <li className="flex items-start gap-3 px-1 py-3.5">
      <span className="w-[4.5rem] flex-shrink-0 text-sm tabular-nums text-steel-600 dark:text-steel-400">{time}</span>
      <span
        aria-hidden
        className="mt-[7px] w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: subject.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2 min-w-0 text-[15px] text-baltic-800 dark:text-baltic-100">
          <span className="font-semibold tabular-nums flex-shrink-0">{formatTime(session.duration)}</span>
          {/* What it was for; with no task noted, the subject is the title. */}
          <span title={task || subject.label} className="truncate">
            {task || subject.label}
          </span>
        </p>
        {(task || session.reflection) && (
          // A div: the quality mark inside it is a div of its own.
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-steel-600 dark:text-steel-400">
            {task && <span>{subject.label}</span>}
            {task && session.reflection && (
              <span aria-hidden className="text-steel-300 dark:text-steel-600">·</span>
            )}
            {session.reflection && <QualityIndicator quality={session.reflection.quality} size={14} showLabel />}
          </div>
        )}
        {note && (
          <p className="mt-1.5 text-sm leading-relaxed text-baltic-700 dark:text-baltic-200">
            &ldquo;{note}&rdquo;
          </p>
        )}
      </div>
    </li>
  );
}
