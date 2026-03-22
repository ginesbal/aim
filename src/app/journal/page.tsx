"use client";

import { useMemo } from "react";
import { useFocus } from "@/lib/contexts";
import { SUBJECTS, type SubjectKey, type FocusQuality } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import QualityIndicator from "@/components/ui/QualityIndicator";

export default function JournalPage() {
  const { sessions } = useFocus();

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    [sessions]
  );

  const grouped = useMemo(() => {
    const groups: { label: string; dateKey: string; sessions: typeof sorted }[] = [];
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
      else label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      groups.push({ label, dateKey, sessions: items });
    }

    return groups;
  }, [sorted]);

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

  const insights = useMemo(() => {
    if (sessions.length < 2) return [];

    const result: { label: string; value: string }[] = [];

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
      result.push({ label: "Best focus", value: sub?.label || bestSubject[0] });
    }

    const avgDuration = Math.round(sessions.reduce((s, x) => s + x.duration, 0) / sessions.length);
    result.push({ label: "Avg. session", value: formatTime(avgDuration) });

    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    sessions.forEach((s) => {
      dayCount[new Date(s.completedAt).getDay()]++;
    });
    const maxDay = dayCount.indexOf(Math.max(...dayCount));
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    result.push({ label: "Most active", value: dayNames[maxDay] });

    const withReflection = sessions.filter((s) => s.reflection);
    if (withReflection.length > 0) {
      const deepCount = withReflection.filter((s) => s.reflection!.quality === 4).length;
      const rate = Math.round((deepCount / withReflection.length) * 100);
      result.push({ label: "Deep focus", value: `${rate}%` });
    }

    return result;
  }, [sessions]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Journal</h1>
        <p className="text-sm text-steel-400 mt-1">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {/* Weekly summary */}
      <Card padding="md">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-label">This week</p>
            <p className="text-xl font-semibold text-baltic-700 dark:text-baltic-200 mt-0.5">
              {formatTime(weekStats.totalMinutes)}
            </p>
          </div>
          <div className="h-8 w-px bg-lavender-200 dark:bg-lavender-700" />
          <div>
            <p className="text-label">Sessions</p>
            <p className="text-xl font-semibold text-baltic-700 dark:text-baltic-200 mt-0.5">
              {weekStats.sessionCount}
            </p>
          </div>
          <div className="h-8 w-px bg-lavender-200 dark:bg-lavender-700" />
          <div>
            <p className="text-label">Avg. focus</p>
            <div className="mt-1">
              {weekStats.avgQuality > 0 ? (
                <QualityIndicator quality={weekStats.avgQuality} size={18} showLabel />
              ) : (
                <p className="text-xs text-steel-400">—</p>
              )}
            </div>
          </div>
          {weekStats.topSubject && (
            <>
              <div className="h-8 w-px bg-lavender-200 dark:bg-lavender-700" />
              <div>
                <p className="text-label">Top subject</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: SUBJECTS[weekStats.topSubject as SubjectKey]?.color || "#60729f" }}
                  />
                  <span className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                    {SUBJECTS[weekStats.topSubject as SubjectKey]?.label || weekStats.topSubject}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Timeline */}
      {grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold text-baltic-600 dark:text-baltic-400 uppercase tracking-wider">
                  {group.label}
                </h3>
                <div className="flex-1 h-px bg-lavender-100 dark:bg-lavender-800" />
              </div>

              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-lavender-200 dark:bg-lavender-700" />

                <div className="space-y-2">
                  {group.sessions.map((session) => {
                    const sub = SUBJECTS[session.subject as SubjectKey];
                    return (
                      <div key={session.id} className="relative">
                        {/* Timeline dot */}
                        <div
                          className="absolute -left-6 top-3.5 w-[9px] h-[9px] rounded-full border-2 border-white dark:border-baltic-950"
                          style={{ backgroundColor: sub?.color || "#60729f" }}
                        />

                        <Card padding="sm" className="ml-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-baltic-800 dark:text-baltic-100">
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
                            {session.reflection && (
                              <QualityIndicator quality={session.reflection.quality} size={14} showLabel />
                            )}
                          </div>
                          {session.reflection?.note && (
                            <p className="text-xs text-steel-400 mt-1.5 italic">
                              &ldquo;{session.reflection.note}&rdquo;
                            </p>
                          )}
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
        <Card padding="md">
          <div className="py-8 text-center">
            <p className="text-sm text-steel-400">No sessions recorded yet.</p>
            <p className="text-xs text-steel-400 mt-1">
              Complete a focus session to start building your journal.
            </p>
          </div>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {insights.map((insight) => (
            <Card key={insight.label} padding="sm">
              <p className="text-[10px] font-semibold text-steel-400 uppercase tracking-wider">{insight.label}</p>
              <p className="text-sm font-semibold text-baltic-700 dark:text-baltic-300 mt-0.5">
                {insight.value}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
