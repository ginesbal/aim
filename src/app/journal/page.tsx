"use client";

import { useMemo } from "react";
import { useFocus, useSubjects } from "@/lib/contexts";
import { formatTime, getFormattedDate, getWeekday } from "@/lib/utils";
import QualityIndicator from "@/components/ui/QualityIndicator";

const CARD_COLORS = [
  "bg-lavender-50 dark:bg-lavender-900/30",
  "bg-cream-50 dark:bg-cream-900/30",
  "bg-baltic-50 dark:bg-baltic-900/20",
  "bg-ash-50 dark:bg-ash-900/20",
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
      else if (d.toDateString() === yesterday.toDateString())
        label = "Yesterday";
      else
        label = d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      groups.push({ label, dateKey, sessions: items });
    }

    return groups;
  }, [sorted]);

  // Weekly summary stats
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
      avgQuality: withReflection.length > 0
        ? withReflection.reduce((sum, s) => {
            return sum + s.reflection!.quality;
          }, 0) / withReflection.length
        : 0,
    };
  }, [sessions]);

  function resolveSubject(key: string) {
    const sub = getSubject(key);
    return { label: sub?.label || key, color: sub?.color || "#60729f" };
  }

  return (
    <div className="relative">
      {/* Decorative blob */}
      <div className="absolute -top-10 -right-16 w-44 h-44 blob-1 bg-cream-200/20 dark:bg-cream-700/10 float-slow pointer-events-none" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="inline-block px-3 py-1 rounded-full bg-lavender-100 dark:bg-lavender-800/40 text-xs font-semibold text-steel-500 dark:text-steel-400 mb-3">
            {getWeekday()}
          </p>
          <h1 className="text-display text-baltic-800 dark:text-baltic-100 mt-0.5">
            {getFormattedDate()}
          </h1>
          <p className="text-sm text-steel-400 mt-1">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* Weekly summary card */}
        {sessions.length > 0 && (
          <div className="card-baltic rounded-2xl p-5 mb-8 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-baltic-200/30 dark:bg-baltic-700/20" />
            <p className="text-xs font-semibold text-baltic-500 dark:text-baltic-400 uppercase tracking-wider mb-3">
              This week
            </p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">{weeklyStats.count}</p>
                <p className="text-xs text-baltic-400">sessions</p>
              </div>
              <div className="w-px h-10 bg-baltic-200/60 dark:bg-baltic-700/40" />
              <div>
                <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">{formatTime(weeklyStats.totalMinutes)}</p>
                <p className="text-xs text-baltic-400">total focus</p>
              </div>
              <div className="w-px h-10 bg-baltic-200/60 dark:bg-baltic-700/40" />
              <div>
                <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">
                  {weeklyStats.avgQuality >= 3.5 ? "Deep" : weeklyStats.avgQuality >= 2.5 ? "Good" : weeklyStats.avgQuality > 0 ? "Fair" : "—"}
                </p>
                <p className="text-xs text-baltic-400">avg quality</p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline entries */}
        {grouped.length > 0 ? (
          <div className="space-y-8">
            {grouped.map((group) => (
              <div key={group.dateKey}>
                {/* Date heading */}
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xs font-semibold text-baltic-600 dark:text-baltic-400 uppercase tracking-wider whitespace-nowrap">
                    {group.label}
                  </h3>
                  <div className="flex-1 h-px bg-lavender-200 dark:bg-lavender-700" />
                </div>

                {/* Sessions for this day */}
                <div className="relative pl-6">
                  {/* Timeline line */}
                  <div className="absolute left-[5px] top-3 bottom-3 w-px bg-lavender-200 dark:bg-lavender-700" />

                  <div className="space-y-3">
                    {group.sessions.map((session, idx) => {
                      const sub = resolveSubject(session.subject);
                      const time = new Date(
                        session.completedAt
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                      const colorClass = CARD_COLORS[idx % CARD_COLORS.length];

                      return (
                        <div
                          key={session.id}
                          className="relative"
                        >
                          {/* Timeline dot */}
                          <div
                            className="absolute -left-6 top-4 w-3 h-3 rounded-full border-2 border-white dark:border-baltic-950"
                            style={{ backgroundColor: sub.color }}
                          />

                          {/* Session card */}
                          <div className={`rounded-2xl p-4 ${colorClass}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-baltic-800 dark:text-baltic-100">
                                  {sub.label}
                                </span>
                                {session.reflection && (
                                  <QualityIndicator
                                    quality={session.reflection.quality}
                                    size={14}
                                    showLabel
                                  />
                                )}
                              </div>
                              <span className="text-xs text-steel-400">
                                {time}
                              </span>
                            </div>
                            <p className="text-lg font-bold text-baltic-700 dark:text-baltic-200">
                              {formatTime(session.duration)}
                            </p>

                            {session.reflection?.note && (
                              <p className="text-xs text-steel-400 mt-1.5 italic leading-relaxed">
                                &ldquo;{session.reflection.note}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-lavender-900 shadow-sm py-16 text-center">
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-lavender-200/60 dark:bg-lavender-700/30" />
              <div className="w-3 h-3 rounded-full bg-cream-200/60 dark:bg-cream-700/30 mt-2" />
              <div className="w-4 h-4 rounded-full bg-baltic-200/60 dark:bg-baltic-700/30 mt-0.5" />
            </div>
            <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">No sessions recorded yet</p>
            <p className="text-xs text-steel-400 mt-1">
              Complete a focus session to start building your journal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
