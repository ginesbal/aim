"use client";

import { useMemo } from "react";
import { useFocus, useSubjects } from "@/lib/contexts";
import { QUALITY_LEVELS, type FocusQuality } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import QualityIndicator from "@/components/ui/QualityIndicator";

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

  function resolveSubject(key: string) {
    const sub = getSubject(key);
    return { label: sub?.label || key, color: sub?.color || "#60729f" };
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">
          Journal
        </h1>
        <p className="text-sm text-steel-400 mt-1">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {/* Entries */}
      {grouped.length > 0 ? (
        <Card padding="lg" className="journal-ruled">
          <div className="space-y-6">
            {grouped.map((group, gi) => (
              <div key={group.dateKey}>
                {/* Date heading */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-baltic-600 dark:text-baltic-400 uppercase tracking-wider whitespace-nowrap">
                    {group.label}
                  </h3>
                  <div className="flex-1 h-px bg-lavender-200 dark:bg-lavender-700" />
                </div>

                {/* Sessions for this day */}
                <div className="space-y-3">
                  {group.sessions.map((session) => {
                    const sub = resolveSubject(session.subject);
                    const time = new Date(
                      session.completedAt
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={session.id}
                        className="flex items-start gap-3 group"
                      >
                        {/* Subject dot */}
                        <div
                          className="w-2 h-2 rounded-full mt-[7px] shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />

                        {/* Entry content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-baltic-800 dark:text-baltic-100">
                              {sub.label}
                            </span>
                            <span className="text-xs text-steel-400">
                              {formatTime(session.duration)}
                            </span>
                            <span className="text-xs text-steel-400">
                              {time}
                            </span>
                            {session.reflection && (
                              <QualityIndicator
                                quality={session.reflection.quality}
                                size={14}
                                showLabel
                              />
                            )}
                          </div>

                          {session.reflection?.note && (
                            <p className="text-xs text-steel-400 mt-1 italic leading-relaxed">
                              &ldquo;{session.reflection.note}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Separator between day groups */}
                {gi < grouped.length - 1 && (
                  <div className="mt-6" />
                )}
              </div>
            ))}
          </div>
        </Card>
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
    </div>
  );
}
