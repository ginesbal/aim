"use client";

import { useMemo } from "react";
import { useFocus, useSubjects } from "@/lib/contexts";
import { formatTime, getFormattedDate, getWeekday, cn } from "@/lib/utils";
import QualityIndicator from "@/components/ui/QualityIndicator";

// Subtle rotations for the "polaroid" cards — deterministic by index
const ROTATIONS = ["-rotate-1", "rotate-0", "rotate-1", "-rotate-[0.5deg]", "rotate-[0.5deg]"];
const TAPE_COLORS = [
  "bg-baltic-300/60 dark:bg-baltic-600/50",
  "bg-cream-300/70 dark:bg-cream-600/50",
  "bg-ash-300/60 dark:bg-ash-600/50",
  "bg-lavender-300/70 dark:bg-lavender-600/50",
];

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
    <div className="relative space-y-8">
      {/* ─── SECTION 1: Header ─── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="inline-block px-3 py-1 rounded-full bg-lavender-100 dark:bg-lavender-800/60 text-xs font-semibold text-steel-500 dark:text-steel-300 mb-3">
            {getWeekday()}
          </p>
          <h1 className="text-display text-baltic-800 dark:text-baltic-100">
            Journal
          </h1>
          <p className="text-sm text-steel-500 dark:text-steel-400 mt-1">
            {getFormattedDate()} · {sessions.length} session
            {sessions.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      {/* ─── SECTION 2: Weekly rhythm (heatmap) + summary ─── */}
      {sessions.length > 0 && (
        <section className="rounded-3xl border-2 border-lavender-200 dark:border-lavender-800 bg-white dark:bg-lavender-900 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1.5 h-6 rounded-full bg-baltic-500" />
            <h2 className="text-lg font-bold text-baltic-800 dark:text-baltic-100">
              This week&apos;s rhythm
            </h2>
          </div>

          {/* Heatmap bars */}
          <div className="flex items-end justify-between gap-2 h-28 mb-5 px-1">
            {heatmap.days.map((day, idx) => {
              const heightPct = (day.minutes / heatmap.maxMins) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1.5 group"
                >
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-lg transition-all duration-500 relative",
                        day.isToday
                          ? "bg-baltic-500 dark:bg-baltic-400"
                          : day.minutes > 0
                          ? "bg-baltic-300 dark:bg-baltic-700"
                          : "bg-lavender-100 dark:bg-lavender-800/60"
                      )}
                      style={{
                        height: day.minutes > 0 ? `${Math.max(heightPct, 8)}%` : "4px",
                      }}
                      title={`${day.minutes} min`}
                    >
                      {day.minutes > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-baltic-600 dark:text-baltic-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatTime(day.minutes)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      day.isToday
                        ? "text-baltic-700 dark:text-baltic-200"
                        : "text-steel-400"
                    )}
                  >
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] tabular-nums",
                      day.isToday
                        ? "text-baltic-700 dark:text-baltic-200 font-semibold"
                        : "text-steel-400"
                    )}
                  >
                    {day.dayNum}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-lavender-100 dark:border-lavender-800">
            <div>
              <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">
                {weeklyStats.count}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-steel-400">
                Sessions
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">
                {formatTime(weeklyStats.totalMinutes)}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-steel-400">
                Total focus
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">
                {weeklyStats.avgQuality >= 3.5
                  ? "Deep"
                  : weeklyStats.avgQuality >= 2.5
                  ? "Good"
                  : weeklyStats.avgQuality > 0
                  ? "Fair"
                  : "—"}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-steel-400">
                Avg quality
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── SECTION 3: Journal entries — polaroid style ─── */}
      {grouped.length > 0 ? (
        <section className="space-y-10">
          <div className="flex items-center gap-3 px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-baltic-600 dark:text-baltic-300">
              Entries
            </h2>
            <div className="flex-1 h-px bg-lavender-200 dark:bg-lavender-800" />
          </div>

          {grouped.map((group) => (
            <div key={group.dateKey} className="relative">
              {/* Date banner */}
              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-baltic-100 dark:bg-baltic-900/50 border border-baltic-200 dark:border-baltic-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-baltic-500" />
                  <span className="text-xs font-bold text-baltic-700 dark:text-baltic-200 uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
                <span className="text-xs text-steel-400 font-medium">
                  {group.sessions.length} session
                  {group.sessions.length !== 1 ? "s" : ""} ·{" "}
                  {formatTime(group.totalMinutes)}
                </span>
                <div className="flex-1 h-px border-t border-dashed border-lavender-200 dark:border-lavender-800" />
              </div>

              {/* Polaroid grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-2">
                {group.sessions.map((session, idx) => {
                  const sub = resolveSubject(session.subject);
                  const time = new Date(session.completedAt).toLocaleTimeString(
                    "en-US",
                    { hour: "numeric", minute: "2-digit" }
                  );
                  const rotation = ROTATIONS[idx % ROTATIONS.length];
                  const tapeColor = TAPE_COLORS[idx % TAPE_COLORS.length];

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "relative rounded-xl bg-white dark:bg-lavender-900 border-2 border-lavender-200 dark:border-lavender-800 p-5 pt-7 shadow-md hover:shadow-lg hover:rotate-0 hover:z-10 transition-all duration-300",
                        rotation
                      )}
                    >
                      {/* Tape strip */}
                      <div
                        className={cn(
                          "absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-sm shadow-sm",
                          tapeColor
                        )}
                        style={{
                          clipPath:
                            "polygon(5% 0, 95% 0, 100% 100%, 0 100%)",
                        }}
                      />

                      {/* Subject stripe */}
                      <div
                        className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-xl"
                        style={{ backgroundColor: sub.color }}
                      />

                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: sub.color }}
                            />
                            <span className="text-xs font-bold text-baltic-700 dark:text-baltic-200 uppercase tracking-wider truncate">
                              {sub.label}
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-baltic-800 dark:text-baltic-100 leading-none tracking-tight">
                            {formatTime(session.duration)}
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-steel-400 tabular-nums whitespace-nowrap bg-lavender-50 dark:bg-lavender-800/40 px-2 py-0.5 rounded">
                          {time}
                        </span>
                      </div>

                      {/* Quality */}
                      {session.reflection && (
                        <div className="flex items-center gap-2 mb-2">
                          <QualityIndicator
                            quality={session.reflection.quality}
                            size={14}
                            showLabel
                          />
                        </div>
                      )}

                      {/* Note */}
                      {session.reflection?.note ? (
                        <div className="mt-3 pt-3 border-t border-dashed border-lavender-200 dark:border-lavender-700">
                          <p className="text-sm text-steel-600 dark:text-steel-300 italic leading-relaxed">
                            &ldquo;{session.reflection.note}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-dashed border-lavender-200 dark:border-lavender-700">
                          <p className="text-[11px] text-steel-400 italic">
                            No reflection recorded
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border-2 border-dashed border-lavender-200 dark:border-lavender-800 bg-white dark:bg-lavender-900 py-16 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-lavender-200/60 dark:bg-lavender-700/30" />
            <div className="w-3 h-3 rounded-full bg-cream-200/60 dark:bg-cream-700/30 mt-2" />
            <div className="w-4 h-4 rounded-full bg-baltic-200/60 dark:bg-baltic-700/30 mt-0.5" />
          </div>
          <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
            No sessions recorded yet
          </p>
          <p className="text-xs text-steel-400 mt-1">
            Complete a focus session to start building your journal.
          </p>
        </section>
      )}
    </div>
  );
}
