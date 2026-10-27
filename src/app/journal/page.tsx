"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useFocus, useSubjects, usePreferences } from "@/lib/contexts";
import { formatTime } from "@/lib/utils";
import QualityIndicator from "@/components/ui/QualityIndicator";
import { SENTENCE, Connect } from "@/components/ui/Sentence";
import WeekOfAs, { lastSevenDays, localDayKey } from "@/components/ui/WeekOfAs";
import type { FocusQuality, FocusSession } from "@/lib/types";

// How a week's average rating reads in a sentence ("and felt focused").
const FELT: Record<FocusQuality, string> = {
  1: "scattered",
  2: "distracted",
  3: "focused",
  4: "deeply focused",
};

export default function JournalPage() {
  const { sessions } = useFocus();
  const { getSubject } = useSubjects();
  const { dailyGoal } = usePreferences();

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

  // Arriving from a day in a week row (/journal#day-2026-10-23): the
  // entries render after the stored sessions load, too late for the
  // browser's own jump to the anchor, so jump once they're there.
  const hasEntries = grouped.length > 0;
  useEffect(() => {
    if (!hasEntries) return;
    const jump = () => {
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    jump();
    window.addEventListener("hashchange", jump);
    return () => window.removeEventListener("hashchange", jump);
  }, [hasEntries]);

  // The last seven calendar days (today and the six before it): the
  // week row's days, and the week the headline and summary describe.
  const week = useMemo(() => lastSevenDays(sessions), [sessions]);
  const weeklyStats = useMemo(() => {
    const inWeek = new Set(week.map((d) => d.key));
    const weekSessions = sessions.filter((s) => inWeek.has(localDayKey(new Date(s.completedAt))));
    const bySubject = new Map<string, number>();
    for (const s of weekSessions) bySubject.set(s.subject, (bySubject.get(s.subject) ?? 0) + s.duration);
    const top = Array.from(bySubject.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const rated = weekSessions.filter((s) => s.reflection);
    return {
      count: weekSessions.length,
      totalMinutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
      topSubject: top,
      oneSubject: bySubject.size === 1,
      daysAtGoal: week.filter((d) => d.minutes >= dailyGoal).length,
      felt: rated.length
        ? FELT[Math.round(rated.reduce((sum, s) => sum + s.reflection!.quality, 0) / rated.length) as FocusQuality]
        : undefined,
    };
  }, [sessions, week, dailyGoal]);

  function resolveSubject(key: string) {
    const sub = getSubject(key);
    return { label: sub?.label || key, color: sub?.color || "#60729f" };
  }

  // One line under the week, in the headline's voice: what the time went
  // into, how many days reached the goal, how it felt. It replaces the
  // three stat tiles, two of which repeated the headline.
  const summary: ReactNode[] = [];
  if (weeklyStats.topSubject) {
    summary.push(
      <>
        <Connect>{weeklyStats.oneSubject ? "all" : "mostly"}</Connect> {resolveSubject(weeklyStats.topSubject).label}
      </>
    );
  }
  if (weeklyStats.daysAtGoal > 0) {
    summary.push(
      <>
        <span className="whitespace-nowrap tabular-nums">
          {weeklyStats.daysAtGoal} {weeklyStats.daysAtGoal === 1 ? "day" : "days"}
        </span>{" "}
        <Connect>at your goal</Connect>
      </>
    );
  }
  if (weeklyStats.felt) {
    summary.push(
      <>
        <Connect>{summary.length ? "and felt" : "felt"}</Connect> {weeklyStats.felt}
      </>
    );
  }

  return (
    // The dashboard's column: one sentence, then the record. No desk
    // pattern, blobs, tape or tilt (critique, 2026-10-27).
    <div className="mx-auto max-w-4xl pb-4">
      <header className="mb-12">
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
        {sessions.length > 0 && (
          <div className="mt-8">
            <WeekOfAs days={week} dailyGoal={dailyGoal} dayHref={(key) => `#day-${key}`} className="-ml-1.5" />
            {summary.length > 0 && (
              <p className="mt-4 text-lg leading-snug font-semibold text-baltic-800 dark:text-baltic-100">
                {summary.map((part, i) => (
                  <span key={i}>
                    {i > 0 && ", "}
                    {part}
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
      </header>

      {/* ── Entries: a plain list per day, like the dashboard's "After
            this", not a wall of cards. ── */}
      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((group, gi) => (
            <section
              key={group.dateKey}
              id={`day-${localDayKey(new Date(group.dateKey))}`}
              aria-labelledby={`journal-day-${gi}`}
              // Clear of the fixed 64px top bar when a day in the week row
              // jumps here.
              className="scroll-mt-24"
            >
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
