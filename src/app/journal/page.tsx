"use client";

import { useMemo } from "react";
import { useFocus } from "@/lib/contexts";
import { SUBJECTS, QUALITY_LEVELS, type SubjectKey, type FocusQuality } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import QualityIndicator from "@/components/ui/QualityIndicator";

const CARD_COLORS: Array<"lavender" | "cream" | "ash" | "baltic"> = ["lavender", "cream", "ash", "baltic"];

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

  // Insights
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
      result.push({ label: "Best focus subject", value: sub?.label || bestSubject[0] });
    }

    const avgDuration = Math.round(sessions.reduce((s, x) => s + x.duration, 0) / sessions.length);
    result.push({ label: "Average session", value: formatTime(avgDuration) });

    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    sessions.forEach((s) => {
      dayCount[new Date(s.completedAt).getDay()]++;
    });
    const maxDay = dayCount.indexOf(Math.max(...dayCount));
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    result.push({ label: "Most active day", value: dayNames[maxDay] });

    const withReflection = sessions.filter((s) => s.reflection);
    if (withReflection.length > 0) {
      const deepCount = withReflection.filter((s) => s.reflection!.quality === 4).length;
      const rate = Math.round((deepCount / withReflection.length) * 100);
      result.push({ label: "Deep focus rate", value: `${rate}%` });
    }

    return result;
  }, [sessions]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Journal</h1>
        <p className="text-body text-steel-500 dark:text-steel-400 mt-1">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {/* Weekly summary — colored card */}
      <Card color="baltic" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs font-semibold text-baltic-600/70 dark:text-baltic-400/70 uppercase tracking-wider">This week</p>
              <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200 tracking-tight mt-0.5">
                {formatTime(weekStats.totalMinutes)}
              </p>
            </div>
            <div className="h-10 w-px bg-baltic-200/40 dark:bg-baltic-700/40" />
            <div>
              <p className="text-xs font-semibold text-baltic-600/70 dark:text-baltic-400/70 uppercase tracking-wider">Sessions</p>
              <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200 tracking-tight mt-0.5">
                {weekStats.sessionCount}
              </p>
            </div>
            <div className="h-10 w-px bg-baltic-200/40 dark:bg-baltic-700/40" />
            <div>
              <p className="text-xs font-semibold text-baltic-600/70 dark:text-baltic-400/70 uppercase tracking-wider">Avg. focus</p>
              <div className="mt-1.5">
                {weekStats.avgQuality > 0 ? (
                  <QualityIndicator quality={weekStats.avgQuality} size={20} showLabel />
                ) : (
                  <p className="text-xs text-steel-400">No data yet</p>
                )}
              </div>
            </div>
          </div>
          {weekStats.topSubject && (
            <div className="text-right">
              <p className="text-xs font-semibold text-baltic-600/70 dark:text-baltic-400/70 uppercase tracking-wider">Top subject</p>
              <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SUBJECTS[weekStats.topSubject as SubjectKey]?.color || "#60729f" }}
                />
                <span className="text-sm font-bold text-baltic-700 dark:text-baltic-300">
                  {SUBJECTS[weekStats.topSubject as SubjectKey]?.label || weekStats.topSubject}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Timeline — single column */}
      {grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-bold text-baltic-700 dark:text-baltic-300">
                  {group.label}
                </h3>
                <div className="flex-1 h-px bg-lavender-200/60 dark:bg-lavender-800/60" />
              </div>

              {/* Session entries with timeline */}
              <div className="relative pl-7">
                {/* Vertical connecting line */}
                <div className="absolute left-[9px] top-3 bottom-3 w-px bg-lavender-200 dark:bg-lavender-700" />

                <div className="space-y-3">
                  {group.sessions.map((session, idx) => {
                    const sub = SUBJECTS[session.subject as SubjectKey];
                    const cardColor = CARD_COLORS[idx % CARD_COLORS.length];
                    return (
                      <div key={session.id} className="relative">
                        {/* Timeline dot — larger */}
                        <div
                          className="absolute -left-7 top-4 w-[11px] h-[11px] rounded-full border-2 border-white dark:border-lavender-950"
                          style={{ backgroundColor: sub?.color || "#60729f" }}
                        />

                        <Card color={cardColor} padding="md" className="ml-1">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-baltic-800 dark:text-baltic-100">
                                  {sub?.label || session.subject}
                                </span>
                                <span className="text-xs text-steel-400 font-medium">
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
                                <div className="mt-2 flex items-start gap-2">
                                  <QualityIndicator
                                    quality={session.reflection.quality}
                                    size={14}
                                    showLabel
                                  />
                                </div>
                              )}

                              {session.reflection?.note && (
                                <p className="text-xs text-steel-500 dark:text-steel-400 mt-2 italic leading-relaxed">
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
        <Card padding="lg">
          <div className="py-12 text-center">
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-lavender-200/60 animate-float" />
              <div className="w-4 h-4 rounded-full bg-baltic-200/60 animate-float-delay" />
              <div className="w-4 h-4 rounded-full bg-cream-200/60 animate-float-slow" />
            </div>
            <p className="text-sm text-steel-400">No sessions recorded yet.</p>
            <p className="text-xs text-steel-400 mt-1">
              Complete a focus session to start building your journal.
            </p>
          </div>
        </Card>
      )}

      {/* Insights — horizontal row at bottom */}
      {insights.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {insights.map((insight, idx) => {
            const colors: Array<"cream" | "ash" | "lavender" | "baltic"> = ["cream", "ash", "lavender", "baltic"];
            return (
              <Card key={insight.label} color={colors[idx % colors.length]} padding="sm">
                <p className="text-[10px] font-semibold text-steel-500 uppercase tracking-wider">{insight.label}</p>
                <p className="text-base font-bold text-baltic-700 dark:text-baltic-300 mt-1">
                  {insight.value}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* About section */}
      <Card color="baltic" padding="md">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-baltic-200/60 dark:bg-baltic-700/40 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#60729f" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 3h8M2 6h8M2 9h5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-baltic-700 dark:text-baltic-300 mb-1">
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
  );
}
