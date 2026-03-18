"use client";

import { useMemo } from "react";
import { useFocus } from "@/lib/contexts";
import { SUBJECTS, QUALITY_LEVELS, type SubjectKey, type FocusQuality } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import QualityIndicator from "@/components/ui/QualityIndicator";

export default function JournalPage() {
  const { sessions } = useFocus();

  // Sort sessions newest first
  const sorted = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    [sessions]
  );

  // Group by date label
  const grouped = useMemo(() => {
    const groups: { label: string; dateKey: string; sessions: typeof sorted }[] = [];
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const map = new Map<string, typeof sorted>();
    for (const s of sorted) {
      const d = new Date(s.completedAt);
      let label: string;
      if (d.toDateString() === now.toDateString()) {
        label = "Today";
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = "Yesterday";
      } else {
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }

    for (const [dateKey, items] of Array.from(map.entries())) {
      const d = new Date(dateKey);
      let label: string;
      if (d.toDateString() === now.toDateString()) label = "Today";
      else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
      else label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      groups.push({ label, dateKey, sessions: items });
    }

    return groups;
  }, [sorted]);

  // Weekly stats
  const weekStats = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekSessions = sessions.filter((s) => new Date(s.completedAt) >= weekStart);
    const totalMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const withReflection = weekSessions.filter((s) => s.reflection);
    const avgQuality = withReflection.length > 0
      ? withReflection.reduce((sum, s) => sum + (s.reflection?.quality || 0), 0) / withReflection.length
      : 0;

    // Most studied subject
    const subjectMap: Record<string, number> = {};
    weekSessions.forEach((s) => {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.duration;
    });
    const topSubject = Object.entries(subjectMap).sort(([, a], [, b]) => b - a)[0];

    return {
      totalMinutes,
      sessionCount: weekSessions.length,
      avgQuality: Math.round(avgQuality) as FocusQuality,
      topSubject: topSubject ? topSubject[0] : null,
    };
  }, [sessions]);

  // Insights computed from all session data
  const insights = useMemo(() => {
    if (sessions.length < 2) return [];

    const result: { label: string; value: string }[] = [];

    // Best focus subject
    const subjectQuality: Record<string, { total: number; count: number }> = {};
    sessions.forEach((s) => {
      if (!s.reflection) return;
      if (!subjectQuality[s.subject]) subjectQuality[s.subject] = { total: 0, count: 0 };
      subjectQuality[s.subject].total += s.reflection.quality;
      subjectQuality[s.subject].count++;
    });
    const bestSubject = Object.entries(subjectQuality)
      .filter(([, v]) => v.count >= 2)
      .sort(([, a], [, b]) => b.total / b.count - a.total / a.count)[0];
    if (bestSubject) {
      const sub = SUBJECTS[bestSubject[0] as SubjectKey];
      result.push({ label: "Best focus subject", value: sub?.label || bestSubject[0] });
    }

    // Average session length
    const avgDuration = Math.round(sessions.reduce((s, x) => s + x.duration, 0) / sessions.length);
    result.push({ label: "Average session", value: formatTime(avgDuration) });

    // Most active day of week
    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    sessions.forEach((s) => {
      dayCount[new Date(s.completedAt).getDay()]++;
    });
    const maxDay = dayCount.indexOf(Math.max(...dayCount));
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    result.push({ label: "Most active day", value: dayNames[maxDay] });

    // Deep focus rate
    const withReflection = sessions.filter((s) => s.reflection);
    if (withReflection.length > 0) {
      const deepCount = withReflection.filter((s) => s.reflection!.quality === 4).length;
      const rate = Math.round((deepCount / withReflection.length) * 100);
      result.push({ label: "Deep focus rate", value: `${rate}%` });
    }

    return result;
  }, [sessions]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Journal</h1>
        <p className="text-body text-steel-500 dark:text-steel-400 mt-1">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {/* Weekly summary */}
      <Card padding="sm">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-caption">This week</p>
            <p className="text-xl font-semibold text-baltic-800 dark:text-baltic-100 tracking-tight mt-0.5">
              {formatTime(weekStats.totalMinutes)}
            </p>
          </div>
          <div className="h-8 w-px bg-lavender-200 dark:bg-lavender-700" />
          <div>
            <p className="text-caption">Sessions</p>
            <p className="text-xl font-semibold text-baltic-800 dark:text-baltic-100 tracking-tight mt-0.5">
              {weekStats.sessionCount}
            </p>
          </div>
          <div className="h-8 w-px bg-lavender-200 dark:bg-lavender-700" />
          <div>
            <p className="text-caption">Avg. focus</p>
            <div className="mt-1.5">
              {weekStats.avgQuality > 0 ? (
                <QualityIndicator quality={weekStats.avgQuality} size={20} showLabel />
              ) : (
                <p className="text-xs text-steel-400">No data yet</p>
              )}
            </div>
          </div>
          <div className="h-8 w-px bg-lavender-200 dark:bg-lavender-700" />
          <div>
            <p className="text-caption">Top subject</p>
            {weekStats.topSubject ? (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SUBJECTS[weekStats.topSubject as SubjectKey]?.color || "#60729f" }}
                />
                <span className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                  {SUBJECTS[weekStats.topSubject as SubjectKey]?.label || weekStats.topSubject}
                </span>
              </div>
            ) : (
              <p className="text-xs text-steel-400 mt-1.5">No data yet</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Timeline — left 2 cols */}
        <div className="col-span-2">
          {grouped.length > 0 ? (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.dateKey}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-baltic-700 dark:text-baltic-300">
                      {group.label}
                    </h3>
                    <div className="flex-1 h-px bg-lavender-100 dark:bg-lavender-800" />
                  </div>

                  {/* Session entries with timeline line */}
                  <div className="relative pl-6">
                    {/* Vertical connecting line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-lavender-200 dark:bg-lavender-700" />

                    <div className="space-y-3">
                      {group.sessions.map((session) => {
                        const sub = SUBJECTS[session.subject as SubjectKey];
                        return (
                          <div key={session.id} className="relative">
                            {/* Timeline dot */}
                            <div
                              className="absolute -left-6 top-3 w-[9px] h-[9px] rounded-full border-2 border-white dark:border-lavender-950"
                              style={{ backgroundColor: sub?.color || "#60729f" }}
                            />

                            <Card padding="sm" className="ml-1">
                              <div className="flex items-start gap-3">
                                {/* Subject color bar */}
                                <div
                                  className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0"
                                  style={{ backgroundColor: sub?.color || "#60729f" }}
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-baltic-800 dark:text-baltic-100">
                                      {sub?.label || session.subject}
                                    </span>
                                    <span className="text-xs text-steel-400">
                                      {formatTime(session.duration)}
                                    </span>
                                    <span className="text-xs text-steel-400">
                                      {new Date(session.completedAt).toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>

                                  {session.reflection && (
                                    <div className="mt-1.5 flex items-start gap-2">
                                      <QualityIndicator
                                        quality={session.reflection.quality}
                                        size={14}
                                        showLabel
                                      />
                                    </div>
                                  )}

                                  {session.reflection?.note && (
                                    <p className="text-xs text-steel-500 dark:text-steel-400 mt-1.5 italic leading-relaxed">
                                      &ldquo;{session.reflection.note}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <p className="text-sm text-steel-400">No sessions recorded yet.</p>
                <p className="text-xs text-steel-400 mt-1">
                  Complete a focus session to start building your journal.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Insights — right column */}
        <div className="space-y-6">
          {insights.length > 0 && (
            <Card>
              <h3 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Insights</h3>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.label}>
                    <p className="text-caption">{insight.label}</p>
                    <p className="text-sm font-semibold text-baltic-700 dark:text-baltic-300 mt-0.5">
                      {insight.value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="bg-baltic-50 dark:bg-baltic-900/30 border-baltic-100 dark:border-baltic-800">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-baltic-100 dark:bg-baltic-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#60729f" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 3h8M2 6h8M2 9h5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-baltic-700 dark:text-baltic-300 mb-1">
                  About your journal
                </p>
                <p className="text-xs text-steel-500 dark:text-steel-400 leading-relaxed">
                  Your reflections build a picture of how you study best.
                  Over time, patterns emerge — which subjects you focus deepest on,
                  what time of day works, and what conditions lead to your
                  most productive sessions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
